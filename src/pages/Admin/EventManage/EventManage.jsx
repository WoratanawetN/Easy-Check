import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { Calendar, MapPin, Users, Edit, Trash2, Plus, Save, X } from 'lucide-react'
import { getEvents, saveEvents } from '../../../utils/storage'
import './EventManage.css'

function EventManage() {
    const [events, setEvents] = useState([])
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState({
        title: '',
        date: '',
        time: '',
        location: '',
        quota: 50,
        description: ''
    })

    // Load events on mount
    useEffect(() => {
        loadEvents()
    }, [])

    const loadEvents = () => {
        const stored = getEvents()
        setEvents(stored)
    }

    const handleAdd = (e) => {
        e.preventDefault()
        if (!form.title || !form.date) {
            Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อและวันที่', 'warning')
            return
        }

        const newEvent = {
            id: Date.now(), // Unique ID
            ...form,
            registered: 0
        }

        const updatedEvents = [...events, newEvent]
        setEvents(updatedEvents)
        saveEvents(updatedEvents)

        setForm({ title: '', date: '', time: '', location: '', quota: 50, description: '' })
        Swal.fire('สำเร็จ', 'เพิ่มกิจกรรมเรียบร้อยแล้ว', 'success')
    }

    const handleDelete = (id) => {
        Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "ข้อมูลผู้ลงทะเบียนในกิจกรรมนี้อาจสูญหาย",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'ลบเลย'
        }).then((result) => {
            if (result.isConfirmed) {
                const updated = events.filter(e => e.id !== id)
                setEvents(updated)
                saveEvents(updated)
                Swal.fire('ลบแล้ว!', 'กิจกรรมถูกลบออกจากระบบ', 'success')
            }
        })
    }

    const handleEdit = (event) => {
        setEditingId(event.id)
        setForm({
            title: event.title,
            date: event.date,
            time: event.time || '',
            location: event.location,
            quota: event.quota,
            description: event.description || ''
        })
    }

    const handleSaveEdit = (e) => {
        e.preventDefault()
        const updatedEvents = events.map(ev =>
            ev.id === editingId ? { ...ev, ...form } : ev
        )
        setEvents(updatedEvents)
        saveEvents(updatedEvents)

        setEditingId(null)
        setForm({ title: '', date: '', time: '', location: '', quota: 50, description: '' })
        Swal.fire('บันทึกแล้ว', 'แก้ไขข้อมูลสำเร็จ', 'success')
    }

    return (
        <div className="event-manage-container">
            <div className="header">
                <h2>จัดการกิจกรรม</h2>
            </div>

            {/* Add/Edit Form */}
            <div className="event-form">
                <h3>{editingId ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรมใหม่'}</h3>
                <form onSubmit={editingId ? handleSaveEdit : handleAdd}>
                    <div className="form-group">
                        <label>ชื่อกิจกรรม</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="form-control"
                            placeholder="เช่น อบรมความปลอดภัย"
                        />
                    </div>

                    <div className="form-row-two">
                        <div className="form-group">
                            <label>วันที่</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>เวลา</label>
                            <input
                                type="text"
                                value={form.time}
                                onChange={(e) => setForm({ ...form, time: e.target.value })}
                                className="form-control"
                                placeholder="09:00 - 12:00"
                            />
                        </div>
                    </div>

                    <div className="form-row-two">
                        <div className="form-group">
                            <label>สถานที่</label>
                            <input
                                type="text"
                                value={form.location}
                                onChange={(e) => setForm({ ...form, location: e.target.value })}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label>จำนวนรับ (คน)</label>
                            <input
                                type="number"
                                value={form.quota}
                                onChange={(e) => setForm({ ...form, quota: parseInt(e.target.value) })}
                                className="form-control"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>รายละเอียดเพิ่มเติม</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="form-control"
                            rows="3"
                        ></textarea>
                    </div>

                    <button type="submit" className="btn btn-submit">
                        {editingId ? <><Save size={18} /> บันทึกการแก้ไข</> : <><Plus size={18} /> เพิ่มกิจกรรม</>}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            className="btn btn-cancel"
                            onClick={() => {
                                setEditingId(null)
                                setForm({ title: '', date: '', time: '', location: '', quota: 50, description: '' })
                            }}
                        >
                            <X size={18} /> ยกเลิก
                        </button>
                    )}
                </form>
            </div>

            {/* Events List */}
            <div className="events-manage">
                <h3>รายการกิจกรรมทั้งหมด ({events.length})</h3>
                {events.length === 0 ? (
                    <p className="no-events">ยังไม่มีกิจกรรม</p>
                ) : (
                    <div className="events-list-manage">
                        {events.map((event) => (
                            <div key={event.id} className="event-card-manage">
                                <div className="event-details">
                                    <h4>{event.title}</h4>
                                    <p><Calendar size={16} /> {new Date(event.date).toLocaleDateString('th-TH')} | {event.time}</p>
                                    <p><MapPin size={16} /> {event.location}</p>
                                    <p><Users size={16} /> ลงทะเบียนแล้ว: {event.registered} / {event.quota}</p>
                                </div>
                                <div className="actions">
                                    <button className="btn btn-edit" onClick={() => handleEdit(event)}>
                                        <Edit size={16} /> แก้ไข
                                    </button>
                                    <button className="btn btn-delete" onClick={() => handleDelete(event.id)}>
                                        <Trash2 size={16} /> ลบ
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default EventManage