import fs from 'node:fs/promises';
import path from 'node:path';
import { ensureWorkspace } from './workspace.service';
import type {
    DeleteFileResult,
    GetAudioFileUrlResult,
    ListFilesResult,
    ReadFileResult,
    RecordNoteFileItem,
    RecordNoteFileKind,
    RenameFileInput,
    RenameFileResult,
} from '../../shared/types/files';

const SUMMARY_SUFFIX = '-summary';

type ManagedDirectory = {
    dir: string;
    kind: RecordNoteFileKind;
    includeInList: boolean;
};

const sanitizeBaseName = (value: string) => {
    return value
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/\s+/g, ' ')
        .replace(/\.+$/, '');
};

const getAudioMimeType = (filePath: string) => {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
        case '.mp4':
        case '.m4a':
            return 'audio/mp4';
        case '.ogg':
            return 'audio/ogg';
        case '.wav':
            return 'audio/wav';
        case '.mp3':
            return 'audio/mpeg';
        case '.webm':
        default:
            return 'audio/webm';
    }
};

const pathExists = async (targetPath: string) => {
    try {
        await fs.access(targetPath);
        return true;
    } catch {
        return false;
    }
};

const isWithinDirectory = (targetPath: string, directoryPath: string) => {
    const relative = path.relative(directoryPath, targetPath);
    return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
};

const getManagedDirectories = (paths: Awaited<ReturnType<typeof ensureWorkspace>>['paths']): ManagedDirectory[] => {
    return [
        { dir: paths.recordingsDir, kind: 'recording', includeInList: true },
        { dir: paths.transcriptsDir, kind: 'transcript', includeInList: true },
        { dir: paths.subtitlesDir, kind: 'transcript', includeInList: false },
        { dir: paths.summariesDir, kind: 'summary', includeInList: true },
    ];
};

const getGroupStem = (kind: RecordNoteFileKind, stem: string) => {
    if (kind === 'summary' && stem.endsWith(SUMMARY_SUFFIX)) {
        return stem.slice(0, -SUMMARY_SUFFIX.length);
    }

    return stem;
};

const getRenamedStem = (
    kind: RecordNoteFileKind,
    originalStem: string,
    nextBaseName: string,
) => {
    if (kind === 'summary' && originalStem.endsWith(SUMMARY_SUFFIX)) {
        return nextBaseName.endsWith(SUMMARY_SUFFIX)
            ? nextBaseName
            : `${nextBaseName}${SUMMARY_SUFFIX}`;
    }

    return nextBaseName;
};

const getManagedPathInfo = (
    filePath: string,
    managedDirectories: ManagedDirectory[],
): { path: string; kind: RecordNoteFileKind } => {
    const resolvedPath = path.resolve(filePath);

    for (const managed of managedDirectories) {
        const resolvedDirectory = path.resolve(managed.dir);
        if (isWithinDirectory(resolvedPath, resolvedDirectory)) {
            return {
                path: resolvedPath,
                kind: managed.kind,
            };
        }
    }

    throw new Error('관리 대상 디렉터리 외부 파일이다.');
};

