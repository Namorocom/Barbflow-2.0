import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, DecimalPipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from './auth.service';
import { DataService } from './data.service';
import { ThemeService } from './theme.service';
import { NotificationService } from './notification.service';

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, DatePipe, DecimalPipe, RouterLink, CommonModule],
  template: `
    <div class="p-4 sm:p-6 pb-32 sm:pb-10 space-y-8 relative">
      @if (toastMessage()) {
        <div class="fixed top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-zinc-950 px-4 py-2 rounded-full font-bold text-sm shadow-lg z-50 animate-fade-in">
          {{ toastMessage() }}
        </div>
      }

      @if (activeView() === 'main') {
        <!-- Header -->
        <header class="flex flex-col items-center pt-8 pb-6 border-b border-zinc-800">
          <div class="relative mb-4">
            <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-500/50 shadow-xl shadow-amber-500/10">
              <img [src]="auth.user()?.avatar || 'https://picsum.photos/seed/user/200/200'" alt="User" class="w-full h-full object-cover" referrerpolicy="no-referrer">
            </div>
            <button (click)="toggleView('edit')" class="absolute bottom-0 right-0 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-amber-500 border-2 border-zinc-950 hover:bg-zinc-700 transition-colors">
              <mat-icon class="text-[16px] w-[16px] h-[16px]">edit</mat-icon>
            </button>
          </div>
          <h1 class="text-2xl font-bold text-zinc-50 tracking-tight text-center">{{ auth.user()?.name || 'Usuário' }}</h1>
          <p class="text-zinc-400 text-sm mt-1 text-center">{{ auth.user()?.email }}</p>
          <p class="text-zinc-500 text-xs font-mono mt-1 text-center uppercase tracking-widest">{{ auth.user()?.role === 'admin' ? 'Administrador' : (auth.user()?.role === 'barber' ? 'Barbeiro' : 'Cliente') }}</p>
        </header>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-4 max-w-2xl mx-auto w-full">
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <span class="text-2xl font-bold text-amber-500 mb-1">{{ data.appointments().length }}</span>
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Agendamentos</span>
          </div>
          @if (auth.user()?.role === 'barber') {
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span class="text-2xl font-bold text-amber-500 mb-1">
                {{ getMyReviewCount() > 0 ? (getMyRating() | number:'1.1-1') : 'N/D' }}
              </span>
              <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Avaliação</span>
            </div>
          } @else {
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <span class="text-2xl font-bold text-amber-500 mb-1">{{ getCompletedAppointments() }}</span>
              <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Concluídos</span>
            </div>
          }
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <span class="text-2xl font-bold text-amber-500 mb-1">1</span>
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Ano</span>
          </div>
        </div>

        <!-- Menu -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          @if (auth.user()?.role === 'barber') {
            <button (click)="toggleView('financial')" class="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-colors group">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-amber-500 transition-colors">
                  <mat-icon>account_balance_wallet</mat-icon>
                </div>
                <span class="font-medium text-zinc-100">Financeiro</span>
              </div>
              <mat-icon class="text-zinc-600 group-hover:text-amber-500 transition-colors">chevron_right</mat-icon>
            </button>
            <button (click)="toggleView('schedule')" class="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-colors group">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-amber-500 transition-colors">
                  <mat-icon>schedule</mat-icon>
                </div>
                <span class="font-medium text-zinc-100">Horários de Atendimento</span>
              </div>
              <mat-icon class="text-zinc-600 group-hover:text-amber-500 transition-colors">chevron_right</mat-icon>
            </button>
          } @else {
            <button (click)="toggleView('payments')" class="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-colors group">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-amber-500 transition-colors">
                  <mat-icon>payment</mat-icon>
                </div>
                <span class="font-medium text-zinc-100">Histórico de Pagamentos</span>
              </div>
              <mat-icon class="text-zinc-600 group-hover:text-amber-500 transition-colors">chevron_right</mat-icon>
            </button>
          }

          <button (click)="toggleView('history')" class="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-colors group">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-amber-500 transition-colors">
                <mat-icon>history</mat-icon>
              </div>
              <span class="font-medium text-zinc-100">Histórico de Agendamentos</span>
            </div>
            <mat-icon class="text-zinc-600 group-hover:text-amber-500 transition-colors">chevron_right</mat-icon>
          </button>
          
          <a routerLink="/chats" class="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-colors group">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-amber-500 transition-colors">
                <mat-icon>chat</mat-icon>
              </div>
              <span class="font-medium text-zinc-100">Mensagens</span>
            </div>
            <mat-icon class="text-zinc-600 group-hover:text-amber-500 transition-colors">chevron_right</mat-icon>
          </a>
          
          <button (click)="toggleView('favorites')" class="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-colors group">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-amber-500 transition-colors">
                <mat-icon>favorite_border</mat-icon>
              </div>
              <span class="font-medium text-zinc-100">Profissionais Favoritos</span>
            </div>
            <mat-icon class="text-zinc-600 group-hover:text-amber-500 transition-colors">chevron_right</mat-icon>
          </button>
          
          <button (click)="toggleView('notifications')" class="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-colors group">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-amber-500 transition-colors">
                <mat-icon>notifications_none</mat-icon>
              </div>
              <span class="font-medium text-zinc-100">Notificações</span>
            </div>
            <mat-icon class="text-zinc-600 group-hover:text-amber-500 transition-colors">chevron_right</mat-icon>
          </button>
          
          <button (click)="toggleView('settings')" class="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-colors group">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-amber-500 transition-colors">
                <mat-icon>settings</mat-icon>
              </div>
              <span class="font-medium text-zinc-100">Configurações</span>
            </div>
            <mat-icon class="text-zinc-600 group-hover:text-amber-500 transition-colors">chevron_right</mat-icon>
          </button>
        </div>

        <!-- Logout -->
        <div class="flex justify-center mt-8">
          <button (click)="handleLogout()" [disabled]="isLoggingOut()" class="w-full max-w-md flex items-center justify-center gap-2 py-4 text-red-500 font-bold hover:bg-red-500/10 rounded-2xl transition-colors disabled:opacity-50">
            @if (isLoggingOut()) {
              <mat-icon class="animate-spin">refresh</mat-icon> Saindo...
            } @else {
              <mat-icon>logout</mat-icon> Sair da Conta
            }
          </button>
        </div>
      }

      @if (activeView() === 'edit') {
        <header class="flex items-center gap-4 mb-8">
          <button (click)="toggleView('main')" class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="text-2xl font-bold text-zinc-50 tracking-tight">Editar Perfil</h1>
        </header>

        <div class="max-w-xl mx-auto space-y-6">
          <div>
            <label for="editName" class="block text-sm font-medium text-zinc-400 mb-1">Nome</label>
            <input id="editName" type="text" [value]="editName()" (input)="editName.set($any($event.target).value)" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-amber-500/50 transition-colors">
          </div>
          <div>
            <label for="editPhone" class="block text-sm font-medium text-zinc-400 mb-1">Telefone / WhatsApp</label>
            <input id="editPhone" type="tel" [value]="editPhone()" (input)="editPhone.set($any($event.target).value)" placeholder="Ex: +244 923 456 789" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 font-mono focus:outline-none focus:border-amber-500/50 transition-colors">
          </div>
          <div>
            <label for="editLocation" class="block text-sm font-medium text-zinc-400 mb-1">Bairro / Localização</label>
            <div class="flex gap-2">
              <input id="editLocation" type="text" [value]="editLocation()" (input)="editLocation.set($any($event.target).value)" placeholder="Ex: Talatona, Luanda" class="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-amber-500/50 transition-colors">
              <button (click)="getLocation()" class="bg-zinc-800 hover:bg-zinc-700 text-amber-500 px-4 rounded-xl transition-colors flex items-center justify-center" title="Pegar localização atual">
                <mat-icon>my_location</mat-icon>
              </button>
            </div>
            @if (editCoordinates()) {
              <p class="text-xs text-emerald-500 mt-1 flex items-center gap-1"><mat-icon class="text-[14px] w-[14px] h-[14px]">check_circle</mat-icon> Coordenadas salvas</p>
            }
          </div>
          <div>
            <label id="avatar-label" for="avatar-upload" class="block text-sm font-medium text-zinc-400 mb-2">Foto de Perfil</label>
            <div class="flex items-center gap-4">
              @if (editAvatar()) {
                <img [src]="editAvatar()" alt="Preview do Avatar" class="w-16 h-16 rounded-full object-cover border border-zinc-800">
              }
              <label aria-labelledby="avatar-label" for="avatar-upload" class="flex-1 bg-zinc-900 border border-zinc-800 border-dashed rounded-xl px-4 py-3 text-zinc-400 hover:text-amber-500 hover:border-amber-500/50 transition-colors cursor-pointer text-center text-sm">
                <input id="avatar-upload" type="file" accept="image/*" class="hidden" (change)="onAvatarSelected($event)">
                <mat-icon class="align-middle mr-1">cloud_upload</mat-icon> Escolher Foto
              </label>
            </div>
          </div>
          
          <button (click)="saveProfile()" [disabled]="isSaving() || !editName()" class="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 py-4 rounded-xl font-bold text-lg shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 mt-8 disabled:opacity-50">
            @if (isSaving()) {
              <mat-icon class="animate-spin">refresh</mat-icon> Salvando...
            } @else {
              Salvar Alterações
            }
          </button>
        </div>
      }

      @if (activeView() === 'schedule') {
        <header class="flex items-center gap-4 mb-8">
          <button (click)="toggleView('main')" class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-zinc-50 tracking-tight">Horários e Dias de Funcionamento</h1>
            <p class="text-xs text-zinc-400">Configure os dias da semana, expediente e horários disponíveis para agendamentos.</p>
          </div>
        </header>

        <div class="max-w-2xl mx-auto space-y-6">
          <!-- Dias da Semana Disponíveis -->
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-base font-semibold text-zinc-100">Dias da Semana Disponíveis</h2>
                <p class="text-zinc-400 text-xs mt-0.5">Selecione os dias em que você realiza atendimentos.</p>
              </div>
              <span class="text-xs font-mono tabular-nums text-amber-500">{{ editAvailableDays().length }} dias ativos</span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              @for (day of weekDays; track day.id) {
                <button
                  type="button"
                  (click)="toggleDay(day.id)"
                  class="py-3 px-2 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center gap-1"
                  [class.bg-amber-500]="editAvailableDays().includes(day.id)"
                  [class.text-zinc-950]="editAvailableDays().includes(day.id)"
                  [class.border-amber-500]="editAvailableDays().includes(day.id)"
                  [class.bg-zinc-800]="!editAvailableDays().includes(day.id)"
                  [class.text-zinc-400]="!editAvailableDays().includes(day.id)"
                  [class.border-zinc-700]="!editAvailableDays().includes(day.id)">
                  <span class="font-bold">{{ day.short }}</span>
                  <span class="text-[10px] opacity-80">{{ day.name }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Expediente (Horário de Abertura e Fechamento) -->
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 class="text-base font-semibold text-zinc-100">Horário de Funcionamento</h2>
                <p class="text-zinc-400 text-xs mt-0.5">Defina o início e o término do seu expediente diário.</p>
              </div>
              <button
                type="button"
                (click)="applyWorkingHoursRange()"
                class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-500 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap">
                <mat-icon class="text-[15px] w-[15px] h-[15px]">autorenew</mat-icon>
                Preencher horários no intervalo
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="workStart" class="block text-xs font-medium text-zinc-400 mb-1.5">Início do Expediente</label>
                <select
                  id="workStart"
                  [value]="editWorkingStart()"
                  (change)="onWorkingStartChange($any($event.target).value)"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors">
                  @for (time of allTimeSlots; track time) {
                    <option [value]="time">{{ time }}</option>
                  }
                </select>
              </div>
              <div>
                <label for="workEnd" class="block text-xs font-medium text-zinc-400 mb-1.5">Fim do Expediente</label>
                <select
                  id="workEnd"
                  [value]="editWorkingEnd()"
                  (change)="onWorkingEndChange($any($event.target).value)"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors">
                  @for (time of allTimeSlots; track time) {
                    <option [value]="time">{{ time }}</option>
                  }
                </select>
              </div>
            </div>
          </div>

          <!-- Slots de Horários Específicos -->
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-base font-semibold text-zinc-100">Horários para Agendamento</h2>
                <p class="text-zinc-400 text-xs mt-0.5">Ative ou desative horários específicos (ex.: intervalo de almoço).</p>
              </div>
              <span class="text-xs font-mono tabular-nums text-amber-500">{{ editAvailableTimes().length }} horários</span>
            </div>
            
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              @for (time of allTimeSlots; track time) {
                <button
                  type="button"
                  (click)="toggleTime(time)" 
                  class="py-2.5 rounded-xl border text-sm font-mono tabular-nums font-semibold transition-all"
                  [class.bg-amber-500]="editAvailableTimes().includes(time)"
                  [class.text-zinc-950]="editAvailableTimes().includes(time)"
                  [class.border-amber-500]="editAvailableTimes().includes(time)"
                  [class.bg-zinc-800]="!editAvailableTimes().includes(time)"
                  [class.text-zinc-400]="!editAvailableTimes().includes(time)"
                  [class.border-zinc-700]="!editAvailableTimes().includes(time)">
                  {{ time }}
                </button>
              }
            </div>
          </div>

          <!-- Feriados e Dias de Folga (Datas Bloqueadas) -->
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-base font-semibold text-zinc-100">Feriados e Dias de Folga</h2>
                <p class="text-zinc-400 text-xs mt-0.5">Adicione datas específicas em que a agenda ficará automaticamente bloqueada.</p>
              </div>
              <span class="text-xs font-mono tabular-nums text-red-400">{{ editBlockedDates().length }} datas bloqueadas</span>
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
              <input
                type="date"
                [value]="newBlockedDate()"
                [min]="todayIso"
                (input)="newBlockedDate.set($any($event.target).value)"
                class="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors">
              <button
                type="button"
                (click)="addBlockedDate()"
                [disabled]="!newBlockedDate()"
                class="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-amber-500 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap">
                <mat-icon class="text-[18px] w-[18px] h-[18px]">event_busy</mat-icon>
                Bloquear Data
              </button>
            </div>

            @if (editBlockedDates().length > 0) {
              <div class="divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/50">
                @for (bDate of editBlockedDates(); track bDate) {
                  <div class="px-4 py-3 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <mat-icon class="text-red-400 text-[18px] w-[18px] h-[18px]">block</mat-icon>
                      <span class="text-sm font-mono tabular-nums text-zinc-200">{{ formatBlockedDate(bDate) }}</span>
                      <span class="text-xs text-zinc-500">· Agendamento bloqueado</span>
                    </div>
                    <button
                      type="button"
                      (click)="removeBlockedDate(bDate)"
                      class="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center"
                      title="Remover bloqueio">
                      <mat-icon class="text-[18px] w-[18px] h-[18px]">delete_outline</mat-icon>
                    </button>
                  </div>
                }
              </div>
            } @else {
              <div class="border border-zinc-800 border-dashed rounded-xl p-4 text-center">
                <p class="text-xs text-zinc-500">Nenhum feriado ou dia de folga configurado.</p>
              </div>
            }
          </div>
          
          <button (click)="saveProfile()" [disabled]="isSaving()" class="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 py-4 rounded-xl font-bold text-base shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50">
            @if (isSaving()) {
              <mat-icon class="animate-spin">refresh</mat-icon> Salvando Configurações...
            } @else {
              <mat-icon>save</mat-icon> Salvar Horários e Dias de Funcionamento
            }
          </button>
        </div>
      }

      @if (activeView() === 'history') {
        <header class="flex items-center gap-4 mb-8">
          <button (click)="toggleView('main')" class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="text-2xl font-bold text-zinc-50 tracking-tight">Histórico</h1>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (appt of data.appointments(); track appt.id) {
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
              <div class="bg-zinc-800 rounded-xl p-2 flex flex-col items-center justify-center min-w-[50px]">
                <span class="text-[10px] text-zinc-400 uppercase font-bold">{{ appt.date | date:'MMM' }}</span>
                <span class="text-lg font-bold text-amber-500">{{ appt.date | date:'dd' }}</span>
              </div>
              
              @if (getServiceImage(appt.serviceId)) {
                <img [src]="getServiceImage(appt.serviceId)" alt="Serviço" class="w-10 h-10 rounded-xl object-cover border border-zinc-800">
              }
              
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  @if (auth.user()?.role === 'barber' && appt.userAvatar) {
                    <img [src]="appt.userAvatar" alt="Cliente" class="w-6 h-6 rounded-full object-cover border border-zinc-800 shrink-0" referrerpolicy="no-referrer">
                  } @else if (auth.user()?.role === 'client' && (getBarberAvatar(appt.barberId) || appt.barberAvatar)) {
                    <img [src]="getBarberAvatar(appt.barberId) || appt.barberAvatar" alt="Barbeiro" class="w-6 h-6 rounded-full object-cover border border-zinc-800 shrink-0" referrerpolicy="no-referrer">
                  }
                  <h3 class="font-semibold text-zinc-100 text-sm truncate">{{ auth.user()?.role === 'barber' ? appt.userName : getBarberName(appt.barberId) }}</h3>
                </div>
                <p class="text-zinc-400 text-xs truncate">{{ getServiceName(appt.serviceId) }} - {{ appt.status === 'completed' ? 'Concluído' : (appt.status === 'cancelled' ? 'Cancelado' : 'Agendado') }}</p>
              </div>
              <div class="text-right flex flex-col items-end gap-2 shrink-0">
                <div class="flex items-center gap-1 text-amber-500 text-sm font-bold">
                  <mat-icon class="text-[16px] w-[16px] h-[16px]">schedule</mat-icon>
                  {{ appt.date | date:'HH:mm' }}
                </div>
                <div class="flex flex-col gap-1 items-end">
                  @if (auth.user()?.role === 'client' && appt.status === 'completed' && !appt.rating) {
                    <button (click)="openRating(appt)" class="text-xs bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-zinc-950 px-3 py-1 rounded-full font-bold transition-colors">
                      Avaliar
                    </button>
                  }
                  @if (auth.user()?.role === 'client' && appt.status === 'upcoming') {
                    <button (click)="updateStatus(appt.id, 'cancelled')" class="text-xs bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-zinc-950 px-3 py-1 rounded-full font-bold transition-colors">
                      Cancelar
                    </button>
                  }
                  @if (auth.user()?.role === 'barber' && appt.status === 'upcoming') {
                    <div class="flex gap-2">
                      <button (click)="updateStatus(appt.id, 'completed')" class="text-xs bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-zinc-950 px-2 py-1 rounded-md font-bold transition-colors flex items-center justify-center" title="Marcar como concluído">
                        <mat-icon class="text-[16px] w-[16px] h-[16px]">check</mat-icon>
                      </button>
                      <button (click)="updateStatus(appt.id, 'cancelled')" class="text-xs bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-zinc-950 px-2 py-1 rounded-md font-bold transition-colors flex items-center justify-center" title="Cancelar">
                        <mat-icon class="text-[16px] w-[16px] h-[16px]">close</mat-icon>
                      </button>
                    </div>
                  }
                  <a [routerLink]="['/chat', appt.id]" class="text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 px-3 py-1 rounded-full font-bold transition-colors flex items-center gap-1">
                    <mat-icon class="text-[14px] w-[14px] h-[14px]">chat</mat-icon> Chat
                  </a>
                </div>
                @if (appt.rating) {
                  <div class="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <mat-icon class="text-[14px] w-[14px] h-[14px]">star</mat-icon>
                    <span class="text-xs font-bold">{{ appt.rating | number:'1.1-1' }}</span>
                  </div>
                }
              </div>
            </div>
          }
          @if (data.appointments().length === 0) {
            <div class="bg-zinc-900 border border-zinc-800 border-dashed rounded-2xl p-6 text-center col-span-full">
              <mat-icon class="text-zinc-600 mb-2">history</mat-icon>
              <p class="text-zinc-400 text-sm">Nenhum agendamento encontrado.</p>
            </div>
          }
        </div>
      }
      @if (activeView() === 'payments') {
        <header class="flex items-center gap-4 mb-8">
          <button (click)="toggleView('main')" class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="text-2xl font-bold text-zinc-50 tracking-tight">Pagamentos</h1>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (payment of completedTransactions(); track payment.id) {
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-4 flex-1 min-w-0">
                <div class="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                  <mat-icon>check_circle</mat-icon>
                </div>
                <div class="min-w-0">
                  <h3 class="font-semibold text-zinc-100 text-sm truncate">{{ getServiceName(payment.serviceId) }}</h3>
                  <p class="text-zinc-400 text-xs truncate">{{ payment.date | date:"dd 'de' MMMM, yyyy" }}</p>
                </div>
              </div>
              <span class="font-bold text-zinc-100 shrink-0">{{ getServicePrice(payment.serviceId) | number:'1.2-2' }} KZ</span>
            </div>
          }
          @if (completedTransactions().length === 0) {
            <div class="bg-zinc-900 border border-zinc-800 border-dashed rounded-2xl p-6 text-center col-span-full">
              <mat-icon class="text-zinc-600 mb-2">payment</mat-icon>
              <p class="text-zinc-400 text-sm">Nenhum pagamento encontrado.</p>
            </div>
          }
        </div>
      }

      @if (activeView() === 'financial') {
        <header class="flex items-center gap-4 mb-8">
          <button (click)="toggleView('main')" class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="text-2xl font-bold text-zinc-50 tracking-tight">Financeiro</h1>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-4">
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
              <span class="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Lucros (Mês)</span>
              <span class="text-3xl font-bold text-emerald-500">{{ profits() | number:'1.2-2' }} KZ</span>
            </div>
            <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
              <span class="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Despesas (Mês)</span>
              <span class="text-3xl font-bold text-red-500">{{ losses() | number:'1.2-2' }} KZ</span>
            </div>
          </div>

          <div class="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 class="font-bold text-zinc-100 mb-6 flex items-center gap-2">
              <mat-icon class="text-amber-500">list_alt</mat-icon>
              Últimas Transações
            </h3>
            <div class="space-y-4">
              @for (transaction of transactions(); track transaction.id) {
                <div class="flex flex-wrap justify-between items-center gap-2 border-b border-zinc-800 pb-4 last:border-0 last:pb-0">
                  <div class="min-w-0 flex-1">
                    <p class="font-medium text-zinc-100 truncate">{{ getServiceName(transaction.serviceId) }}</p>
                    <p class="text-xs text-zinc-500 truncate">{{ transaction.date | date:'dd/MM/yyyy HH:mm' }}</p>
                  </div>
                  <span class="font-bold shrink-0" [class.text-emerald-500]="transaction.status === 'completed'" [class.text-red-500]="transaction.status === 'cancelled'">
                    {{ transaction.status === 'completed' ? '+' : '-' }} {{ getServicePrice(transaction.serviceId) | number:'1.2-2' }} KZ
                  </span>
                </div>
              }
              @if (transactions().length === 0) {
                <p class="text-zinc-500 text-sm text-center py-4">Nenhuma transação encontrada.</p>
              }
            </div>
          </div>
        </div>
      }

      @if (activeView() === 'favorites') {
        <header class="flex items-center gap-4 mb-8">
          <button (click)="toggleView('main')" class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="text-2xl font-bold text-zinc-50 tracking-tight">Favoritos</h1>
        </header>

        <div class="max-w-2xl mx-auto">
          <div class="bg-zinc-900 border border-zinc-800 border-dashed rounded-2xl p-12 text-center">
            <mat-icon class="text-zinc-600 text-5xl mb-4">favorite_border</mat-icon>
            <p class="text-zinc-400 text-lg">Você ainda não tem profissionais favoritos.</p>
            <a routerLink="/home" class="inline-block mt-6 bg-amber-500 text-zinc-950 px-8 py-3 rounded-xl font-bold hover:bg-amber-400 transition-colors">
              Encontrar Barbeiros
            </a>
          </div>
        </div>
      }

      @if (activeView() === 'notifications') {
        <header class="flex items-center gap-4 mb-8">
          <button (click)="toggleView('main')" class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="text-2xl font-bold text-zinc-50 tracking-tight">Notificações</h1>
        </header>

        <div class="max-w-3xl mx-auto space-y-4">
          @if (data.notifications().length > 0) {
            @for (notif of data.notifications(); track notif.id) {
              <div class="bg-zinc-900 border rounded-2xl p-6 flex items-start gap-4 transition-colors" [class]="notif.read ? 'border-zinc-800' : 'border-amber-500/50 bg-zinc-900/80'">
                <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                     [class]="notif.type === 'new_message' ? 'bg-blue-500/10 text-blue-500' : (notif.type === 'chat_started' || notif.type === 'appointment_created' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500')">
                  <mat-icon>{{ notif.type === 'new_message' ? 'chat' : (notif.type === 'chat_started' ? 'forum' : (notif.type === 'appointment_created' ? 'event_available' : (notif.type === 'appointment_reminder' ? 'alarm' : 'notifications'))) }}</mat-icon>
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-zinc-100 text-base flex items-center gap-2">
                    {{ notif.title }}
                    @if (!notif.read) {
                      <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                    }
                  </h3>
                  <p class="text-zinc-400 text-sm mt-1">{{ notif.body }}</p>
                  <div class="flex items-center justify-between mt-3">
                    <span class="text-xs text-zinc-500 font-mono">{{ notif.createdAt | date:'dd/MM HH:mm' }}</span>
                    <div class="flex items-center gap-3">
                      @if (notif.type === 'new_message' || notif.type === 'chat_started') {
                        <a [routerLink]="['/chat', notif.relatedId]" class="text-xs text-amber-500 font-bold hover:underline" (click)="markAsRead(notif.id)">Ver Chat</a>
                      }
                      @if (!notif.read) {
                        <button class="text-xs text-zinc-400 hover:text-zinc-100 transition-colors" (click)="markAsRead(notif.id)">Marcar como lida</button>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }
          } @else {
            <div class="bg-zinc-900 border border-zinc-800 border-dashed rounded-2xl p-12 text-center">
              <mat-icon class="text-zinc-600 text-5xl mb-4">notifications_none</mat-icon>
              <p class="text-zinc-400 text-lg">Você não tem notificações.</p>
            </div>
          }
        </div>
      }

      @if (activeView() === 'settings') {
        <header class="flex items-center gap-4 mb-8">
          <button (click)="toggleView('main')" class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="text-2xl font-bold text-zinc-50 tracking-tight">Configurações</h1>
        </header>

        <div class="max-w-2xl mx-auto space-y-3">
          @if (auth.user()?.role === 'barber') {
            <button (click)="toggleView('schedule')" class="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between hover:border-amber-500/40 transition-colors group text-left">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <mat-icon>calendar_month</mat-icon>
                </div>
                <div>
                  <span class="font-medium text-zinc-100 block">Horário de Funcionamento, Dias e Folgas</span>
                  <span class="text-xs text-zinc-400">Configurar expediente, dias da semana e bloquear feriados/folgas</span>
                </div>
              </div>
              <mat-icon class="text-zinc-500 group-hover:text-amber-500 transition-colors">chevron_right</mat-icon>
            </button>
          }

          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-amber-500">
                  <mat-icon>notifications_active</mat-icon>
                </div>
                <div>
                  <span class="font-medium text-zinc-100 block">Notificações Push (Firebase Cloud Messaging)</span>
                  <span class="text-xs text-zinc-400">
                    {{ auth.user()?.role === 'barber' ? 'Alertas imediatos de novos pedidos de agendamento' : 'Lembretes automáticos antes do seu horário agendado' }}
                  </span>
                </div>
              </div>
              <div tabindex="0" class="w-12 h-6 rounded-full relative cursor-pointer transition-colors shrink-0" [class.bg-amber-500]="notificationService.notificationsEnabled()" [class.bg-zinc-700]="!notificationService.notificationsEnabled()" (click)="toggleNotifications()" (keydown.enter)="toggleNotifications()">
                <div class="w-4 h-4 bg-zinc-950 rounded-full absolute top-1 transition-all" [class.right-1]="notificationService.notificationsEnabled()" [class.left-1]="!notificationService.notificationsEnabled()"></div>
              </div>
            </div>

            <div class="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div class="text-xs text-zinc-400 flex items-center gap-2">
                <span>Status FCM:</span>
                <span class="font-mono"
                      [class.text-emerald-400]="notificationService.notificationsEnabled()"
                      [class.text-zinc-500]="!notificationService.notificationsEnabled()">
                  {{ notificationService.notificationsEnabled() ? 'Ativo (Tempo Real + Push)' : 'Pausado' }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                @if (notificationService.fcmStatus() === 'default') {
                  <button type="button" (click)="enableBrowserPush()" class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5">
                    <mat-icon class="text-[15px] w-[15px] h-[15px]">perm_device_information</mat-icon>
                    Autorizar Navegador
                  </button>
                }
                <button type="button" (click)="testPushNotification()" class="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-zinc-950 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5">
                  <mat-icon class="text-[15px] w-[15px] h-[15px]">send</mat-icon>
                  Testar Push Agora
                </button>
              </div>
            </div>
          </div>
          
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                <mat-icon>dark_mode</mat-icon>
              </div>
              <span class="font-medium text-zinc-100">Tema Escuro</span>
            </div>
            <div tabindex="0" class="w-12 h-6 rounded-full relative cursor-pointer transition-colors" [class.bg-amber-500]="theme.darkModeEnabled()" [class.bg-zinc-700]="!theme.darkModeEnabled()" (click)="toggleDarkMode()" (keydown.enter)="toggleDarkMode()">
              <div class="w-4 h-4 bg-zinc-950 rounded-full absolute top-1 transition-all" [class.right-1]="theme.darkModeEnabled()" [class.left-1]="!theme.darkModeEnabled()"></div>
            </div>
          </div>

          <div class="pt-4 space-y-2">
            <button (click)="showToast('Termos de Uso')" class="w-full flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <mat-icon>description</mat-icon>
                </div>
                <span class="font-medium text-zinc-100">Termos de Uso</span>
              </div>
              <mat-icon class="text-zinc-600">chevron_right</mat-icon>
            </button>

            <button (click)="showToast('Política de Privacidade')" class="w-full flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <mat-icon>privacy_tip</mat-icon>
                </div>
                <span class="font-medium text-zinc-100">Política de Privacidade</span>
              </div>
              <mat-icon class="text-zinc-600">chevron_right</mat-icon>
            </button>
          </div>
        </div>
      }

      <!-- Rating Modal -->
      @if (ratingAppointment()) {
        <div class="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in-bg">
          <div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-slide-up">
            <h2 class="text-2xl font-bold text-zinc-50 mb-2 text-center">Avaliar Atendimento</h2>
            <p class="text-zinc-400 text-sm text-center mb-8">Como foi o seu corte com {{ getBarberName(ratingAppointment()?.barberId || '') }}?</p>
            
            <div class="flex justify-center gap-3 mb-8">
              @for (star of [1, 2, 3, 4, 5]; track star) {
                <button (click)="setRating(star)" class="transition-all hover:scale-110 active:scale-95 flex items-center justify-center" [class.text-amber-500]="star <= ratingValue()" [class.text-zinc-700]="star > ratingValue()">
                  <mat-icon class="!text-[48px] !w-[48px] !h-[48px] leading-none">{{ star <= ratingValue() ? 'star' : 'star_border' }}</mat-icon>
                </button>
              }
            </div>
            
            <textarea [value]="ratingReview()" (input)="ratingReview.set($any($event.target).value)" placeholder="Deixe um comentário (opcional)" rows="4" class="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-4 text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors resize-none mb-8"></textarea>
            
            <div class="flex gap-4">
              <button (click)="closeRating()" class="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-4 rounded-xl font-bold transition-colors">Cancelar</button>
              <button (click)="submitRating()" [disabled]="isSaving()" class="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 py-4 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center">
                @if (isSaving()) {
                  <mat-icon class="animate-spin">refresh</mat-icon>
                } @else {
                  Enviar
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in-bg {
      animation: fadeInBg 0.3s ease-out forwards;
    }
    .animate-slide-up {
      animation: slideUp 0.3s ease-out forwards;
    }
    @keyframes fadeInBg {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ProfileComponent {
  auth = inject(AuthService);
  data = inject(DataService);
  theme = inject(ThemeService);
  notificationService = inject(NotificationService);
  toastMessage = signal<string | null>(null);

  activeView = signal<'main' | 'edit' | 'history' | 'favorites' | 'notifications' | 'settings' | 'payments' | 'financial' | 'schedule'>('main');
  editName = signal('');
  editPhone = signal('');
  editAvatar = signal('');
  editLocation = signal('');
  editCoordinates = signal<{lat: number, lng: number} | null>(null);
  editAvailableTimes = signal<string[]>([]);
  editAvailableDays = signal<number[]>([1, 2, 3, 4, 5, 6]);
  editWorkingStart = signal<string>('09:00');
  editWorkingEnd = signal<string>('19:00');
  editBlockedDates = signal<string[]>([]);
  newBlockedDate = signal<string>('');
  readonly todayIso = new Date().toISOString().split('T')[0];
  isSaving = signal(false);
  isLoggingOut = signal(false);

  readonly weekDays = [
    { id: 0, short: 'Dom', name: 'Domingo' },
    { id: 1, short: 'Seg', name: 'Segunda' },
    { id: 2, short: 'Ter', name: 'Terça' },
    { id: 3, short: 'Qua', name: 'Quarta' },
    { id: 4, short: 'Qui', name: 'Quinta' },
    { id: 5, short: 'Sex', name: 'Sexta' },
    { id: 6, short: 'Sáb', name: 'Sábado' }
  ];

  readonly allTimeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
  ];
  
  ratingAppointment = signal<import('./data').Appointment | null>(null);
  ratingValue = signal<number>(5);
  ratingReview = signal<string>('');

  async handleLogout() {
    this.isLoggingOut.set(true);
    await this.auth.logout();
    this.isLoggingOut.set(false);
  }

  isPast(date: Date): boolean {
    return date.getTime() < new Date().getTime();
  }

  getMyRating(): number {
    const uid = this.auth.user()?.uid;
    if (!uid) return 0;
    const barber = this.data.barbers().find(b => b.id === uid);
    return barber?.rating || 0;
  }

  getMyReviewCount(): number {
    const uid = this.auth.user()?.uid;
    if (!uid) return 0;
    const barber = this.data.barbers().find(b => b.id === uid);
    return barber?.reviewCount || 0;
  }

  getCompletedAppointments(): number {
    return this.data.appointments().filter(a => a.status === 'completed').length;
  }

  async markAsRead(notificationId: string) {
    await this.data.markNotificationAsRead(notificationId);
  }

  async updateStatus(appointmentId: string, status: 'completed' | 'cancelled') {
    try {
      await this.data.updateAppointmentStatus(appointmentId, status);
      this.showToast(`Agendamento ${status === 'completed' ? 'concluído' : 'cancelado'}!`);
    } catch {
      this.showToast('Erro ao atualizar agendamento.');
    }
  }

  openRating(appt: import('./data').Appointment) {
    this.ratingAppointment.set(appt);
    this.ratingValue.set(5);
    this.ratingReview.set('');
  }

  closeRating() {
    this.ratingAppointment.set(null);
  }

  setRating(val: number) {
    this.ratingValue.set(val);
  }

  async submitRating() {
    const appt = this.ratingAppointment();
    if (!appt) return;
    
    this.isSaving.set(true);
    try {
      if (appt.status !== 'completed') {
        await this.data.updateAppointmentStatus(appt.id, 'completed');
      }
      await this.data.rateAppointment(appt.id, appt.barberId, this.ratingValue(), this.ratingReview());
      this.showToast('Avaliação enviada com sucesso!');
      this.closeRating();
    } catch {
      this.showToast('Erro ao enviar avaliação.');
    } finally {
      this.isSaving.set(false);
    }
  }

  toggleNotifications() {
    const isEnabled = this.notificationService.toggleNotifications();
    this.showToast(isEnabled ? 'Notificações Push ativadas' : 'Notificações Push desativadas');
  }

  async enableBrowserPush() {
    const granted = await this.notificationService.requestPushPermission();
    this.showToast(granted ? 'Permissão de Push concedida!' : 'Permissão não concedida pelo navegador.');
  }

  async testPushNotification() {
    await this.notificationService.sendTestPushNotification();
  }

  toggleDarkMode() {
    this.theme.toggleDarkMode();
    this.showToast(this.theme.darkModeEnabled() ? 'Tema escuro ativado' : 'Tema claro ativado');
  }

  toggleView(view: 'main' | 'edit' | 'history' | 'favorites' | 'notifications' | 'settings' | 'payments' | 'financial' | 'schedule') {
    this.activeView.set(view);
    if (view === 'edit' || view === 'schedule') {
      const u = this.auth.user();
      this.editName.set(u?.name || '');
      this.editPhone.set(u?.phone || '');
      this.editAvatar.set(u?.avatar || '');
      this.editLocation.set(u?.locationName || '');
      this.editCoordinates.set(u?.coordinates || null);
      this.editAvailableTimes.set(u?.availableTimes || ['09:00', '10:00', '11:00', '13:30', '14:30', '15:30', '16:30', '18:00']);
      this.editAvailableDays.set(u?.availableDays ?? [1, 2, 3, 4, 5, 6]);
      this.editWorkingStart.set(u?.workingHours?.start || '09:00');
      this.editWorkingEnd.set(u?.workingHours?.end || '19:00');
      this.editBlockedDates.set(u?.blockedDates || []);
      this.newBlockedDate.set('');
    }
  }

  addBlockedDate() {
    const dateVal = this.newBlockedDate().trim();
    if (!dateVal) return;
    const current = this.editBlockedDates();
    if (current.includes(dateVal)) {
      this.showToast('Esta data já está bloqueada.');
      return;
    }
    if (current.length >= 100) {
      this.showToast('Limite máximo de datas bloqueadas atingido.');
      return;
    }
    this.editBlockedDates.set([...current, dateVal].sort());
    this.newBlockedDate.set('');
  }

  removeBlockedDate(dateVal: string) {
    this.editBlockedDates.set(this.editBlockedDates().filter(d => d !== dateVal));
  }

  formatBlockedDate(isoDate: string): string {
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  toggleDay(dayId: number) {
    const current = this.editAvailableDays();
    if (current.includes(dayId)) {
      this.editAvailableDays.set(current.filter(d => d !== dayId));
    } else {
      this.editAvailableDays.set([...current, dayId].sort((a, b) => a - b));
    }
  }

  onWorkingStartChange(val: string) {
    this.editWorkingStart.set(val);
  }

  onWorkingEndChange(val: string) {
    this.editWorkingEnd.set(val);
  }

  applyWorkingHoursRange() {
    const start = this.editWorkingStart();
    const end = this.editWorkingEnd();
    const startIdx = this.allTimeSlots.indexOf(start);
    const endIdx = this.allTimeSlots.indexOf(end);
    if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
      const slots = this.allTimeSlots.slice(startIdx, endIdx + 1);
      this.editAvailableTimes.set(slots);
      this.showToast('Horários preenchidos conforme o expediente!');
    } else {
      this.showToast('O horário de início deve ser anterior ao término.');
    }
  }

  toggleTime(time: string) {
    const current = this.editAvailableTimes();
    if (current.includes(time)) {
      this.editAvailableTimes.set(current.filter(t => t !== time));
    } else {
      this.editAvailableTimes.set([...current, time].sort());
    }
  }

  getLocation() {
    if (navigator.geolocation) {
      this.showToast('Obtendo localização...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.editCoordinates.set({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          this.showToast('Coordenadas obtidas com sucesso!');
        },
        (error) => {
          console.error('Error getting location:', error);
          this.showToast('Erro ao obter localização. Verifique as permissões.');
        }
      );
    } else {
      this.showToast('Geolocalização não suportada pelo seu navegador.');
    }
  }

  async saveProfile() {
    if (!this.auth.user()) return;
    this.isSaving.set(true);
    try {
      let avatarUrl = this.editAvatar().trim();
      if (!avatarUrl || (!avatarUrl.startsWith('http://') && !avatarUrl.startsWith('https://') && !avatarUrl.startsWith('data:image'))) {
        avatarUrl = 'https://picsum.photos/seed/user/200/200';
      }
      await this.auth.updateProfile(
        this.editName(),
        avatarUrl,
        this.editLocation(),
        this.editCoordinates() || undefined,
        this.editAvailableTimes(),
        this.editAvailableDays(),
        { start: this.editWorkingStart(), end: this.editWorkingEnd() },
        this.editBlockedDates(),
        this.editPhone()
      );
      this.showToast('Configurações atualizadas com sucesso!');
      this.toggleView('main');
    } catch {
      this.showToast('Erro ao atualizar configurações. Verifique os dados.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      try {
        const base64 = await this.processImage(input.files[0]);
        this.editAvatar.set(base64);
      } catch {
        this.showToast('Erro ao processar a imagem.');
      }
    }
  }

  processImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  showToast(message: string) {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 3000);
  }

  getBarberName(barberId: string): string {
    const barber = this.data.barbers().find(b => b.id === barberId);
    return barber ? barber.name : 'Barbeiro';
  }

  getBarberAvatar(barberId: string): string | null {
    const barber = this.data.barbers().find(b => b.id === barberId);
    return barber?.avatar || null;
  }

  transactions = computed(() => {
    return this.data.appointments()
      .filter(a => a.status === 'completed' || a.status === 'cancelled')
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  completedTransactions = computed(() => {
    return this.transactions().filter(t => t.status === 'completed');
  });

  profits = computed(() => {
    return this.data.appointments()
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + this.getServicePrice(a.serviceId), 0);
  });

  losses = computed(() => {
    return this.data.appointments()
      .filter(a => a.status === 'cancelled')
      .reduce((sum, a) => sum + this.getServicePrice(a.serviceId), 0);
  });

  getServiceName(serviceId: string): string {
    const service = this.data.services().find(s => s.id === serviceId);
    return service ? service.name : 'Serviço';
  }

  getServicePrice(serviceId: string): number {
    const service = this.data.services().find(s => s.id === serviceId);
    return service ? service.price : 0;
  }

  getServiceImage(serviceId: string): string | null {
    const service = this.data.services().find(s => s.id === serviceId);
    return service?.imageUrl || null;
  }
}
