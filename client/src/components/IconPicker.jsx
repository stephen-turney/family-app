import { useState } from 'react';
import {
  ICON_GROUPS,
  iconForTitle,
  searchIcons,
  DEFAULT_ICON,
  isUploadedImage,
} from '../lib/taskIcons.js';
import { fileToTaskImageDataUrl } from '../lib/image.js';

// Picture chooser for a chore or routine step.
//
// `value` is the explicitly chosen icon (null = let the title decide). We show the
// automatic match as the preview when nothing is chosen, so most tasks never need
// touching — the picker is for the ones the keyword matcher can't guess.
export default function IconPicker({
  value,
  title = '',
  onChange,
  compact = false,
  matchTitle = true,
  fallback = DEFAULT_ICON,
  pickerLabel = 'Choose a picture',
  allowUpload = false,
  expandedPanel = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [uploadError, setUploadError] = useState('');

  const auto = matchTitle ? iconForTitle(title) : null;
  const shown = value || auto || fallback;
  const results = query.trim() ? searchIcons(query) : null;

  const choose = (icon) => {
    onChange(icon);
    setOpen(false);
    setQuery('');
    setUploadError('');
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      choose(await fileToTaskImageDataUrl(file));
    } catch (err) {
      setUploadError(err.message || 'Could not read that image file');
    }
  };

  const preview = (picture) =>
    isUploadedImage(picture) ? <img src={picture} alt="" /> : picture;

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
    <div className={`icon-picker${compact ? ' compact' : ''}${expandedPanel ? ' expanded-panel' : ''}`}>
      <button
        type="button"
        className="icon-current"
        onClick={() => setOpen((o) => !o)}
        title={pickerLabel}
        aria-label={pickerLabel}
      >
        <span className="icon-current-glyph">{preview(shown)}</span>
        {!compact && (
          <span className="muted" style={{ fontSize: 13 }}>
            {value ? 'Picture chosen' : auto ? 'Matched from the name' : 'Using the default picture'}
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
          {allowUpload && (
            <label className="btn ghost small icon-upload">
              {isUploadedImage(value) ? 'Replace uploaded image' : 'Upload an image'}
              <input type="file" accept="image/*" hidden onChange={upload} />
            </label>
          )}
          {value && (
            <button type="button" className="btn ghost small" onClick={() => choose(null)}>
              {auto ? `Use the automatic picture (${auto})` : `Use the default picture (${fallback})`}
            </button>
          )}
          {uploadError && <p className="icon-upload-error">{uploadError}</p>}
          <div className="icon-scroll">
            {results ? (
              results.length ? (
                grid(results)
              ) : (
                <p className="muted" style={{ margin: '8px 4px' }}>No pictures match “{query}”.</p>
              )
            ) : expandedPanel ? (
              grid(ICON_GROUPS.flatMap((group) => group.items))
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
