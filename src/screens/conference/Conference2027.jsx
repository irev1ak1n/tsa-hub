import { BackLink } from '../resources/resourcesShared.jsx';

// 2027 conference — simple upcoming placeholder (no invented details).
export default function Conference2027() {
    return (
        <div className="aw-page">
            <BackLink to="/resources" label="Back" />

            <div className="section">
                <h1>2027 National TSA Conference</h1>
            </div>

            <div className="cf26-theme" style={{ marginBottom: 14 }}>Upcoming</div>

            <p className="aw-intro">
                We&rsquo;ll add the full 2027 National TSA Conference guide once TSA shares the official details.
            </p>
        </div>
    );
}