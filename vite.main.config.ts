import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
    build: {
        rollupOptions: {
            external: [
                'node-llama-cpp',
                '@node-llama-cpp/mac-arm64',
                '@node-llama-cpp/mac-x64',
                '@node-llama-cpp/linux-x64',
                '@node-llama-cpp/linux-arm64',
                '@node-llama-cpp/win-x64',
            ],
        }
    }
});
