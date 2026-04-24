import React from 'react';
import ReactDOM from 'react-dom/client';
import './renderer.css';

function App() {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
            <div className="mx-auto max-w-5xl space-y-6">
                <header className="space-y-2">
                    <p className="text-sm font-medium text-sky-400">RecordNote</p>
                    <h1 className="text-4xl font-bold tracking-tight">React + Tailwind 적용 완료</h1>
                    <p className="text-zinc-400">
                        이제 renderer는 React 앱처럼 구현하면 된다.
                    </p>
                </header>

                <section className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
                        <h2 className="text-xl font-semibold">녹음 컨트롤</h2>
                        <p className="mt-2 text-zinc-400">여기에 시작/중지 버튼이 들어간다.</p>
                        <div className="mt-6 flex gap-3">
                            <button className="rounded-xl bg-sky-500 px-4 py-2 font-medium text-white transition hover:bg-sky-400">
                                녹음 시작
                            </button>
                            <button className="rounded-xl border border-zinc-700 px-4 py-2 font-medium text-zinc-200 transition hover:bg-zinc-800">
                                중지
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
                        <h2 className="text-xl font-semibold">작업 상태</h2>
                        <p className="mt-2 text-zinc-400">
                            전사, 요약, Notion 업로드 상태가 여기 표시된다.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);