/** Resolve a path under the Vite `base` (e.g. `/` or `/ostdle/`). */
export function assetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base}${relativePath.replace(/^\//, '')}`;
}

export function getAudioUrl(filename: string): string {
  return assetUrl(`assets/audio/${filename}`);
}
