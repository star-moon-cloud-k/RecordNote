import { useEffect, useRef } from 'react';

type Props = {
    audioUrl: string | null;
};

export default function AudioWaveform({ audioUrl }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        let closed = false;

        const draw = async () => {
            const canvas = canvasRef.current;
            if (!canvas || !audioUrl) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            try {
                const response = await fetch(audioUrl);
                const blob = await response.blob();
                const arrayBuffer = await blob.arrayBuffer();

                if (closed) return;

                const audioContext = new AudioContext();
                try {
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
                    if (closed) return;

                    const channel = audioBuffer.getChannelData(0);
                    const width = canvas.width;
                    const height = canvas.height;
                    const step = Math.ceil(channel.length / width);
                    const amp = height / 2;

                    ctx.clearRect(0, 0, width, height);
                    ctx.fillStyle = '#09090b';
                    ctx.fillRect(0, 0, width, height);
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 1;
                    ctx.beginPath();

                    for (let i = 0; i < width; i += 1) {
                        let min = 1;
                        let max = -1;

                        for (let j = 0; j < step; j += 1) {
                            const index = i * step + j;
                            if (index >= channel.length) break;
                            const datum = channel[index];
                            if (datum < min) min = datum;
                            if (datum > max) max = datum;
                        }

                        ctx.moveTo(i, (1 + min) * amp);
                        ctx.lineTo(i, (1 + max) * amp);
                    }

                    ctx.stroke();
                } finally {
                    await audioContext.close();
                }
            } catch {
                // Ignore waveform decode errors.
            }
        };

        void draw();

        return () => {
            closed = true;
        };
    }, [audioUrl]);

    return (
        <canvas
            ref={canvasRef}
            width={900}
            height={140}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950"
        />
    );
}
