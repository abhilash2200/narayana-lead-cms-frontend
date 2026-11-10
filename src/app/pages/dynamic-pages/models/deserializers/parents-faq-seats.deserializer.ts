import { PageBuilderSection } from '../../../../services/dynamic-page.service';
import { DeserializerTargetState } from '../dynamic-page.deserializer';
import { MediaDictionary, resolveMediaUrl } from './media-resolver';

export function deserializeImageSection(
  s: PageBuilderSection,
  state: DeserializerTargetState,
  mediaMap: MediaDictionary,
  isEnabled: boolean
): void {
  const sec = state.sections.find((x) => x.key === 'image-section');
  if (sec) sec.active = isEnabled;
  const c = s.content as Record<string, unknown>;
  if (!c) return;

  const desktopMediaId = c['desktop_media_id'] ?? c['media_id'] ?? c['mediaId'];
  const mobileMediaId =
    (c['mobile_images'] as Array<Record<string, unknown>>)?.[0]?.['media_id'] ??
    c['mobile_media_id'];
  if (desktopMediaId) {
    state.imageSection.desktop_media_id = Number(desktopMediaId);
    state.imageSection.mediaId = Number(desktopMediaId);
    state.imageSection.desktopImage = resolveMediaUrl(
      desktopMediaId,
      mediaMap,
      state.imageSection.desktopImage
    );
  }
  if (mobileMediaId) {
    state.imageSection.mobile_media_id = Number(mobileMediaId);
    state.imageSection.mobileImage = resolveMediaUrl(
      mobileMediaId,
      mediaMap,
      state.imageSection.mobileImage
    );
  }
}

export function deserializeParentsSay(
  s: PageBuilderSection,
  state: DeserializerTargetState,
  mediaMap: MediaDictionary,
  isEnabled: boolean
): void {
  const sec = state.sections.find((x) => x.key === 'parents-say');
  if (sec) sec.active = isEnabled;
  const c = s.content as Record<string, unknown>;
  if (!c) return;

  const testimonials = c['testimonials'];
  if (Array.isArray(testimonials) && testimonials.length > 0) {
    state.parentsSay.reviews = testimonials.map((t: Record<string, unknown>, idx: number) => {
      const parentMediaId =
        t['parent_photo_media_id'] ??
        t['media_id'] ??
        t['avatar_media_id'] ??
        t['photo_media_id'];
      const existingRev = state.parentsSay.reviews?.[idx];
      const parentImg = resolveMediaUrl(parentMediaId, mediaMap, existingRev?.image || '');
      return {
        id: idx + 1,
        name: String(t['name'] || ''),
        location: String(t['location'] || ''),
        review: String(t['quote'] || ''),
        rating: Number(t['rating'] || 5),
        image: parentImg,
        mediaId: parentMediaId ? Number(parentMediaId) : 1,
      };
    });
  }
}

export function deserializeFaq(
  s: PageBuilderSection,
  state: DeserializerTargetState,
  mediaMap: MediaDictionary,
  isEnabled: boolean
): void {
  const sec = state.sections.find((x) => x.key === 'faq');
  if (sec) sec.active = isEnabled;
  const c = s.content as Record<string, unknown>;
  if (!c) return;

  if (c['heading']) state.faq.sectionHeading = String(c['heading']);
  const items = c['items'];
  if (Array.isArray(items) && items.length > 0) {
    state.faq.faqs = items.map((item: Record<string, unknown>, idx: number) => ({
      id: idx + 1,
      question: String(item['question'] || ''),
      answer: String(item['answer'] || ''),
    }));
  }
}

export function deserializeLimitedSeats(
  s: PageBuilderSection,
  state: DeserializerTargetState,
  mediaMap: MediaDictionary,
  isEnabled: boolean
): void {
  const sec = state.sections.find((x) => x.key === 'limited-seats');
  if (sec) sec.active = isEnabled;
  const c = s.content as Record<string, unknown>;
  if (!c) return;

  if (c['availability_text']) state.limitedSeatsConfig.subHeading = String(c['availability_text']);
  if (c['urgency_text']) state.limitedSeatsConfig.heading = String(c['urgency_text']);
  if (c['brochure_cta'] && typeof c['brochure_cta'] === 'object') {
    const b = c['brochure_cta'] as Record<string, unknown>;
    if (b['label']) state.limitedSeatsConfig.buttonText = String(b['label']);
  }

  // Background Media
  const bgMediaId = c['background_media_id'] ?? c['desktop_background_media_id'];
  if (bgMediaId) {
    state.limitedSeatsConfig.backgroundMediaId = Number(bgMediaId);
    state.limitedSeatsConfig.background_media_id = Number(bgMediaId);
    state.limitedSeatsConfig.backgroundImage = resolveMediaUrl(
      bgMediaId,
      mediaMap,
      state.limitedSeatsConfig.backgroundImage || ''
    );
  }

  // Feature Media (Left card)
  const featMediaId = c['feature_media_id'] ?? c['media_id'];
  if (featMediaId) {
    state.limitedSeatsConfig.mediaId = Number(featMediaId);
    state.limitedSeatsConfig.feature_media_id = Number(featMediaId);
    state.limitedSeatsConfig.image = resolveMediaUrl(
      featMediaId,
      mediaMap,
      state.limitedSeatsConfig.image || ''
    );
  }

  // Statistics / Cards
  const stats = c['statistics'];
  if (Array.isArray(stats) && stats.length > 0) {
    state.limitedSeatsConfig.cards = stats.map((st: Record<string, unknown>, idx: number) => {
      const logoMediaId = st['logo_media_id'] ? Number(st['logo_media_id']) : null;
      const logoImg = logoMediaId ? resolveMediaUrl(logoMediaId, mediaMap, '') : '';
      return {
        id: idx + 1,
        title: String(st['title'] || (idx === 0 ? 'Narayana Schools' : 'Student Body')),
        label: String(st['label'] || (idx === 0 ? 'Pan India Campuses' : 'Enrolled Students')),
        value: String(st['value'] || (idx === 0 ? '300+' : '100,000+')),
        image: logoImg,
        mediaId: logoMediaId,
      };
    });
    if (state.limitedSeatsConfig.cards[0]) {
      state.limitedSeatsConfig.schoolName = state.limitedSeatsConfig.cards[0].title;
      state.limitedSeatsConfig.numberOfSchools = state.limitedSeatsConfig.cards[0].value;
    }
  }
}
