
export const IPC_CHANNELS = {
    WORKSPACE_GET_STATE: 'workspace:get-state',
    RECORDING_SAVE: 'recording:save',

    TRANSCRIPTION_START: 'transcription:start',
    SUMMARIZATION_START: 'summarization:start',

    FILE_LIST: 'file:list',
    FILE_READ: 'file:read',
} as const;