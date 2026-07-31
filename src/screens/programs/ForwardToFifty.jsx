import { BackLink } from '../resources/resourcesShared.jsx';
import { Icon } from '../../components/UI.jsx';
import { PROGRAMS } from '../../data/programs.js';

// Dedicated page: Forward to Fifty (F2F)
export default function ForwardToFifty() {
    const program = getProgram('forward-to-fifty');
    const url = program?.officialUrl;

    return (
        <>
            <BackLink to="/resources" label="Back" />

            <div className="section">
                <h1>Forward to Fifty (F2F)</h1>
            </div>

            {/* TODO: add content for this program here. */}

            {url && (
                <>
                    <div className="rs-group-label">Official source</div>
                    <div className="rs-card">
                        <a className="rs-row" href={url} target="_blank" rel="noreferrer">
                            <span className="rs-ico"><Icon name="globe" size={20} /></span>
                            <span className="rs-text">
                                <span className="rs-title">View on tsaweb.org</span>
                            </span>
                            <Icon name="chevron-right" size={18} />
                        </a>
                    </div>
                </>
            )}
        </>
    );
}