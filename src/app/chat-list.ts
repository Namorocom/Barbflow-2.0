import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, AppUser } from './auth.service';
import { DataService } from './data.service';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="max-w-3xl mx-auto pb-24">
      <header class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-black text-zinc-50 tracking-tight">Mensagens</h1>
          <p class="text-zinc-400 mt-1">Converse com {{ auth.user()?.role === 'barber' ? 'seus clientes' : 'nossos profissionais' }}</p>
        </div>
      </header>

      @if (isLoading()) {
        <div class="flex justify-center py-12">
          <mat-icon class="animate-spin text-amber-500 text-4xl w-10 h-10">refresh</mat-icon>
        </div>
      } @else if (users().length === 0) {
        <div class="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center">
          <div class="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-500">
            <mat-icon class="text-4xl w-10 h-10">chat_bubble_outline</mat-icon>
          </div>
          <h3 class="text-xl font-bold text-zinc-100 mb-2">Nenhum contato encontrado</h3>
          <p class="text-zinc-400">Você ainda não tem contatos para conversar.</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (user of users(); track user.uid) {
            <a [routerLink]="['/chat', 'direct_' + user.uid]" class="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl hover:border-zinc-700 transition-colors group">
              <div class="relative">
                <img [src]="user.avatar || 'https://picsum.photos/seed/user/200/200'" alt="{{ user.name }}" class="w-14 h-14 rounded-full object-cover border-2 border-zinc-800">
                <div class="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-zinc-900" 
                     [class]="user.isOnline ? 'bg-emerald-500' : 'bg-zinc-500'"></div>
              </div>
              
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-center mb-1">
                  <h3 class="font-bold text-zinc-100 truncate group-hover:text-amber-500 transition-colors">{{ user.name }}</h3>
                  <span class="text-xs font-medium px-2 py-0.5 rounded-full" 
                        [class]="user.isOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-400'">
                    {{ user.isOnline ? 'Online' : 'Offline' }}
                  </span>
                </div>
                <p class="text-sm text-zinc-400 truncate">
                  {{ user.role === 'barber' ? 'Barbeiro' : 'Cliente' }}
                </p>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `
})
export class ChatListComponent implements OnInit {
  auth = inject(AuthService);
  data = inject(DataService);
  
  users = signal<AppUser[]>([]);
  isLoading = signal(true);

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    this.isLoading.set(true);
    try {
      const currentUser = this.auth.user();
      if (!currentUser) return;

      const usersRef = collection(db, 'users');
      let q;
      
      if (currentUser.role === 'barber') {
        // Barbers see clients
        q = query(usersRef, where('role', '==', 'client'));
      } else {
        // Clients see barbers
        q = query(usersRef, where('role', '==', 'barber'));
      }

      const snapshot = await getDocs(q);
      const fetchedUsers: AppUser[] = [];
      snapshot.forEach(doc => {
        fetchedUsers.push({ uid: doc.id, ...doc.data() } as AppUser);
      });

      // Sort: Online first, then alphabetical
      fetchedUsers.sort((a, b) => {
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return a.name.localeCompare(b.name);
      });

      this.users.set(fetchedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
