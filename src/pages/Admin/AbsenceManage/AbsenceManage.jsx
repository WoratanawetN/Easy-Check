import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { CheckCircle, XCircle, Clock, FileText, User, Calendar } from 'lucide-react'
import { getAbsenceRequests, updateAbsenceStatus, addNotification } from '../../../utils/storage'
import { useAuth } from '../../../context/AuthContext'
import './AbsenceManage.css'

function AbsenceManage() {
    const { user } = useAuth()
    const [requests, setRequests] = useState([])
    const [filter, setFilter] = useState('pending') // pending, approved, rejected, all

    useEffect(() => {
        loadRequests()
    }, [])

    const loadRequests = () => {
        const data = getAbsenceRequests()
        setRequests(data)
    }

    const handleAction = (request, status) => {
        const isApprove = status === 'approved'
        const actionText = isApprove ? 'อนุมัติ' : 'ไม่อนุมัติ'
        const confirmColor = isApprove ? '#22c55e' : '#ef4444'

        Swal.fire({
            title: `ยืนยันการ${actionText}?`,
            text: `คุณต้องการ${actionText}คำร้องของ "${request.userName}" ใช่หรือไม่?`,
            icon: isApprove ? 'question' : 'warning',
            showCancelButton: true,
            confirmButtonColor: confirmColor,
            confirmButtonText: `ยืนยัน${actionText}`,
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                // 1. Update Status in Storage
                updateAbsenceStatus(request.id, status, user.name)

                // 1.1 Prepare Notification
                const requestTypeMap = {
                    sick: 'ลาป่วย',
                    annual: 'ลาพักร้อน',
                    personal: 'ลากิจ',
                    other: 'อื่นๆ'
                }

                // 2. Send Notification to User
                const notifTitle = `ผลการขอลา: ${actionText}`
                const notifMsg = `คำขอลาของคุณ (${requestTypeMap[request.type]}) วันที่ ${request.startDate} ได้รับการพิจารณาแล้ว ผลคือ: ${actionText}`
                const notifType = isApprove ? 'success' : 'error'

                addNotification(request.userId, notifType, notifTitle, notifMsg)

                // 3. Refresh UI
                loadRequests()
                Swal.fire('เรียบร้อย', `ดำเนินการ${actionText}แล้ว`, 'success')
            }
        })
    }

    // Filter logic
    const filteredRequests = requests.filter(r => {
        if (filter === 'all') return true
        return r.status === filter
    })

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return <span className="status-badge approved"><CheckCircle size={14} /> อนุมัติแล้ว</span>
            case 'rejected': return <span className="status-badge rejected"><XCircle size={14} /> ไม่อนุมัติ</span>
            default: return <span className="status-badge pending"><Clock size={14} /> รอตรวจสอบ</span>
        }
    }

    return (
        <div className="absence-manage-container">
            <div className="header">
                <h2>จัดการคำขอลา</h2>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button className={`tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>รออนุมัติ</button>
                <button className={`tab ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>อนุมัติแล้ว</button>
                <button className={`tab ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>ถูกปฏิเสธ</button>
                <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>ทั้งหมด</button>
            </div>

            <div className="requests-list">
                {filteredRequests.length === 0 ? (
                    <div className="empty-state">ไม่มีรายการคำร้องในสถานะนี้</div>
                ) : (
                    filteredRequests.map(req => (
                        <div key={req.id} className={`request-card status-${req.status}`}>
                            <div className="req-header">
                                <div className="user-info">
                                    <User size={20} className="text-orange-500" />
                                    <span className="user-name">{req.userName}</span>
                                    <span className="req-id">#{req.userId}</span>
                                </div>
                                {getStatusBadge(req.status)}
                            </div>

                            <div className="req-body">
                                <div className="req-row">
                                    <span className="label">ประเภท:</span>
                                    <span className="value font-bold">{req.type === 'sick' ? 'ลาป่วย' : req.type === 'annual' ? 'ลาพักร้อน' : req.type === 'personal' ? 'ลากิจ' : 'อื่นๆ'}</span>
                                </div>
                                <div className="req-row">
                                    <span className="label">วันที่:</span>
                                    <span className="value flex items-center gap-1">
                                        <Calendar size={14} /> {req.startDate} {req.endDate !== req.startDate && ` - ${req.endDate}`}
                                    </span>
                                </div>
                                <div className="req-reason">
                                    <span className="label">เหตุผล:</span>
                                    <p>{req.reason}</p>
                                </div>
                                {req.attachmentCount > 0 && (
                                    <div className="req-files">
                                        <FileText size={14} /> แนบไฟล์มา {req.attachmentCount} รายการ
                                    </div>
                                )}
                            </div>

                            <div className="req-footer">
                                <small className="timestamp">ส่งเมื่อ: {req.timestamp}</small>

                                {req.status === 'pending' && (
                                    <div className="actions">
                                        <button className="btn-approve" onClick={() => handleAction(req, 'approved')}>
                                            อนุมัติ
                                        </button>
                                        <button className="btn-reject" onClick={() => handleAction(req, 'rejected')}>
                                            ปฏิเสธ
                                        </button>
                                    </div>
                                )}

                                {req.status !== 'pending' && (
                                    <div className="approver-info">
                                        ดำเนินการโดย: {req.approver || 'Admin'}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default AbsenceManage