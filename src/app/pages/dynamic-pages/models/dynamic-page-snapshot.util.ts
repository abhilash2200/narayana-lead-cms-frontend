import { DynamicPageConfiguration } from './dynamic-page.model';
import { getDefaultPageConfiguration } from './dynamic-page.defaults';
import { DeserializerTargetState } from './dynamic-page.deserializer';

export interface PageSnapshotState extends DeserializerTargetState {
  pageTitle: string;
  generatedSlug: string;
  selectedCityId: number | null;
  selectedBranchId: number | null;
  selectedClassId: number | null;
}

/**
 * Serializes the current component page builder form state into a snapshot record for dirty-checking
 */
export function buildPageSnapshot(state: PageSnapshotState): Record<string, unknown> {
  return {
    title: state.pageTitle,
    slug: state.generatedSlug,
    cityId: state.selectedCityId,
    branchId: state.selectedBranchId,
    classId: state.selectedClassId,
    logos: state.logos,
    banner: state.banner,
    classesConfig: state.classesConfig,
    whyUs: state.whyUs,
    course: state.course,
    rightSchool: state.rightSchool,
    academicResults: state.academicResults,
    parentsSay: state.parentsSay,
    imageSection: state.imageSection,
    facilities: state.facilities,
    faq: state.faq,
    limitedSeatsConfig: state.limitedSeatsConfig,
    sections: state.sections,
  };
}

/**
 * Restores section configuration from a stored PageConfiguration object
 */
export function restoreSectionsFromConfig(
  config: Partial<DynamicPageConfiguration>,
  target: DeserializerTargetState,
): void {
  if (Array.isArray(config.logos) && config.logos.length) {
    target.logos = structuredClone(config.logos);
  }
  if (config.banner) {
    target.banner = structuredClone(config.banner);
  }
  if (config.classesConfig) {
    target.classesConfig = structuredClone(config.classesConfig);
  }
  if (config.whyUs) {
    target.whyUs = structuredClone(config.whyUs);
  }
  if (config.course) {
    target.course = structuredClone(config.course);
  }
  if (config.rightSchool) {
    target.rightSchool = structuredClone(config.rightSchool);
  }
  if (config.academicResults) {
    target.academicResults = structuredClone(config.academicResults);
  }
  if (config.parentsSay) {
    target.parentsSay = structuredClone(config.parentsSay);
  }
  if (config.imageSection) {
    target.imageSection = structuredClone(config.imageSection);
  }
  if (config.facilities) {
    target.facilities = structuredClone(config.facilities);
  }
  if (config.faq) {
    target.faq = structuredClone(config.faq);
  }
  if (config.limitedSeatsConfig) {
    target.limitedSeatsConfig = structuredClone(config.limitedSeatsConfig);
  }
  if (Array.isArray(config.sections) && config.sections.length) {
    target.sections = structuredClone(config.sections);
  }
}

/**
 * Resets all 12 sections to standard system defaults
 */
export function resetSectionsToDefaults(target: DeserializerTargetState): void {
  const config = getDefaultPageConfiguration();
  target.logos = config.logos;
  target.banner = config.banner;
  if (config.classesConfig) {
    target.classesConfig = config.classesConfig;
  }
  target.whyUs = config.whyUs;
  target.course = config.course;
  target.rightSchool = config.rightSchool;
  target.academicResults = config.academicResults;
  target.parentsSay = config.parentsSay;
  target.imageSection = config.imageSection;
  target.facilities = config.facilities;
  target.faq = config.faq;
  target.limitedSeatsConfig = config.limitedSeatsConfig;
  target.sections = config.sections;
}
