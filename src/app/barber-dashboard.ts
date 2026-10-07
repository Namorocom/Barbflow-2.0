import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './auth.service';
import { DataService } from './data.service';
import { Appointment } from './data';

@Component({
  selector: 'app-barber-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, DecimalPipe, RouterLink, MatIconModule],
  template: `
    <div class="p-4 sm:p-6 pb-32 sm:pb-10 space-y-8">
      @if (toastMessage()) {
        <div class="fixed top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-zinc-950 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg z-50 transition-all">
          {{ toastMessage() }}
        </div>
      }

      <!-- Top Header -->
      <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div class="flex items-center gap-2 text-xs text-zinc-400 mb-1">
            <span>Painel do Barbeiro</span>
            <span aria-hidden="true">·</span>
            <span class="font-mono tabular-nums">{{ today | date:"EEEE, dd 'de' MMMM" }}</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-semibold text-zinc-50 tracking-tight">
            Resumo do Dia
          </h1>
        </div>

        <div class="flex items-center gap-3">
          <a routerLink="/services" class="px-4 py-2 text-xs font-medium text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap flex items-center gap-2">
            <mat-icon class="text-[16px] w-[16px] h-[16px]">content_cut</mat-icon>
            Gerenciar Serviços
          </a>
          <a routerLink="/profile" class="px-4 py-2 text-xs font-semibold text-zinc-950 bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap flex items-center gap-2">
            <mat-icon class="text-[16px] w-[16px] h-[16px]">schedule</mat-icon>
            Meus Horários
          </a>
        </div>
      </header>

      <!-- KPI Summary Grid (Single-Elevation Depth, Tabular Numerals) -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total de Agendamentos Hoje -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-3">
            <span>Agendamentos Hoje</span>
            <mat-icon class="text-zinc-500 text-[18px] w-[18px] h-[18px]">event</mat-icon>
          </div>
          <div class="flex items-baseline justify-between">
            <span class="text-3xl font-semibold text-zinc-50 font-mono tabular-nums">
              {{ todayAppointments().length }}
            </span>
            <span class="text-xs text-zinc-400 font-mono tabular-nums">
              {{ todayCompletedCount() }} concluídos · {{ todayUpcomingCount() }} pendentes
            </span>
          </div>
        </div>

        <!-- Ganhos Estimados do Dia -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-3">
            <span>Ganhos Estimados (Hoje)</span>
            <mat-icon class="text-amber-500 text-[18px] w-[18px] h-[18px]">payments</mat-icon>
          </div>
          <div class="flex items-baseline justify-between">
            <span class="text-2xl sm:text-3xl font-semibold text-amber-500 font-mono tabular-nums">
              {{ estimatedDailyEarnings() | number:'1.2-2' }} <span class="text-sm font-normal text-zinc-400">KZ</span>
            </span>
          </div>
          <p class="text-xs text-zinc-500 mt-2 font-mono tabular-nums">
            Confirmado: {{ realizedDailyEarnings() | number:'1.2-2' }} KZ
          </p>
        </div>

        <!-- Próximo Atendimento -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-3">
            <span>Próximo Cliente</span>
            <mat-icon class="text-emerald-500 text-[18px] w-[18px] h-[18px]">person_pin</mat-icon>
          </div>
          @if (nextClientToday(); as next) {
            <div>
              <p class="text-lg font-semibold text-zinc-100 truncate">{{ next.userName || 'Cliente' }}</p>
              <p class="text-xs text-zinc-400 mt-0.5 font-mono tabular-nums">
                {{ next.date | date:'HH:mm' }} · {{ getServiceName(next.serviceId) }}
              </p>
            </div>
          } @else {
            <div>
              <p class="text-base font-medium text-zinc-400">Sem fila pendente</p>
              <p class="text-xs text-zinc-500 mt-0.5">Agenda livre para hoje</p>
            </div>
          }
        </div>

        <!-- Taxa de Conclusão / Tempo Estimado -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
          <div class="flex items-center justify-between text-zinc-400 text-xs mb-3">
            <span>Tempo em Atendimento</span>
            <mat-icon class="text-zinc-500 text-[18px] w-[18px] h-[18px]">timer</mat-icon>
          </div>
          <div class="flex items-baseline justify-between">
            <span class="text-3xl font-semibold text-zinc-50 font-mono tabular-nums">
              {{ totalMinutesToday() }} <span class="text-sm font-normal text-zinc-400">min</span>
            </span>
            <span class="text-xs text-zinc-400 font-mono tabular-nums">
              {{ todayCancelledCount() }} cancelados
            </span>
          </div>
        </div>
      </section>

      <!-- Lista de Próximos Clientes e Agenda do Dia -->
      <section class="space-y-4">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-zinc-100">Lista de Clientes e Agendamentos</h2>
            <p class="text-xs text-zinc-400">Acompanhe a fila de espera, busque clientes por nome ou telefone e gerencie atendimentos.</p>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <!-- Campo de Busca por Nome ou Telefone -->
            <div class="relative min-w-[240px] sm:min-w-[280px]">
              <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px] w-[18px] h-[18px]">search</mat-icon>
              <input
                type="text"
                [value]="searchQuery()"
                (input)="searchQuery.set($any($event.target).value)"
                placeholder="Buscar por nome ou telefone..."
                aria-label="Buscar cliente por nome ou telefone"
                class="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors">
              @if (searchQuery()) {
                <button
                  type="button"
                  (click)="searchQuery.set('')"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors flex items-center justify-center"
                  title="Limpar busca">
                  <mat-icon class="text-[15px] w-[15px] h-[15px]">close</mat-icon>
                </button>
              }
            </div>

            <!-- Interactive Filter Controls -->
            <div class="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg self-start sm:self-auto">
              <button
                type="button"
                (click)="selectedFilter.set('today')"
                class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                [class.bg-zinc-800]="selectedFilter() === 'today'"
                [class.text-zinc-100]="selectedFilter() === 'today'"
                [class.text-zinc-400]="selectedFilter() !== 'today'">
                Hoje ({{ todayAppointments().length }})
              </button>
              <button
                type="button"
                (click)="selectedFilter.set('upcoming')"
                class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                [class.bg-zinc-800]="selectedFilter() === 'upcoming'"
                [class.text-zinc-100]="selectedFilter() === 'upcoming'"
                [class.text-zinc-400]="selectedFilter() !== 'upcoming'">
                Próximos ({{ upcomingClients().length }})
              </button>
              <button
                type="button"
                (click)="selectedFilter.set('completed')"
                class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                [class.bg-zinc-800]="selectedFilter() === 'completed'"
                [class.text-zinc-100]="selectedFilter() === 'completed'"
                [class.text-zinc-400]="selectedFilter() !== 'completed'">
                Concluídos ({{ todayCompletedCount() }})
              </button>
            </div>
          </div>
        </div>

        <!-- High-Density Data Grid / List -->
        @if (filteredAppointments().length > 0) {
          <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div class="hidden md:grid md:grid-cols-12 gap-4 px-5 py-3 border-b border-zinc-800 text-xs font-medium text-zinc-400">
              <div class="col-span-2">Horário</div>
              <div class="col-span-4">Cliente</div>
              <div class="col-span-3">Serviço · Duração</div>
              <div class="col-span-1 text-right">Valor</div>
              <div class="col-span-2 text-right">Ações</div>
            </div>

            <div class="divide-y divide-zinc-800">
              @for (appt of filteredAppointments(); track appt.id) {
                <div class="p-4 sm:px-5 sm:py-3.5 hover:bg-zinc-800/40 transition-colors grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <!-- Horário & Data -->
                  <div class="md:col-span-2 flex items-center justify-between md:justify-start gap-2">
                    <div class="font-mono tabular-nums">
                      <span class="text-sm font-semibold text-zinc-100">{{ appt.date | date:'HH:mm' }}</span>
                      <span class="text-xs text-zinc-500 block">{{ appt.date | date:'dd/MM/yyyy' }}</span>
                    </div>
                    <span class="md:hidden text-xs font-medium"
                      [class.text-amber-500]="appt.status === 'upcoming'"
                      [class.text-emerald-500]="appt.status === 'completed'"
                      [class.text-red-500]="appt.status === 'cancelled'">
                      {{ appt.status === 'upcoming' ? 'Aguardando' : (appt.status === 'completed' ? 'Concluído' : 'Cancelado') }}
                    </span>
                  </div>

                  <!-- Cliente -->
                  <div class="md:col-span-4 flex items-center gap-3 min-w-0">
                    @if (appt.userAvatar) {
                      <img [src]="appt.userAvatar" [alt]="appt.userName || 'Cliente'" class="w-9 h-9 rounded-full object-cover border border-zinc-800 shrink-0" referrerpolicy="no-referrer">
                    } @else {
                      <div class="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                        <mat-icon class="text-[18px] w-[18px] h-[18px]">person</mat-icon>
                      </div>
                    }
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-zinc-100 truncate">{{ appt.userName || 'Cliente' }}</p>
                      <div class="flex items-center gap-1.5 text-xs text-zinc-400">
                        @if (getClientPhone(appt)) {
                          <span class="font-mono tabular-nums text-zinc-400">{{ getClientPhone(appt) }}</span>
                          <span aria-hidden="true" class="hidden md:inline">·</span>
                        }
                        <span class="hidden md:inline"
                          [class.text-amber-500]="appt.status === 'upcoming'"
                          [class.text-emerald-500]="appt.status === 'completed'"
                          [class.text-red-500]="appt.status === 'cancelled'">
                          {{ appt.status === 'upcoming' ? 'Aguardando' : (appt.status === 'completed' ? 'Concluído' : 'Cancelado') }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Serviço -->
                  <div class="md:col-span-3 min-w-0">
                    <p class="text-sm text-zinc-200 truncate">{{ getServiceName(appt.serviceId) }}</p>
                    <p class="text-xs text-zinc-500 font-mono tabular-nums">{{ getServiceDuration(appt.serviceId) }} min</p>
                  </div>

                  <!-- Valor -->
                  <div class="md:col-span-1 flex items-center justify-between md:justify-end">
                    <span class="md:hidden text-xs text-zinc-500">Valor estimado:</span>
                    <span class="text-sm font-semibold text-zinc-100 font-mono tabular-nums">
                      {{ getServicePrice(appt.serviceId) | number:'1.0-0' }} KZ
                    </span>
                  </div>

                  <!-- Ações -->
                  <div class="md:col-span-2 flex items-center justify-end gap-2">
                    <a [routerLink]="['/chat', appt.id]" class="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap" title="Conversar com cliente">
                      <mat-icon class="text-[15px] w-[15px] h-[15px]">chat</mat-icon>
                      <span>Chat</span>
                    </a>

                    @if (appt.status === 'upcoming') {
                      <button
                        type="button"
                        (click)="updateStatus(appt.id, 'completed')"
                        class="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-zinc-950 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 whitespace-nowrap"
                        title="Concluir atendimento">
                        <mat-icon class="text-[15px] w-[15px] h-[15px]">check</mat-icon>
                        <span>Concluir</span>
                      </button>
                      <button
                        type="button"
                        (click)="updateStatus(appt.id, 'cancelled')"
                        class="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-zinc-950 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center"
                        title="Cancelar agendamento">
                        <mat-icon class="text-[15px] w-[15px] h-[15px]">close</mat-icon>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        } @else {
          <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center space-y-3">
            <mat-icon class="text-zinc-600 text-[36px] w-[36px] h-[36px] mx-auto">event_busy</mat-icon>
            <div class="space-y-1">
              <h3 class="text-base font-medium text-zinc-200">Nenhum cliente nesta visualização</h3>
              <p class="text-xs text-zinc-400 max-w-md mx-auto">
                Não há agendamentos correspondentes ao filtro selecionado no momento.
              </p>
            </div>
            @if (selectedFilter() !== 'upcoming') {
              <button
                type="button"
                (click)="selectedFilter.set('upcoming')"
                class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5">
                <mat-icon class="text-[16px] w-[16px] h-[16px]">calendar_month</mat-icon>
                Ver Todos os Próximos Clientes
              </button>
            }
          </div>
        }
      </section>
    </div>
  `
})
export class BarberDashboardComponent {
  auth = inject(AuthService);
  data = inject(DataService);

