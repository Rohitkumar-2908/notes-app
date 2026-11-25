import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Scene3D from './components/Scene3D.jsx';
import Fab from './components/Fab.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Notes from './pages/Notes.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  const location = useLocation();
  return (
    <>
      <Scene3D />
      <div className="app">
        <Navbar />
        <main className="container">
          {/* key re-triggers the 3D page-enter animation on every navigation */}
          <div className="page" key={location.pathname}>
            <Routes location={location}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Notes />} />
              </Route>

              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="/admin" element={<Admin />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        <Fab />
      </div>
    </>
  );
}
