export type SaveRecordingInput = {
    fileName: string;
    mimeType: string;
    arrayBuffer: ArrayBuffer;
}

export type SaveRecordingOutput = {
    success: boolean;
    filePath?: string;
    error?: string;
}

export type RecorderState =
    | 'idle'
    | 'requesting-permission'
    | 'recording'
    | 'stopping'
    | 'saving'
    | 'success'
    | 'error';