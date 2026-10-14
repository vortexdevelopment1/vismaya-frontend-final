const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../../src/models/user.model");
const TalentProfile = require("../../src/models/talentProfile.model");
const Organization = require("../../src/models/organization.model");
const Project = require("../../src/models/project.model");
const Opportunity = require("../../src/models/opportunity.model");
const Application = require("../../src/models/application.model");

/**
 * Factory for creating test users and domain models
 */
const createUser = async (overrides = {}) => {
    const randomSuffix = crypto.randomBytes(4).toString("hex");
    const defaultPassword = overrides.password || "Password@123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const user = await User.create({
        name: overrides.name || `Test User ${randomSuffix}`,
        email: overrides.email || `test_${randomSuffix}@example.com`,
        mobile: overrides.mobile || `+9198765${Math.floor(10000 + Math.random() * 90000)}`,
        password: hashedPassword,
        role: overrides.role || "talent",
        status: overrides.status || "active",
        isPaid: overrides.isPaid !== undefined ? overrides.isPaid : true,
        ...overrides,
        ...(overrides.password ? { password: hashedPassword } : {})
    });

    return user;
};

const createTalent = async (userOverrides = {}, profileOverrides = {}) => {
    const user = await createUser({ role: "talent", ...userOverrides });
    const randomDigits = Math.floor(100000 + Math.random() * 900000);

    const profile = await TalentProfile.create({
        userId: user._id,
        vismayaId: `VIS-${randomDigits}`,
        firstName: user.name.split(" ")[0] || "Jane",
        lastName: user.name.split(" ")[1] || "Doe",
        gender: "female",
        dateOfBirth: new Date("1995-05-15"),
        category: "film_and_tv",
        primaryProfession: "actors",
        city: "Mumbai",
        state: "Maharashtra",
        bio: "Experienced professional actor with multiple stage and screen credits across regional and national productions.",
        profileCompletionPercentage: profileOverrides.profileCompletionPercentage !== undefined ? profileOverrides.profileCompletionPercentage : 80,
        isSearchable: profileOverrides.isSearchable !== undefined ? profileOverrides.isSearchable : true,
        ...profileOverrides
    });

    return { user, profile };
};

const createOrganization = async (userOverrides = {}, orgOverrides = {}) => {
    const user = await createUser({ role: "organization", ...userOverrides });
    const randomSuffix = crypto.randomBytes(4).toString("hex");

    const org = await Organization.create({
        userId: user._id,
        organizationName: orgOverrides.organizationName || `Studio ${randomSuffix}`,
        legalBusinessName: orgOverrides.legalBusinessName || `Studio ${randomSuffix} Private Limited`,
        organizationType: "production_house",
        description: "Leading film and media production studio based in Mumbai.",
        website: "https://example.com",
        city: "Mumbai",
        state: "Maharashtra",
        ...orgOverrides
    });

    return { user, org };
};

const { generateAuthToken } = require("./auth");

const createAdmin = async (overrides = {}) => {
    return await createUser({
        role: "admin",
        status: "active",
        isPaid: true,
        email: "admin@vismayastudios.com",
        name: "Super Admin",
        ...overrides
    });
};

const createTalentUser = async (userOverrides = {}) => {
    const user = await createUser({ role: "talent", ...userOverrides });
    const { token, bearerHeader } = await generateAuthToken(user);
    return { user, token, bearerHeader };
};

const createOrgUser = async (userOverrides = {}) => {
    const { user, org } = await createOrganization(userOverrides);
    const { token, bearerHeader } = await generateAuthToken(user);
    return { user, org, token, bearerHeader };
};

const createAdminUser = async (overrides = {}) => {
    const admin = await createAdmin(overrides);
    const { token, bearerHeader } = await generateAuthToken(admin);
    return { admin, token, bearerHeader };
};

module.exports = {
    createUser,
    createTalent,
    createOrganization,
    createAdmin,
    createTalentUser,
    createOrgUser,
    createAdminUser
};

