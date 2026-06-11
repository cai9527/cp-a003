import { useState } from 'react';
import { Plus, Eye, FileText, Wrench, Edit2, Trash2 } from 'lucide-react';
import { useVehicleStore } from '@/store/useVehicleStore';
import { useCrudPage } from '@/hooks/useCrudPage';
import DataTable from '@/components/UI/DataTable';
import StatusBadge from '@/components/UI/StatusBadge';
import Modal from '@/components/UI/Modal';
import SearchFilterBar from '@/components/UI/SearchFilterBar';
import DeleteConfirmModal from '@/components/UI/DeleteConfirmModal';
import FormField, { FormInput, FormSelect } from '@/components/UI/FormField';
import SectionHeader from '@/components/UI/SectionHeader';
import DetailItem from '@/components/UI/DetailItem';
import FormModalFooter from '@/components/UI/FormModalFooter';
import StatusCountBar from '@/components/UI/StatusCountBar';
import { ToastContainer } from '@/components/UI/Toast';
import { VEHICLE_STATUS, VEHICLE_TYPES } from '@/types';
import { formatDate, classNames, validatePlateNumber, getExpiryStatus } from '@/utils';
import type { Vehicle } from '@/types';

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

export default function VehiclesPage() {
  const { vehicles, loading, deleteVehicle, addVehicle, updateVehicle } = useVehicleStore();

  const crud = useCrudPage<any>({
    defaultFormData,
    onAdd: (data) => addVehicle(data),
    onUpdate: (id, data) => updateVehicle(id, data),
    onDelete: (id) => deleteVehicle(id),
    addSuccessMessage: '车辆添加成功',
    updateSuccessMessage: '车辆信息更新成功',
    deleteSuccessMessage: '车辆删除成功',
    validateForm: (data) => {
      const errors: Record<string, string> = {};
      if (!data.plateNumber.trim()) errors.plateNumber = '请输入车牌号';
      else if (!validatePlateNumber(data.plateNumber)) errors.plateNumber = '车牌号格式不正确';
      if (!data.vehicleType) errors.vehicleType = '请选择车辆类型';
      if (!data.loadCapacity || data.loadCapacity <= 0) errors.loadCapacity = '请输入有效的载重';
      if (!data.manufacturer.trim()) errors.manufacturer = '请输入生产厂家';
      if (!data.model.trim()) errors.model = '请输入车型';
      if (!data.year || data.year < 2000 || data.year > new Date().getFullYear() + 1) errors.year = '请输入有效的年份';
      if (data.mileage < 0) errors.mileage = '里程不能为负数';
      if (!data.vin.trim()) errors.vin = '请输入车架号';
      if (!data.engineNumber.trim()) errors.engineNumber = '请输入发动机号';
      if (!data.purchaseDate) errors.purchaseDate = '请选择购买日期';
      if (!data.insuranceExpiry) errors.insuranceExpiry = '请选择保险到期日期';
      if (!data.operationLicenseExpiry) errors.operationLicenseExpiry = '请选择行驶证到期日期';
      return errors;
    },
  });

  const [formData, setFormData] = useState(defaultFormData);

  const handleAdd = () => {
    crud.handleAdd();
    setFormData(defaultFormData);
  };

  const handleEdit = (vehicle: Vehicle) => {
    const editData = {
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
    };
    setFormData(editData);
    crud.handleEdit(vehicle);
  };

  const handleSubmit = async () => {
    await crud.handleSubmit(formData);
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

  const filteredVehicles = vehicles.filter((v) => {
    const matchSearch =
      v.plateNumber.includes(crud.searchText) ||
      v.model.includes(crud.searchText) ||
      v.driverName?.includes(crud.searchText) ||
      false;
    const matchStatus = crud.statusFilter === 'all' || v.status === crud.statusFilter;
    return matchSearch && matchStatus;
  });

  const pagedVehicles = filteredVehicles.slice(
    (crud.page - 1) * crud.pageSize,
    crud.page * crud.pageSize
  );

  const getStatusBadge = (status: Vehicle['status']) => {
    const config = VEHICLE_STATUS[status];
    return <StatusBadge variant={config.color as any}>{config.label}</StatusBadge>;
  };

  const statusCountItems = Object.entries(VEHICLE_STATUS).map(([key, val]) => ({
    key,
    label: val.label,
    color: val.color,
    count: vehicles.filter((v) => v.status === key).length,
  }));

  const filterOptions = Object.entries(VEHICLE_STATUS).map(([key, val]) => ({
    value: key,
    label: val.label,
  }));

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
      render: (row: Vehicle) => VEHICLE_TYPES.find(t => t.value === row.vehicleType)?.label || row.vehicleType,
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
            <StatusBadge variant={status.variant} className="mt-1">{status.text}</StatusBadge>
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
          <button onClick={() => crud.handleViewDetail(row)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors" title="查看详情">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors" title="证件管理">
            <FileText className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-warning-600 hover:bg-warning-50 rounded transition-colors" title="维护记录">
            <Wrench className="w-4 h-4" />
          </button>
          <button onClick={() => handleEdit(row)} className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded transition-colors" title="编辑">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => crud.handleDelete(row)} className="p-1.5 text-danger-600 hover:bg-danger-50 rounded transition-colors" title="删除">
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

      <SearchFilterBar
        searchText={crud.searchText}
        onSearchChange={crud.setSearchText}
        searchPlaceholder="搜索车牌号、车型、驾驶员..."
        filterValue={crud.statusFilter}
        onFilterChange={crud.setStatusFilter}
        filterOptions={filterOptions}
        filterLabel="全部状态"
      >
        <StatusCountBar items={statusCountItems} />
      </SearchFilterBar>

      <DataTable
        columns={columns}
        data={pagedVehicles}
        loading={loading}
        pagination={{
          page: crud.page,
          pageSize: crud.pageSize,
          total: filteredVehicles.length,
          onPageChange: crud.setPage,
        }}
      />

      {crud.showDetailModal && crud.selectedItem && (
        <Modal open={crud.showDetailModal} onClose={crud.closeDetailModal} title="车辆详情" size="lg">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <SectionHeader title="基本信息" color="primary" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <DetailItem label="车牌号">{(crud.selectedItem as Vehicle).plateNumber}</DetailItem>
                  <DetailItem label="车辆类型">
                    {VEHICLE_TYPES.find(t => t.value === (crud.selectedItem as Vehicle).vehicleType)?.label}
                  </DetailItem>
                  <DetailItem label="车型">{(crud.selectedItem as Vehicle).model}</DetailItem>
                  <DetailItem label="载重">{(crud.selectedItem as Vehicle).loadCapacity}吨</DetailItem>
                  <DetailItem label="车架号">{(crud.selectedItem as Vehicle).vin}</DetailItem>
                  <DetailItem label="发动机号">{(crud.selectedItem as Vehicle).engineNumber}</DetailItem>
                  <DetailItem label="购买日期">{formatDate((crud.selectedItem as Vehicle).purchaseDate)}</DetailItem>
                  <div>
                    <span className="text-neutral-500">当前状态：</span>
                    {getStatusBadge((crud.selectedItem as Vehicle).status)}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <SectionHeader title="证件信息" color="warning" />
                <div className="grid grid-cols-1 gap-4 text-sm">
                  {[
                    { label: '行驶证有效期', date: (crud.selectedItem as Vehicle).operationLicenseExpiry },
                    { label: '保险有效期', date: (crud.selectedItem as Vehicle).insuranceExpiry },
                    { label: '年检有效期', date: (crud.selectedItem as Vehicle).inspectionExpiry },
                    { label: '环保标志有效期', date: (crud.selectedItem as Vehicle).environmentalExpiry },
                  ].map((item) => {
                    const status = getExpiryStatus(item.date);
                    return (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-neutral-500">{item.label}</span>
                        <div className="text-right">
                          <span className="font-medium text-neutral-800">{formatDate(item.date)}</span>
                          <div className="mt-1">
                            <StatusBadge variant={status.variant}>{status.text}</StatusBadge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeader title="最近维护记录" color="success" />
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
                    {(crud.selectedItem as Vehicle).maintenanceRecords.slice(0, 3).map((record) => (
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

      <DeleteConfirmModal
        open={crud.showDeleteConfirm}
        onClose={crud.closeDeleteConfirm}
        onConfirm={crud.confirmDelete}
        itemName={(crud.deleteTarget as Vehicle)?.plateNumber || ''}
        itemType="车辆"
      />

      {crud.showFormModal && (
        <Modal
          open={crud.showFormModal}
          onClose={crud.closeFormModal}
          title={crud.isEditing ? '编辑车辆' : '新增车辆'}
          size="xl"
          footer={<FormModalFooter onCancel={crud.closeFormModal} onSubmit={handleSubmit} loading={crud.formLoading} />}
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <SectionHeader title="基本信息" color="primary" />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="车牌号" required error={crud.formErrors.plateNumber}>
                  <FormInput type="text" value={formData.plateNumber} onChange={(e) => handleFormChange('plateNumber', e.target.value)} placeholder="请输入车牌号" error={crud.formErrors.plateNumber} />
                </FormField>
                <FormField label="车辆类型" required error={crud.formErrors.vehicleType}>
                  <FormSelect value={formData.vehicleType} onChange={(e) => handleFormChange('vehicleType', e.target.value)} options={VEHICLE_TYPES.map(t => ({ value: t.value, label: t.label }))} error={crud.formErrors.vehicleType} />
                </FormField>
                <FormField label="生产厂家" required error={crud.formErrors.manufacturer}>
                  <FormInput type="text" value={formData.manufacturer} onChange={(e) => handleFormChange('manufacturer', e.target.value)} placeholder="请输入生产厂家" error={crud.formErrors.manufacturer} />
                </FormField>
                <FormField label="车型" required error={crud.formErrors.model}>
                  <FormInput type="text" value={formData.model} onChange={(e) => handleFormChange('model', e.target.value)} placeholder="请输入车型" error={crud.formErrors.model} />
                </FormField>
                <FormField label="载重(吨)" required error={crud.formErrors.loadCapacity}>
                  <FormInput type="number" value={formData.loadCapacity} onChange={(e) => handleFormChange('loadCapacity', Number(e.target.value))} placeholder="请输入载重" error={crud.formErrors.loadCapacity} />
                </FormField>
                <FormField label="年份" required error={crud.formErrors.year}>
                  <FormInput type="number" value={formData.year} onChange={(e) => handleFormChange('year', Number(e.target.value))} placeholder="请输入年份" error={crud.formErrors.year} />
                </FormField>
                <FormField label="里程(公里)" error={crud.formErrors.mileage}>
                  <FormInput type="number" value={formData.mileage} onChange={(e) => handleFormChange('mileage', Number(e.target.value))} placeholder="请输入里程" error={crud.formErrors.mileage} />
                </FormField>
                <FormField label="状态">
                  <FormSelect value={formData.status} onChange={(e) => handleFormChange('status', e.target.value)} options={Object.entries(VEHICLE_STATUS).map(([key, val]) => ({ value: key, label: val.label }))} />
                </FormField>
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeader title="车辆识别" color="warning" />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="车架号(VIN)" required error={crud.formErrors.vin}>
                  <FormInput type="text" value={formData.vin} onChange={(e) => handleFormChange('vin', e.target.value)} placeholder="请输入车架号" error={crud.formErrors.vin} />
                </FormField>
                <FormField label="发动机号" required error={crud.formErrors.engineNumber}>
                  <FormInput type="text" value={formData.engineNumber} onChange={(e) => handleFormChange('engineNumber', e.target.value)} placeholder="请输入发动机号" error={crud.formErrors.engineNumber} />
                </FormField>
                <FormField label="购买日期" required error={crud.formErrors.purchaseDate}>
                  <FormInput type="date" value={formData.purchaseDate} onChange={(e) => handleFormChange('purchaseDate', e.target.value)} error={crud.formErrors.purchaseDate} />
                </FormField>
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeader title="证件有效期" color="success" />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="保险有效期" required error={crud.formErrors.insuranceExpiry}>
                  <FormInput type="date" value={formData.insuranceExpiry} onChange={(e) => handleFormChange('insuranceExpiry', e.target.value)} error={crud.formErrors.insuranceExpiry} />
                </FormField>
                <FormField label="行驶证有效期" required error={crud.formErrors.operationLicenseExpiry}>
                  <FormInput type="date" value={formData.operationLicenseExpiry} onChange={(e) => handleFormChange('operationLicenseExpiry', e.target.value)} error={crud.formErrors.operationLicenseExpiry} />
                </FormField>
                <FormField label="年检有效期">
                  <FormInput type="date" value={formData.inspectionExpiry} onChange={(e) => handleFormChange('inspectionExpiry', e.target.value)} />
                </FormField>
                <FormField label="环保标志有效期">
                  <FormInput type="date" value={formData.environmentalExpiry} onChange={(e) => handleFormChange('environmentalExpiry', e.target.value)} />
                </FormField>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <ToastContainer toasts={crud.toasts} onRemove={crud.removeToast} />
    </div>
  );
}
