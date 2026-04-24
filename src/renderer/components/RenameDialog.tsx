import { useEffect, useState } from 'react';
import type { RecordNoteFileItem, RenameFileResult } from '../../shared/types/files';

type Props = {
    target: RecordNoteFileItem | null;
    onClose: () => void;
    onDone: (result: RenameFileResult) => void;
};

export default function RenameDialog({ target, onClose, onDone }: Props) {
    const [value, setValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const initialName = target?.kind === 'summary' && target.stem.endsWith('-summary')
            ? target.stem.slice(0, -'-summary'.length)
            : target?.stem ?? '';

        setValue(initialName);
        setError(null);
    }, [target]);

    if (!target) return null;

    const submit = async () => {
        try {
            setSaving(true);
            setError(null);

            const result = await window.RecordNote.renameFile({
                filePath: target.path,
                nextBaseName: value,
            });

            if (!result.success) {
                throw new Error(result.error || '이름 변경 실패');
            }

            onDone(result);
            onClose();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : String(submitError));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
                <h3 className="text-lg font-semibold">파일 이름 변경</h3>
                <p className="mt-2 text-sm text-zinc-400">{target.name}</p>

                <input
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none"
                    placeholder="새 파일 이름"
                />

                {error && <div className="mt-3 text-sm text-amber-300">{error}</div>}

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                    >
                        취소
                    </button>
                    <button
                        onClick={() => void submit()}
                        disabled={saving}
                        className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400 disabled:opacity-50"
                    >
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
}
