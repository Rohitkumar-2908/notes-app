import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import Modal from '../components/Modal.jsx';
import Tilt from '../components/Tilt.jsx';

function AddUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/admin/users', form);
      onCreated();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="👤 Add user" onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="alert">{error}</div>}
        <label>Name</label>
        <input value={form.name} onChange={set('name')} required minLength={2} autoFocus />
        <label>Email</label>
        <input type="email" value={form.email} onChange={set('email')} required />
        <label>Password <span className="muted">(min 8 characters)</span></label>
        <input type="password" value={form.password} onChange={set('password')} required minLength={8} />
        <label>Role</label>
        <select value={form.role} onChange={set('role')}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <div className="row end">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Create user'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Admin() {
  const { user: me } = useAuth();
  const { toast, confirm } = useUI();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [details, setDetails] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [s, u] = await Promise.all([api.get('/admin/stats'), api.get('/admin/users')]);
      setStats(s.data.stats);
      setUsers(u.data.users);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Events fired by the floating popup button
  useEffect(() => {
    const onAdd = () => setAdding(true);
    const onRefresh = () => {
      load();
      toast('Data refreshed');
    };
    window.addEventListener('app:add-user', onAdd);
    window.addEventListener('app:refresh', onRefresh);
    return () => {
      window.removeEventListener('app:add-user', onAdd);
      window.removeEventListener('app:refresh', onRefresh);
    };
  }, [load, toast]);

  const patch = async (id, body, okMsg) => {
    try {
      await api.patch(`/admin/users/${id}`, body);
      toast(okMsg);
      load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const remove = async (u) => {
    const ok = await confirm({
      title: 'Delete user?',
      message: `${u.name} (${u.email}) and all of their notes will be permanently deleted.`,
      confirmText: 'Delete user',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/users/${u._id}`);
      setDetails(null);
      toast('User deleted');
      load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const toggleActive = async (u) => {
    if (u.isActive) {
      const ok = await confirm({
        title: 'Disable account?',
        message: `${u.name} will be signed out and unable to log in until re-enabled.`,
        confirmText: 'Disable',
        danger: true,
      });
      if (!ok) return;
    }
    patch(u._id, { isActive: !u.isActive }, u.isActive ? 'User disabled' : 'User enabled');
  };

  return (
    <div>
      <div className="row between wrap">
        <h1>Admin dashboard</h1>
        <button className="btn" onClick={() => setAdding(true)}>＋ Add user</button>
      </div>
      {error && <div className="alert">{error}</div>}

      {stats && (
        <div className="stats">
          <Tilt className="card stat"><b>{stats.totalUsers}</b><span>Users</span></Tilt>
          <Tilt className="card stat"><b>{stats.admins}</b><span>Admins</span></Tilt>
          <Tilt className="card stat"><b>{stats.totalNotes}</b><span>Notes</span></Tilt>
        </div>
      )}

      <h2>Users</h2>
      <Tilt className="card table-wrap" max={2}>
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Notes</th><th>Status</th><th>Joined</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const self = u._id === me._id;
              return (
                <tr key={u._id}>
                  <td>{u.name}{self && <span className="muted"> (you)</span>}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      disabled={self}
                      onChange={(e) => patch(u._id, { role: e.target.value }, `Role changed to ${e.target.value}`)}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>{u.noteCount}</td>
                  <td>
                    <span className={`badge ${u.isActive ? 'ok' : 'off'}`}>{u.isActive ? 'active' : 'disabled'}</span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="actions">
                    <button className="link" onClick={() => setDetails(u)}>View</button>
                    {!self && (
                      <>
                        <button className="link" onClick={() => toggleActive(u)}>{u.isActive ? 'Disable' : 'Enable'}</button>
                        <button className="link danger" onClick={() => remove(u)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Tilt>

      {stats?.topWriters?.length > 0 && (
        <>
          <h2>Top writers</h2>
          <Tilt className="card" max={2}>
            {stats.topWriters.map((w) => (
              <div key={w.email} className="row between pad">
                <span>{w.name} <span className="muted">{w.email}</span></span>
                <b>{w.notes} {w.notes === 1 ? 'note' : 'notes'}</b>
              </div>
            ))}
          </Tilt>
        </>
      )}

      {adding && (
        <AddUserModal
          onClose={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            toast('User created');
            load();
          }}
        />
      )}

      {details && (
        <Modal title={`👤 ${details.name}`} onClose={() => setDetails(null)}>
          <dl className="details">
            <dt>Email</dt><dd>{details.email}</dd>
            <dt>Role</dt><dd><span className={`badge ${details.role}`}>{details.role}</span></dd>
            <dt>Status</dt><dd>{details.isActive ? 'Active' : 'Disabled'}</dd>
            <dt>Notes</dt><dd>{details.noteCount}</dd>
            <dt>Joined</dt><dd>{new Date(details.createdAt).toLocaleString()}</dd>
          </dl>
          <div className="row end">
            {details._id !== me._id && <button className="btn danger" onClick={() => remove(details)}>Delete</button>}
            <button className="btn" onClick={() => setDetails(null)}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
