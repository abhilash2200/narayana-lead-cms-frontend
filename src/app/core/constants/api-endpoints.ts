export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
  },
  BRANCHES: {
    BASE: '/branches',
    BY_ID: (id: number | string) => `/branches/${id}`,
  },
  CITIES: {
    BASE: '/cities',
    BY_ID: (id: number | string) => `/cities/${id}`,
  },
  CLASSES: {
    BASE: '/classes',
    BY_ID: (id: number | string) => `/classes/${id}`,
  },
  ADMISSION_OPTIONS: {
    BASE: '/admission-options',
    BY_ID: (id: number | string) => `/admission-options/${id}`,
  },

  MEDIA: {
    BASE: '/media',
    BY_ID: (id: number | string) => `/media/${id}`,
  },
  PAGES: {
    BASE: '/pages',
    BY_ID: (id: number | string) => `/pages/${id}`,
    CLONE: (pageId: number | string) => `/pages/${pageId}/clone`,
    REVISIONS: (pageId: number | string) => `/pages/${pageId}/revisions`,
    REVISION_BY_ID: (pageId: number | string, revisionId: number | string) =>
      `/pages/${pageId}/revisions/${revisionId}`,
    PUBLISH_REVISION: (pageId: number | string, revisionId: number | string) =>
      `/pages/${pageId}/revisions/${revisionId}/publish`,
    REVISION_SECTIONS: (pageId: number | string, revisionId: number | string) =>
      `/pages/${pageId}/revisions/${revisionId}/sections`,
    UNPUBLISH: (pageId: number | string) => `/pages/${pageId}/unpublish`,
  },

  LEADS: {
    BASE: '/leads',
    MODULES: '/leads/modules',
    FILTER_OPTIONS: '/leads/filter-options',
    EXPORT: '/leads/export',
    BY_ID: (id: number | string) => `/leads/${id}`,
  },
  DOCUMENTS: {
    BASE: '/documents',
    BY_ID: (id: number | string) => `/documents/${id}`,
  },
  DOWNLOAD_RULES: {
    BASE: '/download-rules',
    BY_ID: (id: number | string) => `/download-rules/${id}`,
  },
} as const;
