import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Layout.css';

function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main-viewport">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;

