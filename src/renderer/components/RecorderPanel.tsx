import { useState } from 'react';
import { useRecorder } from '../hooks/useRecorder';

const getBadge = (status: string) => {
    switch (status) {
        case 'recording':
            return 'border-rose-800 bg-rose-950/80 text-rose-300';
        case 'saving':
        case 'stopping':
        case 'requesting-permission':
            return 'border-sky-800 bg-sky-950/80 text-sky-300';
        case 'transcribing':
            return 'border-violet-800 bg-violet-950/80 text-violet-300';
        case 'success':
            return 'border-emerald-800 bg-emerald-950/80 text-emerald-300';
        case 'error':
            return 'border-amber-800 bg-amber-950/80 text-amber-300';
        default:
            return 'border-zinc-700 bg-zinc-950 text-zinc-300';
    }
};

export default function RecorderPanel() {
    const {
        status,
        formattedElapsed,
        lastSavedPath,
        errorMessage,
        startRecording,
        stopRecording,
    } = useRecorder();

    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcriptionText, setTranscriptionText] = useState<string | null>(null);
    const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
    const [transcriptPath, setTranscriptPath] = useState<string | null>(null);
    const [summaryFilePath, setSummaryFilePath] = useState<string | null>(null);

    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);
    const [summaryData, setSummaryData] = useState<{
        title: string;
        summary: string;
        keyPoints: string[];
        actionItems: { task: string; owner: string; dueDate: string }[];
    } | null>(null);


    //요약 함수
    const runSummarization = async (text: string) => {
        try {
            setIsSummarizing(true);
            setSummaryError(null);
            setSummaryData(null);

            const result = await window.RecordNote.summarizeTranscript({
                transcriptText: text,
                transcriptFilePath: transcriptPath ?? undefined,
            });

            if (!result.success || !result.data) {
                throw new Error(result.error || '요약 실패');
            }

            setSummaryData(result.data);
            setSummaryFilePath(result.summaryFilePath ?? null);
        } catch (error) {
            setSummaryError(error instanceof Error ? error.message : String(error));
        } finally {
            setIsSummarizing(false);
        }
    };


    const isRecording = status === 'recording';
    const canStart = ['idle', 'success', 'error'].includes(status) && !isTranscribing;
    const canStop = status === 'recording';
    const displayStatus = isTranscribing ? 'transcribing' : status;

    const runTranscription = async (sourceFilePath: string) => {
        try {
            setIsTranscribing(true);
            setTranscriptionError(null);
            setTranscriptionText(null);
            setTranscriptPath(null);

            const result = await window.RecordNote.startTranscription({
                sourceFilePath,
            });

            if (!result.success) {
                throw new Error(result.error || '전사 실패');
            }

            setTranscriptionText(result.text ?? '');
            setTranscriptPath(result.transcriptFilePath ?? null);
            const finalText = result.text ?? '';
            setTranscriptionText(finalText);
            setTranscriptPath(result.transcriptFilePath ?? null);

            if (finalText.trim()) {
                await runSummarization(finalText);
            }


        } catch (error) {
            setTranscriptionError(error instanceof Error ? error.message : String(error));
        } finally {
            setIsTranscribing(false);
        }
    };

    return (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold">녹음 컨트롤</h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        녹음 저장 후 자동으로 전사를 수행한다.
                    </p>
                </div>

                <div className={`rounded-full border px-3 py-1 text-xs ${getBadge(displayStatus)}`}>
                    {displayStatus}
                </div>
            </div>

            <div className="mt-8 flex flex-col gap-6">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                    <div className="text-sm text-zinc-400">녹음 시간</div>
                    <div className="mt-2 text-4xl font-semibold tabular-nums">
                        {formattedElapsed}
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => void startRecording()}
                        disabled={!canStart}
                        className="rounded-2xl bg-sky-500 px-5 py-3 font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        녹음 시작
                    </button>

                    <button
                        onClick={async () => {
                            const savedPath = await stopRecording();

                            if (savedPath) {
                                await runTranscription(savedPath);
                            }
                        }}
                        disabled={!canStop}
                        className="rounded-2xl border border-zinc-700 px-5 py-3 font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        녹음 중지
                    </button>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400 space-y-3">
                    {isRecording && <div>현재 마이크 녹음 중이다.</div>}

                    {!isRecording && lastSavedPath && (
                        <div className="break-all text-emerald-300">
                            저장 완료: {lastSavedPath}
                        </div>
                    )}

                    {errorMessage && (
                        <div className="break-all text-amber-300">
                            녹음 오류: {errorMessage}
                        </div>
                    )}

                    {isTranscribing && (
                        <div className="text-violet-300">
                            전사 중...
                        </div>
                    )}

                    {transcriptionError && (
                        <div className="break-all text-amber-300">
                            전사 오류: {transcriptionError}
                        </div>
                    )}

                    {transcriptPath && (
                        <div className="break-all text-sky-300">
                            전사 파일: {transcriptPath}
                        </div>
                    )}

                    {transcriptionText && (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 whitespace-pre-wrap">
                            {transcriptionText}
                        </div>
                    )}

                    {!isRecording && !lastSavedPath && !transcriptionText && !transcriptionError && !errorMessage && (
                        <div>아직 저장된 녹음이 없다.</div>
                    )}
                </div>
            </div>
            {isSummarizing && (
                <div className="text-fuchsia-300">
                    요약 중...
                </div>
            )}

            {summaryError && (
                <div className="break-all text-amber-300">
                    요약 오류: {summaryError}
                </div>
            )}

            {summaryData && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-100 space-y-4">
                    <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500">제목</div>
                        <div className="mt-1 text-base font-semibold">{summaryData.title}</div>
                    </div>

                    <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500">요약</div>
                        <div className="mt-1 whitespace-pre-wrap">{summaryData.summary}</div>
                    </div>

                    <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500">핵심 포인트</div>
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                            {summaryData.keyPoints.map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500">액션 아이템</div>
                        {summaryData.actionItems.length === 0 ? (
                            <div className="mt-2 text-zinc-400">추출된 액션 아이템이 없다.</div>
                        ) : (
                            <ul className="mt-2 space-y-2">
                                {summaryData.actionItems.map((item, index) => (
                                    <li
                                        key={`${item.task}-${index}`}
                                        className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"
                                    >
                                        <div className="font-medium">{item.task}</div>
                                        <div className="mt-1 text-xs text-zinc-400">
                                            담당: {item.owner || '미정'} / 기한: {item.dueDate || '미정'}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                </div>
            )}
            {isSummarizing && (
                <div className="text-fuchsia-300">
                    요약 중...
                </div>
            )}

            {summaryError && (
                <div className="break-all text-amber-300">
                    요약 오류: {summaryError}
                </div>
            )}

            {summaryData && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-100 space-y-4">
                    <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500">제목</div>
                        <div className="mt-1 text-base font-semibold">{summaryData.title}</div>
                    </div>

                    <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500">요약</div>
                        <div className="mt-1 whitespace-pre-wrap">{summaryData.summary}</div>
                    </div>

                    <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500">핵심 포인트</div>
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                            {summaryData.keyPoints.map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <div className="text-xs uppercase tracking-wide text-zinc-500">액션 아이템</div>
                        {summaryData.actionItems.length === 0 ? (
                            <div className="mt-2 text-zinc-400">추출된 액션 아이템이 없다.</div>
                        ) : (
                            <ul className="mt-2 space-y-2">
                                {summaryData.actionItems.map((item, index) => (
                                    <li
                                        key={`${item.task}-${index}`}
                                        className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"
                                    >
                                        <div className="font-medium">{item.task}</div>
                                        <div className="mt-1 text-xs text-zinc-400">
                                            담당: {item.owner || '미정'} / 기한: {item.dueDate || '미정'}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

            )}{summaryFilePath && (
                <div className="break-all text-sky-300">
                    요약 파일: {summaryFilePath}
                </div>
            )}

        </section>
    );
}