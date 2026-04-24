import { contextBridge, ipcRenderer } from 'electron';
import type { WorkspaceState } from '../shared/types/workspace';

contextBridge.exposeInMainWorld('RecordNote', {
    getWorkspaceState: async (): Promise<WorkspaceState> => {
        return ipcRenderer.invoke('workspace:get-state');
    },
});