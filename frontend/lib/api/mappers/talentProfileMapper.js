/**
 * Talent Profile Entity Mapper
 * 
 * Maps between backend TalentProfile nested schema and frontend UI components.
 */

import { toFrontendStatus } from "../statusMapper.js";

function safeIsoDate(val, fallback = null) {
  if (!val) return fallback;
  const d = new Date(val);
  return !isNaN(d.getTime()) ? d.toISOString() : (typeof val === "string" ? val : fallback);
}

export function fromApi(profile) {
  if (!profile) return null;

  const id = profile._id ? String(profile._id) : (profile.id ? String(profile.id) : "");
  const userIdObj = profile.userId && typeof profile.userId === "object" ? profile.userId : null;
  const userId = userIdObj ? String(userIdObj._id || userIdObj.id) : (profile.userId ? String(profile.userId) : "");

  const userEmail = userIdObj?.email || profile.contactDetails?.email || profile.personal?.email || profile.email || "";
  const userMobile = userIdObj?.mobile || userIdObj?.phone || profile.contactDetails?.mobile || profile.contactDetails?.phone || profile.personal?.phone || profile.personal?.mobile || profile.mobile || profile.phone || "";
  const userName = userIdObj?.name || profile.contactDetails?.name || profile.personal?.fullName || profile.name || "";
  const isEmailVerified = profile.isEmailVerified !== undefined
    ? Boolean(profile.isEmailVerified)
    : (userIdObj?.isEmailVerified !== undefined ? Boolean(userIdObj.isEmailVerified) : false);
  const twoFactorEnabled = profile.twoFactorEnabled !== undefined
    ? Boolean(profile.twoFactorEnabled)
    : (userIdObj?.twoFactorEnabled !== undefined ? Boolean(userIdObj.twoFactorEnabled) : false);
  const emailNotificationsEnabled = profile.emailNotificationsEnabled !== undefined
    ? Boolean(profile.emailNotificationsEnabled)
    : (userIdObj?.emailNotificationsEnabled !== undefined ? Boolean(userIdObj.emailNotificationsEnabled) : true);

  const computedName = profile.stageName?.trim() || 
    profile.personal?.stageName?.trim() ||
    profile.personal?.fullName?.trim() ||
    profile.personal?.name?.trim() ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    userName ||
    "Anonymous Talent";

  const primaryProfession = profile.primaryProfession || profile.primaryDesignation || profile.personal?.primaryRole || "";
  const location = [profile.currentCity || profile.personal?.city, profile.currentState || profile.personal?.state].filter(Boolean).join(", ") || profile.currentCity || profile.personal?.city || "India";

  // Normalize skills array: supports both [{ name, proficiency }] and ["Acting", "Dance"]
  const skillsList = Array.isArray(profile.skills)
    ? profile.skills.map((s) => (typeof s === "string" ? s : s?.name || "")).filter(Boolean)
    : (Array.isArray(profile.skillsAndLanguages?.skills) ? profile.skillsAndLanguages.skills : []);

  const languagesList = Array.isArray(profile.languages)
    ? profile.languages.map((l) => (typeof l === "string" ? l : l?.language || "")).filter(Boolean)
    : (Array.isArray(profile.skillsAndLanguages?.languages) ? profile.skillsAndLanguages.languages : []);

  const photosList = Array.isArray(profile.portfolio?.photos)
    ? profile.portfolio.photos
    : (Array.isArray(profile.photos) ? profile.photos : []);

  const videosList = Array.isArray(profile.portfolio?.videos)
    ? profile.portfolio.videos
    : (Array.isArray(profile.videos) ? profile.videos : []);

  const showreelUrl = profile.portfolio?.showreelUrl || profile.showreel || (videosList.length > 0 ? videosList[0] : "");

  const rawDobVal = profile.dob || profile.personalDetails?.dob || profile.personal?.dob;
  const computedAge = (() => {
    if (rawDobVal) {
      const d = new Date(rawDobVal);
      if (!isNaN(d.getTime())) {
        const ageDiffMs = Date.now() - d.getTime();
        const ageDate = new Date(ageDiffMs);
        const calcAge = Math.abs(ageDate.getUTCFullYear() - 1970);
        if (!isNaN(calcAge) && calcAge > 0 && calcAge < 120) return calcAge;
      }
    }
    const fallbackAge = profile.age || profile.personal?.age || profile.personalDetails?.age;
    return fallbackAge ? Number(fallbackAge) : "";
  })();

  const rawCreatedAt = profile.createdAt || (typeof profile.userId === "object" ? profile.userId?.createdAt : null) || null;
  const safeCreatedAt = safeIsoDate(rawCreatedAt, null);
  const formattedJoinedDate = safeCreatedAt
    ? new Date(safeCreatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : (profile.joinedDate || "");

  // Status mapping
  const rawStatus = String(profile.status || userIdObj?.status || "").toLowerCase().trim();
  const isApproved = Boolean(
    profile.isProfileApproved ||
    profile.isVerified ||
    rawStatus === "approved" ||
    (rawStatus === "active" && profile.isProfileApproved !== false && profile.vismayaId)
  );

  const isUnprofiled = !profile.vismayaId &&
    (profile.photos === undefined || profile.photos.length === 0) &&
    !profile.skills?.length &&
    !profile.credits?.length &&
    profile.profileCompletionPercentage === undefined;

  let mappedStatus = "Pending";
  if (rawStatus === "rejected") {
    mappedStatus = "Rejected";
  } else if (rawStatus === "suspended") {
    mappedStatus = "Suspended";
  } else if (rawStatus === "approved" || (rawStatus === "active" && isApproved && !isUnprofiled)) {
    mappedStatus = "Approved";
  } else if (isUnprofiled || rawStatus === "draft" || rawStatus === "incomplete") {
    mappedStatus = "Incomplete / Draft";
  } else if (rawStatus === "pending") {
    mappedStatus = "Pending";
  } else if (rawStatus === "active") {
    mappedStatus = isApproved ? "Approved" : "Incomplete / Draft";
  } else {
    mappedStatus = toFrontendStatus("user", rawStatus) || "Pending";
  }

  return {
    id: profile.vismayaId || id,
    _id: id,
    vismayaId: profile.vismayaId || id,
    userId,
    name: computedName,
    stageName: profile.stageName || profile.personal?.stageName || "",
    firstName: profile.firstName || "",
    middleName: profile.middleName || "",
    lastName: profile.lastName || "",
    headline: profile.headline || profile.personal?.headline || "",
    bio: profile.bio || profile.personal?.bio || "",
    status: mappedStatus,
    rawStatus: profile.status || rawStatus || "pending",
    isProfileApproved: isApproved,
    isPaid: Boolean(profile.isPaid || userIdObj?.isPaid),
    age: computedAge,
    createdAt: safeCreatedAt,
    joinedDate: formattedJoinedDate,
    personal: {
      fullName: userName || computedName,
      stageName: profile.stageName || profile.personal?.stageName || "",
      headline: profile.headline || profile.personal?.headline || "",
      age: computedAge,
      dob: safeIsoDate(rawDobVal, "") ? safeIsoDate(rawDobVal, "").split("T")[0] : (rawDobVal || ""),
      gender: profile.gender || profile.personal?.gender || "",
      city: profile.currentCity || profile.personal?.city || profile.city || "",
      state: profile.currentState || profile.personal?.state || profile.state || "",
      email: userEmail,
      phone: userMobile,
      isEmailVerified,
      twoFactorEnabled,
      emailNotificationsEnabled,
      bio: profile.bio || profile.personal?.bio || "",
      primaryRole: primaryProfession,
    },
    profilePhoto: profile.profilePhoto || profile.avatar || photosList[0] || "",
    avatar: profile.profilePhoto || profile.avatar || photosList[0] || "",
    dob: safeIsoDate(profile.dob, profile.personal?.dob || "") ? safeIsoDate(profile.dob, profile.personal?.dob || "").split("T")[0] : (profile.personal?.dob || ""),
    gender: profile.gender || profile.personal?.gender || "prefer_not_to_say",
    nationality: profile.nationality || "Indian",
    careerStage: profile.careerStage || "aspiring",
    category: profile.category || "open_talent",
    primaryProfession,
    secondaryProfessions: Array.isArray(profile.secondaryProfessions)
      ? profile.secondaryProfessions
      : (profile.secondaryProfession ? [profile.secondaryProfession] : (Array.isArray(profile.secondaryDepartments) ? profile.secondaryDepartments : [])),
    primaryDepartment: profile.primaryDepartment || "",
    primaryDesignation: profile.primaryDesignation || "",
    specializations: Array.isArray(profile.specializations) ? profile.specializations : [],
    secondaryDepartments: Array.isArray(profile.secondaryDepartments) ? profile.secondaryDepartments : [],
    city: profile.currentCity || "",
    currentCity: profile.currentCity || "",
    state: profile.currentState || "",
    currentState: profile.currentState || "",
    country: profile.country || "India",
    location,
    workingCities: Array.isArray(profile.workingCities) ? profile.workingCities : [],
    willingToTravel: profile.willingToTravel !== undefined ? Boolean(profile.willingToTravel) : true,
    willingToRelocate: Boolean(profile.willingToRelocate),
    passportAvailable: Boolean(profile.passportAvailable),
    skills: skillsList,
    skillsDetailed: Array.isArray(profile.skills) ? profile.skills : [],
    languages: languagesList,
    languagesDetailed: Array.isArray(profile.languages) ? profile.languages : [],
    accentsAndDialects: Array.isArray(profile.accentsAndDialects) ? profile.accentsAndDialects : [],
    experience: Array.isArray(profile.experience) ? profile.experience : (Array.isArray(profile.credits) ? profile.credits.map((c) => ({
      id: c._id ? String(c._id) : (c.id || ""),
      project: c.projectTitle || c.project || "",
      role: c.roleOrDesignation || c.role || "",
      production: c.directorOrProduction || c.production || "",
      year: c.year ? String(c.year) : "",
    })) : []),
    credits: Array.isArray(profile.credits) ? profile.credits.map((c) => ({
      id: c._id ? String(c._id) : (c.id || ""),
      _id: c._id ? String(c._id) : (c.id || ""),
      projectTitle: c.projectTitle || c.project || "",
      projectType: c.projectType || "",
      roleOrDesignation: c.roleOrDesignation || c.role || "",
      year: c.year || null,
      directorOrProduction: c.directorOrProduction || c.production || "",
      characterName: c.characterName || "",
      referenceLink: c.referenceLink || "",
      isVerifiedCredit: Boolean(c.isVerifiedCredit),
      verificationStatus: c.verificationStatus || (c.isVerifiedCredit ? "verified" : "pending"),
    })) : (Array.isArray(profile.experience) ? profile.experience.map((e) => ({
      id: e.id || "",
      _id: e.id || "",
      projectTitle: e.project || "",
      projectType: "Film / Project",
      roleOrDesignation: e.role || "",
      year: e.year ? parseInt(e.year, 10) : null,
      directorOrProduction: e.production || "",
      characterName: e.role || "",
      isVerifiedCredit: false,
      verificationStatus: "pending"
    })) : []),
    training: Array.isArray(profile.training) ? profile.training.map((t) => ({
      id: t._id ? String(t._id) : (t.id || ""),
      institution: t.institution || "",
      courseName: t.courseName || "",
      mentor: t.mentor || "",
      yearCompleted: t.yearCompleted || null,
    })) : [],
    awards: Array.isArray(profile.awards) ? profile.awards.map((a) => ({
      id: a._id ? String(a._id) : (a.id || ""),
      title: a.title || "",
      organization: a.organization || "",
      year: a.year || null,
      category: a.category || "",
    })) : [],
    portfolio: {
      photos: photosList,
      videos: videosList,
      showreelUrl,
    },
    photos: photosList,
    showreel: showreelUrl,
    physical: {
      height: profile.physical?.height || (profile.physicalAttributes?.heightCm ? String(profile.physicalAttributes.heightCm) : ""),
      weight: profile.physical?.weight || (profile.physicalAttributes?.weightKg ? String(profile.physicalAttributes.weightKg) : ""),
      skinTone: profile.physical?.skinTone || profile.physicalAttributes?.skinTone || "",
      hairColor: profile.physical?.hairColor || profile.physicalAttributes?.hairColor || "",
      hairLength: profile.physical?.hairLength || "",
      eyeColor: profile.physical?.eyeColor || profile.physicalAttributes?.eyeColor || "",
      bodyType: profile.physical?.bodyType || profile.physicalAttributes?.bodyType || "",
      chest: profile.physical?.chest || "",
    },
    physicalAttributes: {
      heightCm: profile.physicalAttributes?.heightCm || (profile.physical?.height ? parseInt(profile.physical.height, 10) : null),
      weightKg: profile.physicalAttributes?.weightKg || (profile.physical?.weight ? parseInt(profile.physical.weight, 10) : null),
      eyeColor: profile.physicalAttributes?.eyeColor || profile.physical?.eyeColor || "",
      hairColor: profile.physicalAttributes?.hairColor || profile.physical?.hairColor || "",
      skinTone: profile.physicalAttributes?.skinTone || profile.physical?.skinTone || "",
      bodyType: profile.physicalAttributes?.bodyType || profile.physical?.bodyType || "",
    },
    remunerationExpectation: {
      ratePerDay: profile.remunerationExpectation?.ratePerDay || null,
      ratePerProject: profile.remunerationExpectation?.ratePerProject || null,
      currency: profile.remunerationExpectation?.currency || "INR",
      isNegotiable: profile.remunerationExpectation?.isNegotiable !== undefined ? Boolean(profile.remunerationExpectation.isNegotiable) : true,
    },
    profileCompletionPercentage: profile.profileCompletionPercentage || 0,
    completionPercentage: profile.profileCompletionPercentage || 0,
    stepsCompletion: profile.stepsCompletion || null,
    missingSections: Array.isArray(profile.missingSections) ? profile.missingSections : [],
    isSearchable: Boolean(profile.isSearchable),
    isFeatured: Boolean(profile.isFeatured),
    isTrending: Boolean(profile.isTrending),
    isUnder18: Boolean(profile.isUnder18),
    isEmailVerified,
    twoFactorEnabled,
    emailNotificationsEnabled,
    email: userEmail,
    mobile: userMobile,
    phone: userMobile,
    socialLinks: {
      instagram: profile.socialLinks?.instagram || "",
      twitter: profile.socialLinks?.twitter || "",
      youtube: profile.socialLinks?.youtube || "",
      imdb: profile.socialLinks?.imdb || "",
      website: profile.socialLinks?.website || "",
      linkedin: profile.socialLinks?.linkedin || "",
    },
    availability: {
      status: profile.availability?.status || "available_now",
      availableDays: Array.isArray(profile.availability?.availableDays) ? profile.availability.availableDays : ["Weekdays", "Weekends", "Full Time Shoot"],
      willingToTravel: profile.willingToTravel !== undefined ? Boolean(profile.willingToTravel) : (profile.availability?.willingToTravel !== undefined ? Boolean(profile.availability.willingToTravel) : true),
      hasPassport: profile.passportAvailable !== undefined ? Boolean(profile.passportAvailable) : (profile.availability?.hasPassport !== undefined ? Boolean(profile.availability.hasPassport) : false),
      preferredCities: Array.isArray(profile.workingCities) ? profile.workingCities : (Array.isArray(profile.availability?.preferredCities) ? profile.availability.preferredCities : []),
      noticePeriod: profile.availability?.noticePeriod || "Immediate",
    },
    guardianDetails: {
      guardianName: profile.guardianDetails?.guardianName || profile.guardianConsent?.guardianName || "",
      relationship: profile.guardianDetails?.relationship || profile.guardianConsent?.relationship || profile.guardianConsent?.relation || "",
      contactNumber: profile.guardianDetails?.contactNumber || profile.guardianDetails?.phone || profile.guardianConsent?.guardianPhone || profile.guardianConsent?.phone || "",
      guardianEmail: profile.guardianDetails?.guardianEmail || profile.guardianConsent?.guardianEmail || profile.guardianConsent?.email || "",
      consentGiven: Boolean(profile.guardianDetails?.consentGiven || profile.guardianConsent?.consentGiven),
    },
    guardianConsent: {
      guardianName: profile.guardianDetails?.guardianName || profile.guardianConsent?.guardianName || "",
      guardianPhone: profile.guardianDetails?.contactNumber || profile.guardianDetails?.phone || profile.guardianConsent?.guardianPhone || profile.guardianConsent?.phone || "",
      guardianEmail: profile.guardianDetails?.guardianEmail || profile.guardianConsent?.guardianEmail || profile.guardianConsent?.email || "",
      relationship: profile.guardianDetails?.relationship || profile.guardianConsent?.relationship || profile.guardianConsent?.relation || "",
      relation: profile.guardianDetails?.relationship || profile.guardianConsent?.relationship || profile.guardianConsent?.relation || "",
      phone: profile.guardianDetails?.contactNumber || profile.guardianDetails?.phone || profile.guardianConsent?.guardianPhone || profile.guardianConsent?.phone || "",
      consentGiven: Boolean(profile.guardianDetails?.consentGiven || profile.guardianConsent?.consentGiven),
      consentLetterUploaded: Boolean(profile.guardianDetails?.consentLetter || profile.guardianConsent?.consentLetterUploaded),
    },
    contactDetails: {
      email: userEmail,
      mobile: userMobile,
      phone: userMobile,
      name: userName,
    },
  };
}

export function toApi(profile) {
  const pers = {
    ...(profile.personalDetails || {}),
    ...(profile.personal || {}),
  };
  const phys = {
    ...(profile.physicalDetails || {}),
    ...(profile.physical || {}),
    ...(profile.physicalAttributes || {}),
  };

  const normalizeGender = (g) => {
    if (!g) return undefined;
    const s = String(g).toLowerCase().trim().replace(/[-\s]+/g, "_");
    if (["male", "female", "non_binary", "transgender", "prefer_not_to_say", "other"].includes(s)) {
      return s;
    }
    return "other";
  };

  const parseHeightCm = (h) => {
    if (h === undefined || h === null || h === "") return undefined;
    if (typeof h === "number" && !isNaN(h)) return h >= 50 && h <= 260 ? Math.round(h) : undefined;
    const str = String(h).trim();
    const cmMatch = str.match(/(\d{2,3})\s*(?:cm)?/i);
    const ftMatch = str.match(/(\d+)\s*(?:'|ft)\s*(\d+)?/i);
    if (str.includes("cm") && cmMatch) {
      const val = parseInt(cmMatch[1], 10);
      return val >= 50 && val <= 260 ? val : undefined;
    }
    if (ftMatch) {
      const feet = parseInt(ftMatch[1], 10);
      const inches = ftMatch[2] ? parseInt(ftMatch[2], 10) : 0;
      const totalCm = Math.round(feet * 30.48 + inches * 2.54);
      return totalCm >= 50 && totalCm <= 260 ? totalCm : undefined;
    }
    if (cmMatch) {
      const val = parseInt(cmMatch[1], 10);
      return val >= 50 && val <= 260 ? val : undefined;
    }
    const num = parseFloat(str);
    return !isNaN(num) && num >= 50 && num <= 260 ? Math.round(num) : undefined;
  };

  const parseWeightKg = (w) => {
    if (w === undefined || w === null || w === "") return undefined;
    if (typeof w === "number" && !isNaN(w)) return w >= 20 && w <= 300 ? Math.round(w) : undefined;
    const str = String(w).trim();
    const match = str.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      const val = parseFloat(match[1]);
      return !isNaN(val) && val >= 20 && val <= 300 ? Math.round(val) : undefined;
    }
    return undefined;
  };

  const payload = {
    stageName: profile.stageName?.trim() || pers.stageName?.trim() || profile.name?.trim() || pers.fullName?.trim(),
    firstName: profile.firstName?.trim() || pers.firstName?.trim(),
    middleName: profile.middleName?.trim() || pers.middleName?.trim(),
    lastName: profile.lastName?.trim() || pers.lastName?.trim(),
    headline: profile.headline?.trim() || pers.headline?.trim() || undefined,
    bio: (() => {
      const raw = profile.bio?.trim() || pers.bio?.trim();
      if (!raw) return undefined;
      return raw.length > 1000 ? raw.slice(0, 1000) : raw;
    })(),
    profilePhoto: profile.profilePhoto || profile.avatar || pers.avatar || pers.profilePhoto,
    gender: normalizeGender(profile.gender || pers.gender),
    nationality: profile.nationality || pers.nationality || "Indian",
    careerStage: profile.careerStage || pers.careerStage || "aspiring",
    experienceRange: profile.experienceRange || pers.experienceRange || undefined,
    category: profile.category || pers.category || "open_talent",
    primaryProfession: profile.primaryProfession || pers.primaryRole || profile.profession || "Actor",
    secondaryProfessions: Array.isArray(profile.secondaryProfessions) ? profile.secondaryProfessions : (Array.isArray(pers.secondaryRoles) ? pers.secondaryRoles : []),
    primaryDepartment: profile.primaryDepartment || pers.department,
    primaryDesignation: profile.primaryDesignation || pers.designation,
    specializations: Array.isArray(profile.specializations) ? profile.specializations : [],
    secondaryDepartments: Array.isArray(profile.secondaryDepartments) ? profile.secondaryDepartments : [],
    currentCity: profile.currentCity || pers.currentCity || pers.city || profile.city,
    currentState: profile.currentState || pers.currentState || pers.state || profile.state,
    country: profile.country || pers.country || "India",
    workingCities: Array.isArray(profile.workingCities) ? profile.workingCities : (Array.isArray(pers.workingCities) ? pers.workingCities : []),
    willingToTravel: profile.willingToTravel !== undefined ? Boolean(profile.willingToTravel) : (pers.willingToTravel !== undefined ? Boolean(pers.willingToTravel) : true),
    willingToRelocate: Boolean(profile.willingToRelocate !== undefined ? profile.willingToRelocate : pers.willingToRelocate),
    openToWorkAnywhere: profile.openToWorkAnywhere !== undefined ? Boolean(profile.openToWorkAnywhere) : (pers.openToWorkAnywhere !== undefined ? Boolean(pers.openToWorkAnywhere) : undefined),
    remoteMode: profile.remoteMode || pers.remoteMode || undefined,
    passportAvailable: Boolean(profile.passportAvailable !== undefined ? profile.passportAvailable : pers.passportAvailable),
  };

  if (profile.availability && typeof profile.availability === "object") {
    payload.availability = {
      status: profile.availability.status || "available_now",
    };
  }

  const rawDob = profile.dob || pers.dob;
  if (rawDob) {
    const d = new Date(rawDob);
    if (!isNaN(d.getTime())) {
      payload.dob = d;
    }
  }

  // Format skills
  const rawSkills = profile.skills || pers.skills;
  if (Array.isArray(rawSkills)) {
    payload.skills = rawSkills
      .map((s) => {
        if (typeof s === "string") return s.trim() ? { name: s.trim(), proficiency: "intermediate" } : null;
        if (s?.name) return { name: s.name.trim(), proficiency: s.proficiency || "intermediate" };
        return null;
      })
      .filter(Boolean);
  }

  // Format languages
  const rawLangs = profile.languages || pers.languages;
  if (Array.isArray(rawLangs)) {
    payload.languages = rawLangs
      .map((l) => {
        if (typeof l === "string") return l.trim() ? { language: l.trim(), proficiency: "conversational" } : null;
        if (l?.language) return { language: l.language.trim(), proficiency: l.proficiency || "conversational" };
        return null;
      })
      .filter(Boolean);
  }

  // Format credits / experience
  const rawCredits = Array.isArray(profile.credits) && profile.credits.length > 0
    ? profile.credits
    : (Array.isArray(profile.experience) ? profile.experience : []);

  if (rawCredits.length > 0) {
    payload.credits = rawCredits
      .map((c) => {
        const projectTitle = (c.projectTitle || c.project || "").trim();
        if (!projectTitle) return null;
        const item = {
          projectTitle,
          projectType: c.projectType || "other",
          projectStatus: c.projectStatus || "completed",
          roleOrDesignation: (c.roleOrDesignation || c.role || "").trim() || undefined,
          directorOrProduction: (c.directorOrProduction || c.production || "").trim() || undefined,
          year: c.year ? Number(c.year) : undefined,
          characterName: (c.characterName || c.role || "").trim() || undefined,
          referenceLink: (c.referenceLink || "").trim() || undefined,
          isVerifiedCredit: Boolean(c.isVerifiedCredit),
          verificationStatus: c.verificationStatus || (c.isVerifiedCredit ? "verified" : "pending"),
        };
        if (c._id && /^[0-9a-fA-F]{24}$/.test(String(c._id))) {
          item._id = String(c._id);
        }
        return item;
      })
      .filter(Boolean);
  }

  // Format training
  const rawTraining = Array.isArray(profile.training) ? profile.training : [];
  if (rawTraining.length > 0) {
    payload.training = rawTraining
      .map((t) => {
        const institution = (t.institution || t.institute || "").trim();
        const courseName = (t.courseName || t.course || "").trim();
        if (!institution && !courseName) return null;
        const item = {
          institution: institution || "Self-Trained / Independent",
          courseName: courseName || "Performing Arts",
          mentor: (t.mentor || "").trim() || undefined,
          yearCompleted: t.yearCompleted ? Number(t.yearCompleted) : (t.year ? Number(t.year) : undefined),
        };
        if (t._id && /^[0-9a-fA-F]{24}$/.test(String(t._id))) {
          item._id = String(t._id);
        }
        return item;
      })
      .filter(Boolean);
  }

  // Format awards
  const rawAwards = Array.isArray(profile.awards) ? profile.awards : [];
  if (rawAwards.length > 0) {
    payload.awards = rawAwards
      .map((a) => {
        const title = (a.title || "").trim();
        if (!title) return null;
        const item = {
          title,
          organization: (a.organization || "").trim() || undefined,
          year: a.year ? Number(a.year) : undefined,
          category: (a.category || "").trim() || undefined,
        };
        if (a._id && /^[0-9a-fA-F]{24}$/.test(String(a._id))) {
          item._id = String(a._id);
        }
        return item;
      })
      .filter(Boolean);
  }

  // Format portfolio
  payload.portfolio = {
    photos: Array.isArray(profile.portfolio?.photos) ? profile.portfolio.photos : (Array.isArray(profile.photos) ? profile.photos : []),
    videos: Array.isArray(profile.portfolio?.videos) ? profile.portfolio.videos : (Array.isArray(profile.videos) ? profile.videos : []),
    showreelUrl: profile.portfolio?.showreelUrl || profile.showreel || "",
  };

  // Format physical attributes
  const heightVal = parseHeightCm(phys.heightCm || phys.height);
  const weightVal = parseWeightKg(phys.weightKg || phys.weight);

  payload.physicalAttributes = {
    heightCm: heightVal,
    weightKg: weightVal,
    bodyType: phys.bodyType?.trim() || undefined,
    skinTone: phys.skinTone?.trim() || undefined,
    eyeColor: phys.eyeColor?.trim() || undefined,
    hairColor: phys.hairColor?.trim() || undefined,
  };

  // Format guardian details
  const rawGuardian = profile.guardianDetails || profile.guardianConsent;
  if (rawGuardian && typeof rawGuardian === "object") {
    payload.guardianDetails = {
      guardianName: (rawGuardian.guardianName || "").trim(),
      relationship: (rawGuardian.relationship || rawGuardian.relation || "").trim(),
      contactNumber: (rawGuardian.contactNumber || rawGuardian.guardianPhone || rawGuardian.phone || "").trim(),
      guardianEmail: (rawGuardian.guardianEmail || rawGuardian.email || "").trim(),
      consentGiven: Boolean(rawGuardian.consentGiven),
    };
  }

  if (profile.remunerationExpectation || profile.remuneration) {
    payload.remunerationExpectation = profile.remunerationExpectation || profile.remuneration;
  }

  // Clean undefined keys
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
}

export default {
  fromApi,
  toApi,
};
