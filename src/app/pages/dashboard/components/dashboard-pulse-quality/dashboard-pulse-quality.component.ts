import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AdsDashboardCalculationResult,
  AdsDashboardFilterState,
} from '../../models/ads-dashboard.model';

@Component({
  selector: 'app-dashboard-pulse-quality',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-pulse-quality.component.html',
})
export class DashboardPulseQualityComponent {
  @Input() calculationResult: AdsDashboardCalculationResult | null = null;
  @Input() filterState!: AdsDashboardFilterState;

  formatNumber(val?: number): string {
    if (val === undefined || val === null) return '0';
    return Number(val).toLocaleString('en-IN');
  }
}
