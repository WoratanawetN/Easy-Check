import { Outlet, useLocation } from 'react-router-dom'

import Header from '../Header/Header'
import Navbar from '../Navbar/Navbar'

import './Layout.css'


function Layout() {
    const location = useLocation()
    const isLoginPage = location.pathname === '/login'

    return (
        <div className="layout-wrapper">
            {!isLoginPage && <Header />}
            <div className={`layout-content ${isLoginPage ? 'login' : 'default'}`}>
                <Outlet />
            </div>
            {!isLoginPage && <Navbar />}
        </div>
    )
}

export default Layout