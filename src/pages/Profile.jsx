import { useState, useRef } from 'react';
import { useTasks } from '../context/useTasks';
import { useToast } from '../context/useToast';
import './Profile.css';
import defaultAvatar from '../assets/default-avatar.svg';

function Profile() {
  const { user, updateUser } = useTasks();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    bio: user.bio || '',
  });

  const [avatar, setAvatar] = useState(user.avatarUrl || defaultAvatar);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        updateUser({ avatarUrl: reader.result });
        showToast('อัปโหลดรูปโปรไฟล์ใหม่เรียบร้อย 📷', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar(defaultAvatar);
    updateUser({ avatarUrl: '' });
    showToast('รีเซ็ตรูปโปรไฟล์กลับเป็นค่าเริ่มต้นแล้ว', 'info');
  };

  const handleSubmitProfile = (e) => {
    e.preventDefault();
    updateUser({ ...formData, avatarUrl: avatar });
    setSaveSuccess(true);
    showToast('บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว ✅', 'success');
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-desc">จัดการข้อมูลส่วนตัว</p>
      </div>

      {saveSuccess && (
        <div className="alert-success">
          บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว!
        </div>
      )}

      <div className="profile-grid">
        {/* Left Column: User Summary Card */}
        <div className="profile-card user-summary-card">
          <div
            className="summary-avatar-wrapper"
            onClick={() => fileInputRef.current?.click()}
            title="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
          >
            <img src={avatar} alt="Profile" className="summary-avatar-img" />
            <div className="avatar-edit-overlay">
              <span>เปลี่ยนรูป</span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          {user.avatarUrl && (
            <button
              type="button"
              className="remove-avatar-btn"
              onClick={handleRemoveAvatar}
              title="รีเซ็ตกลับเป็นรูปเริ่มต้น"
            >
              รีเซ็ตรูปภาพเริ่มต้น
            </button>
          )}

          <h2 className="summary-name">{formData.name}</h2>

          <div className="summary-divider" />

          <div className="summary-meta-list">
            <div className="meta-item">
              <span className="meta-label">อีเมล</span>
              <span className="meta-value">{formData.email}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">เบอร์โทรศัพท์</span>
              <span className="meta-value">{formData.phone}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">สถานะบัญชี</span>
              <span className="meta-value status-active">● ใช้งานอยู่ (Active)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="profile-main-column">
          <div className="profile-card">
            <div className="card-title-bar">
              <h3>แก้ไขข้อมูลส่วนตัว</h3>
            </div>

            <form onSubmit={handleSubmitProfile} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>อีเมล</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>ข้อความแนะนำตัว (Bio)</label>
                <textarea
                  rows="3"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>

              <div className="form-submit-row">
                <button type="submit" className="save-profile-btn">
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
