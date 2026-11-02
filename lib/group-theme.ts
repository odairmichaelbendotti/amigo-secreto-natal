export const GROUP_THEMES = ["none", "fruits"] as const;
export type GroupTheme = typeof GROUP_THEMES[number];

export function isGroupTheme(value: unknown): value is GroupTheme {
  return typeof value === "string" && GROUP_THEMES.some(theme => theme === value);
}

export function resolveGroupTheme(value: unknown): GroupTheme {
  return isGroupTheme(value) ? value : "none";
}
