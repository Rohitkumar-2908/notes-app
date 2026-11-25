import { useCallback, useEffect, useRef, useState } from 'react';
import api, { errorMessage } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import NoteForm from '../components/NoteForm.jsx';
import Modal from '../components/Modal.jsx';
import Tilt from '../components/Tilt.jsx';

export default function Notes() {
  const { isAdmin } = useAuth();
  const { toast, confirm } = useUI();
  const [notes, setNotes] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [scopeAll, setScopeAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | note
  const [viewing, setViewing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const searchRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/notes', {
        params: { page, q: search || undefined, tag: tag || undefined, scope: scopeAll ? 'all' : undefined },
      });
      setNotes(data.notes);
      setPages(data.pages);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, tag, scopeAll]);

  useEffect(() => {
    load();
  }, [load]);

  // Events fired by the floating popup button
  useEffect(() => {
    const onNew = () => {
      setFormError('');
      setEditing('new');
    };
    const onFocus = () => searchRef.current?.focus();
    window.addEventListener('app:new-note', onNew);
    window.addEventListener('app:focus-search', onFocus);
    return () => {
      window.removeEventListener('app:new-note', onNew);
      window.removeEventListener('app:focus-search', onFocus);
    };
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(q.trim());
  };

  const save = async (payload) => {
    setSaving(true);
    setFormError('');
    try {
      const isNew = editing === 'new';
      if (isNew) await api.post('/notes', payload);
      else await api.put(`/notes/${editing._id}`, payload);
      setEditing(null);
      setViewing(null);
      toast(isNew ? 'Note created' : 'Note updated');
      load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (note) => {
    const ok = await confirm({
      title: 'Delete note?',
      message: `"${note.title}" will be permanently deleted.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/notes/${note._id}`);
      setViewing(null);
      toast('Note deleted');
      load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const togglePin = async (note) => {
    try {
      await api.put(`/notes/${note._id}`, { pinned: !note.pinned });
      toast(note.pinned ? 'Note unpinned' : 'Note pinned');
      load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div>
      <div className="row between wrap">
        <h1>{scopeAll ? 'All notes' : 'My notes'}</h1>
        <button
          className="btn"
          onClick={() => {
            setFormError('');
            setEditing('new');
          }}
        >
          ＋ New note
        </button>
      </div>

      <form className="row wrap toolbar" onSubmit={onSearch}>
        <input ref={searchRef} placeholder="Search notes…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn ghost sm">Search</button>
        {tag && (
          <button type="button" className="chip active" onClick={() => { setTag(''); setPage(1); }}>
            #{tag} ✕
          </button>
        )}
        {isAdmin && (
          <label className="check">
            <input
              type="checkbox"
              checked={scopeAll}
              onChange={(e) => {
                setScopeAll(e.target.checked);
                setPage(1);
              }}
            />
            Show everyone's notes
          </label>
        )}
      </form>

      {error && <div className="alert">{error}</div>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : notes.length === 0 ? (
        <Tilt className="card empty">
          <div className="empty-ico">🗒️</div>
          <p>No notes here yet.</p>
          <button className="btn" onClick={() => setEditing('new')}>Create your first note</button>
        </Tilt>
      ) : (
        <div className="grid">
          {notes.map((n) => (
            <Tilt
              key={n._id}
              className={`card note ${n.pinned ? 'pinned' : ''}`}
              onClick={() => setViewing(n)}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setViewing(n)}
            >
              <div className="row between z">
                <h3>{n.title}</h3>
                <button className="icon" title={n.pinned ? 'Unpin' : 'Pin'} onClick={stop(() => togglePin(n))}>
                  {n.pinned ? '📌' : '📍'}
                </button>
              </div>
              <p className="content">{n.content}</p>
              <div className="row wrap">
                {n.tags.map((t) => (
                  <button
                    key={t}
                    className="chip"
                    onClick={stop(() => {
                      setTag(t);
                      setPage(1);
                    })}
                  >
                    #{t}
                  </button>
                ))}
              </div>
              <div className="row between meta">
                <span className="muted">
                  {scopeAll && n.owner?.name ? `${n.owner.name} · ` : ''}
                  {new Date(n.updatedAt).toLocaleDateString()}
                </span>
                <span>
                  <button className="link" onClick={stop(() => { setFormError(''); setEditing(n); })}>Edit</button>
                  <button className="link danger" onClick={stop(() => remove(n))}>Delete</button>
                </span>
              </div>
            </Tilt>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="row center-row">
          <button className="btn ghost sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="muted">Page {page} of {pages}</span>
          <button className="btn ghost sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}

      {viewing && !editing && (
        <Modal title={`${viewing.pinned ? '📌 ' : ''}${viewing.title}`} onClose={() => setViewing(null)} wide>
          <p className="full-content">{viewing.content || <span className="muted">(empty note)</span>}</p>
          <div className="row wrap">
            {viewing.tags.map((t) => <span key={t} className="chip">#{t}</span>)}
          </div>
          <p className="muted">
            {viewing.owner?.name && `By ${viewing.owner.name} · `}
            Updated {new Date(viewing.updatedAt).toLocaleString()}
          </p>
          <div className="row end">
            <button className="btn danger" onClick={() => remove(viewing)}>Delete</button>
            <button className="btn ghost" onClick={() => { setFormError(''); setEditing(viewing); }}>Edit</button>
            <button className="btn" onClick={() => setViewing(null)}>Close</button>
          </div>
        </Modal>
      )}

      {editing && (
        <NoteForm
          note={editing === 'new' ? null : editing}
          onSave={save}
          onCancel={() => setEditing(null)}
          saving={saving}
          error={formError}
        />
      )}
    </div>
  );
}
