import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe } from '@angular/common';
import { DataService } from './data.service';
import { AuthService } from './auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-services',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, CurrencyPipe, FormsModule],
  template: `
    <div class="p-4 sm:p-6 pb-32 sm:pb-10 space-y-6">
      @if (toastMessage()) {
        <div class="fixed top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-zinc-950 px-4 py-2 rounded-full font-bold text-sm shadow-lg z-50 animate-fade-in">
          {{ toastMessage() }}
        </div>
      }

      <!-- Header -->
      <header class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
          <a routerLink="/home" class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors">
            <mat-icon>arrow_back</mat-icon>
          </a>
          <h1 class="text-2xl font-bold text-zinc-50 tracking-tight">Nossos Serviços</h1>
        </div>
        @if (auth.user()?.role === 'barber' || auth.user()?.role === 'admin') {
          <button (click)="toggleAddMode()" class="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-zinc-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20">
            <mat-icon>{{ isAdding() || editingServiceId() ? 'close' : 'add' }}</mat-icon>
          </button>
        }
      </header>

      @if (isAdding() || editingServiceId()) {
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 mb-6">
          <h2 class="text-lg font-bold text-zinc-100 mb-2">{{ editingServiceId() ? 'Editar Serviço' : 'Adicionar Novo Serviço' }}</h2>
          
          <input type="text" [(ngModel)]="newService.name" placeholder="Nome do Serviço" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors">
          <textarea [(ngModel)]="newService.description" placeholder="Descrição" rows="2" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors resize-none"></textarea>
          
          <div class="flex gap-4">
            <div class="flex-1">
              <label for="price" class="text-xs text-zinc-500 mb-1 block">Preço (KZ)</label>
              <input id="price" type="number" [(ngModel)]="newService.price" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors">
            </div>
            <div class="flex-1">
              <label for="duration" class="text-xs text-zinc-500 mb-1 block">Duração (min)</label>
              <input id="duration" type="number" [(ngModel)]="newService.durationMinutes" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors">
            </div>
          </div>
          
          <div>
            <label for="icon" class="text-xs text-zinc-500 mb-1 block">Ícone (Material Icon)</label>
            <input id="icon" type="text" [(ngModel)]="newService.icon" placeholder="ex: content_cut, face, spa" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors">
          </div>

          <div>
            <label id="service-image-label" for="service-image-upload" class="text-xs text-zinc-500 mb-1 block">Foto do Serviço (Opcional)</label>
            <div class="flex items-center gap-4">
              @if (newService.imageUrl) {
                <img [src]="newService.imageUrl" alt="Preview da Foto do Serviço" class="w-16 h-16 rounded-xl object-cover border border-zinc-800">
              }
              <label aria-labelledby="service-image-label" for="service-image-upload" class="flex-1 bg-zinc-950 border border-zinc-800 border-dashed rounded-xl px-4 py-3 text-zinc-400 hover:text-amber-500 hover:border-amber-500/50 transition-colors cursor-pointer text-center text-sm relative overflow-hidden">
                <input id="service-image-upload" type="file" accept="image/*" class="hidden" (change)="onImageSelected($event)" [disabled]="isUploadingImage()">
                @if (isUploadingImage()) {
                  <div class="absolute inset-0 bg-zinc-950/80 flex items-center justify-center">
                    <mat-icon class="animate-spin text-amber-500">refresh</mat-icon>
                  </div>
                }
                <mat-icon class="align-middle mr-1">cloud_upload</mat-icon> Escolher Foto
              </label>
            </div>
          </div>

          @if (errorMsg()) {
            <p class="text-red-400 text-sm">{{ errorMsg() }}</p>
          }

          <button (click)="saveService()" [disabled]="isSaving()" class="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2 disabled:opacity-50">
            @if (isSaving()) {
              <mat-icon class="animate-spin">refresh</mat-icon> Salvando...
            } @else {
              <mat-icon>save</mat-icon> Salvar Serviço
            }
          </button>
        </div>
      }

      <!-- Search -->
      <div class="relative mb-6">
        <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">search</mat-icon>
        <input type="text" [value]="searchQuery()" (input)="onSearch($event)" placeholder="Buscar serviço..." class="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors">
      </div>

      <!-- Categories -->
      <div class="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar mb-6">
        <button (click)="setFilter('Todos')" [class]="activeFilter() === 'Todos' ? 'px-5 py-2 rounded-full bg-amber-500 text-zinc-950 font-bold text-sm whitespace-nowrap snap-start' : 'px-5 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 font-medium text-sm whitespace-nowrap snap-start transition-colors'">Todos</button>
        <button (click)="setFilter('Cabelo')" [class]="activeFilter() === 'Cabelo' ? 'px-5 py-2 rounded-full bg-amber-500 text-zinc-950 font-bold text-sm whitespace-nowrap snap-start' : 'px-5 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 font-medium text-sm whitespace-nowrap snap-start transition-colors'">Cabelo</button>
        <button (click)="setFilter('Barba')" [class]="activeFilter() === 'Barba' ? 'px-5 py-2 rounded-full bg-amber-500 text-zinc-950 font-bold text-sm whitespace-nowrap snap-start' : 'px-5 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 font-medium text-sm whitespace-nowrap snap-start transition-colors'">Barba</button>
        <button (click)="setFilter('Combos')" [class]="activeFilter() === 'Combos' ? 'px-5 py-2 rounded-full bg-amber-500 text-zinc-950 font-bold text-sm whitespace-nowrap snap-start' : 'px-5 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 font-medium text-sm whitespace-nowrap snap-start transition-colors'">Combos</button>
      </div>

      <!-- Service List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (service of filteredServices(); track service.id) {
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-amber-500/30 transition-colors group relative overflow-hidden flex flex-col">
            <div class="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full blur-xl"></div>
            
            <div class="flex gap-4 relative z-10 mb-4">
              @if (service.imageUrl) {
                <img [src]="service.imageUrl" alt="Foto do Serviço" class="w-14 h-14 rounded-xl object-cover shrink-0 border border-zinc-800">
              } @else {
                <div class="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center text-amber-500 shrink-0 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors">
                  <mat-icon class="text-[28px] w-[28px] h-[28px]">{{ service.icon }}</mat-icon>
                </div>
              }
              
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap justify-between items-start gap-x-2 gap-y-1 mb-1">
                  <h3 class="font-semibold text-lg text-zinc-100 leading-tight break-words max-w-full">{{ service.name }}</h3>
                  <span class="font-mono text-amber-500 font-bold whitespace-nowrap shrink-0">{{ service.price | currency:'AOA':'KZ ' }}</span>
                </div>
                <div class="flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                  <mat-icon class="text-[14px] w-[14px] h-[14px]">schedule</mat-icon>
                  <span>{{ service.durationMinutes }} min</span>
                </div>
              </div>
            </div>

            <p class="text-zinc-500 text-sm leading-relaxed mb-6 flex-1">{{ service.description }}</p>
            
            <div class="flex flex-wrap items-center justify-between gap-3 mt-auto pt-4 border-t border-zinc-800/50">
              <div class="flex flex-wrap gap-3">
                @if (auth.user()?.uid === service.barberId || auth.user()?.role === 'admin') {
                  <button (click)="editService(service)" class="text-xs text-amber-500 hover:text-amber-400 font-medium flex items-center gap-1">
                    <mat-icon class="text-[14px] w-[14px] h-[14px]">edit</mat-icon> Editar
                  </button>
                  <button (click)="deleteService(service.id)" class="text-xs text-red-500 hover:text-red-400 font-medium flex items-center gap-1">
                    <mat-icon class="text-[14px] w-[14px] h-[14px]">delete</mat-icon> Excluir
                  </button>
                }
              </div>
              
              <a [routerLink]="['/booking']" [queryParams]="{service: service.id}" class="text-xs font-bold uppercase tracking-wider text-amber-500 hover:text-amber-400 flex items-center gap-1 ml-auto">
                Agendar <mat-icon class="text-[14px] w-[14px] h-[14px]">chevron_right</mat-icon>
              </a>
            </div>
          </div>
        }
      </div>
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
      from { opacity: 0; transform: translate(-50%, -10px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  `]
})
export class ServicesComponent {
  data = inject(DataService);
  auth = inject(AuthService);
  
