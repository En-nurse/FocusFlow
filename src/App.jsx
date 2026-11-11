import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import { TaskProvider } from './context/TaskContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import LoginForm from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyTasks from './pages/MyTasks';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile';

function App() {
  return (
    <TaskProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes (สิทธิ์ผู้ใช้ทั่วไป: หากล็อกอินแล้วจะ Redirect ไปยัง /dashboard) */}
          <Route element={<PublicRoute />}>
            <Route path="/" element={<LoginForm />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Routes (ต้องล็อกอินก่อนเข้าถึง: หากยังไม่ล็อกอินจะ Redirect ไปยัง /login) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<MyTasks />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Catch-all redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </TaskProvider>
  );
}

export default App;
