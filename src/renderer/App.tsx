import { useEffect, useState } from 'react';
import Header from './components/Header';
import RecorderPanel from './components/RecorderPanel';
import StatusPanel from './components/StatusPanel';
import LogPanel from './components/LogPanel';
import type { WorkspaceState } from '../shared/types/workspace';

export default function App() {
    const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        const loadWorkspace = async () => {
            try {
                const state = await window.RecordNote.getWorkspaceState();
                setWorkspace(state);
            } catch (error) {
                setLoadError(error instanceof Error ? error.message : String(error));
            } finally {
                setLoading(false);
            }
        };

        void loadWorkspace();
    }, []);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-6">
                <Header
                    loading={loading}
                    ready={workspace?.ready ?? false}
                    error={loadError}
                />

                <main className="grid flex-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <section className="flex flex-col gap-6">
                        <RecorderPanel />
                        <LogPanel
                            logs={[
                                '[boot] RecordNote started',
                                loading
                                    ? '[workspace] checking workspace directories...'
                                    : loadError
                                        ? `[workspace] failed: ${loadError}`
                                        : `[workspace] ready: ${workspace?.paths.baseDir ?? ''}`,
                            ]}
                        />
                    </section>

                    <aside className="flex flex-col gap-6">
                        <StatusPanel
                            loading={loading}
                            error={loadError}
                            workspace={workspace}
                        />
                    </aside>
                </main>
            </div>
        </div>
    );
}