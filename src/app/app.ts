import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './auth.service';
import { FormsModule } from '@angular/forms';
import { ThemeService } from './theme.service';
import { DataService } from './data.service';
import { ImageViewerService } from './image-viewer.service';
import { NotificationService } from './notification.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, FormsModule],
  template: `
    <div class="flex absolute inset-0 bg-zinc-950 text-zinc-50 font-sans overflow-hidden overscroll-y-auto">
      <!-- Real-Time FCM Push Notification Banner -->
      @if (notificationService.activePushToast(); as push) {
        <div class="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[110] bg-zinc-900 border border-amber-500/40 rounded-2xl p-4 shadow-2xl flex items-start gap-3.5 animate-fade-in">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
               [class.bg-amber-500]="push.type === 'appointment_created' || push.type === 'appointment_reminder'"
               [class.text-zinc-950]="push.type === 'appointment_created' || push.type === 'appointment_reminder'"
               [class.bg-zinc-800]="push.type !== 'appointment_created' && push.type !== 'appointment_reminder'"
               [class.text-amber-500]="push.type !== 'appointment_created' && push.type !== 'appointment_reminder'">
            <mat-icon>{{ push.type === 'appointment_created' ? 'event_available' : (push.type === 'appointment_reminder' ? 'alarm' : 'notifications_active') }}</mat-icon>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] font-mono text-amber-500">Push · Firebase Cloud Messaging</span>
              <button type="button" (click)="notificationService.dismissToast()" class="text-zinc-500 hover:text-zinc-200 transition-colors">
                <mat-icon class="text-[16px] w-[16px] h-[16px]">close</mat-icon>
              </button>
            </div>
            <h4 class="text-sm font-semibold text-zinc-100 truncate mt-0.5">{{ push.title }}</h4>
            <p class="text-xs text-zinc-400 mt-1 leading-relaxed">{{ push.body }}</p>
          </div>
        </div>
      }
      
      @if (!auth.isReady()) {
        <div class="flex-1 flex items-center justify-center">
          <mat-icon class="animate-spin text-amber-500 text-[48px] w-[48px] h-[48px]">refresh</mat-icon>
        </div>
      } @else if (!auth.user()) {
        <div class="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center space-y-6 overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-zinc-950 to-zinc-950">
          <div class="w-full max-w-sm sm:max-w-md lg:max-w-4xl mx-auto flex flex-col lg:flex-row bg-zinc-900/40 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] border border-zinc-800/50 shadow-2xl overflow-hidden">
            
            <!-- Left Side / Branding (Hidden on mobile, visible on lg) -->
            <div class="hidden lg:flex lg:w-1/2 bg-zinc-900 flex-col items-center justify-center p-12 border-r border-zinc-800/50 relative overflow-hidden">
              <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent opacity-50"></div>
              <div class="w-32 h-32 bg-amber-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-amber-500/20 mb-8 rotate-3 hover:rotate-0 transition-transform duration-500 relative z-10">
                <mat-icon class="text-zinc-950 text-[64px] w-[64px] h-[64px]">content_cut</mat-icon>
              </div>
              <h1 class="text-5xl font-black text-zinc-50 tracking-tighter mb-4 uppercase relative z-10">Barbflow</h1>
              <p class="text-zinc-400 text-lg font-medium relative z-10 text-center">Gerencie seus agendamentos, clientes e serviços em um só lugar.</p>
            </div>

            <!-- Right Side / Form -->
            <div class="w-full lg:w-1/2 p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8 flex flex-col justify-center overflow-y-auto max-h-[85vh] lg:max-h-none">
              <div class="space-y-4 lg:hidden shrink-0">
                <div class="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/20 mx-auto rotate-3 hover:rotate-0 transition-transform duration-500">
                  <mat-icon class="text-zinc-950 text-[40px] w-[40px] h-[40px]">content_cut</mat-icon>
                </div>
                <div>
                  <h1 class="text-4xl font-black text-zinc-50 tracking-tighter mb-1 uppercase">Barbflow</h1>
                  <p class="text-zinc-400 text-sm font-medium">Sua barbearia na palma da mão.</p>
                </div>
              </div>
              
              <div class="w-full space-y-4">
              
              @if (isRegistering()) {
                <div class="relative group">
                  <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors">person</mat-icon>
                  <input type="text" [(ngModel)]="name" placeholder="Nome completo" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-zinc-200 focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 transition-all">
                </div>
              }
              
              <div class="relative group">
                <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors">email</mat-icon>
                <input type="email" [(ngModel)]="email" placeholder="Email" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-zinc-200 focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 transition-all">
              </div>
              
              @if (!isResettingPassword()) {
                <div class="relative group">
                  <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors">lock</mat-icon>
                  <input [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" placeholder="Senha" class="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl pl-12 pr-12 py-4 text-zinc-200 focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 transition-all">
                  <button type="button" (click)="showPassword.set(!showPassword())" class="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-amber-500 transition-colors focus:outline-none">
                    <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </div>
              }
              
              @if (isRegistering() && !isResettingPassword()) {
                <div class="flex items-center gap-3 py-2 px-2">
                  <div class="relative flex items-center">
                    <input type="checkbox" id="isBarber" [(ngModel)]="isBarber" class="peer w-6 h-6 opacity-0 absolute cursor-pointer">
                    <div class="w-6 h-6 border-2 border-zinc-700 rounded-lg peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all flex items-center justify-center">
                      <mat-icon class="text-zinc-950 text-[16px] w-[16px] h-[16px] scale-0 peer-checked:scale-100 transition-transform">check</mat-icon>
                    </div>
                  </div>
                  <label for="isBarber" class="text-sm text-zinc-400 font-medium cursor-pointer select-none">Quero me cadastrar como Barbeiro</label>
                </div>
              }

              @if (errorMsg()) {
                <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3">
                  <mat-icon class="text-red-400 text-[20px] w-[20px] h-[20px]">error_outline</mat-icon>
                  <p class="text-red-400 text-xs font-medium">{{ errorMsg() }}</p>
                </div>
              }
              @if (successMsg()) {
                <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
                  <mat-icon class="text-emerald-400 text-[20px] w-[20px] h-[20px]">check_circle_outline</mat-icon>
                  <p class="text-emerald-400 text-xs font-medium">{{ successMsg() }}</p>
                </div>
              }

              @if (isResettingPassword()) {
                <button (click)="handleResetPassword()" [disabled]="isLoading()" class="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95">
                  @if (isLoading()) {
                    <mat-icon class="animate-spin">refresh</mat-icon>
                  }
                  Recuperar Senha
                </button>
                <button (click)="toggleResetPassword()" [disabled]="isLoading()" class="w-full bg-transparent text-zinc-500 hover:text-zinc-200 py-2 rounded-xl font-bold transition-all disabled:opacity-70 text-sm">
                  Voltar para o Login
                </button>
              } @else {
                <button (click)="handleEmailAuth()" [disabled]="isLoading()" class="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95">
                  @if (isLoading()) {
                    <mat-icon class="animate-spin">refresh</mat-icon>
                  }
                  {{ isRegistering() ? 'Criar Conta' : 'Entrar' }}
                </button>
                
                @if (!isRegistering()) {
                  <div class="text-center">
                    <button (click)="toggleResetPassword()" [disabled]="isLoading()" class="text-xs text-zinc-500 hover:text-amber-500 transition-colors disabled:opacity-70 font-medium">
                      Esqueci minha senha
                    </button>
                  </div>
                }
                
                <div class="flex items-center gap-4 py-2">
                  <div class="flex-1 h-px bg-zinc-800/50"></div>
                  <span class="text-[10px] text-zinc-600 uppercase font-black tracking-widest">OU</span>
                  <div class="flex-1 h-px bg-zinc-800/50"></div>
                </div>

                <button (click)="handleGoogleAuth()" [disabled]="isLoading()" class="w-full bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-zinc-200 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-70 active:scale-95">
                  @if (isLoading()) {
                    <mat-icon class="animate-spin">refresh</mat-icon>
                  } @else {
                    <img src="https://www.google.com/favicon.ico" class="w-5 h-5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" alt="Google">
                  }
                  Google
                </button>

                <p class="text-xs text-zinc-500 pt-4 font-medium">
                  {{ isRegistering() ? 'Já tem uma conta?' : 'Ainda não tem conta?' }}
                  <button (click)="toggleMode()" class="text-amber-500 hover:text-amber-400 font-bold ml-1">
                    {{ isRegistering() ? 'Entrar' : 'Cadastrar' }}
                  </button>
                </p>
              }
              </div>
            </div>
          </div>
        </div>
      } @else {
        <!-- Sidebar for Desktop -->
        <aside class="hidden md:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800 p-6 z-50">
          <div class="flex items-center gap-3 mb-10">
            <div class="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <mat-icon class="text-zinc-950">content_cut</mat-icon>
            </div>
            <h1 class="text-xl font-bold tracking-tight">Barbflow</h1>
          </div>
          
          <nav class="flex-1 space-y-2">
            <a routerLink="/home" routerLinkActive="bg-amber-500/10 text-amber-500" [routerLinkActiveOptions]="{exact: true}" class="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all group">
              <mat-icon>{{ auth.user()?.role === 'barber' ? 'dashboard' : 'home' }}</mat-icon>
              <span class="font-medium">{{ auth.user()?.role === 'barber' ? 'Dashboard' : 'Início' }}</span>
            </a>
            <a routerLink="/services" routerLinkActive="bg-amber-500/10 text-amber-500" class="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all group">
              <mat-icon>content_cut</mat-icon>
              <span class="font-medium">Serviços</span>
            </a>
            <a routerLink="/booking" routerLinkActive="bg-amber-500/10 text-amber-500" class="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all group">
              <mat-icon>calendar_month</mat-icon>
              <span class="font-medium">Agendar</span>
            </a>
            <a routerLink="/profile" routerLinkActive="bg-amber-500/10 text-amber-500" class="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all group">
              <mat-icon>person</mat-icon>
              <span class="font-medium">Perfil</span>
            </a>
          </nav>
          
          <div class="pt-6 border-t border-zinc-800">
            <button (click)="handleLogout()" [disabled]="isLoggingOut()" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all disabled:opacity-50">
              @if (isLoggingOut()) {
                <mat-icon class="animate-spin">refresh</mat-icon>
              } @else {
                <mat-icon>logout</mat-icon>
              }
              <span class="font-medium">Sair</span>
            </button>
          </div>
        </aside>

        <!-- Main Content Area -->
        <div class="flex-1 flex flex-col relative overflow-hidden">
          <main class="flex-1 overflow-y-auto scroll-smooth touch-pan-y relative pb-20 md:pb-0">
            <div class="max-w-7xl mx-auto w-full">
              <router-outlet></router-outlet>
            </div>
            
            <!-- Global Floating Action Buttons -->
            <div class="fixed bottom-24 md:bottom-8 right-4 md:right-8 flex flex-col gap-3 z-[60] items-end pointer-events-none">
              @if (auth.user()?.role === 'barber') {
                <input type="file" #feedPhotoInput class="hidden" accept="image/*" (change)="uploadToFeed($event)">
                <button (click)="feedPhotoInput.click()" [disabled]="isUploadingFeed()" class="pointer-events-auto bg-amber-500 hover:bg-amber-400 text-zinc-950 p-4 rounded-full shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center group relative cursor-pointer" title="Postar Foto">
                  @if (isUploadingFeed()) {
                    <mat-icon class="animate-spin">refresh</mat-icon>
                  } @else {
                    <mat-icon>add_a_photo</mat-icon>
                  }
                  <span class="absolute right-full mr-4 bg-zinc-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity text-zinc-100 shadow-xl pointer-events-none hidden md:block">Postar na Vitrine</span>
                </button>
              }
              <a routerLink="/chats" class="pointer-events-auto bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 p-4 rounded-full shadow-xl transition-all flex items-center justify-center group relative" title="Mensagens">
                <mat-icon>chat</mat-icon>
                <span class="absolute right-full mr-4 bg-zinc-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity text-zinc-100 shadow-xl pointer-events-none hidden md:block">Mensagens</span>
              </a>
            </div>
          </main>

          <!-- Bottom Navigation Bar (Mobile Only) -->
          <nav class="md:hidden fixed bottom-0 left-0 w-full bg-zinc-900/80 backdrop-blur-lg border-t border-zinc-800 px-6 py-3 flex justify-between items-center z-50">
            <a routerLink="/home" routerLinkActive="text-amber-500" [routerLinkActiveOptions]="{exact: true}" class="flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors">
              <mat-icon class="text-[24px] w-[24px] h-[24px]">{{ auth.user()?.role === 'barber' ? 'dashboard' : 'home' }}</mat-icon>
              <span class="text-[10px] font-medium uppercase tracking-wider">{{ auth.user()?.role === 'barber' ? 'Painel' : 'Início' }}</span>
            </a>
            <a routerLink="/services" routerLinkActive="text-amber-500" class="flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors">
              <mat-icon class="text-[24px] w-[24px] h-[24px]">content_cut</mat-icon>
              <span class="text-[10px] font-medium uppercase tracking-wider">Serviços</span>
            </a>
            <a routerLink="/booking" routerLinkActive="text-amber-500" class="flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors relative">
              <div class="absolute -top-6 bg-amber-500 text-zinc-950 p-3 rounded-full shadow-lg shadow-amber-500/20">
                <mat-icon class="text-[28px] w-[28px] h-[28px]">calendar_month</mat-icon>
              </div>
              <span class="text-[10px] font-medium uppercase tracking-wider mt-8">Agendar</span>
            </a>
            <a routerLink="/profile" routerLinkActive="text-amber-500" class="flex flex-col items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors">
              <mat-icon class="text-[24px] w-[24px] h-[24px]">person</mat-icon>
              <span class="text-[10px] font-medium uppercase tracking-wider">Perfil</span>
            </a>
          </nav>
        </div>
      }

      <!-- Global Image Viewer Modal -->
      @if (imageViewer.isOpen()) {
        <div class="fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-sm flex flex-col animate-fade-in touch-none">
          <div class="flex items-center justify-between p-4 bg-zinc-950/40 sticky top-0">
            <button (click)="imageViewer.close()" class="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors">
              <mat-icon>close</mat-icon>
            </button>
            @if (imageViewer.canDelete()) {
              <button (click)="imageViewer.triggerDelete()" [disabled]="imageViewer.loadingDelete()" class="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                @if (imageViewer.loadingDelete()) {
                  <mat-icon class="animate-spin text-[20px] w-[20px] h-[20px]">refresh</mat-icon>
                } @else {
                  <mat-icon class="text-[20px] w-[20px] h-[20px]">delete</mat-icon>
                }
              </button>
            }
          </div>
          <div class="flex-1 overflow-auto flex items-center justify-center p-4">
            <img [src]="imageViewer.imageUrl()" class="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm" referrerpolicy="no-referrer">
          </div>
        </div>
      }
    </div>
  `,
})
export class App {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  imageViewer = inject(ImageViewerService);
  notificationService = inject(NotificationService);
  private dataService = inject(DataService);
  
