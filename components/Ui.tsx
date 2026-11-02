import Link from "next/link";
import type { ReactNode } from "react";

export type IconName = "gift" | "groups" | "plus" | "arrow" | "link" | "settings" | "check" | "clock" | "logout" | "menu" | "close" | "sparkles" | "heart" | "list" | "copy" | "eye-off";
const paths: Record<IconName, ReactNode> = {
  "eye-off": <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2c.7-.1 1.4-.2 2.1-.2 5.5 0 9 7 9 7a18 18 0 0 1-3.1 4.1M6.2 6.2A20.6 20.6 0 0 0 3 12s3.5 7 9 7c1.8 0 3.4-.7 4.8-1.7" />,
  gift: <><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v9h14v-9M12 8v13M12 8H8.5A2.5 2.5 0 1 1 11 5.5L12 8Zm0 0h3.5A2.5 2.5 0 1 0 13 5.5L12 8Z" /></>,
  groups: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M21 21v-2a6 6 0 0 0-4-5.65" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  link: <><path d="m10 13 4-4M8 16l-1 1a3.5 3.5 0 0 1-5-5l4-4a3.5 3.5 0 0 1 5 0M16 8l1-1a3.5 3.5 0 0 1 5 5l-4 4a3.5 3.5 0 0 1-5 0" /></>,
  settings: <><path d="m10 3-1 3-3 1-3 3 2 3-1 3 3 3 3-1 3 2 3-3 1-3 3-1v-4l-3-1-1-3-3-2-3 1Z" /><circle cx="12" cy="12" r="3" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  logout: <><path d="M10 4H4v16h6M14 8l4 4-4 4M9 12h10" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  sparkles: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /><path d="M21 2v4M19 4h4" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
  list: <><path d="M9 6h12M9 12h12M9 18h12M3 6h.01M3 12h.01M3 18h.01" /></>,
  copy: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V3H3v13h5" /></>,
};

export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  return <svg aria-hidden="true" className={`ui-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" aria-label="Amigo secreto — início" className={`brand ${light ? "brand-light" : ""}`}><span className="brand-mark"><Icon name="gift" /></span><span className="brand-name">amigo<span>secreto</span></span></Link>;
}

export function GiftScene() {
  return <svg className="gift-scene" viewBox="0 0 460 340" fill="none" aria-hidden="true">
    <ellipse cx="236" cy="292" rx="162" ry="20" fill="#163e32" opacity=".08" />
    <circle cx="228" cy="158" r="122" fill="#e6ede2" />
    <path d="M65 210c-30-39-21-70 6-86-2 42 30 53 24 91M359 234c45-18 63-47 51-77-25 26-51 34-51 77" fill="#99b4a0" />
    <path d="m65 165 26 62m297-32-26 43" stroke="#4a755b" strokeWidth="2" />
    <g transform="rotate(-9 151 212)"><rect x="73" y="155" width="145" height="119" rx="12" fill="#b89a5b" /><rect x="65" y="143" width="161" height="33" rx="7" fill="#d5b77c" /><path d="M133 143h24v131h-24z" fill="#f4e8cd" /><path d="M146 141c-3-25-50-43-48-18 1 14 25 21 48 18Zm0 0c1-26 41-45 44-23 2 16-22 24-44 23Z" stroke="#f4e8cd" strokeWidth="8" /></g>
    <g transform="rotate(7 282 198)"><rect x="209" y="140" width="150" height="141" rx="12" fill="#1b5240" /><rect x="201" y="125" width="166" height="35" rx="7" fill="#2d6a50" /><path d="M270 125h24v156h-24z" fill="#e2d3ac" /><path d="M282 123c-2-31-48-56-51-28-2 19 27 30 51 28Zm0 0c3-32 47-51 48-26 0 19-24 27-48 26Z" stroke="#e2d3ac" strokeWidth="8" /><path d="m323 167 14 25-24 14-14-25 24-14Z" fill="#f7f4e9" /><path d="m313 188 5 3 5-9" stroke="#1b5240" strokeWidth="2" /></g>
    <path d="m104 55 3 10 10 3-10 3-3 10-3-10-10-3 10-3 3-10Zm252 32 3 10 10 3-10 3-3 10-3-10-10-3 10-3 3-10Z" fill="#b69a63" />
    <circle cx="166" cy="48" r="3" fill="#9ab69e" /><circle cx="393" cy="134" r="4" fill="#d8bb84" /><circle cx="59" cy="103" r="4" fill="#d8bb84" />
    <path d="m231 47 6 5m-6 0 6-5M75 252l6 5m-6 0 6-5" stroke="#8cab91" strokeWidth="2" />
  </svg>;
}
