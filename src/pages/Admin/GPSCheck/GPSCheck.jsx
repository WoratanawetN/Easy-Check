import { useState, useEffect } from 'react'
import './GPSCheck.css'

function GPSCheck() {
    const [checkins, setCheckins] = useState([])
    const [mapReady, setMapReady] = useState(false)

    useEffect(() => {
        // Mock GPS check-in data
        const mockData = [
            {
                id: 1,
                name: 'นายจอห์น ดู',
                employeeId: 'EMP001',
                latitude: 13.7563,
                longitude: 100.5018,
                checkInTime: '09:05',
                status: 'On Time'
            },
            {
                id: 2,
                name: 'นางสาวมาลี',
                employeeId: 'EMP002',
                latitude: 13.7569,
                longitude: 100.5025,
                checkInTime: '09:15',
                status: 'Late'
            },
            {
                id: 3,
                name: 'นายสมิทธ์',
                employeeId: 'EMP003',
                latitude: 13.7575,
                longitude: 100.5032,
                checkInTime: '09:00',
                status: 'On Time'
            }
        ]
        setCheckins(mockData)
    }, [])

    return (
        <div className="gps-check-container">
            <div className="gps-header">
                <h2>ตรวจสอบ GPS</h2>
                <p className="gps-date">{new Date().toLocaleDateString('th-TH')}</p>
            </div>

            <div className="checkin-list">
                {checkins.map((checkin) => (
                    <div key={checkin.id} className="checkin-item">
                        <div className="checkin-info">
                            <div className="employee-name">{checkin.name}</div>
                            <div className="employee-id">ID: {checkin.employeeId}</div>
                            <div className="gps-coords">
                                📍 {checkin.latitude.toFixed(4)}, {checkin.longitude.toFixed(4)}
                            </div>
                            <div className="checkin-time">{checkin.checkInTime}</div>
                        </div>
                        <div className={`status-badge ${checkin.status === 'On Time' ? 'on-time' : 'late'}`}>
                            {checkin.status}
                        </div>
                    </div>
                ))}
            </div>

            <div className="gps-map-placeholder">
                <i className="bi bi-map"></i>
                <p>Leaflet Map Integration Here</p>
                <small>*ในการใช้งานจริง จะแทนที่ด้วย React Leaflet Map</small>
            </div>
        </div>
    )
}

export default GPSCheck
