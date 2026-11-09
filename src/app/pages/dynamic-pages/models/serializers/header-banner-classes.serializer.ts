import { LogoConfig, SectionConfig } from '../dynamic-page.model';
import { PageBuilderSection } from '../../../../services/dynamic-page.service';
import { ClassesConfig } from '../../sections/classes/classes.component';

export function getMediaId(item: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = item[key];
    if (value !== null && value !== undefined && value !== '') {
      const id = Number(value);
      if (Number.isInteger(id) && id > 0) return id;
    }
  }
  return null;
}

export function buildHeaderSection(
  logos: LogoConfig[],
  sections: SectionConfig[],
): PageBuilderSection {
  const isEnabled = Boolean(sections.find((s) => s.key === 'header')?.active ?? false);
  const headerLogos = (Array.isArray(logos) ? logos : [])
    .filter((logo) => (logo.name || '').trim().length > 0)
    .map((logo: LogoConfig, idx: number) => {
      const parsedMediaId = getMediaId(
        logo as unknown as Record<string, unknown>,
        'mediaId', 'media_id',
      );
      return {
        media_id: parsedMediaId && parsedMediaId > 0 ? parsedMediaId : null,
        name: (logo.name || `Logo ${idx + 1}`).trim(),
        alt: (logo.name || `Logo ${idx + 1}`).trim(),
        show_desktop: logo.desktopActive ?? true,
        show_mobile: logo.mobileActive ?? true,
        sort_order: idx + 1,
      };
    });

  return {
    section_type: 'HEADER',
    is_enabled: isEnabled,
    sort_order: 11,
    content: { logos: headerLogos },
  };
}

export function buildBannerSection(
  banner: Record<string, unknown>,
  sections: SectionConfig[],
): PageBuilderSection {
  const isEnabled = Boolean(sections.find((s) => s.key === 'banner')?.active ?? true);
  const rawBullets = banner['bullets'];
  const bannerBullets =
    Array.isArray(rawBullets) && rawBullets.length > 0
      ? (rawBullets as Array<{ text: string; show_desktop?: boolean; show_mobile?: boolean; sort_order?: number }>)
          .map((b, idx) => ({
            text: (b.text || '').trim(),
            show_desktop: b.show_desktop ?? true,
            show_mobile: b.show_mobile ?? true,
            sort_order: idx + 1,
          }))
          .filter((b) => b.text.length > 0)
      : [];

  const rawEyebrow = String(banner['eyebrow'] || banner['subHeading'] || '').trim();
  const rawEyebrowHighlight = String(banner['eyebrow_highlight'] || banner['eyebrowHighlight'] || '').trim();
  const combinedEyebrow =
    rawEyebrow && rawEyebrowHighlight && !rawEyebrow.toLowerCase().includes(rawEyebrowHighlight.toLowerCase())
      ? `${rawEyebrow} ${rawEyebrowHighlight}`.trim()
      : rawEyebrow || rawEyebrowHighlight;

  const buttonText = String(banner['buttonText'] || '').trim();
  const buttonUrl = banner['buttonUrl'] ? String(banner['buttonUrl']).trim() : null;
  const formTitle = String(banner['form_title'] || banner['formTitle'] || '').trim();
  const desktopMediaId = getMediaId(banner, 'desktop_background_media_id', 'mediaId');

  return {
    section_type: 'BANNER',
    is_enabled: isEnabled,
    sort_order: 1,
    content: {
      desktop_background_media_id: desktopMediaId,
      mobile_background_media_id:
        banner['mobile_background_media_id'] !== undefined && banner['mobile_background_media_id'] !== null
          ? Number(banner['mobile_background_media_id'])
          : null,
      background_alt: String(banner['heading'] || 'Banner Background'),
      eyebrow: combinedEyebrow || 'Admission Open For Narayana School',
      heading: String(banner['heading'] || banner['h1'] || '').trim() || 'Welcome to Narayana Schools',
      highlighted_text: String(banner['highlighted_text'] || banner['highlightText'] || '').trim(),
      bullets: bannerBullets,
      primary_cta: {
        label: buttonText || 'Get Admission Fees Details',
        action: 'OPEN_ADMISSION_MODAL',
        url: buttonUrl,
      },
      form_title: formTitle || 'Admission Open for AY 2027-28',
      form_enabled: true,
      default_form_intent: 'ENQUIRY',
    },
  };
}

export function buildClassesSection(
  classesConfig: Partial<ClassesConfig> | undefined,
  sections: SectionConfig[],
): PageBuilderSection {
  const isEnabled = Boolean(sections.find((s) => s.key === 'classes')?.active ?? true);
  const cards = classesConfig?.cards;
  const programs =
    Array.isArray(cards) && cards.length > 0
      ? cards
          .filter((card) => (card.heading || card.subHeading || '').trim().length > 0)
          .map((card, idx) => {
            const rawMediaId = (card as unknown as Record<string, unknown>)['mediaId'] ?? (card as unknown as Record<string, unknown>)['media_id'];
            const parsedMediaId = Number(rawMediaId);
            const desktopMediaId = Number.isInteger(parsedMediaId) && parsedMediaId > 0 ? parsedMediaId : null;
            const code = `PROGRAM_${idx + 1}`;
            const features = (Array.isArray(card.listItems) && card.listItems.length > 0
              ? card.listItems
              : []
            )
              .filter((item) => (item.text || '').trim().length > 0)
              .map((item, itemIdx) => ({
                text: item.text.trim(),
                sort_order: itemIdx + 1,
              }));

            return {
              code,
              name: (card.heading || `Program ${idx + 1}`).trim(),
              class_range: (card.subHeading || '').trim(),
              summary: (card.h3Heading || '').trim(),
              desktop_media_id: desktopMediaId,
              mobile_media_id: null,
              image_alt: card.heading || 'Class Program Image',
              features,
              fees_cta: {
                label: card.button1Text || 'Fee Structure',
                action: 'FEES_STRUCTURE',
                url: card.button1Url ? card.button1Url : null,
              },
              brochure_cta: {
                label: card.button2Text || 'Download Brochure',
                action: 'DOWNLOAD_BROCHURE',
                url: card.button2Url ? card.button2Url : null,
              },
              sort_order: idx + 1,
            };
          })
      : [];

  return {
    section_type: 'CLASSES',
    is_enabled: isEnabled,
    sort_order: 2,
    content: {
      heading: (classesConfig?.sectionHeading || '').trim() || 'Our Classes & Programs',
      subheading: (classesConfig?.sectionSubHeading || '').trim() || 'Comprehensive Curriculum from Pre-Primary to Higher Secondary',
      programs,
    },
  };
}
