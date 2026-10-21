import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { addOrUpdateAttendance, getAttendanceRecords, addNotification } from '../../utils/storage'
import dayjs from 'dayjs'
import Swal from 'sweetalert2' // Import SweetAlert2
import {
    MapPin,
    Clock,
    LogOut,
    CalendarX,
    Gift,
    History
} from 'lucide-react'
import './Home.css'

function Home() {
    const { user } = useAuth()

    const [isCheckedIn, setIsCheckedIn] = useState(false)
    const [checkInTime, setCheckInTime] = useState(null)
    const [checkOutTime, setCheckOutTime] = useState(null)
    const [location, setLocation] = useState(null)
    const [currentTimeDisplay, setCurrentTimeDisplay] = useState(new Date())

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTimeDisplay(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Logic: Get GPS (Wrapped in Promise)
    const getGPSLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject('อุปกรณ์ของท่านไม่รองรับ GPS')
                return
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords
                    const locData = {
                        latitude: latitude.toFixed(6),
                        longitude: longitude.toFixed(6),
                        timestamp: new Date().toLocaleString('th-TH')
                    }
                    // Update state for UI display
                    setLocation(locData)
                    resolve(locData)
                },
                (err) => {
                    let msg = 'ไม่สามารถเข้าถึง GPS ได้'
                    if (err.code === 1) msg = 'กรุณากด "อนุญาต" (Allow) ให้เว็บไซต์เข้าถึงตำแหน่ง'
                    else if (err.code === 2) msg = 'สัญญาณ GPS ขัดข้อง หรือไม่สามารถระบุตำแหน่งได้'
                    else if (err.code === 3) msg = 'หมดเวลาในการร้องขอพิกัด (Timeout)'
                    reject(msg)
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            )
        })
    }

    // Logic: Main Action (Check In OR Check Out)
    const handleMainAction = async () => {
        // 1. Show Loading Alert
        Swal.fire({
            title: 'กำลังระบุตำแหน่ง...',
            html: 'กรุณารอสักครู่ ระบบกำลังดึงพิกัด GPS',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading()
            }
        })

        try {
            // 2. Force Fetch GPS
            const currentLoc = await getGPSLocation()

            // 3. Prepare Data
            const now = dayjs().format('HH:mm:ss')
            const date = dayjs().format('YYYY-MM-DD')
            const id = `${user?.id || 'ANON'}_${date}`
            const isCheckingIn = !isCheckedIn // Current action intention

            // 4. Update Storage Logic
            if (isCheckingIn) {
                // ---> CHECK IN
                setCheckInTime(now)
                setIsCheckedIn(true)

                const rec = {
                    id,
                    userId: user?.id || 'ANON',
                    date,
                    checkInTime: now,
                    checkInLocation: currentLoc
                }
                addOrUpdateAttendance(rec)

                addNotification(
                    user.id,
                    'success',
                    'เข้างานสำเร็จ',
                    `บันทึกเวลาเข้างาน ${now} เรียบร้อยแล้ว`
                );

                // 5. Success Alert (Check In)
                Swal.fire({
                    icon: 'success',
                    title: 'เข้างานสำเร็จ!',
                    html: `เวลา: <b>${now}</b><br/>พิกัด: ${currentLoc.latitude}, ${currentLoc.longitude}`,
                    timer: 3000,
                    showConfirmButton: false
                })

            } else {
                // ---> CHECK OUT
                setCheckOutTime(now)
                setIsCheckedIn(false)

                const rec = {
                    id,
                    userId: user?.id || 'ANON',
                    date,
                    checkOutTime: now,
                    checkOutLocation: currentLoc
                }
                addOrUpdateAttendance(rec)

                addNotification(
                    user.id,
                    'warning', // Use 'warning' or 'success' depending on preference
                    'ออกงานสำเร็จ',
                    `บันทึกเวลาออกงาน ${now} เรียบร้อยแล้ว`
                );

                // 5. Success Alert (Check Out)
                Swal.fire({
                    icon: 'success',
                    title: 'ออกงานสำเร็จ!',
                    html: `เวลา: <b>${now}</b><br/>พิกัด: ${currentLoc.latitude}, ${currentLoc.longitude}`,
                    timer: 3000,
                    showConfirmButton: false
                })
            }

        } catch (errorMsg) {
            // 6. Error Alert
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: errorMsg,
                confirmButtonText: 'ลองใหม่อีกครั้ง'
            })
        }
    }

    // Logic: Load initial state
    useEffect(() => {
        const records = getAttendanceRecords()
        const date = dayjs().format('YYYY-MM-DD')
        const currentUserId = user?.id

        const todayRecord = records.find(r => r.date === date && r.userId === currentUserId)

        if (todayRecord) {
            if (todayRecord.checkInTime) setCheckInTime(todayRecord.checkInTime)
            if (todayRecord.checkOutTime) setCheckOutTime(todayRecord.checkOutTime)
            setIsCheckedIn(Boolean(todayRecord.checkInTime && !todayRecord.checkOutTime))
        }
    }, [user])

    const quickLinks = [
        { label: 'แจ้งลา/ขาด', path: '/notice-absence', icon: CalendarX, color: '#f97316' },
        { label: 'กิจกรรม', path: '/event-registration', icon: Gift, color: '#3b82f6' },
        { label: 'ประวัติ', path: '/check-work-time', icon: History, color: '#22c55e' }
    ]

    return (
        <div className="home-container">
            {/* Header Card */}
            <div className="header-card">
                <div className="header-bg-icon">
                    <Clock size={100} />
                </div>
                <div className="header-content">
                    <p className="welcome-text">สวัสดี,</p>
                    <h1 className="user-name">{user?.name || 'พนักงาน'}</h1>
                    <div className="location-badge">
                        <MapPin size={14} />
                        <span>{location ? 'ระบุพิกัดแล้ว' : 'พร้อมใช้งาน GPS'}</span>
                    </div>
                </div>
            </div>

            {/* Time Display */}
            <div className="time-display">
                <div className="time-label">เวลาปัจจุบัน</div>
                <div className="current-time">
                    {currentTimeDisplay.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="current-date">
                    {currentTimeDisplay.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
            </div>

            {/* Main Action Button */}
            <div className="action-area">
                <button
                    className={`btn-main-action ${isCheckedIn ? 'check-out' : 'check-in'}`}
                    onClick={handleMainAction}
                >
                    <div className="action-icon-wrapper">
                        {isCheckedIn ?
                            <LogOut size={48} className="text-red-500" /> :
                            <MapPin size={48} className="text-orange-500" />
                        }
                    </div>
                    <span className="action-title">{isCheckedIn ? 'Check OUT' : 'Check IN'}</span>
                    <span className="action-subtitle">{isCheckedIn ? 'กดเพื่อออกงาน (GPS)' : 'กดเพื่อเข้างาน (GPS)'}</span>
                </button>
            </div>

            {/* Quick Links */}
            <div className="quick-links-grid">
                {quickLinks.map((link, index) => (
                    <Link key={index} to={link.path} className="quick-link-card">
                        <div className="link-icon" style={{ backgroundColor: link.color }}>
                            <link.icon size={24} />
                        </div>
                        <span className="link-label">{link.label}</span>
                    </Link>
                ))}
            </div>

            {/* Today's Status Summary */}
            {(checkInTime || checkOutTime) && (
                <div style={{ background: 'white', padding: '1rem', borderRadius: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#6b7280' }}>ประวัติวันนี้</h3>
                    {checkInTime && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>เข้างาน:</span> <strong>{checkInTime}</strong></div>}
                    {checkOutTime && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ออกงาน:</span> <strong>{checkOutTime}</strong></div>}
                </div>
            )}
        </div>
    )
}

export default Home