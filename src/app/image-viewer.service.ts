import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImageViewerService {
  isOpen = signal(false);
  imageUrl = signal('');
  canDelete = signal(false);
  deleteCallback: (() => Promise<void> | void) | null = null;
  loadingDelete = signal(false);

  open(url: string, canDelete: boolean = false, onDelete?: () => Promise<void> | void) {
    this.imageUrl.set(url);
    this.canDelete.set(canDelete);
    this.deleteCallback = onDelete || null;
    this.loadingDelete.set(false);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.imageUrl.set('');
    this.canDelete.set(false);
    this.deleteCallback = null;
  }

  async triggerDelete() {
    if (this.deleteCallback) {
      this.loadingDelete.set(true);
      try {
        await this.deleteCallback();
        this.close();
      } catch (err) {
        console.error("Error in delete callback", err);
        this.loadingDelete.set(false);
      }
    }
  }
}
