import { useState } from 'react';
import { useTasks } from '../context/useTasks';
import './Calendar.css';

const getTodayDateStr = () => {
  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
};

function Calendar() {
  const { tasks, addTask, updateTaskStatus, deleteTask } = useTasks();

  const [todayStr] = useState(getTodayDateStr);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newTime, setNewTime] = useState('');

  // View Mode: 'calendar' (มุมมองปฏิทิน) or 'timeline' (มุมมองไทม์ไลน์)
  const [viewMode, setViewMode] = useState('calendar');

  // Filter in Timeline View
  const [timelineStatusFilter, setTimelineStatusFilter] = useState('All');
  const [timelinePriorityFilter, setTimelinePriorityFilter] = useState('All');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];

  const daysOfWeek = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const fullDaysOfWeek = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

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
    const pad = (n) => String(n).padStart(2, '0');
    setSelectedDateStr(`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`);
  };

  const getFormattedDate = (dayNumber) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(dayNumber).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Group tasks for selected date
  const tasksForSelectedDate = tasks.filter((t) => t.dueDate === selectedDateStr);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addTask({
      title: newTitle.trim(),
      description: newTime ? `เวลา: ${newTime}` : '',
      dueDate: selectedDateStr,
      priority: newPriority,
      status: 'Not Started',
    });

    setNewTitle('');
    setNewTime('');
    setIsQuickAddOpen(false);
  };

  const handleDeleteTask = (id, title) => {
    if (window.confirm(`คุณต้องการลบงาน "${title}" หรือไม่?`)) {
      deleteTask(id);
    }
  };

  // Tasks in current month
  const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const tasksInCurrentMonth = tasks.filter(
    (t) => t.dueDate && t.dueDate.startsWith(currentMonthPrefix)
  );

  // Filtered tasks for timeline
  const filteredTimelineTasks = tasksInCurrentMonth.filter((t) => {
    const matchStatus =
      timelineStatusFilter === 'All' || t.status === timelineStatusFilter;
    const matchPriority =
      timelinePriorityFilter === 'All' || t.priority === timelinePriorityFilter;
    return matchStatus && matchPriority;
  });

  // Calendar cells generation with stacked tasks
  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="calendar-cell empty" />);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = getFormattedDate(day);
    const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
    const isSelected = dateStr === selectedDateStr;
    const isToday = dateStr === todayStr;

    // Show up to 2 stacked task bars directly inside the cell
    const maxVisiblePills = 2;
    const visibleTasks = dayTasks.slice(0, maxVisiblePills);
    const hiddenCount = dayTasks.length - maxVisiblePills;

    calendarCells.push(
      <div
        key={dateStr}
        className={`calendar-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${dayTasks.length > 0 ? 'has-tasks' : ''}`}
        onClick={() => setSelectedDateStr(dateStr)}
      >
        <div className="cell-top-row">
          <span className="cell-day-number">{day}</span>
          {isToday && <span className="cell-today-pill">วันนี้</span>}
          {dayTasks.length > 0 && (
            <span className="cell-task-counter" title={`${dayTasks.length} งาน`}>
              {dayTasks.length}
            </span>
          )}
        </div>

        {/* Stacked Task Bars Inside Cell */}
        <div className="cell-tasks-stack">
          {visibleTasks.map((t) => (
            <div
              key={t.id}
              className={`cell-task-pill priority-${t.priority.toLowerCase()} status-${t.status.toLowerCase().replace(' ', '-')}`}
              title={`${t.title} (${t.priority} - ${t.status})`}
            >
              <span className="pill-dot" />
              <span className="pill-title">{t.title}</span>
            </div>
          ))}

          {hiddenCount > 0 && (
            <div className="cell-more-badge">
              +{hiddenCount} งานเพิ่มเติม
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-page">
      {/* Top Header */}
      <div className="calendar-header">
        <div>
          <h1 className="page-title">Calendar & Timeline</h1>
          <p className="page-desc">
            ปฏิทินงานและไทม์ไลน์ ติดตามกำหนดส่ง ซ้อนงานหลายรายการได้อย่างเป็นระเบียบ
          </p>
        </div>

        {/* Controls: View Mode Switcher + Month Navigation */}
        <div className="calendar-top-actions">
          {/* View Mode Switcher */}
          <div className="view-mode-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
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
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              <span>ปฏิทิน</span>
            </button>

            <button
              className={`view-toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
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
            <button className="nav-btn" onClick={handlePrevMonth} title="เดือนก่อนหน้า">
              ◀
            </button>
            <span className="current-month-display">
              {monthNames[month]} {year + 543}
            </span>
            <button className="nav-btn" onClick={handleNextMonth} title="เดือนถัดไป">
              ▶
            </button>
            <button className="today-btn" onClick={handleToday}>
              วันนี้
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: CALENDAR GRID VIEW */}
      {viewMode === 'calendar' && (
        <div className="calendar-layout">
          {/* Calendar Grid Card */}
          <div className="calendar-grid-card">
            <div className="weekdays-row">
              {daysOfWeek.map((d, i) => (
                <div key={i} className={`weekday-label ${i === 0 || i === 6 ? 'weekend' : ''}`}>
                  {d}
                </div>
              ))}
            </div>

            <div className="calendar-cells-grid">
              {calendarCells}
            </div>

            <div className="calendar-legend">
              <span className="legend-item">
                <span className="legend-dot high" /> High
              </span>
              <span className="legend-item">
                <span className="legend-dot medium" /> Medium
              </span>
              <span className="legend-item">
                <span className="legend-dot low" /> Low
              </span>
              <span className="legend-hint">*คลิกวันที่เพื่อดูและจัดการงานที่ซ้อนกันทั้งหมด</span>
            </div>
          </div>

          {/* Selected Date Detail Panel (Day Timeline) */}
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
                    style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <path d="M3 10h18" />
                  </svg>
                  {selectedDateStr} ({tasksForSelectedDate.length} รายการ)
                </p>
              </div>
              <button
                className="quick-plan-btn"
                onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
              >
                {isQuickAddOpen ? '✕ ปิด' : '+ วางแผนงาน'}
              </button>
            </div>

            {/* Quick Add Form */}
            {isQuickAddOpen && (
              <form onSubmit={handleQuickAdd} className="quick-add-form">
                <input
                  type="text"
                  placeholder="ใส่งานที่ต้องการวางแผน..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  required
                />
                <div className="quick-add-row">
                  <input
                    type="text"
                    placeholder="ช่วงเวลา (เช่น 09:00 - 11:00)"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="time-input"
                  />
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                  >
                    <option value="High">ความสำคัญ: High</option>
                    <option value="Medium">ความสำคัญ: Medium</option>
                    <option value="Low">ความสำคัญ: Low</option>
                  </select>
                </div>
                <button type="submit" className="save-plan-btn">
                  บันทึกลงไทม์ไลน์
                </button>
              </form>
            )}

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
                  <span className="empty-sub">กดปุ่ม "+ วางแผนงาน" เพื่อเพิ่มงานลงในวันนี้</span>
                </div>
              ) : (
                <div className="timeline-rail-container">
                  {tasksForSelectedDate.map((task, idx) => (
                    <div key={task.id} className="timeline-rail-item">
                      <div className="timeline-node-column">
                        <span className={`timeline-node-bullet ${task.priority.toLowerCase()}`} />
                        {idx !== tasksForSelectedDate.length - 1 && (
                          <span className="timeline-connector-line" />
                        )}
                      </div>

                      <div className="timeline-item-card">
                        <div className="timeline-card-header">
                          <span className={`date-task-title ${task.status === 'Completed' ? 'done' : ''}`}>
                            {task.title}
                          </span>
                          <button
                            type="button"
                            className="task-delete-mini-btn"
                            onClick={() => handleDeleteTask(task.id, task.title)}
                            title="ลบงานนี้"
                          >
                            ✕
                          </button>
                        </div>

                        {task.description && (
                          <p className="date-task-desc">{task.description}</p>
                        )}

                        <div className="timeline-card-footer">
                          <span className={`task-priority-chip ${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>

                          <select
                            className={`date-status-select ${task.status.toLowerCase().replace(' ', '-')}`}
                            value={task.status}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
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

      {/* VIEW MODE 2: TIMELINE VIEW (STACKED HORIZONTAL & MULTI-ROW GANTT) */}
      {viewMode === 'timeline' && (
        <div className="timeline-view-wrapper">
          {/* Timeline Toolbar & Filter */}
          <div className="timeline-toolbar">
            <div className="timeline-metrics">
              <span className="metric-chip total">
                งานทั้งหมดในเดือนนี้: <strong>{tasksInCurrentMonth.length}</strong>
              </span>
              <span className="metric-chip notstarted">
                รอดำเนินการ: <strong>{tasksInCurrentMonth.filter((t) => t.status === 'Not Started').length}</strong>
              </span>
              <span className="metric-chip inprogress">
                กำลังทำ: <strong>{tasksInCurrentMonth.filter((t) => t.status === 'In Progress').length}</strong>
              </span>
              <span className="metric-chip completed">
                เสร็จสิ้น: <strong>{tasksInCurrentMonth.filter((t) => t.status === 'Completed').length}</strong>
              </span>
            </div>

            {/* Filter pills */}
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

              <div className="filter-group">
                <label>ความสำคัญ:</label>
                <select
                  value={timelinePriorityFilter}
                  onChange={(e) => setTimelinePriorityFilter(e.target.value)}
                >
                  <option value="All">ทั้งหมด</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Timeline Track Grid */}
          <div className="timeline-track-card">
            <div className="timeline-track-header-row">
              <h3>ไทม์ไลน์รายวัน ({monthNames[month]} {year + 543})</h3>
              <span className="timeline-hint">เลื่อนซ้าย-ขวาเพื่อดูวันและงานที่ซ้อนกันในแต่ละวัน</span>
            </div>

            <div className="timeline-days-scroll-area">
              <div className="timeline-days-columns">
                {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
                  const dateStr = getFormattedDate(day);
                  const dayTasks = filteredTimelineTasks.filter((t) => t.dueDate === dateStr);
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDateStr;
                  const dayOfWeekIndex = new Date(year, month, day).getDay();
                  const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6;

                  return (
                    <div
                      key={dateStr}
                      className={`timeline-day-column ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isWeekend ? 'weekend' : ''}`}
                    >
                      {/* Column Header */}
                      <div
                        className="day-column-header"
                        onClick={() => setSelectedDateStr(dateStr)}
                      >
                        <span className="day-name">{fullDaysOfWeek[dayOfWeekIndex].slice(0, 2)}</span>
                        <span className="day-number">{day}</span>
                        {isToday && <span className="today-tag">วันนี้</span>}
                        <button
                          type="button"
                          className="quick-column-add"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateStr(dateStr);
                            setIsQuickAddOpen(true);
                            setViewMode('calendar');
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
                              className={`timeline-task-card priority-${task.priority.toLowerCase()} status-${task.status.toLowerCase().replace(' ', '-')}`}
                              title={`${task.title} - ${task.status}`}
                            >
                              <div className="card-top">
                                <span className="task-title-clamp">{task.title}</span>
                                <button
                                  type="button"
                                  className="timeline-delete-btn"
                                  onClick={() => handleDeleteTask(task.id, task.title)}
                                  title="ลบงานนี้"
                                >
                                  ✕
                                </button>
                              </div>

                              {task.description && (
                                <span className="card-desc-clamp">{task.description}</span>
                              )}

                              <div className="card-actions-row">
                                <span className={`task-badge ${task.priority.toLowerCase()}`}>
                                  {task.priority}
                                </span>
                                <select
                                  className={`timeline-status-badge ${task.status.toLowerCase().replace(' ', '-')}`}
                                  value={task.status}
                                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                >
                                  <option value="Not Started">รอดำเนินการ</option>
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
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;
