'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/lib/toast';

type Status = 'verifying' | 'ready' | 'invalid' | 'submitting' | 'done';

export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();

  const [status, setStatus] = useState<Status>('verifying');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (
        session &&
        (event === 'PASSWORD_RECOVERY' ||
          event === 'SIGNED_IN' ||
          event === 'INITIAL_SESSION' ||
          event === 'TOKEN_REFRESHED')
      ) {
        setStatus('ready');
      }
    });

    const init = async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(window.location.hash.slice(1));

      // Surface explicit errors first — Supabase appends them when the link
      // is invalid/expired.
      const errDesc =
        hash.get('error_description') || url.searchParams.get('error_description');
      if (errDesc) {
        if (cancelled) return;
        setError(decodeURIComponent(errDesc.replace(/\+/g, ' ')));
        setStatus('invalid');
        return;
      }

      // The SDK auto-detects URL params on init (detectSessionInUrl=true) and
      // may have already exchanged the PKCE code. Always check the current
      // session FIRST so we don't try to re-exchange a consumed code.
      let { data } = await supabase.auth.getSession();

      if (!data.session) {
        const code = url.searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            // Race — SDK may have consumed the code between our checks.
            const recheck = await supabase.auth.getSession();
            if (!cancelled && recheck.data.session) {
              window.history.replaceState({}, '', '/auth/reset-password');
              setStatus('ready');
              return;
            }
            if (cancelled) return;
            setError(exchangeError.message);
            setStatus('invalid');
            return;
          }
          ({ data } = await supabase.auth.getSession());
        }
      }

      if (cancelled) return;
      if (data.session) {
        window.history.replaceState({}, '', '/auth/reset-password');
        setStatus('ready');
        return;
      }

      // No session and no code in URL — wait briefly for any pending event
      // before declaring the link invalid.
      setTimeout(() => {
        if (cancelled) return;
        setStatus((s) => (s === 'verifying' ? 'invalid' : s));
      }, 2000);
    };

    init();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setStatus('submitting');
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message || 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ');
      setStatus('ready');
      return;
    }

    setStatus('done');
    toast('success', 'ตั้งรหัสผ่านใหม่เรียบร้อย');
    setTimeout(() => router.push('/'), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary to-dark-gray flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-primary mb-2 font-noto-sans">
          หมายน้า
        </h1>
        <p className="text-center text-gray-400 mb-8">ตั้งรหัสผ่านใหม่</p>

        <div className="bg-secondary/60 border border-dark-gray rounded-2xl p-6">
          {status === 'verifying' && (
            <p className="text-center text-gray-400 py-8">กำลังตรวจสอบลิงก์...</p>
          )}

          {status === 'invalid' && (
            <div className="text-center py-4">
              <p className="text-light font-medium mb-2">ลิงก์ไม่ถูกต้องหรือหมดอายุ</p>
              <p className="text-gray-400 text-sm mb-4">
                กรุณาขอลิงก์รีเซ็ตรหัสผ่านใหม่อีกครั้ง
              </p>
              <Link
                href="/auth"
                className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
              >
                <ArrowLeft size={16} />
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          )}

          {status === 'done' && (
            <div className="text-center py-4">
              <CheckCircle2 className="text-emerald-400 mx-auto mb-2" size={40} />
              <p className="text-light font-medium">ตั้งรหัสผ่านใหม่เรียบร้อย</p>
              <p className="text-gray-400 text-sm mt-1">กำลังพาไปหน้าหลัก...</p>
            </div>
          )}

          {(status === 'ready' || status === 'submitting') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-light text-sm font-medium mb-2">
                  รหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 rounded-lg bg-dark-gray text-light border border-dark-gray focus:border-primary outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-light text-sm font-medium mb-2">
                  ยืนยันรหัสผ่าน
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 rounded-lg bg-dark-gray text-light border border-dark-gray focus:border-primary outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-opacity-90 text-light py-3 rounded-lg transition-all font-medium disabled:opacity-50"
              >
                <Lock size={20} />
                {status === 'submitting' ? 'กำลังบันทึก...' : 'ยืนยันรหัสผ่านใหม่'}
              </button>

              <Link
                href="/auth"
                className="flex items-center justify-center gap-1 text-gray-400 hover:text-light text-sm pt-2 transition-colors"
              >
                <ArrowLeft size={14} />
                กลับเข้าสู่ระบบ
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
