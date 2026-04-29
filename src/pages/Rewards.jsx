import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Sparkles, Star, Gift, TrendingUp, ShieldCheck, Crown, Zap, ChevronRight } from 'lucide-react';

const Rewards = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  
  // Fake tier logic for presentation
  const tiers = [
    { name: 'Bronze', min: 0, color: 'text-[#CD7F32]', bg: 'bg-[#CD7F32]/10', border: 'border-[#CD7F32]/20', icon: ShieldCheck },
    { name: 'Silver', min: 500, color: 'text-[#C0C0C0]', bg: 'bg-[#C0C0C0]/10', border: 'border-[#C0C0C0]/20', icon: Star },
    { name: 'Gold', min: 2000, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', icon: Award },
    { name: 'Platinum', min: 5000, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20', icon: Crown }
  ];

  const currentTier = tiers[2]; // Hardcoded to Gold for demo
  const nextTier = tiers[3];
  const progress = 75; // 75% to next tier

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
      setPoints(3750); // Fake points
    };
    init();
  }, [navigate]);

  if (!user) return <div className="p-10 text-center text-white/50">Loading rewards...</div>;

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-10">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center border border-primary-500/20">
          <Gift size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">ExpressGo Rewards</h1>
          <p className="text-white/50 text-sm">Earn points every time you travel</p>
        </div>
      </div>

      {/* Main Tier Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/20 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-10 opacity-5 pointer-events-none">
          <currentTier.icon size={200} />
        </div>

        <div className="relative z-10 w-full md:w-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-bold tracking-widest uppercase mb-6">
            <currentTier.icon size={16} className={currentTier.color} />
            <span className={currentTier.color}>{currentTier.name} Member</span>
          </div>
          
          <div className="space-y-1">
            <p className="text-white/50 uppercase tracking-wider text-sm font-medium">Available Points</p>
            <h2 className="text-6xl font-black text-white flex items-baseline gap-2">
              {points.toLocaleString()} <span className="text-xl text-primary-500 font-bold">pts</span>
            </h2>
          </div>
        </div>

        <div className="relative z-10 w-full md:w-1/2 glass-card p-6 border-white/10 bg-black/40">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">Next Tier</p>
              <p className={`font-bold ${nextTier.color} flex items-center gap-1`}>
                <nextTier.icon size={16} /> {nextTier.name}
              </p>
            </div>
            <p className="text-white/60 text-sm">
              <span className="text-white font-bold">{1250}</span> pts to go
            </p>
          </div>
          
          <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full relative"
            >
              <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/20 blur-[2px]"></div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Rewards Grid */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Sparkles className="text-primary-500" size={20} />
          Redeem Points
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Free 1-Way Ticket', pts: 2500, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
            { title: 'VIP Lounge Access', pts: 1000, icon: Crown, color: 'text-purple-400', bg: 'bg-purple-400/10' },
            { title: 'Free Seat Upgrade', pts: 500, icon: Zap, color: 'text-blue-400', bg: 'bg-blue-400/10' }
          ].map((reward, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 flex flex-col justify-between group hover:border-primary-500/30 transition-all cursor-pointer"
            >
              <div className="mb-8">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${reward.bg} ${reward.color}`}>
                  <reward.icon size={24} />
                </div>
                <h4 className="font-bold text-lg text-white mb-1">{reward.title}</h4>
                <p className="text-white/40 text-sm">Use your points to claim this reward immediately.</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                <span className="font-bold text-primary-400">{reward.pts} pts</span>
                <button className="text-white/40 group-hover:text-primary-500 transition-colors flex items-center gap-1 text-sm font-bold">
                  Redeem <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Rewards;
