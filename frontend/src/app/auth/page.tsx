'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  Calendar,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/utils/api';

type AuthMode = 'login' | 'register' | 'otp-request' | 'otp-verify';

type EmailStatus = {
  state: 'idle' | 'checking' | 'valid' | 'invalid' | 'already_registered';
  message: string;
};

const EMAIL_FORMAT_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const TYPO_DOMAINS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
};

const BLOCKED_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'invalid.com',
  'localhost',
]);

function validateEmailClient(rawEmail: string): { valid: boolean; message?: string } {
  const email = rawEmail.trim().toLowerCase();
  if (!email) {
    return { valid: false, message: 'Email ID is required' };
  }
  const parts = email.split('@');
  if (parts.length !== 2 || !EMAIL_FORMAT_REGEX.test(email)) {
    return { valid: false, message: 'Please enter a valid email address (e.g. name@gmail.com)' };
  }
  const [localPart, domain] = parts;
  if (
    localPart.startsWith('.') ||
    localPart.endsWith('.') ||
    localPart.includes('..') ||
    domain.includes('..')
  ) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  const tld = domain.split('.').pop() || '';
  if (!/^[a-z]{2,24}$/.test(tld)) {
    return { valid: false, message: 'Invalid email domain extension' };
  }
  if (TYPO_DOMAINS[domain]) {
    return {
      valid: false,
      message: `Invalid email domain "${domain}". Did you mean "${TYPO_DOMAINS[domain]}"?`,
    };
  }
  if (BLOCKED_DOMAINS.has(domain)) {
    return { valid: false, message: 'Please use a real email address to receive your OTP' };
  }
  return { valid: true };
}

