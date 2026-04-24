'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Chrome, Send } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nickname: nickname || email.split('@')[0],
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
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

  const handleLineLogin = async () => {
    // LINE OAuth would be configured in Supabase
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'line' as any, // Custom OIDC provider configured in Supabase dashboard
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

        <button
          onClick={handleLineLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#00B900] text-light py-3 rounded-lg hover:bg-opacity-90 transition-all font-medium disabled:opacity-50"
        >
          <Send size={20} />
          เข้าด้วย LINE
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
              onChange={(e) => setNickname(e.target.value)}
              placeholder="ชื่อเล่นของคุณ"
              className="w-full px-4 py-2 rounded-lg bg-dark-gray text-light border border-dark-gray focus:border-primary outline-none transition-colors"
            />
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
          <label className="block text-light text-sm font-medium mb-2">รหัสผ่าน</label>
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
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-primary hover:underline ml-1"
        >
          {isSignUp ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
        </button>
      </p>
    </div>
  );
}
