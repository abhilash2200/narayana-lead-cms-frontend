export interface CityOption {
  id: number;
  name: string;
  slug: string;
}

export interface BranchOption {
  id: number;
  city_id: number;
  name: string;
  slug: string;
}

export interface ClassOption {
  id: number;
  name: string;
  slug: string;
}

export interface PageRevision {
  id: number | string;
  page_id: number | string;
  version_no: number | string;
  title: string;
  seo_title: string;
  seo_description: string;
  is_indexed?: boolean;
  robots?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ToastState {
  show: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  pageId?: number | null;
}

export interface ConfirmModalState {
  show: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger?: boolean;
  action: () => void;
}
