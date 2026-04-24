export type RecordNoteFileKind = 'recording' | 'transcript' | 'summary';

export type RecordNoteFileItem = {
    id: string;
    name: string;
    stem: string;
    ext: string;
    kind: RecordNoteFileKind;
    path: string;
    createdAt: string;
    updatedAt: string;
};

export type ListFilesResult = {
    success: boolean;
    items: RecordNoteFileItem[];
    error?: string;
};

export type ReadFileResult = {
    success: boolean;
    path: string;
    content?: string;
    error?: string;
};

export type RenameFileInput = {
    filePath: string;
    nextBaseName: string;
};

export type RenameFileResult = {
    success: boolean;
    oldPath: string;
    newPath?: string;
    error?: string;
};

export type DeleteFileInput = {
    filePath: string;
};

export type DeleteFileResult = {
    success: boolean;
    deletedPath: string;
    error?: string;
};

export type GetAudioFileUrlResult = {
    success: boolean;
    path: string;
    fileUrl?: string;
    error?: string;
};
