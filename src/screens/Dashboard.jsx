import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { Icon } from '../components/UI.jsx';
import SupportButton from '../components/SupportButton.jsx';

export default function Dashboard() {
  const { prefs } = useApp();
  const name = prefs?.name?.trim();

  return (
      <>
        <div className="section">
          <p className="eyebrow">TSA Hub</p>
          <h1>{name ? `Hey, ${name}` : 'Welcome'}</h1>
        </div>

        <div className="section">
          <div className="section-head">
            <h2>Quick actions</h2>
          </div>
          <div className="quick">
            <Link to="/recommend">
              <Icon name="spark" /> Find my events
            </Link>
            <Link to="/coach">
              <Icon name="chat" /> Ask the coach
            </Link>
            <Link to="/coach?tab=search">
              <Icon name="book" /> Search rulebook
            </Link>
            <Link to="/events">
              <Icon name="grid" /> Browse events
            </Link>
          </div>
        </div>

        {/* Floating button — kept OUTSIDE .quick so no card styles apply to it */}
        <SupportButton preset="coach" />
      </>
  );
}