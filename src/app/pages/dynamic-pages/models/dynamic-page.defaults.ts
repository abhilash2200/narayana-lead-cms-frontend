import {
  BannerConfig,
  DynamicPageConfiguration,
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

export function getDefaultLogos(): LogoConfig[] {
  return [];
}

export function getDefaultBanner(): BannerConfig {
  return {
    subHeading: '',
    eyebrow_highlight: '',
    heading: '',
    h1: '',
    highlighted_text: '',
    backgroundImage: '',
    bullets: [],
    stats: [],
    buttonText: '',
    buttonUrl: '',
    desktopActive: true,
    mobileActive: true,
  };
}

export function getDefaultSections(): SectionConfig[] {
  return [
    {
      key: 'banner',
      title: 'Hero',
      description: 'Hero banner and primary page content',
      active: true,
    },
    {
      key: 'classes',
      title: 'What Your Child Will Learn',
      description: 'Class programs and learning outcomes',
      active: true,
    },
    {
      key: 'why-us',
      title: 'Why Parents Choose Narayana',
      description: 'Core benefits and reasons parents choose us',
      active: true,
    },
    {
      key: 'course',
      title: 'Classes',
      description: 'Curriculum breakdown and learning stages',
      active: true,
    },
    {
      key: 'facilities',
      title: 'Campus & Facilities',
      description: 'World-class campus infrastructure and facilities',
      active: true,
    },
    {
      key: 'right-school',
      title: 'Is Narayana the Right School for Your Child?',
      description: 'Key institutional advantages and checklist',
      active: true,
    },
    {
      key: 'academic-results',
      title: 'Academic Results',
      description: 'Student academic performance and top ranks',
      active: true,
    },
    {
      key: 'parents-say',
      title: 'What Parents Say',
      description: 'Parent reviews and testimonials',
      active: true,
    },
    {
      key: 'faq',
      title: 'FAQ',
      description: 'Frequently asked questions',
      active: true,
    },
    {
      key: 'limited-seats',
      title: 'CTA (Admissions Open)',
      description: 'Limited seats call to action and application form',
      active: true,
    },
  ];
}

export function getDefaultWhyUs(): WhyUsConfig {
  return {
    sectionHeading: '',
    highlightWord: '',
    headingSuffix: '',
    sectionSubHeading: '',
    boxes: [],
    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };
}

export function getDefaultCourse(): CourseConfig {
  return {
    sectionHeading: '',
    sectionSubHeading: '',
    courses: [],
    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };
}

export function getDefaultRightSchool(): RightSchoolConfig {
  return {
    sectionHeading: '',
    sectionSubHeading: '',
    cards: [],
    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };
}

export function getDefaultAcademicResults(): AcademicResultsConfig {
  return {
    sectionHeading: '',
    sectionSubHeading: '',
    results: [],
    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };
}

export function getDefaultParentsSay(): ParentsSayConfig {
  return {
    reviews: [],
    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };
}

export function getDefaultImageSection(): ImageSectionConfig {
  return {
    desktopImage: '',
    mobileImage: '',
    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };
}

export function getDefaultFacilities(): FacilitiesConfig {
  return {
    sectionHeading: '',
    sectionSubHeading: '',
    facilities: [],
    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };
}

export function getDefaultFaq(): FaqConfig {
  return {
    sectionHeading: '',
    sectionSubHeading: '',
    faqs: [],
    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };
}

export function getDefaultLimitedSeats(): LimitedSeatsConfig {
  return {
    backgroundImage: '',
    backgroundMediaId: null,
    background_media_id: null,
    image: '',
    mediaId: null,
    feature_media_id: null,
    heading: '',
    subHeading: '',
    buttonText: '',
    cards: [],
    logos: [],
    schoolName: '',
    numberOfSchools: '',
    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };
}

export function getDefaultClasses(): ClassesConfig {
  return {
    sectionHeading: '',
    sectionSubHeading: '',
    cards: [],
    isActive: true,
    desktopActive: true,
    mobileActive: true,
  };
}

/**
 * Returns a complete, fresh default DynamicPageConfiguration object with no mock data
 */
export function getDefaultPageConfiguration(): DynamicPageConfiguration {
  return {
    logos: getDefaultLogos(),
    banner: getDefaultBanner(),
    sections: getDefaultSections(),
    classesConfig: getDefaultClasses(),
    whyUs: getDefaultWhyUs(),
    course: getDefaultCourse(),
    rightSchool: getDefaultRightSchool(),
    academicResults: getDefaultAcademicResults(),
    parentsSay: getDefaultParentsSay(),
    imageSection: getDefaultImageSection(),
    facilities: getDefaultFacilities(),
    faq: getDefaultFaq(),
    limitedSeatsConfig: getDefaultLimitedSeats(),
  };
}
