import { BackLink } from './resourcesShared.jsx';
import { NATIONAL_OFFICERS } from '../../data/nationalOfficers.js';

// Same glob-by-filename pattern already used for these photos in
// ConferenceTopicPage.jsx — keyed by filename (without extension) so it
// lines up directly with each officer's `img` field.
const OFFICER_IMAGES = import.meta.glob('../../assets/img/national-officers/*.png', { eager: true });
const officerImg = {};
for (const path in OFFICER_IMAGES) {
    const file = path.split('/').pop().replace(/\.png$/i, '');
    officerImg[file] = OFFICER_IMAGES[path].default || OFFICER_IMAGES[path];
}

export default function NationalOfficers() {
    return (
        <>
            <BackLink />

            <div className="section">
                <p className="rs-eyebrow">National TSA</p>
                <h1 className="cal-h1">National TSA Officers</h1>
                <p className="muted small" style={{ margin: 0 }}>
                    Meet the students elected to lead National TSA for 2026-2027.
                </p>
            </div>

            <div className="no-list">
                {NATIONAL_OFFICERS.map((o) => (
                    <div key={o.id} className="no-card">
                        {officerImg[o.img] ? (
                            <img className="no-photo" src={officerImg[o.img]} alt={o.name} />
                        ) : (
                            <div className="no-photo" aria-hidden="true" />
                        )}
                        <div className="no-body">
                            <p className="rs-eyebrow" style={{ marginBottom: 2 }}>{o.role}</p>
                            <h2 className="no-name">{o.name}</h2>
                            <p className="no-meta">{o.school}</p>
                            <p className="no-meta no-meta-muted">{o.location}</p>
                            {o.email && (
                                <a className="no-email" href={`mailto:${o.email}`}>{o.email}</a>
                            )}
                            {o.bio && o.bio.map((paragraph, i) => (
                                <p key={i} className={`no-bio ${i === 0 ? 'no-bio-first' : ''}`}>{paragraph}</p>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
