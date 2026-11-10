export interface BackendLeadFilters {
  otp_validation: string;
  city: string;
  branch: string;
  class: string;
  board: string;
  class_category: string;
  reservation_type: string;
  redirect_from: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  [key: string]: string;
}

export interface DynamicFilterOptionGroup {
  key: string;
  label: string;
  options: string[];
}
