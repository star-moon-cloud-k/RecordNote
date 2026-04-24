import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc';
import type { RenameFileInput } from '../../shared/types/files';
import {
    deleteRecordNoteFile,
    getAudioFileUrl,
    listRecordNoteFiles,
    readSubtitleForRecording,
    readRecordNoteFile,
    renameRecordNoteFile,
} from '../services/files.service';

export const registerFilesIpc = () => {
    ipcMain.handle(IPC_CHANNELS.FILES_LIST, async () => {
        return listRecordNoteFiles();
    });

    ipcMain.handle(IPC_CHANNELS.FILES_READ, async (_event, filePath: string) => {
        return readRecordNoteFile(filePath);
    });

    ipcMain.handle(
        IPC_CHANNELS.FILES_READ_SUBTITLE_FOR_RECORDING,
        async (_event, recordingPath: string) => {
            return readSubtitleForRecording(recordingPath);
        },
    );

    ipcMain.handle(
        IPC_CHANNELS.FILES_RENAME,
        async (_event, payload: RenameFileInput) => {
            return renameRecordNoteFile(payload);
        },
    );

    ipcMain.handle(
        IPC_CHANNELS.FILES_DELETE,
        async (_event, filePath: string) => {
            return deleteRecordNoteFile(filePath);
        },
    );

    ipcMain.handle(
        IPC_CHANNELS.FILES_GET_AUDIO_URL,
        async (_event, filePath: string) => {
            return getAudioFileUrl(filePath);
        },
    );
};
