import type { WorkspaceState } from '../shared/types/workspace';
import type { SaveRecordingInput, SaveRecordingOutput } from '../shared/types/recorder';

declare global {
    interface Window {
        RecordNote: {
            getWorkspaceState: () => Promise<WorkspaceState>;
            saveRecording: (payload: SaveRecordingInput) => Promise<SaveRecordingOutput>;
        };
    }
}

export {};
