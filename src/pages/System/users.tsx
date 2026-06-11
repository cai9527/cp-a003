import { useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Eye, User as UserIcon, Shield, Lock, Save, X } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import DataTable from '@/components/UI/DataTable';
import StatusBadge from '@/components/UI/StatusBadge';
import Modal from '@/components/UI/Modal';
import { ToastContainer } from '@/components/UI/Toast';
import { useToast } from '@/hooks/useToast';
import { ROLES } from '@/types';
import { formatDate, classNames, validatePhone } from '@/utils';
import type { User, Role } from '@/types';

export default function UsersPage() {
  const { users, loading, deleteUser, addUser, updateUser } = useAuthStore();
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toasts, removeToast, success, error } = useToast();
  const pageSize = 10;

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

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.includes(searchText) ||
      u.username.includes(searchText) ||
      u.phone.includes(searchText);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const pagedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  const handleViewDetail = (user: User) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteUser(selectedUser.id);
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      success('用户删除成功');
    }
  };

  const handleAdd = () => {
    setIsEditing(false);
    setFormData(defaultFormData);
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleEdit = (user: User) => {
    setIsEditing(true);
    setSelectedUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      phone: user.phone,
      email: user.email || '',
      role: user.role,
      department: user.department || '',
      status: user.status,
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = '请输入用户名';
    } else if (formData.username.length < 3) {
      errors.username = '用户名至少3个字符';
    }

    if (!formData.name.trim()) {
      errors.name = '请输入姓名';
    }

    if (!formData.phone.trim()) {
      errors.phone = '请输入联系电话';
    } else if (!validatePhone(formData.phone)) {
      errors.phone = '手机号码格式不正确';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '邮箱格式不正确';
    }

    if (!formData.role) {
      errors.role = '请选择角色';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      error('请检查表单填写是否正确');
      return;
    }

    setFormLoading(true);
    try {
      if (isEditing && selectedUser) {
        await updateUser(selectedUser.id, formData);
        success('用户信息更新成功');
      } else {
        await addUser(formData);
        success('用户添加成功');
      }
      setShowFormModal(false);
    } catch (err) {
      error('操作失败，请重试');
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

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
            onClick={() => handleViewDetail(row)}
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
            onClick={() => handleDelete(row)}
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

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索姓名、用户名、电话..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            >
              <option value="all">全部角色</option>
              {Object.entries(ROLES).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={pagedUsers}
        loading={loading}
        pagination={{
          page,
          pageSize,
          total: filteredUsers.length,
          onPageChange: setPage,
        }}
      />

      {showDetailModal && selectedUser && (
        <Modal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="用户详情"
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-xl bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {selectedUser.avatar ? (
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-12 h-12 text-primary-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-neutral-800">{selectedUser.name}</h3>
                  {getStatusBadge(selectedUser.status)}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {getRoleBadge(selectedUser.role)}
                </div>
                <p className="text-sm text-neutral-500">
                  {selectedUser.department && `${selectedUser.department} · `}
                  {selectedUser.phone}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary-500 rounded-full" />
                  基本信息
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">用户名</span>
                    <span className="font-medium text-neutral-800">{selectedUser.username}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">联系电话</span>
                    <span className="font-medium text-neutral-800">{selectedUser.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">邮箱</span>
                    <span className="font-medium text-neutral-800">{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">部门</span>
                    <span className="font-medium text-neutral-800">{selectedUser.department || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">创建时间</span>
                    <span className="font-medium text-neutral-800">
                      {formatDate(selectedUser.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <div className="w-1 h-5 bg-warning-500 rounded-full" />
                  角色权限
                </h3>
                <div className="card p-4 bg-neutral-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-primary-500" />
                    <span className="font-medium text-neutral-800">
                      {ROLES[selectedUser.role].label}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 mb-3">
                    {ROLES[selectedUser.role].description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLES[selectedUser.role].permissions.slice(0, 8).map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded"
                      >
                        {perm}
                      </span>
                    ))}
                    {ROLES[selectedUser.role].permissions.length > 8 && (
                      <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded">
                        +{ROLES[selectedUser.role].permissions.length - 8}项
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteConfirm && selectedUser && (
        <Modal
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="确认删除"
          size="sm"
          footer={
            <>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-default"
              >
                取消
              </button>
              <button onClick={confirmDelete} className="btn btn-danger">
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
              确定要删除用户 {selectedUser.name} 吗？
            </p>
            <p className="text-sm text-neutral-500 mt-2">此操作不可撤销，相关数据将被永久删除</p>
          </div>
        </Modal>
      )}

      {showFormModal && (
        <Modal
          open={showFormModal}
          onClose={() => setShowFormModal(false)}
          title={isEditing ? '编辑用户' : '新增用户'}
          size="lg"
          footer={
            <>
              <button
                onClick={() => setShowFormModal(false)}
                className="btn btn-default"
                disabled={formLoading}
              >
                <X className="w-4 h-4" />
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={formLoading}
              >
                <Save className="w-4 h-4" />
                {formLoading ? '保存中...' : '保存'}
              </button>
            </>
          }
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <div className="w-1 h-5 bg-primary-500 rounded-full" />
                基本信息
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    用户名 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleFormChange('username', e.target.value)}
                    placeholder="请输入用户名"
                    className={classNames(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                      formErrors.username ? 'border-danger-400' : 'border-neutral-300'
                    )}
                  />
                  {formErrors.username && (
                    <p className="text-xs text-danger-500 mt-1">{formErrors.username}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    姓名 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="请输入姓名"
                    className={classNames(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                      formErrors.name ? 'border-danger-400' : 'border-neutral-300'
                    )}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-danger-500 mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    联系电话 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    placeholder="请输入联系电话"
                    className={classNames(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                      formErrors.phone ? 'border-danger-400' : 'border-neutral-300'
                    )}
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-danger-500 mt-1">{formErrors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    邮箱
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    placeholder="请输入邮箱"
                    className={classNames(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                      formErrors.email ? 'border-danger-400' : 'border-neutral-300'
                    )}
                  />
                  {formErrors.email && (
                    <p className="text-xs text-danger-500 mt-1">{formErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    部门
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleFormChange('department', e.target.value)}
                    placeholder="请输入部门"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    状态
                  </label>
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
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <div className="w-1 h-5 bg-warning-500 rounded-full" />
                角色权限
              </h3>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  用户角色 <span className="text-danger-500">*</span>
                </label>
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
                {formErrors.role && (
                  <p className="text-xs text-danger-500 mt-1">{formErrors.role}</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
