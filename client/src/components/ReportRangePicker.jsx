import { useState } from 'react';
import Modal from './Modal.jsx';

const iso = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function ReportRangePicker({ onClose, onGenerate, pending, error }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [startDate, setStart] = useState('');
  const [endDate, setEnd] = useState('');
  const [hover, setHover] = useState('');
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const select = (date) => {
    if (!startDate || endDate || date < startDate) {
      setStart(date);
      setEnd('');
    } else setEnd(date);
    setHover('');
  };
  const preview = endDate || (hover >= startDate ? hover : '');
  return (
    <Modal title="Custom report" onClose={pending ? () => {} : onClose}>
      <p className="muted" aria-live="polite">{!startDate || endDate ? 'Select a start date, then an end date.' : 'Now select the end date (included in the report).'}</p>
      <div className="row range-month">
        <button className="btn ghost small" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
        <strong aria-live="polite">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
        <button className="btn ghost small" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
      </div>
      <div className="report-calendar" onMouseLeave={() => setHover('')}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span className="muted" key={day}>{day}</span>)}
        {Array.from({ length: month.getDay() }, (_, i) => <span key={`blank-${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
          const value = iso(date);
          const endpoint = value === startDate || value === endDate;
          return <button key={value} type="button" disabled={pending}
            className={`calendar-day${endpoint ? ' selected' : ''}${startDate && value >= startDate && value <= preview ? ' in-range' : ''}`}
            aria-label={date.toLocaleDateString('en-US', { dateStyle: 'full' })}
            aria-pressed={Boolean(endpoint || (startDate && endDate && value >= startDate && value <= endDate))}
            onMouseEnter={() => setHover(value)} onFocus={() => setHover(value)} onClick={() => select(value)}>{i + 1}</button>;
        })}
      </div>
      <p aria-live="polite">Start: <strong>{startDate || 'Select date'}</strong><br />End: <strong>{endDate || 'Select date'}</strong></p>
      <p className="muted">Both dates are included. Uses the usual allowance rate per completed task, up to 20 tasks per day.</p>
      {error && <p className="report-message error" role="alert">The report could not be generated. Please try again.</p>}
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn ghost" disabled={pending} onClick={onClose}>Cancel</button>
        <button className="btn" disabled={!startDate || !endDate || pending} onClick={() => onGenerate({ startDate, endDate })}>{pending ? 'Generating…' : 'Generate Report'}</button>
      </div>
    </Modal>
  );
}
