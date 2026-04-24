import Header from './components/Header';
import RecorderPanel from './components/RecorderPanel';
import StatusPanel from './components/StatusPanel';
import LogPanel from './components/LogPanel';

export default function App() {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-6">
                <Header />

                <main className="grid flex-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <section className="flex flex-col gap-6">
                        <RecorderPanel />
                        <LogPanel />
                    </section>

                    <aside className="flex flex-col gap-6">
                        <StatusPanel />
                    </aside>
                </main>
            </div>
        </div>
    );
}