import { useState, useMemo } from "react";
import { useTasks } from "../context/useTasks";
import { useToast } from "../context/useToast";
import { TASK_COLORS, DEFAULT_TASK_COLOR } from "../constants/taskColors";
import TaskImage from "../components/TaskImage";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "../lib/taskStorage";
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

const getTaskDateRange = (task) => {
  if (!task) return { actualStart: "", actualEnd: "" };
  const created = task.createdAt || "";
  let start = task.startDate;
  let end = task.dueDate;

  // If startDate was not provided or was saved identical to dueDate,
  // but task.createdAt exists, span from createdAt to dueDate.
  if (created && end && (!start || start === end) && created <= end) {
    start = created;
  } else if (!start) {
    start = created || end || "";
  }

  if (!end) {
    end = start || created || "";
  }

  if (!start && !end) return { actualStart: "", actualEnd: "" };

  const actualStart = start && end ? (start <= end ? start : end) : (start || end);
  const actualEnd = start && end ? (end >= start ? end : start) : (end || start);

  return { actualStart, actualEnd };
};

function Calendar() {
  const { tasks, addTask, updateTask, updateTaskStatus, deleteTask, loadingTasks } = useTasks();
  const { showToast, showConfirm } = useToast();

  const [todayStr] = useState(getTodayDateStr);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Task Modal State (Exact match with Image 2)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addImageFile, setAddImageFile] = useState(null);
  const [addFormData, setAddFormData] = useState({
    title: "",
    description: "",
    dueDate: todayStr,
    status: "Not Started",
    color: DEFAULT_TASK_COLOR,
    imageUrl: "",
  });

  const handleOpenAddModal = (dateStr) => {
    if (addFormData.imageUrl && addFormData.imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(addFormData.imageUrl);
    }
    setAddImageFile(null);
    const targetDate = dateStr || selectedDateStr || todayStr;
    setAddFormData({
      title: "",
      description: "",
      dueDate: targetDate,
      status: "Not Started",
      color: DEFAULT_TASK_COLOR,
      imageUrl: "",
    });
    setIsAddModalOpen(true);
  };

  // Edit Task State
  const [editingTask, setEditingTask] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editColor, setEditColor] = useState(DEFAULT_TASK_COLOR);
  const [editStatus, setEditStatus] = useState("Not Started");
  const [editImageUrl, setEditImageUrl] = useState("");

  const handleAddImageChange = (e) => {
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

    if (addFormData.imageUrl && addFormData.imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(addFormData.imageUrl);
    }

    setAddImageFile(file);
    const localUrl = URL.createObjectURL(file);
    setAddFormData((prev) => ({ ...prev, imageUrl: localUrl }));
    showToast("เลือกรูปภาพเรียบร้อย", "info");
  };

  const handleAddRemoveImage = () => {
    if (addFormData.imageUrl && addFormData.imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(addFormData.imageUrl);
    }
    setAddImageFile(null);
    setAddFormData((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handleEditImageChange = (e) => {
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

    if (editImageUrl && editImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(editImageUrl);
    }

    setEditImageFile(file);
    const localUrl = URL.createObjectURL(file);
    setEditImageUrl(localUrl);
    showToast("เลือกรูปภาพเรียบร้อย", "info");
  };

  const handleEditRemoveImage = () => {
    if (editImageUrl && editImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(editImageUrl);
    }
    setEditImageFile(null);
    setEditImageUrl("");
  };

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

  // Group tasks for selected date (including tasks that span across dates)
  const tasksForSelectedDate = tasks.filter((t) => {
    const { actualStart, actualEnd } = getTaskDateRange(t);
    if (!actualStart && !actualEnd) return false;
    return selectedDateStr >= actualStart && selectedDateStr <= actualEnd;
  });

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!addFormData.title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const createdDate = todayStr;
      const targetDueDate = addFormData.dueDate || selectedDateStr || todayStr;
      const startDate = createdDate <= targetDueDate ? createdDate : targetDueDate;
      const dueDate = targetDueDate >= createdDate ? targetDueDate : createdDate;

      const payload = {
        title: addFormData.title.trim(),
        description: addFormData.description.trim(),
        startDate,
        dueDate,
        priority: "Normal",
        color: addFormData.color || DEFAULT_TASK_COLOR,
        status: addFormData.status || "Not Started",
        imageUrl: addFormData.imageUrl || "",
        imageFile: addImageFile,
      };

      if (payload.imageUrl && payload.imageUrl.startsWith("blob:")) {
        delete payload.imageUrl;
      }

      await addTask(payload);

      showToast(`สร้างงานใหม่ "${addFormData.title.trim()}" สำเร็จ`, 'success');
      if (addFormData.imageUrl && addFormData.imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(addFormData.imageUrl);
      }
      setAddImageFile(null);
      setIsAddModalOpen(false);
    } catch (error) {
      showToast(error.message || 'เกิดข้อผิดพลาดในการสร้างงาน', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = (id, title) => {
    showConfirm({
      title: 'ยืนยันการลบงาน',
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบงาน "${title}" จากปฏิทิน?`,
      confirmText: 'ยืนยันการลบ',
      cancelText: 'ยกเลิก',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteTask(id);
          showToast(`ลบงาน "${title}" เรียบร้อยแล้ว`, 'info');
        } catch (error) {
          showToast(error.message || 'เกิดข้อผิดพลาดในการลบงาน', 'error');
        }
      },
    });
  };

  const handleOpenEditModal = (task) => {
    const { actualStart, actualEnd } = getTaskDateRange(task);
    if (editImageUrl && editImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(editImageUrl);
    }
    setEditImageFile(null);
    setEditingTask(task);
    setEditTitle(task.title || "");
    setEditDescription(task.description || "");
    setEditStartDate(actualStart || selectedDateStr);
    setEditDueDate(actualEnd || selectedDateStr);
    setEditColor(task.color || DEFAULT_TASK_COLOR);
    setEditStatus(task.status || "Not Started");
    setEditImageUrl(task.imageUrl || "");
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const startDate = editStartDate || selectedDateStr;
      const dueDate = editDueDate || startDate;

      const payload = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        startDate: startDate <= dueDate ? startDate : dueDate,
        dueDate: startDate <= dueDate ? dueDate : startDate,
        color: editColor,
        status: editStatus,
        imageUrl: editImageUrl || "",
        imageFile: editImageFile,
      };

      if (payload.imageUrl && payload.imageUrl.startsWith("blob:")) {
        delete payload.imageUrl;
      }

      await updateTask(editingTask.id, payload);

      showToast(`บันทึกการแก้ไข "${editTitle.trim()}" สำเร็จ`, 'info');
      if (editImageUrl && editImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(editImageUrl);
      }
      setEditImageFile(null);
      setEditingTask(null);
    } catch (error) {
      showToast(error.message || 'เกิดข้อผิดพลาดในการบันทึกการแก้ไข', 'error');
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
        const { actualStart, actualEnd } = getTaskDateRange(t);
        if (!actualStart && !actualEnd) return false;
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
            {visibleTasks.map((t) => {
              const { actualStart, actualEnd } = getTaskDateRange(t);
              const isMultiDay = actualStart && actualEnd && actualStart !== actualEnd;
              const isStartDay = dateStr === actualStart;
              const isEndDay = dateStr === actualEnd;
              return (
                <div
                  key={t.id}
                  className={`cell-task-pill status-${(t.status || "Not Started").toLowerCase().replace(" ", "-")} ${isMultiDay ? "multi-day" : ""} ${isStartDay ? "span-start" : ""} ${isEndDay ? "span-end" : ""}`}
                  style={{
                    borderLeftColor: t.color || DEFAULT_TASK_COLOR,
                    backgroundColor: t.color ? `${t.color}22` : undefined,
                  }}
                  title={`${t.title} (${actualStart === actualEnd ? actualStart : `${actualStart} ถึง ${actualEnd}`}) - ${t.status || "Not Started"}`}
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
              );
            })}

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
          <div className="calendar-tag">CALENDAR</div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-desc">
            ปฏิทินงาน ติดตามกำหนดส่งและแผนงานประจำวัน
          </p>
        </div>

        {/* Controls: Month Navigation */}
        <div className="calendar-top-actions">
          {/* Month Navigation */}
          <div className="calendar-nav-controls">
            <button
              className="nav-btn"
              onClick={handlePrevMonth}
              title="เดือนก่อนหน้า"
              aria-label="เดือนก่อนหน้า"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="current-month-display">
              {monthNames[month]} {year + 543}
            </span>
            <button
              className="nav-btn"
              onClick={handleNextMonth}
              title="เดือนถัดไป"
              aria-label="เดือนถัดไป"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <button className="today-btn" onClick={handleToday}>
              วันนี้
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Layout */}
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
              {loadingTasks && tasks.length === 0 ? (
                <div className="no-tasks-date">
                  <p>กำลังโหลดแผนงาน...</p>
                  <span className="empty-sub">
                    ระบบกำลังดึงข้อมูลจาก Supabase
                  </span>
                </div>
              ) : tasksForSelectedDate.length === 0 ? (
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

                        {(() => {
                          const { actualStart, actualEnd } = getTaskDateRange(task);
                          if (actualStart && actualEnd && actualStart !== actualEnd) {
                            return (
                              <div className="date-task-range">
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
                                  style={{
                                    marginRight: "5px",
                                    display: "inline-block",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  <rect width="18" height="18" x="3" y="4" rx="2" />
                                  <line x1="16" x2="16" y1="2" y2="6" />
                                  <line x1="8" x2="8" y1="2" y2="6" />
                                  <line x1="3" x2="21" y1="10" y2="10" />
                                </svg>
                                <span>{actualStart} ถึง {actualEnd}</span>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {task.imageUrl && (
                          <div className="calendar-task-image-wrap">
                            <TaskImage
                              src={task.imageUrl}
                              alt={task.title}
                              className="calendar-task-thumbnail"
                              onClick={(_e, url) => setSelectedPreviewImage(url || task.imageUrl)}
                              title="คลิกเพื่อดูรูปภาพขนาดเต็ม"
                            />
                          </div>
                        )}

                        <div className="timeline-card-footer">
                          <select
                            className={`date-status-select ${(task.status || "Not Started").toLowerCase().replace(" ", "-")}`}
                            value={task.status || "Not Started"}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                await updateTaskStatus(task.id, newStatus);
                                if (newStatus === "Completed") {
                                  showToast(`ทำงาน "${task.title}" เสร็จสิ้นแล้ว!`, "celebrate");
                                } else {
                                  showToast(`เปลี่ยนสถานะงานเป็น "${newStatus}"`, "info");
                                }
                              } catch (error) {
                                showToast(error.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะงาน', "error");
                              }
                            }}
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

              <div className="form-group">
                <label>แนบรูปภาพประกอบ</label>
                {addFormData.imageUrl ? (
                  <div className="task-image-preview-box">
                    <TaskImage
                      src={addFormData.imageUrl}
                      alt="Preview"
                      className="preview-image"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={handleAddRemoveImage}
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
                      onChange={handleAddImageChange}
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
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? "กำลังสร้าง..." : "สร้างงานใหม่"}
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

              <div className="form-group">
                <label>แนบรูปภาพประกอบ</label>
                {editImageUrl ? (
                  <div className="task-image-preview-box">
                    <TaskImage
                      src={editImageUrl}
                      alt="Preview"
                      className="preview-image"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={handleEditRemoveImage}
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
                      onChange={handleEditImageChange}
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
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
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

export default Calendar;
