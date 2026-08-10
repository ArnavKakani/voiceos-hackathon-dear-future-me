import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { CheckInPage } from './pages/CheckInPage';
import { ExplorePage } from './pages/ExplorePage';
import { CheckOutPage } from './pages/CheckOutPage';
import { StoriesPage } from './pages/StoriesPage';
import { AboutPage } from './pages/AboutPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { MyNotebookPage } from './pages/MyNotebookPage';
import { BeforeItBreaksPage } from './pages/BeforeItBreaksPage';
import { DfmVoicePage } from './pages/DfmVoicePage';
import { ApiKeysPage } from './pages/ApiKeysPage';

function App() {
  return (
    <MotionConfig reducedMotion="user">
    <AuthProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/check-in" element={<CheckInPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/check-out" element={<CheckOutPage />} />
            <Route path="/stories" element={<StoriesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/notebook" element={<MyNotebookPage />} />
            <Route path="/before-it-breaks" element={<BeforeItBreaksPage />} />
            <Route path="/voice" element={<DfmVoicePage />} />
            <Route path="/developer" element={<ApiKeysPage />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </AuthProvider>
    </MotionConfig>
  );
}

export default App;
