/* eslint-disable @typescript-eslint/no-require-imports */
module.exports = require("jest-mock-vscode").createVSCodeMock(jest);

// Add additional mocks
const vscode = require("vscode");

// Mock diagnostic collection
vscode.languages.createDiagnosticCollection = jest.fn().mockReturnValue({
  set: jest.fn(),
  clear: jest.fn(),
  dispose: jest.fn(),
});

// Mock extensions API
vscode.extensions = {
  getExtension: jest.fn().mockReturnValue({
    extensionUri: {
      scheme: "file",
      fsPath: "/mock/extension/path",
    },
  }),
};
