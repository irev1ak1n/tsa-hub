import { Component } from 'react';

// Last-resort screen so an unexpected render error shows a way out instead of
// a blank white page. Reuses the 404 page styling.
export default class ErrorBoundary extends Component {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error) {
        console.error('TSA Hub crashed while rendering:', error?.message);
    }

    render() {
        if (!this.state.failed) return this.props.children;
        return (
            <div className="nf-page" role="alert">
                <h1 className="nf-title">Something went wrong</h1>
                <p className="nf-text">TSA Hub hit an unexpected problem. Reloading usually fixes it.</p>
                <div className="nf-actions">
                    <button type="button" className="btn primary" onClick={() => window.location.assign('/')}>
                        Reload TSA Hub
                    </button>
                </div>
            </div>
        );
    }
}
