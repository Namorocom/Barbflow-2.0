import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataService } from './data.service';
import { Review, BARBERS } from './data';
import { AuthService } from './auth.service';
import { ImageViewerService } from './image-viewer.service';

@Component({
  selector: 'app-barber-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, DatePipe, DecimalPipe],
  template: `
    <div class="h-full bg-zinc-950 overflow-y-auto pb-20">
      <!-- Header -->
      <header class="relative h-64 sm:h-72 bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden">
        @if (barber()?.gallery?.length) {
          <img [src]="barber()?.gallery?.[0]" alt="Capa" class="w-full h-full object-cover opacity-50 blur-md pointer-events-none" referrerpolicy="no-referrer">
        } @else {
          <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent"></div>
        }
        
        <button (click)="goBack()" class="absolute top-4 left-4 z-10 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
          <mat-icon>arrow_back</mat-icon>
        </button>

        <div class="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-6 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent">
          <img [src]="barber()?.avatar" [alt]="barber()?.name || 'Barbeiro'" referrerpolicy="no-referrer" class="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-zinc-950 shadow-xl bg-zinc-800">
          <div class="flex-1 pb-1">
            <h1 class="text-2xl sm:text-3xl font-bold text-zinc-50 tracking-tight">{{ barber()?.name }}</h1>
            <p class="text-amber-500 font-medium text-sm sm:text-base mt-1">{{ barber()?.specialty }}</p>
            <div class="flex items-center gap-1.5 mt-2 text-sm text-zinc-400">
              <mat-icon class="text-amber-500 text-[16px] w-[16px] h-[16px] leading-none shrink-0">star</mat-icon>
              @if ((barber()?.reviewCount || 0) === 0) {
                <span class="font-bold text-zinc-50">Sem avaliação</span>
              } @else {
                <span class="font-bold text-zinc-50">{{ barber()?.rating | number:'1.1-1' }}</span>
                <span>({{ barber()?.reviewCount }} avaliações)</span>
              }
            </div>
          </div>
        </div>
      </header>

      <!-- Content -->
      <div class="px-6 py-6 max-w-lg mx-auto sm:max-w-3xl">
        <!-- About -->
        <section class="mb-8">
          <h2 class="text-lg font-bold text-zinc-50 mb-3">Sobre</h2>
          <p class="text-zinc-400 text-sm leading-relaxed">{{ barber()?.description || 'Profissional dedicado a oferecer o melhor corte e a melhor experiência para você.' }}</p>
        </section>

        <!-- Tabs -->
        <div class="flex border-b border-zinc-800 mb-6">
          @for (tab of tabs; track tab.id) {
            <button (click)="activeTab.set(tab.id)"
                    class="flex-1 py-3 text-sm font-medium transition-colors relative"
                    [class.text-zinc-50]="activeTab() === tab.id"
                    [class.text-zinc-500]="activeTab() !== tab.id">
              {{ tab.label }}
              @if (activeTab() === tab.id) {
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full"></div>
              }
            </button>
          }
        </div>

        <!-- Services Tab -->
        @if (activeTab() === 'services') {
          <div class="space-y-4 animate-fade-in">
            @if (services().length === 0) {
              <div class="text-center py-12 text-zinc-500">
                <mat-icon class="text-4xl mb-3 opacity-50">content_cut</mat-icon>
                <p>Nenhum serviço listado.</p>
              </div>
            }
            
            @for (service of services(); track service.id) {
              <div class="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex items-center justify-between">
                <div class="flex items-center gap-4">
                  @if (service.imageUrl) {
                    <img [src]="service.imageUrl" [alt]="service.name" class="w-12 h-12 rounded-xl object-cover border border-zinc-800">
                  } @else {
                    <div class="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-amber-500">
                      <mat-icon>{{ service.icon }}</mat-icon>
                    </div>
                  }
                  <div>
                    <h3 class="font-bold text-zinc-50">{{ service.name }}</h3>
                    <p class="text-xs text-zinc-500">{{ service.durationMinutes }} min</p>
                  </div>
                </div>
                <div class="font-bold text-amber-500 shrink-0 ml-2">
                  R$ {{ service.price | number:'1.2-2' }}
                </div>
              </div>
            }
          </div>
        }

        <!-- Gallery Tab -->
        @if (activeTab() === 'gallery') {
          <div class="animate-fade-in space-y-4">
            @if (!barber()?.gallery?.length) {
              <div class="text-center py-12 text-zinc-500">
                <mat-icon class="text-4xl mb-3 opacity-50">photo_library</mat-icon>
                <p>Nenhuma foto na galeria.</p>
              </div>
            }

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              @for (img of barber()?.gallery; track img) {
                <div (click)="openImage(img)" class="aspect-square rounded-2xl overflow-hidden bg-zinc-800 border border-zinc-800/50 group cursor-pointer">
                  <img [src]="img" alt="Foto na galeria" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerpolicy="no-referrer">
                </div>
              }
            </div>
          </div>
        }

        <!-- Reviews Tab -->
        @if (activeTab() === 'reviews') {
          <div class="space-y-4 animate-fade-in">
            @if (loadingReviews()) {
              <div class="text-center py-8">
                <mat-icon class="animate-spin text-amber-500">refresh</mat-icon>
              </div>
            }

            @if (!loadingReviews() && reviews().length === 0) {
              <div class="text-center py-12 text-zinc-500">
                <mat-icon class="text-4xl mb-3 opacity-50">star_outline</mat-icon>
                <p>Nenhuma avaliação ainda.</p>
              </div>
            }
            
            @for (review of reviews(); track review.id) {
              <div class="p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <img [src]="review.userAvatar" alt="Avatar do cliente" class="w-10 h-10 rounded-full bg-zinc-800" referrerpolicy="no-referrer">
                    <div>
                      <h4 class="font-bold text-zinc-50 text-sm">{{ review.userName }}</h4>
                      <p class="text-[10px] text-zinc-500">{{ review.createdAt | date:'dd/MM/yyyy' }}</p>
                    </div>
                  </div>
                  <div class="flex gap-0.5 text-amber-500">
                    @for (star of [1,2,3,4,5]; track star) {
                      <mat-icon class="text-[16px] w-[16px] h-[16px] leading-none" [class.opacity-30]="star > review.rating">star</mat-icon>
                    }
                  </div>
                </div>
                @if (review.comment) {
                  <p class="text-zinc-300 text-sm leading-relaxed">{{ review.comment }}</p>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Bottom Floating Action Button -->
      <div class="fixed bottom-0 md:bottom-safe left-0 md:left-64 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent pointer-events-none pb-safe z-10 flex px-4">
        <button [routerLink]="['/booking']" [queryParams]="{ barberId: barber()?.id }" class="w-full max-w-3xl mx-auto block py-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-2xl transition-colors shadow-xl shadow-amber-500/20 text-center pointer-events-auto">
          Agendar com {{ barber()?.name?.split(' ')?.[0] }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .pb-safe { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
  `]
})
export class BarberProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(DataService);
  private authService = inject(AuthService);

  barberId = signal<string | null>(null);
  
  barber = computed(() => {
    const id = this.barberId();
    if (!id) return null;
    const barbers = this.dataService.barbers();
    return barbers.find(b => b.id === id) || BARBERS.find(b => b.id === id) || null;
  });

  isOwner = computed(() => {
    const user = this.authService.user();
    return user?.uid === this.barberId() && user?.role === 'barber';
  });

  services = computed(() => this.dataService.services());
  
  reviews = signal<Review[]>([]);
  loadingReviews = signal(false);

  tabs = [
    { id: 'services', label: 'Serviços' },
    { id: 'gallery', label: 'Galeria' },
    { id: 'reviews', label: 'Avaliações' }
  ];
  activeTab = signal('services');
  imageViewer = inject(ImageViewerService);

  openImage(img: string) {
    if (this.isOwner()) {
       this.imageViewer.open(img, true, async () => {
         await this.dataService.deleteGalleryPhoto(img);
       });
    } else {
       this.imageViewer.open(img, false);
    }
  }

  ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      const id = params.get('id');
      if (id) {
        this.barberId.set(id);
        this.fetchReviews(id);
      } else {
        this.router.navigate(['/home']);
      }
    });
  }

  async fetchReviews(barberId: string) {
    this.loadingReviews.set(true);
    const reviews = await this.dataService.getBarberReviews(barberId);
    this.reviews.set(reviews);
    this.loadingReviews.set(false);
  }

  goBack() {
    this.router.navigate(['/barbers']); // Or location.back() if preferred
  }
}
