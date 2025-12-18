import { isClient } from './is-client';
import { logger } from './logger';

const AUTH_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  SUBDOMAIN: 'subdomain',
  USER_NAME: 'userName',
  USER_EMAIL: 'userEmail',
  USER_ID: 'userId',
  USER_ROLE: 'userRole',
  IS_FIRST_LOGIN: 'isFirstLogin',
  SHOW_PASSWORD_MODAL: 'showPasswordModal',
  PASSWORD_CHANGED_PREFIX: 'passwordChanged_',
  ONBOARDING_TENANT_ID: 'onboarding_tenant_id',
  SIDEBAR_COLLAPSED: 'sidebarCollapsed',
};

type AuthKey = typeof AUTH_KEYS[keyof typeof AUTH_KEYS];

const getItem = (key: string): string | null => {
  if (!isClient()) {
    return null;
  }
  try {
    return globalThis.window.localStorage.getItem(key);
  } catch (e) {
    logger.error(`Error getting item from localStorage for key "${key}":`, e);
    return null;
  }
};

const setItem = (key: string, value: string): void => {
  if (!isClient()) {
    return;
  }
  try {
    globalThis.window.localStorage.setItem(key, value);
  } catch (e) {
    logger.error(`Error setting item to localStorage for key "${key}":`, e);
  }
};

const removeItem = (key: string): void => {
  if (!isClient()) {
    return;
  }
  try {
    globalThis.window.localStorage.removeItem(key);
  } catch (e) {
    logger.error(`Error removing item from localStorage for key "${key}":`, e);
  }
};

// Helpers exportados para uso genérico
export const getLocalStorageItem = (key: string): string | null => getItem(key);
export const setLocalStorageItem = (key: string, value: string): void => setItem(key, value);
export const removeLocalStorageItem = (key: string): void => removeItem(key);

export const authStorage = {
  get: (key: AuthKey): string | null => {
    return getItem(key);
  },
  set: (key: AuthKey, value: string): void => {
    setItem(key, value);
  },
  remove: (key: AuthKey): void => {
    removeItem(key);
  },
  // Specific getters/setters for common auth items
  getToken: () => getItem(AUTH_KEYS.TOKEN),
  setToken: (token: string) => setItem(AUTH_KEYS.TOKEN, token),
  removeToken: () => removeItem(AUTH_KEYS.TOKEN),

  getRefreshToken: () => getItem(AUTH_KEYS.REFRESH_TOKEN),
  setRefreshToken: (refreshToken: string) => setItem(AUTH_KEYS.REFRESH_TOKEN, refreshToken),
  removeRefreshToken: () => removeItem(AUTH_KEYS.REFRESH_TOKEN),

  getSubdomain: () => getItem(AUTH_KEYS.SUBDOMAIN),
  setSubdomain: (subdomain: string) => setItem(AUTH_KEYS.SUBDOMAIN, subdomain),
  removeSubdomain: () => removeItem(AUTH_KEYS.SUBDOMAIN),

  getUserName: () => getItem(AUTH_KEYS.USER_NAME),
  setUserName: (name: string) => setItem(AUTH_KEYS.USER_NAME, name),
  removeUserName: () => removeItem(AUTH_KEYS.USER_NAME),

  getUserEmail: () => getItem(AUTH_KEYS.USER_EMAIL),
  setUserEmail: (email: string) => setItem(AUTH_KEYS.USER_EMAIL, email),
  removeUserEmail: () => removeItem(AUTH_KEYS.USER_EMAIL),

  getUserId: () => getItem(AUTH_KEYS.USER_ID),
  setUserId: (id: string) => setItem(AUTH_KEYS.USER_ID, id),
  removeUserId: () => removeItem(AUTH_KEYS.USER_ID),

  getUserRole: () => getItem(AUTH_KEYS.USER_ROLE),
  setUserRole: (role: string) => setItem(AUTH_KEYS.USER_ROLE, role),
  removeUserRole: () => removeItem(AUTH_KEYS.USER_ROLE),

  getIsFirstLogin: () => getItem(AUTH_KEYS.IS_FIRST_LOGIN) === 'true',
  setIsFirstLogin: (isFirst: boolean) => setItem(AUTH_KEYS.IS_FIRST_LOGIN, String(isFirst)),
  removeIsFirstLogin: () => removeItem(AUTH_KEYS.IS_FIRST_LOGIN),

  getShowPasswordModal: () => getItem(AUTH_KEYS.SHOW_PASSWORD_MODAL) === 'true',
  setShowPasswordModal: (show: boolean) => setItem(AUTH_KEYS.SHOW_PASSWORD_MODAL, String(show)),
  removeShowPasswordModal: () => removeItem(AUTH_KEYS.SHOW_PASSWORD_MODAL),

  getPasswordChanged: (userId: string) => getItem(`${AUTH_KEYS.PASSWORD_CHANGED_PREFIX}${userId}`),
  setPasswordChanged: (userId: string, changed: boolean) => setItem(`${AUTH_KEYS.PASSWORD_CHANGED_PREFIX}${userId}`, String(changed)),
  removePasswordChanged: (userId: string) => removeItem(`${AUTH_KEYS.PASSWORD_CHANGED_PREFIX}${userId}`),

  getOnboardingTenantId: () => getItem(AUTH_KEYS.ONBOARDING_TENANT_ID),
  setOnboardingTenantId: (tenantId: string) => setItem(AUTH_KEYS.ONBOARDING_TENANT_ID, tenantId),
  removeOnboardingTenantId: () => removeItem(AUTH_KEYS.ONBOARDING_TENANT_ID),

  getSidebarCollapsed: () => getItem(AUTH_KEYS.SIDEBAR_COLLAPSED) === 'true',
  setSidebarCollapsed: (collapsed: boolean) => setItem(AUTH_KEYS.SIDEBAR_COLLAPSED, String(collapsed)),
  removeSidebarCollapsed: () => removeItem(AUTH_KEYS.SIDEBAR_COLLAPSED),

  clearAllAuthData: (): void => {
    Object.values(AUTH_KEYS).forEach(key => {
      // Special handling for PASSWORD_CHANGED_PREFIX to avoid removing all
      if (!key.startsWith(AUTH_KEYS.PASSWORD_CHANGED_PREFIX)) {
        removeItem(key);
      }
    });
  },
};

// UI-related storage utilities
export const uiStorage = {
  getSidebarCollapsed: () => getItem('sidebarCollapsed') === 'true',
  setSidebarCollapsed: (collapsed: boolean) => setItem('sidebarCollapsed', String(collapsed)),
  removeSidebarCollapsed: () => removeItem('sidebarCollapsed'),
};
