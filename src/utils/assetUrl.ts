const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

export function assetUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}
