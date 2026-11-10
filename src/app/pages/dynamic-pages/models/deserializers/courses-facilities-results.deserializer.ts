import { PageBuilderSection } from '../../../../services/dynamic-page.service';
import { DeserializerTargetState } from '../dynamic-page.deserializer';
import { MediaDictionary, resolveMediaUrl } from './media-resolver';

export function deserializeCourses(
  s: PageBuilderSection,
  state: DeserializerTargetState,
  mediaMap: MediaDictionary,
  isEnabled: boolean
): void {
  const sec = state.sections.find((x) => x.key === 'course');
  if (sec) sec.active = isEnabled;
  const c = s.content as Record<string, unknown>;
  if (!c) return;

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

export function deserializeRightSchool(
  s: PageBuilderSection,
  state: DeserializerTargetState,
  mediaMap: MediaDictionary,
  isEnabled: boolean
): void {
  const sec = state.sections.find((x) => x.key === 'right-school');
  if (sec) sec.active = isEnabled;
  const c = s.content as Record<string, unknown>;
  if (!c) return;

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

export function deserializeAcademicResults(
  s: PageBuilderSection,
  state: DeserializerTargetState,
  mediaMap: MediaDictionary,
  isEnabled: boolean
): void {
  const sec = state.sections.find((x) => x.key === 'academic-results');
  if (sec) sec.active = isEnabled;
  const c = s.content as Record<string, unknown>;
  if (!c) return;

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

export function deserializeFacilities(
  s: PageBuilderSection,
  state: DeserializerTargetState,
  mediaMap: MediaDictionary,
  isEnabled: boolean
): void {
  const sec = state.sections.find((x) => x.key === 'facilities');
  if (sec) sec.active = isEnabled;
  const c = s.content as Record<string, unknown>;
  if (!c) return;

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
