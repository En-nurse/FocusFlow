import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTasks } from "../context/useTasks";
import { useToast } from "../context/useToast";
import "./Sidebar.css";
import defaultAvatar from "../assets/default-avatar.svg";
import { supabase } from "../lib/supabase";

function Sidebar() {
  const navigate = useNavigate();
  const { user, tasks, updateUser } = useTasks();
  const { showToast, showConfirm } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  // ซิงค์อีเมลของผู้ใช้จาก Supabase Auth session เข้าสู่ TaskContext
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser?.email && user.email !== authUser.email) {
        updateUser({ email: authUser.email });
      }
    });
  }, [user.email, updateUser]);

  const handleLogout = () => {
    if (loggingOut) return;
    showConfirm({
      title: 'ออกจากระบบ',
      message: 'คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ FocusFlow?',
      confirmText: 'ออกจากระบบ',
      cancelText: 'ยกเลิก',
      type: 'danger',
      onConfirm: async () => {
        setLoggingOut(true);
        try {
          const { error } = await supabase.auth.signOut();
          if (error) {
            showToast("เกิดข้อผิดพลาดในการออกจากระบบ: " + error.message, 'error');
            return;
          }
          showToast("ออกจากระบบสำเร็จ 👋", 'info');
          navigate("/login", { replace: true });
        } catch {
          showToast("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง", 'error');
        } finally {
          setLoggingOut(false);
        }
      },
    });
  };

  const pendingTasksCount = tasks.filter(
    (t) => t.status !== "Completed",
  ).length;

  const navItems = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="7" height="9" x="3" y="3" rx="1.5" />
          <rect width="7" height="5" x="14" y="3" rx="1.5" />
          <rect width="7" height="9" x="14" y="12" rx="1.5" />
          <rect width="7" height="5" x="3" y="16" rx="1.5" />
        </svg>
      ),
    },
    {
      to: "/tasks",
      label: "My Tasks",
      badge: pendingTasksCount > 0 ? pendingTasksCount : null,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 11 3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
    {
      to: "/calendar",
      label: "Calendar",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
        </svg>
      ),
    },
    {
      to: "/profile",
      label: "Profile",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="5" />
          <path d="M20 21a8 8 0 0 0-16 0" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-glow">
          <div className="brand-logo-icon">
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
              <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
        </div>
        <div className="brand-text">
          <div className="brand-title-row">
            <h2>FocusFlow</h2>
          </div>
          <span>Task & Flow Manager</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">MENU</div>
        <ul>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <span className="link-icon">{item.icon}</span>
                <span className="link-label">{item.label}</span>
                {item.badge !== undefined && item.badge !== null && (
                  <span className="nav-badge-pill">{item.badge}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile Footer */}
      <div className="sidebar-footer">
        <div
          className="user-profile-preview"
          onClick={() => navigate("/profile")}
          title="คลิกเพื่อดูโปรไฟล์"
        >
          <div className="user-avatar-frame">
            <img
              src={user.avatarUrl || defaultAvatar}
              alt="Avatar"
              className="sidebar-avatar-img"
            />
            <span className="avatar-online-dot" />
          </div>
          <div className="user-info">
            <span className="user-name">{user.name || "ผู้ใช้งาน"}</span>
            <span className="user-email">
              {user.email || ""}
            </span>
          </div>
        </div>

        <button
          className="sidebar-logout-btn"
          onClick={handleLogout}
          disabled={loggingOut}
          title="ออกจากระบบ"
        >
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
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          <span>{loggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
