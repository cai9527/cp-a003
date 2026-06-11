import { classNames } from '@/utils';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export default function FormField({
  label,
  required = false,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
        {label} {required && <span className="text-danger-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-danger-500 mt-1">{error}</p>}
    </div>
  );
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function FormInput({ error, className, ...props }: FormInputProps) {
  return (
    <input
      className={classNames(
        'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
        error ? 'border-danger-400' : 'border-neutral-300',
        props.type === 'date' && 'bg-white',
        className
      )}
      {...props}
    />
  );
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function FormSelect({ error, options, placeholder, className, ...props }: FormSelectProps) {
  return (
    <select
      className={classNames(
        'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white',
        error ? 'border-danger-400' : 'border-neutral-300',
        className
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
