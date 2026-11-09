import { useState } from 'react';
import { useTasks } from '../context/useTasks';
import './MyTasks.css';

function MyTasks() {
  const { tasks, addTask, updateTask, deleteTask, updateTaskStatus } = useTasks();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium',
    status: 'Not Started',
  });

  const [todayStr] = useState(() => new Date().toISOString().split('T')[0]);

  const handleOpenAddModal = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      dueDate: todayStr,
      priority: 'Medium',
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
      priority: task.priority || 'Medium',
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
    } else {
      addTask(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบงาน "${title}"?`)) {
      deleteTask(id);
    }
  };

  // Status counts
  const totalCount = tasks.length;
  const notStartedCount = tasks.filter((t) => t.status === 'Not Started').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;

  // Filter & Search logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === 'All' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
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
          <p className="page-desc">จัดการรายการงาน กำหนดส่ง และระดับความสำคัญอย่างมืออาชีพ</p>
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

        <div className="filters-group">
          <div className="priority-filter-wrapper">
            <label>ความสำคัญ:</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="All">ทุกระดับ</option>
              <option value="High">High (สูง)</option>
              <option value="Medium">Medium (กลาง)</option>
              <option value="Low">Low (ต่ำ)</option>
            </select>
          </div>
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
            <p>ลองปรับคำค้นหา หรือกดปุ่ม "+ เพิ่มงานใหม่" เพื่อสร้างรายการ</p>
            <button className="empty-add-btn" onClick={handleOpenAddModal}>+ สร้างงานใหม่</button>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`task-card priority-${task.priority.toLowerCase()} ${task.status === 'Completed' ? 'is-completed' : ''}`}
            >
              <div className="task-card-header">
                <div className="task-badges">
                  <span className={`priority-tag ${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
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

              <h3 className="task-card-title">{task.title}</h3>
              {task.description && (
                <p className="task-card-desc">{task.description}</p>
              )}

              <div className="task-card-footer">
                <span className="status-label">สถานะ:</span>
                <select
                  className={`status-select-pill ${task.status.toLowerCase().replace(' ', '-')}`}
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
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
                  <label>ระดับความสำคัญ</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="High">High (สูง)</option>
                    <option value="Medium">Medium (กลาง)</option>
                    <option value="Low">Low (ต่ำ)</option>
                  </select>
                </div>
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