  today = new Date();
  selectedFilter = signal<'today' | 'upcoming' | 'completed'>('today');
  searchQuery = signal<string>('');
  toastMessage = signal<string | null>(null);

  private isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  // Todos os agendamentos do dia atual
  todayAppointments = computed(() => {
    const now = new Date();
    return this.data.appointments().filter(a => this.isSameDay(a.date, now));
  });

  todayCompletedCount = computed(() => {
    return this.todayAppointments().filter(a => a.status === 'completed').length;
  });

  todayUpcomingCount = computed(() => {
    return this.todayAppointments().filter(a => a.status === 'upcoming').length;
  });

  todayCancelledCount = computed(() => {
    return this.todayAppointments().filter(a => a.status === 'cancelled').length;
  });

  // Ganhos estimados do dia (soma dos agendamentos de hoje não cancelados: upcoming + completed)
  estimatedDailyEarnings = computed(() => {
    return this.todayAppointments()
      .filter(a => a.status !== 'cancelled')
      .reduce((total, a) => total + this.getServicePrice(a.serviceId), 0);
  });

  // Ganhos já realizados hoje (apenas concluídos)
  realizedDailyEarnings = computed(() => {
    return this.todayAppointments()
      .filter(a => a.status === 'completed')
      .reduce((total, a) => total + this.getServicePrice(a.serviceId), 0);
  });

