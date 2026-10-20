import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};
type P = SVGProps<SVGSVGElement>;

export const SearchIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const UserIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);
export const BagIcon = (p: P) => (
  <svg {...base} {...p}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
);
export const MenuIcon = (p: P) => (
  <svg {...base} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const CloseIcon = (p: P) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const ArrowIcon = (p: P) => (
  <svg {...base} width={18} height={18} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const LeafIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);
export const PlusIcon = (p: P) => (<svg {...base} width={16} height={16} {...p}><path d="M12 5v14M5 12h14" /></svg>);
export const MinusIcon = (p: P) => (<svg {...base} width={16} height={16} {...p}><path d="M5 12h14" /></svg>);
export const TrashIcon = (p: P) => (
  <svg {...base} width={18} height={18} {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
);
export const PinIcon = (p: P) => (
  <svg {...base} {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);
export const StoneIcon = (p: P) => (
  <svg {...base} {...p}><ellipse cx="12" cy="8" rx="8" ry="3" /><path d="M4 8v4c0 1.7 3.6 3 8 3s8-1.3 8-3V8" /><path d="M7 15v4M17 15v4M12 15v5" /></svg>
);
export const FamilyIcon = (p: P) => (
  <svg {...base} {...p}><circle cx="8" cy="7" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M2 20a6 6 0 0 1 12 0M14 20a4.5 4.5 0 0 1 8 0" /></svg>
);
