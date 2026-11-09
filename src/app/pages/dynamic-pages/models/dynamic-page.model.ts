import { WhyUsConfig } from '../sections/why-us/why-us';
import { FacilitiesConfig } from '../sections/facilities/facilities.component';
import { ImageSectionConfig } from '../sections/image-section/image-section.component';
import { ParentsSayConfig } from '../sections/parents-say/parents-say.component';
import { AcademicResultsConfig } from '../sections/academic-results/academic-results.component';
import { RightSchoolConfig } from '../sections/right-school/right-school.component';
import { CourseConfig } from '../sections/course/course.component';
import { ClassesConfig } from '../sections/classes/classes.component';
import { FaqConfig } from '../sections/faq/faq-section.component';
import { LimitedSeatsConfig } from '../sections/limited-seats/limited-seats.component';
import { environment } from '../../../../environments/environment';

export interface DynamicPage {
  id: number;

  title: string;
  slug: string;
  scopeKey?: string;
  canonicalPath?: string;

  cityId: number;
  cityName: string;

  branchId: number | null;
  branchName: string | null;

  classId: number | null;
  className: string | null;

  status: 'Active' | 'Inactive';

  createdAt: string;
  updatedAt: string;

  pageConfiguration: DynamicPageConfiguration;
  isDuplicated?: boolean;
}

export interface DynamicPageConfiguration {
  logos: LogoConfig[];

  banner: BannerConfig;

  sections: SectionConfig[];

  classesConfig?: ClassesConfig;
  whyUs: WhyUsConfig;
  course: CourseConfig;
  rightSchool: RightSchoolConfig;
  academicResults: AcademicResultsConfig;
  parentsSay: ParentsSayConfig;
  imageSection: ImageSectionConfig;
  facilities: FacilitiesConfig;
  faq: FaqConfig;
  limitedSeatsConfig: LimitedSeatsConfig;
}

export interface LogoConfig {
  id: number;
  name: string;
  imageUrl: string;
  mediaId?: number | null;
  desktopActive: boolean;
  mobileActive: boolean;
}

export interface BannerBullet {
  id: number;
  text: string;
  show_desktop?: boolean;
  show_mobile?: boolean;
  sort_order?: number;
}

export interface BannerStat {
  id: number;
  value: string;
  label: string;
}

export interface BannerConfig {
  heading: string;
  h1?: string;
  subHeading: string;
  eyebrow_highlight?: string;
  highlighted_text?: string;
  form_title?: string;
  backgroundImage: string;
  mediaId?: number | null;
  desktop_background_media_id?: number | null;
  mobile_background_media_id?: number | null;
  bullets?: BannerBullet[];
  stats: BannerStat[];
  buttonText?: string;
  buttonUrl?: string;
  desktopActive?: boolean;
  mobileActive?: boolean;
}

export interface SectionConfig {
  key: string;
  title: string;
  description: string;
  active: boolean;
}

export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const cdnBase = environment.mediaCdnBaseUrl.replace(/\/+$/, '');
  return `${cdnBase}${cleanPath}`;
}