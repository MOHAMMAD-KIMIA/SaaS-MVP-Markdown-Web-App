import { BrowserRouter, Routes, Route } from 'react-router';
import { ThemeProvider } from './components/ThemeProvider';
import { Layout } from './components/Layout';
import  LandingPage  from './pages/LandingPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { PricingPage } from './pages/PricingPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { DashboardPage } from './pages/DashboardPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { EditorPage } from './pages/EditorPage';
import { CollaborationPage } from './pages/CollaborationPage';
import { PublishingPage } from './pages/PublishingPage';


export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="features" element={<FeaturesPage />} />
            <Route path="editor" element={<EditorPage />} />
            <Route path="publishing" element={<PublishingPage />} />
            <Route path="collaboration" element={<CollaborationPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="docs" element={<DocumentationPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