  isAdding = signal(false);
  isSaving = signal(false);
  isUploadingImage = signal(false);
  errorMsg = signal('');
  toastMessage = signal<string | null>(null);
  editingServiceId = signal<string | null>(null);
  
  newService = {
    name: '',
    description: '',
    price: 0,
    durationMinutes: 30,
    icon: 'content_cut',
    imageUrl: ''
  };

  showToast(message: string) {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 3000);
  }

  async onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.isUploadingImage.set(true);
      try {
        const file = input.files[0];
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
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
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            this.newService.imageUrl = dataUrl;
            this.isUploadingImage.set(false);
          };
          img.src = e.target?.result as string;
        };
        reader.onerror = () => {
          this.showToast('Erro ao ler a imagem.');
          this.isUploadingImage.set(false);
        };
        reader.readAsDataURL(file);
      } catch (e) {
        console.error(e);
        this.showToast('Erro ao processar a imagem.');
        this.isUploadingImage.set(false);
      }
    }
  }

  activeFilter = signal<string>('Todos');
  searchQuery = signal<string>('');

  filteredServices = computed(() => {
    const filter = this.activeFilter();
    const query = this.searchQuery().toLowerCase();
    let services = this.data.services();
    
    if (query) {
      services = services.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.description.toLowerCase().includes(query)
      );
    }
    
    if (filter === 'Todos') return services;
    
    // Simple mock filtering based on name or description
    return services.filter(s => {
      const text = (s.name + ' ' + s.description).toLowerCase();
      if (filter === 'Cabelo') return text.includes('cabelo') || text.includes('corte') || text.includes('degradê');
      if (filter === 'Barba') return text.includes('barba') || text.includes('pigmentação');
      if (filter === 'Combos') return text.includes('combo') || text.includes('cabelo e barba');
      return true;
    });
  });

  setFilter(filter: string) {
    this.activeFilter.set(filter);
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  toggleAddMode() {
    if (this.editingServiceId()) {
      this.editingServiceId.set(null);
      this.isAdding.set(false);
      this.resetForm();
      return;
    }
    this.isAdding.set(!this.isAdding());
    this.errorMsg.set('');
    if (!this.isAdding()) {
      this.resetForm();
    }
  }

  editService(service: import('./data').Service) {
    this.editingServiceId.set(service.id);
    this.isAdding.set(false);
    this.newService = {
      name: service.name,
      description: service.description,
      price: service.price,
      durationMinutes: service.durationMinutes,
      icon: service.icon,
      imageUrl: service.imageUrl || ''
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm() {
    this.newService = {
      name: '',
      description: '',
      price: 0,
      durationMinutes: 30,
      icon: 'content_cut',
      imageUrl: ''
    };
  }

  async deleteService(id: string) {
    try {
      await this.data.deleteService(id);
      this.showToast('Serviço excluído com sucesso!');
    } catch {
      this.showToast('Erro ao excluir serviço.');
    }
  }

  async saveService() {
    if (!this.newService.name || !this.newService.description || this.newService.price <= 0 || this.newService.durationMinutes <= 0) {
      this.errorMsg.set('Preencha todos os campos corretamente.');
      return;
    }

    this.isSaving.set(true);
    this.errorMsg.set('');

    try {
      if (this.editingServiceId()) {
        await this.data.updateService(this.editingServiceId()!, this.newService);
        this.showToast('Serviço atualizado com sucesso!');
        this.editingServiceId.set(null);
        this.resetForm();
      } else {
        await this.data.addService(this.newService);
        this.showToast('Serviço adicionado com sucesso!');
        this.toggleAddMode();
      }
    } catch (error) {
      const e = error as { message?: string };
      this.errorMsg.set('Erro ao salvar serviço: ' + (e.message || 'Erro desconhecido'));
    } finally {
      this.isSaving.set(false);
    }
  }
}
