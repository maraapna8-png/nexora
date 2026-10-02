import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ChatArea } from './components/chat/ChatArea';
import { SavedDocumentsView } from './components/documents/SavedDocumentsView';
import { ChatHistoryView } from './components/history/ChatHistoryView';
import { SettingsModal } from './components/settings/SettingsModal';
import { SearchModal } from './components/modals/SearchModal';
import { LegalCitationModal } from './components/modals/LegalCitationModal';
import { AuthModal } from './components/auth/AuthModal';
import { LandingPage } from './components/landing/LandingPage';
import { SplashScreen } from './components/common/SplashScreen';
import { NamePromptModal } from './components/common/NamePromptModal';
import { ApiKeyModal } from './components/modals/ApiKeyModal';

const MainWorkspace: React.FC = () => {
  const { user, loading, loginAsGuest } = useAuth();
  const [activeView, setActiveView] = useState<'chat' | 'documents' | 'history'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'preferences' | 'model' | 'account' | 'founder'>('preferences');
  const [searchOpen, setSearchOpen] = useState(false);
  const [legalCitationOpen, setLegalCitationOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [namePromptOpen, setNamePromptOpen] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);

  // When user enters workspace / logs in, ask what their name is
  useEffect(() => {
    if (user) {
      const hasAsked = localStorage.getItem('nexora_asked_user_name');
      const preferred = localStorage.getItem('nexora_user_preferred_name');
      if (!hasAsked || !preferred) {
        const timer = setTimeout(() => {
          setNamePromptOpen(true);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  useEffect(() => {
    const handleOpenNamePrompt = () => {
      setNamePromptOpen(true);
    };
    window.addEventListener('open-name-prompt-modal', handleOpenNamePrompt);
    return () => window.removeEventListener('open-name-prompt-modal', handleOpenNamePrompt);
  }, []);

  useEffect(() => {
    const handleOpenApiKey = () => {
      setApiKeyModalOpen(true);
    };
    window.addEventListener('open-api-key-modal', handleOpenApiKey);
    return () => window.removeEventListener('open-api-key-modal', handleOpenApiKey);
  }, []);

  useEffect(() => {
    const handleOpenSettings = (e: any) => {
      if (e.detail?.tab) {
        setSettingsTab(e.detail.tab);
      }
      setSettingsOpen(true);
    };
    window.addEventListener('open-settings-modal', handleOpenSettings);
    return () => window.removeEventListener('open-settings-modal', handleOpenSettings);
  }, []);

  // If loading user auth, show clean backdrop
  if (loading) {
    return <SplashScreen message="Initializing Nexora Workspace..." />;
  }

  // If no user session (neither logged in nor guest), show the high-impact landing page
  if (!user) {
    return (
      <>
        <LandingPage
          onStartWriting={() => {
            setAuthModalMode('signup');
            setAuthModalOpen(true);
          }}
          onOpenLogin={() => {
            setAuthModalMode('login');
            setAuthModalOpen(true);
          }}
          onOpenSignUp={() => {
            setAuthModalMode('signup');
            setAuthModalOpen(true);
          }}
          onGuestLogin={loginAsGuest}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      </>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-[#0b0f17] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenLegalCitation={() => setLegalCitationOpen(true)}
        onOpenApiKey={() => setApiKeyModalOpen(true)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenLegalCitation={() => setLegalCitationOpen(true)}
          onOpenApiKey={() => setApiKeyModalOpen(true)}
          activeView={activeView}
          setActiveView={setActiveView}
        />

        {/* View Switcher */}
        <main className="flex-1 overflow-hidden relative">
          {activeView === 'chat' && (
            <ChatArea onOpenLegalCitation={() => setLegalCitationOpen(true)} />
          )}
          {activeView === 'documents' && (
            <SavedDocumentsView onOpenChat={() => setActiveView('chat')} />
          )}
          {activeView === 'history' && (
            <ChatHistoryView onOpenChat={() => setActiveView('chat')} />
          )}
        </main>
      </div>

      {/* Modals & Dialogs */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab={settingsTab}
      />
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenChat={() => setActiveView('chat')}
      />
      <LegalCitationModal
        isOpen={legalCitationOpen}
        onClose={() => setLegalCitationOpen(false)}
      />
      <NamePromptModal
        isOpen={namePromptOpen}
        onClose={() => setNamePromptOpen(false)}
      />
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ChatProvider>
          <MainWorkspace />
        </ChatProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
