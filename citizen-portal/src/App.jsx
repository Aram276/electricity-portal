import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CitizenSearch from './components/CitizenSearch';
import Footer from './components/Footer';
import { subscribeToCloudRecords } from './utils/cloudSync';
import { INITIAL_RECORDS } from './data/initialData';

export default function App() {
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem('electricity_portal_records');
      return saved ? JSON.parse(saved) : INITIAL_RECORDS;
    } catch (e) {
      return INITIAL_RECORDS;
    }
  });

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

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col font-kurdish antialiased bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Navigation - Clean Citizen View */}
      <Navbar
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <CitizenSearch
          records={records}
          onOpenPrintModal={(record) => {
            window.print();
          }}
        />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
