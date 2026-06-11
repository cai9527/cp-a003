import { Trash2 } from 'lucide-react';
import Modal from '@/components/UI/Modal';

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
}

export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  itemName,
  itemType = '数据',
}: DeleteConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="确认删除"
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn btn-default">
            取消
          </button>
          <button onClick={onConfirm} className="btn btn-danger">
            确认删除
          </button>
        </>
      }
    >
      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto bg-danger-100 rounded-full flex items-center justify-center mb-4">
          <Trash2 className="w-8 h-8 text-danger-500" />
        </div>
        <p className="text-lg font-medium text-neutral-800">
          确定要删除{itemType} {itemName} 吗？
        </p>
        <p className="text-sm text-neutral-500 mt-2">此操作不可撤销，相关数据将被永久删除</p>
      </div>
    </Modal>
  );
}
