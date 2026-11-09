import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DynamicPageService } from '../../services/dynamic-page.service';

interface SectionItem {
  key: string;
  title: string;
  description: string;
  active: boolean;
}

@Component({
  selector: 'app-dynamic-page-preview',
  standalone: true,
  templateUrl: './dynamic-page-preview.component.html',
})
export class DynamicPagePreviewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dynamicPageService = inject(DynamicPageService);
  private readonly cdr = inject(ChangeDetectorRef);

  pageId: number | null = null;
  pageSlug = '';
  pageTitle = 'Dynamic Page';
  bannerSubtitle = '';
  logoImage = '';
  currentYear = new Date().getFullYear();

  sections: SectionItem[] = [
    { key: 'header', title: 'Header', description: 'Website header', active: true },
    { key: 'banner', title: 'Banner', description: 'Main page banner', active: true },
    { key: 'why-us', title: 'Why Us', description: 'Why choose us', active: true },
    { key: 'classes', title: 'Classes / Course', description: 'Available classes and courses', active: true },
    { key: 'gallery', title: 'Gallery', description: 'School gallery', active: true },
    { key: 'facilities', title: 'Facilities', description: 'School facilities', active: true },
    { key: 'testimonials', title: 'Testimonials', description: 'Parent and student testimonials', active: true },
    { key: 'faq', title: 'FAQ', description: 'Frequently asked questions', active: true },
    { key: 'footer', title: 'Footer', description: 'Website footer', active: true },
  ];

  classCards = ['Nursery', 'UKG', 'Class 1', 'Class 2'];
  galleryImages: string[] = [];
  facilities = ['Smart Classrooms', 'Library', 'Computer Lab'];
  whyUsItems = ['Experienced Faculty', 'Modern Infrastructure', 'Student Focused Learning'];
  testimonials = [
    { name: 'Parent 1', message: 'Great learning environment for students.' },
    { name: 'Parent 2', message: 'Very supportive teachers and staff.' },
    { name: 'Parent 3', message: 'Good infrastructure and activities.' },
  ];
  faqs = [
    { question: 'What classes are available?', answer: 'Classes can be configured from the Dynamic Page admin panel.' },
    { question: 'How can I contact the school?', answer: 'Contact details can be configured in the page sections.' },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      const slugParam = params.get('slug');

      if (idParam && !Number.isNaN(Number(idParam))) {
        this.pageId = Number(idParam);
        this.loadPageData(this.pageId);
      } else if (slugParam) {
        if (!Number.isNaN(Number(slugParam))) {
          this.pageId = Number(slugParam);
          this.loadPageData(this.pageId);
        } else {
          this.pageSlug = slugParam;
          this.pageTitle = this.formatSlug(slugParam);
        }
      }
    });
  }

  private loadPageData(id: number): void {
    this.dynamicPageService.getPageBuilderData(id).subscribe({
      next: (res) => {
        if (!res.success || !res.data) return;
        const data = res.data as {
          page?: { title?: string; slug?: string; canonical_path?: string };
          revisions?: Array<{ title?: string; status?: string }>;
          sections?: Array<{ section_type?: string; is_enabled?: boolean; content?: Record<string, unknown> }>;
        };

        if (data.page) {
          this.pageTitle = data.page.title || this.pageTitle;
          this.pageSlug = data.page.canonical_path || data.page.slug || '';
        }

        if (data.sections && data.sections.length > 0) {
          const bannerSec = data.sections.find(
            (s) => s.section_type?.toUpperCase() === 'BANNER'
          );
          if (bannerSec?.content) {
            const heading = bannerSec.content['banner_heading'] || bannerSec.content['heading'];
            if (typeof heading === 'string' && heading) {
              this.pageTitle = heading;
            }
            const sub = bannerSec.content['banner_subheading'] || bannerSec.content['subheading'];
            if (typeof sub === 'string' && sub) {
              this.bannerSubtitle = sub;
            }
          }
        }
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback to defaults
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/dynamic-pages']);
  }

  goToEdit(): void {
    if (this.pageId) {
      this.router.navigate(['/dynamic-pages/edit', this.pageId]);
    }
  }

  isSectionActive(key: string): boolean {
    const section = this.sections.find((item) => item.key === key);
    return section?.active ?? false;
  }

  formatSlug(slug: string): string {
    if (!slug) return 'Dynamic Page';
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}