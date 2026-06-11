import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, User as UserIcon, Shield, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import DataTable from '@/components/UI/DataTable';
import StatusBadge from '@/components/UI/StatusBadge';
import Modal from '@/components/UI/Modal';
import { ToastContainer } from '@/components/UI/Toast';
import SearchFilterBar from '@/components/UI/SearchFilterBar';
import DeleteConfirmModal from '@/components/UI/DeleteConfirmModal';
import FormField, { FormInput } from '@/components/UI/FormField';
import SectionHeader from '@/components/UI/SectionHeader';
import DetailItem from '@/components/UI/DetailItem';
import FormModalFooter from '@/components/UI/FormModalFooter';
import { useCrudPage } from '@/hooks/useCrudPage';
import { ROLES } from '@/types';
import { formatDate, classNames, validatePhone } from '@/utils';
import type { User, Role } from '@/types';

export default function UsersPage() {
  const { users, loading, deleteUser, addUser, updateUser } = useAuthStore();

  const defaultFormData = {
    username: '',
    name: '',
    phone: '',
    email: '',
    role: 'dispatcher' as Role,
    department: '',
    status: 'active' as User['status'],
  };

  const [formData, setFormData] = useState(defaultFormData);

  const crud = useCrudPage<any>({
    defaultFormData,
    onAdd: (data) => addUser(data),
    onUpdate: (id, data) => updateUser(id, data),
    onDelete: (id) => deleteUser(id),
    addSuccessMessage: '用户添加成功',
    updateSuccessMessage: '用户信息更新成功',
    deleteSuccessMessage: '用户删除成功',
    validateForm: (data) => {
      const errors: Record<string, string> = {};
      if (!data.username.trim()) {
        errors.username = '请输入用户名';
      } else if (data.username.length < 3) {
        errors.username = '用户名至少3个字符';
      }
      if (!data.name.trim()) {
        errors.name = '请输入姓名';
      }
      if (!data.phone.trim()) {
        errors.phone = '请输入联系电话';
      } else if (!validatePhone(data.phone)) {
        errors.phone = '手机号码格式不正确';
      }
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = '邮箱格式不正确';
      }
      if (!data.role) {
        errors.role = '请选择角色';
      }
      return errors;
    },
  });

  const handleAdd = () => {
    crud.handleAdd();
    setFormData(defaultFormData);
  };

  const handleEdit = (user: User) => {
    setFormData({
      username: user.username,
      name: user.name,
      phone: user.phone,
      email: user.email || '',
      role: user.role,
      department: user.department || '',
      status: user.status,
    });
    crud.handleEdit(user);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (crud.formErrors[field]) {
      crud.setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = () => {
    crud.handleSubmit(formData);
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.includes(crud.searchText) ||
      u.username.includes(crud.searchText) ||
      u.phone.includes(crud.searchText);
    const matchRole = crud.statusFilter === 'all' || u.role === crud.statusFilter;
    return matchSearch && matchRole;
  });

  const pagedUsers = filteredUsers.slice((crud.page - 1) * crud.pageSize, crud.page * crud.pageSize);

  const selectedItem = crud.selectedItem as User | null;
  const deleteTarget = crud.deleteTarget as User | null;

  const getStatusBadge = (status: User['status']) => {
    if (status === 'active') {
      return <StatusBadge variant="success">正常</StatusBadge>;
    }
    return <StatusBadge variant="danger">禁用</StatusBadge>;
  };

  const getRoleBadge = (role: User['role']) => {
    const config = ROLES[role];
    return (
      <div className="flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-primary-500" />
        <span className="text-neutral-700">{config.label}</span>
      </div>
    );
  };

  const roleFilterOptions = Object.entries(ROLES).map(([key, val]) => ({
    value: key,
    label: val.label,
  }));

  const columns = [
    {
      key: 'avatar',
      title: '头像',
      width: '60px',
      render: (row: User) => (
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
          {row.avatar ? (
            <img src={row.avatar} alt={row.name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-5 h-5 text-primary-600" />
          )}
        </div>
      ),
    },
    {
      key: 'name',
      title: '姓名',
      width: '100px',
      render: (row: User) => (
        <span className="font-medium text-neutral-800">{row.name}</span>
      ),
    },
    {
      key: 'username',
      title: '用户名',
      width: '120px',
      render: (row: User) => <span className="text-neutral-600">{row.username}</span>,
    },
    {
      key: 'role',
      title: '角色',
      width: '120px',
      render: (row: User) => getRoleBadge(row.role),
    },
    {
      key: 'phone',
      title: '联系电话',
      width: '130px',
      render: (row: User) => row.phone,
    },
    {
      key: 'email',
      title: '邮箱',
      render: (row: User) => row.email,
    },
    {
      key: 'department',
      title: '部门',
      width: '120px',
      render: (row: User) => row.department || '-',
    },
    {
      key: 'status',
      title: '状态',
      width: '80px',
      render: (row: User) => getStatusBadge(row.status),
    },
    {
      key: 'createdAt',
      title: '创建时间',
      width: '150px',
      render: (row: User) => formatDate(row.createdAt),
    },
    {
      key: 'operation',
      title: '操作',
      width: '120px',
      render: (row: User) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => crud.handleViewDetail(row)}
            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="权限配置"
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => crud.handleDelete(row)}
            className="p-1.5 text-danger-600 hover:bg-danger-50 rounded transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">用户管理</h1>
          <p className="text-sm text-neutral-500 mt-1">管理系统用户账户、角色权限和个人信息</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增用户
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(ROLES).map(([key, val]) => {
          const count = users.filter((u) => u.role === key).length;
          return (
            <div key={key} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-neutral-800">{count}</div>
                <div className="text-sm text-neutral-500">{val.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <SearchFilterBar
        searchText={crud.searchText}
        onSearchChange={crud.setSearchText}
        searchPlaceholder="搜索姓名、用户名、电话..."
        filterValue={crud.statusFilter}
        onFilterChange={crud.setStatusFilter}
        filterOptions={roleFilterOptions}
        filterLabel="全部角色"
      />

      <DataTable
        columns={columns}
        data={pagedUsers}
        loading={loading}
        pagination={{
          page: crud.page,
          pageSize: crud.pageSize,
          total: filteredUsers.length,
          onPageChange: crud.setPage,
        }}
      />

      {crud.showDetailModal && selectedItem && (
        <Modal
          open={crud.showDetailModal}
          onClose={crud.closeDetailModal}
          title="用户详情"
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-xl bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {selectedItem.avatar ? (
                  <img
                    src={selectedItem.avatar}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-12 h-12 text-primary-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-neutral-800">{selectedItem.name}</h3>
                  {getStatusBadge(selectedItem.status)}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {getRoleBadge(selectedItem.role)}
                </div>
                <p className="text-sm text-neutral-500">
                  {selectedItem.department && `${selectedItem.department} · `}
                  {selectedItem.phone}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <SectionHeader title="基本信息" color="primary" />
                <div className="space-y-3 text-sm">
                  <DetailItem label="用户名">{selectedItem.username}</DetailItem>
                  <DetailItem label="联系电话">{selectedItem.phone}</DetailItem>
                  <DetailItem label="邮箱">{selectedItem.email}</DetailItem>
                  <DetailItem label="部门">{selectedItem.department || '-'}</DetailItem>
                  <DetailItem label="创建时间">{formatDate(selectedItem.createdAt)}</DetailItem>
                </div>
              </div>
              <div className="space-y-4">
                <SectionHeader title="角色权限" color="warning" />
                <div className="card p-4 bg-neutral-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-primary-500" />
                    <span className="font-medium text-neutral-800">
                      {ROLES[selectedItem.role].label}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 mb-3">
                    {ROLES[selectedItem.role].description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLES[selectedItem.role].permissions.slice(0, 8).map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded"
                      >
                        {perm}
                      </span>
                    ))}
                    {ROLES[selectedItem.role].permissions.length > 8 && (
                      <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded">
                        +{ROLES[selectedItem.role].permissions.length - 8}项
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <DeleteConfirmModal
        open={crud.showDeleteConfirm}
        onClose={crud.closeDeleteConfirm}
        onConfirm={crud.confirmDelete}
        itemName={deleteTarget?.name || ''}
        itemType="用户"
      />

      {crud.showFormModal && (
        <Modal
          open={crud.showFormModal}
          onClose={crud.closeFormModal}
          title={crud.isEditing ? '编辑用户' : '新增用户'}
          size="lg"
          footer={
            <FormModalFooter
              onCancel={crud.closeFormModal}
              onSubmit={handleSubmit}
              loading={crud.formLoading}
            />
          }
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <SectionHeader title="基本信息" color="primary" />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="用户名" required error={crud.formErrors.username}>
                  <FormInput
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleFormChange('username', e.target.value)}
                    placeholder="请输入用户名"
                    error={crud.formErrors.username}
                  />
                </FormField>
                <FormField label="姓名" required error={crud.formErrors.name}>
                  <FormInput
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="请输入姓名"
                    error={crud.formErrors.name}
                  />
                </FormField>
                <FormField label="联系电话" required error={crud.formErrors.phone}>
                  <FormInput
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    placeholder="请输入联系电话"
                    error={crud.formErrors.phone}
                  />
                </FormField>
                <FormField label="邮箱" error={crud.formErrors.email}>
                  <FormInput
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    placeholder="请输入邮箱"
                    error={crud.formErrors.email}
                  />
                </FormField>
                <FormField label="部门">
                  <FormInput
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleFormChange('department', e.target.value)}
                    placeholder="请输入部门"
                  />
                </FormField>
                <FormField label="状态">
                  <div className="flex items-center gap-4 py-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="active"
                        checked={formData.status === 'active'}
                        onChange={(e) => handleFormChange('status', e.target.value)}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm text-neutral-700">正常</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="inactive"
                        checked={formData.status === 'inactive'}
                        onChange={(e) => handleFormChange('status', e.target.value)}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm text-neutral-700">禁用</span>
                    </label>
                  </div>
                </FormField>
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeader title="角色权限" color="warning" />
              <FormField label="用户角色" required error={crud.formErrors.role}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(ROLES).map(([key, val]) => (
                    <label
                      key={key}
                      className={classNames(
                        'p-3 border rounded-lg cursor-pointer transition-all',
                        formData.role === key
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="radio"
                          value={key}
                          checked={formData.role === key}
                          onChange={(e) => handleFormChange('role', e.target.value)}
                          className="mt-0.5 w-4 h-4 text-primary-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-neutral-800 text-sm">{val.label}</div>
                          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                            {val.description}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </FormField>
            </div>
          </div>
        </Modal>
      )}

      <ToastContainer toasts={crud.toasts} onRemove={crud.removeToast} />
    </div>
  );
}
