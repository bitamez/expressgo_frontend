import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Clock, ChevronRight, Ticket, MapPin, Calendar, Bus, Printer, XCircle, User, Info } from 'lucide-react';

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
        passenger_name: user?.user_metadata?.name || 'Passenger',
        bus_name: 'Express Bus',
        bus_number: '',
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
    <div className="max-w-4xl mx-auto py-10 space-y-8 print:p-0 print:m-0 print:space-y-0">
      <div className="flex items-center gap-4 mb-8 print:hidden">
        <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center border border-primary-500/20">
          <Ticket size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">My Bookings</h1>
          <p className="text-white/50 text-sm">View and manage your travel history</p>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; height: auto; display: block !important; padding: 20px; }
          @page { margin: 0; size: auto; }
        }
      `}</style>

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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div className="bg-white/5 p-3 rounded-lg flex items-center gap-3">
                      <User size={16} className="text-primary-500" />
                      <div>
                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-0.5">Passenger</p>
                        <p className="font-medium text-white/90 truncate max-w-[120px]" title={item.passenger_name}>{item.passenger_name}</p>
                      </div>
                    </div>
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
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/5 p-3 rounded-lg flex items-center gap-3">
                      <Info size={16} className="text-primary-500" />
                      <div>
                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-0.5">Bus Info</p>
                        <p className="font-medium text-white/90 truncate">{item.bus_name} {item.bus_number && `(${item.bus_number})`}</p>
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
              
              {/* --- Hidden Print-Only Ticket View --- */}
              {item.status === 'Confirmed' && (
                <div className="hidden print-container text-black bg-white rounded-2xl overflow-hidden shadow-2xl mx-auto w-full max-w-[800px] border-2 border-gray-200">
                  {/* Top Header */}
                  <div className="bg-[#facc15] px-8 py-6 flex justify-between items-center border-b-4 border-black">
                    <div className="flex items-center gap-3 text-black">
                      <Bus size={32} className="text-black" />
                      <h2 className="text-2xl font-black tracking-tight">EXPRESS<span className="font-light">GO</span></h2>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold uppercase tracking-widest text-black/60">Boarding Pass</p>
                      <p className="text-xl font-black">TICKET #{item.booking_id}</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row">
                    {/* Main Ticket Body */}
                    <div className="p-8 flex-1 border-r-2 border-dashed border-gray-300 relative">
                      <div className="flex justify-between items-center mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div>
                          <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">From</p>
                          <h3 className="text-3xl font-black">{item.from}</h3>
                        </div>
                        <ChevronRight size={32} className="text-gray-300" />
                        <div className="text-right">
                          <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">To</p>
                          <h3 className="text-3xl font-black">{item.to}</h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
                        <div>
                          <p className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-1">Passenger Name</p>
                          <p className="text-lg font-bold text-black">{item.passenger_name}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-1">Date</p>
                          <p className="text-lg font-bold text-black">{item.date}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-1">Bus Info</p>
                          <p className="text-lg font-bold text-black">{item.bus_name} {item.bus_number && `(${item.bus_number})`}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-1">Departure Time</p>
                          <p className="text-lg font-bold text-black">{item.departure}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Stub */}
                    <div className="p-8 w-[250px] bg-gray-50 flex flex-col items-center justify-center border-l-2 border-dashed border-gray-300 text-center relative">
                      {/* Fake QR Code */}
                      <div className="w-32 h-32 bg-white border-2 border-black p-2 flex flex-wrap gap-1 mb-6">
                        {[...Array(64)].map((_, i) => (
                          <div key={i} className={`w-3 h-3 ${Math.random() > 0.5 ? 'bg-black' : 'bg-transparent'}`}></div>
                        ))}
                      </div>
                      
                      <p className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-1">Seat Number</p>
                      <h2 className="text-5xl font-black text-black">{item.seat || 'ANY'}</h2>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
