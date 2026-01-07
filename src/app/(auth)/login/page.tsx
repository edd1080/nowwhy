'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Zap, Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({
        type: 'success',
        text: 'Check your email for the login link.',
      });
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex bg-white">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-3 mb-12 group">
            <div className="w-10 h-10 bg-brand-500 text-white flex items-center justify-center rounded-xl shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-slate-900">NowWhy</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">
              Welcome back
            </h1>
            <p className="text-slate-500">
              Sign in to see what&apos;s happening on your site right now.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-slate-900 text-white font-semibold hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 group shadow-lg shadow-slate-900/10 hover:shadow-orange-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending link...</span>
                </>
              ) : (
                <>
                  <span>Send magic link</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Message */}
          {message && (
            <div
              className={`mt-6 p-4 rounded-xl text-sm flex items-start gap-3 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-100'
                  : 'bg-red-50 text-red-700 border border-red-100'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Footer note */}
          <p className="mt-8 text-center text-sm text-slate-400">
            No password required. We&apos;ll send you a secure magic link.
          </p>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-slate-400">
            By signing in, you agree to our{' '}
            <a href="#" className="text-slate-600 hover:text-brand-500 transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-slate-600 hover:text-brand-500 transition-colors">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 bg-brand-500 relative overflow-hidden">
        {/* Noise texture */}
        <div className="absolute inset-0 noise-overlay"></div>

        {/* Decorative blobs */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 animate-blob animation-delay-2000"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 lg:p-16">
          <div className="max-w-md">
            <h2 className="text-4xl font-semibold text-white tracking-tight mb-6">
              Real-time visitor awareness
            </h2>
            <p className="text-orange-100 text-lg leading-relaxed mb-8">
              Know who&apos;s on your site right now. Understand their intent. Get alerted when it matters.
            </p>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Intent classification in real-time</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Friction detection for stuck visitors</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium">Slack alerts for high-intent visitors</span>
              </div>
            </div>
          </div>
        </div>

        {/* Big typography */}
        <div className="absolute bottom-0 right-0 mix-blend-soft-light opacity-10 pointer-events-none select-none">
          <span className="text-[14rem] font-bold leading-none tracking-tighter text-white">
            NOW
          </span>
        </div>
      </div>
    </main>
  );
}
