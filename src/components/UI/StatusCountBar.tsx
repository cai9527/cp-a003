import { classNames } from '@/utils';

interface StatusCountItem {
  key: string;
  label: string;
  color: string;
  count: number;
}

interface StatusCountBarProps {
  items: StatusCountItem[];
}

const dotColorMap: Record<string, string> = {
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  neutral: 'bg-neutral-500',
  primary: 'bg-primary-500',
};

export default function StatusCountBar({ items }: StatusCountBarProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-1 text-sm">
          <span
            className={classNames(
              'w-2.5 h-2.5 rounded-full',
              dotColorMap[item.color] || 'bg-neutral-500'
            )}
          />
          <span className="text-neutral-600">{item.label}</span>
          <span className="text-neutral-500 font-medium">({item.count})</span>
        </div>
      ))}
    </div>
  );
}
