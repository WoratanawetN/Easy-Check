import { useState } from 'react'
import './WorkTable.css'

function WorkTable() {
    const [shifts, setShifts] = useState([
        { id: 1, name: 'กะเช้า', startTime: '08:00', endTime: '16:00', employees: 50 },
        { id: 2, name: 'กะบ่าย', startTime: '16:00', endTime: '00:00', employees: 40 },
        { id: 3, name: 'กะดึก', startTime: '00:00', endTime: '08:00', employees: 30 }
    ])

    const [newShift, setNewShift] = useState({ name: '', startTime: '', endTime: '' })

    const handleAddShift = (e) => {
        e.preventDefault()
        if (!newShift.name || !newShift.startTime || !newShift.endTime) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน')
            return
        }

        const shift = {
            id: shifts.length + 1,
            ...newShift,
            employees: 0
        }

        setShifts([...shifts, shift])
        setNewShift({ name: '', startTime: '', endTime: '' })
    }

    const handleDeleteShift = (id) => {
        setShifts(shifts.filter(shift => shift.id !== id))
    }

    return (
        <div className="work-table-container">
            <div className="work-table-header">
                <h2>จัดการตารางงาน</h2>
            </div>

            {/* Add Shift Form */}
            <div className="add-shift-form">
                <h3>เพิ่มกะงานใหม่</h3>
                <form onSubmit={handleAddShift}>
                    <div className="form-row">
                        <input
                            type="text"
                            placeholder="ชื่อกะ"
                            value={newShift.name}
                            onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                            className="form-control"
                        />
                    </div>
                    <div className="form-row">
                        <input
                            type="time"
                            value={newShift.startTime}
                            onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                            className="form-control"
                        />
                        <span className="time-separator">ถึง</span>
                        <input
                            type="time"
                            value={newShift.endTime}
                            onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                            className="form-control"
                        />
                    </div>
                    <button type="submit" className="btn btn-add">เพิ่มกะงาน</button>
                </form>
            </div>

            {/* Shifts List */}
            <div className="shifts-list">
                <h3>กะงานที่มี</h3>
                {shifts.map((shift) => (
                    <div key={shift.id} className="shift-card">
                        <div className="shift-info">
                            <h4>{shift.name}</h4>
                            <p className="shift-time">
                                <i className="bi bi-clock"></i> {shift.startTime} - {shift.endTime}
                            </p>
                            <p className="shift-employees">
                                <i className="bi bi-people"></i> จำนวนพนักงาน: {shift.employees} คน
                            </p>
                        </div>
                        <button
                            className="btn btn-delete"
                            onClick={() => handleDeleteShift(shift.id)}
                        >
                            ลบ
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default WorkTable
