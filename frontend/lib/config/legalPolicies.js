/**
 * Vismaya Legal Policies & Specifications (v2.0 - October 2026)
 * Source of truth: Vismaya Final Master Website Specification v2.0
 * Status: PUBLISHED_PENDING_FINAL_LEGAL_COUNSEL
 */

export const LEGAL_METADATA = {
  version: "2.0",
  lastUpdated: "October 2026",
  effectiveDate: "October 15, 2026",
  jurisdiction: "Mumbai, Maharashtra, India",
  governingLaw: "Information Technology Act, 2000 & Digital Personal Data Protection Act, 2023",
  supportEmail: "support@vismaya.com",
  privacyEmail: "privacy@vismaya.com",
  legalEmail: "legal@vismaya.com",
  statusNote: "Notice: This document reflects platform architecture and operating rules approved in Vismaya Master Specification v2.0. Formal statutory drafting remains subject to ongoing legal counsel review."
};

export const PRIVACY_POLICY_SECTIONS = [
  {
    id: "introduction",
    title: "1. Introduction & Scope",
    content: `
Vismaya Creative Studios ("Vismaya", "we", "us", or "our") operates a verified casting and talent management ecosystem connecting entertainment artists, casting directors, and accredited production houses across India.

This Privacy Policy explains how we collect, verify, store, process, and safeguard your personal data when you use the Vismaya web platform, casting dashboards, audition relay systems, and verification services.

**Scope of Policy:** This policy applies to all registered Talent members, Industry Organization users, Admin personnel, and visitors browsing public listings. By creating an account or accessing the platform, you acknowledge the data practices described in this document.
    `
  },
  {
    id: "information-we-collect",
    title: "2. Information We Collect",
    content: `
We collect only the information strictly necessary to provide authentic casting opportunities, fraud-resistant KYC verifications, and professional talent discovery:

* **Account Credentials:** Full name, primary email address, mobile number (+91 Indian standard), password hash, and account creation timestamp.
* **Identity Verification Data:** Date of birth, age/age-range classification, government identity documents (Aadhaar, Passport, Driving License, Voter ID, or PAN), and live selfie/photograph evidence.
* **Professional Talent Data:** Primary profession, secondary designations, career stage (Aspiring, Early Career, Professional, Established), headline, professional bio, languages, performance skills, past credits, and awards.
* **Portfolio & Audition Assets:** Verified headshots, showreels, audio voice-demos, audition self-tape video submissions, and monologue recordings.
* **Industry Organization Information:** Official production house name, legal registered entity name, responsible authorized person's name & designation, registered office location, and official business website.
* **Compliance Documents:** Corporate identification (CIN/LLPIN/Trade License), GST registration certificate (or statutory exemption documentation), and authorized signatory proof.
* **Applications & Casting Records:** Opportunity submissions, role preferences, custom screening question answers, audition relay milestones, and selection notifications.
* **Billing & Transaction References:** Order IDs, digital payment references, payment timestamps, credit ledger logs, and digital GST invoices. (Note: Vismaya never stores raw payment card numbers or bank credentials; all transactions are processed via certified RBI-compliant payment gateways).
    `
  },
  {
    id: "how-we-use-information",
    title: "3. How We Use Information",
    content: `
Information collected by Vismaya is processed exclusively for platform casting operations:

* **Authentication & Role Authorization:** Providing secure session management, two-factor verification, and role-based access control.
* **Profile Building & Talent Discovery:** Displaying authorized professional comp-cards, verified credits, and showreels to accredited casting professionals.
* **Identity & Professional Verification (KYC):** Rigorous anti-fraud vetting to award independent 'Identity Verified' and 'Professional Verified' trust badges.
* **Industry Organization Vetting:** Ensuring casting opportunities originate only from legitimate, accredited production houses and casting directors.
* **Application & Audition Relay Workflows:** Mediating submissions, scripts, self-tape auditions, and callback scheduling strictly through platform channels.
* **Credit Ledger & Commercial Management:** Administering the 100 included profile-view credits, 25-pack bundles, and enforcing the 7-day repeat view exemption window.
* **Platform Security & Moderation:** Automated rate limiting, IP abuse detection, copyright dispute review, and permanent banning of fake profiles.
    `
  },
  {
    id: "profile-visibility-matrix",
    title: "4. Profile Visibility & Privacy Rules",
    content: `
Vismaya enforces a strict visibility matrix designed to eliminate unauthorized solicitation, harassment, and off-platform disintermediation:

* **Contact Information Protection:** Direct phone numbers and personal email addresses are NEVER displayed to Industry recruiters or other talent. All scheduling, contracting inquiries, and callbacks are routed through Vismaya Casting Desk.
* **Private Remuneration & Financials:** Quoted fees, budget terms, and compensation histories remain strictly confidential between Vismaya Desk and the artist.
* **Private Physical Attributes:** Private physical attributes and sensitive biometric measurements are never broadcasted or surfaced publicly.
* **Private Application History:** An artist's application history, opportunities applied to, and audition attempts are confidential to that artist and Vismaya Admin. Other organizations cannot see which jobs a talent has applied for.
* **Asymmetric Viewer Privacy:** Talent users cannot see which specific Industry organizations have viewed or shortlisted their profile.
* **Confidential Verification Documents:** Government IDs, GST certificates, and business registration files are strictly confidential and accessible solely to authorized Vismaya Compliance Officers.
* **Private Project Shortlists:** An organization's private talent shortlists and bookmarks are isolated to that organization's account.
    `
  },
  {
    id: "document-security",
    title: "5. Document & Data Security",
    content: `
Verification documents and media assets are protected through multi-layered defensive controls:

* **Encrypted Storage:** Identity and corporate compliance documents are stored in private cloud object stores with TLS 1.3 transit encryption and AES-256 server-side encryption.
* **Zero Public Document URLs:** Verification proofs are never placed in public web directories. Access requires authenticated, role-verified API signatures.
* **Strict Least-Privilege Access:** Only authenticated Super Admins and Compliance Officers can inspect verification dossiers. Cross-tenant and cross-role document snooping is programmatically blocked.
* **Audit Trails:** Every admin review, document access event, and approval decision generates an immutable record in our Audit Log database.
    `
  },
  {
    id: "data-sharing",
    title: "6. Data Sharing & Third Parties",
    content: `
Vismaya maintains a strict anti-brokerage data policy:

* **No Data Selling:** We do not sell, rent, or trade your personal data to marketing brokers, third-party advertisers, or external lead databases.
* **Certified Gateway Processors:** Payment transactions are securely relayed to our RBI-regulated payment gateway partners (Cashfree / Razorpay) for transaction execution and digital tax invoicing.
* **Legal Compliance:** We disclose data only when legally mandated by a valid court order, statutory law enforcement warrant, or governmental regulatory directive under Indian jurisdiction.
    `
  },
  {
    id: "data-retention",
    title: "7. Data Retention Policy",
    content: `
We maintain active profile records as long as your account remains active on the Vismaya platform:

* **Active Profiles:** Talent profiles, portfolio media, and organization projects are retained while the user account is in good standing.
* **KYC Documents:** Government ID proofs and business verification files are retained for the duration of the account plus statutory limitation periods required by Indian compliance laws.
* **Pending Legal Policy Value:** Specific archiving schedules for withdrawn applications and inactive profiles remain under final corporate review (*Status: Retention schedule pending final statutory approval by legal counsel*).
    `
  },
  {
    id: "user-rights",
    title: "8. User Rights & Account Controls",
    content: `
Registered users have granular control over their profile data:

* **Profile & Portfolio Editing:** Edit your stage name, bio, skills, languages, working cities, and media items at any time through the dashboard.
* **Email Address Updates:** Request an email address change with mandatory OTP verification to both old and new addresses to prevent account takeover.
* **Account Deletion Request:** Request complete account deletion directly in Settings. Deletion requires mandatory OTP confirmation to prevent accidental loss.
* **No Temporary Deactivation:** In accordance with platform integrity rules, accounts are either active or permanently closed upon verified deletion request.
    `
  },
  {
    id: "cookies-analytics",
    title: "9. Cookies & Tracking Technologies",
    content: `
Vismaya utilizes only essential and performance-focused technologies:

* **Essential Session Cookies:** Secure HTTP-only cookies used strictly to maintain your authenticated login session and CSRF security tokens.
* **No Third-Party Ad Trackers:** We do not deploy behavioral ad-tracking pixels or cross-site commercial remarketing networks.
* **Aggregated Performance Metrics:** Internal platform analytics measure page load latencies, audition video delivery health, and error rates to maintain high uptime.
    `
  },
  {
    id: "policy-updates",
    title: "10. Policy Updates & Versioning",
    content: `
* **Current Policy Version:** Version 2.0 (Master Release, October 2026).
* **Notification of Changes:** When substantial amendments are published, active users will receive an in-app alert or dashboard notification.
* **Version History:** Previous revisions are archived in Vismaya's compliance registry for auditing and dispute reference.
    `
  },
  {
    id: "contact-support",
    title: "11. Contact & Grievance Redressal",
    content: `
For inquiries regarding your privacy, data correction requests, or KYC compliance queries:

* **Privacy & Grievance Officer:** Vismaya Creative Studios Grievance Desk
* **Official Email:** [privacy@vismaya.com](mailto:privacy@vismaya.com)
* **General Support:** [support@vismaya.com](mailto:support@vismaya.com)
* **Registered Address:** Vismaya Creative Studios, Bandra West, Mumbai, Maharashtra 400050, India.
* **WhatsApp Helpdesk:** Accessible directly from your authenticated dashboard help drawer.
    `
  }
];

