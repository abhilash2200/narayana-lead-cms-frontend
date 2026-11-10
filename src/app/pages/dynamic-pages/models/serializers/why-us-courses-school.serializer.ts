import { SectionConfig } from '../dynamic-page.model';
import { WhyUsConfig } from '../../sections/why-us/why-us';
import { CourseConfig } from '../../sections/course/course.component';
import { RightSchoolConfig } from '../../sections/right-school/right-school.component';
import { PageBuilderSection } from '../../../../services/dynamic-page.service';
import { sanitizeUrl } from './header-banner-classes.serializer';

export function buildWhyUsSection(
  whyUs: Partial<WhyUsConfig>,
  sections: SectionConfig[],
): PageBuilderSection {
  const isEnabled = Boolean(sections.find((s) => s.key === 'why-us')?.active ?? true);
  const whyUsBoxes = Array.isArray(whyUs.boxes) ? whyUs.boxes : [];

  let heading = (whyUs.sectionHeading ?? '').trim();
  let highlightWord = (whyUs.highlightWord ?? '').trim();
  let headingSuffix = (whyUs.headingSuffix ?? '').trim();

  // If heading contains Narayana and highlightWord is missing, break it up
  if (!highlightWord && heading.includes('Narayana')) {
    const parts = heading.split('Narayana');
    heading = parts[0]?.trim() || 'Why Choose';
    highlightWord = 'Narayana';
    if (!headingSuffix) {
      headingSuffix = parts[1]?.trim() || 'Schools';
    }
  }

  const finalHeading = heading || 'Why Choose';
  const finalHighlightWord = highlightWord || 'Narayana';
  const finalHeadingSuffix = headingSuffix || 'Schools';
  const finalSubHeading =
    (whyUs.sectionSubHeading ?? '').trim() ||
    'A system built for consistency, discipline, and results.';

  const items = whyUsBoxes
    .filter((b) => (b.heading || b.paragraph || '').trim().length > 0)
    .map((b, idx) => {
      const parsedMediaId = Number(b.mediaId);
      const iconMediaId = Number.isInteger(parsedMediaId) && parsedMediaId > 0 ? parsedMediaId : 1;
      const title = (b.heading ?? '').trim() || `Advantage ${idx + 1}`;
      return {
        title,
        description: (b.paragraph ?? '').trim() || 'A system built for consistency, discipline, and results.',
        icon_media_id: iconMediaId,
        icon_alt: title,
        sort_order: idx + 1,
      };
    });

  return {
    section_type: 'WHY_US',
    is_enabled: isEnabled,
    sort_order: 3,
    content: {
      heading: finalHeading,
      highlight_word: finalHighlightWord,
      heading_suffix: finalHeadingSuffix,
      subheading: finalSubHeading,
      desktop_active: Boolean(whyUs.desktopActive ?? true),
      mobile_active: Boolean(whyUs.mobileActive ?? true),
      items:
        items.length > 0
          ? items
          : [
              {
                title: 'Academic Excellence',
                description: 'A system built for consistency, discipline, and results.',
                icon_media_id: 1,
                icon_alt: 'Academic Excellence',
                sort_order: 1,
              },
            ],
    },
  };
}

