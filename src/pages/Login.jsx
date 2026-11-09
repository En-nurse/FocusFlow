import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

import InputField from '../components/InputField';
import Button from '../components/Button';
import { EyeIcon, EyeOffIcon } from '../components/EyeIcons';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (email === 'nurse@gmail.com' && password === '1234') {
      navigate('/dashboard', { state: { email } });
    } else {
      alert('Email หรือ Password ไม่ถูกต้อง');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Login</h1>

        <form onSubmit={handleSubmit}>
          <InputField
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <InputField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            rightElement={
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            }
          />

          <Button type="submit">Login</Button>

          <p className="login-hint">nurse@gmail.com/1234</p>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