export const TERMS_AND_CONDITIONS_SECTIONS = [
  {
    id: "introduction-and-agreement",
    title: "1. Introduction & Agreement",
    content: `
Welcome to Vismaya Creative Studios ("Vismaya"). By accessing, registering on, or using our platform, mobile interfaces, or audition workflows, you enter into a legally binding agreement governed by these Terms & Conditions and our Community Guidelines.

If you do not agree to these terms in their entirety, you must immediately discontinue using the Vismaya platform.
    `
  },
  {
    id: "definitions",
    title: "2. Definitions",
    content: `
* **"Talent" / "Artist":** An individual actor, performer, model, voiceover artist, or crew professional registered to find casting opportunities.
* **"Industry Organization" / "Recruiter":** An accredited production house, film studio, casting director, advertising agency, or digital media company registered to cast talent.
* **"Opportunity" / "Casting Call":** A verified casting brief created by an Industry Organization and approved by Vismaya Admin.
* **"Application":** A structured candidate submission for a published casting role.
* **"Profile-View Credit":** A commercial entitlement unit allowing an Industry Organization to unlock an artist's full portfolio and showreels.
* **"Vismaya Desk":** The centralized moderation, compliance, and scheduling authority overseeing all platform interactions.
    `
  },
  {
    id: "eligibility-and-registration",
    title: "3. Eligibility & Account Registration",
    content: `
* **Age Eligibility:** Users must be at least 18 years of age to register independently. Minor artists (under 18) may only register through a designated parent or legal guardian with verified consent.
* **One Account Per User:** Duplicate accounts or creating shell profiles to bypass restrictions is strictly prohibited.
* **Accredited Organizations:** Industry accounts require valid corporate registration (CIN, GSTIN, LLPIN, or Trade License) and are subject to mandatory manual compliance vetting.
    `
  },
  {
    id: "account-security",
    title: "4. Account Security & Responsibilities",
    content: `
* You are solely responsible for maintaining the confidentiality of your login credentials and two-factor authentication.
* You agree to notify Vismaya immediately at [support@vismaya.com](mailto:support@vismaya.com) upon suspecting any unauthorized access.
* Sharing or transferring accounts between different production houses or artists is strictly prohibited.
    `
  },
  {
    id: "accurate-information",
    title: "5. Accurate Information & Identity Integrity",
    content: `
* All details provided during registration and profile creation must be authentic, truthful, and up-to-date.
* Misrepresenting your age, government identity, union status, or physical identity constitutes a material breach and will result in an immediate permanent ban.
    `
  },
  {
    id: "talent-account-rules",
    title: "6. Talent Account Rules",
    content: `
* Talent accounts are intended exclusively for genuine artists seeking professional casting engagements.
* Talent may upload headshots, showreels, voice clips, and past work credits that they own or have the explicit legal right to display.
* Talent may not solicit Industry recruiters for services, loans, or off-platform direct payments.
    `
  },
  {
    id: "industry-account-rules",
    title: "7. Industry Organization Account Rules",
    content: `
* Industry accounts are provided solely for legitimate casting, auditioning, and hiring purposes.
* Organizations may not use the Vismaya database to harvest contact lists, market unverified workshops, or solicit audition fees from artists.
* All opportunities submitted must have real, budgeted, and authorized production backing.
    `
  },
  {
    id: "profile-and-verification",
    title: "8. Profile Creation & KYC Verification",
    content: `
* **Identity Verification:** Validated through government ID and selfie review. Grants the 'Identity Verified' badge.
* **Professional Verification:** Validated through verified past screen credits, IMDb entries, or guild proof. Grants the 'Professional Verified' badge.
* **Aspiring Talent Rule:** Aspiring artists without verified past credits are not eligible for Professional Verified status until credits are documented.
* **Organization Verification:** Requires company registration, GST documentation, and authorized signatory review before casting briefs can be published.
    `
  },
  {
    id: "payments-and-fees",
    title: "9. Payments, Fees & Commercial Structure",
    content: `
Vismaya operates on a transparent, one-time flat registration and credit model:

* **Talent Registration Fee:** ₹999 one-time (inclusive of GST).
* **Industry Organization Registration Fee:** ₹4,999 one-time (inclusive of GST), which includes **100 profile-view credits**.
* **Currency:** All payments are billed and collected in Indian Rupees (INR).
* **Strict No-Refund Policy:** Registration fees and credit purchases are 100% non-refundable once access or credit entitlement is granted.
* **No Subscriptions / No Auto-Renewal:** Vismaya does not operate recurring subscription traps or automated card rebilling.
    `
  },
  {
    id: "profile-view-credit-system",
    title: "10. Profile-View Credit System",
    content: `
* **Included Credits:** Industry registration includes 100 profile-view credits.
* **Top-Up Pricing:**
  * Single Profile View: ₹100
  * 25-View Bundle Pack: ₹2,000
* **Consumption Rules:**
  * Search result listings and limited profile previews are 100% free.
  * Opening a full candidate profile (full showreels, high-res comp cards, and past credits) consumes exactly 1 credit.
  * **7-Day Repeat View Exemption Window:** Reopening the same artist's profile within 7 days consumes 0 credits.
  * Credits never expire while the account remains active and in good standing.
  * Credits are non-transferable between organizations and are forfeited upon account deletion.
    `
  },
  {
    id: "talent-discovery-and-access",
    title: "11. Talent Discovery & Profile Access",
    content: `
* Organizations may browse and filter artists based on primary skills, languages, working cities, and verified credentials.
* Unlocking a profile grants viewing access to approved portfolio assets but does not provide direct private phone or email contact details.
    `
  },
  {
    id: "opportunities-and-applications",
    title: "12. Opportunities & Applications Workflow",
    content: `
* **Mandatory Admin Review:** Every opportunity brief must be reviewed and approved by Vismaya Admin prior to public release.
* **No Post-Submission Edits:** Talent applications cannot be edited after submission to protect audition integrity.
* **Application Withdrawal:** Talent may withdraw an application at any time with a stated reason.
* **Reapplication Rule:** Once an application is withdrawn or closed, reapplication for the same role requires explicit Admin approval.
    `
  },
  {
    id: "shortlisting-and-selection",
    title: "13. Shortlisting & Selection",
    content: `
* Organizations may organize private candidate shortlists for each project. Shortlisting does not trigger premature applicant alerts.
* Final role selections must be executed through the platform to initiate official escrow contracts and casting confirmations.
    `
  },
  {
    id: "auditions-and-selftapes",
    title: "14. Auditions & Self-Tape Submissions",
    content: `
* Audition requests (self-tapes, monologues, virtual callbacks) are submitted through Vismaya.
* Self-tape videos submitted by talent are vetted by Vismaya Casting Desk before relay to the casting director to ensure compliance and technical quality.
* Talent retains performance copyright; Industry users are granted a limited review license strictly for casting consideration for the specified role.
    `
  },
  {
    id: "portfolio-intellectual-property",
    title: "15. Portfolio Content & Intellectual Property",
    content: `
* You retain all ownership rights in the photographs, showreels, and audio recordings you upload to Vismaya.
* By uploading media, you grant Vismaya a non-exclusive, worldwide, royalty-free license to host, transcode, and display the assets strictly for platform casting services.
    `
  },
  {
    id: "copyright-disputes",
    title: "16. Copyright Disputes & DMCA Compliance",
    content: `
* Uploading content that infringes upon third-party copyrights, unauthorized production stills, or uncredited footage is strictly prohibited.
* Valid copyright infringement notices will result in the immediate temporary hiding of the disputed asset pending investigation.
* Repeat infringement will result in permanent account termination.
    `
  },
  {
    id: "community-guidelines",
    title: "17. Community Guidelines",
    content: `
All members must adhere to Vismaya's core community standards:

* **Professional Respect:** Zero tolerance for abusive language, hate speech, discrimination, or offensive communications.
* **Authenticity:** No fake credits, misattributed filmography, stolen headshots, or deepfake audition materials.
* **Casting Integrity:** No requests for fees, gifts, or inappropriate personal meetings outside verified studio casting environments.
    `
  },
  {
    id: "prohibited-activities",
    title: "18. Prohibited Activities & Platform Misuse",
    content: `
You agree not to:
* Attempt to reverse-engineer, scrape, or extract platform artist databases via automated scripts or AI harvesters.
* Solicit direct private contact numbers or attempt to bypass Vismaya's supervised audition relay workflows.
* Impersonate any casting director, production company, or fellow artist.
    `
  },
  {
    id: "moderation-and-suspension",
    title: "19. Moderation, Restrictions & Account Suspension",
    content: `
* Vismaya reserves the right to moderate all submissions, temporarily restrict reported accounts, or permanently suspend users who violate platform terms.
* Suspended organizations immediately forfeit profile-view privileges and credit balances.
    `
  },
  {
    id: "account-deletion",
    title: "20. Account Deletion",
    content: `
* Users may request permanent account deletion via Settings with mandatory OTP authorization.
* Upon deletion, profile comp cards, showreels, and active applications are permanently purged. Transaction audit logs are retained as mandated by Indian accounting regulations.
    `
  },
  {
    id: "no-direct-communication-outside",
    title: "21. No Direct Communication Outside Supported Workflows",
    content: `
* To protect artists from fraudulent casting scams and ensure auditability, direct unmediated communication between recruiters and artists outside Vismaya workflows is prohibited.
* All casting scheduling, audition instructions, and callback communications must be conducted through Vismaya Desk.
    `
  },
  {
    id: "platform-availability",
    title: "22. Platform Availability & Limitations",
    content: `
* While we strive for 99.9% service uptime, Vismaya provides its services on an "AS IS" and "AS AVAILABLE" basis without warranties of uninterrupted availability.
* Scheduled maintenance windows and emergency infrastructure updates will be announced via system banners.
    `
  },
  {
    id: "liability-and-disclaimers",
    title: "23. Liability & Disclaimers",
    content: `
* Vismaya is a casting facilitation and verification platform. We do not guarantee employment, casting selection, or career outcomes for any talent.
* Vismaya is not liable for indirect, punitive, or consequential damages resulting from user disputes, third-party network outages, or unauthorized third-party conduct.
    `
  },
  {
    id: "policy-changes",
    title: "24. Policy Changes & Updates",
    content: `
* We reserve the right to modify these Terms to reflect operational, legal, or regulatory updates.
* Continued use of Vismaya following notification of changes constitutes binding acceptance of the updated Terms.
    `
  },
  {
    id: "governing-law-and-jurisdiction",
    title: "25. Governing Law & Jurisdiction",
    content: `
These Terms & Conditions are governed by and construed in accordance with the laws of the Republic of India. Any disputes arising from or related to the platform shall be subject to the exclusive jurisdiction of the competent courts in **Mumbai, Maharashtra, India**.
    `
  },
  {
    id: "legal-contact",
    title: "26. Legal Contact & Grievances",
    content: `
For legal correspondence, contractual queries, or official notices:

* **Legal Counsel Desk:** Vismaya Creative Studios Legal Division
* **Official Email:** [legal@vismaya.com](mailto:legal@vismaya.com)
* **Grievance Officer:** [privacy@vismaya.com](mailto:privacy@vismaya.com)
* **Registered Address:** Vismaya Creative Studios, Bandra West, Mumbai, Maharashtra 400050, India.
    `
  }
];
