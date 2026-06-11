import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, MapPin, Clock, Truck } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { useVehicleStore } from '@/store/useVehicleStore';
import { useDriverStore } from '@/store/useDriverStore';
import DataTable from '@/components/UI/DataTable';
import StatusBadge from '@/components/UI/StatusBadge';
import Modal from '@/components/UI/Modal';
import SearchFilterBar from '@/components/UI/SearchFilterBar';
import DeleteConfirmModal from '@/components/UI/DeleteConfirmModal';
import FormField, { FormInput, FormSelect } from '@/components/UI/FormField';
import SectionHeader from '@/components/UI/SectionHeader';
import DetailItem from '@/components/UI/DetailItem';
import FormModalFooter from '@/components/UI/FormModalFooter';
import { ToastContainer } from '@/components/UI/Toast';
import { useCrudPage } from '@/hooks/useCrudPage';
import { TASK_STATUS, MATERIAL_TYPES } from '@/types';
import { formatDate, formatDateTime, formatWeight, classNames } from '@/utils';
import type { TransportTask } from '@/types';

export default function TasksPage() {
  const { tasks, loading, deleteTask, addTask, updateTask } = useTaskStore();
  const { vehicles } = useVehicleStore();
  const { drivers } = useDriverStore();

  const defaultFormData = {
    id: '',
    taskNo: '',
    name: '',
    vehicleId: '',
    driverId: '',
    vehiclePlate: '',
    driverName: '',
    material: '渣土',
    materialType: '渣土',
    plannedTrips: 5,
    plannedLoads: 5,
    actualTrips: 0,
    plannedQuantity: 100,
    actualQuantity: 0,
    distance: 10,
    fromLocation: '',
    toLocation: '',
    scheduledDate: formatDate(new Date()),
    status: 'pending' as TransportTask['status'],
    route: {
      id: '',
      name: '',
      startLocation: { lat: 0, lng: 0 },
      endLocation: { lat: 0, lng: 0 },
      distance: 10,
      estimatedTime: 60,
    },
    transportRecords: [] as TransportTask['transportRecords'],
    createdAt: '',
  };

  const crud = useCrudPage<any>({
    defaultFormData,
    onAdd: async (data) => { await addTask(data); },
    onUpdate: async (id, data) => { await updateTask(id, data); },
    onDelete: (id) => deleteTask(id),
    addSuccessMessage: '任务创建成功',
    updateSuccessMessage: '任务信息更新成功',
    deleteSuccessMessage: '任务删除成功',
    validateForm: (data) => {
      const errors: Record<string, string> = {};
      if (!data.taskNo.trim()) errors.taskNo = '请输入任务编号';
      if (!data.name.trim()) errors.name = '请输入任务名称';
      if (!data.vehicleId) errors.vehicleId = '请选择运输车辆';
      if (!data.driverId) errors.driverId = '请选择驾驶员';
      if (!data.material) errors.material = '请选择运输物料';
      if (!data.plannedTrips || data.plannedTrips <= 0) errors.plannedTrips = '请输入有效的计划趟数';
      if (!data.plannedQuantity || data.plannedQuantity <= 0) errors.plannedQuantity = '请输入有效的计划方量';
      if (!data.distance || data.distance <= 0) errors.distance = '请输入有效的运输距离';
      if (!data.fromLocation.trim()) errors.fromLocation = '请输入装料地点';
      if (!data.toLocation.trim()) errors.toLocation = '请输入卸料地点';
      if (!data.scheduledDate) errors.scheduledDate = '请选择计划日期';
      return errors;
    },
  });

  const [formData, setFormData] = useState(defaultFormData);

  const generateTaskNo = () => {
    const date = new Date();
    const dateStr = formatDate(date, 'YYYYMMDD');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `T${dateStr}${random}`;
  };

  const handleAdd = () => {
    crud.handleAdd();
    setFormData({ ...defaultFormData, taskNo: generateTaskNo() });
  };

  const handleEdit = (task: TransportTask) => {
    setFormData({
      taskNo: task.taskNo,
      name: task.name,
      vehicleId: task.vehicleId,
      driverId: task.driverId,
      vehiclePlate: task.vehiclePlate,
      driverName: task.driverName,
      material: task.material,
      materialType: task.materialType,
      plannedTrips: task.plannedTrips,
      plannedLoads: task.plannedLoads,
      actualTrips: task.actualTrips,
      plannedQuantity: task.plannedQuantity,
      actualQuantity: task.actualQuantity,
      distance: task.distance,
      fromLocation: task.fromLocation,
      toLocation: task.toLocation,
      scheduledDate: formatDate(task.scheduledDate),
      status: task.status,
      route: task.route,
      transportRecords: task.transportRecords,
      id: task.id,
      createdAt: task.createdAt,
    });
    crud.handleEdit(task);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'material') {
        updated.materialType = value;
      }
      if (field === 'plannedTrips') {
        updated.plannedLoads = value;
      }
      return updated;
    });
    if (crud.formErrors[field]) {
      crud.setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      handleFormChange('vehicleId', vehicleId);
      handleFormChange('vehiclePlate', vehicle.plateNumber);
      if (vehicle.driverId) {
        handleFormChange('driverId', vehicle.driverId);
        handleFormChange('driverName', vehicle.driverName || '');
      }
    }
  };

  const handleDriverChange = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    if (driver) {
      handleFormChange('driverId', driverId);
      handleFormChange('driverName', driver.name);
    }
  };

  const handleSubmit = () => {
    crud.handleSubmit(formData);
  };

  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      t.taskNo.includes(crud.searchText) ||
      t.vehiclePlate.includes(crud.searchText) ||
      t.driverName.includes(crud.searchText) ||
      t.material.includes(crud.searchText);
    const matchStatus = crud.statusFilter === 'all' || t.status === crud.statusFilter;
    return matchSearch && matchStatus;
  });

  const pagedTasks = filteredTasks.slice((crud.page - 1) * crud.pageSize, crud.page * crud.pageSize);

  const getStatusBadge = (status: TransportTask['status']) => {
    const config = TASK_STATUS[status];
    return <StatusBadge variant={config.color as any}>{config.label}</StatusBadge>;
  };

  const getProgress = (task: TransportTask) => {
    if (task.status === 'completed') return 100;
    if (task.status === 'cancelled') return 0;
    if (task.actualTrips === 0) return 10;
    return Math.round((task.actualTrips / task.plannedTrips) * 100);
  };

  const columns = [
    {
      key: 'taskNo',
      title: '任务编号',
      width: '130px',
      render: (row: TransportTask) => (
        <span className="font-medium text-primary-600">{row.taskNo}</span>
      ),
    },
    {
      key: 'material',
      title: '运输物料',
      width: '100px',
      render: (row: TransportTask) => row.material,
    },
    {
      key: 'vehiclePlate',
      title: '车辆',
      width: '110px',
      render: (row: TransportTask) => (
        <div className="flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-800">{row.vehiclePlate}</span>
        </div>
      ),
    },
    {
      key: 'driverName',
      title: '驾驶员',
      width: '90px',
      render: (row: TransportTask) => row.driverName,
    },
    {
      key: 'route',
      title: '运输路线',
      width: '200px',
      render: (row: TransportTask) => (
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-neutral-800 truncate">{row.fromLocation}</div>
            <div className="flex items-center gap-1.5 text-neutral-500">
              <div className="w-0.5 h-2 bg-neutral-300" />
              <MapPin className="w-3.5 h-3.5 text-danger-500" />
            </div>
            <div className="text-neutral-800 truncate">{row.toLocation}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'plannedQuantity',
      title: '计划/实际',
      width: '120px',
      render: (row: TransportTask) => (
        <div className="text-sm">
          <div className="text-neutral-800">{formatWeight(row.actualQuantity)}</div>
          <div className="text-neutral-500 text-xs">计划: {formatWeight(row.plannedQuantity)}</div>
        </div>
      ),
    },
    {
      key: 'progress',
      title: '进度',
      width: '120px',
      render: (row: TransportTask) => {
        const progress = getProgress(row);
        return (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-neutral-600">
                {row.actualTrips}/{row.plannedTrips}趟
              </span>
              <span className="font-medium text-primary-600">{progress}%</span>
            </div>
            <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (row: TransportTask) => getStatusBadge(row.status),
    },
    {
      key: 'scheduledDate',
      title: '计划日期',
      width: '100px',
      render: (row: TransportTask) => formatDate(row.scheduledDate),
    },
    {
      key: 'operation',
      title: '操作',
      width: '120px',
      render: (row: TransportTask) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => crud.handleViewDetail(row)}
            className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="查看详情"
          >
            <Eye className="w-4 h-4" />
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
          <h1 className="text-2xl font-bold text-neutral-800">任务调度</h1>
          <p className="text-sm text-neutral-500 mt-1">管理运输任务的分配、跟踪和进度监控</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-default">实时跟踪</button>
          <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新增任务
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(TASK_STATUS).map(([key, val]) => {
          const count = tasks.filter((t) => t.status === key).length;
          return (
            <div key={key} className="card p-4 flex items-center gap-3">
              <div
                className={classNames(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  val.color === 'primary' && 'bg-primary-100 text-primary-600',
                  val.color === 'success' && 'bg-success-100 text-success-600',
                  val.color === 'warning' && 'bg-warning-100 text-warning-600',
                  val.color === 'danger' && 'bg-danger-100 text-danger-600',
                  val.color === 'neutral' && 'bg-neutral-100 text-neutral-600'
                )}
              >
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-800">{count}</div>
                <div className="text-sm text-neutral-500">{val.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <SearchFilterBar
        searchText={crud.searchText}
        onSearchChange={crud.setSearchText}
        searchPlaceholder="搜索任务编号、车牌号、驾驶员、物料..."
        filterValue={crud.statusFilter}
        onFilterChange={crud.setStatusFilter}
        filterOptions={Object.entries(TASK_STATUS).map(([key, val]) => ({ value: key, label: val.label }))}
        filterLabel="全部状态"
      />

      <DataTable
        columns={columns}
        data={pagedTasks}
        loading={loading}
        pagination={{
          page: crud.page,
          pageSize: crud.pageSize,
          total: filteredTasks.length,
          onPageChange: crud.setPage,
        }}
      />

      {crud.showDetailModal && crud.selectedItem && (
        <Modal
          open={crud.showDetailModal}
          onClose={crud.closeDetailModal}
          title="任务详情"
          size="xl"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-neutral-800">{crud.selectedItem.taskNo}</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  创建于 {formatDateTime(crud.selectedItem.createdAt)}
                </p>
              </div>
              {getStatusBadge(crud.selectedItem.status)}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <SectionHeader title="基本信息" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <DetailItem label="运输物料">{crud.selectedItem.material}</DetailItem>
                  <DetailItem label="计划日期">{formatDate(crud.selectedItem.scheduledDate)}</DetailItem>
                  <DetailItem label="计划趟数">{crud.selectedItem.plannedTrips}趟</DetailItem>
                  <DetailItem label="实际趟数">{crud.selectedItem.actualTrips}趟</DetailItem>
                  <DetailItem label="计划方量">{formatWeight(crud.selectedItem.plannedQuantity)}</DetailItem>
                  <DetailItem label="实际方量">{formatWeight(crud.selectedItem.actualQuantity)}</DetailItem>
                </div>
              </div>
              <div className="space-y-4">
                <SectionHeader title="运输资源" color="warning" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <DetailItem label="车辆">{crud.selectedItem.vehiclePlate}</DetailItem>
                  <DetailItem label="驾驶员">{crud.selectedItem.driverName}</DetailItem>
                  <DetailItem label="预计运输距离" className="col-span-2">{crud.selectedItem.distance}公里</DetailItem>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeader title="运输路线" color="success" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-primary-600" />
                    </div>
                    <span className="text-sm font-medium text-neutral-600">装料点</span>
                  </div>
                  <p className="text-neutral-800">{crud.selectedItem.fromLocation}</p>
                </div>
                <div className="card p-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{crud.selectedItem.distance}</div>
                    <div className="text-xs text-neutral-500">公里</div>
                  </div>
                </div>
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-danger-100 flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-danger-600" />
                    </div>
                    <span className="text-sm font-medium text-neutral-600">卸料点</span>
                  </div>
                  <p className="text-neutral-800">{crud.selectedItem.toLocation}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeader title="运输记录" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-2 text-neutral-600 font-medium">序号</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">装料时间</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">卸料时间</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">毛重</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">皮重</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">净重</th>
                      <th className="text-left py-2 text-neutral-600 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crud.selectedItem.transportRecords.map((record, index) => (
                      <tr key={record.id} className="border-b border-neutral-100">
                        <td className="py-3">{index + 1}</td>
                        <td className="py-3">{formatDateTime(record.loadTime)}</td>
                        <td className="py-3">{formatDateTime(record.unloadTime)}</td>
                        <td className="py-3">{formatWeight(record.grossWeight)}</td>
                        <td className="py-3">{formatWeight(record.tareWeight)}</td>
                        <td className="py-3 font-medium text-primary-600">
                          {formatWeight(record.netWeight)}
                        </td>
                        <td className="py-3">
                          <StatusBadge variant="success">已完成</StatusBadge>
                        </td>
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
        itemName={crud.deleteTarget?.taskNo || ''}
        itemType="任务"
      />

      {crud.showFormModal && (
        <Modal
          open={crud.showFormModal}
          onClose={crud.closeFormModal}
          title={crud.isEditing ? '编辑任务' : '新增任务'}
          size="xl"
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
              <SectionHeader title="基本信息" />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="任务编号" required error={crud.formErrors.taskNo}>
                  <FormInput
                    type="text"
                    value={formData.taskNo}
                    onChange={(e) => handleFormChange('taskNo', e.target.value)}
                    placeholder="请输入任务编号"
                    error={crud.formErrors.taskNo}
                  />
                </FormField>
                <FormField label="任务名称" required error={crud.formErrors.name}>
                  <FormInput
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    placeholder="请输入任务名称"
                    error={crud.formErrors.name}
                  />
                </FormField>
                <FormField label="运输物料" required error={crud.formErrors.material}>
                  <FormSelect
                    value={formData.material}
                    onChange={(e) => handleFormChange('material', e.target.value)}
                    error={crud.formErrors.material}
                    options={MATERIAL_TYPES.map((m) => ({ value: m, label: m }))}
                  />
                </FormField>
                <FormField label="计划日期" required error={crud.formErrors.scheduledDate}>
                  <FormInput
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => handleFormChange('scheduledDate', e.target.value)}
                    error={crud.formErrors.scheduledDate}
                  />
                </FormField>
                <FormField label="计划趟数" required error={crud.formErrors.plannedTrips}>
                  <FormInput
                    type="number"
                    value={formData.plannedTrips}
                    onChange={(e) => handleFormChange('plannedTrips', Number(e.target.value))}
                    placeholder="请输入计划趟数"
                    error={crud.formErrors.plannedTrips}
                  />
                </FormField>
                <FormField label="计划方量(吨)" required error={crud.formErrors.plannedQuantity}>
                  <FormInput
                    type="number"
                    value={formData.plannedQuantity}
                    onChange={(e) => handleFormChange('plannedQuantity', Number(e.target.value))}
                    placeholder="请输入计划方量"
                    error={crud.formErrors.plannedQuantity}
                  />
                </FormField>
                <FormField label="运输距离(公里)" required error={crud.formErrors.distance}>
                  <FormInput
                    type="number"
                    value={formData.distance}
                    onChange={(e) => handleFormChange('distance', Number(e.target.value))}
                    placeholder="请输入运输距离"
                    error={crud.formErrors.distance}
                  />
                </FormField>
                <FormField label="任务状态">
                  <FormSelect
                    value={formData.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    options={Object.entries(TASK_STATUS).map(([key, val]) => ({ value: key, label: val.label }))}
                  />
                </FormField>
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeader title="运输资源" color="warning" />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="运输车辆" required error={crud.formErrors.vehicleId}>
                  <FormSelect
                    value={formData.vehicleId}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    error={crud.formErrors.vehicleId}
                    options={vehicles.map((v) => ({ value: v.id, label: `${v.plateNumber} - ${v.model}` }))}
                    placeholder="请选择车辆"
                  />
                </FormField>
                <FormField label="驾驶员" required error={crud.formErrors.driverId}>
                  <FormSelect
                    value={formData.driverId}
                    onChange={(e) => handleDriverChange(e.target.value)}
                    error={crud.formErrors.driverId}
                    options={drivers.map((d) => ({ value: d.id, label: `${d.name} - ${d.licenseType}` }))}
                    placeholder="请选择驾驶员"
                  />
                </FormField>
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeader title="运输路线" color="success" />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="装料地点" required error={crud.formErrors.fromLocation}>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
                    <FormInput
                      type="text"
                      value={formData.fromLocation}
                      onChange={(e) => handleFormChange('fromLocation', e.target.value)}
                      placeholder="请输入装料地点"
                      error={crud.formErrors.fromLocation}
                      className="pl-10 pr-3"
                    />
                  </div>
                </FormField>
                <FormField label="卸料地点" required error={crud.formErrors.toLocation}>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-danger-500" />
                    <FormInput
                      type="text"
                      value={formData.toLocation}
                      onChange={(e) => handleFormChange('toLocation', e.target.value)}
                      placeholder="请输入卸料地点"
                      error={crud.formErrors.toLocation}
                      className="pl-10 pr-3"
                    />
                  </div>
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
