import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './assets/css/core/index.css';

// Some mobile browsers restore the previous scroll position on a hard
// refresh (before React even mounts), which — combined with anything async
// that shifts layout after first paint — can look like the page "jumping"
// on load. Take manual control immediately and force a true top-of-page
// start; the app has its own in-app scroll handling for navigation (e.g.
// Resources.jsx's back-navigation restore) and never depends on the
// browser's native restoration.
if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);