import { useState } from 'react';
import type { RecordNoteFileItem } from '../../shared/types/files';

type Props = {
    title: string;
    items: RecordNoteFileItem[];
    selectedPath: string | null;
    onSelect: (item: RecordNoteFileItem) => void;
    onRename: (item: RecordNoteFileItem) => void;
    onDelete: (item: RecordNoteFileItem) => void;
    defaultOpen?: boolean;
};

export default function FileGroupDropdown({
    title,
    items,
    selectedPath,
    onSelect,
    onRename,
    onDelete,
    defaultOpen = false,
}: Props) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60">
            <button
                onClick={() => setOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left"
            >
                <div>
                    <div className="text-sm font-semibold text-zinc-100">{title}</div>
                    <div className="text-[11px] text-zinc-500">{items.length}개</div>
                </div>
                <div className="text-xs text-zinc-400">{open ? '접기' : '펼치기'}</div>
            </button>

            {open && (
                <div className="space-y-2 border-t border-zinc-800 p-2.5">
                    {items.length === 0 ? (
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-500">
                            파일 없음
                        </div>
                    ) : (
                        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                            {items.map((item) => {
                                const active = selectedPath === item.path;

                                return (
                                    <div
                                        key={item.id}
                                        className={`rounded-lg border p-2 ${active
                                            ? 'border-sky-700 bg-sky-950/30'
                                            : 'border-zinc-800 bg-zinc-900/70'
                                            }`}
                                    >
                                        <button onClick={() => onSelect(item)} className="w-full text-left">
                                            <div className="truncate text-xs font-medium text-zinc-100">
                                                {item.name}
                                            </div>
                                            <div className="mt-1 text-[11px] text-zinc-400">
                                                {new Date(item.updatedAt).toLocaleString()}
                                            </div>
                                        </button>

                                        <div className="mt-2 flex gap-1.5">
                                            <button
                                                onClick={() => onRename(item)}
                                                className="rounded-md border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-300 hover:bg-zinc-800"
                                            >
                                                이름
                                            </button>
                                            <button
                                                onClick={() => onDelete(item)}
                                                className="rounded-md border border-rose-800 px-2 py-0.5 text-[11px] text-rose-300 hover:bg-rose-950/40"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
