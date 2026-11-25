import { useState } from 'react';
import Modal from './Modal.jsx';

export default function NoteForm({ note, onSave, onCancel, saving, error }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tags, setTags] = useState((note?.tags || []).join(', '));
  const [pinned, setPinned] = useState(note?.pinned || false);

  const submit = (e) => {
    e.preventDefault();
    onSave({
      title,
      content,
      pinned,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <Modal title={note ? '✏️ Edit note' : '📝 New note'} onClose={onCancel}>
      <form onSubmit={submit}>
        {error && <div className="alert">{error}</div>}

        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required autoFocus />

        <label>Content</label>
        <textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} />

        <label>Tags <span className="muted">(comma separated)</span></label>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="work, ideas" />

        <label className="check">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          Pin to top
        </label>

        <div className="row end">
          <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
          <button className="btn" disabled={saving}>{saving ? 'Saving…' : 'Save note'}</button>
        </div>
      </form>
    </Modal>
  );
}
