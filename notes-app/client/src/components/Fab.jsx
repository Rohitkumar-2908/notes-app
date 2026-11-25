import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from './Modal.jsx';

const HELP = {
  '/login': {
    title: 'Logging in',
    tips: [
      'Use the email and password you registered with.',
      'The first admin account comes from ADMIN_EMAIL and ADMIN_PASSWORD in server/.env.',
      'Your session is kept with a secure refresh cookie, so reloading the page keeps you signed in.',
    ],
  },
  '/register': {
    title: 'Creating an account',
    tips: [
      'Passwords need at least 8 characters.',
      'New accounts always get the "user" role. Only an admin can promote someone.',
      'You can only see and edit your own notes.',
    ],
  },
  '/': {
    title: 'Working with notes',
    tips: [
      'Click a note to open it in a popup, or use Edit and Delete on the card.',
      'Pin notes to keep them on top, and click a #tag to filter by it.',
      'Admins can tick "Show everyone\'s notes" to see all users\' notes.',
    ],
  },
  '/admin': {
    title: 'Admin dashboard',
    tips: [
      'Add users, change roles, disable or delete accounts.',
      'You cannot demote, disable or delete your own account.',
      'Deleting a user also deletes all of their notes.',
    ],
  },
};

// Floating 3D popup button shown on every page. Its menu changes with the current page.
export default function Fab() {
  const { user, isAdmin } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !wrapRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const fire = (name) => window.dispatchEvent(new CustomEvent(name));

  const actions = [];
  if (user && pathname === '/') {
    actions.push({ icon: '➕', label: 'New note', run: () => fire('app:new-note') });
    actions.push({ icon: '🔍', label: 'Search notes', run: () => fire('app:focus-search') });
  }
  if (user && pathname !== '/') actions.push({ icon: '📝', label: 'My notes', run: () => navigate('/') });
  if (isAdmin && pathname === '/admin') {
    actions.push({ icon: '👤', label: 'Add user', run: () => fire('app:add-user') });
    actions.push({ icon: '🔄', label: 'Refresh data', run: () => fire('app:refresh') });
  }
  if (isAdmin && pathname !== '/admin') actions.push({ icon: '🛡️', label: 'Admin dashboard', run: () => navigate('/admin') });
  if (!user && pathname === '/login') actions.push({ icon: '✨', label: 'Create an account', run: () => navigate('/register') });
  if (!user && pathname === '/register') actions.push({ icon: '🔑', label: 'I have an account', run: () => navigate('/login') });
  actions.push({ icon: '💡', label: 'Help for this page', run: () => setHelp(true) });

  const info = HELP[pathname] || HELP['/'];

  return (
    <>
      <div className={`fab-wrap ${open ? 'open' : ''}`} ref={wrapRef}>
        <div className="fab-menu" role="menu">
          {actions.map((a, i) => (
            <button
              key={a.label}
              role="menuitem"
              className="fab-item"
              style={{ '--i': actions.length - i }}
              tabIndex={open ? 0 : -1}
              onClick={() => {
                setOpen(false);
                a.run();
              }}
            >
              <span className="fab-ico">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
        <button
          className="fab"
          aria-label="Quick actions"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="fab-plus">＋</span>
        </button>
      </div>

      {help && (
        <Modal title={`💡 ${info.title}`} onClose={() => setHelp(false)}>
          <ul className="tips">
            {info.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div className="row end">
            <button className="btn" onClick={() => setHelp(false)} autoFocus>Got it</button>
          </div>
        </Modal>
      )}
    </>
  );
}
