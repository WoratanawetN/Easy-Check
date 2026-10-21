import { useState, useEffect } from 'react'
import './SetPermission.css'
import { getUsers, saveUsers } from '../../../utils/storage'
import Swal from 'sweetalert2' // 1. Import SweetAlert2

function SetPermission() {
    const [users, setUsers] = useState([])

    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', status: 'active' })

    useEffect(() => {
        const u = getUsers() || []
        setUsers(u)
    }, [])

    const handleEdit = (user) => {
        setEditingId(user.id)
        setForm({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            status: user.status
        })
    }

    const handleSave = () => {
        // require name and email
        if (!form.name || !form.email) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบถ้วน',
                text: 'กรุณากรอกชื่อและอีเมล',
                confirmButtonText: 'ตกลง'
            })
            return
        }
        const next = users.map(u => {
            if (u.id !== editingId) return u
            return {
                ...u,
                name: form.name,
                email: form.email,
                role: form.role,
                status: form.status,
                password: form.password ? form.password : u.password
            }
        })
        setUsers(next)
        saveUsers(next)
        setEditingId(null)
        setForm({ name: '', email: '', password: '', role: 'employee', status: 'active' })

        // Success Alert for Edit
        Swal.fire({
            icon: 'success',
            title: 'บันทึกสำเร็จ',
            text: 'แก้ไขข้อมูลเรียบร้อยแล้ว',
            timer: 1500,
            showConfirmButton: false
        })
    }

    const handleDelete = (id) => {
        // เปลี่ยนจาก window.confirm เป็น Swal
        Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "คุณจะไม่สามารถกู้คืนข้อมูลผู้ใช้นี้ได้!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                const next = users.filter(u => u.id !== id)
                setUsers(next)
                saveUsers(next)
                Swal.fire(
                    'ลบสำเร็จ!',
                    'ผู้ใช้ถูกลบออกจากระบบแล้ว',
                    'success'
                )
            }
        })
    }

    // --- ส่วนที่แก้ไขตามคำขอ (สร้างบัญชีพนักงานใหม่) ---
    const handleAdd = () => {
        if (!form.name || !form.email || !form.password) {
            // แจ้งเตือนเมื่อกรอกข้อมูลไม่ครบ
            Swal.fire({
                icon: 'error',
                title: 'ข้อมูลไม่ครบถ้วน',
                text: 'กรุณากรอกชื่อ อีเมล และรหัสผ่านให้ครบ',
                confirmButtonText: 'ตกลง'
            })
            return
        }

        // generate id in EMP### pattern
        const empIds = users
            .map(u => (typeof u.id === 'string' ? u.id.match(/^EMP(\d+)$/) : null))
            .filter(m => m)
            .map(m => parseInt(m[1], 10))
        const nextNum = empIds.length ? Math.max(...empIds) + 1 : 1
        const id = `EMP${String(nextNum).padStart(3, '0')}`

        const newUser = { id, name: form.name, email: form.email, password: form.password, role: form.role, status: form.status }
        const next = [...users, newUser]

        setUsers(next)
        saveUsers(next)
        setForm({ name: '', email: '', password: '', role: 'employee', status: 'active' })

        // แจ้งเตือนเมื่อสร้างสำเร็จ
        Swal.fire({
            icon: 'success',
            title: 'เพิ่มผู้ใช้สำเร็จ',
            text: `เพิ่มพนักงาน ${newUser.name} เรียบร้อยแล้ว`,
            timer: 2000,
            showConfirmButton: false
        })
    }

    // Modal state for custom password reset
    const [resetModalOpen, setResetModalOpen] = useState(false)
    const [resetTarget, setResetTarget] = useState({ id: null, name: '' })
    const [resetPasswordValue, setResetPasswordValue] = useState('')

    const openResetModal = (user) => {
        setResetTarget({ id: user.id, name: user.name })
        setResetPasswordValue('')
        setResetModalOpen(true)
    }

    const closeResetModal = () => {
        setResetModalOpen(false)
        setResetTarget({ id: null, name: '' })
        setResetPasswordValue('')
    }

    const handleConfirmReset = () => {
        if (!resetPasswordValue) {
            Swal.fire({
                icon: 'warning',
                title: 'ระวัง',
                text: 'กรุณากรอกรหัสผ่านใหม่',
            })
            return
        }
        const next = users.map(u => {
            if (u.id !== resetTarget.id) return u
            return { ...u, password: resetPasswordValue }
        })
        setUsers(next)
        saveUsers(next)
        closeResetModal()

        Swal.fire({
            icon: 'success',
            title: 'รีเซ็ตรหัสผ่านสำเร็จ',
            text: `เปลี่ยนรหัสผ่านสำหรับ ${resetTarget.name} แล้ว`,
            timer: 1500,
            showConfirmButton: false
        })
    }

    return (
        <div className="set-permission-container">
            <div className="header">
                <h2>จัดการสิทธิ์การเข้าถึง</h2>
                <p className="header-subtitle">เฉพาะ SuperAdmin เท่านั้น</p>
            </div>

            {/* Add New User */}
            <div className="add-user-section">
                <h3>เพิ่มผู้ใช้ใหม่</h3>
                <form className="add-user-form" onSubmit={(e) => { e.preventDefault(); handleAdd() }}>
                    <div className="form-perm-group">
                        <label>ชื่อ</label>
                        <input type="text" className="form-perm-control" placeholder="ชื่อ นามสกุล" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>

                    <div className="form-perm-group">
                        <label>Email</label>
                        <input type="email" className="form-perm-control" placeholder="example@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>

                    <div className="form-perm-row-two">
                        <div className="form-perm-group">
                            <label>รหัสผ่าน</label>
                            <input type="password" className="form-perm-control" placeholder="กำหนดรหัสผ่าน" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                        </div>

                        <div className="form-perm-group">
                            <label>บทบาท</label>
                            <select className="form-perm-control" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                <option value="employee">พนักงาน</option>
                                <option value="admin">ผู้ดูแลระบบ</option>
                                <option value="superadmin">ผู้ดูแลระบบสูงสุด</option>
                            </select>
                        </div>

                        <div className="form-perm-group">
                            <label>สถานะ</label>
                            <select className="form-perm-control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-add-user">
                        <i className="bi bi-plus-circle"></i> เพิ่มผู้ใช้
                    </button>
                </form>
            </div>

            {/* Users List */}
            <div className="users-section">
                <h3>รายการผู้ใช้</h3>
                {users.length === 0 ? (
                    <p className="no-users">ไม่มีผู้ใช้</p>
                ) : (
                    <div className="users-list">
                        {users.map((user) => (
                            <div key={user.id} className="user-card">
                                {editingId === user.id ? (
                                    // Edit Mode
                                    <div className="edit-form">
                                        <div className="form-perm-group">
                                            <label>ชื่อ</label>
                                            <input
                                                type="text"
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                className="form-perm-control"
                                            />
                                        </div>

                                        <div className="form-perm-group">
                                            <label>Email</label>
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                className="form-perm-control"
                                            />
                                        </div>

                                        <div className="form-perm-row-two">
                                            <div className="form-perm-group">
                                                <label>บทบาท</label>
                                                <select
                                                    value={form.role}
                                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                                    className="form-perm-control"
                                                >
                                                    <option value="employee">พนักงาน</option>
                                                    <option value="admin">ผู้ดูแลระบบ</option>
                                                    <option value="superadmin">ผู้ดูแลระบบสูงสุด</option>
                                                </select>
                                            </div>

                                            <div className="form-perm-group">
                                                <label>สถานะ</label>
                                                <select
                                                    value={form.status}
                                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                                    className="form-perm-control"
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="edit-actions">
                                            <button
                                                type="button"
                                                className="btn btn-save"
                                                onClick={handleSave}
                                            >
                                                บันทึก
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-cancel"
                                                onClick={() => setEditingId(null)}
                                            >
                                                ยกเลิก
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // View Mode
                                    <>
                                        <div className="user-info row">
                                            <h4>{user.id}</h4>
                                            <p><b>ชื่อจริง:</b> {user.name}</p>
                                            <p><b>อีเมล:</b> {user.email}</p>
                                            <div className="user-meta">
                                                <span className={`role-badge role-${user.role}`}>{user.role === 'employee' ? 'พนักงาน' : user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ดูแลระบบสูงสุด'}</span>
                                                <span className={`status-badge status-${user.status}`}>{user.status === 'active' ? 'Active' : 'Inactive'}</span>
                                            </div>
                                        </div>

                                        <div className="user-actions">
                                            <button
                                                className="btn btn-edit"
                                                onClick={() => handleEdit(user)}
                                            >
                                                แก้ไข
                                            </button>
                                            <button
                                                className="btn btn-delete"
                                                onClick={() => handleDelete(user.id)}
                                            >
                                                ลบ
                                            </button>
                                            <button
                                                className="btn btn-reset"
                                                onClick={() => openResetModal(user)}
                                            >
                                                รีเซ็ตรหัสผ่าน
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Reset Password Modal */}
            {resetModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <h4>รีเซ็ตรหัสผ่านสำหรับ {resetTarget.name}</h4>
                        <div className="form-perm-group">
                            <label>รหัสผ่านใหม่</label>
                            <input
                                type="text"
                                className="form-perm-control"
                                value={resetPasswordValue}
                                onChange={(e) => setResetPasswordValue(e.target.value)}
                                placeholder="กรอกรหัสผ่านใหม่"
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={closeResetModal}>ยกเลิก</button>
                            <button className="btn btn-primary" onClick={handleConfirmReset}>ยืนยันรีเซ็ต</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SetPermission