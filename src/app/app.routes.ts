import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./home').then(m => m.HomeComponent) },
  { path: 'dashboard', loadComponent: () => import('./barber-dashboard').then(m => m.BarberDashboardComponent) },
  { path: 'feed', loadComponent: () => import('./feed').then(m => m.FeedComponent) },
  { path: 'services', loadComponent: () => import('./services').then(m => m.ServicesComponent) },
  { path: 'booking', loadComponent: () => import('./booking').then(m => m.BookingComponent) },
  { path: 'profile', loadComponent: () => import('./profile').then(m => m.ProfileComponent) },
  { path: 'barber/:id', loadComponent: () => import('./barber-profile').then(m => m.BarberProfileComponent) },
  { path: 'barbers', loadComponent: () => import('./barbers').then(m => m.BarbersComponent) },
  { path: 'chats', loadComponent: () => import('./chat-list').then(m => m.ChatListComponent) },
  { path: 'chat/:id', loadComponent: () => import('./chat').then(m => m.ChatComponent) }
];
