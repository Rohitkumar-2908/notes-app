import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { errorMessage } from '../api/axios.js';
import Tilt from '../components/Tilt.jsx';

export default function Register() {
  const { register } = useAuth();
  const { toast } = useUI();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      toast('Account created. Welcome!');
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Tilt as="form" max={6} className="card auth" onSubmit={submit}>
      <h1 className="z">Create account</h1>
      <p className="muted z">Start taking notes in seconds</p>
      {error && <div className="alert">{error}</div>}
      <label>Name</label>
      <input value={form.name} onChange={set('name')} required minLength={2} autoFocus />
      <label>Email</label>
      <input type="email" value={form.email} onChange={set('email')} required />
      <label>Password <span className="muted">(min 8 characters)</span></label>
      <input type="password" value={form.password} onChange={set('password')} required minLength={8} />
      <button className="btn block" disabled={busy}>{busy ? 'Creating…' : 'Register'}</button>
      <p className="muted">Already registered? <Link to="/login">Login</Link></p>
    </Tilt>
  );
}
