import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastItem, ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed top-4 right-4 z-[9999] flex max-w-sm flex-col gap-2 pointer-events-none sm:max-w-md w-full px-3"
      role="region"
      aria-label="Notifications"
    >
      @for (t of toastService.toasts(); track t.id) {
        <div
          class="pointer-events-auto flex items-start gap-2.5 rounded-xl border p-3 shadow-lg transition-all duration-200 animate-in fade-in slide-in-from-top-3"
          [ngClass]="getContainerClasses(t)"
        >
          <span
            class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            [ngClass]="getIconClasses(t)"
          >
            @switch (t.type) {
              @case ('success') {
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              }
              @case ('error') {
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
              @case ('warning') {
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
              @default {
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            }
          </span>

          <div class="min-w-0 flex-1">
            @if (t.title) {
              <h4 class="text-xs font-bold leading-tight" [ngClass]="getTitleClasses(t)">{{ t.title }}</h4>
            }
            <p class="text-xs leading-relaxed" [ngClass]="getMessageClasses(t)">{{ t.message }}</p>
          </div>

          <button
            type="button"
            (click)="toastService.dismiss(t.id)"
            class="shrink-0 -mr-1 -mt-1 p-1 text-slate-400 hover:text-slate-600 transition"
            title="Dismiss notification"
          >
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  getContainerClasses(t: ToastItem): string {
    switch (t.type) {
      case 'success':
        return 'bg-emerald-50/95 border-emerald-200 backdrop-blur-sm';
      case 'error':
        return 'bg-rose-50/95 border-rose-200 backdrop-blur-sm';
      case 'warning':
        return 'bg-amber-50/95 border-amber-200 backdrop-blur-sm';
      default:
        return 'bg-indigo-50/95 border-indigo-200 backdrop-blur-sm';
    }
  }

  getIconClasses(t: ToastItem): string {
    switch (t.type) {
      case 'success':
        return 'bg-emerald-500 text-white';
      case 'error':
        return 'bg-rose-500 text-white';
      case 'warning':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-indigo-500 text-white';
    }
  }

  getTitleClasses(t: ToastItem): string {
    switch (t.type) {
      case 'success':
        return 'text-emerald-900';
      case 'error':
        return 'text-rose-900';
      case 'warning':
        return 'text-amber-900';
      default:
        return 'text-indigo-900';
    }
  }

  getMessageClasses(t: ToastItem): string {
    switch (t.type) {
      case 'success':
        return 'text-emerald-800';
      case 'error':
        return 'text-rose-800';
      case 'warning':
        return 'text-amber-800';
      default:
        return 'text-indigo-800';
    }
  }
}
