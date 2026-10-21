import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

import Layout from './layouts/Layout/Layout'

// Employee Pages
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import Profile from './pages/Profile/Profile'
import Setting from './pages/Setting/Setting'
import Notification from './pages/Notification/Notification'
import CheckWorkTime from './pages/CheckWorkTime/CheckWorkTime'
import NoticeAbsence from './pages/NoticeAbsence/NoticeAbsence'
import EventRegistration from './pages/EventRegistration/EventRegistration'

// Admin Pages
import Dashboard from './pages/Dashboard/Dashboard'
import GPSCheck from './pages/Admin/GPSCheck/GPSCheck'
import WorkTable from './pages/Admin/WorkTable/WorkTable'
import SetArea from './pages/Admin/SetArea/SetArea'
import SendNotifications from './pages/Admin/SendNotifications/SendNotifications'
import ExportData from './pages/Admin/ExportData/ExportData'
import SummaryReport from './pages/Admin/SummaryReport/SummaryReport'
import EventManage from './pages/Admin/EventManage/EventManage'
import AbsenceManage from './pages/Admin/AbsenceManage/AbsenceManage'
import SetPermission from './pages/SuperAdmin/SetPermission/SetPermission'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.min.css'

import './App.css'

function App() {
  const { loading, user } = useAuth()

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

  // Determine home page based on user role
  const getHomePage = () => {
    if (!user) return <Home />
    if (user.role === 'admin' || user.role === 'superadmin') {
      return <Dashboard />
    }
    return <Home />
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* All routes within Layout */}
        <Route element={<Layout />}>
          {/* Login Route - Public */}
          <Route path='/login' element={<Login />} />

          {/* Home Route - Dynamic based on role */}
          <Route
            path='/'
            element={
              <ProtectedRoute>
                {getHomePage()}
              </ProtectedRoute>
            }
          />
          <Route
            path='/home'
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path='/notice-absence'
            element={
              <ProtectedRoute>
                <NoticeAbsence />
              </ProtectedRoute>
            }
          />
          <Route
            path='/profile'
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path='/notifications'
            element={
              <ProtectedRoute>
                <Notification />
              </ProtectedRoute>
            }
          />
          <Route
            path='/settings'
            element={
              <ProtectedRoute>
                <Setting />
              </ProtectedRoute>
            }
          />
          <Route
            path='/check-work-time'
            element={
              <ProtectedRoute>
                <CheckWorkTime />
              </ProtectedRoute>
            }
          />
          <Route
            path='/event-registration'
            element={
              <ProtectedRoute>
                <EventRegistration />
              </ProtectedRoute>
            }
          />

          {/* Admin Pages */}
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute requiredRole='admin'>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin/gps-check'
            element={
              <ProtectedRoute requiredRole='admin'>
                <GPSCheck />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin/work-table'
            element={
              <ProtectedRoute requiredRole='admin'>
                <WorkTable />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin/set-area'
            element={
              <ProtectedRoute requiredRole='admin'>
                <SetArea />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin/send-notifications'
            element={
              <ProtectedRoute requiredRole='admin'>
                <SendNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin/export-data'
            element={
              <ProtectedRoute requiredRole='admin'>
                <ExportData />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin/summary-report'
            element={
              <ProtectedRoute requiredRole='admin'>
                <SummaryReport />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin/event-manage'
            element={
              <ProtectedRoute requiredRole='admin'>
                <EventManage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/admin/absence-manage'
            element={
              <ProtectedRoute requiredRole='admin'>
                <AbsenceManage />
              </ProtectedRoute>
            }
          />

          {/* SuperAdmin Pages */}
          <Route
            path='/superadmin/set-permission'
            element={
              <ProtectedRoute requiredRole='superadmin'>
                <SetPermission />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path='*' element={<Navigate to='/' replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
