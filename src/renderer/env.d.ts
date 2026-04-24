import type { WorkspaceState } from '../shared/types/workspace';
import type { SaveRecordingInput, SaveRecordingOutput } from '../shared/types/recorder';
import type {
    StartTranscriptionInput,
    StartTranscriptionOutput,
} from '../shared/types/transcription';
import type {
    SummarizeTranscriptInput,
    SummarizeTranscriptOutput,
} from '../shared/types/summarization';
import type {
    DeleteFileResult,
    GetAudioFileUrlResult,
    ListFilesResult,
    ReadFileResult,
    RenameFileInput,
    RenameFileResult,
} from '../shared/types/files';

declare global {
    interface Window {
        RecordNote: {
            getWorkspaceState: () => Promise<WorkspaceState>;
            saveRecording: (payload: SaveRecordingInput) => Promise<SaveRecordingOutput>;
            startTranscription: (payload: StartTranscriptionInput) => Promise<StartTranscriptionOutput>;
            summarizeTranscript: (payload: SummarizeTranscriptInput) => Promise<SummarizeTranscriptOutput>;
            listFiles: () => Promise<ListFilesResult>;
            readFile: (filePath: string) => Promise<ReadFileResult>;
            renameFile: (payload: RenameFileInput) => Promise<RenameFileResult>;
            deleteFile: (filePath: string) => Promise<DeleteFileResult>;
            getAudioFileUrl: (filePath: string) => Promise<GetAudioFileUrlResult>;
        };
    }
}

export { };
