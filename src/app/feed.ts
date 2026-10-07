import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from './data.service';
import { ImageViewerService } from './image-viewer.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-feed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule],
  template: `
    <div class="p-4 sm:p-6 pb-24 space-y-6 max-w-5xl mx-auto">
      <header class="flex items-center gap-4 mb-8">
        <a routerLink="/home" class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors">
          <mat-icon>arrow_back</mat-icon>
        </a>
        <h1 class="text-2xl font-bold text-zinc-50 tracking-tight">Galeria de Estilos</h1>
      </header>

      @if (feedItems().length === 0) {
        <div class="bg-zinc-900 border border-zinc-800 border-dashed rounded-2xl p-6 text-center">
          <mat-icon class="text-zinc-600 mb-2 text-4xl">photo_library</mat-icon>
          <p class="text-zinc-400 text-sm">Nenhum estilo postado ainda.</p>
        </div>
      }

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        @for (item of feedItems(); track item.img) {
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col transition-all hover:bg-zinc-800/80 group">
            <div (click)="openImage(item.img, item.barber.id)" class="relative aspect-[4/5] w-full overflow-hidden cursor-pointer">
              <img [src]="item.img" alt="Estilo" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerpolicy="no-referrer">
            </div>
            
            <div class="p-4 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <img [src]="item.barber.avatar" alt="Barbeiro" class="w-10 h-10 rounded-full object-cover border border-zinc-700 bg-zinc-800" referrerpolicy="no-referrer">
                <div>
                  <h3 class="font-bold text-zinc-50 text-sm">{{ item.barber.name.split(' ')[0] }}</h3>
                  <p class="text-xs text-amber-500">{{ item.barber.specialty }}</p>
                </div>
              </div>
              
              <a [routerLink]="['/booking']" [queryParams]="{ barberId: item.barber.id }" class="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-zinc-950 flex items-center justify-center transition-colors" title="Agendar com {{ item.barber.name.split(' ')[0] }}">
                <mat-icon class="text-[18px] w-[18px] h-[18px]">calendar_month</mat-icon>
              </a>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class FeedComponent {
  data = inject(DataService);
  imageViewer = inject(ImageViewerService);
  auth = inject(AuthService);

  feedItems = computed(() => {
    const barbers = this.data.barbers();
    const items: Array<{img: string, barber: any}> = [];
    
    // Aggregate photos from all barbers
    barbers.forEach(b => {
      if (b.gallery && b.gallery.length > 0) {
        b.gallery.forEach(img => {
          items.push({ img, barber: b });
        });
      }
    });

    // We can randomize them or let them be pseudo-ordered
    // Since we don't have timestamps for individual photos, 
    // let's reverse to show "newer" barbers first theoretically, or a random sort
    return items.sort((a, b) => 0.5 - Math.random());
  });

  openImage(img: string, barberId: string) {
    const isOwner = this.auth.user()?.uid === barberId;
    this.imageViewer.open(img, isOwner, isOwner ? async () => {
      await this.data.deleteGalleryPhoto(img);
    } : undefined);
  }
}
