import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './screens/Dashboard.jsx';
import Events from './screens/events/Events.jsx';
import EventSearchPage from './screens/events/EventSearchPage.jsx';
import EventDetail from './screens/events/EventDetail.jsx';
import Recommender from './screens/events/Recommender.jsx';
import Resources from './screens/resources/Resources.jsx';
import ResourceSearch from './screens/resources/ResourceSearchPage.jsx';
import StudentLeadership from './screens/resources/StudentLeadership.jsx';
import LeadershipSupport from './screens/resources/LeadershipSupport.jsx';

import Coach from './screens/Coach.jsx';

import Settings from './screens/profile/Settings.jsx';
import PrivacyPolicy from './screens/profile/PrivacyPolicy.jsx';
import Terms from './screens/profile/Terms.jsx';

import CompetitionRuleCategory from './screens/CompetitionRuleCategory.jsx';
import CompetitionRuleTopic from './screens/CompetitionRuleTopic.jsx';

import ForwardToFifty from './screens/programs/ForwardToFifty.jsx';
import AwardsScholarships from './screens/programs/AwardsScholarships.jsx';
import LeadershipProgram from './screens/programs/LeadershipProgram.jsx';
import NationalServiceProject from './screens/programs/NationalServiceProject.jsx';
import AchievementProgram from './screens/programs/AchievementProgram.jsx';

import AboutTsaPage from './screens/about/AboutTsaPage.jsx';

import ConferenceTopic from './screens/conference/ConferenceTopic.jsx';
import Conference2026Landing from './screens/conference/Conference2026Landing.jsx';
import ConferenceTopicPage from './screens/conference/ConferenceTopicPage.jsx';
import Conference2027 from './screens/conference/Conference2027.jsx';

import Calendar from './screens/Calendar.jsx';

export default function App() {
    return (
        <AppProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/" element={<Dashboard />} />

                        <Route path="/events" element={<Events />} />
                        <Route path="/events/search" element={<EventSearchPage />} />
                        <Route path="/events/:id" element={<EventDetail />} />
                        <Route path="/recommend" element={<Recommender />} />

                        <Route path="/resources" element={<Resources />} />
                        <Route path="/resources/search" element={<ResourceSearch />} />
                        <Route path="/resources/student-leadership" element={<StudentLeadership />} />
                        <Route path="/resources/leadership-support" element={<LeadershipSupport />} />

                        <Route path="/coach" element={<Coach />} />

                        <Route path="/calendar" element={<Calendar />} />

                        <Route path="/settings" element={<Settings />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<Terms />} />

                        <Route path="/resources/competition-rules/:cat" element={<CompetitionRuleCategory />} />
                        <Route path="/resources/competition-rules/:cat/:topic" element={<CompetitionRuleTopic />} />

                        <Route path="/resources/programs/forward-to-fifty" element={<ForwardToFifty />} />
                        <Route path="/resources/programs/awards-scholarships" element={<AwardsScholarships />} />
                        <Route path="/resources/programs/leadership-program" element={<LeadershipProgram />} />
                        <Route path="/resources/programs/national-service-project" element={<NationalServiceProject />} />
                        <Route path="/resources/programs/achievement-program" element={<AchievementProgram />} />

                        <Route path="/resources/about/:id" element={<AboutTsaPage />} />

                        <Route path="/resources/national-conference/2026" element={<Conference2026Landing />} />
                        <Route path="/resources/national-conference/2026/:topic" element={<ConferenceTopicPage />} />
                        <Route path="/resources/national-conference/2027" element={<Conference2027 />} />
                        <Route path="/resources/national-conference/:topic" element={<ConferenceTopic />} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AppProvider>
    );
}