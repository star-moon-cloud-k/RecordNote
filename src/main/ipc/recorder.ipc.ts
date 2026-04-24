import { ipcMain } from "electron"
import { IPC_CHANNELS } from "../../shared/constants/ipc"
import { SaveRecordingInput, SaveRecordingOutput } from "../../shared/types/recorder"
import { saveRecording } from "../services/recorder.service"

export const registerRecorderIpc = () => {
    ipcMain.handle(IPC_CHANNELS.RECORDING_SAVE, async (_event, payload: SaveRecordingInput): Promise<SaveRecordingOutput> => {
        return saveRecording(payload);
    })
}