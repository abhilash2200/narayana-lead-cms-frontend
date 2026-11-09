import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartMonthData {
  month: string;
  inboundVal: string;
  outboundVal: string;
  inboundHeight: number;
  outboundHeight: number;
}

@Component({
  selector: 'app-leads-bar-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leads-bar-chart.component.html'
})
export class LeadsBarChartComponent {
  activeView: 'line' | 'bar' = 'line';
  activeMetric: 'all' | 'inbound' | 'outbound' = 'all';
  hoveredPoint: { month: string; inbound: string; outbound: string } | null = null;

  chartData: ChartMonthData[] = [
    { month: 'Jan', inboundVal: '42k', outboundVal: '28k', inboundHeight: 52, outboundHeight: 35 },
    { month: 'Feb', inboundVal: '35k', outboundVal: '32k', inboundHeight: 44, outboundHeight: 40 },
    { month: 'Mar', inboundVal: '48k', outboundVal: '30k', inboundHeight: 60, outboundHeight: 38 },
    { month: 'Apr', inboundVal: '55k', outboundVal: '40k', inboundHeight: 68, outboundHeight: 50 },
    { month: 'May', inboundVal: '75k', outboundVal: '50k', inboundHeight: 94, outboundHeight: 62 },
    { month: 'Jun', inboundVal: '60k', outboundVal: '42k', inboundHeight: 75, outboundHeight: 52 },
    { month: 'Jul', inboundVal: '65k', outboundVal: '45k', inboundHeight: 81, outboundHeight: 56 },
    { month: 'Aug', inboundVal: '50k', outboundVal: '38k', inboundHeight: 62, outboundHeight: 48 },
    { month: 'Sep', inboundVal: '68k', outboundVal: '46k', inboundHeight: 85, outboundHeight: 58 },
    { month: 'Oct', inboundVal: '72k', outboundVal: '48k', inboundHeight: 90, outboundHeight: 60 },
    { month: 'Nov', inboundVal: '58k', outboundVal: '35k', inboundHeight: 72, outboundHeight: 44 },
    { month: 'Dec', inboundVal: '64k', outboundVal: '45k', inboundHeight: 80, outboundHeight: 56 }
  ];

  private getY(height: number): number {
    return 165 - (height / 100) * 150;
  }

  private getX(index: number): number {
    return 20 + index * (1160 / (this.chartData.length - 1));
  }

  get inboundChartPoints() {
    return this.chartData.map((item, index) => ({
      month: item.month,
      value: item.inboundVal,
      outboundValue: item.outboundVal,
      x: this.getX(index),
      y: this.getY(item.inboundHeight),
      height: item.inboundHeight
    }));
  }

  get outboundChartPoints() {
    return this.chartData.map((item, index) => ({
      month: item.month,
      value: item.outboundVal,
      x: this.getX(index),
      y: this.getY(item.outboundHeight),
      height: item.outboundHeight
    }));
  }

  get inboundPoints(): string {
    return this.inboundChartPoints.map(point => `${point.x},${point.y}`).join(' ');
  }

  get outboundPoints(): string {
    return this.outboundChartPoints.map(point => `${point.x},${point.y}`).join(' ');
  }

  get inboundAreaPoints(): string {
    const pts = this.inboundChartPoints;
    if (pts.length === 0) return '';
    const firstX = pts[0].x;
    const lastX = pts[pts.length - 1].x;
    return `${firstX},165 ` + pts.map(p => `${p.x},${p.y}`).join(' ') + ` ${lastX},165`;
  }
}
