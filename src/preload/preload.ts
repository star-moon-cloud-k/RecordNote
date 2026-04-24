import { contextBridge, ipcRenderer } from 'electron';
import type { WorkspaceState } from '../shared/types/workspace';
import { IPC_CHANNELS } from '../shared/constants/ipc';
import type { SaveRecordingInput, SaveRecordingOutput } from '../shared/types/recorder';

contextBridge.exposeInMainWorld('RecordNote', {
    getWorkspaceState: async (): Promise<WorkspaceState> => {
        return ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_GET_STATE);
    },

    saveRecording: async (payload: SaveRecordingInput): Promise<SaveRecordingOutput> => {
        return ipcRenderer.invoke(IPC_CHANNELS.RECORDING_SAVE, payload);
    }
});
