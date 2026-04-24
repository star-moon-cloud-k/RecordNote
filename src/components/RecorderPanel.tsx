export default function RecorderPanel() {
    return (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold">녹음 컨트롤</h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        마이크 입력을 받아 회의 녹음을 시작하고 종료한다.
                    </p>
                </div>

                <div className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs text-zinc-300">
                    idle
                </div>
            </div>

            <div className="mt-8 flex flex-col gap-6">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                    <div className="text-sm text-zinc-400">녹음 시간</div>
                    <div className="mt-2 text-4xl font-semibold tabular-nums">00:00</div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button className="rounded-2xl bg-sky-500 px-5 py-3 font-medium text-white transition hover:bg-sky-400">
                        녹음 시작
                    </button>
                    <button className="rounded-2xl border border-zinc-700 px-5 py-3 font-medium text-zinc-200 transition hover:bg-zinc-800">
                        녹음 중지
                    </button>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
                    아직 녹음이 시작되지 않았다.
                </div>
            </div>
        </section>
    );
}