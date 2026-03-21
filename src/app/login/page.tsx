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
  const { signIn, signUp } = useAuth();
  const router = useRouter();

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

        <p className="relative z-10 text-xs text-slate-500">&copy; 2026 Giritharan Chockalingam. All rights reserved.</p>
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
