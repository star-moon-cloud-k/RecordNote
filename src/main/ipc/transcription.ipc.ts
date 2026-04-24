import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc';
import { startTranscription } from '../services/transcription.service';
import type {
    StartTranscriptionInput,
    StartTranscriptionOutput,
} from '../../shared/types/transcription';

export const registerTranscriptionIpc = () => {
    ipcMain.handle(
        IPC_CHANNELS.TRANSCRIPTION_START,
        async (
            _event,
            payload: StartTranscriptionInput,
        ): Promise<StartTranscriptionOutput> => {
            return startTranscription(payload);
        },
    );
};