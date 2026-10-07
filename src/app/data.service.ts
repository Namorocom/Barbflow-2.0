import { Injectable, signal, effect, inject, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, where, updateDoc, doc } from 'firebase/firestore';
import { Service, Barber, Appointment, AppNotification } from './data';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  services = signal<Service[]>([]);
  barbers = signal<Barber[]>([]);
  appointments = signal<Appointment[]>([]);
  notifications = signal<AppNotification[]>([]);
  userPhones = signal<Record<string, string>>({});
  
  pendingAppointments = computed(() => {
    const now = new Date();
    return this.appointments().filter(a => a.date > now && a.status === 'upcoming');
  });

  nextAppointment = computed(() => {
    const futureAppts = this.pendingAppointments();
    return futureAppts.length > 0 ? futureAppts[0] : null;
  });

  private auth = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private unsubscribeAppointments: (() => void) | null = null;
  private unsubscribeNotifications: (() => void) | null = null;
  private notifiedAppointments = new Set<string>();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.listenToServices();
      this.listenToBarbers();
      
      effect(() => {
        const user = this.auth.user();
        if (user) {
          this.listenToAppointments(user.uid, user.role);
          this.listenToNotifications(user.uid);
        } else {
          if (this.unsubscribeAppointments) {
            this.unsubscribeAppointments();
            this.unsubscribeAppointments = null;
          }
          if (this.unsubscribeNotifications) {
            this.unsubscribeNotifications();
            this.unsubscribeNotifications = null;
          }
          this.appointments.set([]);
          this.notifications.set([]);
        }
      });
    }
  }

  private listenToServices() {
    const q = query(collection(db, 'services'), orderBy('name'));
    onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
      this.services.set(data);
    }, (error) => {
      console.error('Error fetching services:', error);
    });
  }

  private listenToBarbers() {
    const q = query(collection(db, 'barbers'), orderBy('rating', 'desc'));
    onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Barber));
      this.barbers.set(data);
    }, (error) => {
      console.error('Error fetching barbers:', error);
    });
  }

  listenToAppointments(userId: string, role = 'client') {
    if (this.unsubscribeAppointments) {
      this.unsubscribeAppointments();
    }

    const field = role === 'barber' ? 'barberId' : 'userId';
    const q = query(collection(db, 'appointments'), where(field, '==', userId));
    this.unsubscribeAppointments = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          date: d['date']?.toDate() || new Date()
        } as Appointment;
      });
      
      this.appointments.set(data.sort((a, b) => a.date.getTime() - b.date.getTime()));

      if (role === 'barber') {
        this.loadClientPhones(data);
      }
    }, (error) => {
      console.error('Error fetching appointments:', error);
    });
  }

  private async loadClientPhones(appointments: Appointment[]) {
    try {
      const { getDoc, doc } = await import('firebase/firestore');
      const uniqueUserIds = Array.from(new Set(appointments.map(a => a.userId).filter(Boolean)));
      const currentPhones = { ...this.userPhones() };
      let updated = false;

      for (const uid of uniqueUserIds) {
        if (currentPhones[uid] === undefined) {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) {
            const phone = snap.data()['phone'];
            currentPhones[uid] = typeof phone === 'string' ? phone : '';
            updated = true;
          }
        }
      }
      if (updated) {
        this.userPhones.set(currentPhones);
      }
    } catch {
      // Ignore if unable to fetch optional phone
    }
  }

  listenToNotifications(userId: string) {
    if (this.unsubscribeNotifications) {
      this.unsubscribeNotifications();
    }

    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    this.unsubscribeNotifications = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAt: d['createdAt']?.toDate() || new Date()
        } as AppNotification;
      });
      this.notifications.set(data);
    }, (error) => {
      console.error('Error fetching notifications:', error);
    });
  }

  async createNotification(notification: Omit<AppNotification, 'id' | 'createdAt'>) {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  async markNotificationAsRead(notificationId: string) {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async createAppointment(appointment: Omit<Appointment, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'appointments'), {
        ...appointment,
        createdAt: serverTimestamp()
      });

      const serviceName = this.services().find(s => s.id === appointment.serviceId)?.name || 'Serviço';
      const formattedDate = appointment.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const formattedTime = appointment.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // Notifica o barbeiro sobre o novo pedido de agendamento
      await this.createNotification({
        userId: appointment.barberId,
        title: 'Novo Pedido de Agendamento',
        body: `${appointment.userName || 'Um cliente'} agendou ${serviceName} para ${formattedDate} às ${formattedTime}.`,
        type: 'appointment_created',
        relatedId: docRef.id,
        read: false
      });

      // Notifica o cliente confirmando o agendamento e ativando o lembrete
      await this.createNotification({
        userId: appointment.userId,
        title: 'Agendamento Confirmado',
        body: `Seu horário para ${serviceName} foi marcado para ${formattedDate} às ${formattedTime}. Você receberá um lembrete antes do atendimento.`,
        type: 'appointment_reminder',
        relatedId: docRef.id,
        read: false
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async addService(service: Omit<Service, 'id'>) {
    try {
      const user = this.auth.user();
      if (!user) throw new Error('User not authenticated');
      
      await addDoc(collection(db, 'services'), {
        ...service,
        barberId: user.uid,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding service:', error);
      throw error;
    }
  }

  async deleteService(serviceId: string) {
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'services', serviceId));
    } catch (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  }

  async updateService(serviceId: string, serviceData: Partial<Service>) {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'services', serviceId), serviceData);
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  async updateAppointmentStatus(appointmentId: string, status: 'upcoming' | 'completed' | 'cancelled') {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'appointments', appointmentId), { status });

      const appt = this.appointments().find(a => a.id === appointmentId);
      const currentUser = this.auth.user();
      if (appt && currentUser) {
        const serviceName = this.services().find(s => s.id === appt.serviceId)?.name || 'atendimento';
        if (currentUser.role === 'barber') {
          await this.createNotification({
            userId: appt.userId,
            title: status === 'completed' ? 'Atendimento Concluído' : 'Agendamento Cancelado',
            body: status === 'completed'
              ? `Seu ${serviceName} foi concluído! Avalie seu atendimento no perfil.`
              : `Seu agendamento de ${serviceName} foi cancelado pelo barbeiro.`,
            type: 'system',
            relatedId: appointmentId,
            read: false
          });
        } else {
          await this.createNotification({
            userId: appt.barberId,
            title: 'Agendamento Cancelado pelo Cliente',
            body: `${appt.userName || 'O cliente'} cancelou o agendamento de ${serviceName}.`,
            type: 'system',
            relatedId: appointmentId,
            read: false
          });
        }
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }

  async getBarberReviews(barberId: string): Promise<import('./data').Review[]> {
    try {
      const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
      const q = query(
        collection(db, 'reviews'),
        where('barberId', '==', barberId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          createdAt: d['createdAt']?.toDate() || new Date()
        } as import('./data').Review;
      });
    } catch (error) {
      console.error('Error fetching barber reviews:', error);
      return [];
    }
  }

  async rateAppointment(appointmentId: string, barberId: string, rating: number, review?: string) {
    try {
      const { doc, collection, runTransaction, serverTimestamp } = await import('firebase/firestore');
      
      await runTransaction(db, async (transaction) => {
        const appointmentRef = doc(db, 'appointments', appointmentId);
        const appointmentDoc = await transaction.get(appointmentRef);
        
        if (!appointmentDoc.exists()) {
          throw new Error('Appointment not found');
        }

        const appointmentData = appointmentDoc.data();

        const barberRef = doc(db, 'barbers', barberId);
        const barberDoc = await transaction.get(barberRef);
        
        if (!barberDoc.exists()) {
          throw new Error('Barber not found');
        }
        
        const barberData = barberDoc.data() as Barber;
        const currentRating = barberData.rating || 0;
        const currentReviewCount = barberData.reviewCount || 0;
        
        const newReviewCount = currentReviewCount + 1;
        const newRating = ((currentRating * currentReviewCount) + rating) / newReviewCount;
        
        transaction.update(barberRef, {
          rating: newRating,
          reviewCount: newReviewCount
        });
        
        transaction.update(appointmentRef, {
          rating,
          review: review || null
        });

        // Add to public reviews collection
        const reviewRef = doc(collection(db, 'reviews'));
        transaction.set(reviewRef, {
          barberId,
          userId: appointmentData['userId'],
          userName: appointmentData['userName'] || 'Cliente',
          userAvatar: appointmentData['userAvatar'] || 'https://picsum.photos/seed/user/100/100',
          rating,
          comment: review || null,
          appointmentId,
          createdAt: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('Error rating appointment:', error);
      throw error;
    }
  }

  private async compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = event => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 800; // Compress strongly to fit in 1MB Firestore limit

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = error => reject(error);
      };
      reader.onerror = error => reject(error);
    });
  }

  async uploadGalleryPhoto(file: File): Promise<string> {
    try {
      const user = this.auth.user();
      if (!user) throw new Error('User not authenticated');
      
      const { updateDoc, doc, arrayUnion } = await import('firebase/firestore');
      
      const base64Image = await this.compressImage(file);
      
      // Optimistically update the local cache
      const currentBarber = this.barbers().find(b => b.id === user.uid);
      if (currentBarber) {
        const currentGallery = currentBarber.gallery || [];
        const updatedBarber = { ...currentBarber, gallery: [base64Image, ...currentGallery] };
        this.barbers.update(barbers => barbers.map(b => b.id === user.uid ? updatedBarber : b));
      }
      
      await updateDoc(doc(db, 'barbers', user.uid), {
        gallery: arrayUnion(base64Image)
      });
      
      return base64Image;
    } catch (error) {
      console.error('Error uploading gallery photo:', error);
      throw error;
    }
  }

  async deleteGalleryPhoto(photoUrl: string) {
    try {
      const user = this.auth.user();
      if (!user) throw new Error('User not authenticated');

      const { updateDoc, doc, arrayRemove } = await import('firebase/firestore');

      // Optimistically update the local cache
      const currentBarber = this.barbers().find(b => b.id === user.uid);
      if (currentBarber) {
        const currentGallery = currentBarber.gallery || [];
        const updatedBarber = { ...currentBarber, gallery: currentGallery.filter(url => url !== photoUrl) };
        this.barbers.update(barbers => barbers.map(b => b.id === user.uid ? updatedBarber : b));
      }

      await updateDoc(doc(db, 'barbers', user.uid), {
        gallery: arrayRemove(photoUrl)
      });
    } catch (error) {
      console.error('Error deleting gallery photo:', error);
      throw error;
    }
  }

  async deleteChatMessage(messageId: string) {
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'messages', messageId));
    } catch (error) {
      console.error('Error deleting chat message:', error);
      throw error;
    }
  }
}
