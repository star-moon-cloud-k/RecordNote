import { contextBridge, ipcRenderer } from 'electron';
import type { WorkspaceState } from '../shared/types/workspace';
import { IPC_CHANNELS } from '../shared/constants/ipc';
import type { SaveRecordingInput, SaveRecordingOutput } from '../shared/types/recorder';
import { StartTranscriptionInput, StartTranscriptionOutput } from '../shared/types/transcription';
import { SummarizeTranscriptInput, SummarizeTranscriptOutput } from '../shared/types/summarization';

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
    listFiles: async () => {
        return ipcRenderer.invoke(IPC_CHANNELS.FILE_LIST);
    },
    readFile: async (filePath: string) => {
        return ipcRenderer.invoke(IPC_CHANNELS.FILE_READ, filePath);
    }
});
