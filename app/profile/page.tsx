'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';
import { userService } from '@/lib/api';
import { Camera, LogOut, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/lib/toast';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const logout = useAuthStore((s) => s.logout);
  const authLoading = useAuthStore((s) => s.isLoading);
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname);
      setBio(profile.bio || '');
    }
  }, [profile]);

  if (authLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-400 mb-4">กรุณาเข้าสู่ระบบ</p>
          <a href="/auth" className="text-primary hover:underline">ไปยังหน้าเข้าสู่ระบบ</a>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const updated = await userService.updateProfile(user!.id, { nickname, bio });
      if (updated) {
        setProfile({ ...profile, nickname, bio });
        setIsEditing(false);
        toast('success', 'บันทึกข้อมูลสำเร็จ');
      } else {
        toast('error', 'บันทึกข้อมูลไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast('error', 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile) return;

    setLoading(true);
    try {
      const url = await userService.uploadAvatar(user.id, file);
      if (!url) {
        toast('error', 'อัพโหลดรูปไม่สำเร็จ');
        return;
      }

      const updated = await userService.updateProfile(user.id, { avatar_url: url });
      setProfile(updated ?? { ...profile, avatar_url: url });
      toast('success', 'เปลี่ยนรูปโปรไฟล์สำเร็จ');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast('error', 'เปลี่ยนรูปโปรไฟล์ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    window.location.href = '/';
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-light font-noto-sans">โปรไฟล์</h1>

      {/* Profile Card */}
      <div className="bg-dark-gray rounded-lg p-6 text-center">
        {/* Avatar */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.nickname}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gray-600 flex items-center justify-center text-4xl">
              👤
            </div>
          )}
          <label className="absolute bottom-0 right-0 bg-primary rounded-full p-2 cursor-pointer hover:bg-opacity-80 transition-all">
            <Camera size={16} className="text-light" />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={loading}
            />
          </label>
        </div>

        {/* Edit Mode */}
        {isEditing ? (
          <div className="space-y-4">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="ชื่อเล่น"
              className="w-full px-4 py-2 rounded-lg bg-secondary text-light border border-dark-gray focus:border-primary outline-none text-center"
            />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="ประวัติส่วนตัว"
              className="w-full px-4 py-2 rounded-lg bg-secondary text-light border border-dark-gray focus:border-primary outline-none text-center text-sm"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary hover:bg-opacity-80 text-light rounded-lg transition-all disabled:opacity-50"
              >
                บันทึก
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2 bg-dark-gray hover:bg-opacity-80 text-light rounded-lg transition-all"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-light mb-2">{profile?.nickname}</h2>
            {profile?.bio && <p className="text-gray-400 text-sm mb-4">{profile.bio}</p>}

            <button
              onClick={() => setIsEditing(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-blue-400 text-light rounded-lg transition-all mb-4"
            >
              <Edit2 size={18} />
              แก้ไขโปรไฟล์
            </button>
          </>
        )}
      </div>

      {/* Stats */}
      {profile && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-dark-gray rounded-lg p-4 text-center">
            <p className="text-primary font-bold text-2xl">{profile.total_catches}</p>
            <p className="text-gray-400 text-sm">ปลาที่ผ่าน</p>
          </div>
          <div className="bg-dark-gray rounded-lg p-4 text-center">
            <p className="text-primary font-bold text-2xl">{profile.total_catches}</p>
            <p className="text-gray-400 text-sm">รวมหมุด</p>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600 rounded-lg transition-all"
      >
        <LogOut size={20} />
        ออกจากระบบ
      </button>
    </div>
  );
}
