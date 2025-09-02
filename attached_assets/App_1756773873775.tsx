import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import Header from './components/layout/Header';
import PortfolioGrid from './components/portfolio/PortfolioGrid';
import Footer from './components/layout/Footer';
import LoginPage from './components/admin/LoginPage';
import AdminDashboard from './components/admin/AdminDashboard';
import Hero from './components/layout/Hero';
import ContactModal from './components/contact/ContactModal';

const PageContent: React.FC = () => {
  const { isLoginModalOpen, setLoginModalOpen, isUploadModalOpen, setUploadModalOpen, isContactModalOpen, setContactModalOpen } = useAppContext();

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-900 text-white">
        <Header />
        <Hero />
        <main className="flex-grow container mx-auto px-4 py-8">
          <PortfolioGrid />
        </main>
        <Footer />
      </div>
      
      {isLoginModalOpen && <LoginPage onClose={() => setLoginModalOpen(false)} />}
      {isUploadModalOpen && <AdminDashboard onClose={() => setUploadModalOpen(false)} />}
      {isContactModalOpen && <ContactModal onClose={() => setContactModalOpen(false)} />}
    </>
  );
}

const App: React.FC = () => {
  return (
    <AppProvider>
      <PageContent />
    </AppProvider>
  );
};

export default App;