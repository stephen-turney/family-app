import { createPortal } from 'react-dom';

export default function Modal({ title, onClose, children, footer, className = '' }) {
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
