import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CitizenSearch from './components/CitizenSearch';
import Footer from './components/Footer';
import ScrollNavigator from './components/ScrollNavigator';
import PrintReceiptModal from './components/PrintReceiptModal';
import CustomElectricCursor from './components/CustomElectricCursor';
import AntigravityBackground from './components/AntigravityBackground';
import ErrorBoundary from './components/ErrorBoundary';
import { subscribeToCloudRecords } from './utils/cloudSync';
import { getStoredRecords } from './utils/storage';
import { INITIAL_RECORDS } from './data/initialData';

export default function App() {
  const [records, setRecords] = useState(() => {
    return getStoredRecords();
  });
  const [printModalRecord, setPrintModalRecord] = useState(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('electricity_portal_theme');
    return saved !== 'light'; // default dark
  });

  useEffect(() => {
    // Live Cloud Subscription to Firebase Firestore
    const unsubscribe = subscribeToCloudRecords((cloudRecords) => {
      if (cloudRecords && cloudRecords.length > 0) {
        setRecords(cloudRecords);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Sync theme with DOM
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      document.body.classList.add('dark-mode');
      localStorage.setItem('electricity_portal_theme', 'dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('electricity_portal_theme', 'light');
    }
  }, [isDarkMode]);

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('electricity_portal_lang') || 'ku';
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('electricity_portal_lang', newLang);
  };

  return (
    <div className="relative min-h-screen flex flex-col font-kurdish antialiased bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden" dir="rtl">
      {/* Ambient Energy Aura Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="ambient-orb-1 absolute -top-40 -right-40 w-96 sm:w-[550px] h-96 sm:h-[550px] bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-transparent rounded-full blur-3xl" />
        <div className="ambient-orb-2 absolute top-1/2 -left-40 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-gradient-to-tr from-cyan-500/10 via-sky-500/5 to-transparent rounded-full blur-3xl" />
        <div className="ambient-orb-1 absolute -bottom-40 right-1/4 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-gradient-to-t from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* 3D Antigravity Floating Particle Field */}
      <AntigravityBackground isDarkMode={isDarkMode} />

      {/* Navigation - Clean Citizen View */}
      <div className="relative z-10">
        <Navbar
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          language={language}
          onLanguageChange={handleLanguageChange}
        />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <ErrorBoundary>
          <CitizenSearch
            records={records}
            language={language}
            onOpenPrintModal={(record) => {
              setPrintModalRecord(record);
            }}
          />
        </ErrorBoundary>
      </main>

      {/* Royal Printable Receipt Modal */}
      <PrintReceiptModal
        isOpen={Boolean(printModalRecord)}
        onClose={() => setPrintModalRecord(null)}
        record={printModalRecord}
        language={language}
      />

      {/* Floating Scroll Navigator (Top / Bottom) */}
      <ScrollNavigator />

      {/* Luxury Custom Electric Cursor & Click Shockwave */}
      <CustomElectricCursor />

      {/* Footer */}
      <div className="relative z-10">
        <Footer language={language} />
      </div>
    </div>
  );
}
