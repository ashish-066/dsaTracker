/** Inline style tokens that follow light/dark via CSS variables in index.css */

export const CARD = {
  background: 'var(--card-bg)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid var(--card-border)',
  boxShadow: 'var(--surface-shadow)',
  borderRadius: 18,
  padding: 22,
}

export const CARD_COMPACT = {
  ...CARD,
  borderRadius: 16,
  padding: 22,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
}

export const CHART_TOOLTIP = {
  background: 'var(--chart-tooltip-bg)',
  border: '1px solid var(--chart-tooltip-border)',
  borderRadius: 10,
  padding: '9px 14px',
  backdropFilter: 'blur(16px)',
  boxShadow: 'var(--shadow-md)',
}

export const PROGRESS_TRACK = {
  background: 'var(--xp-track-bg)',
  borderRadius: 10,
  overflow: 'hidden',
}

export const HEATMAP_COLORS = [
  'var(--heatmap-0)',
  'var(--heatmap-1)',
  'var(--heatmap-2)',
  'var(--heatmap-3)',
  'var(--heatmap-4)',
]
