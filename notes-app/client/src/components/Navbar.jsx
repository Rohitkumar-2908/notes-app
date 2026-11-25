import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { toast } = useUI();
  const navigate = useNavigate();
  const [dbMode, setDbMode] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setDbMode(d.db))
      .catch(() => setDbMode('offline'));
  }, []);

  const handleLogout = async () => {
    await logout();
    toast('Logged out');
    navigate('/login');
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="logo-cube" aria-hidden="true">
          <i /><i /><i /><i /><i /><i />
        </span>
        Notes
      </Link>
      <nav>
        {user && <NavLink to="/">My Notes</NavLink>}
        {isAdmin && <NavLink to="/admin">Admin</NavLink>}
      </nav>
      <div className="nav-right">
        {dbMode === 'offline' && <span className="pill bad" title="The backend is not reachable">API offline</span>}
        {dbMode === 'embedded' && (
          <span className="pill" title="MongoDB was not found, so the app is using an embedded local database saved in server/.data">
            Local DB
          </span>
        )}
        {user ? (
          <>
            <span className="who">
              {user.name} <span className={`badge ${user.role}`}>{user.role}</span>
            </span>
            <button className="btn ghost sm" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </div>
    </header>
  );
}
