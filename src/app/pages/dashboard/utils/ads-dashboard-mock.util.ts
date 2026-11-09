import { LeadItem } from '../../../services/lead.service';
import { formatLocalDateToYMD } from './ads-dashboard-calculator.util';

/**
 * Generates realistic dummy leads for the Ads Management Dashboard.
 * Spans today and the past 30 days to ensure all date presets (Today, Yesterday, 7D, 30D, This Month)
 * render rich, realistic metrics, charts, and campaign attribution tables.
 */
export function generateAdsDashboardMockLeads(): LeadItem[] {
  const leads: LeadItem[] = [];
  const now = new Date();

  const courses = [
    'Class 10 (CBSE)',
    'Class 11 - Science (NEET)',
    'Class 12 - Science (JEE)',
    'Class 8 (Foundation)',
    'Class 11 - Commerce',
    'Pre-Primary (Nursery - KG)',
    'Class 9 (CBSE)',
    'Class 6 (Middle School)',
  ];

  const branches = [
    { branch: 'Salt Lake Campus', city: 'Kolkata' },
    { branch: 'New Town Campus', city: 'Kolkata' },
    { branch: 'Howrah Campus', city: 'Howrah' },
    { branch: 'Ballygunge Campus', city: 'Kolkata' },
    { branch: 'Siliguri Campus', city: 'Siliguri' },
  ];

  const campaigns = [
    { source: 'google_search', campaign: 'admissions_2027_brand', medium: 'cpc' },
    { source: 'google_search', campaign: 'cbse_schools_kolkata', medium: 'cpc' },
    { source: 'meta_instagram', campaign: 'kolkata_parents_story', medium: 'paid_social' },
    { source: 'meta_instagram', campaign: 'neet_toppers_carousel', medium: 'paid_social' },
    { source: 'meta_facebook', campaign: 'admission_open_2027_feed', medium: 'paid_social' },
    { source: 'youtube_ads', campaign: 'campus_tour_video', medium: 'video' },
    { source: 'direct', campaign: 'organic_website_inquiry', medium: 'direct' },
  ];

  const firstNames = [
    'Aarav', 'Ananya', 'Rohan', 'Sneha', 'Ishaan', 'Pooja', 'Vikram', 'Aditi',
    'Subhash', 'Kavita', 'Arjun', 'Tanvi', 'Sanjay', 'Riya', 'Amit', 'Neha',
    'Dev', 'Anushka', 'Rajesh', 'Priyanka', 'Karan', 'Meera', 'Sourav', 'Debolina'
  ];

  const lastNames = [
    'Sharma', 'Banerjee', 'Chatterjee', 'Sen', 'Mukherjee', 'Roy', 'Dutta',
    'Das', 'Bose', 'Ghosh', 'Gupta', 'Ganguly', 'Mitra', 'Chakraborty', 'Mondal'
  ];

  let idCounter = 1001;

  // Reusable phone numbers to simulate realistic duplicates
  const recurringPhones = [
    '9830112233',
    '9831223344',
    '9830998877',
    '9874112255',
    '9123456789',
    '9836778899',
  ];

  // Helper to pad numbers
  const pad = (n: number) => String(n).padStart(2, '0');

  // Generate data for each of the last 30 days + today (days 0..30 backwards)
  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const d = new Date(now);
    d.setDate(now.getDate() - daysAgo);
    const dateStr = formatLocalDateToYMD(d);

    // Number of leads for this day:
    // Today gets 48-65 leads, yesterday gets 40-55, other days get 10-25 leads
    const countForDay = daysAgo === 0 ? 56 : daysAgo === 1 ? 46 : 14 + ((daysAgo * 7) % 12);

    for (let i = 0; i < countForDay; i++) {
      const isTest = i === 0 && daysAgo % 4 === 0; // occasional test lead
      const isDuplicate = i > 0 && i % 6 === 0; // ~16% duplicate rate

      const firstName = isTest ? 'Test User' : firstNames[(i + daysAgo * 3) % firstNames.length];
      const lastName = isTest ? `QA_${daysAgo}` : lastNames[(i * 2 + daysAgo) % lastNames.length];
      const name = `${firstName} ${lastName}`;

      let phone: string;
      if (isTest) {
        phone = '9999999999';
      } else if (isDuplicate) {
        phone = recurringPhones[(i + daysAgo) % recurringPhones.length];
      } else {
        const uniqueSuffix = pad((idCounter % 900) + 100);
        phone = `9830${pad(daysAgo)}${uniqueSuffix}`;
      }

      // Realistic hour distribution: morning peak (10-12), evening peak (19-21)
      let hour: number;
      const seed = (i * 13 + daysAgo * 7) % 100;
      if (seed < 25) {
        hour = 10 + (seed % 3); // 10, 11, 12
      } else if (seed < 55) {
        hour = 18 + (seed % 4); // 18, 19, 20, 21
      } else if (seed < 80) {
        hour = 13 + (seed % 5); // 13, 14, 15, 16, 17
      } else {
        hour = 8 + (seed % 2); // 8, 9
      }
      const minute = (i * 17) % 60;
      const second = (i * 23) % 60;
      const entrydate = `${dateStr} ${pad(hour)}:${pad(minute)}:${pad(second)}`;

      // OTP Verification: ~74% verified, ~26% pending
      const isVerified = !isTest && ((i + daysAgo * 2) % 10 < 7);
      const otp_validation = isVerified ? 'Verified' : 'Pending';

      const campObj = campaigns[(i + daysAgo) % campaigns.length];
      const course = courses[(i * 3 + daysAgo) % courses.length];
      const loc = branches[(i + daysAgo) % branches.length];

      leads.push({
        id: idCounter++,
        entrydate,
        name,
        phone,
        parent_email: isTest ? 'test@example.com' : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
        otp_validation,
        utm_source: campObj.source,
        utm_campaign: campObj.campaign,
        utm_medium: campObj.medium,
        course,
        class: course.split(' ')[1] || course,
        branch: loc.branch,
        city: loc.city,
        board: course.includes('CBSE') ? 'CBSE' : course.includes('NEET') || course.includes('JEE') ? 'CBSE + Integrated' : 'ICSE',
        page_section: 'apply_admission_form',
      });
    }
  }

  // Reverse so newest leads appear first in raw leads list
  return leads.reverse();
}

