import { createContext, useContext, useState, useEffect } from 'react'
import { getUsers } from '../utils/storage'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Load user from localStorage on mount
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser))
            } catch (error) {
                console.error('Failed to parse user data:', error)
                localStorage.removeItem('user')
            }
        }
        setLoading(false)
    }, [])

    // Attempt to login using stored users. Returns { success, user?, message? }
    const login = (employeeId, password) => {
        const users = getUsers() || []
        const found = users.find(u => String(u.id) === String(employeeId))

        // If user exists in storage
        if (found) {
            // prevent login if user marked inactive
            if (found.status && found.status !== 'active') {
                return { success: false, message: 'บัญชีผู้ใช้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ' }
            }
            // If stored password exists, require match. Otherwise accept demo default '1234'.
            const expected = found.password || '1234'
            if (String(password) === String(expected)) {
                const userData = {
                    id: found.id,
                    role: found.role || 'employee',
                    name: found.name || found.id,
                    loginTime: new Date().toISOString()
                }
                setUser(userData)
                localStorage.setItem('user', JSON.stringify(userData))
                return { success: true, user: userData }
            }
            return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' }
        }

        // If not found in stored users, allow fallback for demo ids EMP001/EMP002/EMP003
        const demoPasswords = ['1234']
        if (demoPasswords.includes(String(password))) {
            const userData = {
                id: employeeId,
                role: 'employee',
                loginTime: new Date().toISOString()
            }
            setUser(userData)
            localStorage.setItem('user', JSON.stringify(userData))
            return { success: true, user: userData }
        }

        return { success: false, message: 'ไม่พบผู้ใช้' }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('user')
    }

    const isAuthenticated = () => {
        return user !== null
    }

    const hasRole = (requiredRole) => {
        if (!user) return false
        const roleHierarchy = { employee: 1, admin: 2, superadmin: 3 }
        return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
    }

    const hasAnyRole = (roles) => {
        if (!user) return false
        return roles.includes(user.role)
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                loading,
                isAuthenticated,
                hasRole,
                hasAnyRole
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
