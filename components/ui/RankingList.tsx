'use client';

import Image from 'next/image';
import { Trophy } from 'lucide-react';
import { UserStats } from '@/lib/types';
import { getRankNameClasses, isTopRank } from './rankStyles';

interface RankingListProps {
  users: UserStats[];
  title: string;
  showViewMore?: boolean;
  onViewMore?: () => void;
}

export function RankingList({ users, title, showViewMore = false, onViewMore }: RankingListProps) {
  return (
    <div className="bg-dark-gray rounded-lg p-4">
      <h2 className="text-xl font-bold text-light mb-4 flex items-center gap-2">
        <Trophy className="text-primary" size={24} />
        {title}
      </h2>

      <div className="space-y-3">
        {users.map((user, index) => {
          const rank = index + 1;
          const top = isTopRank(rank);
          const nameClass = top ? getRankNameClasses(rank) : 'text-light font-medium';
          return (
            <div
              key={user.rank}
              className="flex items-center gap-3 bg-secondary p-3 rounded-lg hover:bg-opacity-80 transition-all"
            >
              <div
                className={`w-6 text-center font-extrabold text-lg ${
                  top ? getRankNameClasses(rank) : 'text-primary'
                }`}
              >
                {rank}
              </div>

              {user.fisherman?.avatar_url && (
                <Image
                  src={user.fisherman.avatar_url}
                  alt={user.fisherman.nickname}
                  width={40}
                  height={40}
                  className={`rounded-full w-10 h-10 object-cover ${
                    rank === 1
                      ? 'ring-2 ring-amber-400'
                      : rank === 2
                      ? 'ring-2 ring-zinc-300'
                      : rank === 3
                      ? 'ring-2 ring-orange-400'
                      : ''
                  }`}
                />
              )}

              <div className="flex-1 min-w-0">
                <p className={`truncate ${nameClass}`}>{user.fisherman?.nickname}</p>
                <p className="text-gray-400 text-sm">{user.total_pins} หมุด</p>
              </div>

              <div className="text-right">
                <p className="text-primary font-bold">{user.total_likes}</p>
                <p className="text-gray-400 text-xs">ถูกใจ</p>
              </div>
            </div>
          );
        })}
      </div>

      {showViewMore && (
        <button
          onClick={onViewMore}
          className="w-full mt-4 py-2 bg-primary hover:bg-opacity-80 text-light rounded-lg transition-all font-medium"
        >
          ดูเพิ่มเติม
        </button>
      )}
    </div>
  );
}
