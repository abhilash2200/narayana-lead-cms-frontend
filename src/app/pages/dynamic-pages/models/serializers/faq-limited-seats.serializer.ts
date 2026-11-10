import { SectionConfig } from '../dynamic-page.model';
import { FaqConfig } from '../../sections/faq/faq-section.component';
import { LimitedSeatsConfig } from '../../sections/limited-seats/limited-seats.component';
import { PageBuilderSection } from '../../../../services/dynamic-page.service';

export function buildFaqSection(
  faq: Partial<FaqConfig>,
  sections: SectionConfig[],
): PageBuilderSection {
  const isEnabled = Boolean(sections.find((s) => s.key === 'faq')?.active ?? true);
  const faqItems =
    Array.isArray(faq.faqs) && faq.faqs.length > 0
      ? faq.faqs.filter((f) => (f.question || f.answer || '').trim().length > 0)
      : [];

  return {
    section_type: 'FAQ',
    is_enabled: isEnabled,
    sort_order: 9,
    content: {
      heading: (faq.sectionHeading || '').trim() || 'Frequently Asked Questions',
      items: faqItems.map((f, idx) => ({
        question: (f.question || '').trim(),
        answer: (f.answer || '').trim(),
        sort_order: idx + 1,
      })),
    },
  };
}

export function buildLimitedSeatsSection(
  limitedSeats: Partial<LimitedSeatsConfig>,
  sections: SectionConfig[],
): PageBuilderSection {
  const isEnabled = Boolean(sections.find((s) => s.key === 'limited-seats')?.active ?? true);
  const u = limitedSeats as unknown as Record<string, unknown>;

  const rawBg =
    limitedSeats.backgroundMediaId ??
    limitedSeats.background_media_id ??
    u['background_media_id'] ??
    u['mediaId'];
  const bgMediaId = Number.isInteger(Number(rawBg)) && Number(rawBg) > 0 ? Number(rawBg) : null;

  const rawFeat =
    limitedSeats.mediaId ??
    limitedSeats.feature_media_id ??
    u['feature_media_id'] ??
    u['mediaId'];
  const featMediaId = Number.isInteger(Number(rawFeat)) && Number(rawFeat) > 0 ? Number(rawFeat) : null;

  const cards = Array.isArray(limitedSeats.cards) && limitedSeats.cards.length > 0
    ? limitedSeats.cards.filter((c) => (c.title || c.label || c.value || '').trim().length > 0)
    : [];

  return {
    section_type: 'LIMITED_SEATS',
    is_enabled: isEnabled,
    sort_order: 10,
    content: {
      background_media_id: bgMediaId && bgMediaId > 0 ? bgMediaId : 1,
      background_alt: 'Limited Seats Background',
      feature_media_id: featMediaId && featMediaId > 0 ? featMediaId : 1,
      feature_image_alt: 'Admissions Open Banner',
      availability_text: (limitedSeats.subHeading || '').trim() || 'Limited Seats Available for 2026-27',
      urgency_text: (limitedSeats.heading || '').trim() || 'Admissions Closing Soon',
      brochure_cta: {
        label: limitedSeats.buttonText || 'Download Brochure',
        action: 'DOWNLOAD_BROCHURE',
        url: null,
      },
      form_title: 'Apply for Admission',
      form_enabled: true,
      default_form_intent: 'ENQUIRY',
      statistics: cards.map((card, idx) => {
        const rawCardMedia = card.mediaId;
        const cardMediaId = Number.isInteger(Number(rawCardMedia)) && Number(rawCardMedia) > 0 ? Number(rawCardMedia) : 1;
        const title = (card.title || '').trim() || `Stat ${idx + 1}`;
        return {
          logo_media_id: cardMediaId,
          logo_alt: card.title || 'School Logo',
          title,
          label: (card.label || '').trim() || 'Key Metric',
          value: (card.value || '').trim() || '100%',
          sort_order: idx + 1,
        };
      }),
    },
  };
}
