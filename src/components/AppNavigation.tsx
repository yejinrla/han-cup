"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, MapPin, Heart, CalendarDays, UserRound } from "lucide-react";

const tabs = [
  {
    href: "/",
    label: "홈",
    accessibleLabel: "홈",
    icon: House,
    matches: (path: string) =>
      path === "/" ||
      path === "/search" ||
      path.startsWith("/drinks/") ||
      path === "/notes" ||
      path.startsWith("/notes/") ||
      path === "/compare",
  },
  {
    href: "/stores",
    label: "주변 매장",
    accessibleLabel: "주변 매장",
    icon: MapPin,
    matches: (path: string) => path === "/stores",
  },
  {
    href: "/me/favorites",
    label: "좋아요",
    accessibleLabel: "좋아요",
    icon: Heart,
    matches: (path: string) => path === "/me/favorites",
  },
  {
    href: "/me/records",
    label: "기록",
    accessibleLabel: "음료 기록",
    icon: CalendarDays,
    matches: (path: string) => path === "/me/records",
  },
  {
    href: "/me",
    label: "마이",
    accessibleLabel: "마이페이지",
    icon: UserRound,
    matches: (path: string) => path === "/me" || path === "/me/settings",
  },
];

export function AppNavigation() {
  const pathname = usePathname();
  return (
    <nav className="app-bottom-nav" aria-label="주 메뉴">
      {tabs.map(({ href, label, accessibleLabel, icon: Icon, matches }) => (
        <Link
          key={href}
          href={href}
          aria-label={accessibleLabel}
          aria-current={matches(pathname) ? "page" : undefined}
        >
          <span className="app-tab-icon">
            <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
