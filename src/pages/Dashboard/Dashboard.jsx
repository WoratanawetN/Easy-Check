import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
    getUsers,
    getAttendanceRecords,
    getAbsenceRequests,
} from '../../utils/storage'

import './Dashboard.css'

function Dashboard() {
    const navigate = useNavigate()
    const { user } = useAuth()

    // State for dashboard statistics
    const [stats, setStats] = useState({
        totalEmployees: 0,
        presentToday: 0,
        absentToday: 0,
        onLeave: 0
    })

    // State for pending requests badge
    const [pendingRequestCount, setPendingRequestCount] = useState(0)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = () => {
        // 1. Get Base Data
        const allUsers = getUsers() || []
        const employees = allUsers.filter(u => u.role === 'employee')
        const attendanceRecords = getAttendanceRecords() || []
        const absenceRequests = getAbsenceRequests() || []

        // 2. Calculate Pending Requests (for the badge)
        const pending = absenceRequests.filter(r => r.status === 'pending')
        setPendingRequestCount(pending.length)

        // 3. Calculate Daily Stats (Logic similar to SummaryReport)
        const todayStr = new Date().toISOString().split('T')[0]
        const todayObj = new Date()
        const dayOfWeek = todayObj.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // 0=Sun, 6=Sat

        let present = 0
        let leave = 0
        let absent = 0

        employees.forEach(emp => {
            // Check if checked in today
            const record = attendanceRecords.find(r => r.userId === emp.id && r.date === todayStr)

            // Check if on approved leave today
            const onLeaveToday = absenceRequests.find(req =>
                req.userId === emp.id &&
                req.status === 'approved' &&
                todayStr >= req.startDate &&
                todayStr <= req.endDate
            )

            if (record) {
                // Check-in record exists (includes Late)
                present++
            } else if (onLeaveToday) {
                // No record, but has approved leave
                leave++
            } else if (!isWeekend) {
                // No record, no leave, and it's a workday
                absent++
            }
            // If it is a weekend and no record/leave, we don't count as absent
        })

        // 4. Update State
        setStats({
            totalEmployees: employees.length,
            presentToday: present,
            absentToday: absent,
            onLeave: leave
        })
    }

    const defaultAdminMenu = [
        { label: 'รายงานสรุป', path: '/admin/summary-report', icon: 'bar-chart' },
        { label: 'ส่งประกาศ', path: '/admin/send-notifications', icon: 'bell' },
        { label: 'จัดการกิจกรรม', path: '/admin/event-manage', icon: 'gift' },
        { label: 'ส่งออกข้อมูล', path: '/admin/export-data', icon: 'download' },
        { label: 'ตรวจสอบ GPS', path: '/admin/gps-check', icon: 'geo-alt' },
        { label: 'จัดการตารางงาน', path: '/admin/work-table', icon: 'calendar-event' },
        { label: 'กำหนดพื้นที่', path: '/admin/set-area', icon: 'map' }
    ]

    // If superadmin, add superadmin-only links
    const [adminMenu] = useState(() => {
        if (user && user.role === 'superadmin') {
            return [
                ...defaultAdminMenu,
                { label: 'จัดการสิทธิ์', path: '/superadmin/set-permission', icon: 'shield-lock' }
            ]
        }
        return defaultAdminMenu
    })

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>Dashboard</h2>
                <p className="dashboard-date">{new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-icon">
                        <i className="bi bi-people"></i>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label-dash">พนักงานทั้งหมด</p>
                        <p className="stat-value">{stats.totalEmployees}</p>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-icon">
                        <i className="bi bi-check-circle"></i>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label-dash">มาถึงแล้ว</p>
                        <p className="stat-value">{stats.presentToday}</p>
                    </div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon">
                        <i className="bi bi-exclamation-circle"></i>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label-dash">ขาดงาน</p>
                        <p className="stat-value">{stats.absentToday}</p>
                    </div>
                </div>

                <div className="stat-card info">
                    <div className="stat-icon">
                        <i className="bi bi-calendar-x"></i>
                    </div>
                    <div className="stat-content">
                        <p className="stat-label-dash">ลาหยุด</p>
                        <p className="stat-value">{stats.onLeave}</p>
                    </div>
                </div>
            </div>

            {/* Admin Menu */}
            <div className="admin-menu-section">
                <h3 className="menu-title">ฟังก์ชันจัดการ</h3>
                <div className="admin-menu-grid">
                    {adminMenu.map((item, index) => (
                        <Link key={index} to={item.path} className="menu-item">
                            <div className="menu-icon">
                                <i className={`bi bi-${item.icon}`}></i>
                            </div>
                            <p className="menu-label">{item.label}</p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h3>แจ้งการลาหยุด</h3>
                <div className="action-buttons">
                    <button className="action-btn" onClick={() => { navigate('/admin/absence-manage') }}>
                        <i className="bi bi-hourglass-split"></i> การตรวจสอบรออนุมัติ
                        <span className="badge">{pendingRequestCount}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Dashboard