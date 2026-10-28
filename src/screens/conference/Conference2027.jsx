import { BackLink } from '../resources/resourcesShared.jsx';
import { CALENDAR_EVENTS } from '../../data/tsaCalendar.js';
import { formatDate, formatDateRange } from '../../data/meta.js';

const conference = CALENDAR_EVENTS.find((e) => e.category === 'conference' && e.startDate.startsWith('2027'));
const deadlines = CALENDAR_EVENTS.filter((e) => e.category === 'event' && e.startDate >= '2027-04-01' && e.startDate < '2027-06-23');

const whenLabel = (e) => (e.endDate && e.endDate !== e.startDate ? formatDateRange(e.startDate, e.endDate) : formatDate(e.startDate));

export default function Conference2027() {
    return (
        <div className="aw-page">
            <BackLink to="/resources" label="Back" />

            <div className="section">
                <h1>2027 National TSA Conference</h1>
            </div>

            <div className="cf26-theme" style={{ marginBottom: 14 }}>Upcoming</div>

            {conference ? (
                <>
                    <p className="cf26-meta">{whenLabel(conference)} &middot; {conference.location || 'Orlando, FL'}</p>
                    <p className="aw-intro">
                        National TSA lists these dates as subject to change. The full 2027 conference guide will be added once TSA shares the official details.
                    </p>
                    <div className="section">
                        <div className="section-head"><h2>Key dates</h2></div>
                        {deadlines.map((e) => (
                            <div className="rec-fact" key={e.id}>
                                <span className="rec-fact-label">{e.title}</span>
                                <span className="rec-fact-value">{whenLabel(e)}</span>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <p className="aw-intro">
                    We&rsquo;ll add the full 2027 National TSA Conference guide once TSA shares the official details.
                </p>
            )}
        </div>
    );
}