  isRegistering = signal(false);
  isResettingPassword = signal(false);
  showPassword = signal(false);
  email = signal('');
  password = signal('');
  name = signal('');
  isBarber = signal(false);
  errorMsg = signal('');
  successMsg = signal('');
  isLoading = signal(false);
  isLoggingOut = signal(false);
  isUploadingFeed = signal(false);

  constructor() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('chunk-reload');
    }
  }

  async uploadToFeed(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    this.isUploadingFeed.set(true);
    
    try {
      await this.dataService.uploadGalleryPhoto(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Erro ao postar foto.');
    } finally {
      this.isUploadingFeed.set(false);
      input.value = '';
    }
  }

  async handleLogout() {
    this.isLoggingOut.set(true);
    await this.auth.logout();
    this.isLoggingOut.set(false);
  }

  toggleMode() {
    this.isRegistering.set(!this.isRegistering());
    this.errorMsg.set('');
    this.successMsg.set('');
    this.isResettingPassword.set(false);
  }

  toggleResetPassword() {
    this.isResettingPassword.set(!this.isResettingPassword());
    this.errorMsg.set('');
    this.successMsg.set('');
  }

  async handleResetPassword() {
    this.errorMsg.set('');
    this.successMsg.set('');
    if (!this.email()) {
      this.errorMsg.set('Preencha seu email.');
      return;
    }
    this.isLoading.set(true);
    try {
      await this.auth.resetPassword(this.email());
      this.successMsg.set('Email de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (error) {
      const e = error as { code?: string, message?: string };
      if (e.code === 'auth/user-not-found') {
        this.errorMsg.set('Usuário não encontrado com este email.');
      } else if (e.code === 'auth/invalid-email') {
        this.errorMsg.set('Email inválido.');
      } else {
        this.errorMsg.set(e.message || 'Erro ao enviar email de recuperação');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleEmailAuth() {
    this.errorMsg.set('');
    this.successMsg.set('');
    if (!this.email() || !this.password()) {
      this.errorMsg.set('Preencha todos os campos.');
      return;
    }

    this.isLoading.set(true);
    try {
      if (this.isRegistering()) {
        if (!this.name()) {
          this.errorMsg.set('Preencha seu nome.');
          this.isLoading.set(false);
          return;
        }
        const res = await this.auth.registerWithEmail(
          this.email(),
          this.password(),
          this.name(),
          this.isBarber() ? 'barber' : 'client'
        );
        if (res.requiresVerification) {
          this.toggleMode();
          this.successMsg.set('Conta criada! Por favor, verifique sua caixa de entrada (ou spam) para ativar a conta.');
        }
      } else {
        const res = await this.auth.loginWithEmail(this.email(), this.password());
        if (res.requiresVerification) {
          this.errorMsg.set('Sua conta ainda não foi ativada. Um novo link de verificação foi enviado para seu email.');
        }
      }
    } catch (error) {
      const e = error as { code?: string, message?: string };
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') {
        this.errorMsg.set('Email ou senha incorretos. Verifique seus dados ou crie uma conta primeiro.');
      } else if (e.code === 'auth/email-already-in-use') {
        this.isRegistering.set(false);
        this.errorMsg.set('Este email já está cadastrado. Faça login com sua senha ou use "Esqueci minha senha".');
      } else if (e.code === 'auth/weak-password') {
        this.errorMsg.set('A senha deve ter pelo menos 6 caracteres.');
      } else if (e.code === 'auth/invalid-email') {
        this.errorMsg.set('Formato de email inválido.');
      } else if (e.code === 'auth/too-many-requests') {
        this.errorMsg.set('Muitas tentativas. Aguarde alguns instantes e tente novamente.');
      } else if (e.code === 'auth/operation-not-allowed') {
        this.errorMsg.set('O login por email/senha não está ativado no Firebase Console.');
      } else {
        this.errorMsg.set(e.message || 'Erro de autenticação.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleGoogleAuth() {
    this.errorMsg.set('');
    this.isLoading.set(true);
    try {
      await this.auth.loginWithGoogle(this.isRegistering() && this.isBarber() ? 'barber' : 'client');
    } catch (error) {
      const e = error as { code?: string, message?: string };
      if (e.code === 'auth/unauthorized-domain') {
        this.errorMsg.set('Este domínio não está autorizado no Firebase Console. Adicione o domínio aos domínios autorizados.');
      } else if (e.code !== 'auth/popup-closed-by-user') {
        this.errorMsg.set(e.message || 'Erro de autenticação Google');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
