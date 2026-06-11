import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Eye, FileText, Wrench, Save, X } from 'lucide-react';
import { useVehicleStore } from '@/store/useVehicleStore';
import DataTable from '@/components/UI/DataTable';
import StatusBadge from '@/components/UI/StatusBadge';
import Modal from '@/components/UI/Modal';
import { ToastContainer } from '@/components/UI/Toast';
import { useToast } from '@/hooks/useToast';
import { VEHICLE_STATUS, VEHICLE_TYPES } from '@/types';
import { formatDate, classNames, validatePlateNumber } from '@/utils';
import type { Vehicle } from '@/types';

export default function VehiclesPage() {
  const { vehicles, loading, deleteVehicle, addVehicle, updateVehicle } = useVehicleStore();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toasts, removeToast, success, error } = useToast();
  const pageSize = 10;

  const defaultFormData = {
    plateNumber: '',
    vehicleType: '渣土车',
    loadCapacity: 25,
    manufacturer: '',
    model: '',
    year: new Date().getFullYear(),
    mileage: 0,
    status: 'active' as Vehicle['status'],
    vin: '',
    engineNumber: '',
    purchaseDate: formatDate(new Date()),
    insuranceExpiry: formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
    operationLicenseExpiry: formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
    inspectionExpiry: formatDate(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)),
    environmentalExpiry: formatDate(new Date(Date.now() + 200 * 24 * 60 * 60 * 1000)),
    driverId: '',
    driverName: '',
  };

  const [formData, setFormData] = useState(defaultFormData);

  const filteredVehicles = vehicles.filter((v) => {
    const matchSearch =
      v.plateNumber.includes(searchText) ||
      v.model.includes(searchText) ||
      v.driverName?.includes(searchText) ||
      false;
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pagedVehicles = filteredVehicles.slice((page - 1) * pageSize, page * pageSize);

  const handleViewDetail = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailModal(true);
  };

  const handleDelete = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedVehicle) {
      deleteVehicle(selectedVehicle.id);
      setShowDeleteConfirm(false);
      setSelectedVehicle(null);
      success('车辆删除成功');
    }
  };

  const handleAdd = () => {
    setIsEditing(false);
    setFormData(defaultFormData);
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setIsEditing(true);
    setSelectedVehicle(vehicle);
    setFormData({
      plateNumber: vehicle.plateNumber,
      vehicleType: vehicle.vehicleType,
      loadCapacity: vehicle.loadCapacity,
      manufacturer: vehicle.manufacturer,
      model: vehicle.model,
      year: vehicle.year,
      mileage: vehicle.mileage,
      status: vehicle.status,
      vin: vehicle.vin,
      engineNumber: vehicle.engineNumber,
      purchaseDate: formatDate(vehicle.purchaseDate),
      insuranceExpiry: formatDate(vehicle.insuranceExpiry),
      operationLicenseExpiry: formatDate(vehicle.operationLicenseExpiry),
      inspectionExpiry: formatDate(vehicle.inspectionExpiry),
      environmentalExpiry: formatDate(vehicle.environmentalExpiry),
      driverId: vehicle.driverId || '',
      driverName: vehicle.driverName || '',
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.plateNumber.trim()) {
      errors.plateNumber = '请输入车牌号';
    } else if (!validatePlateNumber(formData.plateNumber)) {
      errors.plateNumber = '车牌号格式不正确';
    }

    if (!formData.vehicleType) {
      errors.vehicleType = '请选择车辆类型';
    }

    if (!formData.loadCapacity || formData.loadCapacity <= 0) {
      errors.loadCapacity = '请输入有效的载重';
    }

    if (!formData.manufacturer.trim()) {
      errors.manufacturer = '请输入生产厂家';
    }

    if (!formData.model.trim()) {
      errors.model = '请输入车型';
    }

    if (!formData.year || formData.year < 2000 || formData.year > new Date().getFullYear() + 1) {
      errors.year = '请输入有效的年份';
    }

    if (formData.mileage < 0) {
      errors.mileage = '里程不能为负数';
    }

    if (!formData.vin.trim()) {
      errors.vin = '请输入车架号';
    }

    if (!formData.engineNumber.trim()) {
      errors.engineNumber = '请输入发动机号';
    }

    if (!formData.purchaseDate) {
      errors.purchaseDate = '请选择购买日期';
    }

    if (!formData.insuranceExpiry) {
      errors.insuranceExpiry = '请选择保险到期日期';
    }

    if (!formData.operationLicenseExpiry) {
      errors.operationLicenseExpiry = '请选择行驶证到期日期';
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
      if (isEditing && selectedVehicle) {
        await updateVehicle(selectedVehicle.id, formData);
        success('车辆信息更新成功');
      } else {
        await addVehicle(formData);
        success('车辆添加成功');
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

  const getStatusBadge = (status: Vehicle['status']) => {
    const config = VEHICLE_STATUS[status];
    return <StatusBadge variant={config.color as any}>{config.label}</StatusBadge>;
  };

  const getExpiryStatus = (date: string) => {
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { variant: 'danger' as const, text: '已过期' };
    if (days < 30) return { variant: 'warning' as const, text: `${days}天后到期` };
    return { variant: 'success' as const, text: '正常' };
  };

  const columns = [
    {
      key: 'plateNumber',
      title: '车牌号',
      width: '120px',
      render: (row: Vehicle) => (
        <span className="font-medium text-neutral-800">{row.plateNumber}</span>
      ),
    },
    {
      key: 'vehicleType',
      title: '车辆类型',
      width: '100px',
      render: (row: Vehicle) => VEHICLE_TYPES[row.vehicleType]?.label || row.vehicleType,
    },
    {
      key: 'model',
      title: '车型',
      render: (row: Vehicle) => row.model,
    },
    {
      key: 'loadCapacity',
      title: '载重',
      width: '80px',
      render: (row: Vehicle) => `${row.loadCapacity}吨`,
    },
    {
      key: 'driverName',
      title: '驾驶员',
      width: '100px',
      render: (row: Vehicle) => row.driverName || '-',
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (row: Vehicle) => getStatusBadge(row.status),
    },
    {
      key: 'insuranceExpiry',
      title: '保险到期',
      width: '120px',
      render: (row: Vehicle) => {
        const status = getExpiryStatus(row.insuranceExpiry);
        return (
          <div>
            <div className="text-sm text-neutral-700">{formatDate(row.insuranceExpiry)}</div>
            <StatusBadge variant={status.variant} className="mt-1">
              {status.text}
            </StatusBadge>
          </div>
        );
      },
    },
    {
      key: 'operation',
      title: '操作',
      width: '160px',
      render: (row: Vehicle) => (
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
            title="证件管理"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 text-warning-600 hover:bg-warning-50 rounded transition-colors"
            title="维护记录"
          >
            <Wrench className="w-4 h-4" />
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
          <h1 className="text-2xl font-bold text-neutral-800">车辆管理</h1>
          <p className="text-sm text-neutral-500 mt-1">管理所有运渣车辆的基本信息、证件和维护记录</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增车辆
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索车牌号、车型、驾驶员..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            >
              <option value="all">全部状态</option>
              {Object.entries(VEHICLE_STATUS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {Object.entries(VEHICLE_STATUS).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1 text-sm">
                <span
                  className={classNames(
                    'w-2.5 h-2.5 rounded-full',
                    val.color === 'success' && 'bg-success-500',
                    val.color === 'warning' && 'bg-warning-500',
                    val.color === 'danger' && 'bg-danger-500',
                    val.color === 'neutral' && 'bg-neutral-500',
                    val.color === 'primary' && 'bg-primary-500'
                  )}
                />
                <span className="text-neutral-600">{val.label}</span>
                <span className="text-neutral-500 font-medium">
                  ({vehicles.filter((v) => v.status === key).length})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={pagedVehicles}
        loading={loading}
        pagination={{
          page,
          pageSize,
          total: filteredVehicles.length,
          onPageChange: setPage,
        }}
      />

      {showDetailModal && selectedVehicle && (
        <Modal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title="车辆详情"
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary-500 rounded-full" />
                  基本信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-500">车牌号：</span>
                    <span className="font-medium text-neutral-800">{selectedVehicle.plateNumber}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">车辆类型：</span>
                    <span className="font-medium text-neutral-800">
                      {VEHICLE_TYPES[selectedVehicle.vehicleType]?.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">车型：</span>
                    <span className="font-medium text-neutral-800">{selectedVehicle.model}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">载重：</span>
                    <span className="font-medium text-neutral-800">{selectedVehicle.loadCapacity}吨</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">车架号：</span>
                    <span className="font-medium text-neutral-800">{selectedVehicle.vin}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">发动机号：</span>
                    <span className="font-medium text-neutral-800">{selectedVehicle.engineNumber}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">购买日期：</span>
                    <span className="font-medium text-neutral-800">
                      {formatDate(selectedVehicle.purchaseDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">当前状态：</span>
                    {getStatusBadge(selectedVehicle.status)}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                  <div className="w-1 h-5 bg-warning-500 rounded-full" />
                  证件信息
                </h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">行驶证有效期</span>
                    <div className="text-right">
                      <span className="font-medium text-neutral-800">
                        {formatDate(selectedVehicle.operationLicenseExpiry)}
                      </span>
                      <div className="mt-1">
                        {(() => {
                          const status = getExpiryStatus(selectedVehicle.operationLicenseExpiry);
                          return <StatusBadge variant={status.variant}>{status.text}</StatusBadge>;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">保险有效期</span>
                    <div className="text-right">
                      <span className="font-medium text-neutral-800">
                        {formatDate(selectedVehicle.insuranceExpiry)}
                      </span>
                      <div className="mt-1">
                        {(() => {
                          const status = getExpiryStatus(selectedVehicle.insuranceExpiry);
                          return <StatusBadge variant={status.variant}>{status.text}</StatusBadge>;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">年检有效期</span>
                    <div className="text-right">
                      <span className="font-medium text-neutral-800">
                        {formatDate(selectedVehicle.inspectionExpiry)}
                      </span>
                      <div className="mt-1">
                        {(() => {
                          const status = getExpiryStatus(selectedVehicle.inspectionExpiry);
                          return <StatusBadge variant={status.variant}>{status.text}</StatusBadge>;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">环保标志有效期</span>
                    <div className="text-right">
                      <span className="font-medium text-neutral-800">
                        {formatDate(selectedVehicle.environmentalExpiry)}
                      </span>
                      <div className="mt-1">
                        {(() => {
                          const status = getExpiryStatus(selectedVehicle.environmentalExpiry);
                          return <StatusBadge variant={status.variant}>{status.text}</StatusBadge>;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <div className="w-1 h-5 bg-success-500 rounded-full" />
                最近维护记录
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-2 text-neutral-600 font-medium">维护日期</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">维护类型</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">维护内容</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">维护机构</th>
                      <th className="text-right py-2 text-neutral-600 font-medium">费用</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedVehicle.maintenanceRecords.slice(0, 3).map((record) => (
                      <tr key={record.id} className="border-b border-neutral-100">
                        <td className="py-3">{formatDate(record.date)}</td>
                        <td className="py-3">{record.type}</td>
                        <td className="py-3">{record.description}</td>
                        <td className="py-3">{record.organization}</td>
                        <td className="py-3 text-right">¥{record.cost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteConfirm && selectedVehicle && (
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
              确定要删除车辆 {selectedVehicle.plateNumber} 吗？
            </p>
            <p className="text-sm text-neutral-500 mt-2">此操作不可撤销，相关数据将被永久删除</p>
          </div>
        </Modal>
      )}

      {showFormModal && (
        <Modal
          open={showFormModal}
          onClose={() => setShowFormModal(false)}
          title={isEditing ? '编辑车辆' : '新增车辆'}
          size="xl"
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
                    车牌号 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.plateNumber}
                    onChange={(e) => handleFormChange('plateNumber', e.target.value)}
                    placeholder="请输入车牌号"
                    className={classNames(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                      formErrors.plateNumber ? 'border-danger-400' : 'border-neutral-300'
                    )}
                  />
                  {formErrors.plateNumber && (
                    <p className="text-xs text-danger-500 mt-1">{formErrors.plateNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    车辆类型 <span className="text-danger-500">*</span>
                  </label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => handleFormChange('vehicleType', e.target.value)}
                    className={classNames(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white',
                      formErrors.vehicleType ? 'border-danger-400' : 'border-neutral-300'
                    )}
                  >
                    {VEHICLE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.vehicleType && (
                    <p className="text-xs text-danger-500 mt-1">{formErrors.vehicleType}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    生产厂家 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => handleFormChange('manufacturer', e.target.value)}
                    placeholder="请输入生产厂家"
                    className={classNames(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                      formErrors.manufacturer ? 'border-danger-400' : 'border-neutral-300'
                    )}
                  />
                  {formErrors.manufacturer && (
                    <p className="text-xs text-danger-500 mt-1">{formErrors.manufacturer}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    车型 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => handleFormChange('model', e.target.value)}
                    placeholder="请输入车型"
                    className={classNames(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                      formErrors.model ? 'border-danger-400' : 'border-neutral-300'
                    )}
                  />
                  {formErrors.model && (
                    <p className="text-xs text-danger-500 mt-1">{formErrors.model}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    载重(吨) <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.loadCapacity}
                    onChange={(e) => handleFormChange('loadCapacity', Number(e.target.value))}
                    placeholder="请输入载重"
                    className={classNames(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                      formErrors.loadCapacity ? 'border-danger-400' : 'border-neutral-300'
                    )}
                  />
                  {formErrors.loadCapacity && (
                    <p className="text-xs text-danger-500 mt-1">{formErrors.loadCapacity}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    年份 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleFormChange('year', Number(e.target.value))}
                    placeholder="请输入年份"
                    className={classNames(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                      formErrors.year ? 'border-danger-400' : 'border-neutral-300'
                    )}
                  />
                  {formErrors.year && (
                    <p className="text-xs text-danger-500 mt-1">{formErrors.year}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    里程(公里)
                  </label>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => handleFormChange('mileage', Number(e.target.value))}
                    placeholder="请输入里程"
                    className={classNames(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                      formErrors.mileage ? 'border-danger-400' : 'border-neutral-300'
                    )}
                  />
                  {formErrors.mileage && (
                    <p className="text-xs text-danger-500 mt-1">{formErrors.mileage}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    状态
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                  >
                    {Object.entries(VEHICLE_STATUS).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <div className="w-1 h-5 bg-warning-500 rounded-full" />
                车辆识别
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    车架号(VIN) <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.vin}
                    onChange={(e) => handleFormChange('vin', e.target.value)}
                    placeholder="请输入车架号"
                    className={classNames(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                      formErrors.vin ? 'border-danger-400' : 'border-neutral-300'
                    )}
                  />
                  {formErrors.vin && (
                    <p className="text-xs text-danger-500 mt-1">{formErrors.vin}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    发动机号 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.engineNumber}
                    onChange={(e) => handleFormChange('engineNumber', e.target.value)}
                    placeholder="请输入发动机号"
                    className={classNames(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                      formErrors.engineNumber ? 'border-danger-400' : 'border-neutral-300'
                    )}
                  />
                  {formErrors.engineNumber && (
                    <p className="text-xs text-danger-500 mt-1">{formErrors.engineNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    购买日期 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => handleFormChange('purchaseDate', e.target.value)}
                    className={classNames(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                      formErrors.purchaseDate ? 'border-danger-400' : 'border-neutral-300'
                    )}
                  />
                  {formErrors.purchaseDate && (
                    <p className="text-xs text-danger-500 mt-1">{formErrors.purchaseDate}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <div className="w-1 h-5 bg-success-500 rounded-full" />
                证件有效期
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    保险有效期 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.insuranceExpiry}
                    onChange={(e) => handleFormChange('insuranceExpiry', e.target.value)}
                    className={classNames(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                      formErrors.insuranceExpiry ? 'border-danger-400' : 'border-neutral-300'
                    )}
                  />
                  {formErrors.insuranceExpiry && (
                    <p className="text-xs text-danger-500 mt-1">{formErrors.insuranceExpiry}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    行驶证有效期 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.operationLicenseExpiry}
                    onChange={(e) => handleFormChange('operationLicenseExpiry', e.target.value)}
                    className={classNames(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                      formErrors.operationLicenseExpiry ? 'border-danger-400' : 'border-neutral-300'
                    )}
                  />
                  {formErrors.operationLicenseExpiry && (
                    <p className="text-xs text-danger-500 mt-1">{formErrors.operationLicenseExpiry}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    年检有效期
                  </label>
                  <input
                    type="date"
                    value={formData.inspectionExpiry}
                    onChange={(e) => handleFormChange('inspectionExpiry', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    环保标志有效期
                  </label>
                  <input
                    type="date"
                    value={formData.environmentalExpiry}
                    onChange={(e) => handleFormChange('environmentalExpiry', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
