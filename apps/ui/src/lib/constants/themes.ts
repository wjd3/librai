export const themes = ['leaf', 'charcoal', 'volcano', 'twilight', 'ocean'] as const
export type Theme = (typeof themes)[number]
