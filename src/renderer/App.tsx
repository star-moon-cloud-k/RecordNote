import { useState } from 'react';
import RecorderPanel from './components/RecorderPanel';
import FileExplorerPanel from './components/FileExplorerPanel';
import PreviewPanel from './components/PreviewPanel';
import type { RecordNoteFileItem } from '../shared/types/files';

export default function App() {
    const [selectedItem, setSelectedItem] = useState<RecordNoteFileItem | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-6">
                <header className="rounded-3xl border border-zinc-800 bg-zinc-900/80 px-6 py-5 shadow-xl">
                    <p className="text-sm font-medium text-sky-400">RecordNote</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight">
                        로컬 회의 녹음 및 정리
                    </h1>
                </header>

                <RecorderPanel onFilesChanged={() => setRefreshKey((prev) => prev + 1)} />

                <main className="grid flex-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <FileExplorerPanel
                        selectedPath={selectedItem?.path ?? null}
                        onSelect={setSelectedItem}
                        refreshKey={refreshKey}
                    />
                    <PreviewPanel selectedItem={selectedItem} />
                </main>
            </div>
        </div>
    );
}
