import type { WorkspaceState } from './shared/types/workspace';

declare module '*.css';

declare global {
    const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
    const MAIN_WINDOW_VITE_NAME: string;
    interface Window {
        RecordNote: {
            getWorkspaceState: () => Promise<WorkspaceState>;
        };
    }
}