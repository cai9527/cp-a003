import { Save, X } from 'lucide-react';

interface FormModalFooterProps {
  onCancel: () => void;
  onSubmit: () => void;
  loading?: boolean;
  submitText?: string;
  cancelText?: string;
}

export default function FormModalFooter({
  onCancel,
  onSubmit,
  loading = false,
  submitText = '保存',
  cancelText = '取消',
}: FormModalFooterProps) {
  return (
    <>
      <button onClick={onCancel} className="btn btn-default" disabled={loading}>
        <X className="w-4 h-4" />
        {cancelText}
      </button>
      <button onClick={onSubmit} className="btn btn-primary" disabled={loading}>
        <Save className="w-4 h-4" />
        {loading ? '保存中...' : submitText}
      </button>
    </>
  );
}
