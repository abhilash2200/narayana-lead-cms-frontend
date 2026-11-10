import { SectionConfig } from '../models/dynamic-page.model';

export class DynamicPageAccordionManager {
  activeEditingSectionKey = '';

  getActiveSectionTitle(sections: SectionConfig[]): string {
    return sections.find((s) => s.key === this.activeEditingSectionKey)?.title || '';
  }

  getActiveSectionsCount(sections: SectionConfig[]): number {
    return sections.filter((s) => s.active).length;
  }

  isSectionOpen(key: string): boolean {
    return this.activeEditingSectionKey === key;
  }

  toggleSectionAccordion(key: string): void {
    if (this.activeEditingSectionKey === key) {
      this.activeEditingSectionKey = '';
    } else {
      this.activeEditingSectionKey = key;
      this.scrollToSection(key);
    }
  }

  setActiveEditingSection(key: string): void {
    if (this.activeEditingSectionKey === key) {
      this.activeEditingSectionKey = '';
    } else {
      this.activeEditingSectionKey = key;
      this.scrollToSection(key);
    }
  }

  closeAllSections(): void {
    this.activeEditingSectionKey = '';
  }

  expandFirstSection(sections: SectionConfig[]): void {
    if (sections.length > 0) {
      this.activeEditingSectionKey = sections[0].key;
      this.scrollToSection(sections[0].key);
    }
  }

  scrollToSection(key: string): void {
    setTimeout(() => {
      const el = document.getElementById('section-accordion-' + key);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  }

  getSectionNumber(sections: SectionConfig[], key: string): string {
    const index = sections.findIndex((s) => s.key === key);
    return String(index + 1).padStart(2, '0');
  }
}
