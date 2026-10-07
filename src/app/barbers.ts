import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DataService } from './data.service';
import { Service, Barber } from './data';

@Component({
  selector: 'app-barbers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, DecimalPipe],
  template: `
    <div class="p-6 pb-24 space-y-6">
      <header class="flex items-center gap-4 mb-8">
        <a routerLink="/home" class="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors">
          <mat-icon>arrow_back</mat-icon>
        </a>
        <h1 class="text-2xl font-bold text-zinc-50 tracking-tight">Nossos Barbeiros</h1>
      </header>

      <div class="space-y-4">
        @for (barber of data.barbers(); track barber.id) {
          <div class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition-all duration-300">
            <a [routerLink]="['/barber', barber.id]" class="p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-800/50 transition-colors block">
              <img [src]="barber.avatar" alt="Barber" class="w-16 h-16 rounded-full object-cover border-2 border-zinc-800" referrerpolicy="no-referrer">
              <div class="flex-1">
                <h3 class="font-semibold text-zinc-100 text-lg">{{ barber.name }}</h3>
                <p class="text-zinc-400 text-sm">{{ barber.specialty }}</p>
                <div class="flex items-center gap-1 text-amber-500 mt-1">
                  <mat-icon class="text-[16px] w-[16px] h-[16px] leading-none shrink-0">star</mat-icon>
                  @if (!barber.reviewCount || barber.reviewCount === 0) {
                    <span class="text-xs font-bold">Sem avaliação</span>
                  } @else {
                    <span class="text-xs font-bold">{{ barber.rating | number:'1.1-1' }}</span>
                    <span class="text-[10px] text-zinc-500 ml-1">({{ barber.reviewCount }} avaliações)</span>
                  }
                </div>
              </div>
              <mat-icon class="text-zinc-500 transition-transform duration-300">
                chevron_right
              </mat-icon>
            </a>
          </div>
        }
        @if (data.barbers().length === 0) {
          <div class="bg-zinc-900 border border-zinc-800 border-dashed rounded-2xl p-6 text-center">
            <mat-icon class="text-zinc-600 mb-2">content_cut</mat-icon>
            <p class="text-zinc-400 text-sm">Nenhum barbeiro cadastrado ainda.</p>
          </div>
        }
      </div>
    </div>
  `
})
export class BarbersComponent {
  data = inject(DataService);
  sanitizer = inject(DomSanitizer);
  expandedBarberId = signal<string | null>(null);

  toggleBarber(id: string) {
    this.expandedBarberId.update(current => current === id ? null : id);
  }

  getBarberServices(barberId: string): Service[] {
    // Return services specifically assigned to this barber, or all services if none are specifically assigned
    const allServices = this.data.services();
    const specificServices = allServices.filter(s => s.barberId === barberId);
    return specificServices.length > 0 ? specificServices : allServices;
  }

  getMapUrl(barber: Barber): SafeResourceUrl | null {
    if (barber.coordinates) {
      const url = `https://maps.google.com/maps?q=${barber.coordinates.lat},${barber.coordinates.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    } else if (barber.locationName) {
      const url = `https://maps.google.com/maps?q=${encodeURIComponent(barber.locationName)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    return null;
  }
}
