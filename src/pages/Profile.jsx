import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { User, Ticket, Award, Settings, Bell, ChevronRight, LogOut, Clock, MapPin, Sparkles, Check, X, CheckCircle2, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://experessgo-backend-1.onrender.com/api';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'verifying' | 'success' | 'failed' | null

  const [stats, setStats] = useState({
    tier: 'Gold Member',
    tickets_count: 0,
    bonus_rides: 0,
    history: []
  });

  const fetchBookings = async (userId) => {
    try {
      // Primary: fetch from Django backend (includes both pending and confirmed bookings)
      const res = await axios.get(`${API_BASE}/bookings/my-bookings/?user_id=${userId}`, { timeout: 10000 });
      if (res.data.status === 'success') {
        setStats(prev => ({
          ...prev,
          tickets_count: res.data.bookings.filter(b => b.status === 'Confirmed').length,
          history: res.data.bookings   // show all (confirmed + pending)
        }));
        return;
      }
    } catch (err) {
      console.warn('Django bookings fetch failed, falling back to Supabase:', err.message);
    }

    // Fallback: fetch from Supabase directly
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        booking_id,
        created_at,
        schedule:schedules (
           departure_time,
           travel_date,
           route:routes ( source_en, destination_en )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase bookings error:', error);
      return;
    }

    if (bookings && bookings.length > 0) {
      const history = bookings.map(b => ({
        booking_id: b.booking_id,
        from: b.schedule?.route?.source_en || 'Express Route',
        to: b.schedule?.route?.destination_en || 'Destination',
        date: b.schedule?.travel_date || new Date(b.created_at).toLocaleDateString(),
        departure: b.schedule?.departure_time || '',
        seat: '',
        status: 'Confirmed',
        created_at: b.created_at,
      }));
      setStats(prev => ({
        ...prev,
        tickets_count: bookings.length,
        history
      }));
    }
  };

  const verifyPayment = async (txRef, userId, retryCount = 0) => {
    setPaymentStatus('verifying');
    try {
      const res = await axios.get(`${API_BASE}/bookings/payments/chapa/verify/?tx_ref=${txRef}`, { timeout: 15000 });

      if (res.data.status === 'success') {
        setPaymentStatus('success');
        await fetchBookings(userId);
        // Clean up only on final success
        sessionStorage.removeItem('pending_tx_ref');
        sessionStorage.removeItem('pending_user_id');
        const url = new URL(window.location.href);
        url.searchParams.delete('tx_ref');
        window.history.replaceState({}, '', url.toString());
      }
      else if (res.data.status === 'pending' && retryCount < 3) {
        // If pending, wait 3 seconds and try again (up to 3 times)
        setTimeout(() => verifyPayment(txRef, userId, retryCount + 1), 3000);
      }
      else {
        setPaymentStatus('failed');
        // Still fetch bookings — the booking may exist as 'Pending' in DB
        await fetchBookings(userId);
        sessionStorage.removeItem('pending_tx_ref');
        sessionStorage.removeItem('pending_user_id');
        const url = new URL(window.location.href);
        url.searchParams.delete('tx_ref');
        window.history.replaceState({}, '', url.toString());
      }
    } catch (err) {
      console.error('Verification error:', err.message);
      setPaymentStatus('failed');
      await fetchBookings(userId);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      setUser(user);
      setName(user.user_metadata?.name || 'New Passenger');

      // Check if Chapa just redirected back with a tx_ref
      const urlParams = new URLSearchParams(window.location.search);
      const txRefFromUrl = urlParams.get('tx_ref');
      const txRefFromStorage = sessionStorage.getItem('pending_tx_ref');
      const txRef = txRefFromUrl || txRefFromStorage;

      if (txRef) {
        await verifyPayment(txRef, user.id);
      } else {
        await fetchBookings(user.id);
      }
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') navigate('/login');
    });
    return () => authListener.subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const handleSave = async () => {
    setIsSaving(true);
    const { data, error } = await supabase.auth.updateUser({ data: { name } });
    if (!error) { setUser(data.user); setIsEditing(false); }
    setIsSaving(false);
  };

  if (!user) return <div className="p-10 text-center text-white/50">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8">

      {/* Payment Verification Banner */}
      {paymentStatus === 'verifying' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 flex items-center gap-3 border-yellow-500/30 bg-yellow-500/5">
          <Loader2 size={20} className="text-yellow-400 animate-spin" />
          <p className="text-yellow-300 font-medium">Verifying your payment with Chapa...</p>
        </motion.div>
      )}
      {paymentStatus === 'success' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 flex items-center gap-3 border-green-500/30 bg-green-500/5">
          <CheckCircle2 size={20} className="text-green-400" />
          <p className="text-green-300 font-medium">Payment confirmed! Your ticket has been booked. ✨</p>
        </motion.div>
      )}
      {paymentStatus === 'failed' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 flex items-center gap-3 border-yellow-500/30 bg-yellow-500/5">
          <Loader2 size={20} className="text-yellow-400" />
          <div>
            <p className="text-yellow-300 font-medium">Your booking is saved — payment pending.</p>
            <p className="text-yellow-300/60 text-xs mt-0.5">Complete your payment on Chapa to confirm your ticket.</p>
          </div>
        </motion.div>
      )}

      {/* Header Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 pointer-events-none">
            <Sparkles size={160} className="text-primary-500" />
        </div>

        <div className="relative">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center border-4 border-white/10 shadow-xl overflow-hidden text-black font-bold text-4xl">
             {name ? name.charAt(0).toUpperCase() : <User size={64} className="text-black" />}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-black border border-white/20 p-2 rounded-xl">
            <Award size={20} className="text-primary-500" />
          </div>
        </div>

        <div className="text-center md:text-left space-y-2 flex-1 w-full z-10">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
             {isEditing ? (
               <input
                 autoFocus
                 type="text"
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 className="bg-black/50 border border-primary-500/50 rounded-xl px-4 py-2 text-3xl font-bold text-white outline-none w-full md:w-auto focus:border-primary-500 transition-colors"
                 placeholder="Enter your name"
               />
             ) : (
               <h1 className="text-4xl font-bold text-white">{name}</h1>
             )}

             {!isEditing && (
               <span className="bg-primary-500/10 text-primary-500 border border-primary-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest self-start md:self-auto">
                  {stats.tier}
               </span>
             )}
          </div>
          <p className="text-white/40">{user.email}</p>
          <div className="flex gap-4 pt-2 justify-center md:justify-start">
            {isEditing ? (
              <>
                <button disabled={isSaving} onClick={handleSave} className="flex items-center justify-center gap-2 text-xs font-bold text-black transition-colors bg-primary-500 hover:bg-primary-400 px-6 py-2 rounded-lg border border-primary-500/50">
                  {isSaving ? "Saving..." : <><Check size={14} /> Save</>}
                </button>
                <button disabled={isSaving} onClick={() => { setIsEditing(false); setName(user.user_metadata?.name || 'New Passenger'); }} className="flex items-center justify-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors bg-white/5 px-6 py-2 rounded-lg border border-white/10">
                  <X size={14} /> Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                  <Settings size={14} /> Edit Profile
                </button>
                <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold text-red-400/80 hover:text-red-400 transition-colors bg-red-400/5 px-4 py-2 rounded-lg border border-red-400/10">
                  <LogOut size={14} /> Logout
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-8 flex items-center justify-between border-primary-500/20 bg-primary-500/5">
           <div>
              <p className="text-white/40 text-sm font-medium uppercase tracking-widest">Total Tickets</p>
              <h4 className="text-5xl font-black mt-2">{stats.tickets_count}</h4>
           </div>
           <div className="p-4 bg-primary-500/10 rounded-2xl">
              <Ticket size={48} className="text-primary-500" />
           </div>
        </div>
        <div className="glass-card p-8 flex items-center justify-between">
           <div>
              <p className="text-white/40 text-sm font-medium uppercase tracking-widest">Bonus Rides</p>
              <h4 className="text-5xl font-black mt-2 text-primary-500">{stats.bonus_rides}</h4>
           </div>
           <div className="p-4 bg-white/5 rounded-2xl">
              <Sparkles size={48} className="text-white/20" />
           </div>
        </div>
      </div>

      {/* Travel History */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Travel History</h2>
        {stats.history.length === 0 ? (
          <div className="glass-card p-10 text-center flex flex-col items-center gap-2">
            <Clock size={32} className="text-white/20 mb-2" />
            <h3 className="text-xl font-bold text-white/60">No recent travels</h3>
            <p className="text-sm text-white/40">Book a ticket to see your journey history here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.history.map((item, index) => (
              <div key={item.booking_id || index} className="glass-card px-8 py-6 flex items-center justify-between group hover:bg-white/5 transition-all">
                 <div className="flex items-center gap-6">
                    <div className="p-3 bg-white/5 rounded-xl text-white/40 group-hover:text-primary-500 transition-colors">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-lg flex items-center gap-2">
                        {item.from} <ChevronRight size={14} className="text-white/20" /> {item.to}
                      </h5>
                      <p className="text-white/40 text-sm">
                        {item.date}{item.seat ? ` · Seat ${item.seat}` : ''}{item.departure ? ` · ${item.departure}` : ''}
                      </p>
                    </div>
                 </div>
                 <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${
                   item.status === 'Confirmed'
                     ? 'bg-green-500/10 text-green-500 border-green-500/20'
                     : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                 }`}>
                   {item.status}
                 </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
