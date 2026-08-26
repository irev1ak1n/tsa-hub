import { defineConfig } from 'vite';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        include: ['src/**/*.qa.test.js', 'src/**/*.test.js'],
        testTimeout: 20000,
    },
});
