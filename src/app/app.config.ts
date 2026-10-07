import {
  ApplicationConfig,
  ErrorHandler,
  Injectable,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const chunkFailedMessage = /Loading chunk [\d]+ failed/;
    const fetchFailedMessage = /Failed to fetch dynamically imported module/;
    
    const err = error as Error;
    if (
      (err?.message && (chunkFailedMessage.test(err.message) || fetchFailedMessage.test(err.message))) ||
      (err?.name === 'ChunkLoadError')
    ) {
      console.error('Chunk load error detected, reloading page...', error);
      if (typeof window !== 'undefined') {
        const reloadCount = parseInt(sessionStorage.getItem('chunk-reload') || '0', 10);
        if (reloadCount < 2) {
          sessionStorage.setItem('chunk-reload', String(reloadCount + 1));
          window.location.reload();
        } else {
          console.error('Max reloads reached for chunk load error.');
        }
      }
    } else {
      console.error(error);
    }
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(), 
    provideRouter(routes),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ],
};
