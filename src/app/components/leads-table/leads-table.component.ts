import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LeadFilters } from '../filters/filters.component';

import { MOCK_LEADS } from './mock-leads';

export interface Lead {
  id: number;
  entryDate: string;
  name: string;
  parentEmail: string;
  phone: string;
  otpValidation: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  requestedFromPage: string;
  city: string;
  branch: string;
  board: string;
  class: string;
  classCategory: string;
}

@Component({
  selector: 'app-leads-table',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './leads-table.component.html',
  styles: ``,
})
export class LeadsTableComponent {
  @Input() leads: Lead[] = MOCK_LEADS;

  /*
   * ============================================================
   * FILTERS
   * ============================================================
   */

  @Input() filters: LeadFilters = {
    selectedLP: '',
    search: '',
    startDate: '',
    endDate: '',
    classCategory: '',
  };

  /*
   * ============================================================
   * DASHBOARD / RECENT LEADS OPTIONS
   * ============================================================
   */

  @Input() recentOnly = false;

  @Input() hideFilters = false;

  @Input() hideExport = false;

  /*
   * ============================================================
   * FILTERED LEADS
   * ============================================================
   */

  get filteredLeads(): Lead[] {
    return this.leads.filter((lead) => {

      const searchValue = this.filters.search
        .trim()
        .toLowerCase();

      const matchesLP =
        !this.filters.selectedLP ||
        lead.requestedFromPage === this.filters.selectedLP;

      const matchesSearch =
        !searchValue ||
        lead.name.toLowerCase().includes(searchValue) ||
        lead.parentEmail.toLowerCase().includes(searchValue) ||
        lead.phone.includes(searchValue) ||
        lead.requestedFromPage
          .toLowerCase()
          .includes(searchValue);

      const matchesCategory =
        !this.filters.classCategory ||
        lead.classCategory === this.filters.classCategory;

      const leadDate = this.getLeadDate(lead.entryDate);

      const matchesStartDate =
        !this.filters.startDate ||
        leadDate >= this.filters.startDate;

      const matchesEndDate =
        !this.filters.endDate ||
        leadDate <= this.filters.endDate;

      return (
        matchesLP &&
        matchesSearch &&
        matchesCategory &&
        matchesStartDate &&
        matchesEndDate
      );
    });
  }

  /*
   * ============================================================
   * DISPLAYED LEADS
   *
   * Normal Leads Page:
   *      All filtered leads
   *
   * Dashboard:
   *      Only first 5 leads
   * ============================================================
   */

  get displayedLeads(): Lead[] {
    if (this.recentOnly) {
      return this.filteredLeads.slice(0, 5);
    }

    return this.filteredLeads;
  }

  /*
   * ============================================================
   * DATE FORMAT
   * ============================================================
   */

  private getLeadDate(entryDate: string): string {
    const datePart = entryDate.split(',')[0];

    const [day, month, year] = datePart.split(' ');

    const months: Record<string, string> = {
      Jan: '01',
      Feb: '02',
      Mar: '03',
      Apr: '04',
      May: '05',
      Jun: '06',
      Jul: '07',
      Aug: '08',
      Sep: '09',
      Oct: '10',
      Nov: '11',
      Dec: '12',
    };

    return `${year}-${months[month]}-${day.padStart(2, '0')}`;
  }

  /*
   * ============================================================
   * EXPORT
   * ============================================================
   */

  async exportToExcel(): Promise<void> {
    const XLSX = await import('xlsx');

    const exportData = this.filteredLeads.map((lead) => ({
      'Sl. No.': lead.id,
      'Entry Date': lead.entryDate,
      Name: lead.name,
      'Parent Email': lead.parentEmail,
      Phone: lead.phone,
      OTP: lead.otpValidation,
      'UTM Source': lead.utmSource,
      'UTM Medium': lead.utmMedium,
      'UTM Campaign': lead.utmCampaign,
      'Requested From Page': lead.requestedFromPage,
      City: lead.city,
      Branch: lead.branch,
      Board: lead.board,
      Class: lead.class,
      Category: lead.classCategory,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `leads-${date}.xlsx`);
  }
}