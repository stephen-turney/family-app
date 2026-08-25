import { useLayoutEffect, useRef, useState } from 'react';
import {
  ICON_GROUPS,
  iconForTitle,
  searchIcons,
  DEFAULT_ICON,
  isUploadedImage,
} from '../lib/taskIcons.js';
import { fileToTaskImageDataUrl } from '../lib/image.js';
import { api, useCustomImages } from '../api/client.js';
import { useQueryClient } from '@tanstack/react-query';

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
  const [panelLayout, setPanelLayout] = useState({ opensUpward: false, scrollHeight: null });
  const { data: customImages = [] } = useCustomImages();
  const queryClient = useQueryClient();
  const pickerRef = useRef(null);
  const panelRef = useRef(null);
  const scrollRef = useRef(null);

  // Compact pickers are used inside the full-screen picture editor. Measure
  // their available room after opening so the panel stays inside the browser
  // window, even as the custom-image library grows.
  useLayoutEffect(() => {
    if (!open || !compact || window.innerWidth < 700) {
      setPanelLayout({ opensUpward: false, scrollHeight: null });
      return;
    }

    const anchor = pickerRef.current?.getBoundingClientRect();
    const panel = panelRef.current;
    const scroll = scrollRef.current;
    if (!anchor || !panel || !scroll) return;

    const below = window.innerHeight - anchor.bottom - 16;
    const above = anchor.top - 16;
    const opensUpward = panel.offsetHeight > below && above > below;
    const available = opensUpward ? above : below;
    const panelChrome = panel.offsetHeight - scroll.offsetHeight;

    setPanelLayout({
      opensUpward,
      scrollHeight: Math.max(80, available - panelChrome),
    });
  }, [open, compact, query, customImages.length]);

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
      const dataUrl = await fileToTaskImageDataUrl(file);
      const image = await api.post('/custom-images', { data_url: dataUrl });
      queryClient.invalidateQueries({ queryKey: ['custom-images'] });
      choose(image.data_url);
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

  const customImageGrid = customImages.length > 0 && (
    <section className="custom-image-library" aria-label="Your custom image library">
      <div className="custom-image-library-heading">
        <span>Custom image library</span>
        <span className="custom-image-count">{customImages.length} saved</span>
      </div>
      <p>Saved photos and pictures for your family</p>
      <div className="icon-grid custom-image-grid">
        {customImages.map((image) => (
          <button
            key={image.id}
            type="button"
            className={`icon-choice custom-image-choice${value === image.data_url ? ' selected' : ''}`}
            title="Choose custom image"
            aria-label="Choose custom image"
            onClick={() => choose(image.data_url)}
          >
            <img src={image.data_url} alt="" />
          </button>
        ))}
      </div>
    </section>
  );

  return (
    <div
      ref={pickerRef}
      className={`icon-picker${compact ? ' compact' : ''}${expandedPanel ? ' expanded-panel' : ''}${panelLayout.opensUpward ? ' opens-upward' : ''}`}
    >
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
        <div ref={panelRef} className="icon-panel">
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
          <div ref={scrollRef} className="icon-scroll" style={panelLayout.scrollHeight ? { maxHeight: panelLayout.scrollHeight } : undefined}>
            {!query.trim() && customImageGrid}
            {!query.trim() && <div className="stock-images-heading">Built-in pictures</div>}
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
