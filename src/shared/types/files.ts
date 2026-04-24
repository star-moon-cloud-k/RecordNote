export type RecordNoteFileItem = {
    id: string;
    name: string;
    kind: 'recording' | 'summary' | 'transcript';
    path: string;
    createdAt: string;
}

export type ListFilesResult = {
    success: boolean;
    items: RecordNoteFileItem[];
    error?: string;
}

export type ReadFileResult = {
    success: boolean;
    path: string;
    content?: string;
    error?: string;
}