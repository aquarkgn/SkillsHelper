// 兼容出口：品牌身份和别名全部由 brand-registry 维护。
import {
  BRAND_REGISTRY,
  normalizeBrandKey,
  resolveBrandEntry,
  resolveBrandByHostname,
} from './brand-registry.mjs';

export { BRAND_REGISTRY, normalizeBrandKey };

export const BRAND_APP_MAP = Object.fromEntries(Object.entries(BRAND_REGISTRY).map(([id, entry]) => [id, {
  bundleIds: [...entry.bundleIds],
  appNames: [],
  aliases: [...entry.aliases],
  fingerprints: [...entry.fingerprints],
  officialIconPages: [entry.sourceUrl],
  officialIconUrls: [],
  remoteIconCache: false,
}]));

export function resolveBrandSpec(key) {
  const entry = resolveBrandEntry(key);
  return entry ? BRAND_APP_MAP[entry.id] : null;
}

export function emojiForBrand() {
  return undefined;
}

export function extractHostname(value) {
  if (!value) return null;
  try {
    return new URL(String(value).includes('://') ? String(value) : `https://${value}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function resolveBrandByFingerprint(value) {
  return resolveBrandByHostname(value);
}
