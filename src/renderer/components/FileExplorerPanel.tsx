import { useEffect, useState } from 'react';
import type { RecordNoteFileItem } from '../../shared/types/files';

type Props = {
    selectedPath: string | null;
    onSelect: (item: RecordNoteFileItem) => void;
};

export default function FileExplorerPanel({ selectedPath, onSelect }: Props) {
    const [items, setItems] = useState<RecordNoteFileItem[]>([]);

    const loadFiles = async () => {
        const result = await window.RecordNote.listFiles();
        if (result.success) {
            setItems(result.items);
        }
    };

    useEffect(() => {
        void loadFiles();
    }, []);

    return (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">파일 탐색기</h2>
                <button
                    onClick={() => void loadFiles()}
                    className="rounded-xl border border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-800"
                >
                    새로고침
                </button>
            </div>

            <div className="space-y-2">
                {items.map((item) => {
                    const active = selectedPath === item.path;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onSelect(item)}
                            className={`w-full rounded-xl border px-3 py-3 text-left transition ${active
                                ? 'border-sky-700 bg-sky-950/40'
                                : 'border-zinc-800 bg-zinc-950 hover:bg-zinc-800'
                                }`}
                        >
                            <div className="text-sm font-medium text-zinc-100">{item.name}</div>
                            <div className="mt-1 text-xs text-zinc-400">
                                {item.kind} · {new Date(item.createdAt).toLocaleString()}
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}