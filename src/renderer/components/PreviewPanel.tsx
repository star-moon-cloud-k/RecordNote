import { useEffect, useState } from 'react';
import type { RecordNoteFileItem } from '../../shared/types/files';

type Props = {
    selectedItem: RecordNoteFileItem | null;
};

export default function PreviewPanel({ selectedItem }: Props) {
    const [content, setContent] = useState<string>('');

    useEffect(() => {
        const load = async () => {
            if (!selectedItem) {
                setContent('');
                return;
            }

            const result = await window.RecordNote.readFile(selectedItem.path);
            setContent(result.success ? result.content ?? '' : result.error ?? '');
        };

        void load();
    }, [selectedItem]);

    return (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">미리보기</h2>

            {!selectedItem ? (
                <div className="text-sm text-zinc-400">파일을 선택해라.</div>
            ) : (
                <div className="space-y-3">
                    <div className="text-sm text-zinc-400">{selectedItem.path}</div>
                    <pre className="whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-100">
                        {content}
                    </pre>
                </div>
            )}
        </section>
    );
}