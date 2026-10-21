import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { Send, Users, Bell, AlertCircle, CheckCircle, Info, User } from 'lucide-react'
import { getUsers, addNotification } from '../../../utils/storage'
import './SendNotifications.css'

function SendNotifications() {
    const [allUsers, setAllUsers] = useState([])

    const [notificationForm, setNotificationForm] = useState({
        title: '',
        message: '',
        recipient: 'all', // 'all' or 'individual'
        targetUserId: '', // For individual selection
        type: 'info'
    })

    // Load history
    const [sentHistory, setSentHistory] = useState(() => {
        const saved = localStorage.getItem('admin_sent_history')
        return saved ? JSON.parse(saved) : []
    })

    // Load Users on Mount
    useEffect(() => {
        const users = getUsers() || []
        setAllUsers(users)
    }, [])

    // Save history whenever it changes
    useEffect(() => {
        localStorage.setItem('admin_sent_history', JSON.stringify(sentHistory))
    }, [sentHistory])

    const handleSubmit = (e) => {
        e.preventDefault()

        // Validation
        if (!notificationForm.title || !notificationForm.message) {
            Swal.fire({
                icon: 'error',
                title: 'ข้อมูลไม่ครบ',
                text: 'กรุณากรอกหัวข้อและข้อความ'
            })
            return
        }

        if (notificationForm.recipient === 'individual' && !notificationForm.targetUserId) {
            Swal.fire({
                icon: 'error',
                title: 'ระบุผู้รับ',
                text: 'กรุณาเลือกผู้ใช้งานที่ต้องการส่งถึง'
            })
            return
        }

        // Determine Label for Confirmation
        let targetLabel = 'ทุกคน'
        if (notificationForm.recipient === 'individual') {
            const selectedUser = allUsers.find(u => u.id === notificationForm.targetUserId)
            targetLabel = selectedUser ? `${selectedUser.name} (${selectedUser.id})` : 'ไม่ระบุ'
        }

        Swal.fire({
            title: 'ยืนยันการส่ง?',
            text: `คุณต้องการส่งข้อความถึง "${targetLabel}" ใช่หรือไม่?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#d33',
            confirmButtonText: 'ใช่, ส่งเลย',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                processSending(targetLabel)
            }
        })
    }

    const processSending = (targetLabelName) => {
        // 1. Filter targets
        let targetUsers = []
        if (notificationForm.recipient === 'all') {
            targetUsers = allUsers.filter(u => u.role === 'employee')
        } else if (notificationForm.recipient === 'individual') {
            targetUsers = allUsers.filter(u => u.id === notificationForm.targetUserId)
        }

        // 2. Send Notification
        let count = 0
        targetUsers.forEach(user => {
            addNotification(
                user.id,
                notificationForm.type,
                notificationForm.title,
                notificationForm.message
            )
            count++
        })

        // 3. Update History
        const newHistoryItem = {
            id: Date.now(),
            title: notificationForm.title,
            message: notificationForm.message,
            type: notificationForm.type,
            recipientLabel: targetLabelName, // Save the calculated name
            recipientCount: count,
            sentTime: new Date().toLocaleString('th-TH')
        }
        setSentHistory([newHistoryItem, ...sentHistory])

        // 4. Reset Form
        setNotificationForm({
            title: '',
            message: '',
            recipient: 'all',
            targetUserId: '',
            type: 'info'
        })

        Swal.fire({
            icon: 'success',
            title: 'ส่งเรียบร้อย!',
            text: `ส่งการแจ้งเตือนไปยัง ${count} บัญชีผู้ใช้`
        })
    }

    return (
        <div className="send-notifications-container">
            <div className="page-header">
                <div className="header-icon">
                    <Bell size={32} />
                </div>
                <div>
                    <h2>ส่งการแจ้งเตือน</h2>
                    <p>ส่งข้อความประกาศถึงพนักงาน</p>
                </div>
            </div>

            {/* Send Form */}
            <div className="notification-form-card">
                <h3><Send size={20} /> สร้างข้อความใหม่</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>หัวข้อประกาศ</label>
                        <input
                            type="text"
                            value={notificationForm.title}
                            onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                            className="form-control"
                            placeholder="เช่น แจ้งหยุดวันสงกรานต์"
                        />
                    </div>

                    <div className="form-group">
                        <label>รายละเอียด</label>
                        <textarea
                            value={notificationForm.message}
                            onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                            className="form-control"
                            rows="4"
                            placeholder="กรอกรายละเอียด..."
                        ></textarea>
                    </div>

                    <div className="form-row-two">
                        <div className="form-group">
                            <label>รูปแบบการส่ง</label>
                            <div className="select-wrapper">
                                <Users size={18} className="select-icon" />
                                <select
                                    value={notificationForm.recipient}
                                    onChange={(e) => setNotificationForm({ ...notificationForm, recipient: e.target.value, targetUserId: '' })}
                                    className="form-control pl-10"
                                >
                                    <option value="all">ส่งถึงทุกคน (All Users)</option>
                                    <option value="individual">รายบุคคล (Individual)</option>
                                </select>
                            </div>
                        </div>

                        {/* Show this dropdown ONLY if Individual is selected */}
                        {notificationForm.recipient === 'individual' && (
                            <div className="form-group">
                                <label>เลือกผู้รับ</label>
                                <div className="select-wrapper">
                                    <User size={18} className="select-icon" />
                                    <select
                                        value={notificationForm.targetUserId}
                                        onChange={(e) => setNotificationForm({ ...notificationForm, targetUserId: e.target.value })}
                                        className="form-control pl-10"
                                    >
                                        <option value="">-- กรุณาเลือกรายชื่อ --</option>
                                        {allUsers.filter(u => u.role === 'employee').map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.id} - {u.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>ประเภทแจ้งเตือน</label>
                            <div className="select-wrapper">
                                <AlertCircle size={18} className="select-icon" />
                                <select
                                    value={notificationForm.type}
                                    onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value })}
                                    className="form-control pl-10"
                                >
                                    <option value="info">ทั่วไป (Information)</option>
                                    <option value="success">สำเร็จ (Success)</option>
                                    <option value="warning">แจ้งเตือน (Warning)</option>
                                    <option value="error">เร่งด่วน (Urgent/Error)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn-send-submit">
                        <Send size={20} /> ยืนยันการส่ง
                    </button>
                </form>
            </div>

            {/* Sent History */}
            <div className="sent-history-section">
                <h3>ประวัติการส่งล่าสุด</h3>
                {sentHistory.length === 0 ? (
                    <div className="empty-history">
                        <p>ยังไม่มีประวัติการส่ง</p>
                    </div>
                ) : (
                    <div className="history-list">
                        {sentHistory.map((notif) => (
                            <div key={notif.id} className={`history-item type-${notif.type} row`}>
                                <div className="history-header">
                                    <h4>{notif.title}</h4>
                                    <span className="history-time">{notif.sentTime}</span>
                                </div>
                                <p className="history-msg">{notif.message}</p>
                                <div className="history-meta">
                                    <span className="badge-recipient">
                                        <Users size={12} /> {notif.recipientLabel || 'Unknown'}
                                    </span>
                                    <span className="text-gray-400 text-xs">
                                        ส่งแล้ว {notif.recipientCount} คน
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default SendNotifications