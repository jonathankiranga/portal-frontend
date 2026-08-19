import React, { useState } from 'react';
import OTPInput from '../components/OTPInput.jsx';
import { requestAdminOtp, verifyAdminOtp } from '../utils/api.js';

export default function LoginPage() {
  const [step, setStep] = useState('credential');
  const [email, setEmail] = useState('jonathankiranga@gmail.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');

  async function handleRequestOtp(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await requestAdminOtp(email.trim());
      setSessionId(data.session_id);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Check your email.');
    }
    setLoading(false);
  }

  async function handleVerify(code) {
    setLoading(true);
    setError('');
    try {
      const data = await verifyAdminOtp(sessionId, code);
      sessionStorage.setItem('admin_token', data.token);
      sessionStorage.setItem('admin_email', data.email);
      window.location.hash = '#/';
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired code');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{
      backgroundImage: 'url(https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80)',
      backgroundSize: 'cover', backgroundPosition: 'center'
    }}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ backgroundColor: '#7B4F9B' }}>
            <span className="text-2xl font-bold text-white">E</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Education APP</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Administrator Portal</p>
        </div>

        <div className="bg-white rounded-card p-6 shadow-xl">
          {step === 'credential' && (
            <form onSubmit={handleRequestOtp}>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#555' }}>
                Admin Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field mb-4"
                autoFocus
                autoComplete="email"
                required
              />
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Sending OTP...' : 'Continue'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <div>
              <p className="text-sm mb-1 text-center" style={{ color: '#666' }}>
                Enter the code sent to
              </p>
              <p className="text-base font-semibold mb-5 text-center" style={{ color: '#7B4F9B' }}>
                {email}
              </p>
              <OTPInput onComplete={handleVerify} />
              <button
                onClick={() => { setStep('credential'); setError(''); }}
                className="w-full mt-3 text-center text-sm"
                style={{ color: '#888' }}
              >
                ← Use a different email
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg text-sm text-center" style={{ backgroundColor: '#FFEBEE', color: '#C62828' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}