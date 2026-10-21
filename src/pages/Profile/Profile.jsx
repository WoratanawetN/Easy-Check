// Profile.jsx
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogOut, User, Building, Hash } from 'lucide-react'
import './Profile.css'

function Profile() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        if (window.confirm('คุณแน่ใจที่จะออกจากระบบหรือไม่?')) {
            logout()
            navigate('/login')
        }
    }

    const getRoleLabel = (role) => {
        const labels = {
            employee: 'พนักงาน',
            admin: 'ผู้ดูแลระบบ',
            superadmin: 'ผู้ดูแลระบบสูงสุด'
        }
        return labels[role] || role
    }

    return (
        <div className="profile-container">
            {/* Avatar Section */}
            <div className="profile-avatar-wrapper">
                {/* If you have an image URL, use <img /> here, otherwise use Icon */}
                <User size={48} />
            </div>

            <h2 className="profile-name">{user?.name || 'พนักงาน'}</h2>
            <span className="profile-role-badge">{getRoleLabel(user?.role)}</span>

            {/* Details Card */}
            <div className="profile-details-card">
                <div className="detail-item">
                    <span className="detail-label"><Building size={16} style={{ display: 'inline', marginRight: '8px' }} /> แผนก</span>
                    <span className="detail-value">{user?.department || '-'}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label"><Hash size={16} style={{ display: 'inline', marginRight: '8px' }} /> รหัสพนักงาน</span>
                    <span className="detail-value">{user?.id || '-'}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">เข้าสู่ระบบเมื่อ</span>
                    <span className="detail-value">
                        {user?.loginTime ? new Date(user.loginTime).toLocaleString('th-TH') : '-'}
                    </span>
                </div>
            </div>

            {/* Logout Button */}
            <button className="btn-logout" onClick={handleLogout}>
                <LogOut size={20} /> ออกจากระบบ
            </button>
        </div>
    )
}

export default Profile