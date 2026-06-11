import { useState } from 'react';
import { Plus, Eye, FileText, Edit2, Trash2, Phone } from 'lucide-react';
import { useDriverStore } from '@/store/useDriverStore';
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
import { DRIVER_STATUS, LICENSE_TYPES } from '@/types';
import { formatDate, classNames, validatePhone, validateIdCard, getExpiryStatus } from '@/utils';
import type { Driver } from '@/types';

const defaultFormData = {
  name: '',
  gender: 'male' as Driver['gender'],
  phone: '',
  idCard: '',
  licenseNumber: '',
  licenseType: 'B2',
  licenseExpiry: formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
  hireDate: formatDate(new Date()),
  status: 'on_duty' as Driver['status'],
  drivingYears: 1,
  qualificationCert: '',
  qualificationExpiry: formatDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
  physicalExpiry: formatDate(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)),
  emergencyContact: {
    name: '',
    phone: '',
    relationship: '',
  },
  accidentCount: 0,
  trainingRecords: [],
};

export default function DriversPage() {
  const { drivers, loading, deleteDriver, addDriver, updateDriver } = useDriverStore();

  const crud = useCrudPage<any>({
    defaultFormData,
    onAdd: (data) => addDriver(data),
    onUpdate: (id, data) => updateDriver(id, data),
    onDelete: (id) => deleteDriver(id),
    addSuccessMessage: '驾驶员添加成功',
    updateSuccessMessage: '驾驶员信息更新成功',
    deleteSuccessMessage: '驾驶员删除成功',
    validateForm: (data) => {
      const errors: Record<string, string> = {};
      if (!data.name.trim()) errors.name = '请输入姓名';
      if (!data.phone.trim()) errors.phone = '请输入联系电话';
      else if (!validatePhone(data.phone)) errors.phone = '手机号码格式不正确';
      if (!data.idCard.trim()) errors.idCard = '请输入身份证号';
      else if (!validateIdCard(data.idCard)) errors.idCard = '身份证号格式不正确';
      if (!data.licenseNumber.trim()) errors.licenseNumber = '请输入驾驶证编号';
      if (!data.licenseType) errors.licenseType = '请选择驾驶证类型';
      if (!data.licenseExpiry) errors.licenseExpiry = '请选择驾驶证有效期';
      if (!data.hireDate) errors.hireDate = '请选择入职日期';
      if (data.drivingYears < 0) errors.drivingYears = '驾龄不能为负数';
      if (data.emergencyContact.name && !data.emergencyContact.phone) errors.emergencyPhone = '请填写紧急联系人电话';
      else if (data.emergencyContact.phone && !validatePhone(data.emergencyContact.phone)) errors.emergencyPhone = '紧急联系人电话格式不正确';
      return errors;
    },
  });

  const [formData, setFormData] = useState(defaultFormData);

  const handleAdd = () => {
    crud.handleAdd();
    setFormData(defaultFormData);
  };

  const handleEdit = (driver: Driver) => {
    setFormData({
      name: driver.name,
      gender: driver.gender,
      phone: driver.phone,
      idCard: driver.idCard,
      licenseNumber: driver.licenseNumber,
      licenseType: driver.licenseType,
      licenseExpiry: formatDate(driver.licenseExpiry),
      hireDate: formatDate(driver.hireDate),
      status: driver.status,
      drivingYears: driver.drivingYears,
      qualificationCert: driver.qualificationCert,
      qualificationExpiry: formatDate(driver.qualificationExpiry),
      physicalExpiry: formatDate(driver.physicalExpiry),
      emergencyContact: { ...driver.emergencyContact },
      accidentCount: driver.accidentCount,
      trainingRecords: driver.trainingRecords,
    });
    crud.handleEdit(driver);
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

  const handleEmergencyContactChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [field]: value },
    }));
    if (field === 'phone' && crud.formErrors.emergencyPhone) {
      crud.setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.emergencyPhone;
        return newErrors;
      });
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchSearch =
      d.name.includes(crud.searchText) ||
      d.phone.includes(crud.searchText) ||
      d.licenseNumber.includes(crud.searchText);
    const matchStatus = crud.statusFilter === 'all' || d.status === crud.statusFilter;
    return matchSearch && matchStatus;
  });

  const pagedDrivers = filteredDrivers.slice((crud.page - 1) * crud.pageSize, crud.page * crud.pageSize);

  const getStatusBadge = (status: Driver['status']) => {
    const config = DRIVER_STATUS[status];
    return <StatusBadge variant={config.color as any}>{config.label}</StatusBadge>;
  };

  const statusCountItems = Object.entries(DRIVER_STATUS).map(([key, val]) => ({
    key,
    label: val.label,
    color: val.color,
    count: drivers.filter((d) => d.status === key).length,
  }));

  const filterOptions = Object.entries(DRIVER_STATUS).map(([key, val]) => ({
    value: key,
    label: val.label,
  }));

  const columns = [
    {
      key: 'avatar',
      title: '照片',
      width: '60px',
      render: (row: Driver) => (
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
          {row.avatar ? (
            <img src={row.avatar} alt={row.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-primary-600 font-medium">{row.name.charAt(0)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      title: '姓名',
      width: '100px',
      render: (row: Driver) => (
        <span className="font-medium text-neutral-800">{row.name}</span>
      ),
    },
    {
      key: 'phone',
      title: '联系电话',
      width: '130px',
      render: (row: Driver) => (
        <div className="flex items-center gap-1 text-neutral-700">
          <Phone className="w-3.5 h-3.5 text-neutral-400" />
          {row.phone}
        </div>
      ),
    },
    {
      key: 'licenseType',
      title: '驾照类型',
      width: '90px',
      render: (row: Driver) => row.licenseType,
    },
    {
      key: 'licenseNumber',
      title: '驾照编号',
      render: (row: Driver) => row.licenseNumber,
    },
    {
      key: 'experience',
      title: '驾龄',
      width: '70px',
      render: (row: Driver) => `${row.drivingYears}年`,
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (row: Driver) => getStatusBadge(row.status),
    },
    {
      key: 'licenseExpiry',
      title: '驾照到期',
      width: '130px',
      render: (row: Driver) => {
        const status = getExpiryStatus(row.licenseExpiry, 90);
        return (
          <div>
            <div className="text-sm text-neutral-700">{formatDate(row.licenseExpiry)}</div>
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
      width: '120px',
      render: (row: Driver) => (
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
            title="证件管理"
          >
            <FileText className="w-4 h-4" />
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
          <h1 className="text-2xl font-bold text-neutral-800">驾驶员管理</h1>
          <p className="text-sm text-neutral-500 mt-1">管理所有驾驶员的基本信息、资质证书和工作状态</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增驾驶员
        </button>
      </div>

      <SearchFilterBar
        searchText={crud.searchText}
        onSearchChange={crud.setSearchText}
        searchPlaceholder="搜索姓名、电话、驾照编号..."
        filterValue={crud.statusFilter}
        onFilterChange={crud.setStatusFilter}
        filterOptions={filterOptions}
        filterLabel="全部状态"
      >
        <StatusCountBar items={statusCountItems} />
      </SearchFilterBar>

      <DataTable
        columns={columns}
        data={pagedDrivers}
        loading={loading}
        pagination={{
          page: crud.page,
          pageSize: crud.pageSize,
          total: filteredDrivers.length,
          onPageChange: crud.setPage,
        }}
      />

      {crud.showDetailModal && crud.selectedItem && (
        <Modal
          open={crud.showDetailModal}
          onClose={crud.closeDetailModal}
          title="驾驶员详情"
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-xl bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {(crud.selectedItem as Driver).avatar ? (
                  <img
                    src={(crud.selectedItem as Driver).avatar}
                    alt={(crud.selectedItem as Driver).name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-primary-600 font-bold">
                    {(crud.selectedItem as Driver).name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-neutral-800">{(crud.selectedItem as Driver).name}</h3>
                  {getStatusBadge((crud.selectedItem as Driver).status)}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <DetailItem label="联系电话">{(crud.selectedItem as Driver).phone}</DetailItem>
                  <DetailItem label="身份证号">{(crud.selectedItem as Driver).idCard}</DetailItem>
                  <DetailItem label="入职日期">{formatDate((crud.selectedItem as Driver).hireDate)}</DetailItem>
                  <DetailItem label="驾龄">{(crud.selectedItem as Driver).drivingYears}年</DetailItem>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <SectionHeader title="驾驶资质" color="primary" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <DetailItem label="驾照类型">{(crud.selectedItem as Driver).licenseType}</DetailItem>
                  <DetailItem label="驾照编号">{(crud.selectedItem as Driver).licenseNumber}</DetailItem>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">驾照有效期</span>
                      <div className="text-right">
                        <span className="font-medium text-neutral-800">
                          {formatDate((crud.selectedItem as Driver).licenseExpiry)}
                        </span>
                        <div className="mt-1">
                          {(() => {
                            const status = getExpiryStatus((crud.selectedItem as Driver).licenseExpiry, 90);
                            return <StatusBadge variant={status.variant}>{status.text}</StatusBadge>;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <DetailItem label="从业资格证">{(crud.selectedItem as Driver).qualificationCert}</DetailItem>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">从业资格证有效期</span>
                      <div className="text-right">
                        <span className="font-medium text-neutral-800">
                          {formatDate((crud.selectedItem as Driver).qualificationExpiry)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <SectionHeader title="安全记录" color="warning" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <DetailItem label="累计安全行驶">{(crud.selectedItem as Driver).accidentCount === 0 ? '无事故' : `${(crud.selectedItem as Driver).accidentCount}次事故`}</DetailItem>
                  <DetailItem label="累计违章次数">{(crud.selectedItem as Driver).violationCount}次</DetailItem>
                  <DetailItem label="安全培训记录">{(crud.selectedItem as Driver).trainingRecords.length}次</DetailItem>
                  <DetailItem label="体检有效期至">{formatDate((crud.selectedItem as Driver).physicalExpiry)}</DetailItem>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeader title="紧急联系人" color="success" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <DetailItem label="紧急联系人">{(crud.selectedItem as Driver).emergencyContact.name}</DetailItem>
                <DetailItem label="联系电话">{(crud.selectedItem as Driver).emergencyContact.phone}</DetailItem>
                <DetailItem label="与本人关系">{(crud.selectedItem as Driver).emergencyContact.relationship}</DetailItem>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <DeleteConfirmModal
        open={crud.showDeleteConfirm}
        onClose={crud.closeDeleteConfirm}
        onConfirm={crud.confirmDelete}
        itemName={(crud.deleteTarget as Driver)?.name || ''}
        itemType="驾驶员"
      />

      {crud.showFormModal && (
        <Modal
          open={crud.showFormModal}
          onClose={crud.closeFormModal}
          title={crud.isEditing ? '编辑驾驶员' : '新增驾驶员'}
          size="xl"
          footer={<FormModalFooter onCancel={crud.closeFormModal} onSubmit={handleSubmit} loading={crud.formLoading} />}
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <SectionHeader title="基本信息" color="primary" />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="姓名" required error={crud.formErrors.name}>
                  <FormInput
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="请输入姓名"
                    error={crud.formErrors.name}
                  />
                </FormField>
                <FormField label="性别">
                  <div className="flex items-center gap-4 py-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="male"
                        checked={formData.gender === 'male'}
                        onChange={(e) => handleFormChange('gender', e.target.value)}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm text-neutral-700">男</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="female"
                        checked={formData.gender === 'female'}
                        onChange={(e) => handleFormChange('gender', e.target.value)}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm text-neutral-700">女</span>
                    </label>
                  </div>
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
                <FormField label="身份证号" required error={crud.formErrors.idCard}>
                  <FormInput
                    type="text"
                    value={formData.idCard}
                    onChange={(e) => handleFormChange('idCard', e.target.value)}
                    placeholder="请输入身份证号"
                    error={crud.formErrors.idCard}
                  />
                </FormField>
                <FormField label="入职日期" required error={crud.formErrors.hireDate}>
                  <FormInput
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => handleFormChange('hireDate', e.target.value)}
                    error={crud.formErrors.hireDate}
                  />
                </FormField>
                <FormField label="驾龄(年)" error={crud.formErrors.drivingYears}>
                  <FormInput
                    type="number"
                    value={formData.drivingYears}
                    onChange={(e) => handleFormChange('drivingYears', Number(e.target.value))}
                    placeholder="请输入驾龄"
                    error={crud.formErrors.drivingYears}
                  />
                </FormField>
                <FormField label="状态">
                  <FormSelect
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    options={Object.entries(DRIVER_STATUS).map(([key, val]) => ({ value: key, label: val.label }))}
                  />
                </FormField>
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeader title="驾驶资质" color="warning" />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="驾驶证类型" required error={crud.formErrors.licenseType}>
                  <FormSelect
                    value={formData.licenseType}
                    onChange={(e) => handleFormChange('licenseType', e.target.value)}
                    options={LICENSE_TYPES.map((type) => ({ value: type, label: type }))}
                    error={crud.formErrors.licenseType}
                  />
                </FormField>
                <FormField label="驾驶证编号" required error={crud.formErrors.licenseNumber}>
                  <FormInput
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => handleFormChange('licenseNumber', e.target.value)}
                    placeholder="请输入驾驶证编号"
                    error={crud.formErrors.licenseNumber}
                  />
                </FormField>
                <FormField label="驾驶证有效期" required error={crud.formErrors.licenseExpiry}>
                  <FormInput
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={(e) => handleFormChange('licenseExpiry', e.target.value)}
                    error={crud.formErrors.licenseExpiry}
                  />
                </FormField>
                <FormField label="从业资格证号">
                  <FormInput
                    type="text"
                    value={formData.qualificationCert}
                    onChange={(e) => handleFormChange('qualificationCert', e.target.value)}
                    placeholder="请输入从业资格证号"
                  />
                </FormField>
                <FormField label="从业资格证有效期">
                  <FormInput
                    type="date"
                    value={formData.qualificationExpiry}
                    onChange={(e) => handleFormChange('qualificationExpiry', e.target.value)}
                  />
                </FormField>
                <FormField label="体检有效期">
                  <FormInput
                    type="date"
                    value={formData.physicalExpiry}
                    onChange={(e) => handleFormChange('physicalExpiry', e.target.value)}
                  />
                </FormField>
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeader title="紧急联系人" color="success" />
              <div className="grid grid-cols-3 gap-4">
                <FormField label="姓名">
                  <FormInput
                    type="text"
                    value={formData.emergencyContact.name}
                    onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                    placeholder="请输入紧急联系人姓名"
                  />
                </FormField>
                <FormField label="联系电话" error={crud.formErrors.emergencyPhone}>
                  <FormInput
                    type="text"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                    placeholder="请输入联系电话"
                    error={crud.formErrors.emergencyPhone}
                  />
                </FormField>
                <FormField label="关系">
                  <FormInput
                    type="text"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                    placeholder="如：配偶、父母"
                  />
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
