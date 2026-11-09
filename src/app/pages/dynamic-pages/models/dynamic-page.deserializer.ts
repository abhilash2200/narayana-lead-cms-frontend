import { PageBuilderSection } from '../../../services/dynamic-page.service';
import {
  BannerConfig,
  LogoConfig,
  SectionConfig,
  normalizeImageUrl,
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

export type MediaDictionary = Record<string, { id?: number | string; public_url?: string; url?: string }>;

export function createMediaMap(rawMedia: unknown): MediaDictionary {
  const map: MediaDictionary = {};
  if (!rawMedia) return map;

  if (Array.isArray(rawMedia)) {
    for (const item of rawMedia) {
      if (item && item.id !== undefined && item.id !== null) {
        map[String(item.id)] = item;
      }
    }
  } else if (typeof rawMedia === 'object') {
    for (const [key, value] of Object.entries(rawMedia as Record<string, unknown>)) {
      if (value && typeof value === 'object') {
        const valObj = value as { id?: number | string; public_url?: string; url?: string };
        map[String(key)] = valObj;
        if (valObj.id !== undefined && valObj.id !== null) {
          map[String(valObj.id)] = valObj;
        }
      }
    }
  }
  return map;
}

function resolveMediaUrl(
  mediaId: unknown,
  mediaMap: MediaDictionary | undefined,
  fallbackUrl?: string,
): string {
  if (mediaId !== null && mediaId !== undefined && mediaMap) {
    const item = mediaMap[String(mediaId)];
    const resolved = item?.public_url || item?.url;
    if (resolved) {
      return normalizeImageUrl(resolved);
    }
  }
  return fallbackUrl ? normalizeImageUrl(fallbackUrl) : '';
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
      case 'HEADER': {
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
                (idx < state.logos.length && state.logos[idx].name === logo['name']),
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
              '',
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
              desktopActive: Boolean(
                logo['show_desktop'] ?? logo['desktopActive'] ?? true,
              ),
              mobileActive: Boolean(
                logo['show_mobile'] ?? logo['mobileActive'] ?? true,
              ),
            };
          });
        }
        break;
      }

      case 'BANNER': {
        const sec = state.sections.find((x) => x.key === 'banner');
        if (sec) sec.active = isEnabled;
        const c = s.content as Record<string, unknown>;
        if (c) {
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
            '',
          ).trim();
          if (rawBg) {
            state.banner.backgroundImage = normalizeImageUrl(rawBg);
          }
          if (desktopMediaId) {
            state.banner.mediaId = Number(desktopMediaId);
            (state.banner as any).desktop_background_media_id = Number(desktopMediaId);
          }
        }
        break;
      }

      case 'CLASSES': {
        const sec = state.sections.find((x) => x.key === 'classes');
        if (sec) sec.active = isEnabled;
        const c = s.content as Record<string, unknown>;
        if (c && state.classesConfig) {
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
        break;
      }

      case 'WHY_US': {
        const sec = state.sections.find((x) => x.key === 'why-us');
        if (sec) sec.active = isEnabled;
        const c = s.content as Record<string, unknown>;
        if (c) {
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
        break;
      }

      case 'COURSES': {
        const sec = state.sections.find((x) => x.key === 'course');
        if (sec) sec.active = isEnabled;
        const c = s.content as Record<string, unknown>;
        if (c) {
          if (c['heading']) state.course.sectionHeading = String(c['heading']);
          const programs = c['programs'];
          if (Array.isArray(programs) && programs.length > 0) {
            state.course.courses = programs.map((p: Record<string, unknown>, idx: number) => {
              const fgs = (p['feature_groups'] as Array<Record<string, unknown>>) || [];
              const fg1 = fgs[0];
              const fg2 = fgs[1];
              const fg3 = fgs[2];
              const fg4 = fgs[3];

              const mapPoints = (fg: Record<string, unknown> | undefined) => {
                const pts = (fg?.['points'] as Array<Record<string, unknown>>) || [];
                return pts.map((pt, ptIdx) => ({
                  id: ptIdx + 1,
                  text: String(pt['text'] || ''),
                }));
              };

              const courseMediaId1 = p['desktop_primary_media_id'] ?? p['media_id'] ?? p['image_media_id'];
              const courseMediaId2 = p['desktop_secondary_media_id'];
              const courseMobileMediaId = p['mobile_media_id'];
              const courseBadgeMediaId = p['badge_icon_media_id'];
              const existingCourse = state.course.courses?.[idx];
              const courseImg = resolveMediaUrl(courseMediaId1, mediaMap, existingCourse?.image1 || '');
              const courseImg2 = resolveMediaUrl(courseMediaId2, mediaMap, existingCourse?.image2 || '');
              const courseMobileImg = resolveMediaUrl(courseMobileMediaId, mediaMap, existingCourse?.mobileImage || '');
              const badgeImg = resolveMediaUrl(courseBadgeMediaId, mediaMap, existingCourse?.badgeIconImage || '');

              const rawMobileHighlights = Array.isArray(p['mobile_highlights']) ? p['mobile_highlights'] : [];
              const mobileHighlights = rawMobileHighlights
                .filter((item) => typeof item === 'object' && item !== null && 'text' in item)
                .map((item, mIdx) => ({
                  id: mIdx + 1,
                  text: String((item as { text: string }).text || ''),
                }));

              const feesCta = p['fees_cta'] as Record<string, unknown> | undefined;
              const brochureCta = p['brochure_cta'] as Record<string, unknown> | undefined;
              const callbackCta = p['callback_cta'] as Record<string, unknown> | undefined;

              return {
                id: idx + 1,
                heading: String(p['name'] || ''),
                classRange: String(p['class_range'] || ''),
                subHeading1: String(fg1?.['title'] || ''),
                icon1: String(fg1?.['icon_key'] || 'TRENDING_UP'),
                subHeading2: String(fg2?.['title'] || ''),
                icon2: String(fg2?.['icon_key'] || 'PUZZLE'),
                subHeading3: String(fg3?.['title'] || ''),
                icon3: String(fg3?.['icon_key'] || 'FLASK'),
                subHeading4: String(fg4?.['title'] || ''),
                icon4: String(fg4?.['icon_key'] || 'ID_BADGE'),
                image1: courseImg,
                image2: courseImg2,
                mobileImage: courseMobileImg,
                mediaId: courseMediaId1 ? Number(courseMediaId1) : 1,
                mediaId1: courseMediaId1 ? Number(courseMediaId1) : 1,
                mediaId2: courseMediaId2 ? Number(courseMediaId2) : undefined,
                mobileMediaId: courseMobileMediaId ? Number(courseMobileMediaId) : null,
                mobileHighlights,
                badgeIconImage: badgeImg,
                badgeIconMediaId: courseBadgeMediaId ? Number(courseBadgeMediaId) : null,
                listItems1: mapPoints(fg1),
                listItems2: mapPoints(fg2),
                listItems3: mapPoints(fg3),
                listItems4: mapPoints(fg4),
                buttonText1: String(feesCta?.['label'] || ''),
                buttonUrl1: String(feesCta?.['url'] || ''),
                buttonText2: String(brochureCta?.['label'] || ''),
                buttonUrl2: String(brochureCta?.['url'] || ''),
                buttonText3: String(callbackCta?.['label'] || ''),
                buttonUrl3: String(callbackCta?.['url'] || ''),
              };
            });
          }
        }
        break;
      }

      case 'RIGHT_SCHOOL': {
        const sec = state.sections.find((x) => x.key === 'right-school');
        if (sec) sec.active = isEnabled;
        const c = s.content as Record<string, unknown>;
        if (c) {
          if (c['heading']) state.rightSchool.sectionHeading = String(c['heading']);
          if (c['subheading']) state.rightSchool.sectionSubHeading = String(c['subheading']);
          const items = c['items'];
          if (Array.isArray(items) && items.length > 0) {
            state.rightSchool.cards = items.map((item: Record<string, unknown>, idx: number) => {
              const cardMediaId = item['media_id'] ?? item['image_media_id'];
              const existingCard = state.rightSchool.cards?.[idx];
              const cardImg = resolveMediaUrl(cardMediaId, mediaMap, existingCard?.image || '');
              return {
                id: idx + 1,
                image: cardImg,
                mediaId: cardMediaId ? Number(cardMediaId) : 1,
                heading: String(item['title'] || ''),
                paragraph: String(item['description'] || ''),
              };
            });
          }
        }
        break;
      }

      case 'ACADEMIC_RESULTS': {
        const sec = state.sections.find((x) => x.key === 'academic-results');
        if (sec) sec.active = isEnabled;
        const c = s.content as Record<string, unknown>;
        if (c) {
          if (c['heading']) state.academicResults.sectionHeading = String(c['heading']);
          if (c['subheading']) state.academicResults.sectionSubHeading = String(c['subheading']);
          const results = c['results'];
          if (Array.isArray(results) && results.length > 0) {
            state.academicResults.results = results.map((r: Record<string, unknown>, idx: number) => {
              const studentMediaId = r['student_photo_media_id'] ?? r['media_id'] ?? r['photo_media_id'];
              const existingRes = state.academicResults.results?.[idx];
              const studentImg = resolveMediaUrl(studentMediaId, mediaMap, existingRes?.image || '');
              return {
                id: idx + 1,
                image: studentImg,
                mediaId: studentMediaId ? Number(studentMediaId) : 1,
                studentName: String(r['student_name'] || ''),
                marks: String(r['score'] || ''),
                boardName: String(r['exam'] || 'CBSE'),
                buttonText: '',
                buttonUrl: '',
              };
            });
          }
        }
        break;
      }

      case 'IMAGE_SECTION': {
        const sec = state.sections.find((x) => x.key === 'image-section');
        if (sec) sec.active = isEnabled;
        const c = s.content as Record<string, unknown>;
        if (c) {
          const desktopMediaId = c['desktop_media_id'] ?? c['media_id'] ?? c['mediaId'];
          const mobileMediaId = (c['mobile_images'] as Array<Record<string, unknown>>)?.[0]?.['media_id'] ?? c['mobile_media_id'];
          if (desktopMediaId) {
            state.imageSection.desktop_media_id = Number(desktopMediaId);
            state.imageSection.mediaId = Number(desktopMediaId);
            state.imageSection.desktopImage = resolveMediaUrl(desktopMediaId, mediaMap, state.imageSection.desktopImage);
          }
          if (mobileMediaId) {
            state.imageSection.mobile_media_id = Number(mobileMediaId);
            state.imageSection.mobileImage = resolveMediaUrl(mobileMediaId, mediaMap, state.imageSection.mobileImage);
          }
        }
        break;
      }

      case 'PARENTS_SAY': {
        const sec = state.sections.find((x) => x.key === 'parents-say');
        if (sec) sec.active = isEnabled;
        const c = s.content as Record<string, unknown>;
        if (c) {
          const testimonials = c['testimonials'];
          if (Array.isArray(testimonials) && testimonials.length > 0) {
            state.parentsSay.reviews = testimonials.map((t: Record<string, unknown>, idx: number) => {
              const parentMediaId = t['parent_photo_media_id'] ?? t['media_id'] ?? t['avatar_media_id'] ?? t['photo_media_id'];
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
        break;
      }

      case 'FACILITIES': {
        const sec = state.sections.find((x) => x.key === 'facilities');
        if (sec) sec.active = isEnabled;
        const c = s.content as Record<string, unknown>;
        if (c) {
          if (c['heading']) state.facilities.sectionHeading = String(c['heading']);
          if (c['subheading']) state.facilities.sectionSubHeading = String(c['subheading']);
          const items = c['items'];
          if (Array.isArray(items) && items.length > 0) {
            state.facilities.facilities = items.map((f: Record<string, unknown>, idx: number) => {
              const facMediaId = f['facility_photo_media_id'] ?? f['media_id'] ?? f['photo_media_id'];
              const existingFac = state.facilities.facilities?.[idx];
              const facImg = resolveMediaUrl(facMediaId, mediaMap, existingFac?.image || '');
              return {
                id: idx + 1,
                image: facImg,
                mediaId: facMediaId ? Number(facMediaId) : 1,
                heading: String(f['title'] || ''),
                paragraph: String(f['description'] || ''),
              };
            });
          }
        }
        break;
      }

      case 'FAQ': {
        const sec = state.sections.find((x) => x.key === 'faq');
        if (sec) sec.active = isEnabled;
        const c = s.content as Record<string, unknown>;
        if (c) {
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
        break;
      }

      case 'LIMITED_SEATS': {
        const sec = state.sections.find((x) => x.key === 'limited-seats');
        if (sec) sec.active = isEnabled;
        const c = s.content as Record<string, unknown>;
        if (c) {
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
            state.limitedSeatsConfig.backgroundImage = resolveMediaUrl(bgMediaId, mediaMap, state.limitedSeatsConfig.backgroundImage || '');
          }

          // Feature Media (Left card)
          const featMediaId = c['feature_media_id'] ?? c['media_id'];
          if (featMediaId) {
            state.limitedSeatsConfig.mediaId = Number(featMediaId);
            state.limitedSeatsConfig.feature_media_id = Number(featMediaId);
            state.limitedSeatsConfig.image = resolveMediaUrl(featMediaId, mediaMap, state.limitedSeatsConfig.image || '');
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
        break;
      }
    }
  }
}
