'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera, ImagePlus, MapPin } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { pinService } from '@/lib/api';
import { FISH_SPECIES } from '@/lib/utils';
import { getCurrentLocation } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export default function NewPinPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [fishSpecies, setFishSpecies] = useState('');
  const [weight, setWeight] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getLocation = async () => {
      try {
        const coords = await getCurrentLocation();
        setLocation({
          lat: coords.latitude,
          lng: coords.longitude,
        });
      } catch (err) {
        console.error('Error getting location:', err);
        setError('ไม่สามารถเข้าถึงตำแหน่งได้');
      }
    };

    getLocation();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so the same file can be picked again after removal.
    e.target.value = '';
    if (!file) return;

    if (images.length >= 2) {
      setError('สามารถอัพโหลดได้สูงสุด 2 รูป');
      return;
    }

    const newImages = [...images, file];
    setImages(newImages);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviews([...previews, reader.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!location) {
      setError('ไม่สามารถหาตำแหน่งได้');
      return;
    }

    if (!fishSpecies) {
      setError('กรุณาเลือกชนิดปลา');
      return;
    }

    if (images.length === 0) {
      setError('กรุณาเลือกรูปอย่างน้อย 1 รูป');
      return;
    }

    setLoading(true);

    try {
      await pinService.createPin({
        user_id: user!.id,
        latitude: location.lat,
        longitude: location.lng,
        fish_species: fishSpecies,
        fish_weight: weight ? parseFloat(weight) : null,
        description,
        image_url_1: images[0] as any,
        image_url_2: images[1] as any,
        likes_count: 0,
      });

      // Navigate to success page or back to map
      router.push('/map');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  if (!location) {
    return <LoadingSpinner fullScreen message="กำลังหาตำแหน่ง..." />;
  }

  return (
    <div className="p-4 space-y-6 pb-28">
      {/* Header */}
      <h1 className="text-2xl font-bold text-light font-noto-sans">ปักหมุดตกปลา</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Location */}
        {location && (
          <div className="bg-dark-gray rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={18} className="text-primary" />
              <p className="text-light font-medium">ตำแหน่งปัจจุบัน</p>
            </div>
            <p className="text-gray-400 text-sm">
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
            <p className="text-gray-400 text-xs mt-1">ปักหมุดได้เฉพาะที่ตำแหน่งปัจจุบันเท่านั้น</p>
          </div>
        )}

        {/* Fish Species */}
        <div>
          <label className="block text-light font-medium mb-2">ชนิดปลา *</label>
          <SearchableSelect
            value={fishSpecies}
            onChange={setFishSpecies}
            options={FISH_SPECIES}
            placeholder="เลือกชนิดปลา"
            required
          />
        </div>

        {/* Weight */}
        <div>
          <label className="block text-light font-medium mb-2">น้ำหนัก (กก.)</label>
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="น้ำหนักปลา"
            className="w-full px-4 py-2 rounded-lg bg-dark-gray text-light border border-dark-gray focus:border-primary outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-light font-medium mb-2">คำบรรยาย</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="บรรยายประกอบการตกปลา..."
            className="w-full px-4 py-2 rounded-lg bg-dark-gray text-light border border-dark-gray focus:border-primary outline-none"
            rows={4}
          />
        </div>

        {/* Images */}
        <div>
          <label className="block text-light font-medium mb-3">รูปภาพ * ({images.length}/2)</label>

          {/* Image Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {previews.map((preview, idx) => (
                <div key={idx} className="relative">
                  <Image
                    src={preview}
                    alt={`Preview ${idx + 1}`}
                    width={100}
                    height={100}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Buttons — using <label>+<input> so the browser sees a native
              user gesture. Programmatic .click() on a hidden input causes some
              Android browsers to ignore `capture` and fall back to file picker. */}
          {images.length < 2 && (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-center gap-2 px-4 py-3 bg-dark-gray hover:bg-opacity-80 text-light rounded-lg border border-dark-gray transition-all cursor-pointer">
                <Camera size={20} />
                ถ่ายรูป
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="sr-only"
                />
              </label>
              <label className="flex items-center justify-center gap-2 px-4 py-3 bg-dark-gray hover:bg-opacity-80 text-light rounded-lg border border-dark-gray transition-all cursor-pointer">
                <ImagePlus size={20} />
                อัพโหลด
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                />
              </label>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-primary hover:bg-opacity-80 text-light rounded-lg font-medium transition-all disabled:opacity-50"
        >
          {loading ? 'กำลังบันทึก...' : 'ปักหมุด'}
        </button>
      </form>
    </div>
  );
}
