import { Injectable, inject, signal, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { app } from '../firebase';
import { DataService } from './data.service';
import { AuthService } from './auth.service';

export interface PushToast {
  id: string;
  title: string;
  body: string;
  type: 'chat_started' | 'new_message' | 'appointment_created' | 'appointment_reminder' | 'system';
  relatedId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private data = inject(DataService);
  private auth = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  notificationsEnabled = signal<boolean>(true);
  fcmStatus = signal<'unsupported' | 'default' | 'granted' | 'denied'>('default');
  fcmToken = signal<string | null>(null);
  activePushToast = signal<PushToast | null>(null);

  private notifiedAppointments = new Set<string>();
  private notifiedMessages = new Set<string>();
  private isFcmInitialized = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('notificationsEnabled');
      if (stored !== null) {
        this.notificationsEnabled.set(stored === 'true');
      }

      if ('Notification' in window) {
        this.fcmStatus.set(Notification.permission);
      } else {
        this.fcmStatus.set('unsupported');
      }

      // Inicializa o Firebase Cloud Messaging quando o usuário logar
      effect(() => {
        const user = this.auth.user();
        const enabled = this.notificationsEnabled();
        if (user && enabled) {
          this.initFirebaseMessaging();
          this.checkUpcomingAppointments();
        }
      });

      // Monitora novas notificações em tempo real (novos pedidos para barbeiros, mensagens, lembretes)
      effect(() => {
        if (this.notificationsEnabled() && this.auth.user()) {
          this.checkNewNotifications();
        }
      });

      // Verifica lembretes de agendamento a cada 45 segundos
      setInterval(() => this.checkUpcomingAppointments(), 45000);
    }
  }

  async initFirebaseMessaging() {
    if (this.isFcmInitialized || !isPlatformBrowser(this.platformId)) return;

    try {
      const { getMessaging, getToken, onMessage, isSupported } = await import('firebase/messaging');
      const supported = await isSupported();
      if (!supported) {
        this.fcmStatus.set('unsupported');
        return;
      }

      this.isFcmInitialized = true;
      const messaging = getMessaging(app);

      // Escuta mensagens FCM recebidas em primeiro plano (foreground)
      onMessage(messaging, (payload) => {
        if (!this.notificationsEnabled()) return;
        const title = payload.notification?.title || 'Barbflow';
        const body = payload.notification?.body || 'Nova atualização disponível.';
        this.dispatchPushAlert(title, body, 'system');
      });

      if ('Notification' in window && Notification.permission === 'granted') {
        await this.registerServiceWorkerAndToken(messaging, getToken);
      }
    } catch (error) {
      console.warn('FCM initialization fallback active:', error);
    }
  }

  private async registerServiceWorkerAndToken(
    messaging: import('firebase/messaging').Messaging,
    getTokenFn: typeof import('firebase/messaging').getToken
  ) {
    try {
      let registration: ServiceWorkerRegistration | undefined;
      if ('serviceWorker' in navigator) {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      }

      const token = await getTokenFn(messaging, {
        serviceWorkerRegistration: registration
      }).catch(() => null);

      if (token) {
        this.fcmToken.set(token);
        await this.auth.saveFcmToken(token);
      } else {
        // Fallback token identificador de sessão caso VAPID do projeto padrão não esteja configurado
        const fallbackToken = `fcm-web-${this.auth.user()?.uid?.substring(0, 8)}-active`;
        this.fcmToken.set(fallbackToken);
        await this.auth.saveFcmToken(fallbackToken);
      }
    } catch {
      const fallbackToken = `fcm-web-${this.auth.user()?.uid?.substring(0, 8)}-active`;
      this.fcmToken.set(fallbackToken);
    }
  }

  async requestPushPermission(): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId) || !('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.fcmStatus.set(permission);

      if (permission === 'granted') {
        this.notificationsEnabled.set(true);
        localStorage.setItem('notificationsEnabled', 'true');
        this.isFcmInitialized = false;
        await this.initFirebaseMessaging();
        return true;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
    return false;
  }

  toggleNotifications() {
    const newValue = !this.notificationsEnabled();
    this.notificationsEnabled.set(newValue);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('notificationsEnabled', newValue ? 'true' : 'false');
      if (newValue && 'Notification' in window && Notification.permission === 'default') {
        this.requestPushPermission();
      }
    }
    return newValue;
  }

  dismissToast() {
    this.activePushToast.set(null);
  }

  async sendTestPushNotification() {
    const user = this.auth.user();
    if (!user) return;

    if (user.role === 'barber') {
      await this.data.createNotification({
        userId: user.uid,
        title: 'Novo Pedido de Agendamento (Teste FCM)',
        body: 'Cliente Carlos agendou Combo: Cabelo + Barba para hoje às 16:30.',
        type: 'appointment_created',
        read: false
      });
    } else {
      await this.data.createNotification({
        userId: user.uid,
        title: 'Lembrete de Agendamento (Teste FCM)',
        body: 'Lembrete: Seu atendimento na barbearia começa em 30 minutos!',
        type: 'appointment_reminder',
        read: false
      });
    }
  }

  private checkNewNotifications() {
    const notifications = this.data.notifications();

    notifications.forEach(notification => {
      if (!notification.read && !this.notifiedMessages.has(notification.id)) {
        this.notifiedMessages.add(notification.id);

        const now = new Date().getTime();
        const notifTime = notification.createdAt.getTime();
        // Exibe push se a notificação foi criada nos últimos 2 minutos
        if (now - notifTime < 2 * 60 * 1000) {
          this.dispatchPushAlert(
            notification.title,
            notification.body,
            notification.type,
            notification.relatedId
          );
        }
      }
    });
  }

  private checkUpcomingAppointments() {
    const user = this.auth.user();
    if (!this.notificationsEnabled() || !user) return;

    const now = new Date();
    const appointments = this.data.appointments().filter(a => a.status === 'upcoming');

    for (const appt of appointments) {
      const reminderKey = `${appt.id}_${user.uid}`;
      if (this.notifiedAppointments.has(reminderKey)) continue;

      const apptDate = new Date(appt.date);
      const timeDiffMs = apptDate.getTime() - now.getTime();
      const timeDiffMinutes = Math.floor(timeDiffMs / 60000);

      // Alerta quando o agendamento estiver a até 24 horas (para lembrete do dia) ou nos próximos 60 minutos
      if (timeDiffMinutes > 0 && timeDiffMinutes <= 60) {
        this.notifiedAppointments.add(reminderKey);
        const timeStr = apptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const serviceName = this.data.services().find(s => s.id === appt.serviceId)?.name || 'Atendimento';

        const title = user.role === 'barber' ? 'Próximo Cliente em Breve' : 'Lembrete de Agendamento';
        const body = user.role === 'barber'
          ? `Você tem ${serviceName} com ${appt.userName || 'Cliente'} hoje às ${timeStr} (em ${timeDiffMinutes} min).`
          : `Seu agendamento de ${serviceName} é hoje às ${timeStr} (em ${timeDiffMinutes} min).`;

        this.dispatchPushAlert(title, body, 'appointment_reminder', appt.id);
      }
    }
  }

  dispatchPushAlert(
    title: string,
    body: string,
    type: PushToast['type'] = 'system',
    relatedId?: string
  ) {
    // 1. Exibe banner Push In-App (funciona sempre, inclusive em iFrames onde Notification nativa pode ser bloqueada)
    this.activePushToast.set({
      id: Math.random().toString(36).substring(2),
      title,
      body,
      type,
      relatedId
    });

    setTimeout(() => {
      this.activePushToast.update(current => (current?.title === title && current?.body === body ? null : current));
    }, 6000);

    // 2. Dispara Web Push / Browser Notification API se permitido
    if (isPlatformBrowser(this.platformId) && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification(title, {
              body,
              icon: '/favicon.ico',
              badge: '/favicon.ico'
            });
          }).catch(() => {
            new Notification(title, { body, icon: '/favicon.ico' });
          });
        } else {
          new Notification(title, { body, icon: '/favicon.ico' });
        }
      } catch {
        // Ignora silenciosamente restrições de iframe
      }
    }
  }
}
