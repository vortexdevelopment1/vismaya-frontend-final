import {
  LayoutDashboard,
  Users,
  Building2,
  Image as ImageIcon,
  Inbox,
  Megaphone,
  FolderKanban,
  FileText,
  Video,
  AlertOctagon,
  CreditCard,
  Bell,
  BarChart3,
} from "lucide-react";

export const adminNavSections = [
  {
    group: "OVERVIEW",
    items: [
      {
        title: "Operations Console",
        label: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    group: "PEOPLE",
    items: [
      {
        title: "Talent Management",
        label: "Talent",
        href: "/admin/talent-management",
        icon: Users,
        badgeKey: "pendingTalents",
      },
      {
        title: "Organization Management",
        label: "Organizations",
        href: "/admin/recruiter-management",
        icon: Building2,
        badgeKey: "pendingOrganizations",
      },
    ],
  },
  {
    group: "REVIEW QUEUES",
    items: [
      {
        title: "Media Moderation",
        label: "Media moderation",
        href: "/admin/media-moderation",
        icon: ImageIcon,
        badgeKey: "pendingMedia",
      },
      {
        title: "Opportunity Review",
        label: "Opportunity review",
        href: "/admin/opportunity-review",
        icon: Inbox,
        badgeKey: "pendingOpportunities",
      },
      {
        title: "Auditions & Self-Tapes",
        label: "Auditions",
        href: "/admin/auditions",
        icon: Video,
        badgeKey: "pendingAuditions",
      },
      {
        title: "Cancellation Requests",
        label: "Cancellations",
        href: "/admin/cancellation-requests",
        icon: AlertOctagon,
        badgeKey: "pendingCancellations",
      },
    ],
  },
  {
    group: "OPERATIONS",
    items: [
      {
        title: "Opportunities Directory",
        label: "Opportunities",
        href: "/admin/opportunities",
        icon: Megaphone,
      },
      {
        title: "Projects Directory",
        label: "Projects",
        href: "/admin/projects",
        icon: FolderKanban,
      },
      {
        title: "Applications Registry",
        label: "Applications",
        href: "/admin/applications",
        icon: FileText,
      },
      {
        title: "Escrow & Payments",
        label: "Payments",
        href: "/admin/payments",
        icon: CreditCard,
      },
    ],
  },
  {
    group: "COMMUNICATION & INSIGHTS",
    items: [
      {
        title: "Notifications & Broadcasts",
        label: "Broadcasts",
        href: "/admin/notifications",
        icon: Bell,
        badgeKey: "unreadNotifications",
      },
      {
        title: "Platform Analytics",
        label: "Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
      },
    ],
  },
];

// Flat export for existing references
export const adminNav = adminNavSections.flatMap((s) => s.items);

