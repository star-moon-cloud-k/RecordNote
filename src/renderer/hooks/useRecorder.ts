import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RecorderState } from '../../shared/types/recorder';

const formatTime = (seconds: number) => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
};

const buildFileName = (mimeType: string) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

    const ext = mimeType.includes('mp4')
        ? 'mp4'
        : mimeType.includes('ogg')
            ? 'ogg'
            : 'webm';

    return `recording_${timestamp}.${ext}`;
};



export const useRecorder = () => {
    const [status, setStatus] = useState<RecorderState>('idle');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [lastSavedPath, setLastSavedPath] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    const resetTimer = () => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setElapsedSeconds(0);
    };

    const stopTracks = () => {
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
    };

    const startRecording = useCallback(async () => {
        try {
            setErrorMessage(null);
            setLastSavedPath(null);
            setStatus('requesting-permission');

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstart = () => {
                setStatus('recording');
                timerRef.current = window.setInterval(() => {
                    setElapsedSeconds((prev) => prev + 1);
                }, 1000);
            };

            recorder.start();
        } catch (error) {
            setStatus('error');
            setErrorMessage(error instanceof Error ? error.message : String(error));
            stopTracks();
            resetTimer();
        }
    }, []);

    const stopRecording = useCallback(async () => {
        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state === 'inactive') return;

        setStatus('stopping');

        const savePromise = new Promise<void>((resolve) => {
            recorder.onstop = async () => {
                try {
                    resetTimer();
                    setStatus('saving');

                    const mimeType = recorder.mimeType || 'audio/webm';
                    const blob = new Blob(chunksRef.current, { type: mimeType });
                    const arrayBuffer = await blob.arrayBuffer();

                    const result = await window.RecordNote.saveRecording({
                        fileName: buildFileName(mimeType),
                        mimeType,
                        arrayBuffer,
                    });

                    if (!result.success) {
                        throw new Error(result.error || '녹음 파일 저장 실패');
                    }

                    setLastSavedPath(result.filePath ?? null);
                    setStatus('success');
                } catch (error) {
                    setStatus('error');
                    setErrorMessage(error instanceof Error ? error.message : String(error));
                } finally {
                    stopTracks();
                    mediaRecorderRef.current = null;
                    chunksRef.current = [];
                    resolve();
                }
            };
        });

        recorder.stop();
        await savePromise;
    }, []);

    useEffect(() => {
        return () => {
            resetTimer();
            stopTracks();
        };
    }, []);

    return {
        status,
        elapsedSeconds,
        formattedElapsed: useMemo(() => formatTime(elapsedSeconds), [elapsedSeconds]),
        lastSavedPath,
        errorMessage,
        startRecording,
        stopRecording,
    };
};
