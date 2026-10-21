import { Link } from "react-router-dom";

import "./Header.css";

function Header() {
  return (
    <header className="bg-white shadow-sm p-2 px-4 sticky top-0 z-10 flex items-center justify-between">
      <Link to="/" style={{ textDecoration: 'none' }}>
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
            EC
          </div>
          <h4 className="text-l font-bold text-gray-800 hidden md:block" style={{ color: 'black', fontWeight: 'bold' }}>
            Easy Check
          </h4>
        </div>
      </Link>
    </header>

  );
}

export default Header;
