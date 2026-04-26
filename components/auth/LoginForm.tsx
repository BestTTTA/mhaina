'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Chrome, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { NICKNAME_MAX_LENGTH, truncateNickname } from '@/lib/utils';

type Mode = 'signin' | 'signup' | 'forgot';

export function LoginForm() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setPassword('');
    setResetSent(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const safeNickname = truncateNickname(nickname || email.split('@')[0]);
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nickname: safeNickname,
            },
          },
        });

        if (signUpError) throw signUpError;
        alert('กรุณาตรวจสอบอีเมลเพื่อยืนยันการสมัครสมาชิก');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Always use the runtime origin — NEXT_PUBLIC_APP_URL gets baked into
      // the bundle at build time, so a build made on localhost ships with
      // "http://localhost:3000" hardcoded into prod, which is exactly what
      // breaks the recovery link in production.
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (resetError) throw resetError;
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'ส่งอีเมลรีเซ็ตรหัสผ่านไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'profile email',
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Forgot password screen ──────────────────────────────────────────────
  if (mode === 'forgot') {
    return (
      <div className="w-full max-w-md mx-auto">
        <button
          type="button"
          onClick={() => switchMode('signin')}
          className="flex items-center gap-1 text-gray-400 hover:text-light text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          กลับเข้าสู่ระบบ
        </button>

        <h2 className="text-xl font-bold text-light mb-1">รีเซ็ตรหัสผ่าน</h2>
        <p className="text-gray-400 text-sm mb-6">
          กรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้ทางอีเมล
        </p>

        {resetSent ? (
          <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-lg p-4 text-center">
            <CheckCircle2 className="text-emerald-400 mx-auto mb-2" size={32} />
            <p className="text-light font-medium mb-1">ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว</p>
            <p className="text-gray-400 text-sm">
              ตรวจสอบอีเมล <span className="text-light">{email}</span> และคลิกลิงก์เพื่อตั้งรหัสผ่านใหม่
            </p>
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="mt-4 text-primary hover:underline text-sm"
            >
              กลับเข้าสู่ระบบ
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-light text-sm font-medium mb-2">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="อีเมลที่ใช้สมัคร"
                required
                className="w-full px-4 py-2 rounded-lg bg-dark-gray text-light border border-dark-gray focus:border-primary outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-opacity-90 text-light py-3 rounded-lg transition-all font-medium disabled:opacity-50"
            >
              <Mail size={20} />
              {loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
            </button>
          </form>
        )}
      </div>
    );
  }

  // ─── Sign in / sign up screen ────────────────────────────────────────────
  const isSignUp = mode === 'signup';

  return (
    <div className="w-full max-w-md mx-auto">
      {/* OAuth Options */}
      <div className="space-y-3 mb-6">
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-light text-secondary py-3 rounded-lg hover:bg-opacity-90 transition-all font-medium disabled:opacity-50"
        >
          <Chrome size={20} />
          เข้าด้วย Google
        </button>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dark-gray"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-secondary text-gray-400">หรือ</span>
        </div>
      </div>

      {/* Email Form */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isSignUp && (
          <div>
            <label className="block text-light text-sm font-medium mb-2">ชื่อเล่น</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, NICKNAME_MAX_LENGTH))}
              placeholder="ชื่อเล่นของคุณ"
              maxLength={NICKNAME_MAX_LENGTH}
              className="w-full px-4 py-2 rounded-lg bg-dark-gray text-light border border-dark-gray focus:border-primary outline-none transition-colors"
            />
            <p className="text-gray-500 text-xs mt-1 text-right">
              {nickname.length}/{NICKNAME_MAX_LENGTH}
            </p>
          </div>
        )}

        <div>
          <label className="block text-light text-sm font-medium mb-2">อีเมล</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="อีเมลของคุณ"
            required
            className="w-full px-4 py-2 rounded-lg bg-dark-gray text-light border border-dark-gray focus:border-primary outline-none transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-light text-sm font-medium">รหัสผ่าน</label>
            {!isSignUp && (
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-primary text-sm hover:underline"
              >
                ลืมรหัสผ่าน?
              </button>
            )}
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="รหัสผ่าน"
            required
            className="w-full px-4 py-2 rounded-lg bg-dark-gray text-light border border-dark-gray focus:border-primary outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-opacity-90 text-light py-3 rounded-lg transition-all font-medium disabled:opacity-50"
        >
          <Mail size={20} />
          {isSignUp ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
        </button>
      </form>

      {/* Toggle */}
      <p className="text-center text-gray-400 text-sm mt-4">
        {isSignUp ? 'มีบัญชีแล้ว?' : 'ยังไม่มีบัญชี?'}
        <button
          onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
          className="text-primary hover:underline ml-1"
        >
          {isSignUp ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
        </button>
      </p>
    </div>
  );
}
