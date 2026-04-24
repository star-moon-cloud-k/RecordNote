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
        case 'summarizing':
            return 'border-fuchsia-800 bg-fuchsia-950/80 text-fuchsia-300';
        case 'success':
            return 'border-emerald-800 bg-emerald-950/80 text-emerald-300';
        case 'error':
            return 'border-amber-800 bg-amber-950/80 text-amber-300';
        default:
            return 'border-zinc-700 bg-zinc-950 text-zinc-300';
    }
};

type SummaryData = {
    title: string;
    summary: string;
    keyPoints: string[];
    actionItems: { task: string; owner: string; dueDate: string }[];
};

type Props = {
    onFilesChanged?: () => void;
};

export default function RecorderPanel({ onFilesChanged }: Props) {
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

    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
    const [summaryFilePath, setSummaryFilePath] = useState<string | null>(null);
    const [copyMessage, setCopyMessage] = useState<string | null>(null);

    const isRecording = status === 'recording';
    const canStart =
        ['idle', 'success', 'error'].includes(status) &&
        !isTranscribing &&
        !isSummarizing;
    const canStop = status === 'recording';

    const displayStatus = isSummarizing
        ? 'summarizing'
        : isTranscribing
            ? 'transcribing'
            : status;

    const copyText = async (text: string, label: string) => {
        const result = await window.RecordNote.copyToClipboard(text);
        setCopyMessage(result.success ? `${label}을(를) 복사했다.` : `복사 실패: ${result.error ?? '알 수 없는 오류'}`);
    };

    const copyFileContent = async (filePath: string, label: string) => {
        const readResult = await window.RecordNote.readFile(filePath);
        if (!readResult.success || !readResult.content) {
            setCopyMessage(`복사 실패: ${readResult.error ?? '파일 내용을 읽지 못했다.'}`);
            return;
        }

        await copyText(readResult.content, label);
    };

    const runSummarization = async (
        text: string,
        transcriptFilePath?: string | null,
        transcriptSrtFilePath?: string | null,
    ) => {
        try {
            setIsSummarizing(true);
            setSummaryError(null);
            setSummaryData(null);
            setSummaryFilePath(null);

            const result = await window.RecordNote.summarizeTranscript({
                transcriptText: text,
                transcriptFilePath: transcriptFilePath ?? undefined,
                transcriptSrtFilePath: transcriptSrtFilePath ?? undefined,
            });

            if (!result.success || !result.data) {
                throw new Error(result.error || '요약 실패');
            }

            setSummaryData(result.data);
            setSummaryFilePath(result.summaryFilePath ?? null);
            onFilesChanged?.();
        } catch (error) {
            setSummaryError(error instanceof Error ? error.message : String(error));
        } finally {
            setIsSummarizing(false);
        }
    };

    const runTranscription = async (sourceFilePath: string) => {
        try {
            setIsTranscribing(true);
            setTranscriptionError(null);
            setTranscriptionText(null);
            setTranscriptPath(null);
            setSummaryError(null);
            setSummaryData(null);
            setSummaryFilePath(null);

            const result = await window.RecordNote.startTranscription({
                sourceFilePath,
            });

            if (!result.success) {
                throw new Error(result.error || '전사 실패');
            }

            const finalText = result.text ?? '';
            const finalTranscriptPath = result.transcriptFilePath ?? null;
            const finalTranscriptSrtPath = result.transcriptSrtFilePath ?? null;

            setTranscriptionText(finalText);
            setTranscriptPath(finalTranscriptPath);
            onFilesChanged?.();

            if (finalText.trim()) {
                await runSummarization(finalText, finalTranscriptPath, finalTranscriptSrtPath);
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
                        녹음 저장 후 자동으로 전사와 요약을 수행한다.
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
                    {copyMessage && (
                        <div className="rounded-lg border border-sky-800 bg-sky-950/40 px-3 py-2 text-xs text-sky-300">
                            {copyMessage}
                        </div>
                    )}

                    {isRecording && <div>현재 마이크 녹음 중이다.</div>}

                    {!isRecording && lastSavedPath && (
                        <div className="space-y-2">
                            <div className="break-all text-emerald-300">
                                저장 완료: {lastSavedPath}
                            </div>
                            <button
                                onClick={() => void copyText(lastSavedPath, '녹음 파일 경로')}
                                className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800"
                            >
                                경로 복사
                            </button>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="break-all text-amber-300">
                            녹음 오류: {errorMessage}
                        </div>
                    )}

                    {isTranscribing && <div className="text-violet-300">전사 중...</div>}

                    {transcriptionError && (
                        <div className="break-all text-amber-300">
                            전사 오류: {transcriptionError}
                        </div>
                    )}

                    {transcriptPath && (
                        <div className="space-y-2">
                            <div className="break-all text-sky-300">
                                전사 파일: {transcriptPath}
                            </div>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => void copyText(transcriptPath, '전사 파일 경로')}
                                    className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800"
                                >
                                    경로 복사
                                </button>
                                <button
                                    onClick={() => void copyFileContent(transcriptPath, '전사 파일 내용')}
                                    className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800"
                                >
                                    내용 복사
                                </button>
                            </div>
                        </div>
                    )}

                    {transcriptionText && (
                        <div className="space-y-2">
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 whitespace-pre-wrap">
                                {transcriptionText}
                            </div>
                            <button
                                onClick={() => void copyText(transcriptionText, '전사 텍스트')}
                                className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800"
                            >
                                전사 텍스트 복사
                            </button>
                        </div>
                    )}

                    {isSummarizing && <div className="text-fuchsia-300">요약 중...</div>}

                    {summaryError && (
                        <div className="break-all text-amber-300">
                            요약 오류: {summaryError}
                        </div>
                    )}

                    {summaryFilePath && (
                        <div className="space-y-2">
                            <div className="break-all text-sky-300">
                                요약 파일: {summaryFilePath}
                            </div>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => void copyText(summaryFilePath, '요약 파일 경로')}
                                    className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800"
                                >
                                    경로 복사
                                </button>
                                <button
                                    onClick={() => void copyFileContent(summaryFilePath, '요약 파일 내용')}
                                    className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800"
                                >
                                    내용 복사
                                </button>
                            </div>
                        </div>
                    )}

                    {summaryData && (
                        <div className="space-y-2">
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
                            <button
                                onClick={() => void copyText(JSON.stringify(summaryData, null, 2), '요약 JSON')}
                                className="rounded-md border border-zinc-700 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800"
                            >
                                요약 JSON 복사
                            </button>
                        </div>
                    )}

                    {!isRecording &&
                        !lastSavedPath &&
                        !transcriptionText &&
                        !transcriptionError &&
                        !errorMessage &&
                        !summaryError &&
                        !summaryData && <div>아직 저장된 녹음이 없다.</div>}
                </div>
            </div>
        </section>
    );
}
