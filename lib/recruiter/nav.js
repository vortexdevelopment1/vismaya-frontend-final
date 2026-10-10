import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  Briefcase,
  Users,
  Bell,
  Settings,
} from "lucide-react";

export const recruiterNav = [
  {
    title: "Dashboard",
    href: "/recruiter/dashboard",
    icon: LayoutDashboard,
    match: ["/recruiter/dashboard"],
  },
  {
    title: "Projects",
    href: "/recruiter/projects",
    icon: FolderKanban,
    match: ["/recruiter/projects", "/recruiter/projects/"],
  },
  {
    title: "Submit opportunity",
    href: "/recruiter/opportunities/new",
    icon: PlusCircle,
    match: ["/recruiter/opportunities/new"],
  },
  {
    title: "My opportunities",
    href: "/recruiter/opportunities",
    icon: Briefcase,
    match: [
      "/recruiter/opportunities",
      "/recruiter/opportunities/",
    ],
  },
  {
    title: "Shortlist & Auditions",
    href: "/recruiter/shortlist-auditions",
    icon: Users,
    badgeKey: "shortlistsReady",
    match: ["/recruiter/shortlist-auditions", "/recruiter/shortlist-auditions/"],
  },
  {
    title: "Notifications",
    href: "/recruiter/notifications",
    icon: Bell,
    badgeKey: "unreadNotifications",
    match: ["/recruiter/notifications", "/recruiter/notifications/"],
  },
  {
    title: "Settings",
    href: "/recruiter/settings",
    icon: Settings,
    match: ["/recruiter/settings", "/recruiter/settings/"],
  },
];

/**
 * Returns the href of the nav item that best matches the current pathname using "longest match wins".
 * When on /recruiter/applications/[applicationId], highlights according to the navigation origin `from`.
 */
export function getActiveRecruiterNavItem(pathname, from = null, navItems = recruiterNav) {
  if (!pathname) return "/recruiter/dashboard";

  // Context-aware origin resolution for /recruiter/applications/[applicationId]
  if (pathname.startsWith("/recruiter/applications")) {
    let resolvedFrom = from;
    if (!resolvedFrom && typeof window !== "undefined") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        resolvedFrom = urlParams.get("from") || sessionStorage.getItem("orgProfileOrigin");
        if (!resolvedFrom) {
          resolvedFrom = urlParams.get("opp") ? "applicants" : "dashboard";
        }
      } catch (e) {
        resolvedFrom = "dashboard";
      }
    }

    if (resolvedFrom === "shortlist") {
      return "/recruiter/shortlist-auditions";
    }
    if (resolvedFrom === "applicants") {
      return "/recruiter/opportunities";
    }
    if (resolvedFrom === "dashboard") {
      return "/recruiter/dashboard";
    }
    if (resolvedFrom === "notifications") {
      return "/recruiter/notifications";
    }
    return "/recruiter/dashboard";
  }

  let bestHref = null;
  let maxScore = -1;

  for (const item of navItems) {
    const patterns = [item.href, ...(item.match || [])];

    for (const pattern of patterns) {
      let isMatch = false;
      let score = 0;

      if (pathname === pattern) {
        isMatch = true;
        score = pattern.length + 1000; // Exact match takes highest precedence
      } else if (pattern.endsWith("/") && pathname.startsWith(pattern)) {
        isMatch = true;
        score = pattern.length;
      } else if (pathname.startsWith(pattern + "/")) {
        isMatch = true;
        score = pattern.length;
      }

      if (isMatch && score > maxScore) {
        maxScore = score;
        bestHref = item.href;
      }
    }
  }

  return bestHref || "/recruiter/dashboard";
}
