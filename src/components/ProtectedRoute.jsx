import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./ProtectedRoute.css";

function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // 1. ตรวจสอบ Session เริ่มต้นจาก Supabase
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (isMounted) {
        setSession(initialSession);
        setLoading(false);
      }
    });

    // 2. ติดตามการเปลี่ยนแปลงสถานะ Authentication (Login / Logout / Token Refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (isMounted) {
        setSession(currentSession);
        setLoading(false);
      }
    });

    // ยกเลิก Subscription เมื่อ Component ถูกถอดออก (Unmount)
    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // แสดงหน้าจอ Loading ขณะกำลังตรวจสอบ Session เพื่อป้องกัน Flash ของเนื้อหา
  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
        <span>กำลังตรวจสอบการเข้าสู่ระบบ...</span>
      </div>
    );
  }

  // หากไม่มี Session ให้ Redirect ไปหน้า /login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // หากมี Session ให้อนุญาตเข้าถึงเนื้อหา (รองรับทั้ง children และ Outlet)
  return children ? children : <Outlet />;
}

export default ProtectedRoute;
