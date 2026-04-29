import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Clock, ChevronRight, Ticket, MapPin, Calendar, Bus, Printer, XCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://experessgo-backend-1.onrender.com/api';

const MyBookings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = async (userId) => {
    try {
      const res = await axios.get(`${API_BASE}/bookings/my-bookings/?user_id=${userId}`, { timeout: 10000 });
      if (res.data.status === 'success') {
        setBookings(res.data.bookings);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Django bookings fetch failed:', err.message);
    }

    // Fallback if backend is down
    const { data: fallbackBookings } = await supabase
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

    if (fallbackBookings) {
      setBookings(fallbackBookings.map(b => ({
        booking_id: b.booking_id,
        from: b.schedule?.route?.source_en || 'Express Route',
        to: b.schedule?.route?.destination_en || 'Destination',
        date: b.schedule?.travel_date || new Date(b.created_at).toLocaleDateString(),
        departure: b.schedule?.departure_time || '',
        seat: '',
        status: 'Confirmed',
        created_at: b.created_at,
      })));
    }
    setIsLoading(false);
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;
    
    try {
      const res = await axios.post(`${API_BASE}/bookings/cancel/`, {
        booking_id: bookingId,
        user_id: user.id
      });
      if (res.data.status === 'success') {
        alert('Booking cancelled successfully.');
        await fetchBookings(user.id); // Refresh
      } else {
        alert('Failed to cancel: ' + res.data.message);
      }
    } catch (err) {
      alert('Error cancelling booking: ' + err.message);
    }
  };

  const handlePrint = (bookingId) => {
    // A simple print mechanism. Ideally we'd pop open a PDF or a specific print view.
    // Here we'll just use window.print() and rely on CSS to hide non-ticket elements.
    window.print();
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
      await fetchBookings(user.id);
    };
    init();
  }, [navigate]);

  if (isLoading) return <div className="p-10 text-center text-white/50">Loading bookings...</div>;

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8 print:py-0 print:space-y-4">
      <div className="flex items-center gap-4 mb-8 print:hidden">
        <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center border border-primary-500/20">
          <Ticket size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">My Bookings</h1>
          <p className="text-white/50 text-sm">View and manage your travel history</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-16 text-center flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Bus size={48} className="text-white/20" />
          </div>
          <h3 className="text-2xl font-bold text-white">No bookings yet</h3>
          <p className="text-white/50 max-w-sm mx-auto">You haven't booked any trips yet. Discover our routes and start your journey today!</p>
          <button onClick={() => navigate('/')} className="primary-button mt-6">Book a Trip</button>
        </motion.div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((item, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={item.booking_id || index} 
              className="glass-card overflow-hidden group hover:border-primary-500/30 transition-all"
            >
              <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                
                {/* Route Info */}
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                      item.status === 'Confirmed'
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : item.status === 'Cancelled'
                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-white/40 text-sm font-medium">#{item.booking_id}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xl md:text-2xl font-bold text-white mb-6">
                    <span className="truncate">{item.from}</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent relative flex items-center justify-center min-w-[50px]">
                      <Bus size={16} className="text-primary-500 absolute bg-secondary px-1" />
                    </div>
                    <span className="truncate">{item.to}</span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-white/5 p-3 rounded-lg flex items-center gap-3">
                      <Calendar size={16} className="text-primary-500" />
                      <div>
                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-0.5">Date</p>
                        <p className="font-medium text-white/90">{item.date}</p>
                      </div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg flex items-center gap-3">
                      <Clock size={16} className="text-primary-500" />
                      <div>
                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-0.5">Time</p>
                        <p className="font-medium text-white/90">{item.departure}</p>
                      </div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg flex items-center gap-3">
                      <Ticket size={16} className="text-primary-500" />
                      <div>
                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-0.5">Seat</p>
                        <p className="font-medium text-white/90">{item.seat || 'Any'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions (Hidden when printing) */}
                  <div className="mt-6 flex justify-end gap-3 print:hidden border-t border-white/5 pt-4">
                    {item.status !== 'Cancelled' && (
                      <button 
                        onClick={() => handleCancel(item.booking_id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-red-400 hover:bg-red-400/10 transition-colors border border-transparent hover:border-red-400/20"
                      >
                        <XCircle size={16} /> Cancel
                      </button>
                    )}
                    {item.status === 'Confirmed' && (
                      <button 
                        onClick={() => handlePrint(item.booking_id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                      >
                        <Printer size={16} /> Print Ticket
                      </button>
                    )}
                  </div>

                </div>

              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
