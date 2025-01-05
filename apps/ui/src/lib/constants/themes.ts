export const themes = ['leaf', 'charcoal', 'volcano', 'sunset', 'ocean'] as const
export type Theme = (typeof themes)[number]
