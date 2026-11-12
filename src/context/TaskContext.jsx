import { useState, useEffect } from 'react';
import { TaskContext } from './taskContextDef';
import { DEFAULT_TASK_COLOR } from '../constants/taskColors';
import { supabase } from '../lib/supabase';

const DEFAULT_USER = {
  name: 'ผู้ใช้งาน',
  email: '',
  phone: '',
  bio: '',
  avatarUrl: '',
};

export function TaskProvider({ children }) {
  // เริ่มต้นด้วยข้อมูลว่างจริงของผู้ใช้ ไม่ใช้ข้อมูลจำลอง
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('app_my_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentUserId, setCurrentUserId] = useState(null);

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('app_my_profile');
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  // ซิงค์โปรไฟล์แยกตามบัญชีผู้ใช้ Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const authUser = session.user;
        setCurrentUserId(authUser.id);
        const userProfileKey = `app_my_profile_${authUser.id}`;
        try {
          const saved = localStorage.getItem(userProfileKey);
          if (saved) {
            setUser(JSON.parse(saved));
          } else {
            // บัญชีที่เพิ่งสมัครใหม่ - กำหนดโปรไฟล์เริ่มต้นที่ไม่มีรูปภาพเก่าค้าง
            const newProfile = {
              name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'ผู้ใช้งาน',
              email: authUser.email || '',
              phone: '',
              bio: '',
              avatarUrl: '',
            };
            setUser(newProfile);
            localStorage.setItem(userProfileKey, JSON.stringify(newProfile));
          }
        } catch {
          // ignore error
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const authUser = session.user;
        setCurrentUserId(authUser.id);
        const userProfileKey = `app_my_profile_${authUser.id}`;
        try {
          const saved = localStorage.getItem(userProfileKey);
          if (saved) {
            setUser(JSON.parse(saved));
          } else {
            const newProfile = {
              name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'ผู้ใช้งาน',
              email: authUser.email || '',
              phone: '',
              bio: '',
              avatarUrl: '',
            };
            setUser(newProfile);
            localStorage.setItem(userProfileKey, JSON.stringify(newProfile));
          }
        } catch {
          // ignore error
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUserId(null);
        setUser(DEFAULT_USER);
        localStorage.removeItem('app_my_profile');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('app_my_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('app_my_profile', JSON.stringify(user));
      if (currentUserId) {
        localStorage.setItem(`app_my_profile_${currentUserId}`, JSON.stringify(user));
      }
    } catch (e) {
      console.error('Failed to save user to localStorage', e);
    }
  }, [user, currentUserId]);

  const addTask = (newTask) => {
    const task = {
      ...newTask,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
      status: newTask.status || 'Not Started',
      priority: newTask.priority || 'Medium',
      color: newTask.color || DEFAULT_TASK_COLOR,
    };
    setTasks((prev) => [task, ...prev]);
  };

  const updateTask = (id, updatedFields) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updatedFields } : task))
    );
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const updateTaskStatus = (id, newStatus) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, status: newStatus } : task))
    );
  };

  const updateUser = (updatedProfile) => {
    setUser((prev) => ({ ...prev, ...updatedProfile }));
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        user,
        addTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
        updateUser,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}
