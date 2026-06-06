import { Toaster } from "react-hot-toast"
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ChallengePage from './pages/ChallengePage'
import CommunityPage from './pages/CommunityPage'
import ContestPage from './pages/ContestPage'
import DashboardPage from './pages/DashboardPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import PracticePage from './pages/PracticePage'
import ProfilePage from './pages/ProfilePage'
import SignupPage from './pages/SignupPage'
import { TourProvider } from './tour/TourContext'
import TourOverlay from './tour/TourOverlay'

function ThemedToaster() {
    return (
        <Toaster
            position="bottom-right"
            toastOptions={{
                duration: 3000,
                style: {
                    background: "var(--toast-bg)",
                    color: "var(--toast-color)",
                    border: "1px solid var(--toast-border)",
                    borderRadius: "14px",
                    padding: "14px 18px",
                },
            }}
        />
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <TourProvider>
            <ThemedToaster />
            <TourOverlay />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                {/* /problems and /recommendations both point to the unified Practice page */}
                <Route path="/problems" element={<PracticePage />} />
                <Route path="/recommendations" element={<Navigate to="/problems" replace />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/challenges" element={<ChallengePage />} />
                <Route path="/contest/:id" element={<ContestPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
            </TourProvider>
        </BrowserRouter>
    )
}