import { useEffect, useMemo, useState } from 'react';
import type { RecordNoteFileItem, RenameFileResult } from '../../shared/types/files';
import FileGroupDropdown from './FileGroupDropdown';
import RenameDialog from './RenameDialog';

type Props = {
    selectedPath: string | null;
    onSelect: (item: RecordNoteFileItem | null) => void;
    refreshKey?: number;
};

export default function FileExplorerPanel({
    selectedPath,
    onSelect,
    refreshKey = 0,
}: Props) {
    const [items, setItems] = useState<RecordNoteFileItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [renameTarget, setRenameTarget] = useState<RecordNoteFileItem | null>(null);
    const [copyMessage, setCopyMessage] = useState<string | null>(null);

    const loadFiles = async (): Promise<RecordNoteFileItem[]> => {
        const result = await window.RecordNote.listFiles();

        if (result.success) {
            setItems(result.items);
            setError(null);
            return result.items;
        }

        setItems([]);
        setError(result.error || '파일 목록 조회 실패');
        return [];
    };

    useEffect(() => {
        void loadFiles();
    }, [refreshKey]);

    const recordings = useMemo(
        () => items.filter((item) => item.kind === 'recording'),
        [items],
    );
    const transcripts = useMemo(
        () => items.filter((item) => item.kind === 'transcript'),
        [items],
    );
    const summaries = useMemo(
        () => items.filter((item) => item.kind === 'summary'),
        [items],
    );

    const handleRenameDone = async (result: RenameFileResult) => {
        const refreshed = await loadFiles();

        if (!result.newPath || selectedPath !== result.oldPath) {
            return;
        }

        const renamed = refreshed.find((item) => item.path === result.newPath);
        if (renamed) {
            onSelect(renamed);
        }
    };

    const handleDelete = async (item: RecordNoteFileItem) => {
        const ok = window.confirm(`정말 삭제할까?\n${item.name}`);
        if (!ok) return;

        const result = await window.RecordNote.deleteFile(item.path);
        if (result.success) {
            const refreshed = await loadFiles();
            if (selectedPath === item.path) {
                onSelect(refreshed[0] ?? null);
            }
            return;
        }

        setError(result.error || '파일 삭제 실패');
    };

    const copyAllResults = async () => {
        if (items.length === 0) {
            setCopyMessage('복사할 결과물이 없다.');
            return;
        }

        const grouped = {
            recordings: items.filter((item) => item.kind === 'recording'),
            transcripts: items.filter((item) => item.kind === 'transcript'),
            summaries: items.filter((item) => item.kind === 'summary'),
        };

        const lines: string[] = [
            '# 결과물 목록',
            '',
            '## Recordings',
            ...(grouped.recordings.length > 0
                ? grouped.recordings.map((item) => `- ${item.name} | ${item.path}`)
                : ['- 없음']),
            '',
            '## Transcripts',
            ...(grouped.transcripts.length > 0
                ? grouped.transcripts.map((item) => `- ${item.name} | ${item.path}`)
                : ['- 없음']),
            '',
            '## Summaries',
            ...(grouped.summaries.length > 0
                ? grouped.summaries.map((item) => `- ${item.name} | ${item.path}`)
                : ['- 없음']),
        ];

        const result = await window.RecordNote.copyToClipboard(lines.join('\n'));
        setCopyMessage(result.success ? '결과물 목록을 복사했다.' : `복사 실패: ${result.error ?? '알 수 없는 오류'}`);
    };

    return (
        <>
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base font-semibold">파일 탐색기</h2>
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => void loadFiles()}
                            className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs hover:bg-zinc-800"
                        >
                            새로고침
                        </button>
                        <button
                            onClick={() => void copyAllResults()}
                            className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs hover:bg-zinc-800"
                        >
                            목록 복사
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-3 rounded-lg border border-amber-800 bg-amber-950/40 px-2.5 py-2 text-xs text-amber-300">
                        {error}
                    </div>
                )}

                {copyMessage && (
                    <div className="mb-3 rounded-lg border border-sky-800 bg-sky-950/40 px-2.5 py-2 text-xs text-sky-300">
                        {copyMessage}
                    </div>
                )}

                <div className="space-y-3">
                    <FileGroupDropdown
                        title="Recordings"
                        items={recordings}
                        selectedPath={selectedPath}
                        onSelect={onSelect}
                        onRename={setRenameTarget}
                        onDelete={(item) => void handleDelete(item)}
                        defaultOpen
                    />
                    <FileGroupDropdown
                        title="Transcripts"
                        items={transcripts}
                        selectedPath={selectedPath}
                        onSelect={onSelect}
                        onRename={setRenameTarget}
                        onDelete={(item) => void handleDelete(item)}
                    />
                    <FileGroupDropdown
                        title="Summaries"
                        items={summaries}
                        selectedPath={selectedPath}
                        onSelect={onSelect}
                        onRename={setRenameTarget}
                        onDelete={(item) => void handleDelete(item)}
                    />
                </div>
            </section>

            <RenameDialog
                target={renameTarget}
                onClose={() => setRenameTarget(null)}
                onDone={(result) => void handleRenameDone(result)}
            />
        </>
    );
}
