import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const ProtectedRoute = ({ children, requiredRole = null }) => {
    const { isAuthenticated, hasRole, loading } = useAuth()

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    fontSize: '1.2rem',
                    color: '#999'
                }}
            >
                <div>
                    <i className="bi bi-hourglass-split" style={{ fontSize: '2rem', marginRight: '1rem' }}></i>
                    กำลังโหลด...
                </div>
            </div>
        )
    }

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />
    }

    if (requiredRole && !hasRole(requiredRole)) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    flexDirection: 'column',
                    gap: '1rem',
                    textAlign: 'center'
                }}
            >
                <i className="bi bi-exclamation-triangle" style={{ fontSize: '3rem', color: '#F26623' }}></i>
                <h2>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
                <p>กรุณาติดต่อผู้ดูแลระบบ</p>
            </div>
        )
    }

    return children
}
