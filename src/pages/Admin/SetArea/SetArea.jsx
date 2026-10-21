import { useState } from 'react'
import './SetArea.css'

function SetArea() {
    const [areas, setAreas] = useState([
        { id: 1, name: 'สำนักงานหลัก', latitude: 13.7563, longitude: 100.5018, radius: 50 },
        { id: 2, name: 'โกดัง', latitude: 13.7545, longitude: 100.5050, radius: 100 }
    ])

    const [newArea, setNewArea] = useState({ name: '', latitude: '', longitude: '', radius: 50 })

    const handleAddArea = (e) => {
        e.preventDefault()
        if (!newArea.name || !newArea.latitude || !newArea.longitude) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน')
            return
        }

        const area = {
            id: areas.length + 1,
            name: newArea.name,
            latitude: parseFloat(newArea.latitude),
            longitude: parseFloat(newArea.longitude),
            radius: parseFloat(newArea.radius)
        }

        setAreas([...areas, area])
        setNewArea({ name: '', latitude: '', longitude: '', radius: 50 })
    }

    const handleDeleteArea = (id) => {
        setAreas(areas.filter(area => area.id !== id))
    }

    return (
        <div className="set-area-container">
            <div className="set-area-header">
                <h2>กำหนดพื้นที่ (Geofencing)</h2>
            </div>

            {/* Add Area Form */}
            <div className="add-area-form">
                <h3>เพิ่มพื้นที่ใหม่</h3>
                <form onSubmit={handleAddArea}>
                    <div className="form-group">
                        <label>ชื่อพื้นที่</label>
                        <input
                            type="text"
                            value={newArea.name}
                            onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                            className="form-control"
                            placeholder="เช่น สำนักงานหลัก"
                        />
                    </div>

                    <div className="form-row-two">
                        <div className="form-group">
                            <label>Latitude</label>
                            <input
                                type="number"
                                step="0.0001"
                                value={newArea.latitude}
                                onChange={(e) => setNewArea({ ...newArea, latitude: e.target.value })}
                                className="form-control"
                                placeholder="13.7563"
                            />
                        </div>
                        <div className="form-group">
                            <label>Longitude</label>
                            <input
                                type="number"
                                step="0.0001"
                                value={newArea.longitude}
                                onChange={(e) => setNewArea({ ...newArea, longitude: e.target.value })}
                                className="form-control"
                                placeholder="100.5018"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>รัศมี (เมตร)</label>
                        <input
                            type="number"
                            value={newArea.radius}
                            onChange={(e) => setNewArea({ ...newArea, radius: e.target.value })}
                            className="form-control"
                        />
                    </div>

                    <button type="submit" className="btn btn-add">เพิ่มพื้นที่</button>
                </form>
            </div>

            {/* Areas List */}
            <div className="areas-list">
                <h3>พื้นที่ที่มี</h3>
                {areas.map((area) => (
                    <div key={area.id} className="area-card">
                        <div className="area-info">
                            <h4>{area.name}</h4>
                            <p>
                                <strong>พิกัด:</strong> {area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}
                            </p>
                            <p>
                                <strong>รัศมี:</strong> {area.radius} เมตร
                            </p>
                        </div>
                        <button
                            className="btn btn-delete"
                            onClick={() => handleDeleteArea(area.id)}
                        >
                            ลบ
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default SetArea
