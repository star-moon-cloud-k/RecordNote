import type { WorkspaceState } from '../../shared/types/workspace';

type StatusPanelProps = {
    loading: boolean;
    error: string | null;
    workspace: WorkspaceState | null;
};

function Item({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {label}
            </div>
            <div className="mt-2 break-all text-sm text-zinc-200">{value}</div>
        </div>
    );
}

export default function StatusPanel({
    loading,
    error,
    workspace,
}: StatusPanelProps) {
    return (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <h2 className="text-xl font-semibold">작업 상태</h2>
            <p className="mt-2 text-sm text-zinc-400">
                실행 시점에 작업 디렉터리를 자동 확인한다.
            </p>

            <div className="mt-6 space-y-3">
                {loading && (
                    <div className="rounded-2xl border border-sky-800 bg-sky-950/60 px-4 py-3 text-sm text-sky-300">
                        작업 디렉터리를 확인하는 중이다.
                    </div>
                )}

                {error && (
                    <div className="rounded-2xl border border-rose-800 bg-rose-950/60 px-4 py-3 text-sm text-rose-300">
                        {error}
                    </div>
                )}

                {workspace && (
                    <>
                        <Item label="Base Directory" value={workspace.paths.baseDir} />
                        <Item label="Recordings" value={workspace.paths.recordingsDir} />
                        <Item label="Processing" value={workspace.paths.processingDir} />
                        <Item label="Transcripts" value={workspace.paths.transcriptsDir} />
                        <Item label="Summaries" value={workspace.paths.summariesDir} />
                        <Item label="Logs" value={workspace.paths.logsDir} />
                        <Item label="Models" value={workspace.paths.modelsDir} />
                    </>
                )}
            </div>
        </section>
    );
}