'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, Shield, X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { GithubIcon, GoogleIcon } from '@/components/icons/social-icons';
import { createClient } from '@/lib/supabase/client';
import { getAuthCallbackUrl } from '@/lib/supabase/auth-redirect';
import { loginSchema, signupSchema } from '@/lib/validation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccess?: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
}: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMode(initialMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [initialMode, isOpen]);

  // Focus trap & ESC to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 50);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Password strength calculator
  const calculatePasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: 'Empty', color: 'bg-white/10' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-alert-red' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-warn' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-lime-400' };
    return { score: 4, label: 'Strong', color: 'bg-acid' };
  };

  const strength = calculatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Spam honeypot check
    if (honeypot) return;

    const supabase = createClient();

    if (mode === 'login') {
      const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
        setErrorMessage(result.error.issues[0]?.message || 'Please check your input');
        return;
      }

      setLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: result.data.email,
          password: result.data.password,
        });

        if (error) {
          setErrorMessage(error.message || 'Invalid email or password.');
          setLoading(false);
          return;
        }

        onClose();
        if (onSuccess) onSuccess();
        router.push('/dashboard');
        router.refresh();
      } catch {
        setErrorMessage('Unable to connect to authentication service.');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'signup') {
      const result = signupSchema.safeParse({
        email,
        password,
        confirmPassword,
        acceptedTerms,
        honeypot,
      });

      if (!result.success) {
        setErrorMessage(result.error.issues[0]?.message || 'Please check your input');
        return;
      }

      setLoading(true);
      try {
        const { error } = await supabase.auth.signUp({
          email: result.data.email,
          password: result.data.password,
          options: {
            emailRedirectTo: getAuthCallbackUrl('/dashboard'),
          },
        });

        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }

        setSuccessMessage('Verification link sent. Please verify your email before logging in.');
      } catch {
        setErrorMessage('Failed to create account. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'forgot') {
      if (!email || !email.includes('@')) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }

      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login?mode=reset`,
        });

        if (error) {
          setErrorMessage('Unable to send reset instructions.');
        } else {
          setSuccessMessage('If that email exists in our records, a password reset link has been dispatched.');
        }
      } catch {
        setErrorMessage('Request failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    if (mode === 'signup' && !acceptedTerms) {
      setErrorMessage('Please accept the Terms and Privacy Policy before creating an account.');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAuthCallbackUrl('/dashboard'),
        },
      });
      if (error) {
        setErrorMessage(`OAuth authentication failed: ${error.message}`);
      }
    } catch {
      setErrorMessage('OAuth connection error.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-2xl bg-[#111114] border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden hud-frame font-mono"
      >
        {/* Subtle Scanline pass overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-[0.04] bg-gradient-to-b from-transparent via-acid to-transparent animate-scanline-slow"
        />

        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#0a0a0b] border-b border-white/10 text-muted-dim text-xs">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-alert-red" />
              <div className="w-2.5 h-2.5 rounded-full bg-warn-amber" />
              <div className="w-2.5 h-2.5 rounded-full bg-terminal" />
            </div>
            <span className="text-[11px] text-muted-body ml-2">vanguard@auth-gateway:~</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-dim hover:text-white p-1 rounded transition-colors"
            aria-label="Close authentication modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-7">

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-obsidian-card border border-acid flex items-center justify-center text-acid shadow-[0_0_12px_rgba(163,230,53,0.25)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 id="auth-modal-title" className="text-xl font-bold text-muted-heading">
              {mode === 'login' && 'Sign in to VanguardAPI'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'forgot' && 'Reset your password'}
            </h2>
            <p className="text-xs text-muted-body">
              {mode === 'login' && 'Enter your credentials to access your API targets'}
              {mode === 'signup' && 'Zero-trust verification requires an authorized account'}
              {mode === 'forgot' && 'We will send you a secure password reset link'}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        {mode !== 'forgot' && (
          <div className="flex p-1 mb-6 rounded-lg bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                mode === 'login'
                  ? 'bg-acid text-obsidian shadow-sm'
                  : 'text-muted-body hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                mode === 'signup'
                  ? 'bg-acid text-obsidian shadow-sm'
                  : 'text-muted-body hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 mb-5 text-xs text-red-200 bg-alert-red/15 border border-alert-red/35 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-alert-red" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-3 mb-5 text-xs text-emerald-200 bg-emerald-500/15 border border-emerald-500/35 rounded-lg">
            <Shield className="w-4 h-4 flex-shrink-0 text-acid" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot field for spam prevention */}
          <input
            type="text"
            name="vanguard_bot_check"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Email Field */}
          <div>
            <label className="block text-xs font-mono text-muted-dim uppercase mb-1.5">
              Work or Personal Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-body" />
              <input
                ref={emailInputRef}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-obsidian border border-white/15 focus:border-acid rounded-lg text-sm text-white placeholder:text-muted-dim outline-none transition-colors font-mono"
              />
            </div>
          </div>

          {/* Password Field */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-mono text-muted-dim uppercase">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-acid hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-body" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-obsidian border border-white/15 focus:border-acid rounded-lg text-sm text-white placeholder:text-muted-dim outline-none transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-body hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength bar on signup */}
              {mode === 'signup' && password.length > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-[11px] font-mono text-muted-dim mb-1">
                    <span>Password Strength</span>
                    <span className="font-bold">{strength.label}</span>
                  </div>
                  <div className="flex gap-1 h-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`flex-1 rounded-full ${
                          step <= strength.score ? strength.color : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Confirm Password (Signup only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-mono text-muted-dim uppercase mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-body" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-obsidian border border-white/15 focus:border-acid rounded-lg text-sm text-white placeholder:text-muted-dim outline-none transition-colors font-mono"
                />
              </div>
            </div>
          )}

          {/* Mandatory Ethical Authorization Mandate Checkbox (Signup only) */}
          {mode === 'signup' && (
            <div className="flex items-start gap-2.5 pt-2">
              <input
                type="checkbox"
                id="modal-terms-checkbox"
                required
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-obsidian text-acid focus:ring-acid accent-acid"
              />
              <label htmlFor="modal-terms-checkbox" className="text-xs text-muted-body leading-relaxed">
                I agree to the Terms of Service & Privacy Policy, and{' '}
                <strong className="text-white">
                  I will strictly only scan APIs I own or am explicitly authorized to test.
                </strong>
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 rounded-lg bg-acid hover:bg-acid-hover text-obsidian font-bold text-sm shadow-[0_2px_12px_rgba(163,230,53,0.25)] transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </button>
        </form>

        {/* Back to login from forgot password */}
        {mode === 'forgot' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setMode('login')}
              className="text-xs text-acid hover:underline"
            >
              Back to Sign In
            </button>
          </div>
        )}

        {/* OAuth Dividers (Login & Signup only) */}
        {mode !== 'forgot' && (
          <>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] font-mono text-muted-dim uppercase">Or continue with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuth('github')}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-white transition-all disabled:opacity-50"
              >
                <GithubIcon className="w-4 h-4" />
                <span>GitHub</span>
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-white transition-all disabled:opacity-50"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>Google</span>
              </button>
            </div>
          </>
        )}
        </div>
      </motion.div>
    </motion.div>
  );
}
