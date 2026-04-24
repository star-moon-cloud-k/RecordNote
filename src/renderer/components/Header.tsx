type HeaderProps = {
    loading: boolean;
    ready: boolean;
    error: string | null;
};

export default function Header({ loading, ready, error }: HeaderProps) {
    const badge = error
        ? {
            text: '오류',
            className: 'border-rose-800 bg-rose-950/80 text-rose-300',
        }
        : loading
            ? {
                text: '초기화 중',
                className: 'border-sky-800 bg-sky-950/80 text-sky-300',
            }
            : ready
                ? {
                    text: '준비됨',
                    className: 'border-emerald-800 bg-emerald-950/80 text-emerald-300',
                }
                : {
                    text: '대기',
                    className: 'border-zinc-700 bg-zinc-900 text-zinc-300',
                };

    return (
        <header className="rounded-3xl border border-zinc-800 bg-zinc-900/80 px-6 py-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-sky-400">RecordNote</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight">
                        로컬 회의 녹음 및 정리
                    </h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        실행 시 작업 디렉터리를 확인하고, 이후 녹음·전사·요약 파이프라인으로 이어진다.
                    </p>
                </div>

                <div
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${badge.className}`}
                >
                    {badge.text}
                </div>
            </div>
        </header>
    );
}