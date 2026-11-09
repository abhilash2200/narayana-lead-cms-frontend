import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.component.html',
})
export class StatsComponent {
  @Input() totalLeads = 1284;
  @Input() todayLeads = 42;
  @Input() otpVerified = 1128;
  @Input() conversionRate = 24.6;
  @Input() totalLeadsTrend = '+14.8%';
  @Input() todayLeadsTrend = '+8 vs y\'day';
  @Input() otpRate = 87.9;
  @Input() timeFrameLabel = 'vs last 30d';

  formatNumber(value: number): string {
    if (value >= 1000) {
      return (value / 1000).toFixed(2) + 'K';
    }
    return new Intl.NumberFormat('en-IN').format(value);
  }
}
