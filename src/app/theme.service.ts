import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  darkModeEnabled = signal(true);

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('darkMode');
      if (stored !== null) {
        this.darkModeEnabled.set(stored === 'true');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.darkModeEnabled.set(prefersDark);
      }
      this.applyTheme();
    }
  }

  toggleDarkMode() {
    this.darkModeEnabled.set(!this.darkModeEnabled());
    localStorage.setItem('darkMode', this.darkModeEnabled() ? 'true' : 'false');
    this.applyTheme();
  }

  private applyTheme() {
    if (this.darkModeEnabled()) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