function extractApiError(err: any, fallback: string): string {
  if (!err?.response) {
    return 'Backend server is offline. Please make sure the server is running on port 3001.';
  }
  const msg = err.response.data?.message;
  if (Array.isArray(msg)) {
    return msg.join(' • ');
  }
  if (typeof msg === 'string' && msg.trim()) {
    return msg;
  }
  return fallback;
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<AuthMode>('login');

  // Registration & Login fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email validation & OTP states
  const [emailStatus, setEmailStatus] = useState<EmailStatus>({ state: 'idle', message: '' });
  const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill(''));
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpInputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync mode from URL (?mode=register)
  useEffect(() => {
    const queryMode = searchParams.get('mode');
    if (queryMode === 'register') {
      setMode('register');
    } else if (queryMode === 'login') {
      setMode('login');
    }
  }, [searchParams]);

  // Handle countdown interval
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Debounced live email availability & domain check during registration
  useEffect(() => {
    if (mode !== 'register' || isOtpVerified) return;

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailStatus({ state: 'idle', message: '' });
      return;
    }

    const clientCheck = validateEmailClient(trimmed);
    if (!clientCheck.valid) {
      setEmailStatus({ state: 'invalid', message: clientCheck.message || 'Invalid email address' });
      return;
    }

    let cancelled = false;
    setEmailStatus({ state: 'checking', message: 'Checking email...' });

    const timer = setTimeout(async () => {
      try {
        const res = await api.post('/auth/check-email', { email: trimmed });
        if (cancelled) return;
        if (!res.data.valid) {
          setEmailStatus({
            state: 'invalid',
            message: res.data.message || 'Invalid email address',
          });
        } else if (!res.data.available) {
          setEmailStatus({
            state: 'already_registered',
            message: res.data.message || 'This email is already registered.',
          });
        } else {
          setEmailStatus({
            state: 'valid',
            message: 'Email is valid and available',
          });
        }
      } catch {
        if (!cancelled) {
          setEmailStatus({ state: 'idle', message: '' });
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [email, mode, isOtpVerified]);

  const resetOtpState = () => {
    setOtpArray(Array(6).fill(''));
    setOtpCode('');
    setOtpSent(false);
    setIsOtpVerified(false);
    setCooldown(0);
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
    if (newMode === 'otp-verify') {
      setOtpArray(Array(6).fill(''));
      setOtpCode('');
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    }
    if (newMode === 'login') {
      setEmailStatus({ state: 'idle', message: '' });
    }
  };

  const handleEmailInputChange = (value: string) => {
    setEmail(value);
    setError(null);
    if (mode === 'register' && (otpSent || isOtpVerified)) {
      resetOtpState();
    }
  };

  const handleSendRegistrationOtp = async () => {
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim().toLowerCase();
    const clientCheck = validateEmailClient(trimmedEmail);
    if (!clientCheck.valid) {
      const msg = clientCheck.message || 'Please enter a valid email address';
      setEmailStatus({ state: 'invalid', message: msg });
      setError(msg);
      return;
    }

    setIsSendingOtp(true);
    try {
      const checkRes = await api.post('/auth/check-email', { email: trimmedEmail });
      if (!checkRes.data.valid) {
        setEmailStatus({ state: 'invalid', message: checkRes.data.message });
        setError(checkRes.data.message);
        return;
      }
      if (!checkRes.data.available) {
        setEmailStatus({ state: 'already_registered', message: checkRes.data.message });
        setError(checkRes.data.message);
        return;
      }

      await api.post('/auth/otp/request', { email: trimmedEmail, purpose: 'register' });
      setEmail(trimmedEmail);
      setEmailStatus({ state: 'valid', message: 'OTP sent to your email address' });
      setOtpSent(true);
      setIsOtpVerified(false);
      setOtpArray(Array(6).fill(''));
      setOtpCode('');
      setCooldown(60);
      setSuccess(`6-digit OTP sent to ${trimmedEmail}. Please check your inbox.`);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch (err: any) {
      const msg = extractApiError(err, 'Failed to send verification OTP.');
      if (err?.response?.status === 409) {
        setEmailStatus({ state: 'already_registered', message: msg });
      }
      setError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyRegistrationOtp = async () => {
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of your email OTP code.');
      return;
    }
    setError(null);
    setSuccess(null);
    setIsVerifyingOtp(true);

    try {
      await api.post('/auth/otp/verify', {
        email: email.trim().toLowerCase(),
        code: otpCode,
        purpose: 'register',
      });
      setIsOtpVerified(true);
      setSuccess('Email OTP verified! Fill your remaining details and create your account.');
    } catch (err: any) {
      setError(extractApiError(err, 'Invalid or expired OTP code.'));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    if (mode === 'register') {
      await handleSendRegistrationOtp();
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post('/auth/otp/request', { email: email.trim().toLowerCase(), purpose: 'login' });
      setSuccess('Verification code resent successfully!');
      setCooldown(60);
      setOtpArray(Array(6).fill(''));
      setOtpCode('');
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(extractApiError(err, 'Failed to resend OTP.'));
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
    newOtp[index] = cleanVal[cleanVal.length - 1];
    setOtpArray(newOtp);
    setOtpCode(newOtp.join(''));

    if (index < 5 && cleanVal) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otpArray];
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
    if (!pastedStr) return;
    const chars = Array(6)
      .fill('')
      .map((_, i) => pastedStr[i] || '');
    setOtpArray(chars);
    setOtpCode(chars.join(''));
    const focusIdx = Math.min(pastedStr.length, 5);
    otpInputsRef.current[focusIdx]?.focus();
  };

  const saveSessionData = (accessToken: string, user: any) => {
    const fullName =
      user.displayName ||
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      user.username;
    localStorage.setItem('momentum_token', accessToken);
    localStorage.setItem('momentum_user', JSON.stringify(user));
    localStorage.setItem('momentum_profile_name', user.username);
    localStorage.setItem('momentum_profile_display_name', fullName);
    localStorage.removeItem('momentum_profile_pic');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'register') {
      const fName = firstName.trim();
      const lName = lastName.trim();
      const parsedAge = Number(age);
      const cleanEmail = email.trim().toLowerCase();

      if (fName.length < 2) {
        setError('First name must be at least 2 characters.');
        return;
      }
      if (!lName) {
        setError('Last name is required.');
        return;
      }
      if (!Number.isInteger(parsedAge) || parsedAge < 10 || parsedAge > 120) {
        setError('Please enter a valid age between 10 and 120.');
        return;
      }
      const clientCheck = validateEmailClient(cleanEmail);
      if (!clientCheck.valid) {
        setError(clientCheck.message || 'Please enter a valid email address.');
        return;
      }
      if (emailStatus.state === 'already_registered') {
        setError(emailStatus.message);
        return;
      }
      if (!isOtpVerified && otpCode.length !== 6) {
        setError('Please verify your Email ID with the 6-digit OTP code before registering.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await api.post('/auth/register', {
          firstName: fName,
          lastName: lName,
          age: parsedAge,
          email: cleanEmail,
          password,
          otpCode: !isOtpVerified ? otpCode : undefined,
        });
        saveSessionData(res.data.accessToken, res.data.user);
        setSuccess('Registration complete! Taking you to the main home page...');
        setTimeout(() => {
          router.replace('/dashboard');
        }, 800);
      } catch (err: any) {
        const msg = extractApiError(err, 'Registration failed. Please check your details.');
        if (err?.response?.status === 409) {
          setEmailStatus({ state: 'already_registered', message: msg });
        }
        setError(msg);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.post('/auth/login', {
          identifier: email.trim(),
          password,
        });
        saveSessionData(res.data.accessToken, res.data.user);
        setSuccess('Logged in successfully! Redirecting to home...');
        setTimeout(() => {
          router.replace('/dashboard');
        }, 800);
      } else if (mode === 'otp-request') {
        const cleanEmail = email.trim().toLowerCase();
        const clientCheck = validateEmailClient(cleanEmail);
        if (!clientCheck.valid) {
          setError(clientCheck.message || 'Invalid email address');
          setIsLoading(false);
          return;
        }
        await api.post('/auth/otp/request', { email: cleanEmail, purpose: 'login' });
        setEmail(cleanEmail);
        setSuccess('OTP verification code sent! Check your inbox.');
        setCooldown(60);
        setMode('otp-verify');
        setOtpArray(Array(6).fill(''));
        setOtpCode('');
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
      } else if (mode === 'otp-verify') {
        const cleanEmail = email.trim().toLowerCase();
        const res = await api.post('/auth/otp/verify', {
          email: cleanEmail,
          code: otpCode,
          purpose: 'login',
        });
        if (res.data.isNewUser) {
          setIsOtpVerified(true);
          setOtpSent(true);
          setEmailStatus({ state: 'valid', message: 'Email verified via OTP' });
          setSuccess('Email verified! Complete your registration details below.');
          setMode('register');
        } else {
          saveSessionData(res.data.accessToken, res.data.user);
          setSuccess('OTP verified successfully! Redirecting to home...');
          setTimeout(() => {
            router.replace('/dashboard');
          }, 800);
        }
      }
    } catch (err: any) {
      setError(extractApiError(err, 'Authentication failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden bg-background">
      {/* Ambient Background Elements */}
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[80px] pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-secondary/15 rounded-full blur-[90px] pointer-events-none -z-10"></div>

      <div className={`w-full transition-all duration-300 ${mode === 'register' ? 'max-w-xl' : 'max-w-md'}`}>
        {/* Back Link to Landing */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors mb-5 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to home
        </Link>

        {/* Glassmorphic Core Container */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-[30px] pointer-events-none"></div>

          {/* Mode Tabs (Sign In / Create Account) */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/5 border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'login' || mode === 'otp-request' || mode === 'otp-verify'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Icon Header */}
          <div className="text-center space-y-1.5 mb-6">
            <div className="inline-flex w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-secondary items-center justify-center font-bold text-lg text-white shadow-lg shadow-primary/20 mb-1">
              M
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'register' && 'Create Your Account'}
              {mode === 'otp-request' && 'OTP Sign In'}
              {mode === 'otp-verify' && 'Verify OTP Code'}
            </h2>
            <p className="text-xs text-muted-foreground px-4">
              {mode === 'login' && 'Log in to access your Momentum home dashboard'}
              {mode === 'register' && 'Complete your profile details and verify your email via OTP'}
              {mode === 'otp-request' && 'Enter your registered email address for instant OTP sign in'}
              {mode === 'otp-verify' && `Enter the 6-digit verification code sent to ${email}`}
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
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* REGISTRATION COLUMNS */}
            {mode === 'register' && (
              <>
                {/* Column 1 & 2: First Name + Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={50}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/20"
                        placeholder="Saurabh"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        minLength={1}
                        maxLength={50}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/20"
                        placeholder="Chakarvarti"
                      />
                    </div>
                  </div>
                </div>

                {/* Column 3: Age */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Age
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      required
                      min={10}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/20"
                      placeholder="e.g. 22"
                    />
                  </div>
                </div>

                {/* Column 4: Email ID + Validation + Send OTP Button */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Email ID
                    </label>
                    {isOtpVerified && (
                      <button
                        type="button"
                        onClick={() => {
                          resetOtpState();
                          setEmailStatus({ state: 'idle', message: '' });
                        }}
                        className="text-[10px] text-primary hover:underline font-semibold"
                      >
                        Change Email
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        disabled={isOtpVerified}
                        value={email}
                        onChange={(e) => handleEmailInputChange(e.target.value)}
                        className={`w-full h-10 pl-9 pr-3 rounded-xl bg-white/5 border text-sm text-white placeholder-muted-foreground focus:outline-none transition-colors focus:ring-1 disabled:opacity-60 ${
                          emailStatus.state === 'invalid' || emailStatus.state === 'already_registered'
                            ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400/20'
                            : isOtpVerified || emailStatus.state === 'valid'
                            ? 'border-emerald-500/40 focus:border-emerald-400 focus:ring-emerald-400/20'
                            : 'border-white/10 focus:border-primary focus:ring-primary/20'
                        }`}
                        placeholder="you@gmail.com"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={
                        isSendingOtp ||
                        isOtpVerified ||
                        cooldown > 0 ||
                        !email.trim() ||
                        emailStatus.state === 'invalid' ||
                        emailStatus.state === 'already_registered'
                      }
                      onClick={handleSendRegistrationOtp}
                      className="h-10 px-4 rounded-xl bg-primary/90 hover:bg-primary text-white text-xs font-bold whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {isSendingOtp ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isOtpVerified ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </>
                      ) : cooldown > 0 ? (
                        `Resend (${cooldown}s)`
                      ) : otpSent ? (
                        'Resend OTP'
                      ) : (
                        'Send OTP'
                      )}
                    </button>
                  </div>

                  {/* Live Email Validation Feedback */}
                  {emailStatus.state === 'checking' && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> {emailStatus.message}
                    </p>
                  )}
                  {(emailStatus.state === 'invalid' || emailStatus.state === 'already_registered') && (
                    <div className="flex items-center justify-between gap-2 text-[11px] text-red-400">
                      <span>{emailStatus.message}</span>
                      {emailStatus.state === 'already_registered' && (
                        <button
                          type="button"
                          onClick={() => handleModeChange('login')}
                          className="text-primary hover:underline font-bold shrink-0"
                        >
                          Sign in instead →
                        </button>
                      )}
                    </div>
                  )}
                  {emailStatus.state === 'valid' && !isOtpVerified && (
                    <p className="text-[11px] text-emerald-400">
                      {otpSent ? emailStatus.message : 'Valid email & available — click Send OTP to verify'}
                    </p>
                  )}
                </div>

                {/* Column 5: Dedicated Email OTP Verification Column */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-primary" />
                      Email OTP Verification
                    </label>
                    {isOtpVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    ) : otpSent ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-[10px] font-bold text-primary">
                        Code Sent
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold text-muted-foreground">
                        Pending
                      </span>
                    )}
                  </div>

                  {!isOtpVerified ? (
                    <>
                      <div className="flex flex-col sm:flex-row items-center gap-2.5">
                        <div className="flex justify-between gap-1.5 w-full sm:flex-1" onPaste={handleOtpPaste}>
                          {otpArray.map((digit, index) => (
                            <input
                              key={index}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              disabled={!otpSent}
                              value={digit}
                              ref={(el) => {
                                otpInputsRef.current[index] = el;
                              }}
                              onChange={(e) => handleOtpInputChange(e.target.value, index)}
                              onKeyDown={(e) => handleOtpKeyDown(e, index)}
                              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-center text-white focus:outline-none focus:border-primary transition-colors font-mono focus:ring-2 focus:ring-primary/20 disabled:opacity-40"
                              placeholder="•"
                            />
                          ))}
                        </div>

                        <button
                          type="button"
                          disabled={!otpSent || otpCode.length !== 6 || isVerifyingOtp}
                          onClick={handleVerifyRegistrationOtp}
                          className="w-full sm:w-auto h-10 px-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                          {isVerifyingOtp ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            'Verify OTP'
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {otpSent
                          ? 'Enter the 6-digit OTP code from your email and click Verify OTP.'
                          : 'Click "Send OTP" next to your Email ID to receive your verification code.'}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Your email ({email}) is verified and ready for account creation.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* General Email Field (Login / Standalone OTP Sign-In) */}
            {(mode === 'login' || mode === 'otp-request') && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  {mode === 'login' ? 'Email or Username' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type={mode === 'otp-request' ? 'email' : 'text'}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/20"
                    placeholder={mode === 'login' ? 'email@example.com or username' : 'you@gmail.com'}
                  />
                </div>
              </div>
            )}

            {/* Password input field (Create Password for Register / Password for Login) */}
            {(mode === 'login' || mode === 'register') && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    {mode === 'register' ? 'Create Password' : 'Password'}
                  </label>
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
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 pl-9 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary/20"
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === 'register' && password.length > 0 && (
                  <p
                    className={`text-[11px] ${
                      password.length >= 8 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {password.length >= 8
                      ? 'Password length looks good ✓'
                      : `Need ${8 - password.length} more character(s) (minimum 8)`}
                  </p>
                )}
              </div>
            )}

            {/* Standalone OTP Verify Grid (for OTP Login) */}
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
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      ref={(el) => {
                        otpInputsRef.current[index] = el;
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || (mode === 'otp-verify' && otpCode.length !== 6)}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20 mt-4"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'register' && 'Complete Registration'}
                  {mode === 'otp-request' && 'Send Verification OTP'}
                  {mode === 'otp-verify' && 'Verify OTP Code'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Interactive Mode Switching Footer */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center text-xs text-muted-foreground space-y-2.5">
            {mode === 'login' && (
              <p>
                New to Momentum?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('register')}
                  className="text-primary hover:underline font-bold"
                >
                  Create an account
                </button>
              </p>
            )}

            {mode === 'register' && (
              <p>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="text-primary hover:underline font-bold"
                >
                  Sign In
                </button>
              </p>
            )}

            {mode === 'otp-request' && (
              <p>
                Prefer password login?{' '}
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="text-primary hover:underline font-bold"
                >
                  Sign In with Password
                </button>
              </p>
            )}

            {mode === 'otp-verify' && (
              <div className="space-y-2">
                <p>
                  Didn&apos;t receive the code?{' '}
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
        <div className="flex justify-center items-center gap-6 mt-7 text-[10px] text-muted-foreground">
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

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
