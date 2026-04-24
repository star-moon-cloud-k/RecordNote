import React from 'react';
import ReactDOM from 'react-dom/client';
import '../renderer/styles/index.css';
import App from '../renderer/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);