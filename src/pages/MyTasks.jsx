import { useState } from 'react';
import { useTasks } from '../context/useTasks';
import { useToast } from '../context/useToast';
import { TASK_COLORS, DEFAULT_TASK_COLOR } from '../constants/taskColors';
import './MyTasks.css';

function MyTasks() {
  const { tasks, addTask, updateTask, deleteTask, updateTaskStatus } = useTasks();
  const { showToast, showConfirm } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Normal',
    color: DEFAULT_TASK_COLOR,
    status: 'Not Started',
  });

  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);

  const handleOpenAddModal = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      dueDate: todayStr,
      priority: 'Normal',
      color: DEFAULT_TASK_COLOR,
      status: 'Not Started',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || '',
      priority: 'Normal',
      color: task.color || DEFAULT_TASK_COLOR,
      status: task.status || 'Not Started',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingTask) {
      updateTask(editingTask.id, formData);
      showToast(`บันทึกการแก้ไข "${formData.title}" เรียบร้อย ✏️`, 'info');
    } else {
      addTask(formData);
      showToast(`สร้างงานใหม่ "${formData.title}" สำเร็จ ✨`, 'success');
    }
    handleCloseModal();
  };

  const handleDelete = (id, title) => {
    showConfirm({
      title: 'ยืนยันการลบงาน',
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบงาน "${title}"? ข้อมูลจะถูกลบออกจากระบบอย่างถาวร`,
      confirmText: 'ยืนยันการลบ',
      cancelText: 'ยกเลิก',
      type: 'danger',
      onConfirm: () => {
        deleteTask(id);
        showToast(`ลบงาน "${title}" เรียบร้อยแล้ว 🗑️`, 'info');
      },
    });
  };

  const handleToggleStatus = (task) => {
    const isCompleted = (task.status || 'Not Started') === 'Completed';
    const nextStatus = isCompleted ? 'In Progress' : 'Completed';
    updateTaskStatus(task.id, nextStatus);

    if (!isCompleted) {
      showToast(`🎉 ยินดีด้วย! คุณทำงาน "${task.title}" เสร็จสิ้นแล้ว!`, 'celebrate');
    } else {
      showToast(`สลับสถานะงาน "${task.title}" กลับเป็นกำลังทำ ⚡`, 'info');
    }
  };

  // Status counts
  const totalCount = tasks.length;
  const notStartedCount = tasks.filter((t) => (t.status || 'Not Started') === 'Not Started').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;

  // Filter & Search logic for List View
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const currentStatus = task.status || 'Not Started';
    const matchesStatus = filterStatus === 'All' || currentStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getDueBadge = (dueDate, status) => {
    if (!dueDate) return null;
    if (status === 'Completed') return null;

    if (dueDate < todayStr) {
      return <span className="urgency-badge overdue">เลยกำหนด</span>;
    }
    if (dueDate === todayStr) {
      return <span className="urgency-badge today">วันนี้</span>;
    }
    return null;
  };

  return (
    <div className="tasks-page">
      {/* Header */}
      <div className="tasks-header">
        <div>
          <div className="tasks-tag">TASK MANAGEMENT</div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-desc">จัดการรายการงานและกำหนดส่งอย่างมืออาชีพ</p>
        </div>

        <button className="add-task-btn" onClick={handleOpenAddModal}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          <span>เพิ่มงานใหม่</span>
        </button>
      </div>

      {/* Segmented Status Tabs */}
      <div className="status-tabs-row">
        <button
          className={`status-tab-btn ${filterStatus === 'All' ? 'active' : ''}`}
          onClick={() => setFilterStatus('All')}
        >
          <span>ทั้งหมด</span>
          <span className="tab-count">{totalCount}</span>
        </button>

        <button
          className={`status-tab-btn ${filterStatus === 'Not Started' ? 'active' : ''}`}
          onClick={() => setFilterStatus('Not Started')}
        >
          <span>รอดำเนินการ</span>
          <span className="tab-count">{notStartedCount}</span>
        </button>

        <button
          className={`status-tab-btn ${filterStatus === 'In Progress' ? 'active' : ''}`}
          onClick={() => setFilterStatus('In Progress')}
        >
          <span>กำลังทำ</span>
          <span className="tab-count">{inProgressCount}</span>
        </button>

        <button
          className={`status-tab-btn ${filterStatus === 'Completed' ? 'active' : ''}`}
          onClick={() => setFilterStatus('Completed')}
        >
          <span>เสร็จสิ้น</span>
          <span className="tab-count">{completedCount}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="tasks-toolbar">
        <div className="search-input-wrapper">
          <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="ค้นหางานตามชื่อหรือรายละเอียด..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')} title="ล้างการค้นหา">✕</button>
          )}
        </div>
      </div>

      {/* Task Count Info */}
      <div className="tasks-count-bar">
        <span>แสดง <strong>{filteredTasks.length}</strong> จากทั้งหมด {tasks.length} รายการ</span>
      </div>

      {/* Task Cards List */}
      <div className="tasks-grid">
        {filteredTasks.length === 0 ? (
          <div className="empty-state-card">
            <h3>ไม่พบงานที่ตรงกับเงื่อนไข</h3>
            <p>ลองปรับคำค้นหา หรือกดปุ่ม "+ สร้างงานใหม่" เพื่อสร้างรายการ</p>
            <button className="empty-add-btn" onClick={handleOpenAddModal}>+ สร้างงานใหม่</button>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`task-card ${(task.status || 'Not Started') === 'Completed' ? 'is-completed' : ''}`}
              style={{
                borderLeftColor: (task.status || 'Not Started') === 'Completed' ? '#10b981' : (task.color || DEFAULT_TASK_COLOR),
              }}
            >
              <div className="task-card-header">
                <div className="task-badges">
                  <span
                    className="task-color-indicator"
                    style={{ backgroundColor: task.color || DEFAULT_TASK_COLOR }}
                    title="สีของงาน"
                  />
                  <span className="due-date-tag">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" />
                      <path d="M3 10h18" />
                    </svg>
                    {task.dueDate || 'ไม่ระบุ'}
                  </span>
                  {getDueBadge(task.dueDate, task.status)}
                </div>

                <div className="task-actions">
                  <button
                    type="button"
                    className="action-btn edit-btn"
                    onClick={() => handleOpenEditModal(task)}
                    title="แก้ไขงาน"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                    <span>แก้ไข</span>
                  </button>
                  <button
                    type="button"
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(task.id, task.title)}
                    title="ลบงาน"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" x2="10" y1="11" y2="17" />
                      <line x1="14" x2="14" y1="11" y2="17" />
                    </svg>
                    <span>ลบ</span>
                  </button>
                </div>
              </div>

              <div className="task-card-title-line">
                <button
                  type="button"
                  className={`task-quick-check-btn ${(task.status || 'Not Started') === 'Completed' ? 'checked' : ''}`}
                  onClick={() => handleToggleStatus(task)}
                  title={
                    (task.status || 'Not Started') === 'Completed'
                      ? 'ทำเครื่องหมายว่ายังไม่เสร็จ'
                      : 'คลิกเพื่อจบงานทันที'
                  }
                  aria-label={
                    (task.status || 'Not Started') === 'Completed'
                      ? 'ทำเครื่องหมายว่ายังไม่เสร็จ'
                      : 'คลิกเพื่อจบงานทันที'
                  }
                >
                  {(task.status || 'Not Started') === 'Completed' && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <h3 className={`task-card-title ${(task.status || 'Not Started') === 'Completed' ? 'done' : ''}`}>
                  {task.title}
                </h3>
              </div>
              {task.description && (
                <p className="task-card-desc">{task.description}</p>
              )}

              <div className="task-card-footer">
                <span className="status-label">สถานะ:</span>
                <select
                  className={`status-select-pill ${(task.status || 'Not Started').toLowerCase().replace(' ', '-')}`}
                  value={task.status || 'Not Started'}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    updateTaskStatus(task.id, newStatus);
                    if (newStatus === 'Completed') {
                      showToast(`🎉 ทำงาน "${task.title}" เสร็จสิ้นแล้ว!`, 'celebrate');
                    } else {
                      showToast(`เปลี่ยนสถานะงานเป็น "${newStatus}"`, 'info');
                    }
                  }}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}</h2>
              <button className="modal-close-btn" onClick={handleCloseModal} title="ปิด">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="task-form">
              <div className="form-group">
                <label>ชื่องาน <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="เช่น ตรวจเช็คข้อมูลประจำวัน"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>รายละเอียด</label>
                <textarea
                  rows="3"
                  placeholder="รายละเอียดเพิ่มเติมของงานนี้..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>กำหนดส่ง (Due Date)</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>สถานะ</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Not Started">Not Started (รอดำเนินการ)</option>
                    <option value="In Progress">In Progress (กำลังทำ)</option>
                    <option value="Completed">Completed (เสร็จสิ้น)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>เลือกสีงาน</label>
                <div className="color-swatches">
                  {TASK_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`color-swatch-btn ${formData.color === c.value ? "selected" : ""}`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setFormData({ ...formData, color: c.value })}
                      title={c.label}
                      aria-label={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn-submit">
                  {editingTask ? 'บันทึกการแก้ไข' : 'สร้างงานใหม่'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyTasks;