const toItems = async (
    dir: string,
    kind: RecordNoteFileKind,
): Promise<RecordNoteFileItem[]> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    const items = await Promise.all(
        entries
            .filter((entry) => entry.isFile())
            .map(async (entry) => {
                const filePath = path.join(dir, entry.name);
                const stat = await fs.stat(filePath);
                const ext = path.extname(entry.name);
                const stem = path.basename(entry.name, ext);

                return {
                    id: `${kind}:${filePath}`,
                    name: entry.name,
                    stem,
                    ext,
                    kind,
                    path: filePath,
                    createdAt: stat.birthtime.toISOString(),
                    updatedAt: stat.mtime.toISOString(),
                } satisfies RecordNoteFileItem;
            }),
    );

    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const listRecordNoteFiles = async (): Promise<ListFilesResult> => {
    try {
        const workspace = await ensureWorkspace();
        const managedDirectories = getManagedDirectories(workspace.paths)
            .filter((item) => item.includeInList);

        const groupedItems = await Promise.all(
            managedDirectories.map((managed) => toItems(managed.dir, managed.kind)),
        );

        return {
            success: true,
            items: groupedItems.flat(),
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
        const workspace = await ensureWorkspace();
        const managed = getManagedDirectories(workspace.paths);
        const managedPath = getManagedPathInfo(filePath, managed).path;
        const content = await fs.readFile(managedPath, 'utf-8');

        return {
            success: true,
            path: managedPath,
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

export const renameRecordNoteFile = async (
    input: RenameFileInput,
): Promise<RenameFileResult> => {
    let oldPath = input.filePath;

    try {
        const nextBaseName = sanitizeBaseName(input.nextBaseName);

        if (!nextBaseName) {
            throw new Error('파일 이름이 비어 있다.');
        }

        const workspace = await ensureWorkspace();
        const managedDirectories = getManagedDirectories(workspace.paths);
        const target = getManagedPathInfo(input.filePath, managedDirectories);

        oldPath = target.path;
        const targetExt = path.extname(target.path);
        const targetStem = path.basename(target.path, targetExt);
        const targetGroupStem = getGroupStem(target.kind, targetStem);

        await fs.access(target.path);

        const listedGroups = await Promise.all(
            managedDirectories.map(({ dir, kind }) => toItems(dir, kind)),
        );
        const managedItems = listedGroups.flat();

        const renameCandidates = managedItems.filter((item) => {
            return getGroupStem(item.kind, item.stem) === targetGroupStem;
        });

        const candidates = renameCandidates.length > 0
            ? renameCandidates
            : [
                {
                    id: `${target.kind}:${target.path}`,
                    name: path.basename(target.path),
                    stem: targetStem,
                    ext: targetExt,
                    kind: target.kind,
                    path: target.path,
                    createdAt: '',
                    updatedAt: '',
                } satisfies RecordNoteFileItem,
            ];

        const renamePlans = candidates.map((item) => {
            const nextStem = getRenamedStem(item.kind, item.stem, nextBaseName);
            const nextPath = path.join(path.dirname(item.path), `${nextStem}${item.ext}`);

            return {
                oldPath: item.path,
                newPath: nextPath,
            };
        });

        const seenNewPaths = new Set<string>();
        const oldPathSet = new Set(renamePlans.map((plan) => plan.oldPath));

        for (const plan of renamePlans) {
            if (seenNewPaths.has(plan.newPath)) {
                throw new Error('이름 변경 결과가 서로 충돌한다.');
            }

            seenNewPaths.add(plan.newPath);

            if (plan.newPath !== plan.oldPath) {
                const exists = await pathExists(plan.newPath);
                if (exists && !oldPathSet.has(plan.newPath)) {
                    throw new Error(`이미 같은 이름의 파일이 존재한다: ${path.basename(plan.newPath)}`);
                }
            }
        }

        for (const plan of renamePlans) {
            if (plan.newPath !== plan.oldPath) {
                await fs.rename(plan.oldPath, plan.newPath);
            }
        }

        const targetRename = renamePlans.find((plan) => plan.oldPath === target.path);
        if (!targetRename) {
            throw new Error('대상 파일 이름 변경 계획을 만들지 못했다.');
        }

        if (targetRename.newPath === target.path) {
            return {
                success: true,
                oldPath: target.path,
                newPath: target.path,
            };
        }

        return {
            success: true,
            oldPath: target.path,
            newPath: targetRename.newPath,
        };
    } catch (error) {
        return {
            success: false,
            oldPath,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};

export const deleteRecordNoteFile = async (
    filePath: string,
): Promise<DeleteFileResult> => {
    let deletedPath = filePath;

    try {
        const workspace = await ensureWorkspace();
        const managedDirectories = getManagedDirectories(workspace.paths);
        const managedPath = getManagedPathInfo(filePath, managedDirectories).path;

        deletedPath = managedPath;
        await fs.access(managedPath);
        await fs.unlink(managedPath);

        return {
            success: true,
            deletedPath: managedPath,
        };
    } catch (error) {
        return {
            success: false,
            deletedPath,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};

export const getAudioFileUrl = async (
    filePath: string,
): Promise<GetAudioFileUrlResult> => {
    try {
        const workspace = await ensureWorkspace();
        const managed = getManagedDirectories(workspace.paths);
        const managedPath = getManagedPathInfo(filePath, managed).path;

        const buffer = await fs.readFile(managedPath);
        const mimeType = getAudioMimeType(managedPath);
        const base64 = buffer.toString('base64');

        return {
            success: true,
            path: managedPath,
            fileUrl: `data:${mimeType};base64,${base64}`,
        };
    } catch (error) {
        return {
            success: false,
            path: filePath,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};

export const readSubtitleForRecording = async (
    recordingPath: string,
): Promise<ReadFileResult> => {
    try {
        const workspace = await ensureWorkspace();
        const recordingManagedPath = getManagedPathInfo(recordingPath, [
            { dir: workspace.paths.recordingsDir, kind: 'recording', includeInList: true },
        ]).path;

        const stem = path.basename(
            recordingManagedPath,
            path.extname(recordingManagedPath),
        );
        const subtitlePath = path.join(workspace.paths.subtitlesDir, `${stem}.srt`);
        const content = await fs.readFile(subtitlePath, 'utf-8');

        return {
            success: true,
            path: subtitlePath,
            content,
        };
    } catch (error) {
        return {
            success: false,
            path: recordingPath,
            error: error instanceof Error ? error.message : String(error),
        };
    }
};
