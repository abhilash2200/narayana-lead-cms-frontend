import { PageBuilderSection } from '../../../services/dynamic-page.service';
import {
  BannerConfig,
  LogoConfig,
  SectionConfig,
} from './dynamic-page.model';
import { ClassesConfig } from '../sections/classes/classes.component';
import { WhyUsConfig } from '../sections/why-us/why-us';
import { CourseConfig } from '../sections/course/course.component';
import { RightSchoolConfig } from '../sections/right-school/right-school.component';
import { AcademicResultsConfig } from '../sections/academic-results/academic-results.component';
import { ParentsSayConfig } from '../sections/parents-say/parents-say.component';
import { ImageSectionConfig } from '../sections/image-section/image-section.component';
import { FacilitiesConfig } from '../sections/facilities/facilities.component';
import { FaqConfig } from '../sections/faq/faq-section.component';
import { LimitedSeatsConfig } from '../sections/limited-seats/limited-seats.component';
import {
  MediaDictionary,
  createMediaMap,
  resolveMediaUrl,
} from './deserializers/media-resolver';
import {
  deserializeHeader,
  deserializeBanner,
  deserializeClasses,
  deserializeWhyUs,
} from './deserializers/hero-classes-whyus.deserializer';
import {
  deserializeCourses,
  deserializeRightSchool,
  deserializeAcademicResults,
  deserializeFacilities,
} from './deserializers/courses-facilities-results.deserializer';
import {
  deserializeImageSection,
  deserializeParentsSay,
  deserializeFaq,
  deserializeLimitedSeats,
} from './deserializers/parents-faq-seats.deserializer';

export type { MediaDictionary };
export { createMediaMap, resolveMediaUrl };

export interface DeserializerTargetState {
  sections: SectionConfig[];
  logos: LogoConfig[];
  banner: BannerConfig;
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

/**
 * Deserializes backend PageBuilderSection[] into component UI configuration models
 */
export function populateSectionsFromBackend(
  backendSections: PageBuilderSection[],
  state: DeserializerTargetState,
  mediaInput?: unknown,
): void {
  const mediaMap = createMediaMap(mediaInput);

  for (const s of backendSections) {
    const type = (s.section_type || '').toUpperCase();
    const isEnabled = s.is_enabled ?? true;

    switch (type) {
      case 'HEADER':
        deserializeHeader(s, state, mediaMap, isEnabled);
        break;
      case 'BANNER':
        deserializeBanner(s, state, mediaMap, isEnabled);
        break;
      case 'CLASSES':
        deserializeClasses(s, state, mediaMap, isEnabled);
        break;
      case 'WHY_US':
        deserializeWhyUs(s, state, mediaMap, isEnabled);
        break;
      case 'COURSES':
        deserializeCourses(s, state, mediaMap, isEnabled);
        break;
      case 'RIGHT_SCHOOL':
        deserializeRightSchool(s, state, mediaMap, isEnabled);
        break;
      case 'ACADEMIC_RESULTS':
        deserializeAcademicResults(s, state, mediaMap, isEnabled);
        break;
      case 'IMAGE_SECTION':
        deserializeImageSection(s, state, mediaMap, isEnabled);
        break;
      case 'PARENTS_SAY':
        deserializeParentsSay(s, state, mediaMap, isEnabled);
        break;
      case 'FACILITIES':
        deserializeFacilities(s, state, mediaMap, isEnabled);
        break;
      case 'FAQ':
        deserializeFaq(s, state, mediaMap, isEnabled);
        break;
      case 'LIMITED_SEATS':
        deserializeLimitedSeats(s, state, mediaMap, isEnabled);
        break;
    }
  }
}
