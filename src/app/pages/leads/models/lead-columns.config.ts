export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  optional?: boolean;
}

export const BACKEND_SORTABLE_COLUMNS = new Set([
  'id',
  'entrydate',
  'name',
  'phone',
  'city',
  'branch',
  'class',
  'otp_validation',
  'utm_source',
]);

export const FILTER_KEY_TO_PARAM_MAP: Record<string, string> = {
  cities: 'city',
  city: 'city',
  branches: 'branch',
  branch: 'branch',
  boards: 'board',
  board: 'board',
  classes: 'class',
  class: 'class',
  reservation_types: 'reservation_type',
  reservation_type: 'reservation_type',
  utm_sources: 'utm_source',
  utm_source: 'utm_source',
  utm_mediums: 'utm_medium',
  utm_medium: 'utm_medium',
  utm_campaigns: 'utm_campaign',
  utm_campaign: 'utm_campaign',
  otp_validation: 'otp_validation',
  redirect_from: 'redirect_from',
  class_category: 'class_category',
};

export const DEFAULT_LEAD_COLUMNS: ColumnConfig[] = [
  { key: 'sno', label: '#', visible: true, optional: true },
  { key: 'id', label: 'ID', visible: true, optional: false },
  { key: 'entrydate', label: 'Entry Date', visible: true, optional: true },
  { key: 'name', label: 'Name', visible: true, optional: true },
  { key: 'phone', label: 'Phone', visible: true, optional: true },
  { key: 'parent_email', label: 'Email', visible: true, optional: true },
  { key: 'otp_validation', label: 'OTP', visible: true, optional: true },
  { key: 'city', label: 'City', visible: true, optional: true },
  { key: 'branch', label: 'Branch', visible: true, optional: true },
  { key: 'board', label: 'Board', visible: true, optional: true },
  { key: 'class', label: 'Class', visible: true, optional: true },
  { key: 'class_category', label: 'Class Category', visible: true, optional: true },
  { key: 'stream', label: 'Stream', visible: true, optional: true },
  { key: 'course', label: 'Course', visible: true, optional: true },
  { key: 'reservation_type', label: 'Reservation', visible: true, optional: true },
  { key: 'utm_source', label: 'UTM Source', visible: true, optional: true },
  { key: 'utm_campaign', label: 'UTM Campaign', visible: true, optional: true },
  { key: 'utm_medium', label: 'UTM Medium', visible: false, optional: true },
  { key: 'utm_content', label: 'UTM Content', visible: false, optional: true },
  { key: 'utm_term', label: 'UTM Term', visible: false, optional: true },
  { key: 'redirect_from', label: 'Redirect From', visible: false, optional: true },
  { key: 'page_section', label: 'Page Section', visible: false, optional: true },
];

export const DEFAULT_COL_WIDTHS: Record<string, number> = {
  sno: 50,
  id: 65,
  entrydate: 140,
  name: 150,
  phone: 110,
  parent_email: 180,
  otp_validation: 85,
  city: 100,
  branch: 110,
  board: 80,
  class: 90,
  class_category: 100,
  stream: 100,
  course: 110,
  reservation_type: 110,
  utm_source: 130,
  utm_campaign: 140,
  utm_medium: 110,
  utm_content: 110,
  utm_term: 110,
  redirect_from: 130,
  page_section: 120,
};
