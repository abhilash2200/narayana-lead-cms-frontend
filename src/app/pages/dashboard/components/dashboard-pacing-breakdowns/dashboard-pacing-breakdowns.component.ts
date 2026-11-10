import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AdsDashboardCalculationResult,
  AdsDashboardFilterState,
} from '../../models/ads-dashboard.model';

@Component({
  selector: 'app-dashboard-pacing-breakdowns',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './dashboard-pacing-breakdowns.component.html',
})
export class DashboardPacingBreakdownsComponent {
  @Input() calculationResult: AdsDashboardCalculationResult | null = null;
  @Input() filterState!: AdsDashboardFilterState;

  formatNumber(val?: number): string {
    if (val === undefined || val === null) return '0';
    return Number(val).toLocaleString('en-IN');
  }
}
