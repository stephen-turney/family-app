import { useState } from 'react';
import { ICON_GROUPS, iconForTitle, searchIcons, DEFAULT_ICON } from '../lib/taskIcons.js';

// Picture chooser for a chore or routine step.
//
// `value` is the explicitly chosen icon (null = let the title decide). We show the
// automatic match as the preview when nothing is chosen, so most tasks never need
// touching — the picker is for the ones the keyword matcher can't guess.
export default function IconPicker({ value, title = '', onChange, compact = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const auto = iconForTitle(title);
  const shown = value || auto || DEFAULT_ICON;
  const results = query.trim() ? searchIcons(query) : null;

  const choose = (icon) => {
    onChange(icon);
    setOpen(false);
    setQuery('');
  };

  const grid = (items) => (
    <div className="icon-grid">
      {items.map((item) => (
        <button
          key={item.icon + item.label}
          type="button"
          className={`icon-choice${value === item.icon ? ' selected' : ''}`}
          title={item.label}
          aria-label={item.label}
          onClick={() => choose(item.icon)}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`icon-picker${compact ? ' compact' : ''}`}>
      <button
        type="button"
        className="icon-current"
        onClick={() => setOpen((o) => !o)}
        title="Choose a picture"
        aria-label="Choose a picture"
      >
        <span className="icon-current-glyph">{shown}</span>
        {!compact && (
          <span className="muted" style={{ fontSize: 13 }}>
            {value ? 'Picture chosen' : auto ? 'Matched from the name' : 'No match — pick one'}
          </span>
        )}
        {!compact && <span className="spacer" />}
        {!compact && <span className="muted" style={{ fontSize: 13 }}>{open ? 'Close' : 'Change'}</span>}
      </button>

      {open && (
        <div className="icon-panel">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pictures…"
            aria-label="Search pictures"
          />
          {value && (
            <button type="button" className="btn ghost small" onClick={() => choose(null)}>
              Use the automatic picture{auto ? ` (${auto})` : ''}
            </button>
          )}
          <div className="icon-scroll">
            {results ? (
              results.length ? (
                grid(results)
              ) : (
                <p className="muted" style={{ margin: '8px 4px' }}>No pictures match “{query}”.</p>
              )
            ) : (
              ICON_GROUPS.map((g) => (
                <div key={g.group}>
                  <div className="section-title" style={{ marginTop: 8 }}>{g.group}</div>
                  {grid(g.items)}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
