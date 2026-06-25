const cache = new Map<string, boolean>();

export function setFlag(name: string, on: boolean): void {
  cache.set(name, on);
}

export function isEnabled(name: string): boolean {
  return cache.get(name) ?? false;
}

export function loadDefaults(defaults: Record<string, boolean>): void {
  for (const [name, on] of Object.entries(defaults)) {
    if (!cache.has(name)) {
      cache.set(name, on);
    }
  }
}