  // Tempo estimado de trabalho no dia (em minutos)
  totalMinutesToday = computed(() => {
    return this.todayAppointments()
      .filter(a => a.status !== 'cancelled')
      .reduce((total, a) => total + this.getServiceDuration(a.serviceId), 0);
  });

  // Lista de próximos clientes (agendamentos com status 'upcoming' de hoje em diante)
  upcomingClients = computed(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return this.data.appointments()
      .filter(a => a.status === 'upcoming' && a.date >= startOfToday)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  // Próximo cliente imediato
  nextClientToday = computed<Appointment | null>(() => {
    const upcoming = this.upcomingClients();
    return upcoming.length > 0 ? upcoming[0] : null;
  });

  // Lista filtrada para a tabela (por aba e por busca de nome ou telefone)
  filteredAppointments = computed(() => {
    const filter = this.selectedFilter();
    let list: Appointment[];
    if (filter === 'today') {
      list = this.todayAppointments();
    } else if (filter === 'upcoming') {
      list = this.upcomingClients();
    } else {
      list = this.todayAppointments().filter(a => a.status === 'completed');
    }

    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return list;

    return list.filter(a => {
      const name = (a.userName || 'Cliente').toLowerCase();
      const phone = this.getClientPhone(a).toLowerCase();
      const digitsOnlyQuery = q.replace(/\D/g, '');
      const digitsOnlyPhone = phone.replace(/\D/g, '');
      return (
        name.includes(q) ||
        phone.includes(q) ||
        (digitsOnlyQuery.length > 0 && digitsOnlyPhone.includes(digitsOnlyQuery))
      );
    });
  });

  getClientPhone(appt: Appointment): string {
    if (appt.userPhone) return appt.userPhone;
    const phonesMap = this.data.userPhones();
    return phonesMap[appt.userId] || '';
  }

  getServiceName(serviceId: string): string {
    const service = this.data.services().find(s => s.id === serviceId);
    return service ? service.name : 'Corte / Serviço';
  }

  getServicePrice(serviceId: string): number {
    const service = this.data.services().find(s => s.id === serviceId);
    return service ? service.price : 0;
  }

  getServiceDuration(serviceId: string): number {
    const service = this.data.services().find(s => s.id === serviceId);
    return service ? service.durationMinutes : 30;
  }

  async updateStatus(appointmentId: string, status: 'completed' | 'cancelled') {
    try {
      await this.data.updateAppointmentStatus(appointmentId, status);
      this.showToast(status === 'completed' ? 'Atendimento concluído com sucesso!' : 'Agendamento cancelado.');
    } catch (error) {
      console.error('Error updating status:', error);
      this.showToast('Erro ao atualizar o status do agendamento.');
    }
  }

  private showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3000);
  }
}
