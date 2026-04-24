type LogPanelProps = {
    logs: string[];
};

export default function LogPanel({ logs }: LogPanelProps) {
    return (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <h2 className="text-xl font-semibold">최근 로그</h2>
            <p className="mt-2 text-sm text-zinc-400">
                앱 내부 상태와 초기화 이력을 표시한다.
            </p>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="space-y-2 font-mono text-sm text-zinc-300">
                    {logs.map((log) => (
                        <div key={log}>{log}</div>
                    ))}
                </div>
            </div>
        </section>
    );
}