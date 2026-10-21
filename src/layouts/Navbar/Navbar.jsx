import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div>
      <nav className="bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-between items-center z-50 mx-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        {!isAdmin ? (
          <>
            <Link to="/" className="nav-link">
              <button className="nav-btn" title="หน้าแรก">
                <i className="bi bi-house-door-fill"></i>
              </button>
            </Link>
            <Link to="/notifications" className="nav-link">
              <button className="nav-btn" title="การแจ้งเตือน">
                <i className="bi bi-envelope-fill"></i>
              </button>
            </Link>
            <Link to="/settings" className="nav-link">
              <button className="nav-btn" title="ตั้งค่า">
                <i className="bi bi-gear-fill"></i>
              </button>
            </Link>
            <Link to="/profile" className="nav-link">
              <button className="nav-btn" title="โปรไฟล์">
                <i className="bi bi-person-fill"></i>
              </button>
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="nav-link">
              <button className="nav-btn" title="Dashboard">
                <i className="bi bi-speedometer2"></i>
              </button>
            </Link>
            <Link to="/profile" className="nav-link">
              <button className="nav-btn" title="โปรไฟล์">
                <i className="bi bi-person-fill"></i>
              </button>
            </Link>
          </>
        )}
      </nav>
    </div >
  );
}

export default Navbar;
