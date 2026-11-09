import { DynamicPageConfiguration, SectionConfig } from './dynamic-page.model';
import { WhyUsConfig } from '../sections/why-us/why-us';
import { CourseConfig } from '../sections/course/course.component';
import { RightSchoolConfig } from '../sections/right-school/right-school.component';
import { AcademicResultsConfig } from '../sections/academic-results/academic-results.component';
import { ParentsSayConfig } from '../sections/parents-say/parents-say.component';
import { ImageSectionConfig } from '../sections/image-section/image-section.component';
import { FacilitiesConfig } from '../sections/facilities/facilities.component';
import { FaqConfig } from '../sections/faq/faq-section.component';
import { LimitedSeatsConfig } from '../sections/limited-seats/limited-seats.component';
import { PageBuilderSection } from '../../../services/dynamic-page.service';

import {
  buildHeaderSection,
  buildBannerSection,
  buildClassesSection,
} from './serializers/header-banner-classes.serializer';
import {
  buildWhyUsSection,
  buildCoursesSection,
  buildRightSchoolSection,
} from './serializers/why-us-courses-school.serializer';
import {
  buildAcademicResultsSection,
  buildImageSection,
  buildParentsSaySection,
  buildFacilitiesSection,
} from './serializers/results-media-facilities.serializer';
import {
  buildFaqSection,
  buildLimitedSeatsSection,
} from './serializers/faq-limited-seats.serializer';

export { getMediaId } from './serializers/header-banner-classes.serializer';

/**
 * Builds the complete, validated array of all 12 sections required by the OpenAPI contract:
 * PUT /backend/pages/{pageId}/revisions/{revisionId}/sections
 */
export function buildAll12Sections(config: DynamicPageConfiguration): PageBuilderSection[] {
  const s = config.sections as SectionConfig[];

  return [
    buildBannerSection(config.banner as unknown as Record<string, unknown>, s),
    buildClassesSection(config.classesConfig, s),
    buildWhyUsSection((config.whyUs || {}) as Partial<WhyUsConfig>, s),
    buildCoursesSection((config.course || {}) as Partial<CourseConfig>, s),
    buildFacilitiesSection((config.facilities || {}) as Partial<FacilitiesConfig>, s),
    buildRightSchoolSection((config.rightSchool || {}) as Partial<RightSchoolConfig>, s),
    buildAcademicResultsSection((config.academicResults || {}) as Partial<AcademicResultsConfig>, s),
    buildParentsSaySection((config.parentsSay || {}) as Partial<ParentsSayConfig>, s),
    buildFaqSection((config.faq || {}) as Partial<FaqConfig>, s),
    buildLimitedSeatsSection((config.limitedSeatsConfig || {}) as Partial<LimitedSeatsConfig>, s),
    buildHeaderSection(config.logos, s),
    buildImageSection((config.imageSection || {}) as Partial<ImageSectionConfig>, s),
  ];
}

const SECTION_KEY_TO_TYPE: Record<string, string> = {
  header: 'HEADER',
  banner: 'BANNER',
  classes: 'CLASSES',
  'why-us': 'WHY_US',
  course: 'COURSES',
  courses: 'COURSES',
  'right-school': 'RIGHT_SCHOOL',
  'academic-results': 'ACADEMIC_RESULTS',
  'image-section': 'IMAGE_SECTION',
  'parents-say': 'PARENTS_SAY',
  facilities: 'FACILITIES',
  faq: 'FAQ',
  'limited-seats': 'LIMITED_SEATS',
};

/**
 * Builds a single section by key or section_type
 */
export function buildSingleSection(
  sectionKey: string,
  config: DynamicPageConfiguration,
): PageBuilderSection | null {
  const allSections = buildAll12Sections(config);
  const targetType = SECTION_KEY_TO_TYPE[sectionKey.toLowerCase()] || sectionKey.toUpperCase();
  return allSections.find((sec) => sec.section_type === targetType) || null;
}
