import { PageBuilderSection } from '../../../../services/dynamic-page.service';
import { normalizeImageUrl } from '../dynamic-page.model';
import { DeserializerTargetState } from '../dynamic-page.deserializer';
import { MediaDictionary, resolveMediaUrl } from './media-resolver';

export function deserializeHeader(
  s: PageBuilderSection,
  state: DeserializerTargetState,
  mediaMap: MediaDictionary,
  isEnabled: boolean
): void {
  const sec = state.sections.find((x) => x.key === 'header');
  if (sec) {
    sec.active = isEnabled;
  }

  const content = s.content as Record<string, unknown>;
  const logosData = content?.['logos'];

  if (Array.isArray(logosData)) {
    state.logos = logosData.map((item, idx) => {
      const logo = item as Record<string, unknown>;
      const rawMediaId = logo['media_id'] ?? logo['mediaId'];
      const parsedMediaId = Number(rawMediaId);
      const mediaObj = logo['media'] as Record<string, unknown> | undefined;

      const existing = state.logos.find(
        (l) =>
          (Number.isInteger(parsedMediaId) && parsedMediaId > 0 && l.mediaId === parsedMediaId) ||
          (logo['id'] !== undefined && l.id === Number(logo['id'])) ||
          (idx < state.logos.length && state.logos[idx].name === logo['name'])
      );

      const mediaUrl = resolveMediaUrl(rawMediaId, mediaMap);
      const rawUrl = String(
        mediaUrl ||
          logo['image_url'] ||
          logo['imageUrl'] ||
          logo['url'] ||
          logo['public_url'] ||
          logo['path'] ||
          mediaObj?.['url'] ||
          mediaObj?.['public_url'] ||
          mediaObj?.['path'] ||
          existing?.imageUrl ||
          ''
      ).trim();

      const resolvedUrl = normalizeImageUrl(rawUrl);

      return {
        id: Number(logo['id']) || idx + 1,
        name: String(logo['name'] || `Logo ${idx + 1}`),
        imageUrl: resolvedUrl,
        mediaId:
          rawMediaId !== null &&
          rawMediaId !== undefined &&
          Number.isInteger(parsedMediaId) &&
          parsedMediaId > 0
            ? parsedMediaId
            : (existing?.mediaId ?? null),
        desktopActive: Boolean(logo['show_desktop'] ?? logo['desktopActive'] ?? true),
        mobileActive: Boolean(logo['show_mobile'] ?? logo['mobileActive'] ?? true),
      };
    });
  }
}

export function deserializeBanner(
  s: PageBuilderSection,
  state: DeserializerTargetState,
  mediaMap: MediaDictionary,
  isEnabled: boolean
): void {
  const sec = state.sections.find((x) => x.key === 'banner');
  if (sec) sec.active = isEnabled;
  const c = s.content as Record<string, unknown>;
  if (!c) return;

  if (c['heading']) state.banner.heading = String(c['heading']);
  if (c['h1']) state.banner.h1 = String(c['h1']);
  if (c['eyebrow']) {
    const rawEyebrow = String(c['eyebrow']).trim();
    if (rawEyebrow.includes('Narayana School')) {
      state.banner.subHeading = rawEyebrow.replace('Narayana School', '').trim();
      state.banner.eyebrow_highlight = 'Narayana School';
    } else {
      state.banner.subHeading = rawEyebrow;
      state.banner.eyebrow_highlight = String(c['eyebrow_highlight'] || c['eyebrowHighlight'] || '');
    }
  } else if (c['subHeading']) {
    state.banner.subHeading = String(c['subHeading']);
  }
  if (c['highlighted_text']) state.banner.highlighted_text = String(c['highlighted_text']);
  else if (c['highlightText']) state.banner.highlighted_text = String(c['highlightText']);
  if (c['form_title']) state.banner.form_title = String(c['form_title']);
  else if (c['formTitle']) state.banner.form_title = String(c['formTitle']);
  const rawBullets = c['bullets'];
  if (Array.isArray(rawBullets) && rawBullets.length > 0) {
    state.banner.bullets = rawBullets.map((b: Record<string, unknown>, idx: number) => ({
      id: idx + 1,
      text: String(b['text'] || ''),
      show_desktop: Boolean(b['show_desktop'] ?? true),
      show_mobile: Boolean(b['show_mobile'] ?? true),
      sort_order: idx + 1,
    }));
  }
  const rawStats = c['stats'] || c['counters'];
  if (Array.isArray(rawStats) && rawStats.length > 0) {
    state.banner.stats = rawStats.map((st: Record<string, unknown>, idx: number) => ({
      id: idx + 1,
      value: String(st['value'] ?? (st['target'] !== undefined && st['target'] !== null ? `${st['target']}+` : '')),
      label: String(st['label'] ?? ''),
    }));
  }
  const primaryCta = c['primary_cta'] as Record<string, unknown> | undefined;
  if (primaryCta?.['label']) {
    state.banner.buttonText = String(primaryCta['label']);
  } else if (c['buttonText']) {
    state.banner.buttonText = String(c['buttonText']);
  } else if (c['button_text']) {
    state.banner.buttonText = String(c['button_text']);
  }
  if (primaryCta?.['url']) {
    state.banner.buttonUrl = String(primaryCta['url']);
  } else if (c['buttonUrl']) {
    state.banner.buttonUrl = String(c['buttonUrl']);
  }
  const desktopMediaId =
    c['desktop_background_media_id'] ??
    c['desktop_media_id'] ??
    c['media_id'] ??
    c['mediaId'];
  const bannerMediaUrl = resolveMediaUrl(desktopMediaId, mediaMap);
  const rawBg = String(
    bannerMediaUrl ||
      c['background_image_url'] ||
      c['backgroundImage'] ||
      c['desktop_background_url'] ||
      (c['desktop_media'] as Record<string, unknown>)?.['url'] ||
      state.banner.backgroundImage ||
      ''
  ).trim();
  if (rawBg) {
    state.banner.backgroundImage = normalizeImageUrl(rawBg);
  }
  if (desktopMediaId) {
    state.banner.mediaId = Number(desktopMediaId);
    (state.banner as any).desktop_background_media_id = Number(desktopMediaId);
  }
}

