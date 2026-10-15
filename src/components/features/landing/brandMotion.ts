/** Small renderer bridge. GSAP owns time; the canvas only draws changed frames. */
export interface BrandMotion { entrance: number; travel: number; light: number }
const channels = new WeakMap<HTMLElement, { value: BrandMotion; listeners: Set<(motion: BrandMotion) => void> }>();
function channel(element: HTMLElement) {
  let result = channels.get(element);
  if (!result) {
    result = { value: { entrance: 1, travel: 0, light: 1 }, listeners: new Set() };
    channels.set(element, result);
  }
  return result;
}
export function publishBrandMotion(element: HTMLElement, motion: BrandMotion) {
  const current = channel(element);
  current.value = { ...motion };
  current.listeners.forEach(listener => listener(current.value));
}
export function observeBrandMotion(element: HTMLElement, listener: (motion: BrandMotion) => void) {
  const current = channel(element);
  current.listeners.add(listener);
  listener(current.value);
  return () => { current.listeners.delete(listener); };
}

/** Ambient motion is additive: it never overwrites the intro/scroll timeline. */
export interface BrandPresence { time: number; x: number; y: number }
const presence = new WeakMap<HTMLElement, Set<(value: BrandPresence) => void>>();
export function publishBrandPresence(element: HTMLElement, value: BrandPresence) {
  presence.get(element)?.forEach(listener => listener(value));
}
export function observeBrandPresence(element: HTMLElement, listener: (value: BrandPresence) => void) {
  let listeners = presence.get(element);
  if (!listeners) { listeners = new Set(); presence.set(element, listeners); }
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
