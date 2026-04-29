import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Wallet, Smartphone, X, CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const PaymentModal = ({ isOpen, onClose, amount, bookingDetails }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chapaUrl, setChapaUrl] = useState(null);
  const [txRef, setTxRef] = useState(null);
  const navigate = useNavigate();

  const paymentMethods = [
    { id: 'chapa', name: 'Chapa', icon: CreditCard, color: 'text-green-400' },
    { id: 'telebirr', name: 'Telebirr', icon: Smartphone, color: 'text-blue-400' },
    { id: 'cbe', name: 'CBE Birr', icon: Wallet, color: 'text-purple-400' }
  ];

  const handlePayment = async () => {
    if (!selectedMethod) return;
    setIsProcessing(true);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://experessgo-backend-1.onrender.com/api';
      const endpoint = `${baseUrl}/bookings/payments/${selectedMethod}/`;
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const userEmail = session?.user?.email || bookingDetails?.email || 'ticket@expressgo.et';
      const firstName = userEmail.split('@')[0] || bookingDetails?.passenger_name || 'Customer';

      const res = await axios.post(endpoint, {
        amount,
        first_name: firstName,
        email: userEmail,
        user_id: session?.user?.id,
        seat: bookingDetails?.seat,
        trip_id: bookingDetails?.id || bookingDetails?.schedule_id || 'N-A',
      }, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (res.data.status === 'success' && res.data.checkout_url) {
        const ref = res.data.tx_ref || '';
        const userId = session?.user?.id || '';

        // Store tx_ref for post-payment verification
        sessionStorage.setItem('pending_tx_ref', ref);
        sessionStorage.setItem('pending_user_id', userId);
        setTxRef(ref);

        // ── Open Chapa in a NEW TAB so the user can complete payment ──
        // This prevents the blank-page issue when Chapa fails to render in-app.
        setChapaUrl(res.data.checkout_url);
        window.open(res.data.checkout_url, '_blank', 'noopener,noreferrer');
        setIsProcessing(false);
      } else {
        setIsProcessing(false);
        const errMsg = res.data.message || 'Could not get checkout URL from Chapa.';
        alert('Payment Error: ' + errMsg);
      }

    } catch (error) {
      console.error("Payment initialization failed", error);
      setIsProcessing(false);

      const data = error.response?.data;
      let errMsg = error.message || "Failed to connect to backend";
      if (data) {
        const raw = data.message || data.detail || data.error;
        if (typeof raw === 'string') {
          errMsg = raw;
        } else if (raw !== undefined) {
          errMsg = JSON.stringify(raw);
        } else {
          errMsg = JSON.stringify(data);
        }
      }
      alert("Payment Error: " + errMsg);
    }
  };

  const handlePaymentComplete = () => {
    // User says they completed payment — navigate to profile to verify
    if (txRef) {
      onClose();
      navigate(`/profile?tx_ref=${txRef}`);
    }
  };

  const handleReopenChapa = () => {
    if (chapaUrl) {
      window.open(chapaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card w-full max-w-md p-6 relative bg-secondary border-white/10"
        >
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 text-white/40 hover:text-white"
          >
            <X size={20} />
          </button>

          {/* ── Step 2: Chapa opened — waiting for user to complete payment ── */}
          {chapaUrl ? (
            <div className="text-center py-4 space-y-6">
              <div className="w-16 h-16 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center mx-auto">
                <ExternalLink size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Complete Your Payment</h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  Chapa's payment page has opened in a new tab.<br />
                  Complete your payment there, then come back here and click the button below.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handlePaymentComplete}
                  className="w-full py-4 rounded-xl font-bold text-lg bg-primary-500 hover:bg-primary-400 text-black transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  I've Completed My Payment ✓
                </button>
                <button
                  onClick={handleReopenChapa}
                  className="w-full py-3 rounded-xl font-medium text-sm bg-white/5 hover:bg-white/10 text-white/70 transition-all flex items-center justify-center gap-2 border border-white/10"
                >
                  <RefreshCw size={16} />
                  Re-open Chapa Payment Page
                </button>
              </div>
            </div>
          ) : (
            /* ── Step 1: Select payment method ── */
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Complete Payment</h2>
                <p className="text-primary-400 text-3xl font-bold">{amount} ETB</p>
              </div>

              <div className="space-y-4 mb-8">
                {paymentMethods.map(method => (
                  <div 
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4
                      ${selectedMethod === method.id 
                        ? 'border-primary-500 bg-primary-500/10' 
                        : 'border-white/10 hover:border-white/30 bg-white/5'}
                    `}
                  >
                    <div className={`p-2 rounded-lg bg-white/5 ${method.color}`}>
                      <method.icon size={24} />
                    </div>
                    <span className="font-medium text-lg">{method.name}</span>
                    {selectedMethod === method.id && (
                      <CheckCircle2 className="ml-auto text-primary-500" size={20} />
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={handlePayment}
                disabled={!selectedMethod || isProcessing}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all
                  ${!selectedMethod 
                    ? 'bg-white/5 text-white/40 cursor-not-allowed' 
                    : 'bg-primary-500 hover:bg-primary-400 text-black shadow-lg shadow-primary-500/20'}
                `}
              >
                {isProcessing ? 'Opening Chapa...' : 'Pay Now'}
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PaymentModal;
