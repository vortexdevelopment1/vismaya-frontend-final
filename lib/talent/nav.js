import {
  LayoutDashboard,
  User,
  Briefcase,
  Megaphone,
  FileText,
  Video,
  Bell,
  Settings,
} from "lucide-react";

export const talentNav = [
  {
    title: "Dashboard",
    href: "/talent/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Profile",
    href: "/talent/profile",
    icon: User,
  },
  {
    title: "Portfolio",
    href: "/talent/portfolio",
    icon: Briefcase,
  },
  {
    title: "Opportunities",
    href: "/talent/opportunities",
    icon: Megaphone,
  },
  {
    title: "My Applications",
    href: "/talent/applications",
    icon: FileText,
    badgeKey: "shortlistedCount",
  },
  {
    title: "Auditions",
    href: "/talent/auditions",
    icon: Video,
    badgeKey: "pendingAuditions",
  },
  {
    title: "Notifications",
    href: "/talent/notifications",
    icon: Bell,
    badgeKey: "unreadNotifications",
  },
  {
    title: "Settings",
    href: "/talent/settings",
    icon: Settings,
  },
];
