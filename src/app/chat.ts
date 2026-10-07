import { ChangeDetectionStrategy, Component, inject, signal, ViewChild, ElementRef, AfterViewChecked, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';
import { DataService } from './data.service';
import { ImageViewerService } from './image-viewer.service';
import { db, storage } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, getDoc, FieldValue } from 'firebase/firestore';

interface Message {
  id: string;
  appointmentId: string;
  senderId: string;
  text?: string;
  type: 'text' | 'image' | 'file' | 'voice';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  createdAt: Date;
}

@Component({
  selector: 'app-chat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, DatePipe, FormsModule, CommonModule],
  template: `
    <div class="flex flex-col h-full bg-zinc-950 max-w-4xl mx-auto w-full md:border-x md:border-zinc-800">
      <header class="flex items-center gap-4 p-4 sm:p-6 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
        <a routerLink="/profile" class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors">
          <mat-icon>arrow_back</mat-icon>
        </a>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
            <img [src]="getOtherPersonAvatar()" alt="Avatar" class="w-full h-full object-cover" referrerpolicy="no-referrer">
          </div>
          <div>
            <h1 class="text-base sm:text-xl font-bold text-zinc-50 tracking-tight leading-tight">{{ getOtherPersonName() }}</h1>
            <p class="text-zinc-500 text-[10px] sm:text-xs flex items-center gap-1">
              <span class="w-2 h-2 rounded-full" [class]="isOtherPersonOnline() ? 'bg-emerald-500' : 'bg-zinc-500'"></span>
              {{ isOtherPersonOnline() ? 'Online agora' : 'Offline' }}
            </p>
          </div>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6" #scrollContainer>
        @if (isLoading()) {
          <div class="flex justify-center p-4">
            <mat-icon class="animate-spin text-amber-500">refresh</mat-icon>
          </div>
        } @else if (messages().length === 0) {
          <div class="flex flex-col items-center justify-center h-full text-center text-zinc-500 space-y-4">
            <div class="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
              <mat-icon class="text-4xl">chat_bubble_outline</mat-icon>
            </div>
            <div>
              <p class="font-bold text-zinc-300">Nenhuma mensagem ainda</p>
              <p class="text-sm">Envie uma mensagem para começar a conversar.</p>
            </div>
          </div>
        } @else {
          @for (msg of messages(); track msg.id) {
            <div class="flex flex-col" [class.items-end]="msg.senderId === auth.user()?.uid" [class.items-start]="msg.senderId !== auth.user()?.uid">
              <div class="max-w-[85%] sm:max-w-[70%] rounded-2xl shadow-lg overflow-hidden" 
                   [class.bg-amber-500]="msg.senderId === auth.user()?.uid" [class.text-zinc-950]="msg.senderId === auth.user()?.uid" [class.rounded-tr-none]="msg.senderId === auth.user()?.uid"
                   [class.bg-zinc-800]="msg.senderId !== auth.user()?.uid" [class.text-zinc-100]="msg.senderId !== auth.user()?.uid" [class.rounded-tl-none]="msg.senderId !== auth.user()?.uid">
                
                @if (msg.type === 'image') {
                  <button type="button" class="p-1 block w-full text-left" (click)="openImage(msg)">
                    <img [src]="msg.fileUrl" alt="Imagem enviada" class="rounded-xl w-full max-h-80 object-cover">
                  </button>
                } @else if (msg.type === 'file') {
                  <div class="p-4 flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-zinc-950/20 flex items-center justify-center">
                      <mat-icon>description</mat-icon>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-bold truncate">{{ msg.fileName }}</p>
                      <p class="text-[10px] opacity-70">{{ formatFileSize(msg.fileSize) }}</p>
                    </div>
                    <a [href]="msg.fileUrl" target="_blank" class="w-8 h-8 rounded-full bg-zinc-950/20 flex items-center justify-center hover:bg-zinc-950/40 transition-colors">
                      <mat-icon class="text-sm">download</mat-icon>
                    </a>
                  </div>
                } @else if (msg.type === 'voice') {
                  <div class="p-4 flex items-center gap-3 min-w-[200px]">
                    <div class="w-10 h-10 rounded-full bg-zinc-950/20 flex items-center justify-center">
                      <mat-icon>mic</mat-icon>
                    </div>
                    <div class="flex-1">
                      <audio [src]="msg.fileUrl" controls class="h-8 w-full"></audio>
                      <p class="text-[10px] mt-1 opacity-70">{{ formatDuration(msg.duration || 0) }}</p>
                    </div>
                  </div>
                }

                @if (msg.text) {
                  <div class="px-4 py-3">
                    <p class="text-sm sm:text-base leading-relaxed">{{ msg.text }}</p>
                  </div>
                }
              </div>
              <span class="text-[10px] text-zinc-600 mt-1.5 font-medium px-1">{{ msg.createdAt | date:'HH:mm' }}</span>
            </div>
          }
        }
      </main>

      <footer class="p-4 sm:p-6 border-t border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
        @if (permissionError()) {
          <div class="flex items-center gap-3 mb-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20 animate-fade-in">
            <mat-icon class="text-red-500">error_outline</mat-icon>
            <span class="text-xs font-bold text-red-500">{{ permissionError() }}</span>
          </div>
        }

        @if (isUploading()) {
          <div class="mb-4 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-3">
                <mat-icon class="animate-spin text-amber-500 text-sm">refresh</mat-icon>
                <span class="text-xs font-bold text-amber-500">Enviando arquivo...</span>
              </div>
              <span class="text-[10px] font-mono text-amber-500">{{ uploadProgress() }}%</span>
            </div>
            <div class="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div class="bg-amber-500 h-full transition-all duration-300" [style.width.%]="uploadProgress()"></div>
            </div>
          </div>
        }

        @if (isRecording()) {
          <div class="flex items-center justify-between gap-4 mb-4 p-4 bg-red-500/10 rounded-2xl border border-red-500/20 animate-pulse">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
              <span class="text-sm font-bold text-red-500">Gravando: {{ formatDuration(recordingDuration()) }}</span>
            </div>
            <button (click)="stopRecording()" class="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-colors">
              Parar e Enviar
            </button>
          </div>
        }

        <form (ngSubmit)="sendMessage()" class="flex items-end gap-2 sm:gap-3 max-w-3xl mx-auto">
          <div class="flex gap-1 mb-1">
            <input type="file" #imageInput class="hidden" accept="image/*" (change)="onFileSelected($event, 'image')">
            <button type="button" (click)="imageInput.click()" class="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-zinc-100 transition-colors">
              <mat-icon>image</mat-icon>
            </button>
            
            <input type="file" #fileInput class="hidden" (change)="onFileSelected($event, 'file')">
            <button type="button" (click)="fileInput.click()" class="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center hover:text-zinc-100 transition-colors">
              <mat-icon>attach_file</mat-icon>
            </button>
          </div>

          <div class="flex-1 relative">
            <textarea [(ngModel)]="newMessage" name="message" placeholder="Digite sua mensagem..." 
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-zinc-200 focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 transition-all text-sm sm:text-base resize-none"
                    rows="1" (keydown.enter)="$event.preventDefault(); sendMessage()"
                    autocomplete="off"></textarea>
          </div>

          <div class="flex gap-2">
            @if (!newMessage().trim()) {
              <button type="button" (mousedown)="startRecording()" (touchstart)="startRecording()"
                      class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center transition-all hover:text-zinc-100 active:scale-95 shrink-0">
                <mat-icon class="text-[24px] sm:text-[28px] w-[24px] sm:w-[28px] h-[24px] sm:h-[28px]">mic</mat-icon>
              </button>
            }

            <button type="submit" [disabled]="(!newMessage().trim() && !isUploading()) || isSending()" 
                    class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500 text-zinc-950 flex items-center justify-center disabled:opacity-50 transition-all hover:bg-amber-400 active:scale-95 shadow-lg shadow-amber-500/20 shrink-0">
              @if (isSending()) {
                <mat-icon class="animate-spin text-[24px] sm:text-[28px] w-[24px] sm:w-[28px] h-[24px] sm:h-[28px]">refresh</mat-icon>
              } @else {
                <mat-icon class="text-[24px] sm:text-[28px] w-[24px] sm:w-[28px] h-[24px] sm:h-[28px]">send</mat-icon>
              }
            </button>
          </div>
        </form>
      </footer>
    </div>
  `
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {
  auth = inject(AuthService);
  data = inject(DataService);
  route = inject(ActivatedRoute);
  
  appointmentId = signal<string>('');
  isDirectChat = signal(false);
  directOtherUserId = signal<string>('');
  directOtherUserName = signal('Carregando...');
  directOtherUserAvatar = signal('https://picsum.photos/seed/user/100/100');
  directOtherUserOnline = signal(false);
  
  messages = signal<Message[]>([]);
  isLoading = signal(true);
  newMessage = signal('');
  isSending = signal(false);
  isUploading = signal(false);
  uploadProgress = signal(0);
  permissionError = signal<string | null>(null);
  
  // Voice recording
  isRecording = signal(false);
  recordingDuration = signal(0);
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingInterval: ReturnType<typeof setInterval> | undefined;
  
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  private unsubscribe: (() => void) | null = null;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        if (id.startsWith('direct_')) {
          const otherUserId = id.replace('direct_', '');
          this.setupDirectChat(otherUserId);
        } else {
          this.isDirectChat.set(false);
          this.appointmentId.set(id);
          this.loadMessages(id);
          this.checkAndInitiateChat(id);
        }
      }
    });
  }

  async setupDirectChat(otherUserId: string) {
    this.isDirectChat.set(true);
    this.directOtherUserId.set(otherUserId);
    
    const myUid = this.auth.user()?.uid;
    if (!myUid) return;
    
    const roomId = [myUid, otherUserId].sort().join('_');
    this.appointmentId.set(roomId);
    
    // Fetch other user's info
    try {
      const userDoc = await getDoc(doc(db, 'users', otherUserId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        this.directOtherUserName.set(data['name'] || 'Usuário');
        this.directOtherUserAvatar.set(data['avatar'] || 'https://picsum.photos/seed/user/100/100');
        this.directOtherUserOnline.set(!!data['isOnline']);
      }
    } catch (e) {
      console.error('Error fetching user info', e);
    }
    
    this.loadMessages(roomId);
  }

  isOtherPersonOnline(): boolean {
    if (this.isDirectChat()) return this.directOtherUserOnline();
    
    const appt = this.data.appointments().find(a => a.id === this.appointmentId());
    if (!appt) return false;
    
    if (this.auth.user()?.role === 'barber') {
      // For barber, we don't have the client's online status in the local data service easily without fetching
      // Let's just return false for now or we could fetch it.
      return false; 
    } else {
      const barber = this.data.barbers().find(b => b.id === appt.barberId);
      return !!barber?.isOnline;
    }
  }

  async checkAndInitiateChat(appointmentId: string) {
    const appt = this.data.appointments().find(a => a.id === appointmentId);
    if (appt && !appt.chatInitiated) {
      try {
        await updateDoc(doc(db, 'appointments', appointmentId), { chatInitiated: true });
        
        const otherUserId = this.auth.user()?.role === 'barber' ? appt.userId : appt.barberId;
        const myName = this.auth.user()?.role === 'barber' ? this.data.barbers().find(b => b.id === appt.barberId)?.name || 'Barbeiro' : appt.userName || 'Cliente';
        
        await this.data.createNotification({
          userId: otherUserId,
          title: 'Chat Iniciado',
          body: `${myName} iniciou um chat com você sobre o agendamento.`,
          type: 'chat_started',
          relatedId: appointmentId,
          read: false
        });
      } catch (error) {
        console.error('Error initiating chat:', error);
      }
    }
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch {
      // Ignore scroll errors
    }
  }

  getOtherPersonName(): string {
    if (this.isDirectChat()) return this.directOtherUserName();
    
    const appt = this.data.appointments().find(a => a.id === this.appointmentId());
    if (!appt) return 'Carregando...';
    
    if (this.auth.user()?.role === 'barber') {
      return appt.userName || 'Cliente';
    } else {
      const barber = this.data.barbers().find(b => b.id === appt.barberId);
      return barber?.name || 'Barbeiro';
    }
  }

  getOtherPersonAvatar(): string {
    if (this.isDirectChat()) return this.directOtherUserAvatar();
    
    const appt = this.data.appointments().find(a => a.id === this.appointmentId());
    if (!appt) return 'https://picsum.photos/seed/user/100/100';
    
    if (this.auth.user()?.role === 'barber') {
      return appt.userAvatar || 'https://picsum.photos/seed/user/100/100';
    } else {
      const barber = this.data.barbers().find(b => b.id === appt.barberId);
      return barber?.avatar || appt.barberAvatar || 'https://picsum.photos/seed/barber/100/100';
    }
  }

  loadMessages(appointmentId: string) {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    const q = query(
      collection(db, 'messages'), 
      where('appointmentId', '==', appointmentId),
      orderBy('createdAt', 'asc')
    );
    
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data['createdAt']?.toDate() || new Date()
        } as Message;
      });
      this.messages.set(msgs);
      this.isLoading.set(false);
    }, (error) => {
      console.error('Error loading messages:', error);
      this.isLoading.set(false);
    });
  }

  async sendMessage(type: 'text' | 'image' | 'file' | 'voice' = 'text', fileData?: { url: string, name?: string, size?: number, duration?: number }) {
    const text = this.newMessage().trim();
    if (type === 'text' && !text) return;
    if (!this.auth.user()) return;
    
    this.isSending.set(true);
    try {
      const messageData: Record<string, string | number | FieldValue | undefined> = {
        appointmentId: this.appointmentId(),
        senderId: this.auth.user()?.uid || '',
        type,
        createdAt: serverTimestamp()
      };

      if (type === 'text') {
        messageData['text'] = text;
      } else {
        if (fileData?.url !== undefined) messageData['fileUrl'] = fileData.url;
        if (fileData?.name !== undefined) messageData['fileName'] = fileData.name;
        if (fileData?.size !== undefined) messageData['fileSize'] = fileData.size;
        if (fileData?.duration !== undefined) messageData['duration'] = fileData.duration;
        if (text) messageData['text'] = text;
      }

      await addDoc(collection(db, 'messages'), messageData);
      this.newMessage.set('');
      
      // Send notification to the other person
      const notificationBody = type === 'text' ? text : (type === 'image' ? '📷 Foto' : (type === 'voice' ? '🎤 Mensagem de voz' : '📄 Documento'));
      
      if (this.isDirectChat()) {
        await this.data.createNotification({
          userId: this.directOtherUserId(),
          title: `Nova mensagem de ${this.auth.user()?.name}`,
          body: notificationBody.length > 50 ? notificationBody.substring(0, 47) + '...' : notificationBody,
          type: 'new_message',
          relatedId: this.appointmentId(),
          read: false
        });
      } else {
        const appt = this.data.appointments().find(a => a.id === this.appointmentId());
        if (appt) {
          const otherUserId = this.auth.user()?.role === 'barber' ? appt.userId : appt.barberId;
          const myName = this.auth.user()?.role === 'barber' ? this.data.barbers().find(b => b.id === appt.barberId)?.name || 'Barbeiro' : appt.userName || 'Cliente';
          
          await this.data.createNotification({
            userId: otherUserId,
            title: `Nova mensagem de ${myName}`,
            body: notificationBody.length > 50 ? notificationBody.substring(0, 47) + '...' : notificationBody,
            type: 'new_message',
            relatedId: this.appointmentId(),
            read: false
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      this.isSending.set(false);
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
          resolve(canvas.toDataURL('image/jpeg', 0.6)); // compressed base64
        };
        img.onerror = error => reject(error);
      };
      reader.onerror = error => reject(error);
    });
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  async onFileSelected(event: Event, type: 'image' | 'file') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.auth.user()) return;

    // Check size limit before starting (~ 800KB to be safe given firestore 1MB limit for other types)
    if (file.size > 800000 && type !== 'image') {
       alert("O arquivo é grande demais. O tamanho máximo permitido é 800KB.");
       return;
    }

    this.isUploading.set(true);
    this.uploadProgress.set(50); // Since we aren't streaming, just put a fake intermediate progress
    this.permissionError.set(null);
    
    try {
      let base64Data = '';
      if (type === 'image') {
        base64Data = await this.compressImage(file);
      } else {
        base64Data = await this.fileToBase64(file);
      }
      
      this.uploadProgress.set(100);
      await this.sendMessage(type, { url: base64Data, name: file.name, size: file.size });
    } catch (error) {
      console.error('Error initiating upload:', error);
      this.permissionError.set('Erro ao processar o arquivo.');
    } finally {
      this.isUploading.set(false);
      if (input) input.value = '';
    }
  }

  async startRecording() {
    this.permissionError.set(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const duration = this.recordingDuration();
        
        if (duration > 0) {
          this.isUploading.set(true);
          this.uploadProgress.set(50);
          
          try {
            // Check size limit (~800KB)
            if (audioBlob.size > 800000) {
              alert("A gravação é grande demais (max 800KB). Grave áudios mais curtos.");
              this.isUploading.set(false);
              stream.getTracks().forEach(track => track.stop());
              return;
            }

            const base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = error => reject(error);
            });
            
            this.uploadProgress.set(100);
            await this.sendMessage('voice', { url: base64Data, duration });
          } catch (error) {
            console.error('Error initiating voice upload:', error);
            this.permissionError.set('Erro ao processar a gravação.');
          } finally {
            this.isUploading.set(false);
          }
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording.set(true);
      this.recordingDuration.set(0);
      this.recordingInterval = setInterval(() => {
        this.recordingDuration.update(d => d + 1);
      }, 1000);
    } catch (error: unknown) {
      console.error('Error starting recording:', error);
      const err = error as { name?: string };
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.permissionError.set('Permissão de microfone negada. Por favor, habilite o acesso nas configurações do seu navegador.');
      } else {
        this.permissionError.set('Não foi possível acessar o microfone. Verifique se ele está conectado e funcionando.');
      }
      setTimeout(() => this.permissionError.set(null), 5000);
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording()) {
      this.mediaRecorder.stop();
      this.isRecording.set(false);
      clearInterval(this.recordingInterval);
    }
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  openFile(url?: string) {
    if (url) window.open(url, '_blank');
  }

  imageViewer = inject(ImageViewerService);

  openImage(msg: Message) {
    if (msg.fileUrl) {
      const isSender = msg.senderId === this.auth.user()?.uid;
      this.imageViewer.open(msg.fileUrl, isSender, isSender ? async () => {
        await this.data.deleteChatMessage(msg.id);
      } : undefined);
    }
  }
}
