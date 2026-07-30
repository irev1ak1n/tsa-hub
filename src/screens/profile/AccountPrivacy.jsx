import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { Icon } from "../../components/UI.jsx";

export default function AccountPrivacy() {
    const navigate = useNavigate();
    const { profile, saveProfile } = useApp();
    const isPrivate = !!profile?.isPrivate;

    return (
        <>
            <div className="set-head">
                <button className="set-back" onClick={() => navigate('/settings')} aria-label="Back">
                    <Icon name="arrow-left" size={22} />
                </button>
                <h1 className="set-title">Account privacy</h1>
            </div>

            <div className="ap-row">
                <span className="ap-label">Private account</span>
                <label className="set-switch">
                    <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={() => saveProfile({ ...profile, isPrivate: !isPrivate })}
                        aria-label="Private account"
                    />
                    <span className="set-switch-track" />
                </label>
            </div>

            <p className="ap-text">
                When your account is public, your profile and posts can be seen by anyone on TSA Hub, including advisors,
                chapters, and students you haven't connected with.
            </p>
            <p className="ap-text">
                When your account is private, only the followers you approve can see what you share. Certain info on your
                profile, like your profile picture and username, stays visible so people can find and follow you.
            </p>

            <div className="notice">
                <span aria-hidden="true">⚠</span>
                <span>
          In this demo the toggle is saved on your device but doesn't hide anything yet — real enforcement needs the
          backend, where the server checks who's allowed to load each profile.
        </span>
            </div>
        </>
    );
}