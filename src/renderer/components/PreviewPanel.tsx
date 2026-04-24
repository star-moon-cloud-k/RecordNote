import { useEffect, useState } from 'react';
import type { RecordNoteFileItem } from '../../shared/types/files';
import AudioWaveform from './AudioWaveform';

type Props = {
    selectedItem: RecordNoteFileItem | null;
};

export default function PreviewPanel({ selectedItem }: Props) {
    const [content, setContent] = useState('');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const formatDuration = (seconds: number) => {
        if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
        const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
        const ss = String(Math.floor(seconds % 60)).padStart(2, '0');
        return `${mm}:${ss}`;
    };

    useEffect(() => {
        const load = async () => {
            if (!selectedItem) {
                setContent('');
                setAudioUrl(null);
                setCurrentTime(0);
                setDuration(0);
                return;
            }

            if (selectedItem.kind === 'recording') {
                setContent('');
                setCurrentTime(0);
                setDuration(0);
                const result = await window.RecordNote.getAudioFileUrl(selectedItem.path);
                if (!result.success || !result.fileUrl) {
                    setAudioUrl(null);
                    return;
                }

                setAudioUrl(result.fileUrl);
                return;
            }

            setAudioUrl(null);
            setCurrentTime(0);
            setDuration(0);
            const result = await window.RecordNote.readFile(selectedItem.path);
            setContent(result.success ? result.content ?? '' : result.error ?? '');
        };

        void load();
    }, [selectedItem]);

    const renderSummaryContent = () => {
        try {
            const parsed = JSON.parse(content) as { data?: unknown };
            const data = (parsed?.data ?? parsed) as {
                title?: string;
                summary?: string;
                keyPoints?: string[];
                actionItems?: { task?: string; owner?: string; dueDate?: string }[];
            };

            return (
                <div className="space-y-4">
                    <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500">제목</div>
                        <div className="mt-1 text-lg font-semibold">{data?.title ?? ''}</div>
                    </div>

                    <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500">요약</div>
                        <div className="mt-1 whitespace-pre-wrap">{data?.summary ?? ''}</div>
                    </div>

                    <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500">핵심 포인트</div>
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                            {(data?.keyPoints ?? []).map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500">액션 아이템</div>
                        <ul className="mt-2 space-y-2">
                            {(data?.actionItems ?? []).map((item, index) => (
                                <li
                                    key={`${item?.task}-${index}`}
                                    className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"
                                >
                                    <div className="font-medium">{item?.task ?? ''}</div>
                                    <div className="mt-1 text-xs text-zinc-400">
                                        담당: {item?.owner || '미정'} / 기한: {item?.dueDate || '미정'}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            );
        } catch {
            return (
                <pre className="whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-100">
                    {content}
                </pre>
            );
        }
    };

    return (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">미리보기</h2>

            {!selectedItem ? (
                <div className="text-sm text-zinc-400">파일을 선택해라.</div>
            ) : (
                <div className="space-y-4">
                    <div className="text-sm text-zinc-400">{selectedItem.path}</div>

                    {selectedItem.kind === 'recording' ? (
                        audioUrl ? (
                            <div className="space-y-4">
                                <audio
                                    controls
                                    src={audioUrl}
                                    className="w-full"
                                    onLoadedMetadata={(event) => {
                                        setDuration(event.currentTarget.duration || 0);
                                    }}
                                    onTimeUpdate={(event) => {
                                        setCurrentTime(event.currentTarget.currentTime || 0);
                                    }}
                                />
                                <div className="text-xs text-zinc-400">
                                    재생 시간: {formatDuration(currentTime)} / {formatDuration(duration)}
                                </div>
                                <AudioWaveform audioUrl={audioUrl} />
                            </div>
                        ) : (
                            <div className="text-sm text-zinc-400">
                                오디오를 불러오는 중이거나 실패했다.
                            </div>
                        )
                    ) : selectedItem.kind === 'summary' ? (
                        renderSummaryContent()
                    ) : (
                        <pre className="whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-100">
                            {content}
                        </pre>
                    )}
                </div>
            )}
        </section>
    );
}
