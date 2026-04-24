import { clipboard, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc';
import type {
    ClipboardWriteInput,
    ClipboardWriteResult,
} from '../../shared/types/clipboard';

export const registerClipboardIpc = () => {
    ipcMain.handle(
        IPC_CHANNELS.CLIPBOARD_WRITE_TEXT,
        async (_event, payload: ClipboardWriteInput): Promise<ClipboardWriteResult> => {
            try {
                clipboard.writeText(payload?.text ?? '');
                return { success: true };
            } catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                };
            }
        },
    );
};
