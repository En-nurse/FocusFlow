import { useState } from "react";
import { Link } from "react-router-dom";
import { useTasks } from "../context/useTasks";
import { useToast } from "../context/useToast";
import { TASK_COLORS, DEFAULT_TASK_COLOR } from "../constants/taskColors";
import TaskImage from "../components/TaskImage";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "../lib/taskStorage";
import "./Dashboard.css";

function Dashboard() {
  const { tasks, user, addTask, updateTask, updateTaskStatus, loadingTasks } = useTasks();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "Normal",
    color: DEFAULT_TASK_COLOR,
    status: "Not Started",
    imageUrl: "",
  });

  const handleOpenAddModal = () => {
    setImageFile(null);
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      dueDate: "",
      priority: "Normal",
      color: DEFAULT_TASK_COLOR,
      status: "Not Started",
      imageUrl: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setImageFile(null);
    setEditingTask(task);
    setFormData({
      title: task.title || "",
      description: task.description || "",
      dueDate: task.dueDate || "",
      priority: task.priority || "Normal",
      color: task.color || DEFAULT_TASK_COLOR,
      status: task.status || "Not Started",
      imageUrl: task.imageUrl || "",
    });
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showToast("รองรับเฉพาะไฟล์รูปภาพ JPG, PNG และ WebP เท่านั้น", "error");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      showToast("ขนาดไฟล์รูปภาพต้องไม่เกิน 2MB", "error");
      return;
    }

    if (formData.imageUrl && formData.imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(formData.imageUrl);
    }

    setImageFile(file);
    const localUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, imageUrl: localUrl }));
    showToast("เลือกรูปภาพเรียบร้อย", "info");
  };

  const handleRemoveImage = () => {
    if (formData.imageUrl && formData.imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(formData.imageUrl);
    }
    setImageFile(null);
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handleCloseModal = () => {
    if (formData.imageUrl && formData.imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(formData.imageUrl);
    }
    setImageFile(null);
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        imageFile,
      };

      if (payload.imageUrl && payload.imageUrl.startsWith("blob:")) {
        delete payload.imageUrl;
      }

      if (editingTask) {
        await updateTask(editingTask.id, payload);
        showToast(`บันทึกการแก้ไข "${formData.title}" เรียบร้อย`, 'info');
      } else {
        await addTask(payload);
        showToast(`สร้างงานใหม่ "${formData.title}" สำเร็จ`, 'success');
      }
      handleCloseModal();
    } catch (error) {
      showToast(error.message || 'เกิดข้อผิดพลาดในการบันทึกงาน', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTaskStatus = async (task) => {
    const isCompleted = (task.status || "Not Started") === "Completed";
    const nextStatus = isCompleted ? "In Progress" : "Completed";
    try {
      await updateTaskStatus(task.id, nextStatus);
      if (!isCompleted) {
        showToast(`ทำงาน "${task.title}" เสร็จสิ้นแล้ว`, "celebrate");
      } else {
        showToast(`สลับสถานะ "${task.title}" กลับเป็นกำลังทำ`, "info");
      }
    } catch (error) {
      showToast(error.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ', "error");
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const inProgressTasks = tasks.filter(
    (t) => t.status === "In Progress",
  ).length;
  const notStartedTasks = tasks.filter(
    (t) => t.status === "Not Started",
  ).length;

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Time-based greeting (pure state init)
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    return hour < 12
      ? "สวัสดีตอนเช้า"
      : hour < 17
        ? "สวัสดีตอนบ่าย"
        : "สวัสดีตอนเย็น";
  });

  // Weekly Activity (Mon - Sun)
  const daysOfWeek = [
    { day: "จ.", label: "จันทร์", dayIndex: 1 },
    { day: "อ.", label: "อังคาร", dayIndex: 2 },
    { day: "พ.", label: "พุธ", dayIndex: 3 },
    { day: "พฤ.", label: "พฤหัสฯ", dayIndex: 4 },
    { day: "ศ.", label: "ศุกร์", dayIndex: 5 },
    { day: "ส.", label: "เสาร์", dayIndex: 6 },
    { day: "อา.", label: "อาทิตย์", dayIndex: 0 },
  ];

  const countsByDay = [0, 0, 0, 0, 0, 0, 0];
  tasks.forEach((t) => {
    if (t.dueDate) {
      const d = new Date(t.dueDate + "T00:00:00");
      if (!isNaN(d.getTime())) {
        countsByDay[d.getDay()] += 1;
      }
    }
  });

  const maxCount = Math.max(...countsByDay, 1);

  const weeklyData = daysOfWeek.map((item) => {
    const count = countsByDay[item.dayIndex];
    const height =
      count > 0 ? `${Math.round((count / maxCount) * 100)}%` : "10%";
    return {
      ...item,
      count,
      height,
    };
  });

  const mostActiveDay = weeklyData.reduce(
    (max, cur) => (cur.count > max.count ? cur : max),
    { label: "-", count: 0 },
  );

  const recentTasks = tasks.slice(0, 5);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return <span className="status-pill completed">สำเร็จ</span>;
      case "In Progress":
        return <span className="status-pill inprogress">กำลังทำ</span>;
      case "Not Started":
        return <span className="status-pill notstarted">รอดำเนินการ</span>;
      default:
        return <span className="status-pill">{status}</span>;
    }
  };

  return (
    <div className="dashboard-page">
      {/* Top Welcome Header */}
      <div className="dashboard-topbar">
        <div className="topbar-welcome">
          <div className="welcome-tag">DAILY OVERVIEW</div>
          <h1 className="page-title">
            {greeting},{" "}
            <span className="gradient-text">{user.name || "ผู้ใช้งาน"}</span>
          </h1>
          <p className="page-desc">
            {totalTasks > 0
              ? `คุณมีงานค้างอยู่ ${totalTasks - completedTasks} รายการ และทำเสร็จแล้ว ${completedTasks} รายการ`
              : "เริ่มต้นวางแผนงานของคุณให้มีประสิทธิภาพได้ที่นี่"}
          </p>
        </div>

        <div className="topbar-actions">
          <button className="add-task-btn" onClick={handleOpenAddModal}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            <span>เพิ่มงานใหม่</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="stats-row">
        {/* Total Tasks */}
        <div className="stat-card total-card">
          <div className="stat-header">
            <span className="stat-label">Total Tasks</span>
            <div className="stat-icon blue">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 12h6" />
                <path d="M9 16h6" />
                <path d="M9 8h6" />
              </svg>
            </div>
          </div>
          <div className="stat-number">{totalTasks}</div>
          <div className="stat-footer">
            <span className="stat-caption">งานทั้งหมดที่คุณสร้างในระบบ</span>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="stat-card completed-card">
          <div className="stat-header">
            <span className="stat-label">Completed</span>
            <div className="stat-icon green">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <div className="stat-number-row">
            <span className="stat-number">{completedTasks}</span>
            <span className="completion-badge">{completionRate}%</span>
          </div>
          <div className="stat-progress-bar">
            <div
              className="stat-progress-fill"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* In Progress */}
        <div className="stat-card progress-card">
          <div className="stat-header">
            <span className="stat-label">In Progress</span>
            <div className="stat-icon amber">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="stat-number">{inProgressTasks}</div>
          <div className="stat-footer">
            <span className="stat-caption inprogress-text">
              ● กำลังดำเนินการอยู่
            </span>
          </div>
        </div>

        {/* Not Started */}
        <div className="stat-card pending-card">
          <div className="stat-header">
            <span className="stat-label">Not Started</span>
            <div className="stat-icon slate">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            </div>
          </div>
          <div className="stat-number">{notStartedTasks}</div>
          <div className="stat-footer">
            <span className="stat-caption">งานที่รอดำเนินการ</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Weekly Chart & Recent Tasks */}
      <div className="dashboard-grid">
        {/* Weekly Activity Chart */}
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <div>
              <div className="card-tag">ANALYTICS</div>
              <h3>Weekly Activity</h3>
              <p>ปริมาณงานตามกำหนดส่งในสัปดาห์นี้</p>
            </div>
            <span className="badge-pill">7 วันล่าสุด</span>
          </div>

          <div className="chart-canvas">
            <div className="chart-grid-lines">
              <span className="grid-line" />
              <span className="grid-line" />
              <span className="grid-line" />
            </div>

            <div className="chart-bars-container">
              {weeklyData.map((item, idx) => (
                <div key={idx} className="chart-col">
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${item.count > 0 ? "active" : ""}`}
                      style={{ height: item.height }}
                      title={`${item.label}: ${item.count} งาน`}
                    >
                      {item.count > 0 && (
                        <span className="bar-tooltip">{item.count}</span>
                      )}
                    </div>
                  </div>
                  <span className="bar-label">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-legend-box">
            <div className="legend-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                <path d="M9 18h6" />
                <path d="M10 22h4" />
              </svg>
            </div>
            <div className="legend-text">
              {mostActiveDay.count > 0 ? (
                <span>
                  วันที่มีงานกำหนดส่งมากที่สุดคือ{" "}
                  <strong>
                    วัน{mostActiveDay.label} ({mostActiveDay.count} งาน)
                  </strong>
                </span>
              ) : (
                <span>
                  ยังไม่มีงานกำหนดส่งในสัปดาห์นี้ เริ่มสร้างงานได้ที่ปุ่ม{" "}
                  <strong>เพิ่มงานใหม่</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="dashboard-card recent-tasks-card">
          <div className="card-header">
            <div>
              <div className="card-tag">RECENT</div>
              <h3>Recent Tasks</h3>
              <p>งานล่าสุดที่คุณสร้างหรืออัปเดต</p>
            </div>
            <Link to="/tasks" className="card-link-action">
              <span>จัดการทั้งหมด</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="recent-tasks-list">
            {loadingTasks && tasks.length === 0 ? (
              <div className="empty-tasks-box">
                <h4>กำลังโหลดข้อมูล...</h4>
                <p>ระบบกำลังดึงข้อมูลงานจาก Supabase</p>
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="empty-tasks-box">
                <div className="empty-tasks-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M9 12h6" />
                    <path d="M12 9v6" />
                  </svg>
                </div>
                <h4>ยังไม่มีรายการงานในระบบ</h4>
                <p>สร้างงานแรกของคุณเพื่อติดตามความคืบหน้าอย่างเป็นระบบ</p>
                <button
                  type="button"
                  className="empty-cta-btn"
                  onClick={handleOpenAddModal}
                >
                  + สร้างงานใหม่
                </button>
              </div>
            ) : (
              recentTasks.map((task) => {
                const isCompleted = task.status === "Completed";
                return (
                  <div
                    key={task.id}
                    className={`recent-task-row ${isCompleted ? "is-completed" : ""}`}
                    style={{
                      borderLeft: `3px solid ${isCompleted ? "#10b981" : (task.color || DEFAULT_TASK_COLOR)}`,
                    }}
                  >
                    <div className="task-row-info">
                      <div className="task-row-title-line">
                        <button
                          type="button"
                          className={`task-quick-check-btn ${isCompleted ? "checked" : ""}`}
                          onClick={() => handleToggleTaskStatus(task)}
                          title={
                            isCompleted
                              ? "ทำเครื่องหมายว่ายังไม่เสร็จ"
                              : "ทำเครื่องหมายว่าเสร็จสิ้น"
                          }
                          aria-label={
                            isCompleted
                              ? "ทำเครื่องหมายว่ายังไม่เสร็จ"
                              : "ทำเครื่องหมายว่าเสร็จสิ้น"
                          }
                        >
                          {isCompleted && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="11"
                              height="11"
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
                        <span
                          className="task-color-dot"
                          style={{
                            backgroundColor: task.color || DEFAULT_TASK_COLOR,
                          }}
                        />
                        <span className={`task-row-title ${isCompleted ? "done" : ""}`}>
                          {task.title}
                        </span>
                      </div>
                      <span className="task-row-due">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect width="18" height="18" x="3" y="4" rx="2" />
                          <path d="M3 10h18" />
                        </svg>
                        {task.dueDate || "ไม่ระบุกำหนดส่ง"}
                      </span>

                      {task.imageUrl && (
                        <div className="recent-task-image-wrap">
                          <TaskImage
                            src={task.imageUrl}
                            alt={task.title}
                            className="recent-task-thumbnail"
                            onClick={(_e, url) => setSelectedPreviewImage(url || task.imageUrl)}
                            title="คลิกเพื่อดูรูปภาพขนาดเต็ม"
                          />
                        </div>
                      )}
                    </div>

                  <div className="task-row-badges">
                    <button
                      type="button"
                      className="task-row-edit-btn"
                      onClick={() => handleOpenEditModal(task)}
                      title="แก้ไขงานนี้"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>
                    {getStatusBadge(task.status)}
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? "แก้ไขงาน" : "เพิ่มงานใหม่"}</h2>
              <button
                className="modal-close-btn"
                onClick={handleCloseModal}
                title="ปิด"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="task-form">
              <div className="form-group">
                <label>
                  ชื่องาน <span className="req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น ตรวจเช็คข้อมูลประจำวัน"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>แนบรูปภาพประกอบ</label>
                {formData.imageUrl ? (
                  <div className="task-image-preview-box">
                    <TaskImage
                      src={formData.imageUrl}
                      alt="Preview"
                      className="preview-image"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={handleRemoveImage}
                      title="ลบรูปภาพ"
                    >
                      ✕ ลบรูปภาพ
                    </button>
                  </div>
                ) : (
                  <label className="image-upload-dropzone">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                    <span>คลิกเพื่อแนบรูปภาพ (PNG, JPG, WebP ไม่เกิน 2MB)</span>
                  </label>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>กำหนดส่ง (Due Date)</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>สถานะ</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
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
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? "กำลังบันทึก..." : (editingTask ? "บันทึกการแก้ไข" : "สร้างงานใหม่")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {selectedPreviewImage && (
        <div
          className="image-lightbox-backdrop"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div
            className="image-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={() => setSelectedPreviewImage(null)}
              title="ปิด"
            >
              ✕
            </button>
            <TaskImage
              src={selectedPreviewImage}
              alt="Full Preview"
              className="lightbox-image"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
