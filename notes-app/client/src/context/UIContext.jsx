import { createContext, useCallback, useContext, useState } from 'react';
import Modal from '../components/Modal.jsx';

const UIContext = createContext(null);
export const useUI = () => useContext(UIContext);

// Provides toast notifications and promise-based confirm popups to the whole app.
export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  // const ok = await confirm({ title, message, confirmText, danger })
  const confirm = useCallback(
    (opts) => new Promise((resolve) => setDialog({ ...opts, resolve })),
    []
  );

  const answer = (value) => {
    dialog?.resolve(value);
    setDialog(null);
  };

  return (
    <UIContext.Provider value={{ toast, confirm }}>
      {children}

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.type === 'error' ? '⚠️' : '✅'}</span> {t.message}
          </div>
        ))}
      </div>

      {dialog && (
        <Modal title={dialog.title || 'Are you sure?'} onClose={() => answer(false)} tone={dialog.danger ? 'danger' : ''}>
          <p className="confirm-text">{dialog.message}</p>
          <div className="row end">
            <button className="btn ghost" onClick={() => answer(false)}>Cancel</button>
            <button className={`btn ${dialog.danger ? 'danger' : ''}`} onClick={() => answer(true)} autoFocus>
              {dialog.confirmText || 'Confirm'}
            </button>
          </div>
        </Modal>
      )}
    </UIContext.Provider>
  );
}
