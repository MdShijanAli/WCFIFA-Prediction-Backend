import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Shield, CheckCircle, Trophy, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PaymentPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [txnId, setTxnId] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get('demo');
    const id = params.get('txnId');

    if (demo && id) {
      setTxnId(id);
      setChecking(false);
      return;
    }

    paymentApi.getStatus().then(res => {
      if (res.data.payment?.status === 'COMPLETED') {
        updateUser({ hasPaid: true });
        navigate('/dashboard');
      }
    }).catch(() => {}).finally(() => setChecking(false));
  }, []);

  const handleInitiatePayment = async () => {
    setLoading(true);
    try {
      const res = await paymentApi.initiate();
      window.location.href = res.data.paymentUrl;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
      setLoading(false);
    }
  };

  const handleConfirmDemo = async () => {
    setConfirming(true);
    try {
      await paymentApi.confirmDemo(txnId);
      updateUser({ hasPaid: true });
      toast.success('Payment confirmed!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error('Failed to confirm payment');
    } finally {
      setConfirming(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (txnId) {
    // Demo confirmation page
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md card text-center">
          <div className="w-16 h-16 bg-primary-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Confirm Payment</h2>
          <p className="text-gray-400 mb-2">Transaction ID: <span className="text-white font-mono">{txnId}</span></p>
          <p className="text-gray-400 mb-8">Amount: <span className="text-white font-bold">৳500</span></p>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 text-left">
            <p className="text-yellow-400 text-sm font-medium">Demo Mode</p>
            <p className="text-gray-400 text-xs mt-1">This is a demo payment. In production, SSLCommerz gateway will handle actual transactions.</p>
          </div>
          <button onClick={handleConfirmDemo} disabled={confirming} className="btn-primary w-full">
            {confirming ? 'Confirming...' : 'Confirm Payment (Demo)'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-white font-bold text-xl">NBWC Prediction</h1>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-white mb-2">Registration Fee</h2>
          <p className="text-gray-400 mb-8">One-time payment to participate in all rounds</p>

          {/* Price card */}
          <div className="bg-gradient-to-br from-primary-900/50 to-gray-800 border border-primary-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-300">Registration Fee</span>
              <span className="text-3xl font-bold text-white">৳500</span>
            </div>
            <div className="space-y-2">
              {[
                'Access to all 6 rounds',
                'Leaderboard participation',
                'Real-time score updates',
                'Compete with players nationwide',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Points table */}
          <div className="bg-gray-800 rounded-xl p-4 mb-6">
            <h3 className="text-white font-semibold mb-3 text-sm">Points Per Round</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { round: 'R32', pts: 2 }, { round: 'R16', pts: 4 }, { round: 'R8', pts: 6 },
                { round: 'QF', pts: 8 }, { round: 'SF', pts: 10 }, { round: 'Final', pts: 20 },
              ].map(r => (
                <div key={r.round} className="bg-gray-900 rounded-lg p-2 text-center">
                  <div className="text-yellow-400 font-bold">{r.pts} pts</div>
                  <div className="text-gray-500 text-xs">{r.round}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-500 text-xs mb-6">
            <Shield className="w-4 h-4" />
            <span>Secured by SSLCommerz payment gateway</span>
          </div>

          <button
            onClick={handleInitiatePayment}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            {loading ? 'Redirecting to payment...' : 'Pay ৳500 & Start Playing'}
          </button>
        </div>
      </div>
    </div>
  );
}
