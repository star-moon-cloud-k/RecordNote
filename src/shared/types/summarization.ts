export type SummarizeTranscriptInput = {
    transcriptText: string;
    transcriptFilePath?: string;
}

export type SummaryActionItem = {
    task: string,
    owner: string,
    dueDate: string;
}

export type SummarizeTranscriptData = {
    title: string;
    summary: string;
    keyPoints: string[];
    actionItems: SummaryActionItem[];
}

export type SummarizeTranscriptOutput = {
    success: boolean;
    data?: SummarizeTranscriptData;
    error?: string;
    rawText?: string;
    summaryFilePath?: string;
}