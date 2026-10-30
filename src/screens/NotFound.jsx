import { Link } from 'react-router-dom';
import { Icon } from '../components/UI.jsx';

export default function NotFound() {
    return (
        <div className="nf-page">
            <div className="nf-code" aria-hidden="true">404</div>
            <h1 className="nf-title">Page Not Found</h1>
            <p className="nf-text">The page you're looking for doesn't exist or may have moved.</p>
            <div className="nf-actions">
                <Link to="/" className="btn primary">
                    <Icon name="home" size={18} />
                    Back to Home
                </Link>
                <Link to="/events" className="btn ghost">
                    <Icon name="grid" size={18} />
                    Explore Events
                </Link>
            </div>
        </div>
    );
}
