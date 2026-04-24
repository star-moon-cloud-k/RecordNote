
export type StartTranscriptionInput = {
    sourceFilePath: string;
}

export type StartTranscriptionOutput = {
    success: boolean;
    wavFilePath?: string;
    transcriptFilePath?: string;
    transcriptSrtFilePath?: string;
    text?: string;
    error?: string;
};
