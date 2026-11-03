import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '@fontsource/chakra-petch/500.css';
import '@fontsource/chakra-petch/600.css';
import '@fontsource/chakra-petch/700.css';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import './assets/css/core/index.css';
import './assets/css/native.css';
import { initNative } from './native/init.js';

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

initNative();
