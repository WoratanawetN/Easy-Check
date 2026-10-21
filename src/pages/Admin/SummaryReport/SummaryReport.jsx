import { useState, useEffect } from 'react'
import { Printer, Filter, FileText, Calendar, ChevronDown } from 'lucide-react'
import {
    getUsers,
    getAttendanceRecords,
    getAbsenceRequests
} from '../../../utils/storage'
import './SummaryReport.css'

// --- Imports for PDF Export ---
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Swal from 'sweetalert2'
import { fontBase64, fontName } from '../../../utils/ThaiFont'

function SummaryReport() {
    // --- Helper: สร้างตัวเลือกปี (ย้อนหลัง 2 ปี - ล่วงหน้า 1 ปี) ---
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

    // --- Helper: รายชื่อเดือนภาษาไทย ---
    const months = [
        { id: 1, name: 'มกราคม' }, { id: 2, name: 'กุมภาพันธ์' }, { id: 3, name: 'มีนาคม' },
        { id: 4, name: 'เมษายน' }, { id: 5, name: 'พฤษภาคม' }, { id: 6, name: 'มิถุนายน' },
        { id: 7, name: 'กรกฎาคม' }, { id: 8, name: 'สิงหาคม' }, { id: 9, name: 'กันยายน' },
        { id: 10, name: 'ตุลาคม' }, { id: 11, name: 'พฤศจิกายน' }, { id: 12, name: 'ธันวาคม' }
    ];

    // --- State ---
    const [reportType, setReportType] = useState('daily') // daily, weekly, monthly

    // State สำหรับ Dropdowns
    const [selYear, setSelYear] = useState(currentYear)
    const [selMonth, setSelMonth] = useState(new Date().getMonth() + 1)
    const [selWeek, setSelWeek] = useState(getCurrentWeekNum())
    const [selDate, setSelDate] = useState(new Date().toISOString().slice(0, 10))

    // Data State
    const [reportData, setReportData] = useState([])
    const [reportTitle, setReportTitle] = useState('')
    const [stats, setStats] = useState({
        totalWorkDays: 0, present: 0, absent: 0, late: 0, leave: 0, totalEmployees: 0
    })

    function getCurrentWeekNum() {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    }

    // --- Helper: คำนวณวันที่ของสัปดาห์ (จันทร์-อาทิตย์) ---
    const getWeekRange = (w, y) => {
        const simple = new Date(y, 0, 1 + (w - 1) * 7);
        const dow = simple.getDay();
        const ISOweekStart = simple;
        if (dow <= 4)
            ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        else
            ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());

        const start = new Date(ISOweekStart);
        const end = new Date(ISOweekStart);
        end.setDate(end.getDate() + 6);

        return {
            start,
            end,
            label: `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`
        };
    }

    // สร้าง Options สำหรับสัปดาห์ (1-52/53) พร้อมวันที่กำกับ
    const weekOptions = [];
    if (reportType === 'weekly') {
        const weeksInYear = (selYear % 4 === 0 && selYear % 100 !== 0) || selYear % 400 === 0 ? 53 : 52; // คร่าวๆ
        for (let i = 1; i <= weeksInYear; i++) {
            const range = getWeekRange(i, selYear);
            weekOptions.push({ id: i, label: `สัปดาห์ที่ ${i} (${range.label})` });
        }
    }

    useEffect(() => {
        generateReport()
    }, [reportType, selYear, selMonth, selWeek, selDate])

    const generateReport = () => {
        const allUsers = getUsers() || []
        const employees = allUsers.filter(u => u.role === 'employee')
        const attendanceRecords = getAttendanceRecords() || []
        const absenceRequests = getAbsenceRequests() || []

        let calculatedStats = {
            totalWorkDays: 0, present: 0, absent: 0, late: 0, leave: 0, totalEmployees: employees.length
        }

        const generatedRows = []
        const todayStr = new Date().toISOString().split('T')[0]
        let targetDates = []

        // --- 1. กำหนดช่วงวันที่ตาม Dropdown ---
        if (reportType === 'daily') {
            targetDates.push(selDate)
            setReportTitle(`รายวัน: ${new Date(selDate).toLocaleDateString('th-TH', { dateStyle: 'long' })}`)

        } else if (reportType === 'weekly') {
            const range = getWeekRange(selWeek, selYear);
            // Loop 7 วัน
            for (let i = 0; i < 7; i++) {
                const tempDate = new Date(range.start);
                tempDate.setDate(range.start.getDate() + i);
                targetDates.push(tempDate.toISOString().split('T')[0]);
            }
            setReportTitle(`รายสัปดาห์: สัปดาห์ที่ ${selWeek} ปี ${selYear} (${range.label})`)

        } else if (reportType === 'monthly') {
            const daysInMonth = new Date(selYear, selMonth, 0).getDate()
            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${selYear}-${String(selMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                targetDates.push(dateStr)
            }
            const monthName = months.find(m => m.id === parseInt(selMonth))?.name || '-';
            setReportTitle(`รายเดือน: ${monthName} ${selYear + 543}`)
        }

        // --- 2. วนลูปคำนวณ (เหมือนเดิม) ---
        targetDates.forEach(dateStr => {
            const dateObj = new Date(dateStr)
            const dayOfWeek = dateObj.getDay()
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 8
            const isFuture = dateStr > todayStr

            if (isFuture) return;

            employees.forEach(emp => {
                let status = 'absent'
                let time = '-'
                let timeOut = '-'
                let note = ''

                const record = attendanceRecords.find(r => r.userId === emp.id && r.date === dateStr)
                if (record) {
                    time = record.checkInTime
                    timeOut = record.checkOutTime
                    status = 'present'; calculatedStats.present++;
                } else {
                    const leave = absenceRequests.find(req =>
                        req.userId === emp.id && req.status === 'approved' &&
                        dateStr >= req.startDate && dateStr <= req.endDate
                    )
                    if (leave) {
                        status = 'on-leave';
                        if (leave.type === 'sick') note = 'ลาป่วย'
                        else if (leave.type === 'annual') note = 'ลาพักร้อน'
                        else if (leave.type === 'personal') note = 'ลากิจ'
                        else note = 'ลาอื่นๆ'
                        calculatedStats.leave++;
                    } else if (!isWeekend) {
                        status = 'absent'; calculatedStats.absent++;
                    } else {
                        status = 'weekend'
                    }
                }

                if (reportType === 'daily' || status !== 'weekend') {
                    generatedRows.push({
                        id: `${dateStr}-${emp.id}`,
                        date: dateStr,
                        userId: emp.id,
                        userName: emp.name,
                        status: status,
                        time: time,
                        timeOut: timeOut,
                        note: note
                    })
                    if (status !== 'weekend') calculatedStats.totalWorkDays++
                }
            })
        })

        generatedRows.sort((a, b) => {
            if (b.date !== a.date) return b.date.localeCompare(a.date)
            return a.userId.localeCompare(b.userId)
        })

        setReportData(generatedRows)
        setStats(calculatedStats)
    }

    // --- PDF Export Logic (Fixed Headers & Font Style) ---
    const handlePrint = () => {
        if (reportData.length === 0) {
            Swal.fire('ไม่มีข้อมูล', 'ไม่พบข้อมูลในช่วงเวลาที่เลือก', 'info')
            return
        }

        try {
            const doc = new jsPDF()

            // 1. Setup Font (Thai)
            doc.addFileToVFS(`${fontName}.ttf`, fontBase64)
            doc.addFont(`${fontName}.ttf`, fontName, 'normal')
            doc.setFont(fontName)

            // 2. Header
            doc.setFontSize(18)
            doc.setTextColor(242, 102, 35) // Orange color
            doc.text("รายงานสรุปการเข้างาน", 14, 15)

            doc.setFontSize(12)
            doc.setTextColor(0, 0, 0)
            doc.text(reportTitle, 14, 22)
            doc.text(`พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}`, 14, 28)

            let currentY = 35

            // 3. Summary Statistics Table (Top Section)
            const summaryData = [[
                `${stats.totalEmployees}`,
                `${stats.present}`,
                `${stats.late}`,
                `${stats.absent}`,
                `${stats.leave}`,
                `${stats.totalWorkDays}`
            ]]

            autoTable(doc, {
                startY: currentY,
                head: [['พนักงานทั้งหมด', 'เข้างานปกติ', 'มาสาย', 'ขาดงาน', 'ลาหยุด', 'รายการทั้งหมด']],
                body: summaryData,
                theme: 'plain',
                styles: {
                    font: fontName,
                    fontSize: 12,
                    halign: 'center',
                    cellPadding: 3
                },
                headStyles: {
                    font: fontName,
                    fontStyle: 'normal', // <--- [สำคัญ] บังคับไม่ให้ใช้ตัวหนา เพราะเราไม่มีไฟล์ฟอนต์ตัวหนา
                    fillColor: [240, 240, 240],
                    textColor: [0, 0, 0]
                }
            })

            currentY = doc.lastAutoTable.finalY + 10

            // 4. Detailed Data Table
            const translateStatus = (s) => {
                switch (s) {
                    case 'present': return 'ปกติ'
                    case 'late': return 'มาสาย'
                    case 'absent': return 'ขาดงาน'
                    case 'on-leave': return 'ลาหยุด'
                    case 'weekend': return 'วันหยุด'
                    default: return '-'
                }
            }

            const tableBody = reportData.map(row => [
                new Date(row.date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                row.userId,
                row.userName,
                translateStatus(row.status),
                row.time,
                row.timeOut,
                row.note
            ])

            doc.setFontSize(14)
            doc.text("รายละเอียด", 14, currentY)

            autoTable(doc, {
                startY: currentY + 3,
                head: [['วันที่', 'รหัส', 'ชื่อ-นามสกุล', 'สถานะ', 'เข้างาน', 'ออกงาน', 'หมายเหตุ']],
                body: tableBody,
                theme: 'grid',
                styles: {
                    font: fontName,
                    fontSize: 10
                },
                headStyles: {
                    font: fontName,
                    fontStyle: 'normal', // <--- [สำคัญ] บังคับไม่ให้ใช้ตัวหนา
                    fillColor: [242, 102, 35],
                    textColor: [255, 255, 255]
                },
                columnStyles: {
                    0: { cellWidth: 25 }, // Date
                    1: { cellWidth: 20 }, // ID
                    3: { cellWidth: 20 }, // Status
                    4: { cellWidth: 20 }, // In
                    5: { cellWidth: 20 }, // Out
                }
            })

            // 5. Save File
            const fileName = `Report_${reportType}_${new Date().toISOString().slice(0, 10)}.pdf`
            doc.save(fileName)

            Swal.fire({
                icon: 'success',
                title: 'สำเร็จ',
                text: 'ดาวน์โหลดรายงานเรียบร้อยแล้ว',
                timer: 1500,
                showConfirmButton: false
            })

        } catch (error) {
            console.error(error)
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างไฟล์ PDF ได้', 'error')
        }
    }

    const getStatusLabel = (status) => {
        switch (status) {
            case 'present': return <span className="status present">ปกติ</span>
            case 'late': return <span className="status late">มาสาย</span>
            case 'absent': return <span className="status absent">ขาดงาน</span>
            case 'on-leave': return <span className="status on-leave">ลาหยุด</span>
            case 'weekend': return <span className="status weekend">วันหยุด</span>
            default: return <span className="status">-</span>
        }
    }

    return (
        <div className="summary-report-container">
            <div className="header">
                <h2>รายงานสรุปการเข้างาน</h2>
                <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '-0.5rem' }}>{reportTitle}</p>
            </div>

            {/* Filter Section */}
            <div className="filter-section no-print">
                <div className="filter-grid">
                    {/* 1. เลือกประเภท */}
                    <div className="form-summary-group">
                        <label><Filter size={18} /> ประเภท</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="form-summary-control"
                        >
                            <option value="daily">รายวัน</option>
                            <option value="weekly">รายสัปดาห์</option>
                            <option value="monthly">รายเดือน</option>
                        </select>
                    </div>

                    {/* 2. เลือกช่วงเวลา (Dropdowns) */}

                    {/* กรณี: รายวัน (ใช้ Date Picker เหมือนเดิมเพราะสะดวกสุด) */}
                    {reportType === 'daily' && (
                        <div className="form-summary-group span-2">
                            <label><Calendar size={18} /> เลือกวันที่</label>
                            <input
                                type="date"
                                value={selDate}
                                onChange={(e) => setSelDate(e.target.value)}
                                className="form-summary-control"
                            />
                        </div>
                    )}

                    {/* กรณี: รายสัปดาห์ (Dropdown ปี + สัปดาห์) */}
                    {reportType === 'weekly' && (
                        <>
                            <div className="form-summary-group">
                                <label>เลือกปี</label>
                                <select value={selYear} onChange={e => setSelYear(Number(e.target.value))} className="form-summary-control">
                                    {years.map(y => <option key={y} value={y}>{y + 543}</option>)}
                                </select>
                            </div>
                            <div className="form-summary-group">
                                <label>เลือกสัปดาห์</label>
                                <select value={selWeek} onChange={e => setSelWeek(Number(e.target.value))} className="form-summary-control">
                                    {weekOptions.map(w => (
                                        <option key={w.id} value={w.id}>{w.label}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* กรณี: รายเดือน (Dropdown ปี + เดือน) */}
                    {reportType === 'monthly' && (
                        <>
                            <div className="form-summary-group">
                                <label>เลือกปี</label>
                                <select value={selYear} onChange={e => setSelYear(Number(e.target.value))} className="form-summary-control">
                                    {years.map(y => <option key={y} value={y}>{y + 543}</option>)}
                                </select>
                            </div>
                            <div className="form-summary-group">
                                <label>เลือกเดือน</label>
                                <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))} className="form-summary-control">
                                    {months.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Stats & Table (ส่วนแสดงผลเหมือนเดิม) */}
            <div className="stats-grid-report">
                <div className="stat-item">
                    <div className="stat-label">พนักงาน</div>
                    <div className="stat-number">{stats.totalEmployees} <span className="unit">คน</span></div>
                </div>
                <div className="stat-item present">
                    <div className="stat-label">เข้างานปกติ</div>
                    <div className="stat-number">{stats.present}</div>
                </div>
                <div className="stat-item">
                    <div className="stat-label">มาสาย</div>
                    <div className="stat-number">{stats.late}</div>
                </div>
                <div className="stat-item">
                    <div className="stat-label">ขาดงาน</div>
                    <div className="stat-number text-red">{stats.absent}</div>
                </div>
                <div className="stat-item">
                    <div className="stat-label">ลาหยุด</div>
                    <div className="stat-number">{stats.leave}</div>
                </div>
                <div className="stat-item">
                    <div className="stat-label">รายการตรวจสอบ</div>
                    <div className="stat-number">{stats.totalWorkDays} <span className="unit">รายการ</span></div>
                </div>
            </div>

            <div className="table-section">
                <h3><FileText size={20} /> รายละเอียด</h3>
                <div className="table-wrapper">
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>วันที่</th>
                                <th>รหัส</th>
                                <th>ชื่อ-นามสกุล</th>
                                <th>สถานะ</th>
                                <th>เวลาเข้างาน</th>
                                <th>เวลาออก</th>
                                <th>หมายเหตุ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>ไม่พบข้อมูล</td>
                                </tr>
                            ) : (
                                reportData.map((row) => (
                                    <tr key={row.id}>
                                        <td>{new Date(row.date).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                                        <td className="font-mono">{row.userId}</td>
                                        <td>{row.userName}</td>
                                        <td>{getStatusLabel(row.status)}</td>
                                        <td>{row.time}</td>
                                        <td>{row.timeOut}</td>
                                        <td style={{ fontSize: '0.85rem', color: '#666' }}>{row.note}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <button className="btn-print no-print" onClick={handlePrint}>
                <Printer size={18} /> พิมพ์รายงาน
            </button>
        </div>
    )
}

export default SummaryReport