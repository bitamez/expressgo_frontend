import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bus, Languages, User, LogIn, Download, Sun, Moon } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ toggleChat }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const isLight = theme === 'light';

  return (
    <nav className="glass-card mt-6 px-8 py-4 flex items-center justify-between sticky top-6 z-50">
      <Link to="/" className="flex items-center gap-3 cursor-pointer">
        <div className="bg-primary-500 p-2.5 rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.3)]">
          <Bus size={22} className="text-black" strokeWidth={2.5} />
        </div>
        <span className="text-xl font-bold tracking-tighter uppercase italic" style={{ color: 'var(--text-primary)' }}>
          EXPRESS<span className="text-primary-500">GO</span>
        </span>
      </Link>
      
      {/* Dynamic Center Links */}
      <div className="hidden md:flex items-center gap-10 font-bold uppercase tracking-widest text-[10px]">
        <Link to="/" className="hover:text-primary-500 transition-colors" style={{ color: 'var(--text-primary)' }}>{t('home')}</Link>
        {session && (
          <>
            <Link to="/bookings" className="hover:text-primary-500 transition-colors" style={{ color: 'var(--text-secondary)' }}>{t('bookings')}</Link>
            <Link to="/rewards" className="hover:text-primary-500 transition-colors" style={{ color: 'var(--text-secondary)' }}>{t('rewards')}</Link>
          </>
        )}
      </div>

      {/* Dynamic Right Section */}
      <div className="hidden md:flex items-center gap-4">
        {/* Language Toggle */}
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border"
          style={{
            color: 'var(--text-secondary)',
            borderColor: 'var(--border-medium)',
            background: 'transparent',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Languages size={15} />
          <span className="text-[9px] font-black uppercase tracking-widest">{language === 'en' ? 'EN' : 'አማ'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className="flex items-center justify-center w-9 h-9 rounded-lg border transition-all duration-300"
          style={{
            color: 'var(--text-secondary)',
            borderColor: 'var(--border-subtle)',
            background: 'var(--bg-surface)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}
        >
          {isLight ? (
            <Moon size={15} className="text-primary-500" />
          ) : (
            <Sun size={15} className="text-primary-500" />
          )}
        </button>
        
        {deferredPrompt && (
          <button 
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg transition-all text-white border border-primary-500/50 bg-primary-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
          >
            <Download size={15} className="text-primary-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-500 hidden sm:inline">Install App</span>
          </button>
        )}
        
        {session ? (
          <Link to="/profile" className="flex items-center gap-2 glass-button !px-4 !py-2">
            <div className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center border border-primary-500/30">
               <User size={12} className="text-primary-500" />
            </div>
            <span className="text-xs font-black uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>{t('profile')}</span>
          </Link>
        ) : (
          <Link to="/login" className="flex items-center gap-2 primary-button !px-6 !py-2.5 text-[11px] uppercase font-black tracking-widest bg-primary-500 hover:bg-primary-400">
            <LogIn size={15} />
            <span>{t('getStarted')}</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
