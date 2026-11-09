import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private readonly router = inject(Router);
  private readonly _isOpen = signal(false);

  readonly isOpen = this._isOpen.asReadonly();

  constructor() {
    // Automatically close sidebar when navigating to a new route on mobile
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.close();
      });
  }

  toggle(): void {
    this._isOpen.update((open) => !open);
  }

  open(): void {
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
  }
}
