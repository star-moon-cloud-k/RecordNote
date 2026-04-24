import { useRecorder } from '../hooks/useRecorder';
import { useState } from 'react';

const getBadge = (status: string) => {
    switch (status) {
        case 'recording':
            return 'border-rose-800 bg-rose-950/80 text-rose-300';
        case 'saving':
        case 'stopping':
        case 'requesting-permission':
            return 'border-sky-800 bg-sky-950/80 text-sky-300';
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

    const isRecording = status === 'recording';
    const canStart = ['idle', 'success', 'error'].includes(status);
    const canStop = ['recording'].includes(status);
    const [transcriptionText, setTranscriptionText] = useState<string | null>(null);
    const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);


    return (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold">녹음 컨트롤</h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        마이크 입력을 받아 로컬 작업 디렉터리에 녹음 파일을 저장한다.
                    </p>
                </div>

                <div className={`rounded-full border px-3 py-1 text-xs ${getBadge(status)}`}>
                    {status}
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
                        onClick={() => void stopRecording()}
                        disabled={!canStop}
                        className="rounded-2xl border border-zinc-700 px-5 py-3 font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        녹음 중지
                    </button>
                </div>
                <button
                    disabled={!lastSavedPath || isTranscribing}
                    onClick={async () => {
                        if (!lastSavedPath) return;

                        try {
                            setIsTranscribing(true);
                            setTranscriptionError(null);
                            setTranscriptionText(null);

                            const result = await window.RecordNote.startTranscription({
                                sourceFilePath: lastSavedPath,
                            });

                            console.log('transcription result:', result);

                            if (!result.success) {
                                throw new Error(result.error || '전사 실패');
                            }

                            setTranscriptionText(result.text ?? '');
                        } catch (error) {
                            setTranscriptionError(error instanceof Error ? error.message : String(error));
                        } finally {
                            setIsTranscribing(false);
                        }
                    }}
                    className="rounded-2xl border border-zinc-700 px-5 py-3 font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isTranscribing ? '전사 중...' : '전사 시작'}
                    {transcriptionError && (
                        <div className="mt-3 break-all text-amber-300">
                            전사 오류: {transcriptionError}
                        </div>
                    )}

                    {transcriptionText && (
                        <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-200 whitespace-pre-wrap">
                            {transcriptionText}
                        </div>
                    )}
                </button>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
                    {isRecording && <div>현재 마이크 녹음 중이다.</div>}
                    {!isRecording && lastSavedPath && (
                        <div className="break-all text-emerald-300">
                            저장 완료: {lastSavedPath}
                        </div>
                    )}
                    {!isRecording && errorMessage && (
                        <div className="break-all text-amber-300">
                            오류: {errorMessage}
                        </div>
                    )}
                    {!isRecording && !lastSavedPath && !errorMessage && (
                        <div>아직 저장된 녹음이 없다.</div>
                    )}
                </div>
            </div>
        </section>
    );
}