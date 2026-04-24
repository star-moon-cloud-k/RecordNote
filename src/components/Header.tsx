export default function Header() {
    return (
        <header className="rounded-3xl border border-zinc-800 bg-zinc-900/80 px-6 py-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-sky-400">RecordNote</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight">
                        로컬 회의 녹음 및 정리
                    </h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        녹음, 전사, 요약, Notion 업로드를 한 앱에서 처리한다.
                    </p>
                </div>

                <div className="rounded-full border border-emerald-800 bg-emerald-950/80 px-3 py-1 text-xs font-medium text-emerald-300">
                    준비됨
                </div>
            </div>
        </header>
    );
}