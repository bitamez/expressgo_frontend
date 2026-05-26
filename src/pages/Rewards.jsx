import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Sparkles, Star, Gift, TrendingUp, ShieldCheck, Crown, Zap, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';

const POINTS_PER_BOOKING = 250; // 250 pts per confirmed trip

const tiers = [
  { name: 'Bronze', min: 0,    max: 499,   color: 'text-[#CD7F32]', bg: 'bg-[#CD7F32]/10', border: 'border-[#CD7F32]/20', icon: ShieldCheck },
  { name: 'Silver', min: 500,  max: 1999,  color: 'text-[#C0C0C0]', bg: 'bg-[#C0C0C0]/10', border: 'border-[#C0C0C0]/20', icon: Star },
  { name: 'Gold',   min: 2000, max: 4999,  color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', icon: Award },
  { name: 'Platinum', min: 5000, max: Infinity, color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/20', icon: Crown }
];

const rewardOptions = [
  { title: 'Free 1-Way Ticket', pts: 2500, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
  { title: 'VIP Lounge Access', pts: 1000, icon: Crown,      color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { title: 'Free Seat Upgrade', pts: 500,  icon: Zap,        color: 'text-blue-400',   bg: 'bg-blue-400/10'  },
];

const Rewards = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [redeemStatus, setRedeemStatus] = useState(null); // { type: 'success'|'error', msg }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      setUser(user);

      // Fetch real confirmed bookings count
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'Confirmed');

      if (!error && data) {
        const count = data.length;
        setConfirmedCount(count);
        setPoints(count * POINTS_PER_BOOKING);
      }
      setIsLoading(false);
    };
    init();
  }, [navigate]);

  // Tier calculation
  const currentTier  = [...tiers].reverse().find(t => points >= t.min) || tiers[0];
  const nextTierData = tiers.find(t => t.min > points) || null;
  const ptsToNext    = nextTierData ? nextTierData.min - points : 0;
  const tierProgress = nextTierData
    ? Math.round(((points - currentTier.min) / (nextTierData.min - currentTier.min)) * 100)
    : 100;

  const handleRedeem = (reward) => {
    if (points < reward.pts) {
      setRedeemStatus({ type: 'error', msg: `You need ${reward.pts - points} more pts for "${reward.title}".` });
      setTimeout(() => setRedeemStatus(null), 4000);
      return;
    }
    // In a real app, hit an API to deduct points and log the redemption.
    // For now, show a success message and deduct locally.
    setPoints(prev => prev - reward.pts);
    setRedeemStatus({ type: 'success', msg: `"${reward.title}" redeemed! ${reward.pts} pts deducted.` });
    setTimeout(() => setRedeemStatus(null), 5000);
  };

  if (isLoading) return (
    <div className="p-10 text-center" style={{ color: 'var(--text-secondary)' }}>Loading your rewards...</div>
  );

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center border border-primary-500/20">
          <Gift size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>ExpressGo Rewards</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {confirmedCount} confirmed trip{confirmedCount !== 1 ? 's' : ''} · {POINTS_PER_BOOKING} pts per trip
          </p>
        </div>
      </div>

      {/* Status Toast */}
      {redeemStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`flex items-center gap-3 px-5 py-4 rounded-xl border text-sm font-medium ${
            redeemStatus.type === 'success'
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {redeemStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {redeemStatus.msg}
        </motion.div>
      )}

      {/* Main Tier Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-10 opacity-5 pointer-events-none">
          <currentTier.icon size={200} />
        </div>

        <div className="relative z-10 w-full md:w-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-bold tracking-widest uppercase mb-6">
            <currentTier.icon size={16} className={currentTier.color} />
            <span className={currentTier.color}>{currentTier.name} Member</span>
          </div>

          <div className="space-y-1">
            <p className="uppercase tracking-wider text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Available Points
            </p>
            <h2 className="text-6xl font-black flex items-baseline gap-2" style={{ color: 'var(--text-primary)' }}>
              {points.toLocaleString()} <span className="text-xl text-primary-500 font-bold">pts</span>
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              From {confirmedCount} confirmed trip{confirmedCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Progress to next tier */}
        <div className="relative z-10 w-full md:w-1/2 glass-card p-6 border-white/10">
          {nextTierData ? (
            <>
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Next Tier</p>
                  <p className={`font-bold ${nextTierData.color} flex items-center gap-1`}>
                    <nextTierData.icon size={16} /> {nextTierData.name}
                  </p>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{ptsToNext.toLocaleString()}</span> pts to go
                </p>
              </div>
              <div className="h-3 rounded-full overflow-hidden border border-white/5" style={{ background: 'var(--bg-surface)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${tierProgress}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full relative"
                >
                  <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/20 blur-[2px]" />
                </motion.div>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                {tierProgress}% to {nextTierData.name}
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <Crown size={32} className="text-cyan-400 mx-auto mb-2" />
              <p className="font-bold text-cyan-400">You've reached Platinum!</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Maximum tier achieved 🎉</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* How to earn */}
      <div className="glass-card p-6 flex items-start gap-4">
        <Sparkles size={20} className="text-primary-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>How to earn points</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            You earn <span className="text-primary-400 font-bold">{POINTS_PER_BOOKING} pts</span> for every confirmed booking.
            Tier thresholds: Bronze (0), Silver (500), Gold (2,000), Platinum (5,000).
            Bonus ride unlocked for every 5 confirmed trips.
          </p>
        </div>
      </div>

      {/* Redeem Grid */}
      <div>
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Sparkles className="text-primary-500" size={20} />
          Redeem Points
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rewardOptions.map((reward, i) => {
            const canAfford = points >= reward.pts;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card p-6 flex flex-col justify-between group transition-all ${
                  canAfford ? 'hover:border-primary-500/30 cursor-pointer' : 'opacity-60'
                }`}
              >
                <div className="mb-8">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${reward.bg} ${reward.color}`}>
                    <reward.icon size={24} />
                  </div>
                  <h4 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>{reward.title}</h4>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {canAfford ? 'You have enough points to claim this reward.' : `Need ${reward.pts - points} more pts.`}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t mt-auto" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="font-bold text-primary-400">{reward.pts} pts</span>
                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={!canAfford}
                    className={`flex items-center gap-1 text-sm font-bold transition-colors ${
                      canAfford
                        ? 'text-primary-500 hover:text-primary-400'
                        : 'cursor-not-allowed'
                    }`}
                    style={!canAfford ? { color: 'var(--text-muted)' } : {}}
                  >
                    Redeem <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Rewards;
