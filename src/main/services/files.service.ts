import fs from 'node:fs/promises';

import path from 'node:path';

import { ensureWorkspace } from './workspace.service';

import type {

    RecordNoteFileItem,

    ListFilesResult,

    ReadFileResult,

} from '../../shared/types/files';

const toItems = async (dir: string,
    kind: 'recording' | 'summary' | 'transcript'
): Promise<RecordNoteFileItem[]> => {

    const entries = await fs.readdir(dir, { withFileTypes: true });
    const items = await Promise.all(
        entries
            .filter((entry) => entry.isFile())
            .map(async (entry) => {
                const filePath = path.join(dir, entry.name);
                const stats = await fs.stat(filePath);
                return {
                    id: `${kind}:${filePath}`,
                    name: entry.name,
                    kind,
                    path: filePath,
                    createdAt: stats.birthtime.toISOString(),
                } satisfies RecordNoteFileItem;
            }),
    );
    return items;
}

export const listRecordNoteFiles = async () => {
    try {
        const workspacePath = await ensureWorkspace();

        const [recordings, summaries, transcripts] = await Promise.all([
            toItems(workspacePath.paths.recordingsDir, 'recording'),
            toItems(workspacePath.paths.summariesDir, 'summary'),
            toItems(workspacePath.paths.transcriptsDir, 'transcript'),
        ]);

        const items = [...recordings, ...summaries, ...transcripts]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

        return {
            success: true,
            items,
        };
    } catch (error) {
        return {
            success: false,
            items: [],
            error: error instanceof Error ? error.message : String(error),
        };
    }
};

export const readRecordNoteFile = async (filePath: string): Promise<ReadFileResult> => {

    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return {
            success: true,
            path: filePath,
            content,
        };
    } catch (error) {
        return {
            success: false,
            path: filePath,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};

