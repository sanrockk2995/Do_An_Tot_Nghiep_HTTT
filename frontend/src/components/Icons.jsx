/**
 * Bộ icon SVG dùng chung (phong tuyến tính 1.7px, thay cho emoji).
 * Mọi icon nhận props chuẩn của <svg> (className, style, aria-hidden...).
 */

function Base({ children, size = 20, ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconSearch = (p) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Base>
);

export const IconHeart = ({ filled = false, ...p }) => (
  <Base {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M19.5 12.6 12 20l-7.5-7.4A5 5 0 1 1 12 6.3a5 5 0 1 1 7.5 6.3Z" />
  </Base>
);

export const IconBag = (p) => (
  <Base {...p}>
    <path d="M6 8h12l1 12a1.6 1.6 0 0 1-1.6 1.8H6.6A1.6 1.6 0 0 1 5 20L6 8Z" />
    <path d="M9 10V6a3 3 0 0 1 6 0v4" />
  </Base>
);

export const IconShirt = (p) => (
  <Base {...p}>
    <path d="m9 4-5 3 2 4 2-1v10h8V10l2 1 2-4-5-3a2.8 2.8 0 0 1-6 0Z" />
  </Base>
);

export const IconJacket = (p) => (
  <Base {...p}>
    <path d="m9 4-5 3 2 4 2-1v11h8V10l2 1 2-4-5-3" />
    <path d="M9 4c0 1.7 1.3 3 3 3s3-1.3 3-3" />
    <path d="M12 7v14" />
  </Base>
);

export const IconPants = (p) => (
  <Base {...p}>
    <path d="M8 3h8l1 18h-4l-1-11-1 11H7L8 3Z" />
    <path d="M8 6h8" />
  </Base>
);

export const IconDress = (p) => (
  <Base {...p}>
    <path d="M9 3c0 2 1.2 3.5 3 3.5S15 5 15 3" />
    <path d="m9.5 6-2 5 2 2-3 8h11l-3-8 2-2-2-5" />
  </Base>
);

export const IconTshirt = (p) => (
  <Base {...p}>
    <path d="m9 4-5 3 2 4 2-1v10h8V10l2 1 2-4-5-3a2.8 2.8 0 0 1-6 0Z" />
  </Base>
);

export const IconStar = ({ filled = true, ...p }) => (
  <Base {...p} fill={filled ? 'currentColor' : 'none'} strokeWidth={filled ? 0 : 1.7}>
    <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8L12 3Z" />
  </Base>
);

export const IconDashboard = (p) => (
  <Base {...p}>
    <rect x="3" y="3" width="8" height="10" rx="1.5" />
    <rect x="13" y="3" width="8" height="6" rx="1.5" />
    <rect x="13" y="11" width="8" height="10" rx="1.5" />
    <rect x="3" y="15" width="8" height="6" rx="1.5" />
  </Base>
);

export const IconReceipt = (p) => (
  <Base {...p}>
    <path d="M5 3h14v18l-2.3-1.5L14.4 21l-2.4-1.5L9.6 21l-2.3-1.5L5 21V3Z" />
    <path d="M9 8h6M9 12h6" />
  </Base>
);

export const IconUsers = (p) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 21a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
    <path d="M17.5 14.6a6.5 6.5 0 0 1 4 6.4" />
  </Base>
);

export const IconBox = (p) => (
  <Base {...p}>
    <path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z" />
    <path d="m3.3 7.2 8.7 5 8.7-5" />
    <path d="M12 12.2V22" />
  </Base>
);

export const IconStore = (p) => (
  <Base {...p}>
    <path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9" />
    <path d="M2 9l2.5-5A1.6 1.6 0 0 1 6 3h12a1.6 1.6 0 0 1 1.5 1L22 9" />
    <path d="M9 21v-6h6v6" />
  </Base>
);

export const IconClipboard = (p) => (
  <Base {...p}>
    <rect x="5" y="4" width="14" height="17" rx="1.8" />
    <path d="M9 4a3 3 0 0 1 6 0" />
    <path d="M9 11h6M9 15h4" />
  </Base>
);

export const IconGift = (p) => (
  <Base {...p}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" />
    <path d="M12 8v13" />
    <path d="M12 8a3.5 3.5 0 1 1 3.5-3.5C15.5 6.5 13.5 8 12 8Zm0 0a3.5 3.5 0 1 0-3.5-3.5C8.5 6.5 10.5 8 12 8Z" />
  </Base>
);

export const IconTruck = (p) => (
  <Base {...p}>
    <path d="M2 6h12v11H2z" />
    <path d="M14 10h4l4 4v3h-8" />
    <circle cx="6.5" cy="18.5" r="1.8" />
    <circle cx="17.5" cy="18.5" r="1.8" />
  </Base>
);

export const IconBadgeUser = (p) => (
  <Base {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20.5a7 7 0 0 1 14 0" />
  </Base>
);

export const IconSearchDoc = (p) => (
  <Base {...p}>
    <path d="M14 3H6a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 6 21h5" />
    <path d="M14 3l4 4v5" />
    <path d="M14 3v4h4" />
    <circle cx="16.5" cy="16.5" r="3" />
    <path d="m19 19 2.5 2.5" />
  </Base>
);

export const IconMoney = (p) => (
  <Base {...p}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.8" />
    <path d="M6 9.5v.01M18 14.5v.01" />
  </Base>
);

export const IconTrendUp = (p) => (
  <Base {...p}>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </Base>
);

export const IconAlert = (p) => (
  <Base {...p}>
    <path d="M10.3 3.8 1.9 18.2A2 2 0 0 0 3.6 21h16.8a2 2 0 0 0 1.7-2.8L13.7 3.8a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17v.01" />
  </Base>
);

export const IconCartAdd = (p) => (
  <Base {...p}>
    <circle cx="9" cy="20" r="1.6" />
    <circle cx="18" cy="20" r="1.6" />
    <path d="M2 3h2.5l2.6 12.4a1.5 1.5 0 0 0 1.5 1.1h8.6a1.5 1.5 0 0 0 1.4-1.1L21 7H5.1" />
  </Base>
);

export const IconCheckCircle = (p) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.2 2.4 2.4 4.6-4.8" />
  </Base>
);

export const IconMapPin = (p) => (
  <Base {...p}>
    <path d="M20 10c0 6-8 11.3-8 11.3S4 16 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Base>
);

export const IconPhone = (p) => (
  <Base {...p}>
    <path d="M21 16.9v2.6a1.9 1.9 0 0 1-2.1 1.9 19 19 0 0 1-8.3-3 18.7 18.7 0 0 1-5.8-5.8 19 19 0 0 1-3-8.3A1.9 1.9 0 0 1 3.7 2h2.6a1.9 1.9 0 0 1 1.9 1.6c.1 1 .35 2 .7 2.9a1.9 1.9 0 0 1-.4 2L7.3 9.8a15.2 15.2 0 0 0 5.8 5.8l1.3-1.3a1.9 1.9 0 0 1 2-.4c.9.35 1.9.6 2.9.7a1.9 1.9 0 0 1 1.7 2.3Z" />
  </Base>
);

export const IconMail = (p) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </Base>
);

export const IconArrowLeft = (p) => (
  <Base {...p}>
    <path d="M19 12H5" />
    <path d="m11 18-6-6 6-6" />
  </Base>
);

export const IconArrowRight = (p) => (
  <Base {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Base>
);

export const IconX = (p) => (
  <Base {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Base>
);

export const IconLogout = (p) => (
  <Base {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </Base>
);

export const IconInfo = (p) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8h.01M12 12v4" />
  </Base>
);

export const IconAlertCircle = (p) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4M12 16h.01" />
  </Base>
);

export const IconChevronDown = (p) => (
  <Base {...p}>
    <path d="m6 9 6 6 6-6" />
  </Base>
);

export const IconEye = (p) => (
  <Base {...p}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </Base>
);

export const IconCopy = (p) => (
  <Base {...p}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </Base>
);

