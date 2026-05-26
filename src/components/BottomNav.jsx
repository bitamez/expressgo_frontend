import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Ticket, Gift, User, MessageCircle, Sun, Moon } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const BottomNav = ({ toggleChat }) => {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getIsActive = (path) => {
    return location.pathname === path;
  };

  const isLight = theme === 'light';

  const itemStyle = (path) => ({
    color: getIsActive(path) ? '#f59e0b' : 'var(--text-muted)',
    transition: 'color 0.2s ease',
  });

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-card rounded-none border-x-0 border-b-0 pb-safe pt-2 px-4 flex items-center justify-between"
      style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)' }}
    >
      <Link to="/" className="flex flex-col items-center gap-1 p-2 transition-colors" style={itemStyle('/')}>
        <Home size={22} />
        <span className="text-[9px] font-bold uppercase tracking-widest">{t('home')}</span>
      </Link>
      
      {session ? (
        <>
          <Link to="/bookings" className="flex flex-col items-center gap-1 p-2 transition-colors" style={itemStyle('/bookings')}>
            <Ticket size={22} />
            <span className="text-[9px] font-bold uppercase tracking-widest">{t('bookings')}</span>
          </Link>
          <Link to="/rewards" className="flex flex-col items-center gap-1 p-2 transition-colors" style={itemStyle('/rewards')}>
            <Gift size={22} />
            <span className="text-[9px] font-bold uppercase tracking-widest">{t('rewards')}</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center gap-1 p-2 transition-colors" style={itemStyle('/profile')}>
            <User size={22} />
            <span className="text-[9px] font-bold uppercase tracking-widest">{t('profile')}</span>
          </Link>
        </>
      ) : (
        <Link to="/login" className="flex flex-col items-center gap-1 p-2 transition-colors" style={itemStyle('/login')}>
          <User size={22} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Login</span>
        </Link>
      )}

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="flex flex-col items-center gap-1 p-2 transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        {isLight ? <Moon size={22} /> : <Sun size={22} />}
        <span className="text-[9px] font-bold uppercase tracking-widest">{isLight ? 'Dark' : 'Light'}</span>
      </button>

      <button onClick={toggleChat} className="flex flex-col items-center gap-1 p-2 transition-colors" style={{ color: 'var(--text-muted)' }}>
        <MessageCircle size={22} />
        <span className="text-[9px] font-bold uppercase tracking-widest">Chat</span>
      </button>
    </div>
  );
};

export default BottomNav;
