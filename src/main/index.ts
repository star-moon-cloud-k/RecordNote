import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import type { WorkspaceState } from '../shared/types/workspace';
import { ensureWorkspace } from './services/workspace.service';
import { registerRecorderIpc } from './ipc/recorder.ipc';
import { IPC_CHANNELS } from '../shared/constants/ipc';
import { registerTranscriptionIpc } from './ipc/transcription.ipc';


const createWindow = () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 860,
        minWidth: 1100,
        minHeight: 760,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        void win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        void win.loadFile(
            path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
        );
    }
};


const registerWorkspaceIpc = () => {
    ipcMain.handle(IPC_CHANNELS.WORKSPACE_GET_STATE, async (): Promise<WorkspaceState> => {
        return ensureWorkspace();
    });
}


app.whenReady().then(async () => {
    await ensureWorkspace();

    // Register IPC handlers
    registerRecorderIpc();
    registerWorkspaceIpc();
    registerTranscriptionIpc();

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});