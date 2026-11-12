import { useState, useMemo } from "react";
import { useTasks } from "../context/useTasks";
import { useToast } from "../context/useToast";
import { TASK_COLORS, DEFAULT_TASK_COLOR } from "../constants/taskColors";
import "./Calendar.css";

const getTodayDateStr = () => {
  const today = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
};

const monthNames = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const daysOfWeek = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const fullDaysOfWeek = [
  "อาทิตย์",
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัสบดี",
  "ศุกร์",
  "เสาร์",
];

function Calendar() {
  const { tasks, addTask, updateTask, updateTaskStatus, deleteTask } = useTasks();
  const { showToast, showConfirm } = useToast();

  const [todayStr] = useState(getTodayDateStr);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);

  // View Mode: 'calendar' (มุมมองปฏิทิน) or 'timeline' (มุมมองไทม์ไลน์)
  const [viewMode, setViewMode] = useState("calendar");

  // Add Task Modal State (Exact match with Image 2)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    title: "",
    description: "",
    dueDate: todayStr,
    status: "Not Started",
    color: DEFAULT_TASK_COLOR,
  });

  const handleOpenAddModal = (dateStr) => {
    const targetDate = dateStr || selectedDateStr || todayStr;
    setAddFormData({
      title: "",
      description: "",
      dueDate: targetDate,
      status: "Not Started",
      color: DEFAULT_TASK_COLOR,
    });
    setIsAddModalOpen(true);
  };

  // Edit Task State
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editColor, setEditColor] = useState(DEFAULT_TASK_COLOR);
  const [editStatus, setEditStatus] = useState("Not Started");

  // Filter in Timeline View
  const [timelineStatusFilter, setTimelineStatusFilter] = useState("All");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month calculation
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    const pad = (n) => String(n).padStart(2, "0");
    setSelectedDateStr(
      `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
    );
  };

  const getFormattedDate = (dayNumber) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(dayNumber).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  // Group tasks for selected date (including tasks that span across dates)
  const tasksForSelectedDate = tasks.filter((t) => {
    const start = t.startDate || t.dueDate;
    const end = t.dueDate || t.startDate;
    if (!start && !end) return false;
    const actualStart = start || end;
    const actualEnd = end || start;
    return selectedDateStr >= actualStart && selectedDateStr <= actualEnd;
  });

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!addFormData.title.trim()) return;

    addTask({
      title: addFormData.title.trim(),
      description: addFormData.description.trim(),
      dueDate: addFormData.dueDate || selectedDateStr,
      startDate: addFormData.dueDate || selectedDateStr,
      priority: "Normal",
      color: addFormData.color || DEFAULT_TASK_COLOR,
      status: addFormData.status || "Not Started",
    });

    showToast(`สร้างงานใหม่ "${addFormData.title.trim()}" สำเร็จ ✨`, 'success');
    setIsAddModalOpen(false);
  };

  const handleDeleteTask = (id, title) => {
    showConfirm({
      title: 'ยืนยันการลบงาน',
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบงาน "${title}" จากปฏิทิน?`,
      confirmText: 'ยืนยันการลบ',
      cancelText: 'ยกเลิก',
      type: 'danger',
      onConfirm: () => {
        deleteTask(id);
        showToast(`ลบงาน "${title}" เรียบร้อยแล้ว 🗑️`, 'info');
      },
    });
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setEditTitle(task.title || "");
    setEditDescription(task.description || "");
    setEditStartDate(task.startDate || task.dueDate || selectedDateStr);
    setEditDueDate(task.dueDate || task.startDate || selectedDateStr);
    setEditColor(task.color || DEFAULT_TASK_COLOR);
    setEditStatus(task.status || "Not Started");
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    const startDate = editStartDate || selectedDateStr;
    const dueDate = editDueDate || startDate;

    updateTask(editingTask.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      startDate: startDate <= dueDate ? startDate : dueDate,
      dueDate: startDate <= dueDate ? dueDate : startDate,
      color: editColor,
      status: editStatus,
    });

    showToast(`บันทึกการแก้ไข "${editTitle.trim()}" แล้ว ✏️`, 'info');
    setEditingTask(null);
  };

  const handleToggleTaskStatus = (task) => {
    const isCompleted = (task.status || "Not Started") === "Completed";
    const nextStatus = isCompleted ? "In Progress" : "Completed";
    updateTaskStatus(task.id, nextStatus);
    if (!isCompleted) {
      showToast(`🎉 ทำงาน "${task.title}" เสร็จสิ้นแล้ว!`, "celebrate");
    } else {
      showToast(`สลับสถานะ "${task.title}" กลับเป็นกำลังทำ`, "info");
    }
  };

  // Tasks in current month
  const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const tasksInCurrentMonth = tasks.filter((t) => {
    const start = t.startDate || t.dueDate;
    const end = t.dueDate || t.startDate;
    return (
      (start && start.startsWith(currentMonthPrefix)) ||
      (end && end.startsWith(currentMonthPrefix))
    );
  });

  // Filtered tasks for timeline
  const filteredTimelineTasks = tasksInCurrentMonth.filter((t) => {
    return timelineStatusFilter === "All" || t.status === timelineStatusFilter;
  });

  // Metrics for current month
  const totalMonthTasks = tasksInCurrentMonth.length;
  const notStartedMonthTasks = tasksInCurrentMonth.filter(
    (t) => t.status === "Not Started",
  ).length;
  const inProgressMonthTasks = tasksInCurrentMonth.filter(
    (t) => t.status === "In Progress",
  ).length;
  const completedMonthTasks = tasksInCurrentMonth.filter(
    (t) => t.status === "Completed",
  ).length;

  // Calendar cells generation with stacked task bars
  const calendarCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty" />);
    }

    const m = String(month + 1).padStart(2, "0");

    for (let day = 1; day <= totalDays; day++) {
      const d = String(day).padStart(2, "0");
      const dateStr = `${year}-${m}-${d}`;
      const dayTasks = tasks.filter((t) => {
        const start = t.startDate || t.dueDate;
        const end = t.dueDate || t.startDate;
        const actualStart = start || end;
        const actualEnd = end || start;
        return dateStr >= actualStart && dateStr <= actualEnd;
      });

      const isSelected = dateStr === selectedDateStr;
      const isToday = dateStr === todayStr;

      // Show up to 2 stacked task bars directly inside the cell
      const maxVisiblePills = 2;
      const visibleTasks = dayTasks.slice(0, maxVisiblePills);
      const hiddenCount = dayTasks.length - maxVisiblePills;

      cells.push(
        <div
          key={dateStr}
          className={`calendar-cell ${isSelected ? "selected" : ""} ${isToday ? "today" : ""} ${dayTasks.length > 0 ? "has-tasks" : ""}`}
          onClick={() => setSelectedDateStr(dateStr)}
        >
          <div className="cell-top-row">
            <span className="cell-day-number">{day}</span>
            {dayTasks.length > 0 && (
              <span
                className="cell-task-counter"
                title={`${dayTasks.length} งานในวันนี้`}
              >
                {dayTasks.length}
              </span>
            )}
          </div>

          {/* Stacked Task Bars Inside Cell */}
          <div className="cell-tasks-stack">
            {visibleTasks.map((t) => (
              <div
                key={t.id}
                className={`cell-task-pill status-${(t.status || "Not Started").toLowerCase().replace(" ", "-")}`}
                style={{
                  borderLeftColor: t.color || DEFAULT_TASK_COLOR,
                  backgroundColor: t.color ? `${t.color}22` : undefined,
                }}
                title={`${t.title} (${t.status || "Not Started"})`}
              >
                <span
                  className="pill-dot"
                  style={{
                    backgroundColor: t.color || DEFAULT_TASK_COLOR,
                    boxShadow: `0 0 6px ${t.color || DEFAULT_TASK_COLOR}`,
                  }}
                />
                <span className="pill-title">{t.title}</span>
              </div>
            ))}

            {hiddenCount > 0 && (
              <div className="cell-more-badge">+{hiddenCount} งานเพิ่มเติม</div>
            )}
          </div>
        </div>,
      );
    }
    return cells;
  }, [firstDayIndex, totalDays, year, month, tasks, selectedDateStr, todayStr]);

  return (
    <div className="calendar-page">
      {/* Top Header */}
      <div className="calendar-header">
        <div>
          <div className="calendar-tag">CALENDAR & TIMELINE</div>
          <h1 className="page-title">Calendar & Timeline</h1>
          <p className="page-desc">
            ปฏิทินงานและไทม์ไลน์ ติดตามกำหนดส่ง
            และซ้อนงานหลายรายการได้อย่างเป็นระเบียบ
          </p>
        </div>

        {/* Controls: View Mode Switcher + Month Navigation */}
        <div className="calendar-top-actions">
          {/* View Mode Switcher */}
          <div className="view-mode-toggle">
            <button
              className={`view-toggle-btn ${viewMode === "calendar" ? "active" : ""}`}
              onClick={() => setViewMode("calendar")}
              title="มุมมองปฏิทินรายเดือน"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              <span>ปฏิทิน</span>
            </button>

            <button
              className={`view-toggle-btn ${viewMode === "timeline" ? "active" : ""}`}
              onClick={() => setViewMode("timeline")}
              title="มุมมองไทม์ไลน์รายวัน/เดือน"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" x2="4" y1="3" y2="21" />
                <rect width="8" height="4" x="7" y="5" rx="1" />
                <rect width="10" height="4" x="9" y="11" rx="1" />
                <rect width="7" height="4" x="12" y="17" rx="1" />
              </svg>
              <span>ไทม์ไลน์</span>
            </button>
          </div>

          {/* Month Navigation */}
          <div className="calendar-nav-controls">
            <button
              className="nav-btn"
              onClick={handlePrevMonth}
              title="เดือนก่อนหน้า"
            >
              ◀
            </button>
            <span className="current-month-display">
              {monthNames[month]} {year + 543}
            </span>
            <button
              className="nav-btn"
              onClick={handleNextMonth}
              title="เดือนถัดไป"
            >
              ▶
            </button>
            <button className="today-btn" onClick={handleToday}>
              วันนี้
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: CALENDAR VIEW */}
      {viewMode === "calendar" && (
        <div className="calendar-layout">
          {/* Calendar Grid Card */}
          <div className="calendar-grid-card">
            <div className="weekdays-row">
              {daysOfWeek.map((d, i) => (
                <div
                  key={i}
                  className={`weekday-label ${i === 0 || i === 6 ? "weekend" : ""}`}
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="calendar-cells-grid">{calendarCells}</div>

            <div className="calendar-legend">
              <span className="legend-hint">
                *คลิกวันที่เพื่อดูและจัดการงานทั้งหมดที่ซ้อนอยู่
              </span>
            </div>
          </div>

          {/* Selected Date Detail Panel (Day Schedule & Vertical Timeline) */}
          <div className="calendar-detail-card">
            <div className="detail-header">
              <div>
                <div className="detail-tag">DAY SCHEDULE</div>
                <h3>แผนงานประจำวัน</h3>
                <p className="selected-date-text">
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
                    style={{
                      display: "inline-block",
                      verticalAlign: "middle",
                      marginRight: "6px",
                    }}
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <path d="M3 10h18" />
                  </svg>
                  {selectedDateStr} ({tasksForSelectedDate.length} รายการ)
                </p>
              </div>
              <button
                type="button"
                className="quick-plan-btn"
                onClick={() => handleOpenAddModal(selectedDateStr)}
              >
                + วางแผนงาน
              </button>
            </div>

            {/* Tasks List for Date (Vertical Timeline Rail) */}
            <div className="date-tasks-list">
              {tasksForSelectedDate.length === 0 ? (
                <div className="no-tasks-date">
                  <div className="no-tasks-icon-box">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="18" x="3" y="4" rx="2" />
                      <path d="M16 2v4" />
                      <path d="M8 2v4" />
                      <path d="M3 10h18" />
                    </svg>
                  </div>
                  <p>ไม่มีงานที่ครบกำหนดในวันนี้</p>
                  <span className="empty-sub">
                    กดปุ่ม "+ วางแผนงาน" เพื่อเพิ่มงานลงในวันนี้
                  </span>
                </div>
              ) : (
                <div className="timeline-rail-container">
                  {tasksForSelectedDate.map((task, idx) => (
                    <div key={task.id} className="timeline-rail-item">
                      <div className="timeline-node-column">
                        <span
                          className="timeline-node-bullet"
                          style={{
                            backgroundColor: task.color || DEFAULT_TASK_COLOR,
                            boxShadow: `0 0 8px ${task.color ? task.color + '99' : 'rgba(56, 189, 248, 0.6)'}`,
                          }}
                        />
                        {idx !== tasksForSelectedDate.length - 1 && (
                          <span className="timeline-connector-line" />
                        )}
                      </div>

                      <div
                        className={`timeline-item-card ${(task.status || "Not Started") === "Completed" ? "is-completed" : ""}`}
                        style={{
                          borderLeft:
                            (task.status || "Not Started") === "Completed"
                              ? "3px solid #10b981"
                              : `3px solid ${task.color || DEFAULT_TASK_COLOR}`,
                        }}
                      >
                        <div className="timeline-card-header">
                          <div className="timeline-card-title-line">
                            <button
                              type="button"
                              className={`task-quick-check-btn ${(task.status || "Not Started") === "Completed" ? "checked" : ""}`}
                              onClick={() => handleToggleTaskStatus(task)}
                              title={
                                (task.status || "Not Started") === "Completed"
                                  ? "ทำเครื่องหมายว่ายังไม่เสร็จ"
                                  : "คลิกเพื่อจบงานทันที"
                              }
                              aria-label={
                                (task.status || "Not Started") === "Completed"
                                  ? "ทำเครื่องหมายว่ายังไม่เสร็จ"
                                  : "คลิกเพื่อจบงานทันที"
                              }
                            >
                              {(task.status || "Not Started") === "Completed" && (
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
                              className={`date-task-title ${(task.status || "Not Started") === "Completed" ? "done" : ""}`}
                            >
                              {task.title}
                            </span>
                          </div>
                          <div className="task-card-mini-actions">
                            <button
                              type="button"
                              className="task-action-mini-btn edit-btn"
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
                            <button
                              type="button"
                              className="task-action-mini-btn delete-btn"
                              onClick={() =>
                                handleDeleteTask(task.id, task.title)
                              }
                              title="ลบงานนี้"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {task.description && (
                          <p className="date-task-desc">{task.description}</p>
                        )}

                        {task.startDate &&
                          task.dueDate &&
                          task.startDate !== task.dueDate && (
                            <div className="date-task-range">
                              📅 {task.startDate} ถึง {task.dueDate}
                            </div>
                          )}

                        <div className="timeline-card-footer">
                          <select
                            className={`date-status-select ${(task.status || "Not Started").toLowerCase().replace(" ", "-")}`}
                            value={task.status || "Not Started"}
                            onChange={(e) =>
                              updateTaskStatus(task.id, e.target.value)
                            }
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: TIMELINE VIEW (STACKED MULTI-ROW GANTT BOARD) */}
      {viewMode === "timeline" && (
        <div className="timeline-view-wrapper">
          {/* Timeline Toolbar & Metrics */}
          <div className="timeline-toolbar">
            <div className="timeline-metrics">
              <span className="metric-chip total">
                งานทั้งหมดในเดือนนี้: <strong>{totalMonthTasks}</strong>
              </span>
              <span className="metric-chip notstarted">
                รอดำเนินการ: <strong>{notStartedMonthTasks}</strong>
              </span>
              <span className="metric-chip inprogress">
                กำลังทำ: <strong>{inProgressMonthTasks}</strong>
              </span>
              <span className="metric-chip completed">
                เสร็จสิ้น: <strong>{completedMonthTasks}</strong>
              </span>
            </div>

            {/* Filter Dropdowns */}
            <div className="timeline-filters">
              <div className="filter-group">
                <label>สถานะ:</label>
                <select
                  value={timelineStatusFilter}
                  onChange={(e) => setTimelineStatusFilter(e.target.value)}
                >
                  <option value="All">ทั้งหมด</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Timeline Track Card */}
          <div className="timeline-track-card">
            <div className="timeline-track-header-row">
              <div>
                <h3>
                  ไทม์ไลน์รายวัน ({monthNames[month]} {year + 543})
                </h3>
                <p className="timeline-subtitle">
                  งานจะซ้อนกันในแต่ละวัน
                  สามารถเลื่อนดูความคืบหน้าแบบพาโนรามาได้ตลอดทั้งเดือน
                </p>
              </div>
              <span className="timeline-hint">
                เลื่อนซ้าย-ขวาเพื่อดูกำหนดการ
              </span>
            </div>

            <div className="timeline-days-scroll-area">
              <div className="timeline-days-columns">
                {Array.from({ length: totalDays }, (_, i) => i + 1).map(
                  (day) => {
                    const dateStr = getFormattedDate(day);
                    const dayTasks = filteredTimelineTasks.filter((t) => {
                      const start = t.startDate || t.dueDate;
                      const end = t.dueDate || t.startDate;
                      const actualStart = start || end;
                      const actualEnd = end || start;
                      return dateStr >= actualStart && dateStr <= actualEnd;
                    });

                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === selectedDateStr;
                    const dayOfWeekIndex = new Date(year, month, day).getDay();
                    const isWeekend =
                      dayOfWeekIndex === 0 || dayOfWeekIndex === 6;

                    return (
                      <div
                        key={dateStr}
                        className={`timeline-day-column ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${isWeekend ? "weekend" : ""}`}
                      >
                        {/* Column Header */}
                        <div
                          className="day-column-header"
                          onClick={() => setSelectedDateStr(dateStr)}
                        >
                          <span className="day-name">
                            {fullDaysOfWeek[dayOfWeekIndex].slice(0, 2)}
                          </span>
                          <span className="day-number">{day}</span>
                          <button
                            type="button"
                            className="quick-column-add"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAddModal(dateStr);
                            }}
                            title={`เพิ่มงานในวันที่ ${day}`}
                          >
                            +
                          </button>
                        </div>

                        {/* Stacked Task Lane */}
                        <div className="day-tasks-lane">
                          {dayTasks.length === 0 ? (
                            <div className="lane-empty-placeholder">-</div>
                          ) : (
                            dayTasks.map((task) => (
                              <div
                                key={task.id}
                                className={`timeline-task-card status-${(task.status || "Not Started").toLowerCase().replace(" ", "-")} ${(task.status || "Not Started") === "Completed" ? "is-completed" : ""}`}
                                style={{
                                  borderLeft:
                                    (task.status || "Not Started") === "Completed"
                                      ? "3px solid #10b981"
                                      : `3px solid ${task.color || DEFAULT_TASK_COLOR}`,
                                }}
                                title={`${task.title} - ${task.status || "Not Started"}`}
                              >
                                <div className="card-top">
                                  <div className="timeline-task-title-line">
                                    <button
                                      type="button"
                                      className={`task-quick-check-btn ${(task.status || "Not Started") === "Completed" ? "checked" : ""}`}
                                      onClick={() => handleToggleTaskStatus(task)}
                                      title={
                                        (task.status || "Not Started") === "Completed"
                                          ? "ทำเครื่องหมายว่ายังไม่เสร็จ"
                                          : "คลิกเพื่อจบงานทันที"
                                      }
                                      aria-label={
                                        (task.status || "Not Started") === "Completed"
                                          ? "ทำเครื่องหมายว่ายังไม่เสร็จ"
                                          : "คลิกเพื่อจบงานทันที"
                                      }
                                    >
                                      {(task.status || "Not Started") === "Completed" && (
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="10"
                                          height="10"
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
                                      className={`task-title-clamp ${(task.status || "Not Started") === "Completed" ? "done" : ""}`}
                                    >
                                      {task.title}
                                    </span>
                                  </div>
                                  <div className="timeline-card-actions">
                                    <button
                                      type="button"
                                      className="timeline-mini-btn edit-btn"
                                      onClick={() => handleOpenEditModal(task)}
                                      title="แก้ไขงานนี้"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="11"
                                        height="11"
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
                                    <button
                                      type="button"
                                      className="timeline-mini-btn delete-btn"
                                      onClick={() =>
                                        handleDeleteTask(task.id, task.title)
                                      }
                                      title="ลบงานนี้"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>

                                {task.description && (
                                  <span className="card-desc-clamp">
                                    {task.description}
                                  </span>
                                )}

                                <div className="card-actions-row">
                                  <select
                                    className={`timeline-status-badge ${(task.status || "Not Started").toLowerCase().replace(" ", "-")}`}
                                    value={task.status || "Not Started"}
                                    onChange={(e) =>
                                      updateTaskStatus(task.id, e.target.value)
                                    }
                                  >
                                    <option value="Not Started">
                                      รอดำเนินการ
                                    </option>
                                    <option value="In Progress">กำลังทำ</option>
                                    <option value="Completed">เสร็จสิ้น</option>
                                  </select>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal (Image 2) */}
      {isAddModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>เพิ่มงานใหม่</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
                title="ปิด"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="task-form">
              <div className="form-group">
                <label>
                  ชื่องาน <span className="req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น ตรวจเช็คข้อมูลประจำวัน"
                  value={addFormData.title}
                  onChange={(e) =>
                    setAddFormData({ ...addFormData, title: e.target.value })
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
                  value={addFormData.description}
                  onChange={(e) =>
                    setAddFormData({
                      ...addFormData,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>กำหนดส่ง (Due Date)</label>
                  <input
                    type="date"
                    value={addFormData.dueDate}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        dueDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>สถานะ</label>
                  <select
                    value={addFormData.status}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        status: e.target.value,
                      })
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
                      className={`color-swatch-btn ${addFormData.color === c.value ? "selected" : ""}`}
                      style={{ backgroundColor: c.value }}
                      onClick={() =>
                        setAddFormData({ ...addFormData, color: c.value })
                      }
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
                  onClick={() => setIsAddModalOpen(false)}
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

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="modal-backdrop" onClick={() => setEditingTask(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>แก้ไขงาน</h2>
              <button
                className="modal-close-btn"
                onClick={() => setEditingTask(null)}
                title="ปิด"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="task-form">
              <div className="form-group">
                <label>
                  ชื่องาน <span className="req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น ตรวจเช็คข้อมูลประจำวัน"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>รายละเอียด / เวลา</label>
                <textarea
                  rows="3"
                  placeholder="รายละเอียดเพิ่มเติม หรือระบุเวลา..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>วันเริ่มต้น</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>กำหนดส่ง (Due Date)</label>
                  <input
                    type="date"
                    value={editDueDate}
                    min={editStartDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>สถานะ</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="Not Started">Not Started (รอดำเนินการ)</option>
                  <option value="In Progress">In Progress (กำลังทำ)</option>
                  <option value="Completed">Completed (เสร็จสิ้น)</option>
                </select>
              </div>

              <div className="form-group">
                <label>เลือกสีงาน</label>
                <div className="color-swatches">
                  {TASK_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`color-swatch-btn ${editColor === c.value ? "selected" : ""}`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setEditColor(c.value)}
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
                  onClick={() => setEditingTask(null)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn-submit">
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;
