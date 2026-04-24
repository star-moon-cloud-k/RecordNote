const steps = [
    { name: '작업 디렉터리 확인', status: 'done' },
    { name: '녹음 파일 저장', status: 'idle' },
    { name: '전사 실행', status: 'idle' },
    { name: '로컬 요약 생성', status: 'idle' },
    { name: 'Notion 업로드', status: 'idle' },
];

function getStatusClass(status: string) {
    switch (status) {
        case 'done':
            return 'border-emerald-800 bg-emerald-950/60 text-emerald-300';
        case 'running':
            return 'border-sky-800 bg-sky-950/60 text-sky-300';
        case 'error':
            return 'border-rose-800 bg-rose-950/60 text-rose-300';
        default:
            return 'border-zinc-800 bg-zinc-950 text-zinc-400';
    }
}

export default function StatusPanel() {
    return (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <h2 className="text-xl font-semibold">작업 상태</h2>
            <p className="mt-2 text-sm text-zinc-400">
                녹음 이후 처리 파이프라인의 현재 상태를 표시한다.
            </p>

            <div className="mt-6 space-y-3">
                {steps.map((step) => (
                    <div
                        key={step.name}
                        className={`rounded-2xl border px-4 py-3 text-sm ${getStatusClass(step.status)}`}
                    >
                        {step.name}
                    </div>
                ))}
            </div>
        </section>
    );
}