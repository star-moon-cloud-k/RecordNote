import type { WorkspaceState } from '../shared/types/workspace';
import type { SaveRecordingInput, SaveRecordingOutput } from '../shared/types/recorder';
import type {
    StartTranscriptionInput,
    StartTranscriptionOutput,
} from '../shared/types/transcription';

declare global {
    interface Window {
        RecordNote: {
            getWorkspaceState: () => Promise<WorkspaceState>;
            saveRecording: (payload: SaveRecordingInput) => Promise<SaveRecordingOutput>;
            startTranscription: (payload: StartTranscriptionInput) => Promise<StartTranscriptionOutput>;
        };
    }
}

export { };
