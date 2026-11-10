import { useState } from 'react';
import Modal from './Modal.jsx';

const iso = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function ReportRangePicker({ onClose, onGenerate, pending, error }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [startDate, setStart] = useState('');
  const [endDate, setEnd] = useState('');
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;
  const cellCount = Math.ceil((offset + days) / 7) * 7;
  const select = (date) => {
    if (!startDate || endDate || date < startDate) {
      setStart(date);
      setEnd('');
    } else setEnd(date);
  };
  return (
    <Modal title="Custom report" onClose={pending ? () => {} : onClose}>
      <div className="row range-month">
        <button className="btn ghost small" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
        <strong aria-live="polite">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
        <button className="btn ghost small" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
      </div>
      <div className="report-calendar" style={{ marginBottom: 18 }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span className="muted" key={day}>{day}</span>)}
        {Array.from({ length: cellCount }, (_, i) => {
          const date = new Date(month.getFullYear(), month.getMonth(), i + 1 - offset);
          const value = iso(date);
          const endpoint = value === startDate || value === endDate;
          return <button key={value} type="button" disabled={pending}
            className={`calendar-day${date.getMonth() !== month.getMonth() ? ' adjacent-month' : ''}${endpoint ? ' selected' : ''}${startDate && endDate && value >= startDate && value <= endDate ? ' in-range' : ''}`}
            aria-label={date.toLocaleDateString('en-US', { dateStyle: 'full' })}
            aria-pressed={Boolean(endpoint || (startDate && endDate && value >= startDate && value <= endDate))}
            onClick={() => select(value)}>{date.getDate()}</button>;
        })}
      </div>
      {error && <p className="report-message error" role="alert">The report could not be generated. Please try again.</p>}
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn ghost" disabled={pending} onClick={onClose}>Cancel</button>
        <button className="btn" disabled={!startDate || !endDate || pending} onClick={() => onGenerate({ startDate, endDate })}>{pending ? 'Generating…' : 'Generate Report'}</button>
      </div>
    </Modal>
  );
}
