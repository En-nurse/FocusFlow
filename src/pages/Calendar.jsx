import { useState } from 'react';
import { useTasks } from '../context/useTasks';
import './Calendar.css';

const getTodayDateStr = () => {
  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
};

function Calendar() {
  const { tasks, addTask, updateTaskStatus } = useTasks();

  const [todayStr] = useState(getTodayDateStr);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];

  const daysOfWeek = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

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

  // Group tasks by date
  const tasksForSelectedDate = tasks.filter((t) => t.dueDate === selectedDateStr);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addTask({
      title: newTitle,
      dueDate: selectedDateStr,
      priority: newPriority,
      status: 'Not Started',
    });

    setNewTitle('');
    setIsQuickAddOpen(false);
  };

  // Calendar cells
  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="calendar-cell empty" />);
  }

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = getFormattedDate(day);
    const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
    const isSelected = dateStr === selectedDateStr;
    const isToday = dateStr === todayStr;

    calendarCells.push(
      <div
        key={dateStr}
        className={`calendar-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
        onClick={() => setSelectedDateStr(dateStr)}
      >
        <span className="cell-day-number">{day}</span>
        {dayTasks.length > 0 && (
          <div className="cell-tasks-indicator">
            {dayTasks.slice(0, 3).map((t) => (
              <span
                key={t.id}
                className={`task-dot ${t.priority.toLowerCase()}`}
                title={`${t.title} (${t.status})`}
              />
            ))}
            {dayTasks.length > 3 && (
              <span className="task-more">+{dayTasks.length - 3}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="calendar-page">
      {/* Top Header */}
      <div className="calendar-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-desc">ปฏิทินงาน ติดตามกำหนดส่ง และวางแผนงานล่วงหน้า</p>
        </div>

        <div className="calendar-nav-controls">
          <button className="nav-btn" onClick={handlePrevMonth} title="เดือนก่อนหน้า">
            ◀
          </button>
          <span className="current-month-display">
            {monthNames[month]} {year + 543} ({year})
          </span>
          <button className="nav-btn" onClick={handleNextMonth} title="เดือนถัดไป">
            ▶
          </button>
          <button className="today-btn" onClick={handleToday}>
            วันนี้
          </button>
        </div>
      </div>

      {/* Main Layout: Calendar Grid + Selected Date Task List */}
      <div className="calendar-layout">
        {/* Calendar Grid View */}
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
        </div>

        {/* Selected Date Detail Panel */}
        <div className="calendar-detail-card">
          <div className="detail-header">
            <div>
              <h3>แผนงานประจำวันที่</h3>
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
                {selectedDateStr}
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
              <div className="quick-add-actions">
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                >
                  <option value="High">ความสำคัญ: High</option>
                  <option value="Medium">ความสำคัญ: Medium</option>
                  <option value="Low">ความสำคัญ: Low</option>
                </select>
                <button type="submit" className="save-plan-btn">บันทึก</button>
              </div>
            </form>
          )}

          {/* Tasks List for Date */}
          <div className="date-tasks-list">
            {tasksForSelectedDate.length === 0 ? (
              <div className="no-tasks-date">
                <p>ไม่มีงานที่ครบกำหนดในวันนี้</p>
                <span className="empty-sub">กดปุ่ม "+ วางแผนงาน" เพื่อเพิ่มงานในวันนี้</span>
              </div>
            ) : (
              tasksForSelectedDate.map((task) => (
                <div key={task.id} className="date-task-item">
                  <div className="date-task-left">
                    <span className={`date-priority-indicator ${task.priority.toLowerCase()}`} />
                    <div className="date-task-texts">
                      <span className={`date-task-title ${task.status === 'Completed' ? 'done' : ''}`}>
                        {task.title}
                      </span>
                      {task.description && (
                        <p className="date-task-desc">{task.description}</p>
                      )}
                    </div>
                  </div>

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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Calendar;
