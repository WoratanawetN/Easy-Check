import { useState, useEffect } from 'react';
import './Notification.css';
import { useAuth } from '../../context/AuthContext'
import { getNotifications, saveNotifications } from '../../utils/storage'

function Notification() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([])

  // Load notifications from storage
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = () => {
    const allNotifications = getNotifications();
    // Filter only notifications for the current user
    const myNotifications = allNotifications.filter(n => n.userId === user.id);
    setNotifications(myNotifications);
  };

  const handleDeleteNotification = (id) => {
    // 1. Get all notifications from storage
    const allNotifications = getNotifications();

    // 2. Filter out the specific ID
    const updatedGlobal = allNotifications.filter(n => n.id !== id);

    // 3. Save back to storage
    saveNotifications(updatedGlobal);

    // 4. Update UI
    loadNotifications();
  };

  const handleClearAll = () => {
    if (window.confirm('คุณต้องการลบการแจ้งเตือนทั้งหมดหรือไม่?')) {
      // 1. Get all notifications
      const allNotifications = getNotifications();

      // 2. Keep ONLY notifications that DO NOT belong to this user
      const othersNotifications = allNotifications.filter(n => n.userId !== user.id);

      // 3. Save remaining (other people's) notifications back
      saveNotifications(othersNotifications);

      // 4. Update UI
      setNotifications([]);
    }
  };

  const filteredNotifications =
    filter === 'all' ? notifications : notifications.filter(n => n.type === filter);

  // Helper to map type to icon (matching your CSS classes)
  const getIconForType = (type) => {
    switch (type) {
      case 'success': return 'bi-check-circle-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      case 'error': return 'bi-x-circle-fill';
      default: return 'bi-info-circle-fill';
    }
  }

  return (
    <div className="notification-container">
      <div className="notification-header">
        <div className="header-title">
          <i className="bi bi-bell-fill"></i>
          <h2>การแจ้งเตือน</h2>
          <span className="badge">{filteredNotifications.length}</span>
        </div>
        {notifications.length > 0 && (
          <button className="clear-all-btn" onClick={handleClearAll}>
            <i className="bi bi-trash"></i> ลบทั้งหมด
          </button>
        )}
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          ทั้งหมด
        </button>
        <button
          className={`filter-btn ${filter === 'success' ? 'active' : ''}`}
          onClick={() => setFilter('success')}
        >
          <i className="bi bi-check-circle"></i> สำเร็จ
        </button>
        <button
          className={`filter-btn ${filter === 'warning' ? 'active' : ''}`}
          onClick={() => setFilter('warning')}
        >
          <i className="bi bi-exclamation-triangle"></i> เตือน
        </button>
        <button
          className={`filter-btn ${filter === 'error' ? 'active' : ''}`}
          onClick={() => setFilter('error')}
        >
          <i className="bi bi-x-circle"></i> ข้อผิดพลาด
        </button>
      </div>

      <div className="notification-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-inbox"></i>
            <p>ไม่มีการแจ้งเตือน</p>
            <span>คุณได้ตรวจสอบการแจ้งเตือนทั้งหมดแล้ว</span>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div key={notification.id} className={`notification-item notification-${notification.type}`}>
              <div className="notification-icon">
                {/* Dynamically get icon based on type */}
                <i className={`bi ${getIconForType(notification.type)}`}></i>
              </div>
              <div className="notification-content">
                <div className="notification-title">{notification.title}</div>
                <div className="notification-message">{notification.message}</div>
                <div className="notification-time">{notification.timestamp}</div>
              </div>
              <button
                className="notification-close"
                onClick={() => handleDeleteNotification(notification.id)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notification;