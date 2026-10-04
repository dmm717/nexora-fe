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
