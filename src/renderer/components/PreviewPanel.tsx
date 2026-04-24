import { useEffect, useMemo, useRef, useState } from 'react';
import type { RecordNoteFileItem } from '../../shared/types/files';
import AudioWaveform from './AudioWaveform';

type Props = {
    selectedItem: RecordNoteFileItem | null;
};

type SubtitleCue = {
    index: number;
    start: number;
    end: number;
    text: string;
};

const parseSrtTimestamp = (value: string) => {
    const match = value.trim().match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/);
    if (!match) return null;

    const [, hh, mm, ss, ms] = match;
    return (
        Number(hh) * 3600 +
        Number(mm) * 60 +
        Number(ss) +
        Number(ms) / 1000
    );
};

const parseSrtCues = (srt: string): SubtitleCue[] => {
    const blocks = srt
        .split(/\r?\n\r?\n+/)
        .map((block) => block.trim())
        .filter(Boolean);

    const cues: SubtitleCue[] = [];

    for (const block of blocks) {
        const lines = block
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        if (lines.length < 2) continue;

        const hasTimeAtFirstLine = lines[0]?.includes('-->');
        const timingLine = hasTimeAtFirstLine ? lines[0] : lines[1];
        const textStart = hasTimeAtFirstLine ? 1 : 2;

        if (!timingLine || !timingLine.includes('-->')) continue;

        const [startRaw, endRaw] = timingLine.split('-->').map((part) => part.trim());
        if (!startRaw || !endRaw) continue;

        const start = parseSrtTimestamp(startRaw);
        const end = parseSrtTimestamp(endRaw);
        if (start === null || end === null || end <= start) continue;

        const text = lines.slice(textStart).join(' ').trim();
        if (!text) continue;

        cues.push({
            index: cues.length,
            start,
            end,
            text,
        });
    }

    return cues;
};

export default function PreviewPanel({ selectedItem }: Props) {
    const [content, setContent] = useState('');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [copyMessage, setCopyMessage] = useState<string | null>(null);
    const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
    const [subtitlePath, setSubtitlePath] = useState<string | null>(null);
    const [subtitleError, setSubtitleError] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const subtitleListRef = useRef<HTMLDivElement | null>(null);

    const formatDuration = (seconds: number) => {
        if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';

        const totalSeconds = Math.floor(seconds);
        const hh = Math.floor(totalSeconds / 3600);
        const mm = Math.floor((totalSeconds % 3600) / 60);
        const ss = totalSeconds % 60;

        if (hh > 0) {
            return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
        }

        return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    };

    const activeCueIndex = useMemo(() => {
        if (subtitleCues.length === 0) return -1;

        const index = subtitleCues.findIndex((cue) => {
            return currentTime >= cue.start && currentTime <= cue.end;
        });

        return index;
    }, [currentTime, subtitleCues]);

    useEffect(() => {
        const container = subtitleListRef.current;
        if (!container || activeCueIndex < 0) return;

        const activeNode = container.querySelector<HTMLElement>(`[data-cue-index="${activeCueIndex}"]`);
        activeNode?.scrollIntoView({ block: 'nearest' });
    }, [activeCueIndex]);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            if (!selectedItem) {
                setContent('');
                setAudioUrl(null);
                setCurrentTime(0);
                setDuration(0);
                setSubtitleCues([]);
                setSubtitlePath(null);
                setSubtitleError(null);
                return;
            }

            if (selectedItem.kind === 'recording') {
                setContent('');
                setCurrentTime(0);
                setDuration(0);
                setSubtitleCues([]);
                setSubtitlePath(null);
                setSubtitleError(null);

                const [audioResult, subtitleResult] = await Promise.all([
                    window.RecordNote.getAudioFileUrl(selectedItem.path),
                    window.RecordNote.readSubtitleForRecording(selectedItem.path),
                ]);

                if (!cancelled) {
                    if (audioResult.success && audioResult.fileUrl) {
                        setAudioUrl(audioResult.fileUrl);
                    } else {
                        setAudioUrl(null);
                    }

                    if (subtitleResult.success && subtitleResult.content) {
                        setSubtitlePath(subtitleResult.path);
                        setSubtitleCues(parseSrtCues(subtitleResult.content));
                        setSubtitleError(null);
                    } else {
                        setSubtitlePath(null);
                        setSubtitleCues([]);
                        setSubtitleError(subtitleResult.error ?? 'SRT 파일을 찾지 못했다.');
                    }
                }

                return;
            }

            setAudioUrl(null);
            setCurrentTime(0);
            setDuration(0);
            setSubtitleCues([]);
            setSubtitlePath(null);
            setSubtitleError(null);

            const result = await window.RecordNote.readFile(selectedItem.path);
            if (!cancelled) {
                setContent(result.success ? result.content ?? '' : result.error ?? '');
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
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

    const copyText = async (text: string, label: string) => {
        const result = await window.RecordNote.copyToClipboard(text);
        setCopyMessage(result.success ? `${label}을(를) 복사했다.` : `복사 실패: ${result.error ?? '알 수 없는 오류'}`);
    };

    return (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">미리보기</h2>
                {selectedItem && (
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => void copyText(selectedItem.path, '경로')}
                            className="rounded-lg border border-zinc-700 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800"
                        >
                            경로 복사
                        </button>
                        {selectedItem.kind !== 'recording' && (
                            <button
                                onClick={() => void copyText(content, '내용')}
                                className="rounded-lg border border-zinc-700 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800"
                            >
                                내용 복사
                            </button>
                        )}
                    </div>
                )}
            </div>

            {copyMessage && (
                <div className="mb-4 rounded-lg border border-sky-800 bg-sky-950/40 px-3 py-2 text-xs text-sky-300">
                    {copyMessage}
                </div>
            )}

            {!selectedItem ? (
                <div className="text-sm text-zinc-400">파일을 선택해라.</div>
            ) : (
                <div className="space-y-4">
                    <div className="text-sm text-zinc-400">{selectedItem.path}</div>

                    {selectedItem.kind === 'recording' ? (
                        audioUrl ? (
                            <div className="space-y-4">
                                <audio
                                    ref={audioRef}
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

                                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-zinc-200">실시간 자막 하이라이트</h3>
                                        {subtitlePath && (
                                            <span className="text-[11px] text-zinc-500">{subtitlePath}</span>
                                        )}
                                    </div>

                                    {subtitleCues.length > 0 ? (
                                        <div
                                            ref={subtitleListRef}
                                            className="max-h-64 space-y-1 overflow-y-auto pr-1"
                                        >
                                            {subtitleCues.map((cue) => {
                                                const isActive = cue.index === activeCueIndex;

                                                return (
                                                    <button
                                                        key={`${cue.index}-${cue.start}`}
                                                        data-cue-index={cue.index}
                                                        onClick={() => {
                                                            if (audioRef.current) {
                                                                audioRef.current.currentTime = cue.start;
                                                            }
                                                        }}
                                                        className={`w-full rounded-lg border px-3 py-2 text-left transition ${isActive
                                                            ? 'border-sky-700 bg-sky-950/40 text-sky-100'
                                                            : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                                                            }`}
                                                    >
                                                        <div className="mb-1 text-[11px] text-zinc-500">
                                                            {formatDuration(cue.start)} - {formatDuration(cue.end)}
                                                        </div>
                                                        <div className="text-sm leading-relaxed">{cue.text}</div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-zinc-500">
                                            {subtitleError ?? '연결된 SRT 자막이 아직 없다.'}
                                        </div>
                                    )}
                                </div>
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
