import { SectionConfig } from '../dynamic-page.model';
import { AcademicResultsConfig } from '../../sections/academic-results/academic-results.component';
import { ImageSectionConfig } from '../../sections/image-section/image-section.component';
import { ParentsSayConfig } from '../../sections/parents-say/parents-say.component';
import { FacilitiesConfig } from '../../sections/facilities/facilities.component';
import { PageBuilderSection } from '../../../../services/dynamic-page.service';

export function buildAcademicResultsSection(
  academicResults: Partial<AcademicResultsConfig>,
  sections: SectionConfig[],
): PageBuilderSection {
  const isEnabled = Boolean(sections.find((s) => s.key === 'academic-results')?.active ?? true);
  const resultCards =
    Array.isArray(academicResults.results) && academicResults.results.length > 0
      ? academicResults.results.filter((c) => (c.studentName || c.marks || '').trim().length > 0)
      : [];

  return {
    section_type: 'ACADEMIC_RESULTS',
    is_enabled: isEnabled,
    sort_order: 7,
    content: {
      heading: (academicResults.sectionHeading || '').trim() || 'Academic Results',
      subheading: (academicResults.sectionSubHeading || '').trim() || 'Excellence in Board & Competitive Examinations',
      results: resultCards.map((card, idx: number) => {
        const rawMedia = (card as unknown as Record<string, unknown>)['mediaId'] ?? (card as unknown as Record<string, unknown>)['media_id'];
        const parsedMediaId = Number(rawMedia);
        const mediaId = Number.isInteger(parsedMediaId) && parsedMediaId > 0 ? parsedMediaId : 1;
        const rawYear = Number((card as unknown as Record<string, unknown>)['year']);
        const validYear = Number.isInteger(rawYear) && rawYear > 1900 ? rawYear : new Date().getFullYear();

        return {
          student_name: (card.studentName || '').trim() || `Student ${idx + 1}`,
          score: (card.marks || '').trim() || '98%',
          exam: (card.boardName || '').trim() || 'CBSE',
          year: validYear,
          media_id: mediaId,
          image_alt: card.studentName || 'Result Image',
          sort_order: idx + 1,
        };
      }),
      cta: { label: 'View All Results', action: 'OPEN_ADMISSION_MODAL', url: null },
    },
  };
}

export function buildImageSection(
  imageSec: Partial<ImageSectionConfig>,
  sections: SectionConfig[],
): PageBuilderSection {
  const isEnabled = Boolean(sections.find((s) => s.key === 'image-section')?.active ?? false);
  const u = imageSec as unknown as Record<string, unknown>;
  const rawDesktop = u['desktop_media_id'] ?? u['mediaId'];
  const desktopMediaId = Number.isInteger(Number(rawDesktop)) && Number(rawDesktop) > 0 ? Number(rawDesktop) : 1;
  const rawMobile = u['mobile_media_id'] ?? u['mediaId'];
  const mobileMediaId = Number.isInteger(Number(rawMobile)) && Number(rawMobile) > 0 ? Number(rawMobile) : null;

  return {
    section_type: 'IMAGE_SECTION',
    is_enabled: isEnabled,
    sort_order: 12,
    content: {
      desktop_media_id: desktopMediaId,
      desktop_alt: String(u['title'] || 'Campus Gallery Showcase'),
      mobile_images: mobileMediaId ? [{
        media_id: mobileMediaId,
        alt: String(u['title'] || 'Campus Mobile View'),
        sort_order: 1,
      }] : [{
        media_id: desktopMediaId,
        alt: String(u['title'] || 'Campus Mobile View'),
        sort_order: 1,
      }],
      link_url: null,
    },
  };
}

export function buildParentsSaySection(
  parentsSay: Partial<ParentsSayConfig>,
  sections: SectionConfig[],
): PageBuilderSection {
  const isEnabled = Boolean(sections.find((s) => s.key === 'parents-say')?.active ?? true);
  const reviewsList =
    Array.isArray(parentsSay.reviews) && parentsSay.reviews.length > 0
      ? parentsSay.reviews.filter((r) => (r.name || r.review || '').trim().length > 0)
      : [];

  const rawParentsSay = parentsSay as unknown as Record<string, unknown>;
  const heading = typeof rawParentsSay['sectionHeading'] === 'string' && rawParentsSay['sectionHeading'].trim()
    ? rawParentsSay['sectionHeading'].trim()
    : 'What Parents Say About Us';
  const subheading = typeof rawParentsSay['sectionSubHeading'] === 'string' && rawParentsSay['sectionSubHeading'].trim()
    ? rawParentsSay['sectionSubHeading'].trim()
    : 'Hear from parents who trusted Narayana for their child’s future';

  return {
    section_type: 'PARENTS_SAY',
    is_enabled: isEnabled,
    sort_order: 8,
    content: {
      heading,
      subheading,
      testimonials: reviewsList.map((t, idx) => {
        const rawMedia = (t as unknown as Record<string, unknown>)['mediaId'] ?? (t as unknown as Record<string, unknown>)['media_id'];
        const parsedMediaId = Number(rawMedia);
        const avatarMediaId = Number.isInteger(parsedMediaId) && parsedMediaId > 0 ? parsedMediaId : null;

        return {
          name: (t.name || '').trim(),
          location: (t.location || '').trim(),
          quote: (t.review || '').trim(),
          rating: Number(t.rating || 5),
          avatar_media_id: avatarMediaId,
          avatar_alt: t.name || 'Parent Avatar',
          sort_order: idx + 1,
        };
      }),
    },
  };
}

export function buildFacilitiesSection(
  facilities: Partial<FacilitiesConfig>,
  sections: SectionConfig[],
): PageBuilderSection {
  const isEnabled = Boolean(sections.find((s) => s.key === 'facilities')?.active ?? true);
  const facilityItems =
    Array.isArray(facilities.facilities) && facilities.facilities.length > 0
      ? facilities.facilities.filter((f) => (f.heading || f.paragraph || '').trim().length > 0)
      : [];

  return {
    section_type: 'FACILITIES',
    is_enabled: isEnabled,
    sort_order: 5,
    content: {
      heading: (facilities.sectionHeading || '').trim() || 'Campus & Facilities',
      subheading: (facilities.sectionSubHeading || '').trim() || 'World-class infrastructure designed for all-round development',
      items: facilityItems.map((f, idx) => {
        const rawMedia = (f as unknown as Record<string, unknown>)['mediaId'] ?? (f as unknown as Record<string, unknown>)['media_id'];
        const parsedMediaId = Number(rawMedia);
        const mediaId = Number.isInteger(parsedMediaId) && parsedMediaId > 0 ? parsedMediaId : 1;
        const title = (f.heading || '').trim() || `Facility ${idx + 1}`;

        return {
          title,
          description: (f.paragraph || '').trim() || 'World-class modern educational infrastructure',
          media_id: mediaId,
          image_alt: title,
          sort_order: idx + 1,
        };
      }),
    },
  };
}
