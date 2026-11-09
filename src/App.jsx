import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import { TaskProvider } from './context/TaskContext';
import Layout from './components/Layout';
import LoginForm from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyTasks from './pages/MyTasks';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile';

function App() {
  return (
    <TaskProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<LoginForm />} />

          {/* Protected Routes with shared Sidebar Layout */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<MyTasks />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Catch-all redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </TaskProvider>
  );
}

export default App;
