const logs = [
    '[10:58:12] 앱 시작',
    '[10:58:13] 작업 디렉터리 확인 완료',
    '[10:58:13] 대기 중',
];

export default function LogPanel() {
    return (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <h2 className="text-xl font-semibold">최근 로그</h2>
            <p className="mt-2 text-sm text-zinc-400">
                앱 내부 상태와 처리 이력을 여기에 표시한다.
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