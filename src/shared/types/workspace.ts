export type WorkspacePaths = {
    baseDir: string;
    recordingsDir: string;
    processingDir: string;
    transcriptsDir: string;
    summariesDir: string;
    logsDir: string;
    modelsDir: string;
};

export type WorkspaceState = {
    ready: boolean;
    paths: WorkspacePaths;
};