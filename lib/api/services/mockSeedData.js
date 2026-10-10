/**
 * Pure JavaScript Mock Seed Data for API Services Layer (No JSX)
 * Mirrors initial mock entities from workflowStore and mockData.
 */

export const mockOrganizations = [
  {
    id: "org-1",
    name: "Zee Films",
    type: "Production House",
    status: "Verified",
    registrationNumber: "CIN: U92100MH1992PLC068301",
    gstNumber: "27AAACZ1234F1Z8",
    contactPerson: "Vikram Malhotra",
    contactEmail: "vikram.malhotra@zeefilms.com",
    contactPhone: "+91 98201 54321",
    avatar: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&auto=format&fit=crop&q=80",
    address: "Plot 19, Film City Complex, Goregaon East, Mumbai, Maharashtra 400065",
  },
  {
    id: "org-2",
    name: "Dharma Productions",
    type: "Film Studio",
    status: "Verified",
    registrationNumber: "CIN: U74899MH1976PLC019124",
    gstNumber: "27AAACD5678G2Z1",
    contactPerson: "Karan Johar Desk",
    contactEmail: "casting@dharmamovies.com",
    contactPhone: "+91 98110 98765",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    address: "Supreme Chambers, Veera Desai Road, Andheri West, Mumbai, Maharashtra 400053",
  },
];

export const mockProjects = [
  {
    id: "proj-1",
    orgId: "org-1",
    title: "Mumbai Diaries Season 3",
    type: "OTT Series",
    description: "Critically acclaimed medical thriller returning for its 3rd chapter with high-stakes emergency hospital and investigative storylines.",
    status: "Active",
    createdAt: "2026-09-01T10:00:00.000Z",
  },
  {
    id: "proj-2",
    orgId: "org-1",
    title: "Glow Skincare Commercial Campaign",
    type: "Commercial / TVC",
    description: "National TVC & digital campaign highlighting natural skin radiance, subtle beauty expressions, and cinematic macro lighting.",
    status: "Active",
    createdAt: "2026-09-10T14:30:00.000Z",
  },
];

export const mockOpportunities = [
  {
    id: "opp-101",
    projectId: "proj-1",
    orgId: "org-1",
    title: "Lead Actor - Dr. Kabir Rao (Medical Thriller)",
    category: "Acting",
    type: "Lead Role",
    status: "Published",
    location: "Mumbai / On Location",
    remuneration: "₹1,50,000 / day",
    budget: "₹15,00,000",
    deadline: "2026-10-25",
    openRolesCount: 1,
    summary: "Senior Trauma Surgeon with an intense emotional conflict and commanding presence.",
    roles: [
      {
        roleId: "role-101-a",
        name: "Dr. Kabir Rao",
        gender: "Male",
        ageRange: "30 - 42",
        roleType: "Lead Role",
        openings: 1,
        description: "Intense, razor-sharp medical expert.",
      },
    ],
  },
];

export const mockApplications = [
  {
    id: "app-1",
    opportunityId: "opp-101",
    talentId: "tal-904",
    status: "Shortlisted",
    submittedAt: "2026-09-14T11:20:00.000Z",
    roleName: "Dr. Kabir Rao",
  },
];

export const mockAuditions = [
  {
    id: "aud-1",
    applicationId: "app-1",
    opportunityId: "opp-101",
    talentId: "tal-904",
    status: "Relayed to Talent",
    roundNumber: 1,
    title: "Round 1 Self-Tape - Emergency Room Monologue",
    deadline: "2026-10-18T23:59:59.000Z",
  },
];

export const mockNotifications = [
  {
    id: "notif-1",
    role: "talent",
    userId: "tal-904",
    type: "audition_request",
    title: "New Audition Request: Mumbai Diaries Season 3",
    message: "Zee Films casting desk requested a self-tape for Dr. Kabir Rao role.",
    read: false,
    timestamp: "2026-09-21T10:30:00.000Z",
  },
];

export const mockBroadcasts = [
  {
    id: "bc-1",
    title: "Platform Maintenance Window: Oct 12, 02:00 - 04:00 AM IST",
    target: "all",
    status: "Sent",
    sentAt: "2026-10-01T09:00:00.000Z",
  },
];

export const mockMediaQueue = [
  {
    id: "med-1",
    talentId: "tal-904",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500",
    type: "photo",
    title: "Studio Headshot - Dramatic Lighting",
    status: "Approved",
    isHeadshot: true,
  },
];

export const mockPayments = [
  {
    id: "pay-101",
    orderId: "ord_101",
    amount: 4999,
    currency: "INR",
    status: "Paid",
    createdAt: "2026-09-01T12:00:00.000Z",
  },
];

export const mockTalents = [
  {
    id: "tal-904",
    name: "Aarav Sharma",
    email: "aarav.sharma@gmail.com",
    role: "talent",
    status: "Approved",
  },
];

export const mockRecruiters = [
  {
    id: "rec-1",
    name: "Vikram Malhotra",
    email: "vikram@zeefilms.com",
    role: "organization",
    status: "Approved",
    studioName: "Zee Films",
  },
];
