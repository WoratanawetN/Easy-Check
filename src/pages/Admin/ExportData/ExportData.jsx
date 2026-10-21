import { useState } from 'react'
import './ExportData.css'
import dayjs from 'dayjs'
import Swal from 'sweetalert2' // Import SweetAlert
import * as XLSX from 'xlsx' // Import XLSX แบบเต็ม
import jsPDF from 'jspdf' // Import jsPDF
import autoTable from 'jspdf-autotable' // Import autoTable

import { fontBase64, fontName } from '../../../utils/ThaiFont'

import {
    getAttendanceRecords,
    getAbsenceRequests,
    getEvents,
    getRegisteredEvents,
} from '../../../utils/storage'

// --- (Optional) ส่วนจัดการฟอนต์ภาษาไทย ---
// หากต้องการให้ PDF แสดงภาษาไทยได้ คุณต้องหาไฟล์ .ttf มาแปลงเป็น base64
// แล้วใช้ doc.addFileToVFS และ doc.addFont (ข้ามส่วนนี้ไปก่อนเพื่อให้โค้ดรันได้)
// ----------------------------------------

function ExportData() {
    const [exportFormat, setExportFormat] = useState('excel')
    const [dateRange, setDateRange] = useState({ start: '', end: '' })
    const [dataType, setDataType] = useState('attendance')

    const filterDataByDate = (data, dateField, start, end) => {
        return data.filter(item => {
            const date = dayjs(item[dateField])
            return (date.isSame(start, 'day') || date.isAfter(start, 'day')) &&
                (date.isSame(end, 'day') || date.isBefore(end, 'day'))
        })
    }

    const handleExport = () => { // ลบ e.preventDefault เพราะไม่ได้อยู่ใน form tag แบบมี action
        if (!dateRange.start || !dateRange.end) {
            Swal.fire('แจ้งเตือน', 'กรุณากำหนดช่วงวันที่', 'warning')
            return
        }

        const start = dayjs(dateRange.start)
        const end = dayjs(dateRange.end)

        if (!start.isValid() || !end.isValid()) {
            Swal.fire('ข้อผิดพลาด', 'รูปแบบวันที่ไม่ถูกต้อง', 'error')
            return
        }

        // --- เตรียมข้อมูล ---
        let attendanceData = []
        let absenceData = []
        let eventsData = []

        // 1. Attendance & GPS
        if (['attendance', 'gps', 'all'].includes(dataType)) {
            const allAtt = getAttendanceRecords() || []
            const filtered = filterDataByDate(allAtt, 'date', start, end)

            if (dataType === 'gps') {
                attendanceData = filtered.filter(r => r.checkInLocation || r.checkOutLocation)
            } else {
                attendanceData = filtered
            }
        }

        // 2. Absence
        if (['absence', 'all'].includes(dataType)) {
            const allAbs = getAbsenceRequests() || []
            // Absence logic usually checks overlap, simple start date check for now
            absenceData = filterDataByDate(allAbs, 'startDate', start, end)
        }

        // 3. Events
        if (['events', 'all'].includes(dataType)) {
            const allEvents = getEvents() || []
            const filteredEvents = filterDataByDate(allEvents, 'date', start, end)
            const regMap = getRegisteredEvents() || {}

            eventsData = filteredEvents.map(ev => ({
                ...ev,
                registeredCount: (regMap && Object.values(regMap).flat().filter(id => id === ev.id).length) || ev.registered || 0
            }))
        }

        // Check if no data found
        if (attendanceData.length === 0 && absenceData.length === 0 && eventsData.length === 0) {
            Swal.fire('ไม่พบข้อมูล', 'ไม่มีข้อมูลในช่วงวันที่ที่เลือก', 'info')
            return
        }

        const timestamp = dayjs().format('YYYYMMDD_HHmm')
        const fileName = `Easy_Check_Export_${timestamp}`

        // --- EXPORT PROCESS ---
        try {
            if (exportFormat === 'excel') {
                exportToExcel(attendanceData, absenceData, eventsData, fileName)
            } else {
                exportToPDF(attendanceData, absenceData, eventsData, fileName, dateRange)
            }
        } catch (err) {
            console.error(err)
            Swal.fire('Error', 'เกิดข้อผิดพลาดในการส่งออกไฟล์', 'error')
        }
    }

    const exportToExcel = (att, abs, ev, fileName) => {
        const wb = XLSX.utils.book_new()
        let hasSheet = false

        if (att.length > 0) {
            const wsAtt = XLSX.utils.json_to_sheet(att)
            XLSX.utils.book_append_sheet(wb, wsAtt, "Attendance")
            hasSheet = true
        }
        if (abs.length > 0) {
            const wsAbs = XLSX.utils.json_to_sheet(abs)
            XLSX.utils.book_append_sheet(wb, wsAbs, "Leaves")
            hasSheet = true
        }
        if (ev.length > 0) {
            const wsEv = XLSX.utils.json_to_sheet(ev)
            XLSX.utils.book_append_sheet(wb, wsEv, "Events")
            hasSheet = true
        }

        if (hasSheet) {
            XLSX.writeFile(wb, `${fileName}.xlsx`)
            Swal.fire('สำเร็จ', `ดาวน์โหลดไฟล์ ${fileName}.xlsx แล้ว`, 'success')
        }
    }

    const exportToPDF = (att, abs, ev, fileName, range) => {
        const doc = new jsPDF()

        // --- 2. ลงทะเบียนฟอนต์ภาษาไทย ---
        // เพิ่มไฟล์เข้าไปในระบบไฟล์จำลอง (VFS) ของ jsPDF
        doc.addFileToVFS(`${fontName}.ttf`, fontBase64)
        // เพิ่มฟอนต์และกำหนดชื่อ
        doc.addFont(`${fontName}.ttf`, fontName, 'normal')
        // ตั้งค่าให้เป็นฟอนต์หลัก
        doc.setFont(fontName)

        doc.setFontSize(16) // ปรับขนาดขึ้นหน่อยเพราะสารบรรณตัวเล็ก
        doc.text(`รายงานข้อมูล: ${range.start} ถึง ${range.end}`, 14, 15)

        doc.setFontSize(12)
        doc.text(`สร้างเมื่อ: ${dayjs().format('DD/MM/YYYY HH:mm')}`, 14, 22)

        let currentY = 30

        // Helper function for location
        const formatLoc = (locObj) => {
            if (!locObj) return '-'

            // แปลงค่าเป็น Number ก่อนเสมอ เพื่อป้องกัน Error
            const lat = Number(locObj.lat || locObj.latitude)
            const lon = Number(locObj.lon || locObj.longitude)

            // เช็คว่าเป็นตัวเลขที่ถูกต้องหรือไม่ (ไม่เป็น NaN)
            if (!isNaN(lat) && !isNaN(lon)) {
                return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
            }

            return '-'
        }

        // 1. Attendance Table
        if (att.length > 0) {
            doc.setFontSize(12)
            doc.text('Attendance Records', 14, currentY)
            currentY += 5

            const tableData = att.map(r => [
                r.userId,
                dayjs(r.date).format('DD/MM/YYYY'),
                r.checkInTime || '-',
                r.checkOutTime || '-',
                formatLoc(r.checkInLocation),
                r.status || '-'
            ])

            autoTable(doc, {
                startY: currentY,
                head: [['User ID', 'Date', 'In', 'Out', 'GPS In', 'Status']],
                body: tableData,
                theme: 'grid',
                styles: {
                    font: fontName, // <--- สำคัญ
                    fontSize: 12
                },
                headStyles: { fillColor: [242, 102, 35] } // สีส้มตาม Theme
            })

            currentY = doc.lastAutoTable.finalY + 15
        }

        // 2. Absence Table
        if (abs.length > 0) {
            doc.setFontSize(12)
            doc.text('Absence History', 14, currentY)
            currentY += 5

            const tableData = abs.map(a => [
                a.userId,
                a.type,
                dayjs(a.startDate).format('DD/MM/YYYY'),
                a.endDate ? dayjs(a.endDate).format('DD/MM/YYYY') : '-',
                a.reason || '-'
            ])

            autoTable(doc, {
                startY: currentY,
                head: [['User ID', 'Type', 'Start', 'End', 'Reason']],
                body: tableData,
                theme: 'grid',
                styles: {
                    font: fontName, // <--- สำคัญ
                    fontSize: 12
                },
                headStyles: { fillColor: [220, 53, 69] } // สีแดง
            })

            currentY = doc.lastAutoTable.finalY + 15
        }

        // 3. Events Table
        if (ev.length > 0) {
            // Check if we need a new page
            if (currentY > 250) {
                doc.addPage()
                currentY = 20
            }

            doc.setFontSize(12)
            doc.text('Events', 14, currentY)
            currentY += 5

            const tableData = ev.map(e => [
                e.title,
                dayjs(e.date).format('DD/MM/YYYY'),
                e.time,
                e.location,
                `${e.registeredCount}/${e.quota}`
            ])

            autoTable(doc, {
                startY: currentY,
                head: [['Event', 'Date', 'Time', 'Location', 'Reg/Quota']],
                body: tableData,
                theme: 'grid',
                styles: {
                    font: fontName, // <--- สำคัญ
                    fontSize: 12
                },
                headStyles: { fillColor: [40, 167, 69] } // สีเขียว
            })
        }

        doc.save(`${fileName}.pdf`)
        Swal.fire('สำเร็จ', `ดาวน์โหลดไฟล์ ${fileName}.pdf แล้ว`, 'success')
    }

    return (
        <div className="export-data-container">
            <div className="header">
                <h2>ส่งออกข้อมูล</h2>
            </div>

            <div className="export-card">
                <form onSubmit={(e) => { e.preventDefault(); handleExport(); }}>
                    <div className="form-group">
                        <label>ประเภทข้อมูล</label>
                        <select
                            value={dataType}
                            onChange={(e) => setDataType(e.target.value)}
                            className="form-control"
                        >
                            <option value="attendance">ข้อมูลการเข้างาน</option>
                            <option value="gps">บันทึก GPS</option>
                            <option value="absence">รายงานการลา</option>
                            <option value="events">ข้อมูลกิจกรรม</option>
                            <option value="all">ทั้งหมด</option>
                        </select>
                    </div>

                    <div className="form-row-two">
                        <div className="form-group">
                            <label>วันที่เริ่มต้น</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label>วันที่สิ้นสุด</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="form-control"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>รูปแบบ</label>
                        <div className="format-options">
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    value="excel"
                                    checked={exportFormat === 'excel'}
                                    onChange={(e) => setExportFormat(e.target.value)}
                                />
                                <span>Excel (.xlsx)</span>
                            </label>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    value="pdf"
                                    checked={exportFormat === 'pdf'}
                                    onChange={(e) => setExportFormat(e.target.value)}
                                />
                                <span>PDF</span>
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-export">
                        <i className="bi bi-download"></i> ส่งออกข้อมูล
                    </button>
                </form>
            </div>

            <div className="info-section">
                <h3>สถานะการส่งออก</h3>
                <div className="info-box">
                    <p><strong>รูปแบบไฟล์:</strong> {exportFormat.toUpperCase()}</p>
                    <p><strong>ประเภทข้อมูล:</strong> {dataType.toUpperCase()}</p>
                    <p style={{ fontSize: '0.8rem', color: '#999' }}>*สำหรับ PDF หากเป็นภาษาไทยอาจต้องตั้งค่า Font เพิ่มเติม</p>
                </div>
            </div>
        </div>
    )
}

export default ExportData