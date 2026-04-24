import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc';
import { summarizeTranscript } from '../services/summarization.service';
import type {
  SummarizeTranscriptInput,
  SummarizeTranscriptOutput,
} from '../../shared/types/summarization';

export const registerSummarizationIpc = () => {
  ipcMain.handle(
    IPC_CHANNELS.SUMMARIZATION_START,
    async (
      _event,
      payload: SummarizeTranscriptInput,
    ): Promise<SummarizeTranscriptOutput> => {
      return summarizeTranscript(payload);
    },
  );
};