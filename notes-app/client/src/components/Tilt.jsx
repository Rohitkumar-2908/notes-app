import { useRef } from 'react';

// Wraps content in a card that tilts toward the mouse in 3D and shows a moving glare.
export default function Tilt({ as: Tag = 'div', max = 9, className = '', children, ...rest }) {
  const ref = useRef(null);
  const frame = useRef(0);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    // Freeze the tilt while the pointer is over a control, so buttons and inputs never
    // move out from under the cursor between mouse-down and mouse-up (that would eat clicks).
    if (e.target.closest('button, a, input, select, textarea, label')) {
      cancelAnimationFrame(frame.current);
      return;
    }
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--rx', `${((0.5 - py) * max * 2).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${((px - 0.5) * max * 2).toFixed(2)}deg`);
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    });
  };

  const onLeave = () => {
    const el = ref.current;
    cancelAnimationFrame(frame.current);
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <Tag ref={ref} className={`tilt ${className}`} onMouseMove={onMove} onMouseLeave={onLeave} {...rest}>
      {children}
    </Tag>
  );
}
