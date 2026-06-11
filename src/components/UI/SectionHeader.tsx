import { classNames } from '@/utils';

type SectionColor = 'primary' | 'warning' | 'success' | 'danger' | 'neutral';

interface SectionHeaderProps {
  title: string;
  color?: SectionColor;
  className?: string;
}

const colorMap: Record<SectionColor, string> = {
  primary: 'bg-primary-500',
  warning: 'bg-warning-500',
  success: 'bg-success-500',
  danger: 'bg-danger-500',
  neutral: 'bg-neutral-500',
};

export default function SectionHeader({
  title,
  color = 'primary',
  className,
}: SectionHeaderProps) {
  return (
    <h3 className={classNames('font-semibold text-neutral-800 flex items-center gap-2', className)}>
      <div className={classNames('w-1 h-5 rounded-full', colorMap[color])} />
      {title}
    </h3>
  );
}
