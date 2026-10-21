import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { Calendar, MapPin, Clock, Users, CheckCircle, XCircle } from 'lucide-react'
import './EventRegistration.css'
import { useAuth } from '../../context/AuthContext'
import {
    getEvents,
    getRegisteredEvents,
    saveRegisteredEvents,
    updateEventParticipantCount,
    addNotification
} from '../../utils/storage'

function EventRegistration() {
    const [events, setEvents] = useState([])
    const [registeredEvents, setRegisteredEvents] = useState([]) // Array of Event IDs
    const { user } = useAuth()

    useEffect(() => {
        loadData()
    }, [user])

    const loadData = () => {
        // 1. Load Events
        const storedEvents = getEvents()
        setEvents(storedEvents || [])

        // 2. Load User's Registration Status
        const regMap = getRegisteredEvents() || {}
        const userId = user?.id || 'ANON'
        const userRegs = regMap[userId] || []
        setRegisteredEvents(userRegs)
    }

    const handleRegisterToggle = (event) => {
        const userId = user?.id || 'ANON'
        const isRegistered = registeredEvents.includes(event.id)

        // Validation: Check Quota (only if registering)
        if (!isRegistered && event.registered >= event.quota) {
            Swal.fire('เต็มแล้ว', 'กิจกรรมนี้มีผู้ลงทะเบียนครบจำนวนแล้ว', 'error')
            return
        }

        Swal.fire({
            title: isRegistered ? 'ยกเลิกการลงทะเบียน?' : 'ยืนยันการลงทะเบียน?',
            text: isRegistered ? 'คุณต้องการสละสิทธิ์เข้าร่วมกิจกรรมนี้' : `เข้าร่วม "${event.title}"`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            confirmButtonText: isRegistered ? 'ใช่, ยกเลิก' : 'ยืนยัน',
            cancelButtonText: 'ปิด'
        }).then((result) => {
            if (result.isConfirmed) {
                processRegistration(event, !isRegistered)
            }
        })
    }

    const processRegistration = (event, isJoining) => {
        const userId = user?.id || 'ANON'

        // 1. Update Global Event Count
        const updatedEventsList = updateEventParticipantCount(event.id, isJoining)
        setEvents(updatedEventsList) // Update UI immediately

        // 2. Update User's Personal List
        const regMap = getRegisteredEvents() || {}
        let userRegs = regMap[userId] || []

        if (isJoining) {
            userRegs.push(event.id)
        } else {
            userRegs = userRegs.filter(id => id !== event.id)
        }

        const newMap = { ...regMap, [userId]: userRegs }
        saveRegisteredEvents(newMap)
        setRegisteredEvents(userRegs)

        // 3. Send Notification
        if (isJoining) {
            addNotification(
                userId,
                'success',
                'ลงทะเบียนสำเร็จ',
                `คุณได้ลงทะเบียนเข้าร่วม "${event.title}" เรียบร้อยแล้ว`
            )
            Swal.fire('สำเร็จ', 'ลงทะเบียนเรียบร้อยแล้ว', 'success')
        } else {
            addNotification(
                userId,
                'info',
                'ยกเลิกสำเร็จ',
                `คุณได้ยกเลิกการเข้าร่วม "${event.title}"`
            )
            Swal.fire('เรียบร้อย', 'ยกเลิกการลงทะเบียนแล้ว', 'success')
        }
    }

    return (
        <div className="event-registration-container">
            <div className="event-header">
                <h2 className="event-title">ลงทะเบียนกิจกรรม</h2>
            </div>

            {events.length === 0 ? (
                <div className="no-events">
                    <p>ยังไม่มีกิจกรรมเปิดให้ลงทะเบียน</p>
                    <small>โปรดติดตามประกาศจาก Admin</small>
                </div>
            ) : (
                <div className="events-list">
                    {events.map((event) => {
                        const isRegistered = registeredEvents.includes(event.id)
                        const isFull = event.registered >= event.quota

                        return (
                            <div key={event.id} className={`event-card ${isRegistered ? 'registered' : ''}`}>
                                <div className="event-header-info">
                                    <h3 className="event-name">{event.title}</h3>
                                    {isRegistered && (
                                        <span className="registered-badge">
                                            <CheckCircle size={14} /> ลงทะเบียนแล้ว
                                        </span>
                                    )}
                                </div>

                                <div className="event-details">
                                    <p><Calendar size={18} /> <strong>วันที่:</strong> {new Date(event.date).toLocaleDateString('th-TH')}</p>
                                    <p><Clock size={18} /> <strong>เวลา:</strong> {event.time || '-'}</p>
                                    <p><MapPin size={18} /> <strong>สถานที่:</strong> {event.location}</p>
                                    <p><Users size={18} /> <strong>ที่นั่ง:</strong> {event.registered} / {event.quota}</p>
                                </div>

                                {event.description && (
                                    <div className="event-description">
                                        <p>{event.description}</p>
                                    </div>
                                )}

                                <div className="quota-bar">
                                    <div
                                        className="quota-fill"
                                        style={{
                                            width: `${(event.registered / event.quota) * 100}%`,
                                            backgroundColor: isFull && !isRegistered ? '#ef4444' : '#f97316'
                                        }}
                                    ></div>
                                </div>

                                <button
                                    className={`btn btn-register ${isRegistered ? 'btn-cancel' : 'btn-join'}`}
                                    onClick={() => handleRegisterToggle(event)}
                                    disabled={!isRegistered && isFull}
                                    style={{ opacity: (!isRegistered && isFull) ? 0.6 : 1 }}
                                >
                                    {isRegistered ? (
                                        <>
                                            <XCircle size={18} /> ยกเลิกการลงทะเบียน
                                        </>
                                    ) : (
                                        <>
                                            {isFull ? 'ที่นั่งเต็ม' : <><CheckCircle size={18} /> ลงทะเบียน</>}
                                        </>
                                    )}
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default EventRegistration