import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdsDashboardCalculationResult } from '../../models/ads-dashboard.model';

@Component({
  selector: 'app-dashboard-attribution-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-attribution-sidebar.component.html',
})
export class DashboardAttributionSidebarComponent {
  @Input() calculationResult: AdsDashboardCalculationResult | null = null;
  @Output() viewAllLeads = new EventEmitter<void>();

  formatNumber(val?: number): string {
    if (val === undefined || val === null) return '0';
    return Number(val).toLocaleString('en-IN');
  }

  onViewAll(): void {
    this.viewAllLeads.emit();
  }
}
