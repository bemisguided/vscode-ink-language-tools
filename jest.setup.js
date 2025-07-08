require("./tests/__mocks__/vscode");

// Setup fixtures - compile all Ink stories and make them available globally
const { setupFixtures } = require("./tests/fixtures/fixture-compiler.ts");
setupFixtures();
