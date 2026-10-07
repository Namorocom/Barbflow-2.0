import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { AuthService } from './auth.service';
import { DataService } from './data.service';
import { Barber } from './data';
import { BarberDashboardComponent } from './barber-dashboard';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, DatePipe, CurrencyPipe, DecimalPipe, BarberDashboardComponent],
  template: `
    @if (auth.user()?.role === 'barber') {
      <app-barber-dashboard />
    } @else {
    <div class="p-4 sm:p-6 pb-32 sm:pb-10 space-y-8">
      <!-- Header -->
      <header class="flex justify-between items-center">
        <div>
          <p class="text-zinc-400 text-sm font-medium uppercase tracking-wider">Bem-vindo de volta,</p>
          <h1 class="text-3xl font-bold text-zinc-50 tracking-tight">{{ auth.user()?.name?.split(' ')?.[0] || 'Usuário' }}</h1>
        </div>
        <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500/50">
          <img [src]="auth.user()?.avatar || 'https://picsum.photos/seed/user/200/200'" alt="User" class="w-full h-full object-cover" referrerpolicy="no-referrer">
        </div>
      </header>

      <!-- Actions -->
      <div class="flex gap-3">
        @if (auth.user()?.role !== 'barber') {
          <a routerLink="/barbers" class="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 py-4 rounded-2xl font-bold sm:text-lg shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2">
            <mat-icon>search</mat-icon> <span class="hidden sm:inline">Encontrar Barbeiro</span><span class="sm:hidden">Barbeiros</span>
          </a>
        }
        <a routerLink="/feed" class="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-4 rounded-2xl font-bold sm:text-lg transition-all flex items-center justify-center gap-2 border border-zinc-700">
          <mat-icon>photo_library</mat-icon> <span class="hidden sm:inline">Galeria de Estilos</span><span class="sm:hidden">Galeria</span>
        </a>
      </div>

      <!-- Next Appointment Card (For Clients) -->
      @if (auth.user()?.role !== 'barber') {
        <section>
          <div class="flex justify-between items-end mb-4">
            <h2 class="text-lg font-semibold text-zinc-100">Próximo Agendamento</h2>
          </div>
          
          @if (data.nextAppointment()) {
            @let nextAppt = data.nextAppointment()!;
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div class="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full blur-2xl"></div>
              
              <div class="flex items-start gap-4 relative z-10">
                <div class="bg-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center min-w-[60px]">
                  <span class="text-xs text-zinc-400 uppercase font-bold">{{ nextAppt.date | date:'MMM' }}</span>
                  <span class="text-2xl font-bold text-amber-500">{{ nextAppt.date | date:'dd' }}</span>
                </div>
                
                @if (getServiceImage(nextAppt.serviceId)) {
                  <img [src]="getServiceImage(nextAppt.serviceId)" alt="Serviço" class="w-12 h-12 rounded-xl object-cover border border-zinc-800">
                }
                
                <div class="flex-1">
                  <h3 class="font-semibold text-lg text-zinc-100 mb-1">{{ getServiceName(nextAppt.serviceId) }}</h3>
                  <div class="flex items-center gap-2 text-zinc-400 text-sm mb-3">
                    <mat-icon class="text-[16px] w-[16px] h-[16px]">schedule</mat-icon>
                    <span>{{ nextAppt.date | date:'HH:mm' }}</span>
                  </div>
                  @if (getBarberAvatar(nextAppt.barberId) || nextAppt.barberAvatar) {
                    <div class="flex items-center gap-2 mt-2">
                      <img [src]="getBarberAvatar(nextAppt.barberId) || nextAppt.barberAvatar" alt="Barbeiro" class="w-6 h-6 rounded-full object-cover border border-zinc-800" referrerpolicy="no-referrer">
                      <span class="text-xs text-zinc-400">Com o seu barbeiro</span>
                    </div>
                  }
                </div>
              </div>
              
              <div class="mt-5 flex gap-3 relative z-10">
                <a routerLink="/booking" class="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-xl text-sm font-medium transition-colors text-center block">
                  Reagendar
                </a>
                <a routerLink="/profile" class="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 py-2.5 rounded-xl text-sm font-bold transition-colors text-center block">
                  Detalhes
                </a>
              </div>
            </div>
          } @else {
            <div class="bg-zinc-900 border border-zinc-800 border-dashed rounded-2xl p-6 text-center">
              <mat-icon class="text-zinc-600 mb-2">event_available</mat-icon>
              <p class="text-zinc-400 text-sm mb-4">Você não tem agendamentos próximos.</p>
              <a routerLink="/booking" class="bg-amber-500 text-zinc-950 px-6 py-2 rounded-xl font-bold text-sm inline-block">Agendar Agora</a>
            </div>
          }
        </section>
      }

      <!-- Pending Appointments (For Barbers) -->
      @if (auth.user()?.role === 'barber') {
        <section>
          <div class="flex justify-between items-end mb-4">
            <h2 class="text-lg font-semibold text-zinc-100">Agendamentos Pendentes</h2>
          </div>
          
          @if (data.pendingAppointments().length > 0) {
            <div class="space-y-4">
              @for (appt of data.pendingAppointments(); track appt.id) {
                <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
                  <div class="bg-zinc-800 rounded-xl p-2 flex flex-col items-center justify-center min-w-[50px]">
                    <span class="text-[10px] text-zinc-400 uppercase font-bold">{{ appt.date | date:'MMM' }}</span>
                    <span class="text-lg font-bold text-amber-500">{{ appt.date | date:'dd' }}</span>
                  </div>
                  
                  @if (getServiceImage(appt.serviceId)) {
                    <img [src]="getServiceImage(appt.serviceId)" alt="Serviço" class="w-10 h-10 rounded-xl object-cover border border-zinc-800">
                  }
                  
                  @if (appt.userAvatar) {
                    <img [src]="appt.userAvatar" alt="{{ appt.userName }}" class="w-10 h-10 rounded-full object-cover border border-zinc-800" referrerpolicy="no-referrer">
                  } @else {
                    <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <mat-icon>person</mat-icon>
                    </div>
                  }
                  
                  <div class="flex-1">
                    <h3 class="font-semibold text-zinc-100 text-sm">{{ appt.userName || 'Cliente' }}</h3>
                    <p class="text-zinc-400 text-xs">{{ getServiceName(appt.serviceId) }}</p>
                  </div>
                  <div class="text-right flex flex-col items-end gap-2">
                    <div class="flex items-center gap-1 text-amber-500 text-sm font-bold">
                      <mat-icon class="text-[16px] w-[16px] h-[16px]">schedule</mat-icon>
                      {{ appt.date | date:'HH:mm' }}
                    </div>
                    <div class="flex gap-2">
                      <button (click)="updateStatus(appt.id, 'completed')" class="text-xs bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-zinc-950 px-2 py-1 rounded-md font-bold transition-colors flex items-center justify-center" title="Marcar como concluído">
                        <mat-icon class="text-[16px] w-[16px] h-[16px]">check</mat-icon>
                      </button>
                      <button (click)="updateStatus(appt.id, 'cancelled')" class="text-xs bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-zinc-950 px-2 py-1 rounded-md font-bold transition-colors flex items-center justify-center" title="Cancelar">
                        <mat-icon class="text-[16px] w-[16px] h-[16px]">close</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="bg-zinc-900 border border-zinc-800 border-dashed rounded-2xl p-6 text-center">
              <mat-icon class="text-zinc-600 mb-2">event_available</mat-icon>
              <p class="text-zinc-400 text-sm">Você não tem agendamentos pendentes.</p>
            </div>
          }
        </section>
      }

      <!-- Quick Services -->
      <section>
        <div class="flex justify-between items-end mb-4">
          <h2 class="text-lg font-semibold text-zinc-100">Serviços Rápidos</h2>
          <a routerLink="/services" class="text-amber-500 text-sm font-medium hover:underline">Ver todos</a>
        </div>
        
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          @for (service of data.services().slice(0, 6); track service.id) {
            <a routerLink="/booking" [queryParams]="{service: service.id}" class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-amber-500/30 transition-colors cursor-pointer group block">
              @if (service.imageUrl) {
                <img [src]="service.imageUrl" alt="{{ service.name }}" class="w-10 h-10 rounded-full object-cover mb-3 border border-zinc-800">
              } @else {
                <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-amber-500 mb-3 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors">
                  <mat-icon>{{ service.icon }}</mat-icon>
                </div>
              }
              <h3 class="font-medium text-zinc-100 text-sm mb-1 truncate">{{ service.name }}</h3>
              <p class="text-zinc-500 text-xs font-mono">{{ service.price | currency:'AOA':'KZ ' }}</p>
            </a>
          }
        </div>
      </section>
      
      <!-- Top Barbers -->
      <section>
        <div class="flex justify-between items-end mb-4">
          <h2 class="text-lg font-semibold text-zinc-100">Nossos Barbeiros</h2>
        </div>
        
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          @for (barber of sortedBarbers(); track barber.id) {
            <a [routerLink]="['/barber', barber.id]" class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center block hover:border-amber-500/30 transition-colors relative cursor-pointer">
              <img [src]="barber.avatar" alt="Barber" class="w-16 h-16 rounded-full object-cover mb-3 border-2 border-zinc-800" referrerpolicy="no-referrer">
              <h3 class="font-medium text-zinc-100 text-sm text-center truncate w-full">{{ barber.name }}</h3>
              <div class="flex items-center gap-1 text-amber-500 mt-1">
                <mat-icon class="text-[16px] w-[16px] h-[16px] leading-none shrink-0">star</mat-icon>
                <span class="text-xs font-medium">{{ (barber.reviewCount || 0) > 0 ? (barber.rating | number:'1.1-1') : 'N/D' }}</span>
                @if (barber.reviewCount) {
                  <span class="text-[10px] text-zinc-500 ml-1">({{ barber.reviewCount }})</span>
                }
              </div>
              @if (getDistance(barber)) {
                <div class="flex items-center gap-1 text-zinc-400 mt-2 text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full">
                  <mat-icon class="text-[12px] w-[12px] h-[12px]">location_on</mat-icon>
                  <span class="truncate max-w-[80px]">{{ getDistance(barber) }}</span>
                </div>
              }
            </a>
          }
        </div>
      </section>
    </div>
    }
  `,
  styles: [`
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class HomeComponent {
  auth = inject(AuthService);
  data = inject(DataService);

  sortedBarbers = computed(() => {
    const barbers = [...this.data.barbers()];
    const userCoords = this.auth.user()?.coordinates;
    
    if (userCoords) {
      return barbers.sort((a, b) => {
        const distA = a.coordinates ? this.calculateDistance(userCoords.lat, userCoords.lng, a.coordinates.lat, a.coordinates.lng) : Infinity;
        const distB = b.coordinates ? this.calculateDistance(userCoords.lat, userCoords.lng, b.coordinates.lat, b.coordinates.lng) : Infinity;
        return distA - distB;
      });
    }
    return barbers;
  });

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  getDistance(barber: Barber): string | null {
    const userCoords = this.auth.user()?.coordinates;
    if (userCoords && barber.coordinates) {
      const dist = this.calculateDistance(userCoords.lat, userCoords.lng, barber.coordinates.lat, barber.coordinates.lng);
      return dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`;
    }
    return barber.locationName || null;
  }

  getServiceName(serviceId: string): string {
    const service = this.data.services().find(s => s.id === serviceId);
    return service ? service.name : 'Serviço';
  }

  getBarberAvatar(barberId: string): string | null {
    const barber = this.data.barbers().find(b => b.id === barberId);
    return barber?.avatar || null;
  }

  getServiceImage(serviceId: string): string | null {
    const service = this.data.services().find(s => s.id === serviceId);
    return service?.imageUrl || null;
  }

  async updateStatus(appointmentId: string, status: 'completed' | 'cancelled') {
    try {
      await this.data.updateAppointmentStatus(appointmentId, status);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }
}
