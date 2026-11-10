import { useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

let openModalCount = 0;

export default function Modal({ title, onClose, children, footer, className = '' }) {
  useLayoutEffect(() => {
    openModalCount += 1;
    document.documentElement.classList.add('modal-open');

    return () => {
      openModalCount -= 1;
      if (openModalCount === 0) document.documentElement.classList.remove('modal-open');
    };
  }, []);

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`card modal${className ? ` ${className}` : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ marginBottom: 14 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <div className="spacer" />
          <button className="btn ghost small" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
        {footer && (
          <div className="row modal-footer" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
