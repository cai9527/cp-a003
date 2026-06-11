interface DetailItemProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export default function DetailItem({ label, children, className }: DetailItemProps) {
  return (
    <div className={className}>
      <span className="text-neutral-500">{label}：</span>
      <span className="font-medium text-neutral-800">{children}</span>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  children: React.ReactNode;
}

export function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-neutral-800">{children}</span>
    </div>
  );
}
