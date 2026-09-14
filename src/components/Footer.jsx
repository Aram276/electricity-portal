import React, { useState, useEffect } from 'react';
import { Phone, MapPin, Clock, Globe, ExternalLink } from 'lucide-react';
import RoonakiLogo from './RoonakiLogo';
import { subscribeToFooterSettings } from '../utils/cloudSync';
import { getTranslation } from '../utils/translations';

export default function Footer({ footerSettings, language = 'ku' }) {
  const t = getTranslation(language);

  const [settings, setSettings] = useState(() => {
    return {
      description: localStorage.getItem('footer_description') || '',
      hotline: localStorage.getItem('footer_hotline') || '1992',
      phone: localStorage.getItem('footer_phone') || '0750 000 0000',
      hours: localStorage.getItem('footer_hours') || '',
      location: localStorage.getItem('footer_location') || '',
      websiteName: localStorage.getItem('footer_website_name') || 'runaki.gov.krd',
      websiteUrl: localStorage.getItem('footer_website_url') || 'https://runaki.gov.krd',
      copyright: localStorage.getItem('footer_copyright') || '',
      bottomNote: localStorage.getItem('footer_bottom_note') || ''
    };
  });

  useEffect(() => {
    // Live Cloud Subscription to Firestore Footer Settings
    const unsubscribe = subscribeToFooterSettings((cloudSettings) => {
      if (cloudSettings) {
        setSettings(cloudSettings);
      }
    });

    const handleLocalFooterUpdate = () => {
      setSettings({
        description: localStorage.getItem('footer_description') || '',
        hotline: localStorage.getItem('footer_hotline') || '1992',
        phone: localStorage.getItem('footer_phone') || '0750 000 0000',
        hours: localStorage.getItem('footer_hours') || '',
        location: localStorage.getItem('footer_location') || '',
        websiteName: localStorage.getItem('footer_website_name') || 'runaki.gov.krd',
        websiteUrl: localStorage.getItem('footer_website_url') || 'https://runaki.gov.krd',
        copyright: localStorage.getItem('footer_copyright') || '',
        bottomNote: localStorage.getItem('footer_bottom_note') || ''
      });
    };

    window.addEventListener('footer_settings_updated', handleLocalFooterUpdate);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      window.removeEventListener('footer_settings_updated', handleLocalFooterUpdate);
    };
  }, []);

  const currentDesc = settings.description || t.footerDesc;
  const currentHours = settings.hours || t.workHours;
  const currentLocation = settings.location || t.location;
  const currentCopyright = settings.copyright || `${t.copyright} © ${new Date().getFullYear()}`;
  const currentBottomNote = settings.bottomNote || t.bottomNote;

  return (
    <footer className="mt-16 sm:mt-20 border-t border-amber-500/20 bg-white/95 dark:bg-[#060a14]/95 text-slate-600 dark:text-slate-400 text-xs sm:text-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
          
          {/* Col 1: Identity */}
          <div className="md:col-span-2 space-y-3 sm:space-y-4">
            <RoonakiLogo className="h-10 sm:h-12 w-auto" />
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed max-w-md">
              {currentDesc}
            </p>
            <div className="flex items-center gap-3 text-xs text-amber-700 dark:text-amber-400 font-semibold pt-1">
              <a 
                href={settings.websiteUrl.startsWith('http') ? settings.websiteUrl : `https://${settings.websiteUrl}`} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 transition-colors shadow-sm"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{t.officialWebsite}: {settings.websiteName}</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>

          {/* Col 2: Contact */}
          <div className="space-y-2.5 sm:space-y-3">
            <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-500" />
              <span>{t.contactAndEmergency}</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <span>{t.roonakiHotline}</span>
                <strong className="text-slate-950 dark:text-white font-mono text-sm px-2 py-0.5 bg-amber-100 dark:bg-amber-500/15 rounded border border-amber-300 dark:border-amber-500/30">
                  {settings.hotline}
                </strong>
              </li>
              <li className="flex items-center gap-2">
                <span>{t.contactCenter}</span>
                <strong className="text-slate-950 dark:text-white font-mono">
                  {settings.phone}
                </strong>
              </li>
            </ul>
          </div>

          {/* Col 3: Working Hours & Location */}
          <div className="space-y-2.5 sm:space-y-3">
            <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>{t.workHoursAndArchive}</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>{currentHours}</li>
              <li className="flex items-center gap-1.5 pt-1 text-slate-700 dark:text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{currentLocation}</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-200 dark:border-slate-800/80 mt-8 sm:mt-10 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="text-center md:text-right space-y-1">
            <div className="font-bold text-slate-700 dark:text-slate-300">
              {currentCopyright}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {currentBottomNote}
            </div>
          </div>

          {/* Creators & Developers Distinguished Badge */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-bold shadow-sm">
            <span className="text-amber-600 dark:text-amber-400 font-black">{language === 'ar' ? '💻 فكرة وتطوير النظام:' : '💻 بیرۆکە و گەشەپێدانی سیستم:'}</span>
            <span className="font-black text-slate-900 dark:text-white">ئارام عەباس (Aram Abbas)</span>
            <span className="text-amber-500 font-black">&</span>
            <span className="font-black text-slate-900 dark:text-white">ڕەعد ئیبراهیم (Raad Ebrahim)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
