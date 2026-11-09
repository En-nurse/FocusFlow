import { useState } from "react";
import { Link } from "react-router-dom";
import { useTasks } from "../context/useTasks";
import "./Dashboard.css";

function Dashboard() {
  const { tasks, user, addTask } = useTasks();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "Medium",
    status: "Not Started",
  });

  const handleOpenAddModal = () => {
    setFormData({
      title: "",
      description: "",
      dueDate: "",
      priority: "Medium",
      status: "Not Started",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    addTask(formData);
    handleCloseModal();
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

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "High":
        return <span className="priority-pill high">● High</span>;
      case "Medium":
        return <span className="priority-pill medium">● Medium</span>;
      case "Low":
        return <span className="priority-pill low">● Low</span>;
      default:
        return <span className="priority-pill">{priority}</span>;
    }
  };

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
            <div className="legend-icon">💡</div>
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
            {recentTasks.length === 0 ? (
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
              recentTasks.map((task) => (
                <div key={task.id} className="recent-task-row">
                  <div className="task-row-info">
                    <span className="task-row-title">{task.title}</span>
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
                  </div>

                  <div className="task-row-badges">
                    {getPriorityBadge(task.priority)}
                    {getStatusBadge(task.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>เพิ่มงานใหม่</h2>
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
                  <label>ระดับความสำคัญ</label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
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
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="Not Started">Not Started (รอดำเนินการ)</option>
                  <option value="In Progress">In Progress (กำลังทำ)</option>
                  <option value="Completed">Completed (เสร็จสิ้น)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn-submit">
                  สร้างงานใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
