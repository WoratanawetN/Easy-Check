import { useState } from 'react';
import './Setting.css';

function Setting() {
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
    darkMode: false,
    language: 'th',
    theme: 'orange'
  });

  const [savedMessage, setSavedMessage] = useState(false);

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="setting-container">
      <div className="setting-header">
        <i className="bi bi-gear-fill"></i>
        <h2>การตั้งค่า</h2>
      </div>

      {savedMessage && (
        <div className="alert alert-success">
          <i className="bi bi-check-circle"></i> บันทึกการตั้งค่าสำเร็จ
        </div>
      )}

      <div className="setting-section">
        <h3 className="section-title">
          <i className="bi bi-bell"></i> การแจ้งเตือน
        </h3>

        <div className="setting-item">
          <div className="setting-label">
            <span>เปิดใช้งานการแจ้งเตือน</span>
            <p className="setting-desc">รับการแจ้งเตือนจากระบบ</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={() => handleToggle('notifications')}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <span>การแจ้งเตือนทางอีเมล</span>
            <p className="setting-desc">รับการแจ้งเตือนไปที่อีเมล</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={() => handleToggle('emailNotifications')}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <span>การแจ้งเตือนทาง SMS</span>
            <p className="setting-desc">รับการแจ้งเตือนทาง SMS</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.smsNotifications}
              onChange={() => handleToggle('smsNotifications')}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="setting-section">
        <h3 className="section-title">
          <i className="bi bi-palette"></i> การแสดงผล
        </h3>

        <div className="setting-item">
          <div className="setting-label">
            <span>ภาษา</span>
            <p className="setting-desc">เลือกภาษาที่ต้องการใช้</p>
          </div>
          <select
            className="setting-select"
            value={settings.language}
            onChange={(e) => handleChange('language', e.target.value)}
          >
            <option value="th">ไทย</option>
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <span>ธีมสี</span>
            <p className="setting-desc">เลือกธีมสีที่ชื่นชอบ</p>
          </div>
          <select
            className="setting-select"
            value={settings.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
          >
            <option value="orange">สีส้ม</option>
            <option value="blue">สีน้ำเงิน</option>
            <option value="green">สีเขียว</option>
            <option value="purple">สีม่วง</option>
          </select>
        </div>

        <div className="setting-item">
          <div className="setting-label">
            <span>โหมดมืด</span>
            <p className="setting-desc">เปิดใช้งานโหมดมืด</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={() => handleToggle('darkMode')}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="setting-section">
        <h3 className="section-title">
          <i className="bi bi-info-circle"></i> เกี่ยวกับแอปพลิเคชัน
        </h3>
        <div className="about-info">
          <p><strong>Easy Check</strong></p>
          <p>เวอร์ชัน: 1.0.0</p>
          <p>ระบบจัดการเวลาเข้า-ออกงานอัจฉริยะ</p>
        </div>
      </div>

      <button className="save-btn" onClick={handleSave}>
        <i className="bi bi-check-lg"></i>
        บันทึกการตั้งค่า
      </button>
    </div>
  );
}

export default Setting;
