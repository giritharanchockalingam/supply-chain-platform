'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Truck, Shield, BarChart3, Brain, Lock } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        router.push('/yard/dashboard');
      }
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        setSignupSuccess(true);
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-xl"><Truck size={24} /></div>
            <h1 className="text-2xl font-bold">Supply Chain Command Center</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">Unified Yard, Security, Demand Planning &amp; AI Intelligence</p>
        </div>

        <div className="relative z-10 space-y-6">
          {[
            { icon: Truck, label: 'Yard Operations', desc: 'Real-time truck tracking, dock optimization, detention prevention' },
            { icon: Shield, label: 'Trailer Security', desc: 'Chain of custody, seal verification, geofence monitoring' },
            { icon: BarChart3, label: 'Demand Planning', desc: 'Forecast accuracy, automated replenishment, inventory signals' },
            { icon: Brain, label: 'AI Intelligence', desc: '31 MCP tools, multi-LLM orchestration, natural language queries' },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-lg flex-shrink-0"><f.icon size={18} /></div>
              <div>
                <h3 className="font-semibold text-sm">{f.label}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-xs text-slate-500">&copy; 2026 All rights reserved.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-600 rounded-xl text-white"><Truck size={20} /></div>
            <h1 className="text-xl font-bold text-gray-900">Supply Chain Command Center</h1>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <Lock size={20} className="text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </h2>
          </div>

          {signupSuccess ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
              <div className="text-emerald-600 font-semibold text-lg mb-2">Account created</div>
              <p className="text-sm text-gray-600">Check your email to confirm your account, then sign in.</p>
              <button onClick={() => { setMode('signin'); setSignupSuccess(false); }} className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">
                Go to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Jane Doe" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" minLength={6} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
              )}

              <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Google OAuth */}
              <button
                type="button"
                disabled={googleLoading}
                onClick={async () => {
                  setGoogleLoading(true);
                  setError(null);
                  const { error } = await signInWithGoogle();
                  if (error) { setError(error); setGoogleLoading(false); }
                }}
                className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                {googleLoading ? 'Redirecting...' : 'Continue with Google'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            {mode === 'signin' ? (
              <p className="text-sm text-gray-500">
                No account?{' '}
                <button onClick={() => { setMode('signup'); setError(null); }} className="text-blue-600 font-medium hover:underline">Create one</button>
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <button onClick={() => { setMode('signin'); setError(null); }} className="text-blue-600 font-medium hover:underline">Sign in</button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
