export const themes = ['charcoal', 'leaf', 'sunset', 'volcano', 'ocean'] as const
export type Theme = (typeof themes)[number]
