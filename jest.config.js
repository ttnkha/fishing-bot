module.exports = {
  testEnvironment: "node",
  moduleNameMapper: {
    "^@root/(.*)$": "<rootDir>/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@handlers/(.*)$": "<rootDir>/src/handlers/$1",
    "^@logic/(.*)$": "<rootDir>/src/logic/$1",
  },
  moduleDirectories: ["node_modules", "src"],
};
