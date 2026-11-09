import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly _toasts = signal<ToastItem[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string, type: ToastType = 'success', title?: string, duration: number = 3500): string {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, type, message, title, duration };

    this._toasts.update((current) => [...current, item]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  success(message: string, title?: string, duration?: number): string {
    return this.show(message, 'success', title, duration);
  }

  error(message: string, title?: string, duration?: number): string {
    return this.show(message, 'error', title, duration);
  }

  warning(message: string, title?: string, duration?: number): string {
    return this.show(message, 'warning', title, duration);
  }

  info(message: string, title?: string, duration?: number): string {
    return this.show(message, 'info', title, duration);
  }

  dismiss(id: string): void {
    this._toasts.update((current) => current.filter((t) => t.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
  }
}
