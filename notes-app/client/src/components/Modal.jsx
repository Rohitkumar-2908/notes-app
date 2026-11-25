import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Only the top-most open modal reacts to Escape.
const stack = [];

export default function Modal({ title, onClose, children, wide = false, tone }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const id = Symbol('modal');
    stack.push(id);
    const onKey = (e) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === id) closeRef.current?.();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(id), 1);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={() => closeRef.current?.()}>
      <div
        className={`modal ${wide ? 'wide' : ''} ${tone || ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon close" onClick={() => closeRef.current?.()} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
