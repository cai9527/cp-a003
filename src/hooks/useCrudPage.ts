import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';

interface UseCrudPageOptions<T> {
  defaultFormData: T;
  onAdd: (data: T) => Promise<any>;
  onUpdate: (id: string, data: T) => Promise<any>;
  onDelete: (id: string) => any;
  addSuccessMessage?: string;
  updateSuccessMessage?: string;
  deleteSuccessMessage?: string;
  validateForm?: (data: T) => Record<string, string>;
}

export function useCrudPage<T extends Record<string, any>>({
  defaultFormData,
  onAdd,
  onUpdate,
  onDelete,
  addSuccessMessage = '添加成功',
  updateSuccessMessage = '更新成功',
  deleteSuccessMessage = '删除成功',
  validateForm,
}: UseCrudPageOptions<T>) {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<T>(defaultFormData);

  const { toasts, removeToast, success, error } = useToast();

  const handleViewDetail = useCallback((item: T) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  }, []);

  const handleDelete = useCallback((item: T) => {
    setDeleteTarget(item);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTarget && 'id' in deleteTarget) {
      onDelete(deleteTarget.id as string);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      success(deleteSuccessMessage);
    }
  }, [deleteTarget, onDelete, success, deleteSuccessMessage]);

  const handleAdd = useCallback(() => {
    setIsEditing(false);
    setFormData(defaultFormData);
    setFormErrors({});
    setShowFormModal(true);
  }, [defaultFormData]);

  const handleEdit = useCallback((item: T) => {
    setIsEditing(true);
    setSelectedItem(item);
    setFormErrors({});
    setShowFormModal(true);
  }, []);

  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const handleSubmit = useCallback(
    async (editData?: T) => {
      const dataToValidate = editData || formData;
      if (validateForm) {
        const errors = validateForm(dataToValidate);
        if (Object.keys(errors).length > 0) {
          setFormErrors(errors);
          error('请检查表单填写是否正确');
          return;
        }
      }

      setFormLoading(true);
      try {
        if (isEditing && selectedItem && 'id' in selectedItem) {
          await onUpdate(selectedItem.id as string, dataToValidate);
          success(updateSuccessMessage);
        } else {
          await onAdd(dataToValidate);
          success(addSuccessMessage);
        }
        setShowFormModal(false);
      } catch (err) {
        error('操作失败，请重试');
      } finally {
        setFormLoading(false);
      }
    },
    [formData, isEditing, selectedItem, validateForm, onAdd, onUpdate, success, error, addSuccessMessage, updateSuccessMessage]
  );

  const closeDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedItem(null);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  }, []);

  const closeFormModal = useCallback(() => {
    setShowFormModal(false);
  }, []);

  return {
    searchText,
    setSearchText,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    pageSize,

    showDetailModal,
    selectedItem,
    handleViewDetail,
    closeDetailModal,

    showDeleteConfirm,
    deleteTarget,
    handleDelete,
    confirmDelete,
    closeDeleteConfirm,

    showFormModal,
    isEditing,
    formLoading,
    formErrors,
    formData,
    setFormData,
    handleAdd,
    handleEdit,
    handleFormChange,
    handleSubmit,
    closeFormModal,
    setFormErrors,

    toasts,
    removeToast,
    success,
    error,
  };
}