export function buildCoursesSection(
  course: Partial<CourseConfig>,
  sections: SectionConfig[],
): PageBuilderSection {
  const isEnabled = Boolean(sections.find((s) => s.key === 'course')?.active ?? true);
  const courseList = Array.isArray(course.courses) && course.courses.length > 0 ? course.courses : [];

  const programs = courseList
    .filter((c) => (c.heading || '').trim().length > 0)
    .map((c, idx: number) => {
      const rawMedia1 = (c as unknown as Record<string, unknown>)['mediaId1'] ?? (c as unknown as Record<string, unknown>)['mediaId'];
      const primaryId = Number(rawMedia1);
      const desktopPrimaryMediaId = Number.isInteger(primaryId) && primaryId > 0 ? primaryId : null;
      const rawMedia2 = (c as unknown as Record<string, unknown>)['mediaId2'];
      const secondaryId = Number(rawMedia2);
      const desktopSecondaryMediaId = Number.isInteger(secondaryId) && secondaryId > 0 ? secondaryId : null;

      const rawBadgeMedia = (c as unknown as Record<string, unknown>)['badgeIconMediaId'] ?? (c as unknown as Record<string, unknown>)['badge_icon_media_id'];
      const badgeIconId = Number(rawBadgeMedia);
      const desktopBadgeIconMediaId = Number.isInteger(badgeIconId) && badgeIconId > 0 ? badgeIconId : null;

      const rawMobileMedia = (c as unknown as Record<string, unknown>)['mobileMediaId'] ?? (c as unknown as Record<string, unknown>)['mobile_media_id'];
      const mobileId = Number(rawMobileMedia);
      const mobileMediaId = Number.isInteger(mobileId) && mobileId > 0 ? mobileId : null;

      const subHeadingGroups = [
        { title: c.subHeading1, icon: c.icon1 || 'TRENDING_UP', items: c.listItems1 },
        { title: c.subHeading2, icon: c.icon2 || 'PUZZLE', items: c.listItems2 },
        { title: c.subHeading3, icon: c.icon3 || 'FLASK', items: c.listItems3 },
        { title: c.subHeading4, icon: c.icon4 || 'ID_BADGE', items: c.listItems4 },
      ];

      const feature_groups = subHeadingGroups
        .map((grp, gIdx) => {
          const grpPoints = (Array.isArray(grp.items) ? grp.items : [])
            .filter((p: { text?: string }) => (p.text || '').trim().length > 0)
            .map((p: { text?: string }, pIdx: number) => ({
              text: p.text!.trim(),
              sort_order: pIdx + 1,
            }));

          const title = (grp.title || '').trim();
          if (!title && grpPoints.length === 0) return null;

          return {
            icon_key: grp.icon || 'STAR',
            title: title || `Feature Group ${gIdx + 1}`,
            points: grpPoints,
            sort_order: gIdx + 1,
          };
        })
        .filter((g): g is NonNullable<typeof g> => g !== null);

      const allPoints = feature_groups.flatMap((g) => g.points);

      const rawMobileHighlights = (c as unknown as Record<string, unknown>)['mobileHighlights'] as Array<{ text?: string }> | undefined;
      const customMobilePoints = (Array.isArray(rawMobileHighlights) ? rawMobileHighlights : [])
        .filter((p) => (p?.text || '').trim().length > 0)
        .map((p, pIdx) => ({
          text: p.text!.trim(),
          sort_order: pIdx + 1,
        }));

      const mobile_highlights =
        customMobilePoints.length > 0
          ? customMobilePoints
          : allPoints.slice(0, 8);

      return {
        code: `COURSE_${idx + 1}`,
        name: (c.heading || `Course Program ${idx + 1}`).trim(),
        class_range: (c.classRange || '').trim(),
        desktop_primary_media_id: desktopPrimaryMediaId && desktopPrimaryMediaId > 0 ? desktopPrimaryMediaId : 1,
        desktop_secondary_media_id: desktopSecondaryMediaId,
        mobile_media_id: mobileMediaId,
        image_alt: c.heading || 'Course Image',
        badge_icon_media_id: desktopBadgeIconMediaId,
        badge_icon_alt: c.heading || 'Course Badge',
        feature_groups,
        mobile_highlights,
        fees_cta: {
          label: (c.buttonText1 || 'Get Fee Structure').trim(),
          action: 'FEES_STRUCTURE',
          url: sanitizeUrl(c.buttonUrl1),
        },
        brochure_cta: {
          label: (c.buttonText2 || 'Download Brochure').trim(),
          action: 'DOWNLOAD_BROCHURE',
          url: sanitizeUrl(c.buttonUrl2),
        },
        callback_cta: {
          label: (c.buttonText3 || 'Get Call Back for Your Query').trim(),
          action: 'CALLBACK',
          url: sanitizeUrl(c.buttonUrl3),
        },
        sort_order: idx + 1,
      };
    });

  return {
    section_type: 'COURSES',
    is_enabled: isEnabled,
    sort_order: 4,
    content: {
      heading: (course.sectionHeading || '').trim() || 'Courses & Programs',
      programs,
    },
  };
}

export function buildRightSchoolSection(
  rightSchool: Partial<RightSchoolConfig>,
  sections: SectionConfig[],
): PageBuilderSection {
  const isEnabled = Boolean(sections.find((s) => s.key === 'right-school')?.active ?? true);
  const rightSchoolCards =
    Array.isArray(rightSchool.cards) && rightSchool.cards.length > 0
      ? rightSchool.cards.filter((c) => (c.heading || c.paragraph || '').trim().length > 0)
      : [];

  return {
    section_type: 'RIGHT_SCHOOL',
    is_enabled: isEnabled,
    sort_order: 6,
    content: {
      heading: (rightSchool.sectionHeading || '').trim() || 'Choose The Right School',
      subheading: (rightSchool.sectionSubHeading || '').trim() || 'Empowering every student with confidence, curiosity and knowledge',
      items: rightSchoolCards.map((p, idx: number) => ({
        icon_key: `ITEM_${idx + 1}`,
        title: (p.heading || '').trim(),
        description: (p.paragraph || '').trim(),
        sort_order: idx + 1,
      })),
    },
  };
}
