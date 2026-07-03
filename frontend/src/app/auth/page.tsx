'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Loader2, 
  ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';

type AuthMode = 'login' | 'register' | 'otp-request' | 'otp-verify';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Custom OTP verification states
  const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill(''));
  const [otpCode, setOtpCode] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpInputsRef = useRef<HTMLInputElement[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle countdown interval
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
    if (newMode === 'otp-verify') {
      setOtpArray(Array(6).fill(''));
      setOtpCode('');
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/auth/otp/request', { email });
      setSuccess('Verification code resent successfully!');
      setCooldown(60);
      setOtpArray(Array(6).fill(''));
      setOtpCode('');
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpInputChange = (val: string, index: number) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    if (!cleanVal) {
      const newOtp = [...otpArray];
      newOtp[index] = '';
      setOtpArray(newOtp);
      setOtpCode(newOtp.join(''));
      return;
    }

    const newOtp = [...otpArray];
    newOtp[index] = cleanVal[cleanVal.length - 1]; // pick last char
    setOtpArray(newOtp);
    setOtpCode(newOtp.join(''));

    // Auto-focus next input field
    if (index < 5 && cleanVal) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otpArray];
      
      // If current is empty, delete previous and focus it
      if (!otpArray[index] && index > 0) {
        newOtp[index - 1] = '';
        setOtpArray(newOtp);
        setOtpCode(newOtp.join(''));
        otpInputsRef.current[index - 1]?.focus();
      } else {
        newOtp[index] = '';
        setOtpArray(newOtp);
        setOtpCode(newOtp.join(''));
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedStr = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pastedStr.length === 6) {
      const chars = pastedStr.split('');
      setOtpArray(chars);
      setOtpCode(pastedStr);
      otpInputsRef.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'login') {
        const res = await api.post('/auth/login', { identifier: email, password });
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`;
        setSuccess('Logged in successfully! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else if (mode === 'register') {
        const res = await api.post('/auth/register', { email, username, password });
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`;
        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else if (mode === 'otp-request') {
        await api.post('/auth/otp/request', { email });
        setSuccess('OTP verification code sent! Check your inbox.');
        setCooldown(60);
        setMode('otp-verify');
        setOtpArray(Array(6).fill(''));
        setOtpCode('');
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
      } else if (mode === 'otp-verify') {
        const res = await api.post('/auth/otp/verify', { email, code: otpCode });
        if (res.data.isNewUser) {
          setIsOtpVerified(true);
          setSuccess('OTP verified successfully! Create a username and password to complete registration.');
          setMode('register');
        } else {
          api.defaults.headers.common['Authorization'] = `Bearer ${res.data.accessToken}`;
          setSuccess('OTP verified successfully! Redirecting...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
      }
    } catch (err: any) {
      if (!err.response) {
        setError('Backend server is offline. Please make sure the NestJS server is running on port 3001.');
      } else {
        setError(err.response.data?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden bg-background">
      {/* Premium Ambient Background Elements */}
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[80px] pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-secondary/15 rounded-full blur-[90px] pointer-events-none -z-10"></div>

      <div className="w-full max-w-md">
        {/* Back Link to Landing */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to home
        </Link>

        {/* Glassmorphic Core Container */}
        <div className="glass-panel p-8 rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-[30px] pointer-events-none"></div>

          {/* Icon Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary items-center justify-center font-bold text-lg text-white shadow-lg shadow-primary/20 mb-2">
              M
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'register' && (isOtpVerified ? 'Complete Signup' : 'Create Account')}
              {mode === 'otp-request' && 'OTP Register / Login'}
              {mode === 'otp-verify' && 'Verify OTP Code'}
            </h2>
            <p className="text-xs text-muted-foreground px-4">
              {mode === 'login' && 'Log in to access your customized social productivity dashboard'}
              {mode === 'register' && (isOtpVerified ? 'Choose a unique username and secure password' : 'Start optimizing your productivity today')}
              {mode === 'otp-request' && 'Enter your email address. We will verify or log you in securely.'}
              {mode === 'otp-verify' && `We sent a secure 6-digit verification code to ${email}`}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Action Feedback Panel */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium shake-animation"
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium"
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Username Selection Field (Registration Step 2) */}
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/20"
                    placeholder="alex_productivity"
                  />
                </div>
              </div>
            )}

            {/* General Email Field (Request phase / Password Login phase) */}
            {mode !== 'otp-verify' && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  {mode === 'login' ? 'Email or Username' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    disabled={mode === 'register' && isOtpVerified}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                    placeholder={mode === 'login' ? 'email@example.com or username' : 'email@example.com'}
                  />
                </div>
              </div>
            )}

            {/* Password input fields (Registration completion / login validation) */}
            {(mode === 'login' || mode === 'register') && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Password</label>
                  {mode === 'login' && (
                    <button 
                      type="button"
                      onClick={() => handleModeChange('otp-request')}
                      className="text-[10px] text-primary hover:underline font-semibold"
                    >
                      Use OTP Login instead
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/20"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {/* Premium Animated 6-Digit OTP Grid */}
            {mode === 'otp-verify' && (
              <div className="space-y-3 py-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block text-center">
                  Enter 6-Digit Code
                </label>
                <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                  {otpArray.map((digit, index) => (
                    <motion.input
                      key={index}
                      type="text"
                      maxLength={1}
                      value={digit}
                      ref={(el) => {
                        otpInputsRef.current[index] = el!;
                      }}
                      onChange={(e) => handleOtpInputChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      whileFocus={{ scale: 1.05, borderColor: '#6366f1' }}
                      className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-lg font-bold text-center text-white focus:outline-none transition-colors font-mono focus:ring-2 focus:ring-primary/20"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Action Trigger Buttons */}
            <button
              type="submit"
              disabled={isLoading || (mode === 'otp-verify' && otpCode.length !== 6)}
              className="w-full h-10 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20 mt-6"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'register' && (isOtpVerified ? 'Complete Signup' : 'Register')}
                  {mode === 'otp-request' && 'Send Verification OTP'}
                  {mode === 'otp-verify' && 'Verify OTP Code'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Interactive Mode Switching Panels */}
          <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-muted-foreground space-y-3">
            {mode === 'login' && (
              <p>
                Don't have an account?{' '}
                <button 
                  onClick={() => handleModeChange('otp-request')} 
                  className="text-primary hover:underline font-bold"
                >
                  Register / Login with OTP
                </button>
              </p>
            )}

            {mode === 'register' && !isOtpVerified && (
              <p>
                Want to register securely?{' '}
                <button 
                  onClick={() => handleModeChange('otp-request')} 
                  className="text-primary hover:underline font-bold"
                >
                  Verify Email OTP First
                </button>
              </p>
            )}

            {mode === 'register' && (
              <p>
                Already have an account?{' '}
                <button 
                  onClick={() => handleModeChange('login')} 
                  className="text-primary hover:underline font-bold"
                >
                  Sign In
                </button>
              </p>
            )}

            {mode === 'otp-request' && (
              <p>
                Already have an account?{' '}
                <button 
                  onClick={() => handleModeChange('login')} 
                  className="text-primary hover:underline font-bold"
                >
                  Sign In
                </button>
              </p>
            )}

            {mode === 'otp-verify' && (
              <div className="space-y-2">
                <p>
                  Didn't receive the code?{' '}
                  <button 
                    type="button"
                    disabled={cooldown > 0}
                    onClick={handleResendOtp}
                    className="text-primary hover:underline font-bold disabled:opacity-50 disabled:no-underline"
                  >
                    {cooldown > 0 ? `Resend Code in ${cooldown}s` : 'Resend Code'}
                  </button>
                </p>
                <p>
                  <button 
                    type="button"
                    onClick={() => handleModeChange('otp-request')}
                    className="text-muted-foreground hover:text-white transition-colors"
                  >
                    Change Email Address
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Security / Certification Footer Badges */}
        <div className="flex justify-center items-center gap-6 mt-8 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>End-to-End Encrypted</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Adaptive Planner Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
}
