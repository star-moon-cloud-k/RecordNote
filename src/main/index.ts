import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { WorkspacePaths, WorkspaceState } from '../shared/types/workspace';


const getWorkspacePaths = (): WorkspacePaths => {
    const baseDir = path.join(app.getPath('userData'), 'recordnote-data');

    return {
        baseDir,
        recordingsDir: path.join(baseDir, 'recordings'),
        processingDir: path.join(baseDir, 'processing'),
        transcriptsDir: path.join(baseDir, 'transcripts'),
        summariesDir: path.join(baseDir, 'summaries'),
        logsDir: path.join(baseDir, 'logs'),
        modelsDir: path.join(baseDir, 'models'),
    };
};

const ensureWorkspace = async (): Promise<WorkspaceState> => {
    const paths = getWorkspacePaths();

    await Promise.all([
        fs.mkdir(paths.baseDir, { recursive: true }),
        fs.mkdir(paths.recordingsDir, { recursive: true }),
        fs.mkdir(paths.processingDir, { recursive: true }),
        fs.mkdir(paths.transcriptsDir, { recursive: true }),
        fs.mkdir(paths.summariesDir, { recursive: true }),
        fs.mkdir(paths.logsDir, { recursive: true }),
        fs.mkdir(paths.modelsDir, { recursive: true }),
    ]);

    return {
        ready: true,
        paths,
    };
};

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

ipcMain.handle('workspace:get-state', async (): Promise<WorkspaceState> => {
    return ensureWorkspace();
});

app.whenReady().then(async () => {
    await ensureWorkspace();
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