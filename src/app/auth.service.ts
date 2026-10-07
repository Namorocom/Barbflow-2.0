import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  role: 'admin' | 'client' | 'barber';
  locationName?: string;
  coordinates?: { lat: number, lng: number };
  availableTimes?: string[];
  availableDays?: number[];
  workingHours?: { start: string, end: string };
  blockedDates?: string[];
  fcmToken?: string;
  isOnline?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user = signal<AppUser | null>(null);
  isReady = signal<boolean>(false);
  private platformId = inject(PLATFORM_ID);
  private isRegisteringFlag = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          if (fbUser.providerData.some(p => p.providerId === 'password') && !fbUser.emailVerified) {
            this.user.set(null);
            this.isReady.set(true);
            return;
          }
          if (!this.isRegisteringFlag) {
            await this.syncUser(fbUser);
          }
        } else {
          this.user.set(null);
        }
        this.isReady.set(true);
      });
      
      // Handle window close/unload to set offline
      window.addEventListener('beforeunload', () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Use navigator.sendBeacon or just try to update
          updateDoc(doc(db, 'users', currentUser.uid), { isOnline: false }).catch(() => { /* ignore */ });
        }
      });
    } else {
      this.isReady.set(true);
    }
  }

  async loginWithGoogle(role: 'client' | 'barber' = 'client') {
    try {
      this.isRegisteringFlag = true;
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await this.syncUser(result.user, role);
      this.isRegisteringFlag = false;
    } catch (error) {
      this.isRegisteringFlag = false;
      throw error;
    }
  }

  async registerWithEmail(email: string, pass: string, name: string, role: 'client' | 'barber' = 'client'): Promise<{ requiresVerification: boolean }> {
    try {
      this.isRegisteringFlag = true;
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await sendEmailVerification(result.user);
      await this.syncUser(result.user, role, name);
      await signOut(auth);
      this.isRegisteringFlag = false;
      return { requiresVerification: true };
    } catch (error) {
      this.isRegisteringFlag = false;
      const e = error as { code?: string };
      // Se o e-mail já estiver em uso, tenta autenticar caso o usuário já tenha criado a conta e esteja tentando entrar/ativar
      if (e?.code === 'auth/email-already-in-use') {
        try {
          const signInResult = await signInWithEmailAndPassword(auth, email, pass);
          if (!signInResult.user.emailVerified) {
            await sendEmailVerification(signInResult.user);
            await signOut(auth);
            return { requiresVerification: true };
          }
          await this.syncUser(signInResult.user, role, name);
          return { requiresVerification: false };
        } catch {
          // Se a senha for diferente, retorna o erro original de e-mail em uso sem poluir console.error
          throw error;
        }
      }
      throw error;
    }
  }

  async loginWithEmail(email: string, pass: string): Promise<{ requiresVerification: boolean }> {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    if (!result.user.emailVerified) {
      await sendEmailVerification(result.user);
      await signOut(auth);
      return { requiresVerification: true };
    }
    return { requiresVerification: false };
  }

  async resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  async saveFcmToken(token: string) {
    const currentUser = auth.currentUser;
    if (!currentUser || !token) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { fcmToken: token });
      const currentData = this.user();
      if (currentData) {
        this.user.set({ ...currentData, fcmToken: token });
      }
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  async updateProfile(
    name: string,
    avatar: string,
    locationName?: string,
    coordinates?: {lat: number, lng: number},
    availableTimes?: string[],
    availableDays?: number[],
    workingHours?: { start: string, end: string },
    blockedDates?: string[],
    phone?: string
  ) {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not authenticated');
    
    try {
      const updateData: Partial<AppUser> = { name, avatar };
      if (phone !== undefined && phone.trim().length > 0) updateData.phone = phone.trim().substring(0, 20);
      if (locationName !== undefined) updateData.locationName = locationName;
      if (coordinates !== undefined) updateData.coordinates = coordinates;
      if (availableTimes !== undefined) updateData.availableTimes = availableTimes;
      if (availableDays !== undefined) updateData.availableDays = availableDays;
      if (workingHours !== undefined) updateData.workingHours = workingHours;
      if (blockedDates !== undefined) updateData.blockedDates = blockedDates;

      await updateDoc(doc(db, 'users', currentUser.uid), updateData);
      
      const currentData = this.user();
      if (currentData?.role === 'barber') {
        await updateDoc(doc(db, 'barbers', currentUser.uid), updateData);
      }
      
      // Update local state
      if (currentData) {
        this.user.set({ ...currentData, ...updateData });
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), { isOnline: false });
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (userSnap.exists() && userSnap.data()['role'] === 'barber') {
          await updateDoc(doc(db, 'barbers', currentUser.uid), { isOnline: false });
        }
      }
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  private async syncUser(fbUser: FirebaseUser, requestedRole?: 'client' | 'barber', name?: string) {
    const userRef = doc(db, 'users', fbUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      this.user.set({ uid: fbUser.uid, ...userSnap.data() } as AppUser);
      try {
        await updateDoc(userRef, { isOnline: true });
        if (userSnap.data()['role'] === 'barber') {
          await updateDoc(doc(db, 'barbers', fbUser.uid), { isOnline: true });
        }
      } catch (e) {
        console.error('Error setting online status', e);
      }
    } else {
      const newUser: Omit<AppUser, 'uid'> = {
        name: (name || fbUser.displayName || 'Usuário').substring(0, 50),
        email: fbUser.email || 'no-email@example.com',
        avatar: fbUser.photoURL || 'https://picsum.photos/seed/user/200/200',
        role: requestedRole || 'client',
        isOnline: true
      };
      await setDoc(userRef, {
        ...newUser,
        createdAt: serverTimestamp()
      });
      
      if (newUser.role === 'barber') {
        const barberRef = doc(db, 'barbers', fbUser.uid);
        await setDoc(barberRef, {
          name: newUser.name,
          avatar: newUser.avatar,
          rating: 0,
          reviewCount: 0,
          specialty: 'Novo Barbeiro',
          isOnline: true,
          createdAt: serverTimestamp()
        });
      }
      
      this.user.set({ uid: fbUser.uid, ...newUser } as AppUser);
    }
  }
}
