import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageUploadComponent } from '../../shared/image-upload/image-upload.component';

export interface BannerBullet {
  id: number;
  text: string;
  show_desktop?: boolean;
  show_mobile?: boolean;
  sort_order?: number;
}

interface BannerStat {
  id: number;
  value: string;
  label: string;
}

export interface BannerConfig {
  subHeading: string;
  eyebrow_highlight?: string;
  heading: string;
  h1?: string;
  highlighted_text?: string;
  form_title?: string;
  bullets?: BannerBullet[];
  stats: BannerStat[];
  buttonText?: string;
  buttonUrl?: string;
  backgroundImage: string;
  mediaId?: number | null;
  desktop_background_media_id?: number | null;
  mobile_background_media_id?: number | null;
  desktopActive?: boolean;
  mobileActive?: boolean;
}

@Component({
  selector: 'app-banner-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ImageUploadComponent,
  ],
  templateUrl: './banner-section.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class BannerSectionComponent {

  @Input() banner: BannerConfig = {
    subHeading: 'Admission Open For',
    eyebrow_highlight: 'Narayana School',
    heading: 'CBSE School for',
    highlighted_text: 'Class- I',
    bullets: [
      {
        id: 1,
        text: 'Technologically driven stress-free curriculum',
        show_desktop: true,
        show_mobile: true,
        sort_order: 1,
      },
      {
        id: 2,
        text: "Asia's one of the largest educational conglomerates",
        show_desktop: true,
        show_mobile: true,
        sort_order: 2,
      },
      {
        id: 3,
        text: 'Learning that leads to careers, not just certificates',
        show_desktop: true,
        show_mobile: true,
        sort_order: 3,
      },
    ],
    stats: [
      {
        id: 1,
        value: '900+',
        label: 'Campus',
      },
      {
        id: 2,
        value: '250+',
        label: 'Cities',
      },
      {
        id: 3,
        value: '47+',
        label: 'Legacy',
      },
      {
        id: 4,
        value: '600000+',
        label: 'Learners All Over India',
      },
    ],
    buttonText: 'Get Admission Fees Details',
    buttonUrl: '',
    backgroundImage: '',
    desktopActive: true,
    mobileActive: true,
  };

  @Output() bannerChange =
    new EventEmitter<BannerConfig>();

  isSectionOpen = false;
  isActive = true;

  activeSubSection: 'content' | 'statistics' | 'bullets' | 'cta' | 'background' | null = 'content';

  get isContentOpen(): boolean {
    return this.activeSubSection === 'content';
  }

  get isBulletsOpen(): boolean {
    return this.activeSubSection === 'bullets';
  }

  get isStatisticsOpen(): boolean {
    return this.activeSubSection === 'statistics';
  }

  get isCtaOpen(): boolean {
    return this.activeSubSection === 'cta';
  }

  get isBackgroundOpen(): boolean {
    return this.activeSubSection === 'background';
  }

  openStatId: number | null = 1;

  private nextStatId = 5;
  private nextBulletId = 4;

  toggleBullets(): void {
    this.activeSubSection = this.activeSubSection === 'bullets' ? null : 'bullets';
  }

  addBullet(): void {
    if (!this.banner.bullets) {
      this.banner.bullets = [];
    }
    const newBullet: BannerBullet = {
      id: this.nextBulletId++,
      text: '',
      show_desktop: true,
      show_mobile: true,
      sort_order: this.banner.bullets.length + 1,
    };
    this.banner.bullets.push(newBullet);
    this.activeSubSection = 'bullets';
    this.emitChange();
  }

  removeBullet(bulletId: number): void {
    if (!this.banner.bullets) return;
    this.banner.bullets = this.banner.bullets.filter((b) => b.id !== bulletId);
    this.emitChange();
  }

  toggleSection(): void {
    this.isSectionOpen = !this.isSectionOpen;
  }

  toggleActive(): void {
    this.isActive = !this.isActive;

    this.emitChange();
  }

  toggleDesktop(): void {
    this.banner.desktopActive =
      !this.banner.desktopActive;

    this.emitChange();
  }

  toggleMobile(): void {
    this.banner.mobileActive =
      !this.banner.mobileActive;

    this.emitChange();
  }

  toggleContent(): void {
    this.activeSubSection = this.activeSubSection === 'content' ? null : 'content';
  }

  toggleStatistics(): void {
    this.activeSubSection = this.activeSubSection === 'statistics' ? null : 'statistics';
  }

  toggleCta(): void {
    this.activeSubSection = this.activeSubSection === 'cta' ? null : 'cta';
  }

  toggleBackground(): void {
    this.activeSubSection = this.activeSubSection === 'background' ? null : 'background';
  }

  toggleStat(statId: number): void {
    this.openStatId =
      this.openStatId === statId
        ? null
        : statId;
  }

  isStatOpen(statId: number): boolean {
    return this.openStatId === statId;
  }

  addStat(): void {
    const newStat: BannerStat = {
      id: this.nextStatId++,
      value: '',
      label: '',
    };

    this.banner.stats.push(newStat);
    this.activeSubSection = 'statistics';
    this.openStatId = newStat.id;
    this.emitChange();
  }

  removeStat(statId: number): void {
    this.banner.stats =
      this.banner.stats.filter(
        (stat) => stat.id !== statId
      );

    if (this.openStatId === statId) {
      this.openStatId =
        this.banner.stats[0]?.id ?? null;
    }

    this.emitChange();
  }

  onBackgroundImageChange(
    imageUrl: string
  ): void {
    this.banner.backgroundImage =
      imageUrl;

    this.emitChange();
  }

  onBackgroundMediaIdChange(mediaId: number | null): void {
    this.banner.mediaId = mediaId;
    this.banner.desktop_background_media_id = mediaId;
    this.emitChange();
  }

  emitChange(): void {
    this.bannerChange.emit({
      subHeading:
        this.banner.subHeading,

      eyebrow_highlight:
        this.banner.eyebrow_highlight,

      heading:
        this.banner.heading,

      highlighted_text:
        this.banner.highlighted_text,

      bullets:
        (this.banner.bullets || []).map(
          (b) => ({
            ...b,
          })
        ),

      stats:
        (this.banner.stats || []).map(
          (stat) => ({
            ...stat,
          })
        ),

      buttonText:
        this.banner.buttonText,

      buttonUrl:
        this.banner.buttonUrl,

      backgroundImage:
        this.banner.backgroundImage,

      mediaId:
        this.banner.mediaId,

      desktop_background_media_id:
        this.banner.desktop_background_media_id,

      mobile_background_media_id:
        this.banner.mobile_background_media_id,

      desktopActive:
        this.banner.desktopActive,

      mobileActive:
        this.banner.mobileActive,
    });
  }
}
