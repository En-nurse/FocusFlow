import { useState, useEffect } from 'react';
import { TaskContext } from './taskContextDef';

const DEFAULT_USER = {
  name: 'ผู้ใช้งาน',
  email: 'nurse@gmail.com',
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

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('app_my_profile');
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

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
    } catch (e) {
      console.error('Failed to save user to localStorage', e);
    }
  }, [user]);

  const addTask = (newTask) => {
    const task = {
      ...newTask,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
      status: newTask.status || 'Not Started',
      priority: newTask.priority || 'Medium',
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
