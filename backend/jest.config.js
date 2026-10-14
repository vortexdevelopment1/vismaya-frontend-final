module.exports = {
    testEnvironment: "node",
    testTimeout: 60000,
    verbose: true,
    forceExit: true,
    detectOpenHandles: false,
    testMatch: ["**/tests/phase*.test.js", "**/tests/*approval*.test.js"],
    testEnvironmentOptions: {
        customExportConditions: ["node", "node-addons"]
    }
};
