import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { errorMessage } from '../api/axios.js';
import Tilt from '../components/Tilt.jsx';

export default function Login() {
  const { login } = useAuth();
  const { toast } = useUI();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      toast(`Welcome back, ${user.name}!`);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Tilt as="form" max={6} className="card auth" onSubmit={submit}>
      <h1 className="z">Welcome back</h1>
      <p className="muted z">Sign in to your notes</p>
      {error && <div className="alert">{error}</div>}
      <label>Email</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
      <label>Password</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button className="btn block" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
      <p className="muted">No account? <Link to="/register">Register</Link></p>
    </Tilt>
  );
}
