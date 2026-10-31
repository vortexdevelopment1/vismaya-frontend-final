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
  ShieldCheck,
  Sparkles,
  UserCheck,
  History,
  Ticket,
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
    group: "PEOPLE & PROFILES",
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
      {
        title: "Informational Profiles",
        label: "Informational Profiles",
        href: "/admin/informational-profiles",
        icon: UserCheck,
      },
    ],
  },
  {
    group: "REVIEW QUEUES",
    items: [
      {
        title: "Verification Queues",
        label: "Verification",
        href: "/admin/verifications",
        icon: ShieldCheck,
        badgeKey: "pendingVerifications",
      },
      {
        title: "Content & Media Moderation",
        label: "Content moderation",
        href: "/admin/content-moderation",
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
        title: "Success Stories Approval",
        label: "Success Stories",
        href: "/admin/success-stories",
        icon: Sparkles,
        badgeKey: "pendingStories",
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
      {
        title: "Organization Credits",
        label: "Credits",
        href: "/admin/credits",
        icon: CreditCard,
      },
      {
        title: "Coupon Management",
        label: "Coupons",
        href: "/admin/coupons",
        icon: Ticket,
      },
      {
        title: "Audit Trail",
        label: "Audit Log",
        href: "/admin/audit-logs",
        icon: History,
      },
    ],
  },
  {
    group: "COMMUNICATION & INSIGHTS",
    items: [
      {
        title: "Platform Broadcasts (Operational Notices Only)",
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

