import { contextBridge, ipcRenderer } from 'electron';
import type { WorkspaceState } from '../shared/types/workspace';
import { IPC_CHANNELS } from '../shared/constants/ipc';
import type { SaveRecordingInput, SaveRecordingOutput } from '../shared/types/recorder';
import type { StartTranscriptionInput, StartTranscriptionOutput } from '../shared/types/transcription';
import type { SummarizeTranscriptInput, SummarizeTranscriptOutput } from '../shared/types/summarization';
import type {
    DeleteFileResult,
    GetAudioFileUrlResult,
    ListFilesResult,
    ReadFileResult,
    RenameFileInput,
    RenameFileResult,
} from '../shared/types/files';

contextBridge.exposeInMainWorld('RecordNote', {
    getWorkspaceState: async (): Promise<WorkspaceState> => {
        return ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_GET_STATE);
    },

    saveRecording: async (payload: SaveRecordingInput): Promise<SaveRecordingOutput> => {
        return ipcRenderer.invoke(IPC_CHANNELS.RECORDING_SAVE, payload);
    },

    startTranscription: async (
        payload: StartTranscriptionInput,
    ): Promise<StartTranscriptionOutput> => {
        return ipcRenderer.invoke(IPC_CHANNELS.TRANSCRIPTION_START, payload);
    },
    summarizeTranscript: async (
        payload: SummarizeTranscriptInput,
    ): Promise<SummarizeTranscriptOutput> => {
        return ipcRenderer.invoke(IPC_CHANNELS.SUMMARIZATION_START, payload);
    },
    listFiles: async (): Promise<ListFilesResult> => {
        return ipcRenderer.invoke(IPC_CHANNELS.FILES_LIST);
    },
    readFile: async (filePath: string): Promise<ReadFileResult> => {
        return ipcRenderer.invoke(IPC_CHANNELS.FILES_READ, filePath);
    },
    renameFile: async (payload: RenameFileInput): Promise<RenameFileResult> => {
        return ipcRenderer.invoke(IPC_CHANNELS.FILES_RENAME, payload);
    },
    deleteFile: async (filePath: string): Promise<DeleteFileResult> => {
        return ipcRenderer.invoke(IPC_CHANNELS.FILES_DELETE, filePath);
    },
    getAudioFileUrl: async (filePath: string): Promise<GetAudioFileUrlResult> => {
        return ipcRenderer.invoke(IPC_CHANNELS.FILES_GET_AUDIO_URL, filePath);
    },
});
