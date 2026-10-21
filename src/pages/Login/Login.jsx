import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Login.css'

// Demo credentials
const DEMO_USERS = {
    'EMP001': { password: '1234', role: 'employee', name: 'นายจอห์น ดู' },
    'EMP002': { password: '1234', role: 'admin', name: 'นางสาวมาลี' },
    'EMP003': { password: '1234', role: 'superadmin', name: 'นายสมิทธ์' }
}

function Login() {
    const [employeeId, setEmployeeId] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [selectedRole, setSelectedRole] = useState('employee')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { login, isAuthenticated } = useAuth()

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated()) {
            navigate('/')
        }
    }, [isAuthenticated, navigate])

    const handleLogin = (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        // Validate input
        if (!employeeId || !password) {
            setError('กรุณากรอกรหัสพนักงานและรหัสผ่านให้ครบถ้วน')
            setLoading(false)
            return
        }

        // Simulate API call delay
        setTimeout(() => {
            const result = login(employeeId, password)
            if (result.success) {
                const role = result.user.role
                if (role === 'superadmin') {
                    navigate('/superadmin/set-permission')
                } else if (role === 'admin') {
                    navigate('/dashboard')
                } else {
                    navigate('/')
                }
            } else {
                setError(result.message || 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง')
                setLoading(false)
            }
        }, 400)
    }

    const handleDemoLogin = (demoId, demoRole) => {
        setEmployeeId(demoId)
        setPassword(DEMO_USERS[demoId].password)
        setSelectedRole(demoRole)
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-title flex items-center gap-2 cursor-pointer">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                        EC
                    </div>
                    <h4 className="text-l font-bold text-gray-800 hidden md:block" style={{ color: 'black', fontWeight: 'bold' }}>
                        Easy Check
                    </h4>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="form-group mb-3">
                        <label className="form-label">รหัสพนักงาน</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="กรอกรหัสพนักงาน"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group mb-3">
                        <label className="form-label">รหัสผ่าน</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="กรอกรหัสผ่าน"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="alert alert-danger mb-3">
                            <i className="bi bi-exclamation-circle"></i> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-login w-100 mb-3"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <i className="bi bi-hourglass-split"></i> กำลังเข้าสู่ระบบ...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-box-arrow-in-right"></i> เข้าสู่ระบบ
                            </>
                        )}
                    </button>
                </form>

                {/* Demo Accounts [ เมื่อใช้งานให้ลบ */}
                <div className="demo-section">
                    <p className="demo-title">
                        <i className="bi bi-info-circle"></i> บัญชีสำหรับทดสอบ
                    </p>
                    <div className="demo-buttons">
                        <button
                            type="button"
                            className="demo-btn employee"
                            onClick={() => handleDemoLogin('EMP001', 'employee')}
                            title="พนักงานทั่วไป"
                        >
                            <i className="bi bi-person"></i>
                            <span>Employee</span>
                        </button>
                        <button
                            type="button"
                            className="demo-btn admin"
                            onClick={() => handleDemoLogin('EMP002', 'admin')}
                            title="ผู้ดูแลระบบ"
                        >
                            <i className="bi bi-shield-check"></i>
                            <span>Admin</span>
                        </button>
                        <button
                            type="button"
                            className="demo-btn superadmin"
                            onClick={() => handleDemoLogin('EMP003', 'superadmin')}
                            title="ผู้ดูแลระบบสูงสุด"
                        >
                            <i className="bi bi-star-fill"></i>
                            <span>SuperAdmin</span>
                        </button>
                    </div>
                    <small className="demo-note">
                        (รหัสผ่าน: 1234)
                    </small>
                </div>

                <p className="text-center mt-4">
                    <a href="#" className="forgot-password">ลืมรหัสผ่าน?</a>
                </p>
            </div>
        </div>
    )
}

export default Login
