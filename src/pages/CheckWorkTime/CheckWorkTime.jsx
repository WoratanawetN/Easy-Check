import { useState, useEffect } from 'react'
import './CheckWorkTime.css'
import dayjs from 'dayjs'
import { useAuth } from '../../context/AuthContext'
import { getAttendanceRecords, getAbsenceHistory } from '../../utils/storage'

function CheckWorkTime() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [workHistory, setWorkHistory] = useState([])
    const [monthStats, setMonthStats] = useState({
        totalWorkDays: 0,
        presentDays: 0,
        absentDays: 0,
        leaveDays: 0,
        totalWorkHours: 0,
        averageWorkHours: 0
    })

    const { user } = useAuth()

    const getStatusColor = (status) => {
        switch (status) {
            case 'ปกติ':
                return '#4caf50'
            case 'ลาสาย':
                return '#ff9800'
            case 'ลาหยุด':
                return '#f44336'
            default:
                return '#999'
        }
    }

    const computeWorkHours = (date, checkIn, checkOut) => {
        if (!checkIn || !checkOut || checkIn === '-' || checkOut === '-') return 0
        const inT = dayjs(`${date} ${checkIn}`, 'YYYY-MM-DD HH:mm:ss')
        const outT = dayjs(`${date} ${checkOut}`, 'YYYY-MM-DD HH:mm:ss')
        if (!inT.isValid() || !outT.isValid()) return 0
        const mins = outT.diff(inT, 'minute')
        return +(mins / 60).toFixed(2)
    }

    useEffect(() => {
        // load attendance records for user
        const records = getAttendanceRecords()
        const uid = user?.id || null
        const selDay = dayjs(selectedDate)
        const monthStart = selDay.startOf('month')
        const monthEnd = selDay.endOf('month')

        // Filter records for this user and month using isSame/isAfter/isBefore to avoid plugin
        const monthRecords = records.filter(r => {
            if (!r) return false
            if (uid && r.userId !== uid) return false
            const d = dayjs(r.date)
            const within = (d.isSame(monthStart, 'day') || d.isAfter(monthStart, 'day')) && (d.isSame(monthEnd, 'day') || d.isBefore(monthEnd, 'day'))
            return within
        })

        // compute totalWorkDays = number of weekdays in month
        let totalWorkDays = 0
        for (let d = monthStart; d.isBefore(monthEnd) || d.isSame(monthEnd, 'day'); d = d.add(1, 'day')) {
            const day = d.day()
            if (day !== 0 && day !== 6) totalWorkDays++
        }

        const presentDays = new Set(monthRecords.filter(r => r.checkInTime && r.checkInTime !== '-').map(r => r.date)).size

        // compute leave days from absence records (falling inside this month)
        const absFromStorage = getAbsenceHistory() || []
        const absLegacy = JSON.parse(localStorage.getItem('absenceHistory') || '[]') || []
        const absences = (absFromStorage && absFromStorage.length > 0) ? absFromStorage : absLegacy

        const leaveDateSet = new Set()
        absences.forEach(a => {
            // optional user filtering if absence records include userId
            if (a.userId && uid && a.userId !== uid) return
            const s = a.startDate
            const e = a.endDate || a.startDate
            if (!s) return
            let cur = dayjs(s)
            const end = dayjs(e)
            while (cur.isBefore(end) || cur.isSame(end, 'day')) {
                const day = cur.day()
                // only count weekdays
                if (day !== 0 && day !== 6) {
                    if ((cur.isSame(monthStart, 'day') || cur.isAfter(monthStart, 'day')) && (cur.isSame(monthEnd, 'day') || cur.isBefore(monthEnd, 'day'))) {
                        leaveDateSet.add(cur.format('YYYY-MM-DD'))
                    }
                }
                cur = cur.add(1, 'day')
            }
        })

        const leaveDays = leaveDateSet.size
        const absentDays = Math.max(0, totalWorkDays - presentDays - leaveDays)

        // compute total work hours
        let totalWorkHours = 0
        monthRecords.forEach(r => {
            const hrs = computeWorkHours(r.date, r.checkInTime, r.checkOutTime)
            totalWorkHours += hrs
        })

        const averageWorkHours = presentDays > 0 ? +(totalWorkHours / presentDays).toFixed(2) : 0

        // build 7-day history up to selectedDate
        const history = []
        for (let i = 0; i < 7; i++) {
            const d = selDay.subtract(i, 'day')
            const dateStr = d.format('YYYY-MM-DD')
            const rec = records.find(r => r.date === dateStr && (!uid || r.userId === uid))
            if (rec) {
                const workHours = computeWorkHours(rec.date, rec.checkInTime, rec.checkOutTime)
                const status = (() => {
                    if (!rec.checkInTime && !rec.checkOutTime) return 'ลาหยุด'
                    if (rec.checkInTime && rec.checkOutTime) {
                        // late if checkIn after 09:00
                        try {
                            const t = dayjs(`${rec.date} ${rec.checkInTime}`, 'YYYY-MM-DD HH:mm:ss')
                            const nine = dayjs(`${rec.date} 09:00:00`, 'YYYY-MM-DD HH:mm:ss')
                            return t.isAfter(nine) ? 'ลาสาย' : 'ปกติ'
                        } catch (e) {
                            return 'ปกติ'
                        }
                    }
                    return 'ยังไม่ออกงาน'
                })()

                // normalize location object to { lat, lon } (some records use latitude/longitude keys)
                const rawLoc = rec.checkInLocation || rec.checkOutLocation || null
                let locationNorm = null
                if (rawLoc) {
                    const latRaw = rawLoc.lat ?? rawLoc.latitude ?? rawLoc.latitudeStr ?? rawLoc.latitude_string
                    const lonRaw = rawLoc.lon ?? rawLoc.longitude ?? rawLoc.longitudeStr ?? rawLoc.longitude_string
                    const lat = latRaw != null ? parseFloat(latRaw) : NaN
                    const lon = lonRaw != null ? parseFloat(lonRaw) : NaN
                    if (!isNaN(lat) && !isNaN(lon)) {
                        locationNorm = { lat, lon }
                    }
                }

                history.push({
                    id: rec.id,
                    date: rec.date,
                    checkInTime: rec.checkInTime || '-',
                    checkOutTime: rec.checkOutTime || '-',
                    workHours: workHours.toString(),
                    location: locationNorm,
                    status
                })
            } else {
                history.push({
                    id: `empty_${dateStr}`,
                    date: dateStr,
                    checkInTime: '-',
                    checkOutTime: '-',
                    workHours: '0',
                    location: null,
                    status: 'ลาหยุด'
                })
            }
        }

        // ensure history is ordered newest -> oldest
        history.sort((a, b) => b.date.localeCompare(a.date))
        setWorkHistory(history)
        setMonthStats({ totalWorkDays, presentDays, absentDays, leaveDays, totalWorkHours: +totalWorkHours.toFixed(2), averageWorkHours })
    }, [selectedDate, user])

    const getTodayRecord = () => {
        return workHistory.find(record => record.date === selectedDate)
    }

    const selectedRecord = getTodayRecord()

    return (
        <div className="check-work-time-container">
            <div className="work-time-header">
                <i className="bi bi-clock-history"></i>
                <h2>ตรวจสอบเวลาทำงาน</h2>
            </div>

            {/* Monthly Statistics */}
            <div className="stats-section">
                <h3 className="section-title">สถิติเดือนนี้</h3>
                <div className="stats-grid">
                    <div className="stat-item">
                        <p className="stat-label">วันทำงาน</p>
                        <p className="stat-value">{monthStats.totalWorkDays}</p>
                    </div>
                    <div className="stat-item success">
                        <p className="stat-label">มา</p>
                        <p className="stat-value">{monthStats.presentDays}</p>
                    </div>
                    <div className="stat-item warning">
                        <p className="stat-label">ขาดงาน</p>
                        <p className="stat-value">{monthStats.absentDays}</p>
                    </div>
                    <div className="stat-item info">
                        <p className="stat-label">ลาหยุด</p>
                        <p className="stat-value">{monthStats.leaveDays}</p>
                    </div>
                </div>

                <div className="summary-info">
                    <div className="info-row">
                        <span className="label">รวมชั่วโมงทำงาน:</span>
                        <span className="value">{monthStats.totalWorkHours} ชั่วโมง</span>
                    </div>
                    <div className="info-row">
                        <span className="label">เฉลี่ยต่อวัน:</span>
                        <span className="value">{monthStats.averageWorkHours} ชั่วโมง</span>
                    </div>
                </div>
            </div>

            {/* Date Selector */}
            <div className="date-selector">
                <label>เลือกวันที่:</label>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="date-input"
                />
            </div>

            {/* Today's Detail */}
            {selectedRecord ? (
                <div className="work-detail-card">
                    <div className="detail-header">
                        <h3>รายละเอียดการทำงาน</h3>
                        <span className="status-badge" style={{ backgroundColor: getStatusColor(selectedRecord.status) }}>
                            {selectedRecord.status}
                        </span>
                    </div>

                    <div className="detail-content">
                        <div className="detail-row">
                            <span className="label">
                                <i className="bi bi-calendar"></i> วันที่
                            </span>
                            <span className="value">
                                {new Date(selectedRecord.date).toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>

                        <div className="detail-row">
                            <span className="label">
                                <i className="bi bi-clock-fill"></i> เข้างาน
                            </span>
                            <span className="value">{selectedRecord.checkInTime}</span>
                        </div>

                        <div className="detail-row">
                            <span className="label">
                                <i className="bi bi-clock-fill"></i> ออกงาน
                            </span>
                            <span className="value">{selectedRecord.checkOutTime}</span>
                        </div>

                        <div className="detail-row">
                            <span className="label">
                                <i className="bi bi-hourglass-split"></i> เวลาทำงาน
                            </span>
                            <span className="value">{selectedRecord.workHours} ชั่วโมง</span>
                        </div>

                        {selectedRecord.location && (
                            <div className="detail-row">
                                <span className="label">
                                    <i className="bi bi-geo-alt"></i> ตำแหน่ง GPS
                                </span>
                                <span className="value">
                                    {selectedRecord.location.lat.toFixed(4)}, {selectedRecord.location.lon.toFixed(4)}
                                </span>
                            </div>
                        )}

                        {!selectedRecord.location && selectedRecord.checkInTime !== '-' && (
                            <div className="detail-row no-gps">
                                <span className="label">
                                    <i className="bi bi-geo-alt-slash"></i> ตำแหน่ง GPS
                                </span>
                                <span className="value">ไม่มีข้อมูล GPS</span>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="no-data">
                    <i className="bi bi-inbox"></i>
                    <p>ไม่มีข้อมูลสำหรับวันที่ที่เลือก</p>
                </div>
            )}

            {/* Work History */}
            <div className="history-section">
                <h3 className="section-title">ประวัติการทำงาน (7 วันล่าสุด)</h3>
                <div className="history-list">
                    {workHistory.slice(0, 7).map((record) => (
                        <div
                            key={record.id}
                            className={`history-item ${selectedDate === record.date ? 'active' : ''}`}
                            onClick={() => setSelectedDate(record.date)}
                        >
                            <div className="history-date">
                                <p className="date">{new Date(record.date).toLocaleDateString('th-TH', { weekday: 'short' })}</p>
                                <p className="day">{new Date(record.date).getDate()}</p>
                            </div>
                            <div className="history-info">
                                <div className="time-row">
                                    <span className="label">เข้า:</span>
                                    <span className="time">{record.checkInTime}</span>
                                </div>
                                <div className="time-row">
                                    <span className="label">ออก:</span>
                                    <span className="time">{record.checkOutTime}</span>
                                </div>
                            </div>
                            <div className="history-status">
                                <span
                                    className="status-badge"
                                    style={{ backgroundColor: getStatusColor(record.status) }}
                                >
                                    {record.status}
                                </span>
                                <p className="hours">{record.workHours}h</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default CheckWorkTime
