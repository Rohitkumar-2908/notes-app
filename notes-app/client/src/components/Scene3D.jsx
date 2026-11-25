import { useEffect, useRef } from 'react';

const CUBES = [
  { x: '6%', y: '14%', s: 70, d: 22, f: 7, delay: 0 },
  { x: '86%', y: '10%', s: 54, d: 28, f: 9, delay: -3 },
  { x: '78%', y: '58%', s: 90, d: 34, f: 8, delay: -6 },
  { x: '10%', y: '62%', s: 48, d: 20, f: 6, delay: -2 },
  { x: '45%', y: '6%', s: 36, d: 26, f: 10, delay: -5 },
  { x: '60%', y: '80%', s: 60, d: 30, f: 7, delay: -8 },
];

// Fixed animated 3D backdrop: spinning cubes + a moving perspective grid floor.
// It follows the mouse slightly (parallax) and is purely decorative.
export default function Scene3D() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const onMove = (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.setProperty('--px', ((e.clientX / window.innerWidth - 0.5) * 2).toFixed(3));
        el.style.setProperty('--py', ((e.clientY / window.innerHeight - 0.5) * 2).toFixed(3));
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="scene" ref={ref} aria-hidden="true">
      <div className="glow g1" />
      <div className="glow g2" />
      <div className="floor" />
      <div className="cubes">
        {CUBES.map((c, i) => (
          <div
            key={i}
            className="cube-wrap"
            style={{ left: c.x, top: c.y, '--s': `${c.s}px`, '--f': `${c.f}s`, animationDelay: `${c.delay}s` }}
          >
            <div className="cube" style={{ '--d': `${c.d}s`, animationDelay: `${c.delay}s` }}>
              <i /><i /><i /><i /><i /><i />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
