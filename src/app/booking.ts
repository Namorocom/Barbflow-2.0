import { ChangeDetectionStrategy, Component, signal, computed, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe, NgClass, DecimalPipe } from '@angular/common';
import { Service, Barber } from './data';
import { DataService } from './data.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-booking',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, CurrencyPipe, DecimalPipe],
  template: `
    <div class="p-4 sm:p-6 pb-32 sm:pb-10 space-y-6 max-w-6xl mx-auto">
      <!-- Header -->
      <header class="flex items-center gap-4 mb-8">
        <button (click)="goBack()" class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="text-2xl font-bold text-zinc-50 tracking-tight">Agendamento</h1>
      </header>

      <div class="lg:grid lg:grid-cols-12 lg:gap-12 items-start">
        <!-- Left Column: Selection Steps -->
        <div class="lg:col-span-8 space-y-8">
          <!-- Progress Steps -->
          <div class="flex justify-between items-center mb-8 px-2 relative">
            <div class="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-800 -z-10 -translate-y-1/2"></div>
            <div class="absolute top-1/2 left-0 h-0.5 bg-amber-500 -z-10 -translate-y-1/2 transition-all duration-300" [style.width.%]="(step() - 1) * 33.33"></div>
            
            @for (s of [1, 2, 3, 4]; track s) {
              <div class="flex flex-col items-center gap-2">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
                     [class]="s <= step() ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20' : 'bg-zinc-900 border border-zinc-700 text-zinc-500'">
                  @if (s < step()) {
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">check</mat-icon>
                  } @else {
                    {{ s }}
                  }
                </div>
              </div>
            }
          </div>

          <!-- Step 1: Select Service -->
          @if (step() === 1) {
            <section class="animate-fade-in">
              <h2 class="text-xl font-bold text-zinc-100 mb-4">Escolha o Serviço</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                @for (service of data.services(); track service.id) {
                  <button (click)="selectService(service)" 
                          class="w-full text-left bg-zinc-900 border rounded-2xl p-4 transition-all"
                          [class]="selectedService()?.id === service.id ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-800 hover:border-zinc-700'">
                    <div class="flex flex-wrap justify-between items-center gap-2">
                      <div class="flex items-center gap-4 flex-1 min-w-0">
                        @if (service.imageUrl) {
                          <img [src]="service.imageUrl" alt="{{ service.name }}" class="w-12 h-12 rounded-xl object-cover border shrink-0" [class]="selectedService()?.id === service.id ? 'border-amber-500' : 'border-zinc-800'">
                        } @else {
                          <div class="w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0"
                               [class]="selectedService()?.id === service.id ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-amber-500'">
                            <mat-icon>{{ service.icon }}</mat-icon>
                          </div>
                        }
                        <div class="min-w-0">
                          <h3 class="font-semibold text-zinc-100 truncate">{{ service.name }}</h3>
                          <p class="text-zinc-500 text-sm">{{ service.durationMinutes }} min</p>
                        </div>
                      </div>
                      <span class="font-mono font-bold shrink-0" [class]="selectedService()?.id === service.id ? 'text-amber-500' : 'text-zinc-300'">
                        {{ service.price | currency:'AOA':'KZ ' }}
                      </span>
                    </div>
                  </button>
                }
              </div>
            </section>
          }

          <!-- Step 2: Select Barber -->
          @if (step() === 2) {
            <section class="animate-fade-in">
              <h2 class="text-xl font-bold text-zinc-100 mb-4">Escolha o Profissional</h2>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                @for (barber of data.barbers(); track barber.id) {
                  <button (click)="selectBarber(barber)" 
                          class="flex flex-col items-center bg-zinc-900 border rounded-2xl p-5 transition-all text-center"
                          [class]="selectedBarber()?.id === barber.id ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-800 hover:border-zinc-700'">
                    <div class="relative mb-3">
                      <img [src]="barber.avatar" alt="Barber" class="w-20 h-20 rounded-full object-cover border-2" 
                           [class]="selectedBarber()?.id === barber.id ? 'border-amber-500' : 'border-zinc-800'" referrerpolicy="no-referrer">
                      @if (selectedBarber()?.id === barber.id) {
                        <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-zinc-950 border-2 border-zinc-900">
                          <mat-icon class="text-[14px] w-[14px] h-[14px]">check</mat-icon>
                        </div>
                      }
                    </div>
                    <h3 class="font-semibold text-zinc-100 text-sm">{{ barber.name }}</h3>
                    <p class="text-zinc-500 text-xs mt-1">{{ barber.specialty }}</p>
                    <div class="flex items-center gap-1 text-amber-500 mt-2">
                      <mat-icon class="text-[16px] w-[16px] h-[16px] leading-none shrink-0">star</mat-icon>
                      <span class="text-xs font-bold">{{ barber.rating | number:'1.1-1' }}</span>
                    </div>
                  </button>
                }
              </div>
            </section>
          }

          <!-- Step 3: Select Date & Time -->
          @if (step() === 3) {
            <section class="animate-fade-in">
              <h2 class="text-xl font-bold text-zinc-100 mb-4">Data e Horário</h2>
              
              <!-- Dates -->
              <div class="mb-6">
                <h3 class="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">{{ currentMonth() }}</h3>
                <div class="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
                  @for (date of availableDates(); track date.day) {
                    <button (click)="selectDate(date)" 
                            class="min-w-[70px] flex flex-col items-center justify-center py-3 rounded-2xl border transition-all snap-start relative"
                            [class]="selectedDate()?.day === date.day ? 'bg-amber-500 border-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20' : (date.isToday ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700')">
                      @if (date.isToday) {
                        <span class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950"></span>
                      }
                      <span class="text-xs font-bold uppercase mb-1" [class.text-amber-500]="date.isToday && selectedDate()?.day !== date.day">{{ date.weekday }}</span>
                      <span class="text-xl font-bold">{{ date.day }}</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Times -->
              @if (selectedDate()) {
                <div class="animate-fade-in">
                  <h3 class="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Horários Disponíveis</h3>
                  @if (availableTimes().length > 0) {
                    <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-4 gap-3">
                      @for (time of availableTimes(); track time) {
                        <button (click)="selectTime(time)" 
                                class="py-3 rounded-xl border text-sm font-bold transition-all"
                                [class]="selectedTime() === time ? 'bg-amber-500 border-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'">
                          {{ time }}
                        </button>
                      }
                    </div>
                  } @else {
                    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
                      <p class="text-zinc-400 text-sm">Nenhum horário disponível para esta data.</p>
                    </div>
                  }
                </div>
              }
            </section>
          }

          <!-- Step 4: Confirmation -->
          @if (step() === 4) {
            <section class="animate-fade-in">
              <h2 class="text-xl font-bold text-zinc-100 mb-6">Resumo do Agendamento</h2>
              
              @if (errorMsg()) {
                <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center gap-3 animate-fade-in">
                  <mat-icon class="text-red-400">error_outline</mat-icon>
                  <p class="text-red-400 text-sm font-medium">{{ errorMsg() }}</p>
                </div>
              }
              
              <div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden mb-8">
                <div class="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl"></div>
                
                <div class="flex flex-col sm:flex-row items-center gap-6 mb-6 relative z-10">
                  @if (selectedService()?.imageUrl) {
                    <img [src]="selectedService()?.imageUrl" alt="{{ selectedService()?.name }}" class="w-20 h-20 rounded-full object-cover border-4 border-zinc-950 shadow-xl">
                  } @else {
                    <div class="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-amber-500 border-4 border-zinc-950 shadow-xl">
                      <mat-icon class="text-[40px] w-[40px] h-[40px]">{{ selectedService()?.icon }}</mat-icon>
                    </div>
                  }
                  <div class="text-center sm:text-left">
                    <h3 class="text-2xl font-bold text-zinc-50 mb-1">{{ selectedService()?.name }}</h3>
                    <p class="text-amber-500 font-mono font-bold text-xl">{{ selectedService()?.price | currency:'AOA':'KZ ' }}</p>
                  </div>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                  <div class="flex items-center gap-4 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                    <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                      <mat-icon>person</mat-icon>
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Profissional</p>
                      <p class="text-sm font-semibold text-zinc-100 truncate">{{ selectedBarber()?.name }}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-4 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                    <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                      <mat-icon>event</mat-icon>
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Data e Hora</p>
                      <p class="text-sm font-semibold text-zinc-100 truncate">{{ selectedDate()?.day }} de {{ currentMonth().split(' ')[0] }}, {{ selectedTime() }}</p>
                    </div>
                  </div>
                </div>

                <div class="mt-4 relative z-10">
                  <label for="bookingPhone" class="block text-xs font-medium text-zinc-400 mb-1.5">Telefone para Contato (Opcional)</label>
                  <input
                    id="bookingPhone"
                    type="tel"
                    [value]="clientPhone()"
                    (input)="clientPhone.set($any($event.target).value)"
                    placeholder="Ex: +244 923 456 789"
                    class="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors">
                </div>
              </div>
              
              <button (click)="confirmBooking()" [disabled]="isSubmitting()" class="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                @if (isSubmitting()) {
                  <mat-icon class="animate-spin">refresh</mat-icon> Processando...
                } @else {
                  Confirmar Agendamento <mat-icon>check_circle</mat-icon>
                }
              </button>
            </section>
          }
        </div>

        <!-- Right Column: Summary Card (Desktop Only) -->
        <div class="hidden lg:block lg:col-span-4 sticky top-24">
          <div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-6">
            <h2 class="text-lg font-bold text-zinc-100">Seu Agendamento</h2>
            
            <div class="space-y-4">
              @if (selectedService()) {
                <div class="flex items-center gap-3">
                  @if (selectedService()?.imageUrl) {
                    <img [src]="selectedService()?.imageUrl" alt="Foto" class="w-8 h-8 rounded-lg object-cover border border-zinc-800 shrink-0">
                  } @else {
                    <div class="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                      <mat-icon class="text-[18px] w-[18px] h-[18px]">{{ selectedService()?.icon }}</mat-icon>
                    </div>
                  }
                  <div class="flex-1 min-w-0">
                    <p class="text-xs text-zinc-500 font-bold uppercase tracking-wider">Serviço</p>
                    <p class="text-sm font-medium text-zinc-100 truncate">{{ selectedService()?.name }}</p>
                  </div>
                  <span class="text-sm font-mono text-zinc-400 shrink-0">{{ selectedService()?.price | currency:'AOA':'KZ ' }}</span>
                </div>
              }

              @if (selectedBarber()) {
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">person</mat-icon>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs text-zinc-500 font-bold uppercase tracking-wider">Barbeiro</p>
                    <p class="text-sm font-medium text-zinc-100 truncate">{{ selectedBarber()?.name }}</p>
                  </div>
                </div>
              }

              @if (selectedDate()) {
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">event</mat-icon>
                  </div>
                  <div class="flex-1">
                    <p class="text-xs text-zinc-500 font-bold uppercase tracking-wider">Data</p>
                    <p class="text-sm font-medium text-zinc-100">{{ selectedDate()?.day }} de {{ currentMonth().split(' ')[0] }}</p>
                  </div>
                </div>
              }

              @if (selectedTime()) {
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <mat-icon class="text-[18px] w-[18px] h-[18px]">schedule</mat-icon>
                  </div>
                  <div class="flex-1">
                    <p class="text-xs text-zinc-500 font-bold uppercase tracking-wider">Horário</p>
                    <p class="text-sm font-medium text-zinc-100">{{ selectedTime() }}</p>
                  </div>
                </div>
              }
            </div>

            <div class="pt-6 border-t border-zinc-800">
              <div class="flex justify-between items-center mb-6">
                <span class="text-zinc-400 font-medium">Total</span>
                <span class="text-xl font-bold text-amber-500">{{ (selectedService()?.price || 0) | currency:'AOA':'KZ ' }}</span>
              </div>

              <div class="flex gap-3">
                <button (click)="prevStep()" [disabled]="step() === 1" 
                        class="flex-1 py-3 rounded-xl font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all disabled:opacity-50">
                  Voltar
                </button>
                <button (click)="nextStep()" [disabled]="!canProceed() || step() === 4" 
                        class="flex-1 py-3 rounded-xl font-bold bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20">
                  Próximo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Actions (Mobile Only) -->
      @if (step() < 4) {
        <div class="fixed bottom-20 left-0 w-full px-6 z-40 lg:hidden">
          <div class="bg-zinc-950/80 backdrop-blur-md pt-4 pb-2 flex gap-4 max-w-md mx-auto">
            <button (click)="prevStep()" [disabled]="step() === 1" 
                    class="flex-1 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    [class]="step() === 1 ? 'bg-zinc-900 text-zinc-600' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'">
              Voltar
            </button>
            <button (click)="nextStep()" [disabled]="!canProceed()" 
                    class="flex-1 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    [class]="canProceed() ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400' : 'bg-zinc-800 text-zinc-500'">
              Continuar
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class BookingComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  data = inject(DataService);
  auth = inject(AuthService);

  step = signal(1);
  selectedService = signal<Service | null>(null);
  selectedBarber = signal<Barber | null>(null);
  selectedDate = signal<{day: number, weekday: string, fullDate: Date} | null>(null);
  selectedTime = signal<string | null>(null);
  clientPhone = signal<string>('');
  isSubmitting = signal(false);
  errorMsg = signal<string | null>(null);

  currentMonth = signal('');
  allDates = signal<{day: number, weekday: string, fullDate: Date, isToday: boolean}[]>([]);

  private toIsoDateString(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  availableDates = computed(() => {
    const barber = this.selectedBarber();
    let dates = this.allDates();
    if (barber) {
      if (barber.availableDays && barber.availableDays.length > 0) {
        dates = dates.filter(d => barber.availableDays!.includes(d.fullDate.getDay()));
      }
      if (barber.blockedDates && barber.blockedDates.length > 0) {
        dates = dates.filter(d => !barber.blockedDates!.includes(this.toIsoDateString(d.fullDate)));
      }
    }
    return dates;
  });

  currentTime = signal(new Date());
  private timeInterval: ReturnType<typeof setInterval> | null = null;

  availableTimes = computed(() => {
    const barber = this.selectedBarber();
    const selectedDate = this.selectedDate();
    const now = this.currentTime();
    
    let times = ['09:00', '10:00', '11:00', '13:30', '14:30', '15:30', '16:30', '18:00'];
    if (barber && barber.availableTimes && barber.availableTimes.length > 0) {
      times = barber.availableTimes;
    }

    if (barber?.workingHours?.start && barber?.workingHours?.end) {
      const start = barber.workingHours.start;
      const end = barber.workingHours.end;
      times = times.filter(t => t >= start && t <= end);
    }

    if (selectedDate) {
      if (barber?.blockedDates?.includes(this.toIsoDateString(selectedDate.fullDate))) {
        return [];
      }
      // Check if selected date is today
      if (selectedDate.fullDate.getDate() === now.getDate() && 
          selectedDate.fullDate.getMonth() === now.getMonth() && 
          selectedDate.fullDate.getFullYear() === now.getFullYear()) {
        
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        times = times.filter(time => {
          const [hours, minutes] = time.split(':').map(Number);
          if (hours > currentHour) return true;
          if (hours === currentHour && minutes > currentMinute) return true;
          return false;
        });
      }
    }

    return times;
  });

  constructor() {
    this.generateDates();
    this.timeInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
    
    this.route.queryParams.subscribe(params => {
      if (params['service'] || params['barber']) {
        // Wait a bit for data to load if coming directly
        setTimeout(() => {
          if (params['service']) {
            const service = this.data.services().find(s => s.id === params['service']);
            if (service) {
              this.selectedService.set(service);
              this.step.set(2);
            }
          }
          if (params['barber']) {
            const barber = this.data.barbers().find(b => b.id === params['barber']);
            if (barber) {
              this.selectedBarber.set(barber);
              // If service is also selected, go to step 3, else stay on step 1
              if (this.selectedService()) {
                this.step.set(3);
              }
            }
          }
        }, 500);
      }
    });
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  generateDates() {
    const dates = [];
    const today = new Date();
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    this.currentMonth.set(`${months[today.getMonth()]} ${today.getFullYear()}`);
    
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push({
        day: d.getDate(),
        weekday: i === 0 ? 'Hoje' : weekdays[d.getDay()],
        fullDate: d,
        isToday: i === 0
      });
    }
    this.allDates.set(dates);
  }

  canProceed = computed(() => {
    switch (this.step()) {
      case 1: return this.selectedService() !== null;
      case 2: return this.selectedBarber() !== null;
      case 3: return this.selectedDate() !== null && this.selectedTime() !== null;
      default: return false;
    }
  });

  selectService(service: Service) {
    this.selectedService.set(service);
  }

  selectBarber(barber: Barber) {
    this.selectedBarber.set(barber);
    this.selectedDate.set(null);
    this.selectedTime.set(null);
  }

  selectDate(date: {day: number, weekday: string, fullDate: Date, isToday: boolean}) {
    this.selectedDate.set(date);
    this.selectedTime.set(null); // Reset time when date changes
  }

  selectTime(time: string) {
    this.selectedTime.set(time);
  }

  nextStep() {
    if (this.canProceed() && this.step() < 4) {
      this.step.update(s => s + 1);
    }
  }

  prevStep() {
    if (this.step() > 1) {
      this.step.update(s => s - 1);
    }
  }

  goBack() {
    if (this.step() > 1) {
      this.prevStep();
    } else {
      this.router.navigate(['/home']);
    }
  }

  async confirmBooking() {
    if (!this.auth.user()) return;
    
    this.isSubmitting.set(true);
    this.errorMsg.set(null);
    
    try {
      // Create a date object for the appointment
      const [hours, minutes] = this.selectedTime()!.split(':').map(Number);
      const selectedFullDate = this.selectedDate()!.fullDate;
      const date = new Date(selectedFullDate.getFullYear(), selectedFullDate.getMonth(), selectedFullDate.getDate(), hours, minutes);
      
      const phoneToSave = (this.clientPhone().trim() || this.auth.user()!.phone || '').substring(0, 20);
      await this.data.createAppointment({
        serviceId: this.selectedService()!.id,
        barberId: this.selectedBarber()!.id,
        userId: this.auth.user()!.uid,
        userName: this.auth.user()!.name,
        ...(phoneToSave ? { userPhone: phoneToSave } : {}),
        userAvatar: this.auth.user()!.avatar,
        barberAvatar: this.selectedBarber()!.avatar,
        date: date,
        status: 'upcoming'
      });
      
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Failed to book:', error);
      this.errorMsg.set('Ocorreu um erro ao confirmar o agendamento. Tente novamente.');
      this.isSubmitting.set(false);
    }
  }
}
