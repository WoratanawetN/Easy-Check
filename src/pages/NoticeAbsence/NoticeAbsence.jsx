import { useState } from 'react'
import Swal from 'sweetalert2'
import { Calendar, FileText, Send, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { addAbsenceRequest } from '../../utils/storage'
import './NoticeAbsence.css'

function NoticeAbsence() {
    const { user } = useAuth()
    const [absenceType, setAbsenceType] = useState('sick')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [reason, setReason] = useState('')
    const [attachmentCount, setAttachmentCount] = useState(0)

    const handleFileChange = (e) => {
        setAttachmentCount(e.target.files.length)
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!startDate || !reason) {
            Swal.fire('ข้อมูลไม่ครบ', 'กรุณาระบุวันที่และเหตุผล', 'warning')
            return
        }

        const requestData = {
            userId: user?.id || 'ANON',
            userName: user?.name || 'พนักงานทั่วไป',
            type: absenceType,
            startDate,
            endDate: endDate || startDate, // Default to same day if empty
            reason,
            attachmentCount
        }

        // Save to central storage
        addAbsenceRequest(requestData)

        Swal.fire({
            icon: 'success',
            title: 'ส่งคำร้องสำเร็จ',
            text: 'คำร้องของคุณถูกส่งไปยังผู้ดูแลระบบแล้ว',
            confirmButtonColor: '#f97316'
        })

        // Reset Form
        setAbsenceType('sick')
        setStartDate('')
        setEndDate('')
        setReason('')
        setAttachmentCount(0)
    }

    return (
        <div className="notice-absence-container">
            <div className="notice-card">
                <h2 className="notice-title">แจ้งลา/ขาดงาน</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group mb-3">
                        <label className="form-label">ประเภทการลา</label>
                        <select
                            className="form-select"
                            value={absenceType}
                            onChange={(e) => setAbsenceType(e.target.value)}
                        >
                            <option value="sick">ลาป่วย (Sick Leave)</option>
                            <option value="annual">ลาพักร้อน (Annual Leave)</option>
                            <option value="personal">ลากิจ (Personal Leave)</option>
                            <option value="other">อื่นๆ (Other)</option>
                        </select>
                    </div>

                    <div className="form-group mb-3">
                        <label className="form-label">วันที่เริ่มต้น</label>
                        <input
                            type="date"
                            className="form-control"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group mb-3">
                        <label className="form-label">วันที่สิ้นสุด</label>
                        <input
                            type="date"
                            className="form-control"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    <div className="form-group mb-3">
                        <label className="form-label">เหตุผล</label>
                        <textarea
                            className="form-control"
                            rows="4"
                            placeholder="ระบุสาเหตุการลา..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        ></textarea>
                    </div>

                    <div className="form-group mb-3">
                        <label className="form-label">แนบเอกสาร (ถ้ามี)</label>
                        <div className="file-input-wrapper">
                            <input
                                type="file"
                                className="form-control"
                                multiple
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-submit w-100">
                        <Send size={18} /> ส่งคำร้องขอ
                    </button>
                </form>
            </div>
        </div>
    )
}

export default NoticeAbsence