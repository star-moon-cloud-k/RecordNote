export type SummarizeTranscriptInput = {
    transcriptText: string;
    transcriptFilePath?: string;
    transcriptSrtFilePath?: string;
};

export type SummaryActionItem = {
    task: string;
    owner: string,
    dueDate: string;
};

export type SummarySpeakerInference = {
    speaker: string;
    likelyRole: string;
    confidence: number;
    evidence: string;
    keyTopics: string[];
    sampleQuotes: string[];
};

export type SummarizeTranscriptData = {
    title: string;
    summary: string;
    detailedSummary: string;
    keyPoints: string[];
    decisions: string[];
    risks: string[];
    openQuestions: string[];
    nextSteps: string[];
    actionItems: SummaryActionItem[];
    speakerInferences: SummarySpeakerInference[];
};

export type SummarizeTranscriptOutput = {
    success: boolean;
    data?: SummarizeTranscriptData;
    error?: string;
    rawText?: string;
    summaryFilePath?: string;
    summaryJsonFilePath?: string;
    summaryMarkdownFilePath?: string;
    markdownContent?: string;
};
