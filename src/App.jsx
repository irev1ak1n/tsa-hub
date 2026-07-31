import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './screens/auth/Login.jsx';
import Onboarding from './screens/auth/Onboarding.jsx';
import Dashboard from './screens/Dashboard.jsx';
import Events from './screens/events/Events.jsx';
import EventDetail from './screens/events/EventDetail.jsx';
import Recommender from './screens/events/Recommender.jsx';
import Resources from './screens/resources/Resources.jsx';
import StudentLeadership from './screens/resources/StudentLeadership.jsx';
import LeadershipSupport from './screens/resources/LeadershipSupport.jsx';
import Coach from './screens/Coach.jsx';
import Profile from './screens/profile/Profile.jsx';
import Settings from './screens/profile/Settings.jsx';
import AccountPrivacy from './screens/profile/AccountPrivacy.jsx';
import PrivacyPolicy from './screens/profile/PrivacyPolicy.jsx';

import CompetitionRuleCategory from './screens/CompetitionRuleCategory.jsx';
import CompetitionRuleTopic from './screens/CompetitionRuleTopic.jsx';

import ForwardToFifty from './screens/programs/ForwardToFifty.jsx';
import AwardsScholarships from './screens/programs/AwardsScholarships.jsx';
import LeadershipProgram from './screens/programs/LeadershipProgram.jsx';
import NationalServiceProject from './screens/programs/NationalServiceProject.jsx';
import AchievementProgram from './screens/programs/AchievementProgram.jsx';

function Loading() {
    return (
        <div className="auth-wrap">
            <p className="muted">Loading…</p>
        </div>
    );
}

function RequireProfile({ children }) {
    const { profile, profileLoading } = useApp();
    if (profileLoading) return <Loading />;
    if (!profile) return <Navigate to="/onboarding" replace />;
    return children;
}

function OnboardingRoute() {
    const { profileLoading } = useApp();
    if (profileLoading) return <Loading />;
    return <Onboarding />;
}

function Gate() {
    const { session, loading } = useAuth();

    if (loading) return <Loading />;
    if (!session) return <Login />;

    return (
        <Routes>
            <Route path="/onboarding" element={<OnboardingRoute />} />
            <Route
                element={
                    <RequireProfile>
                        <Layout />
                    </RequireProfile>
                }
            >
                <Route path="/" element={<Dashboard />} />

                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/recommend" element={<Recommender />} />

                <Route path="/resources" element={<Resources />} />
                <Route path="/resources/student-leadership" element={<StudentLeadership />} />
                <Route path="/resources/leadership-support" element={<LeadershipSupport />} />

                <Route path="/coach" element={<Coach />} />

                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/privacy" element={<AccountPrivacy />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />

                <Route path="/resources/competition-rules/:cat" element={<CompetitionRuleCategory />} />
                <Route path="/resources/competition-rules/:cat/:topic" element={<CompetitionRuleTopic />} />

                <Route path="/resources/programs/forward-to-fifty" element={<ForwardToFifty />} />
                <Route path="/resources/programs/awards-scholarships" element={<AwardsScholarships />} />
                <Route path="/resources/programs/leadership-program" element={<LeadershipProgram />} />
                <Route path="/resources/programs/national-service-project" element={<NationalServiceProject />} />
                <Route path="/resources/programs/achievement-program" element={<AchievementProgram />} />

            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppProvider>
                <BrowserRouter>
                    <Gate />
                </BrowserRouter>
            </AppProvider>
        </AuthProvider>
    );
}