export function deserializeClasses(
  s: PageBuilderSection,
  state: DeserializerTargetState,
  mediaMap: MediaDictionary,
  isEnabled: boolean
): void {
  const sec = state.sections.find((x) => x.key === 'classes');
  if (sec) sec.active = isEnabled;
  const c = s.content as Record<string, unknown>;
  if (!c || !state.classesConfig) return;

  if (c['heading']) state.classesConfig.sectionHeading = String(c['heading']);
  if (c['subheading']) state.classesConfig.sectionSubHeading = String(c['subheading']);
  const programs = c['programs'];
  if (Array.isArray(programs) && programs.length > 0) {
    state.classesConfig.cards = programs.map((p: Record<string, unknown>, idx: number) => {
      const desktopMediaId = p['desktop_media_id'] ?? p['media_id'];
      const existingCard = state.classesConfig?.cards?.[idx];
      const cardImg = resolveMediaUrl(desktopMediaId, mediaMap, existingCard?.image || '');
      const features = (p['features'] as Array<Record<string, unknown>>) || [];
      const feesCta = p['fees_cta'] as Record<string, unknown> | undefined;
      const brochureCta = p['brochure_cta'] as Record<string, unknown> | undefined;

      return {
        id: idx + 1,
        image: cardImg,
        mediaId: desktopMediaId ? Number(desktopMediaId) : 1,
        heading: String(p['name'] || existingCard?.heading || `Program ${idx + 1}`),
        subHeading: String(p['class_range'] || existingCard?.subHeading || ''),
        h3Heading: String(p['summary'] || existingCard?.h3Heading || ''),
        listItems: features.map((f, fIdx) => ({
          id: fIdx + 1,
          text: String(f['text'] || ''),
        })),
        button1Text: String(feesCta?.['label'] || existingCard?.button1Text || 'Fee Structure'),
        button1Url: String(feesCta?.['url'] || existingCard?.button1Url || ''),
        button2Text: String(brochureCta?.['label'] || existingCard?.button2Text || 'Download Brochure'),
        button2Url: String(brochureCta?.['url'] || existingCard?.button2Url || ''),
      };
    });
  }
}

export function deserializeWhyUs(
  s: PageBuilderSection,
  state: DeserializerTargetState,
  mediaMap: MediaDictionary,
  isEnabled: boolean
): void {
  const sec = state.sections.find((x) => x.key === 'why-us');
  if (sec) sec.active = isEnabled;
  const c = s.content as Record<string, unknown>;
  if (!c) return;

  if (c['heading']) {
    const rawHeading = String(c['heading']).trim();
    if (rawHeading.includes('Narayana')) {
      const parts = rawHeading.split('Narayana');
      state.whyUs.sectionHeading = parts[0]?.trim() || 'Why Choose';
      state.whyUs.highlightWord = 'Narayana';
      state.whyUs.headingSuffix = parts[1]?.trim() || 'Schools';
    } else {
      state.whyUs.sectionHeading = rawHeading;
    }
  }
  if (c['highlight_word'] || c['highlightWord']) {
    state.whyUs.highlightWord = String(c['highlight_word'] || c['highlightWord']);
  }
  if (c['heading_suffix'] || c['headingSuffix']) {
    state.whyUs.headingSuffix = String(c['heading_suffix'] || c['headingSuffix']);
  }
  if (c['subheading']) state.whyUs.sectionSubHeading = String(c['subheading']);
  if (c['desktop_active'] !== undefined || c['desktopActive'] !== undefined) {
    state.whyUs.desktopActive = Boolean(c['desktop_active'] ?? c['desktopActive']);
  }
  if (c['mobile_active'] !== undefined || c['mobileActive'] !== undefined) {
    state.whyUs.mobileActive = Boolean(c['mobile_active'] ?? c['mobileActive']);
  }
  const items = c['items'];
  if (Array.isArray(items) && items.length > 0) {
    state.whyUs.boxes = items.map((item: Record<string, unknown>, idx: number) => {
      const iconMediaId = item['icon_media_id'] ?? item['media_id'];
      const existingBox = state.whyUs.boxes?.[idx];
      const iconUrl = resolveMediaUrl(iconMediaId, mediaMap, existingBox?.image || '');
      return {
        id: idx + 1,
        heading: String(item['title'] || item['heading'] || ''),
        paragraph: String(item['description'] || item['paragraph'] || ''),
        image: iconUrl,
        mediaId: Number(iconMediaId || 1),
      };
    });
  }
}
