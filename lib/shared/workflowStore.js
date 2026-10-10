"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, useMemo } from "react";
import { isRealMode } from "@/lib/api/config";
import { publicService } from "@/lib/api/services/publicService";
import { recruiterService } from "@/lib/api/services/recruiterService";
import { talentService } from "@/lib/api/services/talentService";
import { adminService } from "@/lib/api/services/adminService";
import { notificationService } from "@/lib/api/services/notificationService";

// LocalStorage Persistence Key
const STORAGE_KEY = "vismaya_workflow_store_v2";

// ============================================================================
// 1. INITIAL SEED DATA
// ============================================================================

export const initialOrganizations = [
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

export const initialProjects = [
  {
    id: "proj-1",
    orgId: "org-1",
    title: "Mumbai Diaries Season 3",
    type: "OTT Series",
    description: "Critically acclaimed medical thriller returning for its 3rd chapter with high-stakes emergency hospital and investigative storylines.",
    status: "Active", // Active | Completed
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
  {
    id: "proj-3",
    orgId: "org-2",
    title: "Project Tiger: Desert Storm",
    type: "Feature Film",
    description: "High-octane action spy thriller set across the Thar desert and international covert operations.",
    status: "Active",
    createdAt: "2026-09-15T09:00:00.000Z",
  },
  {
    id: "proj-4",
    orgId: "org-2",
    title: "Raat Ke Baad",
    type: "Music Video",
    description: "Atmospheric neon-noir music video shooting on location in North Goa.",
    status: "Active",
    createdAt: "2026-09-20T10:00:00.000Z",
  },
];

export const initialOpportunities = [
  {
    id: "opp-107",
    projectId: "proj-4",
    orgId: "org-2",
    title: "Raat Ke Baad – Lead Dancers",
    summary: "Seeking dynamic contemporary and freestyle dancers for a cinematic midnight choreography music video.",
    opportunityType: "Music Video",
    roles: [
      {
        id: "r-108",
        roleName: "Lead Contemporary Dancer",
        count: 4,
        ageRange: "18 - 26 years",
        gender: "Any",
        description: "Versatile dancer with sharp screen expressions and camera musicality.",
        skills: ["Contemporary Dance", "Freestyle", "Stage Presence"],
        language: "Hindi, English",
      },
    ],
    location: "Goa (North Coast)",
    remuneration: "₹40,000 lump sum",
    deadline: "2026-10-28", // Future date
    eligibility: {
      ageMin: 18,
      ageMax: 26,
      gender: "Any",
      languages: ["Hindi", "English"],
      skills: ["Dance", "Camera Movement"],
      experience: "Performance or stage dance credits",
      location: "Goa / Mumbai",
    },
    fullBrief: "3-day high-energy night shoot on coastal open sets in North Goa. Travel and accommodation provided.",
    status: "Published",
    adminNote: "Verified and published by Vismaya Casting Desk.",
    createdAt: "2026-09-24T10:00:00.000Z",
    publishedAt: "2026-09-25T11:00:00.000Z",
  },
  {
    id: "opp-101",
    projectId: "proj-1",
    orgId: "org-1",
    title: "Mumbai Diaries S3 - Lead Doctor & Trauma Surgeon",
    summary: "Seeking intense, articulate screen actors for key hospital emergency ward characters in Season 3.",
    opportunityType: "OTT Series",
    roles: [
      {
        id: "r-101",
        roleName: "Dr. Tanya Roy (Trauma Specialist)",
        count: 1,
        ageRange: "21 - 27 years",
        gender: "Female",
        description: "Sharp, intelligent, urban contemporary look. High emotional resilience.",
        skills: ["Screen Acting", "Fast Dialogue", "Emotional Modulation"],
        language: "Hindi (Fluent), English (Fluent)",
      },
      {
        id: "r-102",
        roleName: "Dr. Kabir Rao (Junior Resident)",
        count: 2,
        ageRange: "22 - 28 years",
        gender: "Any",
        description: "Ambitious junior resident facing high-stress triage crises.",
        skills: ["Screen Acting", "Improvisation"],
        language: "Hindi, English",
      },
    ],
    location: "Mumbai Film City Studios",
    remuneration: "₹50,000 - ₹80,000 / day",
    deadline: "2026-10-25", // Future date
    eligibility: {
      ageMin: 21,
      ageMax: 28,
      gender: "Any",
      languages: ["Hindi", "English"],
      skills: ["Screen Acting", "Dialogue Delivery"],
      experience: "1+ years screen or professional theater experience",
      location: "Mumbai",
    },
    fullBrief: "Ensemble cast for 8 episodes. Actors must be comfortable with medical equipment handling and intense emotional delivery.",
    status: "Published", // Draft, Submitted, Changes Requested, Rejected, Published, Closed, Cancel Requested, Cancelled, Completed
    adminNote: "Verified and published by Vismaya Casting Desk.",
    createdAt: "2026-09-12T10:00:00.000Z",
    publishedAt: "2026-09-13T12:00:00.000Z",
  },
  {
    id: "opp-102",
    projectId: "proj-2",
    orgId: "org-1",
    title: "Glow Skincare - Fresh Faces for Digital Campaign",
    summary: "Casting leading female artists with natural skin radiance and expressive camera presence for a premium beauty brand.",
    opportunityType: "Commercial / TVC",
    roles: [
      {
        id: "r-103",
        roleName: "Lead Female Face (Natural Radiance)",
        count: 2,
        ageRange: "20 - 26 years",
        gender: "Female",
        description: "Photogenic smile, natural skin tone, expressive eyes, flawless camera ease.",
        skills: ["Camera Ease", "Subtle Expressions"],
        language: "Hindi",
      },
    ],
    location: "Famous Studios, Mahalakshmi, Mumbai",
    remuneration: "₹1,50,000 lump sum (2 shoot days)",
    deadline: "2026-10-30", // Future date
    eligibility: {
      ageMin: 20,
      ageMax: 26,
      gender: "Female",
      languages: ["Hindi"],
      skills: ["Camera Acting", "Modeling"],
      experience: "Commercials or portfolio required",
      location: "Mumbai",
    },
    fullBrief: "National digital and OTT pre-roll campaign. High-speed 4K macro camera setups.",
    status: "Published",
    adminNote: "Budget escrow terms verified by Vismaya compliance.",
    createdAt: "2026-09-18T14:00:00.000Z",
    publishedAt: "2026-09-19T09:00:00.000Z",
  },
  {
    id: "opp-103",
    projectId: "proj-3",
    orgId: "org-2",
    title: "Project Tiger - Elite Tactical Officer",
    summary: "Seeking physically fit, martial arts or stunt-trained actors for international special forces unit.",
    opportunityType: "Feature Film",
    roles: [
      {
        id: "r-104",
        roleName: "Officer Vikram (Tactical Commando)",
        count: 2,
        ageRange: "24 - 32 years",
        gender: "Male",
        description: "Athletic/muscular build, intense screen presence, combat readiness.",
        skills: ["Martial Arts", "Stunts", "Weapon Handling"],
        language: "Hindi, English",
      },
    ],
    location: "Jodhpur & Abu Dhabi Outdoors",
    remuneration: "₹75,000 / day + Travel & Accommodation",
    deadline: "2026-11-15", // Future date
    eligibility: {
      ageMin: 24,
      ageMax: 32,
      gender: "Male",
      languages: ["Hindi", "English"],
      skills: ["Screen Combat", "Physical Fitness"],
      experience: "Prior action or stunt experience preferred",
      location: "Pan-India",
    },
    fullBrief: "Demanding 3-week outdoor shoot in desert terrain. Stunt choreography by South African action team.",
    status: "Submitted", // Awaiting Vismaya review
    adminNote: "Submitted by Dharma Productions. Vismaya team reviewing stunt safety documentation.",
    createdAt: "2026-10-01T11:00:00.000Z",
    publishedAt: null,
  },
  {
    id: "opp-104",
    projectId: "proj-1",
    orgId: "org-1",
    title: "Mumbai Diaries S3 - ER Resident Doctors (5 Artists)",
    summary: "Supporting roles for junior medical team members in recurring hospital episodes.",
    opportunityType: "OTT Series",
    roles: [
      {
        id: "r-105",
        roleName: "ER Resident Staff",
        count: 5,
        ageRange: "22 - 29 years",
        gender: "Any",
        description: "Medical student / resident doctor looks. Good dialogue memory.",
        skills: ["Screen Acting", "Fast Dialogue"],
        language: "Hindi",
      },
    ],
    location: "Mumbai Film City",
    remuneration: "₹25,000 / day",
    deadline: "2026-11-05", // Future date
    eligibility: {
      ageMin: 22,
      ageMax: 29,
      gender: "Any",
      languages: ["Hindi"],
      skills: ["Screen Acting"],
      experience: "Theater or short film credits",
      location: "Mumbai",
    },
    fullBrief: "Requires 10 days of availability across November and December.",
    status: "Changes Requested",
    adminNote: "Please clarify whether night shifts and intensive physical rehearsals are included in the daily rate before approval.",
    createdAt: "2026-09-22T16:00:00.000Z",
    publishedAt: null,
  },
  {
    id: "opp-105",
    projectId: "proj-2",
    orgId: "org-1",
    title: "Glow Skincare - Print Catalog Shoot",
    summary: "Editorial and e-commerce beauty campaign for print brochures and retail displays.",
    opportunityType: "Commercial / TVC",
    roles: [
      {
        id: "r-106",
        roleName: "Catalog Model",
        count: 2,
        ageRange: "19 - 25 years",
        gender: "Female",
        description: "Photogenic facial structure, studio modeling ease.",
        skills: ["Editorial Modeling", "Posing"],
        language: "Any",
      },
    ],
    location: "Famous Studios, Mumbai",
    remuneration: "₹60,000 lump sum",
    deadline: "2026-11-20", // Future date
    eligibility: {
      ageMin: 19,
      ageMax: 25,
      gender: "Female",
      languages: ["Hindi", "English"],
      skills: ["Fashion Modeling"],
      experience: "Comp-card required",
      location: "Mumbai",
    },
    fullBrief: "1 day studio session for high-definition print billboards and packaging.",
    status: "Draft",
    adminNote: null,
    createdAt: "2026-10-02T10:00:00.000Z",
    publishedAt: null,
  },
  {
    id: "opp-106",
    projectId: "proj-3",
    orgId: "org-2",
    title: "Project Tiger - Desert Outpost Guard",
    summary: "Supporting character in the desert ambush scene.",
    opportunityType: "Feature Film",
    roles: [
      {
        id: "r-107",
        roleName: "Outpost Guard (Manoj)",
        count: 1,
        ageRange: "26 - 35 years",
        gender: "Male",
        description: "Rugged desert look, Rajasthani dialect.",
        skills: ["Dramatic Acting", "Dialect"],
        language: "Rajasthani, Hindi",
      },
    ],
    location: "Jaisalmer Dunes",
    remuneration: "₹35,000 / day",
    deadline: "2026-10-18",
    eligibility: {
      ageMin: 26,
      ageMax: 35,
      gender: "Male",
      languages: ["Hindi", "Rajasthani"],
      skills: ["Screen Acting"],
      experience: "Prior acting credits",
      location: "Rajasthan / Mumbai",
    },
    fullBrief: "Single scene pivotal confrontation.",
    status: "Cancel Requested", // Organization requested cancellation
    adminNote: "Organization requested cancellation due to script merge with Desert Squad Lead.",
    createdAt: "2026-09-25T11:00:00.000Z",
    publishedAt: "2026-09-26T10:00:00.000Z",
  },
];

export const initialApplications = [
  // Applications for opp-101 (Mumbai Diaries S3)
  {
    id: "app-1",
    opportunityId: "opp-101",
    talentId: "tal-904",
    talentName: "Riya Sharma",
    talentProfile: {
      name: "Riya Sharma",
      stageName: "Riya Sharma",
      age: 22,
      gender: "Female",
      city: "Mumbai",
      phone: "+91 98765 43210",
      email: "riya.sharma@vismaya.io",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      skills: ["Method Acting", "Kathak Dance", "Voice Over", "Improvisation"],
      languages: ["Hindi (Native)", "English (Fluent)", "Marathi (Fluent)"],
      bio: "Passionate theater-trained actress with 3+ years experience in short films and commercials.",
      showreelUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    },
    roleApplied: "Dr. Tanya Roy (Trauma Specialist)",
    status: "Shortlisted", // Stage 3: Self-tape ready
    appliedAt: "2026-09-14T11:20:00.000Z",
    history: [
      { status: "Applied", timestamp: "2026-09-14T11:20:00.000Z", note: "Application submitted with verified talent profile", changedBy: "Riya Sharma" },
      { status: "Under Review", timestamp: "2026-09-15T09:30:00.000Z", note: "Profile opened and screened by Zee Films casting desk", changedBy: "Zee Films" },
      { status: "Shortlisted", timestamp: "2026-09-17T14:15:00.000Z", note: "Shortlisted for audition self-tape", changedBy: "Zee Films" },
    ],
  },
  {
    id: "app-2",
    opportunityId: "opp-101",
    talentId: "tal-901",
    talentName: "Aarav Mehra",
    talentProfile: {
      name: "Aarav Mehra",
      stageName: "Aarav Mehra",
      age: 24,
      gender: "Male",
      city: "Mumbai",
      phone: "+91 98192 34567",
      email: "aarav.mehra@gmail.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
      skills: ["Screen Acting", "Method Acting", "Martial Arts", "Guitar"],
      languages: ["Hindi (Native)", "English (Fluent)"],
      bio: "FTII trained screen actor with theater roots in Prithvi Theatre.",
      showreelUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    },
    roleApplied: "Dr. Kabir Rao (Junior Resident)",
    status: "Selected", // Stage 4: Selected
    appliedAt: "2026-09-14T12:00:00.000Z",
    history: [
      { status: "Applied", timestamp: "2026-09-14T12:00:00.000Z", note: "Application submitted with verified talent profile", changedBy: "Aarav Mehra" },
      { status: "Under Review", timestamp: "2026-09-15T10:00:00.000Z", note: "Profile opened and reviewed by casting director", changedBy: "Zee Films" },
      { status: "Shortlisted", timestamp: "2026-09-18T11:00:00.000Z", note: "Shortlisted for audition interview round", changedBy: "Zee Films" },
      { status: "Selected", timestamp: "2026-09-24T16:00:00.000Z", note: "Officially selected by Director for Dr. Kabir Rao role", changedBy: "Zee Films" },
    ],
  },
  {
    id: "app-3",
    opportunityId: "opp-101",
    talentId: "tal-903",
    talentName: "Kabir Mehta",
    talentProfile: {
      name: "Kabir Mehta",
      stageName: "Kabir Mehta",
      age: 26,
      gender: "Male",
      city: "Delhi",
      phone: "+91 98111 22334",
      email: "kabir.mehta@gmail.com",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
      skills: ["Method Acting", "Intense Dialogue", "Stage Combat"],
      languages: ["Hindi (Native)", "English (Fluent)", "Punjabi"],
      bio: "National School of Drama graduate with recurring roles in OTT dramas.",
    },
    roleApplied: "Dr. Kabir Rao (Junior Resident)",
    status: "Shortlisted", // Stage 1: Shortlisted (No audition requested yet)
    appliedAt: "2026-09-15T09:10:00.000Z",
    history: [
      { status: "Applied", timestamp: "2026-09-15T09:10:00.000Z", note: "Application submitted with verified talent profile", changedBy: "Kabir Mehta" },
      { status: "Under Review", timestamp: "2026-09-16T14:20:00.000Z", note: "Screening candidate showreel and medical dialogue sample", changedBy: "Zee Films" },
      { status: "Shortlisted", timestamp: "2026-09-18T16:00:00.000Z", note: "Shortlisted for final casting pool", changedBy: "Zee Films" },
    ],
  },
  {
    id: "app-4",
    opportunityId: "opp-101",
    talentId: "tal-905",
    talentName: "Dev Dixit",
    talentProfile: {
      name: "Dev Dixit",
      stageName: "Dev Dixit",
      age: 23,
      gender: "Male",
      city: "Mumbai",
      phone: "+91 98222 33445",
      email: "dev.dixit@vismaya.io",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
      skills: ["Screen Acting", "Dance", "Voice Modulation"],
      languages: ["Hindi", "English", "Marathi"],
      bio: "Emerging Mumbai screen actor with commercial television credits.",
    },
    roleApplied: "Dr. Kabir Rao (Junior Resident)",
    status: "Shortlisted", // Stage 2: Audition / Interview in progress
    appliedAt: "2026-09-16T18:45:00.000Z",
    history: [
      { status: "Applied", timestamp: "2026-09-16T18:45:00.000Z", note: "Application submitted with verified talent profile", changedBy: "Dev Dixit" },
      { status: "Under Review", timestamp: "2026-09-17T11:00:00.000Z", note: "Profile screened", changedBy: "Zee Films" },
      { status: "Shortlisted", timestamp: "2026-09-19T14:00:00.000Z", note: "Shortlisted for audition interview", changedBy: "Zee Films" },
    ],
  },
  {
    id: "app-5",
    opportunityId: "opp-101",
    talentId: "tal-910",
    talentName: "Rohan Varma",
    talentProfile: {
      name: "Rohan Varma",
      stageName: "Rohan Varma",
      age: 27,
      gender: "Male",
      city: "Mumbai",
      phone: "+91 98333 44556",
      email: "rohan.varma@vismaya.io",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
      skills: ["Screen Acting", "Dramatic Monologues"],
      languages: ["Hindi (Native)", "English (Fluent)"],
      bio: "Experienced stage and television actor.",
    },
    roleApplied: "Dr. Tanya Roy (Trauma Specialist)",
    status: "Not Selected", // Stage 5: Not Selected
    appliedAt: "2026-09-14T15:30:00.000Z",
    history: [
      { status: "Applied", timestamp: "2026-09-14T15:30:00.000Z", note: "Application submitted with verified talent profile", changedBy: "Rohan Varma" },
      { status: "Under Review", timestamp: "2026-09-16T11:00:00.000Z", note: "Profile screened", changedBy: "Zee Films" },
      { status: "Shortlisted", timestamp: "2026-09-18T10:00:00.000Z", note: "Shortlisted for preliminary screening", changedBy: "Zee Films" },
      { status: "Not Selected", timestamp: "2026-09-22T16:00:00.000Z", note: "Role cast with specialist background", changedBy: "Zee Films" },
    ],
  },

  // Applications for opp-102 (Glow Skincare)
  {
    id: "app-6",
    opportunityId: "opp-102",
    talentId: "tal-911",
    talentName: "Ananya Iyer",
    talentProfile: {
      name: "Ananya Iyer",
      stageName: "Ananya Iyer",
      age: 23,
      gender: "Female",
      city: "Chennai",
      phone: "+91 98765 12345",
      email: "ananya.iyer@vismaya.io",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
      skills: ["Camera Acting", "Modeling", "Dance"],
      languages: ["Tamil", "Hindi", "English"],
      bio: "Commercial face with prominent skincare and apparel brand features.",
    },
    roleApplied: "Lead Female Face (Natural Radiance)",
    status: "Selected", // Stage 4: Selected
    appliedAt: "2026-09-20T10:00:00.000Z",
    history: [
      { status: "Applied", timestamp: "2026-09-20T10:00:00.000Z", note: "Application submitted with verified talent profile", changedBy: "Ananya Iyer" },
      { status: "Under Review", timestamp: "2026-09-21T11:00:00.000Z", note: "Skin tone and camera smile test approved", changedBy: "Zee Films" },
      { status: "Shortlisted", timestamp: "2026-09-23T15:00:00.000Z", note: "Shortlisted for brand client look-test", changedBy: "Zee Films" },
      { status: "Selected", timestamp: "2026-09-27T12:00:00.000Z", note: "Approved by Glow Skincare Creative Director", changedBy: "Zee Films" },
    ],
  },
  {
    id: "app-7",
    opportunityId: "opp-102",
    talentId: "tal-906",
    talentName: "Aanya Sharma",
    talentProfile: {
      name: "Aanya Sharma",
      stageName: "Aanya Sharma",
      age: 21,
      gender: "Female",
      city: "Mumbai",
      phone: "+91 98333 44556",
      email: "aanya.sharma@vismaya.io",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      skills: ["Screen Acting", "Contemporary Dance"],
      languages: ["Hindi (Native)", "English (Fluent)"],
      bio: "Model and actress with leading appearances in digital music videos.",
    },
    roleApplied: "Lead Female Face (Natural Radiance)",
    status: "Shortlisted", // Stage 2: Audition / Interview in progress
    appliedAt: "2026-09-20T11:30:00.000Z",
    history: [
      { status: "Applied", timestamp: "2026-09-20T11:30:00.000Z", note: "Application submitted with verified talent profile", changedBy: "Aanya Sharma" },
      { status: "Under Review", timestamp: "2026-09-22T10:15:00.000Z", note: "Reviewing close-up comp-cards", changedBy: "Zee Films" },
      { status: "Shortlisted", timestamp: "2026-09-25T14:30:00.000Z", note: "Shortlisted for brand selfie video round", changedBy: "Zee Films" },
    ],
  },
  {
    id: "app-8",
    opportunityId: "opp-102",
    talentId: "tal-907",
    talentName: "Tara Sen",
    talentProfile: {
      name: "Tara Sen",
      stageName: "Tara Sen",
      age: 23,
      gender: "Female",
      city: "Bengaluru",
      phone: "+91 98444 55667",
      email: "tara.sen@vismaya.io",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
      skills: ["Fashion Modeling", "Screen Acting"],
      languages: ["English", "Hindi", "Bengali"],
      bio: "Editorial fashion model based between Mumbai and Bengaluru.",
    },
    roleApplied: "Lead Female Face (Natural Radiance)",
    status: "Not Selected", // Stage 5: Not Selected
    appliedAt: "2026-09-20T14:00:00.000Z",
    history: [
      { status: "Applied", timestamp: "2026-09-20T14:00:00.000Z", note: "Application submitted with verified talent profile", changedBy: "Tara Sen" },
      { status: "Under Review", timestamp: "2026-09-22T12:00:00.000Z", note: "Profile opened", changedBy: "Zee Films" },
      { status: "Shortlisted", timestamp: "2026-09-24T10:00:00.000Z", note: "Shortlisted for evaluation", changedBy: "Zee Films" },
      { status: "Not Selected", timestamp: "2026-09-26T16:00:00.000Z", note: "Not selected for this campaign cycle", changedBy: "Zee Films" },
    ],
  },
  {
    id: "app-9",
    opportunityId: "opp-102",
    talentId: "tal-908",
    talentName: "Pooja Hegde",
    talentProfile: {
      name: "Pooja Hegde",
      stageName: "Pooja H",
      age: 24,
      gender: "Female",
      city: "Pune",
      phone: "+91 98555 66778",
      email: "pooja.hegde@vismaya.io",
      avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80",
      skills: ["Screen Acting", "Dance"],
      languages: ["Hindi", "English", "Kannada"],
      bio: "Fresh face talent with regional commercial credits.",
    },
    roleApplied: "Lead Female Face (Natural Radiance)",
    status: "Shortlisted", // Stage 1: Shortlisted (No audition requested yet)
    appliedAt: "2026-09-22T17:00:00.000Z",
    history: [
      { status: "Applied", timestamp: "2026-09-22T17:00:00.000Z", note: "Application submitted with verified talent profile", changedBy: "Pooja Hegde" },
      { status: "Under Review", timestamp: "2026-09-23T10:00:00.000Z", note: "Portfolio evaluated", changedBy: "Zee Films" },
      { status: "Shortlisted", timestamp: "2026-09-25T11:00:00.000Z", note: "Shortlisted for natural radiance campaign", changedBy: "Zee Films" },
    ],
  },
  {
    id: "app-10",
    opportunityId: "opp-102",
    talentId: "tal-912",
    talentName: "Sneha Roy",
    talentProfile: {
      name: "Sneha Roy",
      stageName: "Sneha Roy",
      age: 25,
      gender: "Female",
      city: "Kolkata",
      phone: "+91 98666 77889",
      email: "sneha.roy@vismaya.io",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
      skills: ["Voice Modulation", "Camera Acting"],
      languages: ["Hindi", "Bengali", "English"],
      bio: "Commercial model and theater performer with natural camera ease.",
    },
    roleApplied: "Lead Female Face (Natural Radiance)",
    status: "Shortlisted", // Stage 3: Self-tape ready
    appliedAt: "2026-09-21T09:30:00.000Z",
    history: [
      { status: "Applied", timestamp: "2026-09-21T09:30:00.000Z", note: "Application submitted with verified talent profile", changedBy: "Sneha Roy" },
      { status: "Under Review", timestamp: "2026-09-23T16:00:00.000Z", note: "Under review by commercial casting director", changedBy: "Zee Films" },
      { status: "Shortlisted", timestamp: "2026-09-24T14:00:00.000Z", note: "Shortlisted for self-tape review", changedBy: "Zee Films" },
    ],
  },

  // Applications for opp-103 (Project Tiger)
  {
    id: "app-11",
    opportunityId: "opp-103",
    talentId: "tal-901",
    talentName: "Aarav Mehra",
    talentProfile: {
      name: "Aarav Mehra",
      stageName: "Aarav Mehra",
      age: 24,
      gender: "Male",
      city: "Mumbai",
      phone: "+91 98192 34567",
      email: "aarav.mehra@gmail.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
      skills: ["Screen Acting", "Martial Arts (Taekwondo)", "Guitar", "Stunts"],
      languages: ["Hindi (Native)", "English (Fluent)"],
      bio: "FTII trained screen actor with martial arts credentials.",
    },
    roleApplied: "Officer Vikram (Tactical Commando)",
    status: "Under Review",
    appliedAt: "2026-10-01T14:00:00.000Z",
    history: [
      { status: "Applied", timestamp: "2026-10-01T14:00:00.000Z", note: "Application submitted with verified talent profile", changedBy: "Aarav Mehra" },
      { status: "Under Review", timestamp: "2026-10-02T10:00:00.000Z", note: "Reviewing martial arts showreel video", changedBy: "Dharma Productions" },
    ],
  },
  {
    id: "app-12",
    opportunityId: "opp-103",
    talentId: "tal-905",
    talentName: "Dev Dixit",
    talentProfile: {
      name: "Dev Dixit",
      stageName: "Dev Dixit",
      age: 23,
      gender: "Male",
      city: "Mumbai",
      phone: "+91 98222 33445",
      email: "dev.dixit@vismaya.io",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
      skills: ["Screen Acting", "Stunts"],
      languages: ["Hindi", "English"],
      bio: "Emerging screen actor.",
    },
    roleApplied: "Officer Vikram (Tactical Commando)",
    status: "Applied",
    appliedAt: "2026-10-01T15:30:00.000Z",
    history: [
      { status: "Applied", timestamp: "2026-10-01T15:30:00.000Z", note: "Application submitted with verified talent profile", changedBy: "Dev Dixit" },
    ],
  },

  // Applications for opp-104 (ER Resident Doctors)
  {
    id: "app-13",
    opportunityId: "opp-104",
    talentId: "tal-903",
    talentName: "Kabir Mehta",
    talentProfile: {
      name: "Kabir Mehta",
      stageName: "Kabir Mehta",
      age: 26,
      gender: "Male",
      city: "Delhi",
      phone: "+91 98111 22334",
      email: "kabir.mehta@gmail.com",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
      skills: ["Method Acting", "Stage Combat"],
      languages: ["Hindi", "English"],
      bio: "NSD trained actor.",
    },
    roleApplied: "ER Resident Staff",
    status: "Applied",
    appliedAt: "2026-09-23T11:00:00.000Z",
    history: [
      { status: "Applied", timestamp: "2026-09-23T11:00:00.000Z", note: "Application submitted with verified talent profile", changedBy: "Kabir Mehta" },
    ],
  },

  // Applications for opp-106 (Cancel Requested Opp)
  {
    id: "app-14",
    opportunityId: "opp-106",
    talentId: "tal-901",
    talentName: "Aarav Mehra",
    talentProfile: {
      name: "Aarav Mehra",
      stageName: "Aarav Mehra",
      age: 24,
      gender: "Male",
      city: "Mumbai",
      phone: "+91 98192 34567",
      email: "aarav.mehra@gmail.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
      skills: ["Screen Acting"],
      languages: ["Hindi", "Rajasthani"],
      bio: "Screen actor.",
    },
    roleApplied: "Outpost Guard (Manoj)",
    status: "Not Selected",
    appliedAt: "2026-09-27T10:00:00.000Z",
    history: [
      { status: "Applied", timestamp: "2026-09-27T10:00:00.000Z", note: "Application submitted with verified talent profile", changedBy: "Aarav Mehra" },
      { status: "Under Review", timestamp: "2026-09-28T11:00:00.000Z", note: "Profile screened", changedBy: "Dharma Productions" },
      { status: "Shortlisted", timestamp: "2026-09-29T14:00:00.000Z", note: "Shortlisted", changedBy: "Dharma Productions" },
      { status: "Not Selected", timestamp: "2026-09-30T16:00:00.000Z", note: "Role changed in script revision", changedBy: "Dharma Productions" },
    ],
  },
  {
    id: "app-15",
    opportunityId: "opp-106",
    talentId: "tal-904",
    talentName: "Riya Sharma",
    talentProfile: {
      name: "Riya Sharma",
      stageName: "Riya Sharma",
      age: 22,
      gender: "Female",
      city: "Mumbai",
      phone: "+91 98765 43210",
      email: "riya.sharma@vismaya.io",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      skills: ["Method Acting"],
      languages: ["Hindi", "Marathi"],
      bio: "Screen actor.",
    },
    roleApplied: "Outpost Guard (Manoj)",
    status: "Withdrawn",
    appliedAt: "2026-09-27T12:00:00.000Z",
    history: [
      { status: "Applied", timestamp: "2026-09-27T12:00:00.000Z", note: "Application submitted with verified talent profile", changedBy: "Riya Sharma" },
      { status: "Withdrawn", timestamp: "2026-09-28T09:00:00.000Z", note: "Withdrawn by artist due to conflict", changedBy: "Talent" },
    ],
  },
];

export const initialAuditions = [
  {
    id: "aud-1",
    applicationId: "app-1",
    opportunityId: "opp-101",
    talentId: "tal-904",
    talentName: "Riya Sharma",
    orgId: "org-1",
    type: "Audition",
    status: "Forwarded to Organization",
    note: "Please record the emergency triage scene monologue with emotional intensity.",
    selfTapeUrl: "https://vismaya.media/selftapes/riya-sharma-tanya-audition.mp4",
    requestedAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-20T14:30:00.000Z",
  },
  {
    id: "aud-2",
    applicationId: "app-2",
    opportunityId: "opp-101",
    talentId: "tal-901",
    talentName: "Aarav Mehra",
    orgId: "org-1",
    type: "Interview",
    status: "Forwarded to Organization",
    note: "Director 1-on-1 virtual interview and script walkthrough.",
    selfTapeUrl: "https://vismaya.media/selftapes/aarav-mehra-interview.mp4",
    requestedAt: "2026-09-19T11:00:00.000Z",
    updatedAt: "2026-09-22T16:00:00.000Z",
  },
  {
    id: "aud-3",
    applicationId: "app-7",
    opportunityId: "opp-102",
    talentId: "tal-906",
    talentName: "Aanya Sharma",
    orgId: "org-1",
    type: "Audition",
    status: "Relayed to Talent",
    note: "Submit a 45-second natural light video showcasing natural skin glow and camera smile.",
    selfTapeUrl: null,
    requestedAt: "2026-09-26T12:00:00.000Z",
    updatedAt: "2026-09-26T14:00:00.000Z",
  },
  {
    id: "aud-4",
    applicationId: "app-4",
    opportunityId: "opp-101",
    talentId: "tal-905",
    talentName: "Dev Dixit",
    orgId: "org-1",
    type: "Interview",
    status: "Requested",
    note: "1-on-1 virtual interview with casting director for Dr. Kabir Rao role.",
    selfTapeUrl: null,
    requestedAt: "2026-09-27T10:00:00.000Z",
    updatedAt: "2026-09-27T10:00:00.000Z",
  },
  {
    id: "aud-5",
    applicationId: "app-10",
    opportunityId: "opp-102",
    talentId: "tal-912",
    talentName: "Sneha Roy",
    orgId: "org-1",
    type: "Audition",
    status: "Forwarded to Organization",
    note: "Record a 30-second camera test showcasing natural smile and product handling.",
    selfTapeUrl: "https://vismaya.media/selftapes/sneha-roy-radiance.mp4",
    requestedAt: "2026-09-25T11:00:00.000Z",
    updatedAt: "2026-09-28T16:00:00.000Z",
  },
  {
    id: "aud-6",
    applicationId: "app-5",
    opportunityId: "opp-101",
    talentId: "tal-910",
    talentName: "Rohan Varma",
    orgId: "org-1",
    type: "Audition",
    status: "Forwarded to Organization",
    note: "Dramatic emergency scene recording.",
    selfTapeUrl: "https://vismaya.media/selftapes/rohan-varma-monologue.mp4",
    requestedAt: "2026-09-19T09:00:00.000Z",
    updatedAt: "2026-09-21T15:00:00.000Z",
  },
];

export const initialCancellationRequests = [
  {
    id: "cr-1",
    opportunityId: "opp-106",
    orgId: "org-2",
    reason: "Production schedule delayed due to Rajasthan outdoor permits. Role is being merged with Desert Squad Lead.",
    status: "Pending", // Pending | Approved | Declined
    requestedAt: "2026-10-01T11:00:00.000Z",
    resolvedAt: null,
    adminNote: null,
  },
];

export const initialBroadcasts = [
  {
    id: "bc-1",
    title: "Upcoming OTT Auditions Season",
    message: "Please ensure your photo headshots, self-tapes, and showreels are updated for upcoming OTT season casting calls across Mumbai & Delhi.",
    audience: "All talent",
    category: "Platform announcement",
    channels: { inApp: true, email: true, sms: false, whatsapp: false },
    status: "Sent",
    sentAt: "2026-10-01T10:00:00.000Z",
    scheduledFor: null,
    deliveredCount: 1284,
    targetCity: "All",
    targetOrgType: "All",
    createdAt: "2026-10-01T09:55:00.000Z",
  },
  {
    id: "bc-2",
    title: "Direct Contact Protection Policy Reminder",
    message: "Vismaya compliance reminder: Direct artist contact details are strictly protected. All auditions, script briefs, and self-tape logistics are coordinated via platform desk.",
    audience: "All organizations",
    category: "Policy update",
    channels: { inApp: true, email: true, sms: false, whatsapp: false },
    status: "Sent",
    sentAt: "2026-09-25T14:30:00.000Z",
    scheduledFor: null,
    deliveredCount: 14,
    targetCity: "All",
    targetOrgType: "All",
    createdAt: "2026-09-25T14:25:00.000Z",
  },
  {
    id: "bc-3",
    title: "Scheduled Maintenance Window",
    message: "Vismaya platform core systems will undergo routine database optimization and security maintenance on Sunday, 12th October between 02:00 AM and 04:00 AM IST.",
    audience: "All users",
    category: "Maintenance",
    channels: { inApp: true, email: false, sms: false, whatsapp: false },
    status: "Scheduled",
    sentAt: null,
    scheduledFor: "2026-10-12T02:00:00.000Z",
    deliveredCount: 1298,
    targetCity: "All",
    targetOrgType: "All",
    createdAt: "2026-10-04T11:00:00.000Z",
  },
];

export const initialNotifications = [
  {
    id: "notif-1",
    toRole: "talent",
    toUserId: "tal-904",
    message: "Zee Films shortlisted your profile for 'Mumbai Diaries S3 - Dr. Tanya Roy'.",
    read: false,
    createdAt: "2026-09-17T14:15:00.000Z",
    type: "shortlist",
    link: "/talent/applications",
  },
  {
    id: "notif-2",
    toRole: "organization",
    toUserId: "org-1",
    message: "Self-tape received from Riya Sharma for 'Mumbai Diaries S3'.",
    read: false,
    createdAt: "2026-09-20T14:30:00.000Z",
    type: "audition",
    link: "/recruiter/shortlist-auditions",
  },
  {
    id: "notif-3",
    toRole: "vismaya",
    toUserId: "admin",
    title: "New Opportunity Awaiting Approval",
    message: "Opportunity 'Project Tiger - Elite Tactical Officer' submitted by Dharma Productions for review and publishing.",
    read: false,
    createdAt: "2026-10-01T11:00:00.000Z",
    type: "review",
    category: "Approvals",
    link: "/admin/opportunity-review",
  },
  {
    id: "notif-4",
    toRole: "vismaya",
    toUserId: "admin",
    title: "Cancellation Request Received",
    message: "Cancellation request received for 'Project Tiger - Desert Outpost Guard'. Active applicants require status transition notice.",
    read: false,
    createdAt: "2026-10-01T11:05:00.000Z",
    type: "cancellation",
    category: "Cancellations",
    link: "/admin/cancellation-requests",
  },
  {
    id: "notif-5",
    toRole: "vismaya",
    toUserId: "admin",
    title: "Artist Self-Tape Awaiting Moderation",
    message: "Self-tape video uploaded by Riya Sharma for Zee Films 'Mumbai Diaries S3' requires content check before forwarding.",
    read: false,
    createdAt: "2026-10-02T09:30:00.000Z",
    type: "audition",
    category: "Auditions",
    link: "/admin/auditions",
  },
  {
    id: "notif-6",
    toRole: "vismaya",
    toUserId: "admin",
    title: "Flagged Media Item in Queue",
    message: "New model portfolio batch uploaded by Kabir Mehra contains 3 unverified portrait items awaiting moderation.",
    read: false,
    createdAt: "2026-10-03T16:45:00.000Z",
    type: "media",
    category: "Media",
    link: "/admin/media-moderation",
  },
  {
    id: "notif-7",
    toRole: "vismaya",
    toUserId: "admin",
    title: "Production Credit Ledger Synced",
    message: "Escrow payment transaction #TXN-9021 of ₹1,45,000 processed for Zee Films TVC Commercial Campaign.",
    read: true,
    createdAt: "2026-10-04T12:00:00.000Z",
    type: "payment",
    category: "Payments",
    link: "/admin/payments",
  },
];

export const defaultWorkflowState = {
  organizations: initialOrganizations,
  projects: initialProjects,
  opportunities: initialOpportunities,
  applications: initialApplications,
  auditions: initialAuditions,
  cancellationRequests: initialCancellationRequests,
  notifications: initialNotifications,
  broadcasts: initialBroadcasts,
};

// ============================================================================
// 2. WORKFLOW REDUCER WITH STRICT BUSINESS RULES
// ============================================================================

function workflowReducer(state, action) {
  switch (action.type) {
    case "HYDRATE_STATE": {
      return {
        ...state,
        ...action.payload,
      };
    }

    case "RESET_DEMO_DATA": {
      return {
        ...defaultWorkflowState,
      };
    }

    // ------------------------------------------------------------------------
    // PROJECT ACTIONS
    // ------------------------------------------------------------------------
    case "CREATE_PROJECT": {
      const { orgId, title, type, description } = action.payload;
      if (!title || !orgId) {
        console.error("Workflow Error: Project title and orgId are required");
        return state;
      }

      const newProject = {
        id: `proj-${Date.now()}`,
        orgId,
        title: title.trim(),
        type: type || "OTT Series",
        description: description || "",
        status: "Active",
        createdAt: new Date().toISOString(),
      };

      const newNotif = {
        id: `notif-${Date.now()}`,
        toRole: "organization",
        toUserId: orgId,
        message: `Project '${newProject.title}' was successfully created.`,
        read: false,
        createdAt: new Date().toISOString(),
        type: "project",
        link: "/recruiter/opportunities",
      };

      return {
        ...state,
        projects: [newProject, ...state.projects],
        notifications: [newNotif, ...state.notifications],
      };
    }

    case "MARK_PROJECT_COMPLETED": {
      const { projectId } = action.payload;
      const targetProj = state.projects.find((p) => p.id === projectId);
      if (!targetProj) return state;

      const updatedProjects = state.projects.map((p) =>
        p.id === projectId ? { ...p, status: "Completed" } : p
      );

      // Also mark all open opportunities in this project as Completed
      const updatedOpportunities = state.opportunities.map((opp) =>
        opp.projectId === projectId && opp.status !== "Cancelled"
          ? { ...opp, status: "Completed" }
          : opp
      );

      const newNotif = {
        id: `notif-${Date.now()}`,
        toRole: "organization",
        toUserId: targetProj.orgId,
        message: `Project '${targetProj.title}' has been marked as Completed.`,
        read: false,
        createdAt: new Date().toISOString(),
        type: "project",
        link: "/recruiter/opportunities",
      };

      return {
        ...state,
        projects: updatedProjects,
        opportunities: updatedOpportunities,
        notifications: [newNotif, ...state.notifications],
      };
    }

    // ------------------------------------------------------------------------
    // OPPORTUNITY ACTIONS
    // ------------------------------------------------------------------------
    case "SUBMIT_OPPORTUNITY": {
      const {
        id: existingId,
        projectId,
        orgId,
        title,
        summary,
        opportunityType,
        roles,
        location,
        remuneration,
        deadline,
        eligibility,
        fullBrief,
        isDraft = false,
      } = action.payload;

      // Business Rule 1: An opportunity cannot exist without a projectId.
      if (!projectId) {
        console.error("Workflow Error: An opportunity cannot exist without a projectId.");
        return state;
      }

      // Business Rule 2: Deadline is REQUIRED and must be in the future.
      if (!deadline) {
        console.error("Workflow Error: Opportunity deadline is required.");
        return state;
      }

      const org = state.organizations.find((o) => o.id === orgId) || { name: "Organization" };
      const oppId = existingId || `opp-${Date.now()}`;
      const existingRecord = state.opportunities.find((o) => o.id === oppId);

      const targetOpportunity = {
        id: oppId,
        projectId,
        orgId: orgId || "org-1",
        title: title || "Untitled Opportunity",
        summary: summary || "",
        opportunityType: opportunityType || "OTT Series",
        roles: roles && roles.length > 0 ? roles : [
          {
            id: `r-${Date.now()}`,
            roleName: "Lead Character",
            count: 1,
            ageRange: "20 - 30 years",
            gender: "Any",
            description: "",
            skills: ["Screen Acting"],
            language: "Hindi",
          },
        ],
        location: location || "Mumbai",
        remuneration: remuneration || "Negotiable",
        deadline,
        eligibility: eligibility || {
          ageMin: 18,
          ageMax: 60,
          gender: "Any",
          languages: ["Hindi"],
          skills: ["Screen Acting"],
          experience: "Open",
          location: "Pan-India",
        },
        fullBrief: fullBrief || "",
        status: isDraft ? "Draft" : "Submitted", // Business Rule: Organization cannot publish directly
        adminNote: isDraft ? null : "Submitted to Vismaya team for verification.",
        createdAt: existingRecord?.createdAt || new Date().toISOString(),
        publishedAt: null,
      };

      const notifs = [];

      if (!isDraft) {
        // Notify Vismaya Team
        notifs.push({
          id: `notif-${Date.now()}-1`,
          toRole: "vismaya",
          toUserId: "admin",
          message: `Opportunity '${targetOpportunity.title}' submitted for review by ${org.name}.`,
          read: false,
          createdAt: new Date().toISOString(),
          type: "review",
          link: "/admin/opportunity-review",
        });

        // Notify Organization
        notifs.push({
          id: `notif-${Date.now()}-2`,
          toRole: "organization",
          toUserId: targetOpportunity.orgId,
          message: `Opportunity '${targetOpportunity.title}' was submitted to the Vismaya team for review.`,
          read: false,
          createdAt: new Date().toISOString(),
          type: "opportunity",
          link: "/recruiter/opportunities",
        });
      }

      const updatedOpportunities = existingRecord
        ? state.opportunities.map((o) => (o.id === oppId ? targetOpportunity : o))
        : [targetOpportunity, ...state.opportunities];

      return {
        ...state,
        opportunities: updatedOpportunities,
        notifications: [...notifs, ...state.notifications],
      };
    }

    case "ADMIN_APPROVE_AND_PUBLISH": {
      const { opportunityId, adminNote } = action.payload;
      const targetOpp = state.opportunities.find((o) => o.id === opportunityId);
      if (!targetOpp) return state;

      const updatedOpportunities = state.opportunities.map((opp) =>
        opp.id === opportunityId
          ? {
              ...opp,
              status: "Published",
              adminNote: adminNote || "Verified and published by Vismaya Casting Desk.",
              publishedAt: new Date().toISOString(),
            }
          : opp
      );

      const notifs = [
        {
          id: `notif-${Date.now()}-1`,
          toRole: "organization",
          toUserId: targetOpp.orgId,
          message: `Your opportunity '${targetOpp.title}' has been verified and published live by Vismaya.`,
          read: false,
          createdAt: new Date().toISOString(),
          type: "opportunity",
          link: "/recruiter/opportunities",
        },
        {
          id: `notif-${Date.now()}-2`,
          toRole: "talent",
          toUserId: null,
          message: `New opportunity live: '${targetOpp.title}' is now accepting applications.`,
          read: false,
          createdAt: new Date().toISOString(),
          type: "opportunity",
          link: "/talent/opportunities",
        },
      ];

      return {
        ...state,
        opportunities: updatedOpportunities,
        notifications: [...notifs, ...state.notifications],
      };
    }

    case "ADMIN_REQUEST_CHANGES": {
      const { opportunityId, note } = action.payload;
      if (!note) {
        console.error("Workflow Error: Note is required when requesting changes.");
        return state;
      }

      const targetOpp = state.opportunities.find((o) => o.id === opportunityId);
      if (!targetOpp) return state;

      const updatedOpportunities = state.opportunities.map((opp) =>
        opp.id === opportunityId
          ? {
              ...opp,
              status: "Changes Requested",
              adminNote: note,
            }
          : opp
      );

      const newNotif = {
        id: `notif-${Date.now()}`,
        toRole: "organization",
        toUserId: targetOpp.orgId,
        message: `Vismaya team requested changes on '${targetOpp.title}': ${note}`,
        read: false,
        createdAt: new Date().toISOString(),
        type: "warning",
        link: "/recruiter/opportunities",
      };

      return {
        ...state,
        opportunities: updatedOpportunities,
        notifications: [newNotif, ...state.notifications],
      };
    }

    case "ADMIN_REJECT": {
      const { opportunityId, reason } = action.payload;
      if (!reason) {
        console.error("Workflow Error: Reason is required when rejecting an opportunity.");
        return state;
      }

      const targetOpp = state.opportunities.find((o) => o.id === opportunityId);
      if (!targetOpp) return state;

      const updatedOpportunities = state.opportunities.map((opp) =>
        opp.id === opportunityId
          ? {
              ...opp,
              status: "Rejected",
              adminNote: reason,
            }
          : opp
      );

      const newNotif = {
        id: `notif-${Date.now()}`,
        toRole: "organization",
        toUserId: targetOpp.orgId,
        message: `Opportunity '${targetOpp.title}' was rejected by Vismaya: ${reason}`,
        read: false,
        createdAt: new Date().toISOString(),
        type: "danger",
        link: "/recruiter/opportunities",
      };

      return {
        ...state,
        opportunities: updatedOpportunities,
        notifications: [newNotif, ...state.notifications],
      };
    }

    case "AUTO_CLOSE_EXPIRED": {
      const now = new Date();
      let hasChanges = false;
      const newNotifs = [];

      const updatedOpportunities = state.opportunities.map((opp) => {
        if (opp.status === "Published" && new Date(opp.deadline) < now) {
          hasChanges = true;
          newNotifs.push({
            id: `notif-close-${opp.id}-${Date.now()}`,
            toRole: "organization",
            toUserId: opp.orgId,
            message: `Opportunity '${opp.title}' closed automatically as its deadline has passed.`,
            read: false,
            createdAt: new Date().toISOString(),
            type: "opportunity",
            link: "/recruiter/opportunities",
          });
          return {
            ...opp,
            status: "Closed",
            adminNote: "Closed automatically upon reaching application deadline.",
          };
        }
        return opp;
      });

      if (!hasChanges) return state;

      return {
        ...state,
        opportunities: updatedOpportunities,
        notifications: [...newNotifs, ...state.notifications],
      };
    }

    case "REQUEST_CANCELLATION": {
      const { opportunityId, reason } = action.payload;
      if (!reason) {
        console.error("Workflow Error: Reason is required to request opportunity cancellation.");
        return state;
      }

      const targetOpp = state.opportunities.find((o) => o.id === opportunityId);
      if (!targetOpp) return state;

      // Move opportunity status to Cancel Requested
      const updatedOpportunities = state.opportunities.map((opp) =>
        opp.id === opportunityId ? { ...opp, status: "Cancel Requested" } : opp
      );

      const newRequest = {
        id: `cr-${Date.now()}`,
        opportunityId,
        orgId: targetOpp.orgId,
        reason,
        status: "Pending",
        requestedAt: new Date().toISOString(),
        resolvedAt: null,
        adminNote: null,
      };

      const notifs = [
        {
          id: `notif-${Date.now()}-1`,
          toRole: "vismaya",
          toUserId: "admin",
          message: `Cancellation requested for opportunity '${targetOpp.title}'. Reason: ${reason}`,
          read: false,
          createdAt: new Date().toISOString(),
          type: "cancellation",
          link: "/admin/cancellation-requests",
        },
        {
          id: `notif-${Date.now()}-2`,
          toRole: "organization",
          toUserId: targetOpp.orgId,
          message: `Your cancellation request for '${targetOpp.title}' was submitted to Vismaya.`,
          read: false,
          createdAt: new Date().toISOString(),
          type: "cancellation",
          link: "/recruiter/opportunities",
        },
      ];

      return {
        ...state,
        opportunities: updatedOpportunities,
        cancellationRequests: [newRequest, ...state.cancellationRequests],
        notifications: [...notifs, ...state.notifications],
      };
    }

    case "ADMIN_RESOLVE_CANCELLATION": {
      const { requestId, decision, adminNote } = action.payload; // decision: "Approved" | "Declined"
      const targetReq = state.cancellationRequests.find((r) => r.id === requestId);
      if (!targetReq) return state;

      const targetOpp = state.opportunities.find((o) => o.id === targetReq.opportunityId);
      const isApproved = decision === "Approved";

      const updatedRequests = state.cancellationRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: decision,
              resolvedAt: new Date().toISOString(),
              adminNote: adminNote || (isApproved ? "Cancellation approved." : "Cancellation declined."),
            }
          : r
      );

      const updatedOpportunities = state.opportunities.map((opp) =>
        opp.id === targetReq.opportunityId
          ? {
              ...opp,
              status: isApproved ? "Cancelled" : "Published",
              adminNote: adminNote || (isApproved ? "Opportunity cancelled by Vismaya." : "Cancellation declined."),
            }
          : opp
      );

      const notifs = [
        {
          id: `notif-${Date.now()}-1`,
          toRole: "organization",
          toUserId: targetReq.orgId,
          message: isApproved
            ? `Cancellation approved for '${targetOpp?.title || "Opportunity"}'.`
            : `Cancellation declined for '${targetOpp?.title || "Opportunity"}'. Reason: ${adminNote || "Please contact desk"}`,
          read: false,
          createdAt: new Date().toISOString(),
          type: isApproved ? "danger" : "info",
          link: "/recruiter/opportunities",
        },
      ];

      // If approved, notify all applicants who applied to this opportunity
      if (isApproved) {
        const oppApps = state.applications.filter((a) => a.opportunityId === targetReq.opportunityId);
        oppApps.forEach((app, idx) => {
          notifs.push({
            id: `notif-cancel-app-${app.id}-${Date.now()}-${idx}`,
            toRole: "talent",
            toUserId: app.talentId,
            message: `Opportunity '${targetOpp?.title || "Opportunity"}' has been cancelled by the organization.`,
            read: false,
            createdAt: new Date().toISOString(),
            type: "warning",
            link: "/talent/applications",
          });
        });
      }

      return {
        ...state,
        cancellationRequests: updatedRequests,
        opportunities: updatedOpportunities,
        notifications: [...notifs, ...state.notifications],
      };
    }

    case "MARK_OPPORTUNITY_COMPLETED": {
      const { opportunityId } = action.payload;
      const targetOpp = state.opportunities.find((o) => o.id === opportunityId);
      if (!targetOpp) return state;

      const updatedOpportunities = state.opportunities.map((opp) =>
        opp.id === opportunityId ? { ...opp, status: "Completed" } : opp
      );

      const newNotif = {
        id: `notif-${Date.now()}`,
        toRole: "organization",
        toUserId: targetOpp.orgId,
        message: `Opportunity '${targetOpp.title}' has been marked as Completed.`,
        read: false,
        createdAt: new Date().toISOString(),
        type: "opportunity",
        link: "/recruiter/opportunities",
      };

      return {
        ...state,
        opportunities: updatedOpportunities,
        notifications: [newNotif, ...state.notifications],
      };
    }

    // ------------------------------------------------------------------------
    // APPLICATION ACTIONS
    // ------------------------------------------------------------------------
    case "APPLY_TO_OPPORTUNITY": {
      const { opportunityId, talentId, talentProfile, roleApplied } = action.payload;
      const opp = state.opportunities.find((o) => o.id === opportunityId);

      // Business Rule 1: Only Published opportunities accept applications
      if (!opp || opp.status !== "Published") {
        console.error("Workflow Error: Applications are only accepted for Published opportunities.");
        return state;
      }

      // Business Rule 2: Never after deadline
      if (new Date(opp.deadline) < new Date()) {
        console.error("Workflow Error: Opportunity deadline has passed.");
        return state;
      }

      // Business Rule 3: A talent can apply to an opportunity only once
      const alreadyApplied = state.applications.some(
        (a) => a.opportunityId === opportunityId && a.talentId === talentId
      );
      if (alreadyApplied) {
        console.error("Workflow Error: Talent has already applied to this opportunity.");
        return state;
      }

      const timestamp = new Date().toISOString();
      const talentName = talentProfile?.name || talentProfile?.stageName || "Verified Talent";

      const newApp = {
        id: `app-${Date.now()}`,
        opportunityId,
        talentId,
        talentName,
        talentProfile: talentProfile || {},
        roleApplied: roleApplied || opp.roles[0]?.roleName || "Lead Role",
        status: "Applied",
        appliedAt: timestamp,
        history: [
          {
            status: "Applied",
            timestamp,
            note: "Application submitted with verified talent profile.",
            changedBy: talentName,
          },
        ],
      };

      const notifs = [
        {
          id: `notif-${Date.now()}-1`,
          toRole: "talent",
          toUserId: talentId,
          message: `You applied for '${newApp.roleApplied}' on '${opp.title}'.`,
          read: false,
          createdAt: timestamp,
          type: "application",
          link: "/talent/applications",
        },
        {
          id: `notif-${Date.now()}-2`,
          toRole: "organization",
          toUserId: opp.orgId,
          message: `New application received from ${talentName} for '${newApp.roleApplied}' on '${opp.title}'.`,
          read: false,
          createdAt: timestamp,
          type: "application",
          link: "/recruiter/shortlist-auditions",
        },
      ];

      return {
        ...state,
        applications: [newApp, ...state.applications],
        notifications: [...notifs, ...state.notifications],
      };
    }

    case "WITHDRAW_APPLICATION": {
      const { applicationId, reason } = action.payload;
      const targetApp = state.applications.find((a) => a.id === applicationId);
      if (!targetApp || targetApp.status === "Withdrawn") return state;

      const opp = state.opportunities.find((o) => o.id === targetApp.opportunityId);
      const timestamp = new Date().toISOString();

      const updatedApplications = state.applications.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              status: "Withdrawn",
              history: [
                ...app.history,
                {
                  status: "Withdrawn",
                  timestamp,
                  note: reason || "Application withdrawn by talent.",
                  changedBy: targetApp.talentName || "Talent",
                },
              ],
            }
          : app
      );

      const newNotif = {
        id: `notif-${Date.now()}`,
        toRole: "organization",
        toUserId: opp?.orgId,
        message: `${targetApp.talentName} has withdrawn their application for '${targetApp.roleApplied}' on '${opp?.title || "Opportunity"}'.`,
        read: false,
        createdAt: timestamp,
        type: "info",
        link: "/recruiter/shortlist-auditions",
      };

      return {
        ...state,
        applications: updatedApplications,
        notifications: [newNotif, ...state.notifications],
      };
    }

    case "SET_APPLICATION_STATUS": {
      const { applicationId, newStatus, note, changedBy = "Organization" } = action.payload;
      const targetApp = state.applications.find((a) => a.id === applicationId);
      if (!targetApp) return state;

      const currentStatus = targetApp.status;

      // Business Rule: Selected is only allowed from Shortlisted
      if (newStatus === "Selected" && currentStatus !== "Shortlisted") {
        console.error("Workflow Error: 'Selected' status is only allowed from 'Shortlisted'.");
        return state;
      }

      // Business Rule: Not Selected is allowed from Under Review or Shortlisted
      if (
        newStatus === "Not Selected" &&
        currentStatus !== "Under Review" &&
        currentStatus !== "Shortlisted" &&
        currentStatus !== "Applied"
      ) {
        console.error("Workflow Error: 'Not Selected' is only allowed from 'Applied', 'Under Review' or 'Shortlisted'.");
        return state;
      }

      const timestamp = new Date().toISOString();
      const opp = state.opportunities.find((o) => o.id === targetApp.opportunityId);

      const updatedApplications = state.applications.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              status: newStatus,
              history: [
                ...app.history,
                {
                  status: newStatus,
                  timestamp,
                  note: note || `Application status updated to ${newStatus}.`,
                  changedBy,
                },
              ],
            }
          : app
      );

      const newNotif = {
        id: `notif-${Date.now()}`,
        toRole: "talent",
        toUserId: targetApp.talentId,
        message: `Your application status for '${opp?.title || "Opportunity"}' is now ${newStatus}.`,
        read: false,
        createdAt: timestamp,
        type: newStatus === "Selected" ? "success" : newStatus === "Shortlisted" ? "shortlist" : "info",
        link: "/talent/applications",
      };

      return {
        ...state,
        applications: updatedApplications,
        notifications: [newNotif, ...state.notifications],
      };
    }

    // Opening an application that is "Applied" moves it to "Under Review" automatically
    case "OPEN_APPLICATION": {
      const { applicationId } = action.payload;
      const targetApp = state.applications.find((a) => a.id === applicationId);
      if (!targetApp || targetApp.status !== "Applied") return state;

      const timestamp = new Date().toISOString();

      const updatedApplications = state.applications.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              status: "Under Review",
              history: [
                ...app.history,
                {
                  status: "Under Review",
                  timestamp,
                  note: "Application opened and marked Under Review.",
                  changedBy: "Organization",
                },
              ],
            }
          : app
      );

      return {
        ...state,
        applications: updatedApplications,
      };
    }

    // ------------------------------------------------------------------------
    // AUDITION ACTIONS
    // ------------------------------------------------------------------------
    case "REQUEST_AUDITION": {
      const { applicationId, type = "Audition", note } = action.payload; // type: Audition | Interview
      const targetApp = state.applications.find((a) => a.id === applicationId);
      if (!targetApp) return state;

      const opp = state.opportunities.find((o) => o.id === targetApp.opportunityId);
      const timestamp = new Date().toISOString();

      const newAudition = {
        id: `aud-${Date.now()}`,
        applicationId,
        opportunityId: targetApp.opportunityId,
        talentId: targetApp.talentId,
        talentName: targetApp.talentName,
        orgId: opp?.orgId || "org-1",
        type, // Audition | Interview
        status: "Requested", // Requested -> Relayed to Talent -> Self-tape Received -> Forwarded to Organization
        note: note || "Audition / self-tape requested.",
        selfTapeUrl: null,
        requestedAt: timestamp,
        updatedAt: timestamp,
      };

      const notifs = [
        {
          id: `notif-${Date.now()}-1`,
          toRole: "vismaya",
          toUserId: "admin",
          message: `${type} requested for ${targetApp.talentName} (${targetApp.roleApplied}) on '${opp?.title}'. Awaiting Vismaya relay.`,
          read: false,
          createdAt: timestamp,
          type: "audition",
          link: "/admin/applications",
        },
        {
          id: `notif-${Date.now()}-2`,
          toRole: "organization",
          toUserId: opp?.orgId,
          message: `${type} request created for ${targetApp.talentName}. Queued for Vismaya verification and relay.`,
          read: false,
          createdAt: timestamp,
          type: "audition",
          link: "/recruiter/shortlist-auditions",
        },
      ];

      return {
        ...state,
        auditions: [newAudition, ...state.auditions],
        notifications: [...notifs, ...state.notifications],
      };
    }

    case "ADMIN_RELAY_AUDITION": {
      const { auditionId, note } = action.payload;
      const targetAud = state.auditions.find((a) => a.id === auditionId);
      if (!targetAud) return state;

      const opp = state.opportunities.find((o) => o.id === targetAud.opportunityId);
      const timestamp = new Date().toISOString();

      const updatedAuditions = state.auditions.map((aud) =>
        aud.id === auditionId
          ? {
              ...aud,
              status: "Relayed to Talent",
              note: note || aud.note,
              updatedAt: timestamp,
            }
          : aud
      );

      const notifs = [
        {
          id: `notif-${Date.now()}-1`,
          toRole: "talent",
          toUserId: targetAud.talentId,
          message: `Audition invitation for '${opp?.title || "Opportunity"}': ${note || targetAud.note}`,
          read: false,
          createdAt: timestamp,
          type: "audition",
          link: "/talent/applications",
        },
        {
          id: `notif-${Date.now()}-2`,
          toRole: "organization",
          toUserId: targetAud.orgId,
          message: `Audition instructions relayed to ${targetAud.talentName} by Vismaya team.`,
          read: false,
          createdAt: timestamp,
          type: "info",
          link: "/recruiter/shortlist-auditions",
        },
      ];

      return {
        ...state,
        auditions: updatedAuditions,
        notifications: [...notifs, ...state.notifications],
      };
    }

    case "SUBMIT_SELF_TAPE": {
      const { auditionId, selfTapeUrl, note } = action.payload;
      const targetAud = state.auditions.find((a) => a.id === auditionId);
      if (!targetAud) return state;

      const opp = state.opportunities.find((o) => o.id === targetAud.opportunityId);
      const timestamp = new Date().toISOString();

      const updatedAuditions = state.auditions.map((aud) =>
        aud.id === auditionId
          ? {
              ...aud,
              status: "Self-tape Received",
              selfTapeUrl: selfTapeUrl || "https://vismaya.media/selftapes/sample-audition.mp4",
              note: note || aud.note,
              updatedAt: timestamp,
            }
          : aud
      );

      const notifs = [
        {
          id: `notif-${Date.now()}-1`,
          toRole: "vismaya",
          toUserId: "admin",
          message: `${targetAud.talentName} submitted a self-tape audition for '${opp?.title}'. Ready for moderation.`,
          read: false,
          createdAt: timestamp,
          type: "media",
          link: "/admin/media-moderation",
        },
        {
          id: `notif-${Date.now()}-2`,
          toRole: "talent",
          toUserId: targetAud.talentId,
          message: `Your self-tape audition for '${opp?.title}' was uploaded successfully and sent for review.`,
          read: false,
          createdAt: timestamp,
          type: "success",
          link: "/talent/applications",
        },
      ];

      return {
        ...state,
        auditions: updatedAuditions,
        notifications: [...notifs, ...state.notifications],
      };
    }

    case "ADMIN_FORWARD_SELF_TAPE": {
      const { auditionId, note } = action.payload;
      const targetAud = state.auditions.find((a) => a.id === auditionId);
      if (!targetAud) return state;

      const opp = state.opportunities.find((o) => o.id === targetAud.opportunityId);
      const timestamp = new Date().toISOString();

      const updatedAuditions = state.auditions.map((aud) =>
        aud.id === auditionId
          ? {
              ...aud,
              status: "Forwarded to Organization",
              note: note || aud.note,
              updatedAt: timestamp,
            }
          : aud
      );

      const newNotif = {
        id: `notif-${Date.now()}`,
        toRole: "organization",
        toUserId: targetAud.orgId,
        message: `Self-tape audition from ${targetAud.talentName} verified and forwarded by Vismaya for '${opp?.title}'.`,
        read: false,
        createdAt: timestamp,
        type: "audition",
        link: "/recruiter/shortlist-auditions",
      };

      return {
        ...state,
        auditions: updatedAuditions,
        notifications: [newNotif, ...state.notifications],
      };
    }

    // ------------------------------------------------------------------------
    // NOTIFICATION ACTIONS
    // ------------------------------------------------------------------------
    case "MARK_NOTIFICATION_READ": {
      const { notificationId } = action.payload;
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
      };
    }

    case "MARK_ALL_NOTIFICATIONS_READ": {
      const { role, userId } = action.payload || {};
      return {
        ...state,
        notifications: state.notifications.map((n) => {
          if (role && n.toRole !== role) return n;
          if (userId && n.toUserId && n.toUserId !== userId) return n;
          return { ...n, read: true };
        }),
      };
    }

    // ------------------------------------------------------------------------
    // BROADCAST ACTIONS
    // ------------------------------------------------------------------------
    case "SEND_BROADCAST": {
      const {
        id,
        title,
        message,
        audience,
        category,
        channels,
        scheduledFor,
        targetCity,
        targetOrgType,
      } = action.payload;

      const isScheduled = !!scheduledFor && new Date(scheduledFor) > new Date();
      const status = isScheduled ? "Scheduled" : "Sent";
      const now = new Date().toISOString();

      // Estimate recipients
      let count = 1298;
      if (audience === "All talent") count = 1284;
      else if (audience === "All organizations") count = 14;
      else if (audience === "Talent by city") count = 620;
      else if (audience === "Organizations by type") count = 8;

      const newBroadcast = {
        id: id || `bc-${Date.now()}`,
        title: title || "",
        message: message.trim(),
        audience: audience || "All users",
        category: category || "Platform announcement",
        channels: channels || { inApp: true, email: false, sms: false, whatsapp: false },
        status,
        sentAt: isScheduled ? null : now,
        scheduledFor: isScheduled ? scheduledFor : null,
        deliveredCount: count,
        targetCity: targetCity || "All",
        targetOrgType: targetOrgType || "All",
        createdAt: now,
      };

      let newNotifs = [];
      if (!isScheduled) {
        if (audience === "All users" || audience === "All talent" || audience === "Talent by city") {
          newNotifs.push({
            id: `notif-tal-${Date.now()}`,
            toRole: "talent",
            toUserId: "tal-904",
            title: title || "Vismaya Platform Broadcast",
            message: message.trim(),
            read: false,
            createdAt: now,
            type: "broadcast",
            category: category || "Platform announcement",
            link: "/talent/notifications",
          });
        }
        if (audience === "All users" || audience === "All organizations" || audience === "Organizations by type") {
          newNotifs.push({
            id: `notif-org-${Date.now()}`,
            toRole: "organization",
            toUserId: "org-1",
            title: title || "Vismaya Platform Broadcast",
            message: message.trim(),
            read: false,
            createdAt: now,
            type: "broadcast",
            category: category || "Platform announcement",
            link: "/recruiter/notifications",
          });
        }
      }

      const existingBroadcasts = state.broadcasts || [];
      const updatedBroadcasts = [
        newBroadcast,
        ...existingBroadcasts.filter((b) => b.id !== newBroadcast.id),
      ];

      return {
        ...state,
        broadcasts: updatedBroadcasts,
        notifications: [...newNotifs, ...state.notifications],
      };
    }

    case "SAVE_BROADCAST_DRAFT": {
      const draftData = action.payload;
      const now = new Date().toISOString();
      const draftRecord = {
        ...draftData,
        id: draftData.id || `draft-${Date.now()}`,
        status: "Draft",
        updatedAt: now,
        createdAt: draftData.createdAt || now,
      };

      const existingBroadcasts = state.broadcasts || [];
      const updated = [
        draftRecord,
        ...existingBroadcasts.filter((b) => b.id !== draftRecord.id),
      ];

      return {
        ...state,
        broadcasts: updated,
      };
    }

    case "CANCEL_SCHEDULED_BROADCAST": {
      const { broadcastId } = action.payload;
      return {
        ...state,
        broadcasts: (state.broadcasts || []).map((b) =>
          b.id === broadcastId ? { ...b, status: "Cancelled", cancelledAt: new Date().toISOString() } : b
        ),
      };
    }

    case "CHECK_SCHEDULED_BROADCASTS": {
      const nowTime = Date.now();
      const currentList = state.broadcasts || [];
      let hasChanges = false;
      let newNotifs = [];

      const updated = currentList.map((b) => {
        if (b.status === "Scheduled" && b.scheduledFor) {
          const schedTime = new Date(b.scheduledFor).getTime();
          if (schedTime <= nowTime) {
            hasChanges = true;
            const nowIso = new Date().toISOString();
            if (b.audience === "All users" || b.audience === "All talent" || b.audience === "Talent by city") {
              newNotifs.push({
                id: `notif-tal-${Date.now()}-${b.id}`,
                toRole: "talent",
                toUserId: "tal-904",
                title: b.title || "Vismaya Platform Broadcast",
                message: b.message,
                read: false,
                createdAt: nowIso,
                type: "broadcast",
                category: b.category,
                link: "/talent/notifications",
              });
            }
            if (b.audience === "All users" || b.audience === "All organizations" || b.audience === "Organizations by type") {
              newNotifs.push({
                id: `notif-org-${Date.now()}-${b.id}`,
                toRole: "organization",
                toUserId: "org-1",
                title: b.title || "Vismaya Platform Broadcast",
                message: b.message,
                read: false,
                createdAt: nowIso,
                type: "broadcast",
                category: b.category,
                link: "/recruiter/notifications",
              });
            }
            return {
              ...b,
              status: "Sent",
              sentAt: nowIso,
            };
          }
        }
        return b;
      });

      if (!hasChanges) return state;

      return {
        ...state,
        broadcasts: updated,
        notifications: [...newNotifs, ...state.notifications],
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// 3. REACT CONTEXT & PROVIDER WITH SSR-SAFE HYDRATION
// ============================================================================

const WorkflowContext = createContext(null);

export function WorkflowProvider({ children }) {
  const [state, dispatch] = useReducer(workflowReducer, defaultWorkflowState);
  const [isHydrated, setIsHydrated] = useState(false);

  // SSR-safe hydration from localStorage on mount (and live API sync when real mode is active)
  useEffect(() => {
    let mounted = true;

    async function initStore() {
      // 1. If in Real Mode, try fetching live published opportunities
      if (isRealMode("opportunities")) {
        try {
          const oppsRes = await publicService.getPublishedOpportunities();
          if (mounted && oppsRes?.data && Array.isArray(oppsRes.data) && oppsRes.data.length > 0) {
            dispatch({
              type: "HYDRATE_STATE",
              payload: {
                ...defaultWorkflowState,
                opportunities: oppsRes.data,
              },
            });
            setIsHydrated(true);
            return;
          }
        } catch (err) {
          console.warn("Real opportunities fetch failed, using local/seed store:", err);
        }
      }

      // 2. Mock mode / fallback local storage hydration
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            const existingIds = new Set((parsed.opportunities || []).map((o) => o.id));
            const missingOpps = initialOpportunities.filter((o) => !existingIds.has(o.id));
            const mergedOpps = missingOpps.length > 0 ? [...(parsed.opportunities || []), ...missingOpps] : parsed.opportunities;

            const existingProjIds = new Set((parsed.projects || []).map((p) => p.id));
            const missingProjs = initialProjects.filter((p) => !existingProjIds.has(p.id));
            const mergedProjs = missingProjs.length > 0 ? [...(parsed.projects || []), ...missingProjs] : parsed.projects;

            const existingBcIds = new Set((parsed.broadcasts || []).map((b) => b.id));
            const missingBcs = initialBroadcasts.filter((b) => !existingBcIds.has(b.id));
            const mergedBcs = missingBcs.length > 0 ? [...(parsed.broadcasts || []), ...missingBcs] : (parsed.broadcasts || initialBroadcasts);

            dispatch({
              type: "HYDRATE_STATE",
              payload: {
                ...parsed,
                opportunities: mergedOpps,
                projects: mergedProjs,
                broadcasts: mergedBcs,
              },
            });
          }
        }
      } catch (err) {
        console.warn("WorkflowStore hydration failed, falling back to default seed:", err);
      } finally {
        if (mounted) setIsHydrated(true);
      }
    }

    initStore();
    return () => {
      mounted = false;
    };
  }, []);

  // Periodic timer to auto-send scheduled broadcasts when time passes
  useEffect(() => {
    if (!isHydrated) return;
    const interval = setInterval(() => {
      dispatch({ type: "CHECK_SCHEDULED_BROADCASTS" });
    }, 15000);
    return () => clearInterval(interval);
  }, [isHydrated]);

  // Persist state to localStorage whenever state changes after hydration (mock mode only)
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("WorkflowStore localStorage sync failed:", err);
    }
  }, [state, isHydrated]);

  // Periodic Auto-Close for expired published opportunities (runs on load and every minute)
  useEffect(() => {
    // Initial check
    dispatch({ type: "AUTO_CLOSE_EXPIRED" });

    // Every 60 seconds
    const interval = setInterval(() => {
      dispatch({ type: "AUTO_CLOSE_EXPIRED" });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Action Dispatchers
  const createProject = async (projectData) => {
    if (isRealMode("recruiter")) {
      try {
        const res = await recruiterService.createProject(projectData);
        if (res?.data) {
          dispatch({ type: "CREATE_PROJECT", payload: res.data });
          return res.data;
        }
      } catch (err) {
        console.warn("Real createProject failed:", err);
      }
    }
    dispatch({ type: "CREATE_PROJECT", payload: projectData });
  };

  const markProjectCompleted = (projectId) => {
    dispatch({ type: "MARK_PROJECT_COMPLETED", payload: { projectId } });
  };

  const submitOpportunity = async (opportunityData) => {
    if (isRealMode("recruiter")) {
      try {
        const res = await recruiterService.createOpportunity(opportunityData);
        if (res?.data) {
          dispatch({ type: "SUBMIT_OPPORTUNITY", payload: res.data });
          return res.data;
        }
      } catch (err) {
        console.warn("Real submitOpportunity failed:", err);
      }
    }
    dispatch({ type: "SUBMIT_OPPORTUNITY", payload: opportunityData });
  };

  const adminApproveAndPublish = async (opportunityId, adminNote) => {
    if (isRealMode("admin")) {
      try {
        await adminService.reviewOpportunity(opportunityId, { status: "Published", adminNote });
      } catch (err) {
        console.warn("Real adminApproveAndPublish failed:", err);
      }
    }
    dispatch({ type: "ADMIN_APPROVE_AND_PUBLISH", payload: { opportunityId, adminNote } });
  };

  const adminRequestChanges = async (opportunityId, note) => {
    if (isRealMode("admin")) {
      try {
        await adminService.reviewOpportunity(opportunityId, { status: "Changes Requested", adminNote: note });
      } catch (err) {
        console.warn("Real adminRequestChanges failed:", err);
      }
    }
    dispatch({ type: "ADMIN_REQUEST_CHANGES", payload: { opportunityId, note } });
  };

  const adminReject = async (opportunityId, reason) => {
    if (isRealMode("admin")) {
      try {
        await adminService.reviewOpportunity(opportunityId, { status: "Rejected", adminNote: reason });
      } catch (err) {
        console.warn("Real adminReject failed:", err);
      }
    }
    dispatch({ type: "ADMIN_REJECT", payload: { opportunityId, reason } });
  };

  const requestCancellation = async (opportunityId, reason) => {
    if (isRealMode("recruiter")) {
      try {
        await recruiterService.requestOpportunityCancellation(opportunityId, { reason });
      } catch (err) {
        console.warn("Real requestCancellation failed:", err);
      }
    }
    dispatch({ type: "REQUEST_CANCELLATION", payload: { opportunityId, reason } });
  };

  const adminResolveCancellation = async (requestId, decision, adminNote) => {
    if (isRealMode("admin")) {
      try {
        await adminService.reviewOpportunityCancellation(requestId, { decision, adminNote });
      } catch (err) {
        console.warn("Real adminResolveCancellation failed:", err);
      }
    }
    dispatch({ type: "ADMIN_RESOLVE_CANCELLATION", payload: { requestId, decision, adminNote } });
  };

  const markOpportunityCompleted = (opportunityId) => {
    dispatch({ type: "MARK_OPPORTUNITY_COMPLETED", payload: { opportunityId } });
  };

  const applyToOpportunity = async ({ opportunityId, talentId, talentProfile, roleApplied }) => {
    if (isRealMode("applications")) {
      try {
        const res = await talentService.applyToOpportunity(opportunityId, {
          roleName: roleApplied,
          notes: talentProfile?.bio,
        });
        if (res?.data) {
          dispatch({
            type: "APPLY_TO_OPPORTUNITY",
            payload: { opportunityId, talentId, talentProfile, roleApplied, ...res.data },
          });
          return res.data;
        }
      } catch (err) {
        console.warn("Real applyToOpportunity failed:", err);
      }
    }
    dispatch({
      type: "APPLY_TO_OPPORTUNITY",
      payload: { opportunityId, talentId, talentProfile, roleApplied },
    });
  };

  const withdrawApplication = async (applicationId, reason) => {
    if (isRealMode("applications")) {
      try {
        await talentService.withdrawApplication(applicationId);
      } catch (err) {
        console.warn("Real withdrawApplication failed:", err);
      }
    }
    dispatch({ type: "WITHDRAW_APPLICATION", payload: { applicationId, reason } });
  };

  const setApplicationStatus = async (applicationId, newStatus, note, changedBy) => {
    if (isRealMode("recruiter")) {
      try {
        await recruiterService.updateCandidateStatus(applicationId, newStatus);
      } catch (err) {
        console.warn("Real setApplicationStatus failed:", err);
      }
    }
    dispatch({
      type: "SET_APPLICATION_STATUS",
      payload: { applicationId, newStatus, note, changedBy },
    });
  };

  const openApplication = (applicationId) => {
    dispatch({ type: "OPEN_APPLICATION", payload: { applicationId } });
  };

  const requestAudition = async ({ applicationId, type, note }) => {
    if (isRealMode("recruiter")) {
      try {
        await recruiterService.requestAudition(applicationId, { type, notes: note });
      } catch (err) {
        console.warn("Real requestAudition failed:", err);
      }
    }
    dispatch({ type: "REQUEST_AUDITION", payload: { applicationId, type, note } });
  };

  const adminRelayAudition = async (auditionId, note) => {
    if (isRealMode("admin")) {
      try {
        await adminService.relayAudition(auditionId, { notes: note });
      } catch (err) {
        console.warn("Real adminRelayAudition failed:", err);
      }
    }
    dispatch({ type: "ADMIN_RELAY_AUDITION", payload: { auditionId, note } });
  };

  const submitSelfTape = async (auditionId, selfTapeUrl, note) => {
    if (isRealMode("talent")) {
      try {
        await talentService.submitSelfTape(auditionId, { selfTapeUrl, notes: note });
      } catch (err) {
        console.warn("Real submitSelfTape failed:", err);
      }
    }
    dispatch({ type: "SUBMIT_SELF_TAPE", payload: { auditionId, selfTapeUrl, note } });
  };

  const adminForwardSelfTape = async (auditionId, note) => {
    if (isRealMode("admin")) {
      try {
        await adminService.forwardAudition(auditionId, { notes: note });
      } catch (err) {
        console.warn("Real adminForwardSelfTape failed:", err);
      }
    }
    dispatch({ type: "ADMIN_FORWARD_SELF_TAPE", payload: { auditionId, note } });
  };

  const markNotificationRead = async (notificationId) => {
    if (isRealMode("notifications")) {
      try {
        await notificationService.markAsRead(notificationId);
      } catch (err) {
        console.warn("Real markNotificationRead failed:", err);
      }
    }
    dispatch({ type: "MARK_NOTIFICATION_READ", payload: { notificationId } });
  };

  const markAllNotificationsRead = async (role, userId) => {
    if (isRealMode("notifications")) {
      try {
        await notificationService.markAllAsRead();
      } catch (err) {
        console.warn("Real markAllNotificationsRead failed:", err);
      }
    }
    dispatch({ type: "MARK_ALL_NOTIFICATIONS_READ", payload: { role, userId } });
  };

  const sendBroadcast = async (broadcastData) => {
    if (isRealMode("admin")) {
      try {
        const res = await adminService.createBroadcast(broadcastData);
        if (res?.data) {
          dispatch({ type: "SEND_BROADCAST", payload: res.data });
          return res.data;
        }
      } catch (err) {
        console.warn("Real sendBroadcast failed:", err);
      }
    }
    dispatch({ type: "SEND_BROADCAST", payload: broadcastData });
  };

  const saveBroadcastDraft = async (draftData) => {
    if (isRealMode("admin")) {
      try {
        const res = await adminService.saveBroadcastDraft(draftData);
        if (res?.data) {
          dispatch({ type: "SAVE_BROADCAST_DRAFT", payload: res.data });
          return res.data;
        }
      } catch (err) {
        console.warn("Real saveBroadcastDraft failed:", err);
      }
    }
    dispatch({ type: "SAVE_BROADCAST_DRAFT", payload: draftData });
  };

  const cancelScheduledBroadcast = async (broadcastId) => {
    if (isRealMode("admin")) {
      try {
        await adminService.cancelBroadcast(broadcastId);
      } catch (err) {
        console.warn("Real cancelScheduledBroadcast failed:", err);
      }
    }
    dispatch({ type: "CANCEL_SCHEDULED_BROADCAST", payload: { broadcastId } });
  };

  const resetDemoData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn(e);
    }
    dispatch({ type: "RESET_DEMO_DATA" });
  };

  // Memoized Selector & Query Helpers
  const getProject = useMemo(
    () => (projectId) => state.projects.find((p) => p.id === projectId),
    [state.projects]
  );

  const getProjectOpportunities = useMemo(
    () => (projectId) => state.opportunities.filter((o) => o.projectId === projectId),
    [state.opportunities]
  );

  const getOrganizationProjects = useMemo(
    () => (orgId) => state.projects.filter((p) => p.orgId === orgId),
    [state.projects]
  );

  const getOpportunity = useMemo(
    () => (opportunityId) => state.opportunities.find((o) => o.id === opportunityId),
    [state.opportunities]
  );

  const getOpportunityApplications = useMemo(
    () => (opportunityId) => state.applications.filter((a) => a.opportunityId === opportunityId),
    [state.applications]
  );

  const getTalentApplications = useMemo(
    () => (talentId) => state.applications.filter((a) => a.talentId === talentId),
    [state.applications]
  );

  const getApplicationAuditions = useMemo(
    () => (applicationId) => state.auditions.filter((aud) => aud.applicationId === applicationId),
    [state.auditions]
  );

  const getOpportunityAuditions = useMemo(
    () => (opportunityId) => state.auditions.filter((aud) => aud.opportunityId === opportunityId),
    [state.auditions]
  );

  const getNotificationsForRole = useMemo(
    () => (role, userId) =>
      state.notifications.filter(
        (n) => n.toRole === role && (!n.toUserId || !userId || n.toUserId === userId)
      ),
    [state.notifications]
  );

  const unreadNotificationsCount = useMemo(
    () => (role, userId) =>
      state.notifications.filter(
        (n) => !n.read && n.toRole === role && (!n.toUserId || !userId || n.toUserId === userId)
      ).length,
    [state.notifications]
  );

  const contextValue = useMemo(
    () => ({
      // State entities
      organizations: state.organizations,
      projects: state.projects,
      opportunities: state.opportunities,
      applications: state.applications,
      auditions: state.auditions,
      cancellationRequests: state.cancellationRequests,
      notifications: state.notifications,
      broadcasts: state.broadcasts || initialBroadcasts,
      isHydrated,

      // Actions
      createProject,
      markProjectCompleted,
      submitOpportunity,
      adminApproveAndPublish,
      adminRequestChanges,
      adminReject,
      requestCancellation,
      adminResolveCancellation,
      markOpportunityCompleted,
      applyToOpportunity,
      withdrawApplication,
      setApplicationStatus,
      openApplication,
      requestAudition,
      adminRelayAudition,
      submitSelfTape,
      adminForwardSelfTape,
      markNotificationRead,
      markAllNotificationsRead,
      sendBroadcast,
      saveBroadcastDraft,
      cancelScheduledBroadcast,
      resetDemoData,

      // Query helpers
      getProject,
      getProjectOpportunities,
      getOrganizationProjects,
      getOpportunity,
      getOpportunityApplications,
      getTalentApplications,
      getApplicationAuditions,
      getOpportunityAuditions,
      getNotificationsForRole,
      unreadNotificationsCount,
    }),
    [
      state,
      isHydrated,
      getProject,
      getProjectOpportunities,
      getOrganizationProjects,
      getOpportunity,
      getOpportunityApplications,
      getTalentApplications,
      getApplicationAuditions,
      getOpportunityAuditions,
      getNotificationsForRole,
      unreadNotificationsCount,
    ]
  );

  return <WorkflowContext.Provider value={contextValue}>{children}</WorkflowContext.Provider>;
}

// Custom Hook to consume the Workflow Store
export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }
  return context;
}
