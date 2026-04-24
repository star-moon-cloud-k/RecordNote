import { app } from "electron";
import { WorkspacePaths } from "../../shared/types/workspace";
import path from "node:path";
import fs from "fs/promises";


export const getWorkspacePaths = (): WorkspacePaths => {
    const baseDir = path.join(app.getPath('userData'), 'record-note-data');

    return {
        baseDir,
        recordingsDir: path.join(baseDir, 'recordings'),
        processingDir: path.join(baseDir, 'processing'),
        transcriptsDir: path.join(baseDir, 'transcripts'),
        summariesDir: path.join(baseDir, 'summaries'),
        logsDir: path.join(baseDir, 'logs'),
        modelsDir: path.join(baseDir, 'models'),
    };
}

export const ensureWorkspace = async () => {
    const paths = getWorkspacePaths();

    await Promise.all([
        fs.mkdir(paths.baseDir, { recursive: true }),
        fs.mkdir(paths.recordingsDir, { recursive: true }),
        fs.mkdir(paths.processingDir, { recursive: true }),
        fs.mkdir(paths.transcriptsDir, { recursive: true }),
        fs.mkdir(paths.summariesDir, { recursive: true }),
        fs.mkdir(paths.logsDir, { recursive: true }),
        fs.mkdir(paths.modelsDir, { recursive: true }),
    ])

    return {
        ready: true,
        paths,
    };
}
