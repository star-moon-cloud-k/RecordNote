import { ipcMain } from "electron"
import { IPC_CHANNELS } from "../../shared/constants/ipc"
import { listRecordNoteFiles, readRecordNoteFile } from "../services/files.service";

export const registerFilesIpc = () => {
    ipcMain.handle(IPC_CHANNELS.FILE_LIST, async () => {
        return listRecordNoteFiles();
    });

    ipcMain.handle(IPC_CHANNELS.FILE_READ, async (_event, filePath: string) => {
        return readRecordNoteFile(filePath);
    });
}