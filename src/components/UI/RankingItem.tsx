import { classNames } from '@/utils';

interface RankingItemProps {
  rank: number;
  children: React.ReactNode;
}

export default function RankingItem({ rank, children }: RankingItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={classNames(
          'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0',
          rank === 1 && 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white',
          rank === 2 && 'bg-gradient-to-br from-gray-300 to-gray-500 text-white',
          rank === 3 && 'bg-gradient-to-br from-orange-400 to-orange-600 text-white',
          rank > 3 && 'bg-neutral-200 text-neutral-600'
        )}
      >
        {rank}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
