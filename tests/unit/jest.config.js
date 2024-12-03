module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    moduleFileExtensions: ['js', 'json', 'jsx', 'node'],
    collectCoverage: false,
    verbose: true,
    detectOpenHandles: true,
    modulePathIgnorePatterns: ['.pnpm-store'],
    transform: {
        '\\.[j]sx?$': 'babel-jest',
    },
}
