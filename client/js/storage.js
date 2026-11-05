/**
 * Quick Cover Storage Module
 * - IndexedDB for University Logo Blob persistence
 * - localStorage for Draft Form data persistence
 * - Automatic localStorage fallback for Logo if IndexedDB is unavailable
 * - Robust error handling for QuotaExceededError, corrupt JSON, and unavailable storage
 */

const DB_NAME = 'covercraft';
const DB_VERSION = 1;
const LOGO_STORE = 'logo';
const LOGO_KEY = 'current';

const DRAFT_STORAGE_KEY = 'covercraft-draft-v1';
const LOGO_FALLBACK_KEY = 'covercraft-logo-fallback-v1';

export let isFallback = false;
export let isStorageAvailable = true;

/**
 * Check if localStorage is supported and accessible
 */
function checkLocalStorageSupport() {
  try {
    if (typeof window === 'undefined' || !('localStorage' in window)) {
      return false;
    }
    const testKey = '__qc_storage_probe__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

isStorageAvailable = checkLocalStorageSupport();

/**
 * Check if IndexedDB is supported and accessible
 */
function checkIdbSupport() {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

let dbPromise = null;

function getDB() {
  if (!checkIdbSupport()) {
    isFallback = true;
    return Promise.reject(new Error('IndexedDB not supported'));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(LOGO_STORE)) {
            db.createObjectStore(LOGO_STORE);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          isFallback = true;
          reject(request.error);
        };
      } catch (err) {
        isFallback = true;
        reject(err);
      }
    });
  }
  return dbPromise;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Persist logo blob to IndexedDB, falling back to localStorage data URL
 * Returns result object { success: boolean, reason?: string, fallback?: boolean }
 */
export async function saveLogo(blob) {
  try {
    const db = await getDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(LOGO_STORE, 'readwrite');
      const store = tx.objectStore(LOGO_STORE);
      const req = store.put(blob, LOGO_KEY);
      req.onsuccess = () => resolve({ success: true, fallback: false });
      req.onerror = () => reject(req.error);
    });
  } catch {
    isFallback = true;
    try {
      if (!isStorageAvailable) {
        return { success: false, reason: 'unavailable' };
      }
      const dataUrl = await blobToDataUrl(blob);
      localStorage.setItem(LOGO_FALLBACK_KEY, dataUrl);
      return { success: true, fallback: true };
    } catch (fallbackErr) {
      console.warn('Failed to save logo to fallback storage:', fallbackErr);
      if (
        fallbackErr &&
        (fallbackErr.name === 'QuotaExceededError' ||
          fallbackErr.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          fallbackErr.code === 22)
      ) {
        return { success: false, reason: 'quota' };
      }
      isStorageAvailable = false;
      return { success: false, reason: 'unavailable' };
    }
  }
}

/**
 * Load logo from IndexedDB, falling back to localStorage data URL
 */
export async function loadLogo() {
  try {
    const db = await getDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(LOGO_STORE, 'readonly');
      const store = tx.objectStore(LOGO_STORE);
      const req = store.get(LOGO_KEY);
      req.onsuccess = () => {
        const result = req.result;
        resolve(result instanceof Blob ? result : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    isFallback = true;
    if (!isStorageAvailable) return null;
    let dataUrl = null;
    try {
      dataUrl = localStorage.getItem(LOGO_FALLBACK_KEY);
    } catch {
      isStorageAvailable = false;
      return null;
    }
    if (!dataUrl) return null;
    try {
      return dataUrlToBlob(dataUrl);
    } catch {
      return null;
    }
  }
}

/**
 * Delete logo from both localStorage fallback and IndexedDB
 */
export async function deleteLogo() {
  if (isStorageAvailable) {
    try {
      localStorage.removeItem(LOGO_FALLBACK_KEY);
    } catch {
      // ignore
    }
  }
  try {
    const db = await getDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(LOGO_STORE, 'readwrite');
      const store = tx.objectStore(LOGO_STORE);
      const req = store.delete(LOGO_KEY);
      req.onsuccess = () => resolve({ success: true });
      req.onerror = () => reject(req.error);
    });
  } catch {
    return { success: true };
  }
}

/**
 * Save draft to localStorage with error handling for quota and availability
 * Returns { success: boolean, reason?: 'quota' | 'unavailable' }
 */
export function saveDraft(obj) {
  if (!isStorageAvailable) {
    return { success: false, reason: 'unavailable' };
  }
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(obj));
    return { success: true };
  } catch (err) {
    console.warn('Failed to save draft to localStorage:', err);
    if (
      err &&
      (err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err.code === 22)
    ) {
      return { success: false, reason: 'quota' };
    }
    isStorageAvailable = false;
    return { success: false, reason: 'unavailable' };
  }
}

/**
 * Load draft from localStorage
 * Returns result object { status: 'ok' | 'empty' | 'corrupt' | 'newer_version' | 'unavailable', data: object | null, version?: number }
 */
export function loadDraft() {
  if (!isStorageAvailable) {
    return { status: 'unavailable', data: null };
  }
  let raw = null;
  try {
    raw = localStorage.getItem(DRAFT_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to read draft from localStorage:', err);
    isStorageAvailable = false;
    return { status: 'unavailable', data: null };
  }

  if (raw === null || raw === undefined) {
    return { status: 'empty', data: null };
  }

  let parsed = null;
  try {
    parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Draft payload is not a valid JSON object');
    }
  } catch (err) {
    console.warn('Corrupt draft found in localStorage:', err);
    clearDraft();
    return { status: 'corrupt', data: null };
  }

  const version = parsed.draftVersion || 1;
  if (version > 2) {
    console.warn(`Draft format version (${version}) is newer than supported version (2)`);
    return { status: 'newer_version', data: null, version };
  }

  return { status: 'ok', data: parsed, version };
}

/**
 * Clear draft from localStorage
 */
export function clearDraft() {
  if (!isStorageAvailable) return;
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear draft:', err);
  }
}
