export const motionTokens = {
  duration: {
    instant: 0.05,
    fast: 0.18,
    normal: 0.32,
    slow: 0.55,
    reveal: 0.75,
    count: 1.1,
  },
  ease: {
    standard: [0.2, 0, 0, 1] as const,
    emphasized: [0.05, 0.7, 0.1, 1] as const,
    decelerate: [0.0, 0.0, 0.2, 1] as const,
    accelerate: [0.4, 0.0, 1, 1] as const,
  },
  spring: {
    gentle: { type: 'spring' as const, stiffness: 260, damping: 24 },
    bouncy: { type: 'spring' as const, stiffness: 380, damping: 22 },
    snappy: { type: 'spring' as const, stiffness: 450, damping: 30 },
  },
  stagger: {
    fast: 0.04,
    normal: 0.07,
    slow: 0.12,
  },
  distance: {
    small: 8,
    medium: 16,
    large: 28,
  },
};
