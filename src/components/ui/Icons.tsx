import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const Icons = {
  Dashboard: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="4" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="10.5" width="7" height="10" rx="1" />
    </svg>
  ),
  Survivors: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <circle cx="9" cy="9" r="3.2" />
      <path d="M3 19c.6-3.2 3.1-5 6-5s5.4 1.8 6 5" />
      <circle cx="17" cy="8" r="2.4" />
      <path d="M15 14c2.5 0 4.4 1.2 5 4" />
    </svg>
  ),
  Cases: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <rect x="3.5" y="6.5" width="17" height="13" rx="2" />
      <path d="M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5" />
      <path d="M3.5 12h17" />
    </svg>
  ),
  Needs: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M12 21s-7-4.3-7-10a4.5 4.5 0 0 1 7-3.7A4.5 4.5 0 0 1 19 11c0 5.7-7 10-7 10Z" />
    </svg>
  ),
  Referrals: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M4 7h11" />
      <path d="m12 4 3 3-3 3" />
      <path d="M20 17H9" />
      <path d="m12 20-3-3 3-3" />
    </svg>
  ),
  Partners: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="8" r="3" />
      <path d="M2.5 20c.7-3 2.8-4.5 5.5-4.5s4.8 1.5 5.5 4.5" />
      <path d="M11.5 20c.7-3 2.8-4.5 5.5-4.5s4.8 1.5 5.5 4.5" />
    </svg>
  ),
  Reports: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M5 20V8" />
      <path d="M10 20V4" />
      <path d="M15 20v-9" />
      <path d="M20 20v-5" />
    </svg>
  ),
  Settings: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <circle cx="12" cy="12" r="2.6" />
      <path d="M19.4 12a7.4 7.4 0 0 0-.1-1.3l2-1.5-2-3.4-2.4.9a7.5 7.5 0 0 0-2.2-1.3L14.3 3h-4l-.4 2.4A7.5 7.5 0 0 0 7.7 6.7l-2.4-.9-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2.6l-2 1.5 2 3.4 2.4-.9a7.5 7.5 0 0 0 2.2 1.3l.4 2.4h4l.4-2.4a7.5 7.5 0 0 0 2.2-1.3l2.4.9 2-3.4-2-1.5c.1-.4.1-.9.1-1.3Z" />
    </svg>
  ),
  Search: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  ),
  Bell: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2.5h-15Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  ),
  Plus: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  ChevronDown: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  ChevronRight: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
  ChevronLeft: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  ),
  ArrowRight: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  ),
  ArrowLeft: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M19 12H5" />
      <path d="m11 5-7 7 7 7" />
    </svg>
  ),
  Lock: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <rect x="5.5" y="10.5" width="13" height="9" rx="1.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 1 1 7 0v2.5" />
    </svg>
  ),
  Mail: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  ),
  Phone: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h2.6l1.4 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.4v2.6A1.5 1.5 0 0 1 17 18.5C9.8 18.5 4 12.7 4 5.5Z" />
    </svg>
  ),
  Logout: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M15 5h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4" />
      <path d="M10 8 6 12l4 4" />
      <path d="M6 12h11" />
    </svg>
  ),
  CircleCheck: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  ),
  AlertTriangle: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M12 4 2.5 20h19Z" />
      <path d="M12 10v4M12 17v.5" />
    </svg>
  ),
  Building: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M5 21V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v16" />
      <path d="M3 21h18" />
      <path d="M9 9h2M9 13h2M13 9h2M13 13h2M9 17h6" />
    </svg>
  ),
  User: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5 20c1-3.5 4-5 7-5s6 1.5 7 5" />
    </svg>
  ),
  Edit: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M4 20h4l10-10-4-4L4 16Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  ),
  Trash: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7h12l-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1Z" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  Filter: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M4 5h16l-6 8v6l-4-2v-4Z" />
    </svg>
  ),
  Download: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M12 4v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  ),
  Calendar: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <rect x="3.5" y="5.5" width="17" height="14.5" rx="2" />
      <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
    </svg>
  ),
  Spinner: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  ),
  Menu: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  X: (p: P) => (
    <svg viewBox="0 0 24 24" {...stroke} {...p}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  ),
};
