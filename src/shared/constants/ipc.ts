
export const IPC_CHANNELS = {
    WORKSPACE_GET_STATE: 'workspace:get-state',
    RECORDING_SAVE: 'recording:save',

    TRANSCRIPTION_START: 'transcription:start',
    SUMMARIZATION_START: 'summarization:start',

    FILES_LIST: 'files:list',
    FILES_READ: 'files:read',
    FILES_RENAME: 'files:rename',
    FILES_DELETE: 'files:delete',
    FILES_GET_AUDIO_URL: 'files:get-audio-url',
} as const;
