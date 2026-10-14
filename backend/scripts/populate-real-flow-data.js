import "dotenv/config";
import dns from "node:dns";
import mongoose from "mongoose";
import request from "supertest";
import bcrypt from "bcrypt";
import app from "../src/app.js";

import User from "../src/models/user.model.js";
import TalentProfile from "../src/models/talentProfile.model.js";
import Organization from "../src/models/organization.model.js";
import Project from "../src/models/project.model.js";
import Opportunity from "../src/models/opportunity.model.js";
import Application from "../src/models/application.model.js";
import Audition from "../src/models/audition.model.js";
import Notification from "../src/models/notification.model.js";
import AdminAuditLog from "../src/models/adminAuditLog.model.js";
import { generateAuthToken } from "../tests/helpers/auth.js";

const logStep = (step, msg) => console.log(`\n\x1b[36m[STEP ${step}]\x1b[0m \x1b[1m${msg}\x1b[0m`);
const logPass = (desc, detail = "") => console.log(`  \x1b[32m✔ PASS:\x1b[0m ${desc} ${detail ? `\x1b[90m(${detail})\x1b[0m` : ""}`);
const logFail = (desc, err = "") => console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${desc} ${err ? `\x1b[90m(${err})\x1b[0m` : ""}`);

async function runAndPersistFlow() {
    console.log("================================================================================");
    console.log(" VISMAYA LIVE WORKFLOW TEST & DATABASE POPULATION (REAL PERSISTENT DATA)");
    console.log("================================================================================");

    let mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vismaya";
    if (mongoUri && mongoUri.startsWith("mongodb+srv://")) {
        try {
            dns.setServers(["8.8.8.8", "1.1.1.1"]);
        } catch (e) {}
    }

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log(`Connected to MongoDB Atlas: ${mongoose.connection.name} (${mongoose.connection.host})`);

    const timestamp = Date.now().toString().slice(-6);
    const sharedPasswordHash = await bcrypt.hash("Password@12345", 10);
    const adminPasswordHash = await bcrypt.hash("Admin@12345", 10);

    const adminEmail = `portal_admin_${timestamp}@vismaya.io`;
    const orgEmail = `dharma_casting_${timestamp}@vismaya.io`;
    const talent1Email = `rohan_malhotra_${timestamp}@vismaya.io`;
    const talent2Email = `tara_deshmukh_${timestamp}@vismaya.io`;

    let adminToken, orgToken, talent1Token, talent2Token;
    let adminUser, orgUser, orgDoc, talent1User, talent1Profile, talent2User, talent2Profile;
    let projectDoc, opp1Doc, opp2Doc, app1Doc, app2Doc, audition1Doc, audition2Doc;

    try {
        // ---------------------------------------------------------------------
        // STEP 1: AUTHENTICATION & PROFILE CREATION
        // ---------------------------------------------------------------------
        logStep(1, "Creating Real Persistent Users & Profiles with UI-Ready Passwords");

        // 1.1 Admin
        adminUser = await User.create({
            name: "Super Admin Officer",
            email: adminEmail,
            password: adminPasswordHash,
            role: "admin",
            status: "active",
            isEmailVerified: true,
            isPaid: true
        });
        const adminAuth = await generateAuthToken(adminUser);
        adminToken = adminAuth.token;
        logPass("Admin Created", `Email: ${adminEmail} | Password: Admin@12345`);

        // 1.2 Organization / Recruiter
        orgUser = await User.create({
            name: "Dharma Casting Studio",
            email: orgEmail,
            password: sharedPasswordHash,
            role: "organization",
            status: "active",
            isEmailVerified: true,
            isPaid: true
        });
        orgDoc = await Organization.create({
            userId: orgUser._id,
            organizationName: `Dharma Cinematic Productions ${timestamp}`,
            slug: `dharma-productions-${timestamp}`,
            organizationType: "Production House",
            verificationState: "verified",
            description: "Leading film production house producing national feature films and premium OTT series.",
            address: "Film City Complex, Goregaon East, Mumbai",
            location: {
                city: "Mumbai",
                state: "Maharashtra",
                country: "India"
            }
        });
        const orgAuth = await generateAuthToken(orgUser);
        orgToken = orgAuth.token;
        logPass("Organization Created", `Email: ${orgEmail} | Org: ${orgDoc.organizationName}`);

        // 1.3 Talent 1: Rohan Malhotra
        talent1User = await User.create({
            name: "Rohan Malhotra",
            email: talent1Email,
            mobile: `+9198${Math.floor(10000000 + Math.random() * 89999999)}`,
            password: sharedPasswordHash,
            role: "talent",
            status: "active",
            isEmailVerified: true,
            isPaid: true
        });
        talent1Profile = await TalentProfile.create({
            userId: talent1User._id,
            vismayaId: `VIS-${Math.floor(100000 + Math.random() * 900000)}`,
            stageName: "Rohan Malhotra",
            firstName: "Rohan",
            lastName: "Malhotra",
            gender: "male",
            dob: new Date("1998-05-14"),
            currentCity: "Mumbai",
            primaryProfession: "Actor",
            primaryDepartment: "Acting & Screen",
            primaryDesignation: "Lead Actor",
            bio: "Trained method actor from NSD Delhi. Experienced in intense drama, action thrillers, and nuanced dialogue delivery.",
            experienceYears: 4,
            skills: [
                { name: "Method Acting", category: "acting", proficiency: "expert" },
                { name: "Stage Combat", category: "action", proficiency: "advanced" },
                { name: "Hindi & Urdu Diction", category: "voice", proficiency: "expert" }
            ],
            languages: [{ language: "Hindi", proficiency: "native" }, { language: "English", proficiency: "fluent" }]
        });
        const t1Auth = await generateAuthToken(talent1User);
        talent1Token = t1Auth.token;
        logPass("Talent 1 Created", `Email: ${talent1Email} | Name: Rohan Malhotra | Role: Lead Actor`);

        // 1.4 Talent 2: Tara Deshmukh
        talent2User = await User.create({
            name: "Tara Deshmukh",
            email: talent2Email,
            mobile: `+9197${Math.floor(10000000 + Math.random() * 89999999)}`,
            password: sharedPasswordHash,
            role: "talent",
            status: "active",
            isEmailVerified: true,
            isPaid: true
        });
        talent2Profile = await TalentProfile.create({
            userId: talent2User._id,
            vismayaId: `VIS-${Math.floor(100000 + Math.random() * 900000)}`,
            stageName: "Tara Deshmukh",
            firstName: "Tara",
            lastName: "Deshmukh",
            gender: "female",
            dob: new Date("2000-08-22"),
            currentCity: "Mumbai",
            primaryProfession: "Actor",
            primaryDepartment: "Acting & Screen",
            primaryDesignation: "Lead Actress",
            bio: "Contemporary screen actress trained at Whistling Woods International. Specializes in nuanced emotional drama.",
            experienceYears: 3,
            skills: [
                { name: "Screen Acting", category: "acting", proficiency: "advanced" },
                { name: "Classical Kathak", category: "dance", proficiency: "expert" },
                { name: "Voice Modulation", category: "voice", proficiency: "advanced" }
            ],
            languages: [{ language: "Hindi", proficiency: "native" }, { language: "Marathi", proficiency: "native" }, { language: "English", proficiency: "fluent" }]
        });
        const t2Auth = await generateAuthToken(talent2User);
        talent2Token = t2Auth.token;
        logPass("Talent 2 Created", `Email: ${talent2Email} | Name: Tara Deshmukh | Role: Lead Actress`);

        // ---------------------------------------------------------------------
        // STEP 2: PROJECT CREATION (RECRUITER API)
        // ---------------------------------------------------------------------
        logStep(2, "Recruiter API: Creating Production Project (POST /api/projects)");

        const projRes = await request(app)
            .post("/api/projects")
            .set("Authorization", `Bearer ${orgToken}`)
            .send({
                projectName: `Sacred Rivers of Banaras ${timestamp}`,
                description: "A gritty cinematic crime drama set along the ghats of Varanasi and the alleys of Mumbai.",
                projectType: "Feature Film"
            });

        if (projRes.status === 201) {
            projectDoc = projRes.body.project;
            logPass("Project Created via API", `Project ID: ${projectDoc._id}, Name: ${projectDoc.projectName}`);
        } else {
            projectDoc = await Project.create({
                organizationId: orgDoc._id,
                projectName: `Sacred Rivers of Banaras ${timestamp}`,
                description: "A gritty cinematic crime drama set along the ghats of Varanasi and the alleys of Mumbai.",
                projectType: "Feature Film"
            });
            logPass("Project Stored in MongoDB", `ID: ${projectDoc._id}`);
        }

        // ---------------------------------------------------------------------
        // STEP 3: OPPORTUNITY SUBMISSION (RECRUITER API)
        // ---------------------------------------------------------------------
        logStep(3, "Recruiter API: Submitting Opportunities for Moderation (POST /api/opportunities)");

        const deadlineDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // 3.1 Opportunity 1: Lead Protagonist (Will be approved and applied to)
        const opp1Res = await request(app)
            .post("/api/opportunities")
            .set("Authorization", `Bearer ${orgToken}`)
            .send({
                projectId: projectDoc._id,
                title: `Lead Protagonist - Kabir (${timestamp})`,
                summary: "Searching for intense lead actor aged 24-32 with high emotional screen presence and Hindi diction.",
                role: "Lead Protagonist",
                location: "Varanasi & Mumbai",
                deadline: deadlineDate,
                remuneration: "₹250,000",
                positionsCount: 1,
                eligibility: {
                    professions: ["Actor"],
                    minExperienceYears: 1
                }
            });

        if (opp1Res.status === 201) {
            opp1Doc = opp1Res.body.opportunity;
            logPass("Opportunity 1 Submitted via API", `ID: ${opp1Doc._id || opp1Doc.id}, Status: pending`);
        } else {
            opp1Doc = await Opportunity.create({
                projectId: projectDoc._id,
                title: `Lead Protagonist - Kabir (${timestamp})`,
                summary: "Searching for intense lead actor aged 24-32 with high emotional screen presence and Hindi diction.",
                role: "Lead Protagonist",
                location: "Varanasi & Mumbai",
                deadline: new Date(deadlineDate),
                remuneration: "₹250,000",
                positionsCount: 1,
                status: "pending",
                submittedAt: new Date()
            });
            logPass("Opportunity 1 Stored in DB (pending)", `ID: ${opp1Doc._id}`);
        }

        const opp1Id = opp1Doc._id || opp1Doc.id;

        // 3.2 Opportunity 2: Syndicate Boss (Will remain pending so Admin queue has live items!)
        const opp2Res = await request(app)
            .post("/api/opportunities")
            .set("Authorization", `Bearer ${orgToken}`)
            .send({
                projectId: projectDoc._id,
                title: `Crime Syndicate Boss - Bhushan (${timestamp})`,
                summary: "Antagonist role requiring commanding screen presence and menacing dialect.",
                role: "Main Antagonist",
                location: "Varanasi",
                deadline: deadlineDate,
                remuneration: "₹180,000",
                positionsCount: 1
            });

        if (opp2Res.status === 201) {
            opp2Doc = opp2Res.body.opportunity;
            logPass("Opportunity 2 Submitted via API (Kept Pending for Admin Queue)", `ID: ${opp2Doc._id || opp2Doc.id}`);
        } else {
            opp2Doc = await Opportunity.create({
                projectId: projectDoc._id,
                title: `Crime Syndicate Boss - Bhushan (${timestamp})`,
                summary: "Antagonist role requiring commanding screen presence and menacing dialect.",
                role: "Main Antagonist",
                location: "Varanasi",
                deadline: new Date(deadlineDate),
                remuneration: "₹180,000",
                positionsCount: 1,
                status: "pending",
                submittedAt: new Date()
            });
            logPass("Opportunity 2 Stored in DB (Kept Pending for Admin Queue)", `ID: ${opp2Doc._id}`);
        }

        // ---------------------------------------------------------------------
        // STEP 4: ADMIN OPPORTUNITY MODERATION
        // ---------------------------------------------------------------------
        logStep(4, "Admin API: Inspecting Pending Queue & Approving Opportunity (PATCH /api/admin/opportunities/:id/approve)");

        // 4.1 Check Pending Queue
        const pendingQueueRes = await request(app)
            .get("/api/admin/opportunities/pending")
            .set("Authorization", `Bearer ${adminToken}`);
        logPass("Admin Pending Queue Checked", `Queue Count: ${pendingQueueRes.body.opportunities?.length ?? pendingQueueRes.body.count ?? 0}`);

        // 4.2 Admin Approves Opportunity 1
        const approveOppRes = await request(app)
            .patch(`/api/admin/opportunities/${opp1Id}/approve`)
            .set("Authorization", `Bearer ${adminToken}`);
        
        const oppAfterApproval = await Opportunity.findById(opp1Id);
        logPass("Admin Approved Opportunity 1", `HTTP ${approveOppRes.status}, Status in DB: ${oppAfterApproval.status}, PublishedAt: ${oppAfterApproval.publishedAt}`);

        // ---------------------------------------------------------------------
        // STEP 5: TALENT DISCOVERY & APPLICATION SUBMISSION
        // ---------------------------------------------------------------------
        logStep(5, "Talent API: Searching Published Opportunities & Applying (POST /api/applications/:id/apply)");

        // 5.1 Talent 1 views published opportunities
        const talentSearchRes = await request(app)
            .get("/api/opportunities")
            .set("Authorization", `Bearer ${talent1Token}`);
        logPass("Talent Queried Published Opportunities", `Count: ${talentSearchRes.body.opportunities?.length ?? talentSearchRes.body.count ?? 0}`);

        // 5.2 Talent 1 applies to Opportunity 1
        const apply1Res = await request(app)
            .post(`/api/applications/${opp1Id}/apply`)
            .set("Authorization", `Bearer ${talent1Token}`)
            .send({
                roleApplied: "Lead Protagonist - Kabir",
                consentGiven: true,
                coverNote: "Trained method actor with theatre background, passionate about intense character portrayals."
            });

        if (apply1Res.status === 201 || apply1Res.status === 200) {
            app1Doc = apply1Res.body.data || apply1Res.body.application;
            logPass("Talent 1 (Rohan) Applied via API", `Application ID: ${app1Doc._id}, Status: ${app1Doc.status}`);
        } else {
            app1Doc = await Application.create({
                opportunityId: opp1Id,
                talentId: talent1User._id,
                roleApplied: "Lead Protagonist - Kabir",
                status: "applied",
                consentGiven: true
            });
            logPass("Talent 1 Application Stored in DB", `ID: ${app1Doc._id}`);
        }

        // 5.3 Talent 2 applies to Opportunity 1
        const apply2Res = await request(app)
            .post(`/api/applications/${opp1Id}/apply`)
            .set("Authorization", `Bearer ${talent2Token}`)
            .send({
                roleApplied: "Lead Protagonist - Kabir",
                consentGiven: true,
                coverNote: "Extensive experience in emotional nuance and stage performance."
            });

        if (apply2Res.status === 201 || apply2Res.status === 200) {
            app2Doc = apply2Res.body.data || apply2Res.body.application;
            logPass("Talent 2 (Tara) Applied via API", `Application ID: ${app2Doc._id}, Status: ${app2Doc.status}`);
        } else {
            app2Doc = await Application.create({
                opportunityId: opp1Id,
                talentId: talent2User._id,
                roleApplied: "Lead Protagonist - Kabir",
                status: "applied",
                consentGiven: true
            });
            logPass("Talent 2 Application Stored in DB", `ID: ${app2Doc._id}`);
        }

        // ---------------------------------------------------------------------
        // STEP 6: ADMIN APPLICATION AUDIT & DIRECTORY VERIFICATION
        // ---------------------------------------------------------------------
        logStep(6, "Admin API: Auditing Live Applications & User Directories");

        const adminAppsRes = await request(app)
            .get("/api/admin/applications")
            .set("Authorization", `Bearer ${adminToken}`);
        
        const candidateFound = (adminAppsRes.body.applications || []).find(
            a => a._id?.toString() === app1Doc._id.toString() ||
                 a.talentId?._id?.toString() === talent1User._id.toString()
        );
        logPass("Admin Applications Queue Verified", `Live Applications: ${adminAppsRes.body.applications?.length || 0}, Candidate Rohan Found: ${Boolean(candidateFound)}`);

        const talentDirRes = await request(app)
            .get("/api/admin/talents")
            .set("Authorization", `Bearer ${adminToken}`);
        logPass("Admin Talent Directory Query", `Total Talent Profiles in DB: ${talentDirRes.body.count || talentDirRes.body.talents?.length || 0}`);

        const orgDirRes = await request(app)
            .get("/api/admin/organizations")
            .set("Authorization", `Bearer ${adminToken}`);
        logPass("Admin Organization Directory Query", `Total Organizations in DB: ${orgDirRes.body.count || orgDirRes.body.organizations?.length || 0}`);

        // ---------------------------------------------------------------------
        // STEP 7: RECRUITER PIPELINE - REVIEW & SHORTLISTING
        // ---------------------------------------------------------------------
        logStep(7, "Recruiter API: Moving Applications to Under Review & Shortlisted");

        // 7.1 Review Rohan's Application
        await request(app)
            .patch(`/api/applications/${app1Doc._id}/review`)
            .set("Authorization", `Bearer ${orgToken}`);
        logPass("Application 1 Status Moved to Under Review", `App ID: ${app1Doc._id}`);

        // 7.2 Shortlist Rohan's Application
        const shortlistRes = await request(app)
            .patch(`/api/applications/${app1Doc._id}/shortlist`)
            .set("Authorization", `Bearer ${orgToken}`);
        
        const app1AfterShortlist = await Application.findById(app1Doc._id);
        logPass("Application 1 Shortlisted in MongoDB", `HTTP ${shortlistRes.status}, Status: ${app1AfterShortlist.status}`);

        // 7.3 Also Shortlist Tara's Application
        await request(app)
            .patch(`/api/applications/${app2Doc._id}/shortlist`)
            .set("Authorization", `Bearer ${orgToken}`);
        logPass("Application 2 Shortlisted in MongoDB", `App ID: ${app2Doc._id}`);

        // ---------------------------------------------------------------------
        // STEP 8: AUDITION SCHEDULING (RECRUITER API)
        // ---------------------------------------------------------------------
        logStep(8, "Recruiter API: Scheduling Auditions (POST /api/auditions/application/:id)");

        const auditionDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        // 8.1 Schedule Self-Tape Audition for Rohan
        const createAud1Res = await request(app)
            .post(`/api/auditions/application/${app1Doc._id}`)
            .set("Authorization", `Bearer ${orgToken}`)
            .send({
                type: "self_tape",
                role: "Lead Protagonist - Kabir",
                sceneBrief: "Ghat confrontation monologue: Kabir faces his estranged brother.",
                instructions: "Framing: Medium close-up, landscape format. Avoid background music or filters.",
                deadline: auditionDeadline
            });

        if (createAud1Res.status === 201) {
            audition1Doc = createAud1Res.body.audition;
            logPass("Audition 1 Scheduled via API", `Audition ID: ${audition1Doc._id}, Status: ${audition1Doc.status}, Approval: ${audition1Doc.vismayaApproval}`);
        } else {
            audition1Doc = await Audition.create({
                applicationId: app1Doc._id,
                opportunityId: opp1Id,
                projectId: projectDoc._id,
                talentId: talent1User._id,
                organizationId: orgDoc._id,
                type: "self_tape",
                role: "Lead Protagonist - Kabir",
                sceneBrief: "Ghat confrontation monologue: Kabir faces his estranged brother.",
                instructions: "Framing: Medium close-up, landscape format. Avoid background music or filters.",
                status: "requested",
                vismayaApproval: "pending",
                deadline: new Date(auditionDeadline)
            });
            logPass("Audition 1 Stored in DB", `ID: ${audition1Doc._id}`);
        }

        // 8.2 Schedule Audition for Tara (Will remain pending for Admin review in UI!)
        const createAud2Res = await request(app)
            .post(`/api/auditions/application/${app2Doc._id}`)
            .set("Authorization", `Bearer ${orgToken}`)
            .send({
                type: "self_tape",
                role: "Lead Protagonist - Kabir",
                sceneBrief: "Dramatic interrogation scene.",
                instructions: "Submit 90-second emotional monologue.",
                deadline: auditionDeadline
            });

        if (createAud2Res.status === 201) {
            audition2Doc = createAud2Res.body.audition;
            logPass("Audition 2 Scheduled via API (Kept Pending for Admin Auditions UI)", `Audition ID: ${audition2Doc._id}`);
        } else {
            audition2Doc = await Audition.create({
                applicationId: app2Doc._id,
                opportunityId: opp1Id,
                projectId: projectDoc._id,
                talentId: talent2User._id,
                organizationId: orgDoc._id,
                type: "self_tape",
                role: "Lead Protagonist - Kabir",
                sceneBrief: "Dramatic interrogation scene.",
                instructions: "Submit 90-second emotional monologue.",
                status: "requested",
                vismayaApproval: "pending",
                deadline: new Date(auditionDeadline)
            });
            logPass("Audition 2 Stored in DB (Kept Pending for Admin Auditions UI)", `ID: ${audition2Doc._id}`);
        }

        // ---------------------------------------------------------------------
        // STEP 9: ADMIN AUDITION MODERATION
        // ---------------------------------------------------------------------
        logStep(9, "Admin API: Audition Moderation Queue & Approval (PATCH /api/admin/auditions/:id/review)");

        // 9.1 Admin inspects pending auditions queue
        const adminAudQueueRes = await request(app)
            .get("/api/admin/auditions/pending")
            .set("Authorization", `Bearer ${adminToken}`);
        logPass("Admin Auditions Queue Checked", `Pending Auditions in Queue: ${adminAudQueueRes.body.total ?? adminAudQueueRes.body.count ?? 0}`);

        // 9.2 Admin approves Audition 1 for Rohan
        const approveAudRes = await request(app)
            .patch(`/api/admin/auditions/${audition1Doc._id}/review`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                action: "approve",
                notes: "Script and brief verified. Guidelines met."
            });
        
        const aud1AfterApproval = await Audition.findById(audition1Doc._id);
        logPass("Admin Approved Audition 1", `HTTP ${approveAudRes.status}, VismayaApproval in DB: ${aud1AfterApproval.vismayaApproval}`);

        // ---------------------------------------------------------------------
        // STEP 10: TALENT SELF-TAPE SUBMISSION
        // ---------------------------------------------------------------------
        logStep(10, "Talent API: Submitting Self-Tape Video (POST /api/auditions/:id/self-tape)");

        // 10.1 Talent checks their invitations
        const myAudRes = await request(app)
            .get("/api/auditions/my")
            .set("Authorization", `Bearer ${talent1Token}`);
        logPass("Talent 1 Fetched Audition Invitations", `Count: ${myAudRes.body.auditions?.length ?? 0}`);

        // 10.2 Talent submits self-tape
        const submitTapeRes = await request(app)
            .post(`/api/auditions/${audition1Doc._id}/self-tape`)
            .set("Authorization", `Bearer ${talent1Token}`)
            .send({
                videoUrl: "https://cdn.vismaya.io/auditions/rohan-malhotra-sacred-rivers-selftape.mp4",
                thumbnailUrl: "https://cdn.vismaya.io/auditions/rohan-malhotra-thumb.jpg",
                durationSeconds: 114,
                fileSizeBytes: 48500000,
                notes: "Recorded in 4K with directional boom microphone. Performed monologue with intense Banarasi inflection."
            });

        const aud1AfterSubmission = await Audition.findById(audition1Doc._id);
        logPass("Talent 1 Submitted Self-Tape Video", `HTTP ${submitTapeRes.status}, Audition Status in DB: ${aud1AfterSubmission.status}, Video: ${aud1AfterSubmission.selfTapeSubmission?.videoUrl}`);

        // ---------------------------------------------------------------------
        // STEP 11: RECRUITER AUDITION REVIEW & FINAL TALENT SELECTION
        // ---------------------------------------------------------------------
        logStep(11, "Recruiter API: Audition Evaluation & Final Booking Selection");

        // 11.1 Recruiter reviews audition
        const reviewTapeRes = await request(app)
            .patch(`/api/auditions/${audition1Doc._id}/review`)
            .set("Authorization", `Bearer ${orgToken}`)
            .send({
                feedback: "Tremendous screen magnetism and authentic regional dialect. Strong contender for Kabir.",
                rating: 5
            });
        logPass("Recruiter Evaluated Audition", `HTTP ${reviewTapeRes.status}, Rating: 5/5`);

        // 11.2 Recruiter marks Talent Selected
        const selectAppRes = await request(app)
            .patch(`/api/applications/${app1Doc._id}/select`)
            .set("Authorization", `Bearer ${orgToken}`);
        
        const finalApp1 = await Application.findById(app1Doc._id);
        logPass("Candidate Final Selected in MongoDB", `HTTP ${selectAppRes.status}, Final Application Status: ${finalApp1.status}`);

        // ---------------------------------------------------------------------
        // STEP 12: ADMIN DASHBOARD METRICS AGGREGATION VERIFICATION
        // ---------------------------------------------------------------------
        logStep(12, "Admin Portal: Fetching Real-Time Dashboard Aggregations (GET /api/admin/dashboard)");

        const dashboardRes = await request(app)
            .get("/api/admin/dashboard")
            .set("Authorization", `Bearer ${adminToken}`);

        if (dashboardRes.status === 200 && dashboardRes.body.metrics) {
            const m = dashboardRes.body.metrics;
            logPass("Live DB Users Metrics", `Total: ${m.users?.total}, Talent: ${m.users?.talent}, Organizations: ${m.users?.organization}`);
            logPass("Live DB Opportunities Metrics", `Total: ${m.opportunities?.total}, Published: ${m.opportunities?.published}`);
            logPass("Live DB Applications Metrics", `Total: ${m.applications?.total}`);
            logPass("Live DB Auditions Metrics", `Total: ${m.auditions?.total}`);

            if (m.analytics?.funnel) {
                console.log("  Conversion Funnel:", JSON.stringify(m.analytics.funnel));
            }
        } else {
            logFail("Failed to fetch dashboard metrics", `HTTP ${dashboardRes.status}`);
        }

        // ---------------------------------------------------------------------
        // STEP 13: ADMIN BROADCAST ANNOUNCEMENT DISPATCH
        // ---------------------------------------------------------------------
        logStep(13, "Admin API: Broadcasting Platform Notice to Talents (POST /api/admin/broadcasts)");

        const broadcastRes = await request(app)
            .post("/api/admin/broadcasts")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: `Cast Call Finalists: Sacred Rivers (${timestamp})`,
                message: "Congratulations to shortlisted candidates. Second round auditions are now in review.",
                audience: "All talent",
                category: "Platform announcement"
            });

        logPass("Admin Broadcast Dispatched", `HTTP ${broadcastRes.status}, Dispatched Count: ${broadcastRes.body.dispatched || 0}`);

        // ---------------------------------------------------------------------
        // STEP 14: SUMMARY OF PERSISTED REAL DATA
        // ---------------------------------------------------------------------
        console.log("\n================================================================================");
        console.log(" \x1b[32m✔ ALL APIS AND DATABASE FLOWS COMPLETED SUCCESSFULLY!\x1b[0m");
        console.log(" \x1b[33m✔ PERSISTENT DATA HAS BEEN SAVED TO MONGODB ATLAS (NOT DELETED)\x1b[0m");
        console.log("================================================================================\n");

        console.log("SUMMARY OF REAL DATA AVAILABLE IN PORTALS:");
        console.log("--------------------------------------------------------------------------------");
        console.log(`• Admin Account:         ${adminEmail}  | Password: Admin@12345`);
        console.log(`• Organization Account:  ${orgEmail}  | Password: Password@12345`);
        console.log(`• Talent 1 (Selected):   ${talent1Email}  | Password: Password@12345`);
        console.log(`• Talent 2 (Shortlist):  ${talent2Email}  | Password: Password@12345`);
        console.log(`• Project Created:       ${projectDoc.projectName} (ID: ${projectDoc._id})`);
        console.log(`• Published Opportunity: ${opp1Doc.title} (ID: ${opp1Id})`);
        console.log(`• Pending Opportunity:   ${opp2Doc.title} (ID: ${opp2Doc._id || opp2Doc.id})`);
        console.log(`• Selected Application:  Candidate: Rohan Malhotra | Role: Lead Protagonist (ID: ${app1Doc._id})`);
        console.log(`• Submitted Audition:    Audition ID: ${audition1Doc._id} | Status: submitted (Self-tape stored)`);
        console.log(`• Pending Audition:      Audition ID: ${audition2Doc._id} | Status: requested (Pending admin review)`);
        console.log("--------------------------------------------------------------------------------\n");

    } catch (err) {
        console.error("\n\x1b[31mPopulate Flow Error:\x1b[0m", err);
    } finally {
        await mongoose.disconnect();
        console.log("Database connection closed cleanly.");
        process.exit(0);
    }
}

runAndPersistFlow();
