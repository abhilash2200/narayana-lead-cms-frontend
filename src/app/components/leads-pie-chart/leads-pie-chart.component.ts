import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LeadCategory {
  name: string;
  source: string;
  count: number;
  percentage: number;
  colorClass: string;
}

@Component({
  selector: 'app-leads-pie-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leads-pie-chart.component.html',
})
export class LeadsPieChartComponent {
  categories: LeadCategory[] = [
    {
      name: 'Organic Search',
      source: 'Google & SEO Landing Pages',
      count: 620,
      percentage: 44,
      colorClass: 'bg-[#8c7ae6]'
    },
    {
      name: 'Paid Campaigns',
      source: 'Meta, Google CPC & Display',
      count: 490,
      percentage: 35,
      colorClass: 'bg-indigo-400'
    },
    {
      name: 'Direct & Referrals',
      source: 'Word of mouth & Direct URL',
      count: 310,
      percentage: 21,
      colorClass: 'bg-slate-400'
    }
  ];
}
