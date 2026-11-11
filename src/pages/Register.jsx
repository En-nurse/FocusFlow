import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

import InputField from "../components/InputField";
import Button from "../components/Button";
import { EyeIcon, EyeOffIcon } from "../components/EyeIcons";
import { supabase } from "../lib/supabase";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // 1. ตรวจสอบความถูกต้องของ Email
    if (!email.trim()) {
      setErrorMessage("กรุณากรอกอีเมล");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }

    // 2. ตรวจสอบความยาวรหัสผ่าน (อย่างน้อย 8 ตัวอักษร)
    if (password.length < 8) {
      setErrorMessage("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }

    // 3. ตรวจสอบรหัสผ่านและยืนยันรหัสผ่านว่าตรงกันหรือไม่
    if (password !== confirmPassword) {
      setErrorMessage("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          setErrorMessage("อีเมลนี้ถูกลงทะเบียนไว้แล้ว กรุณาเข้าสู่ระบบ");
        } else if (error.message.includes("Password should be at least")) {
          setErrorMessage("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
        } else {
          setErrorMessage(error.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
        }
        return;
      }

      // จัดการกรณี Supabase ไม่คืน error แต่อีเมลเคยลงทะเบียนแล้ว (identities เป็นอาร์เรย์ว่าง)
      if (data?.user?.identities && data.user.identities.length === 0) {
        setErrorMessage("อีเมลนี้ถูกลงทะเบียนไว้แล้ว กรุณาเข้าสู่ระบบ");
        return;
      }

      // หากสมัครแล้วได้ Session ทันที (ไม่ต้องยืนยันอีเมล)
      if (data?.session) {
        navigate("/dashboard");
        return;
      }

      // หากต้องยืนยันอีเมล แจ้งให้ผู้ใช้ตรวจสอบกล่องจดหมาย
      setSuccessMessage(
        "สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ"
      );
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setErrorMessage("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h1>Register</h1>

        {errorMessage && (
          <div className="register-error-message">{errorMessage}</div>
        )}

        {successMessage && (
          <div className="register-success-message">{successMessage}</div>
        )}

        <form onSubmit={handleSubmit}>
          <InputField
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <InputField
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Create password (min. 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            rightElement={
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            }
          />

          <InputField
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            rightElement={
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                disabled={loading}
              >
                {showConfirmPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            }
          />

          <Button type="submit" disabled={loading}>
            {loading ? "กำลังสมัครสมาชิก..." : "Register"}
          </Button>
        </form>

        <div className="auth-switch-link">
          <span>Already have an account? </span>
          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
