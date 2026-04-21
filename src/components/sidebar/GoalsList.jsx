// ─── GoalsList ────────────────────────────────────────────────────────────────

import { mono, selectSt, iconBtn } from '../../theme.js'
import { CATEGORIES, CAT_COLORS, DAYS_SHORT } from '../../constants.js'
import { todayKey } from '../../utils/date.js'
import { getStreaks } from '../../utils/helpers.js'
import { EmptyState } from '../common/EmptyState.jsx'

export function GoalsList({
  habits,
  history,
  catFilter,
  setCatFilter,
  uniqueCats,
  onToggle,
  onEdit,
  onDelete,
  onTogglePin,
  onAdd,
}) {
  const filtered = [...habits]
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
    .filter((h) => catFilter === 'all' || h.category === catFilter)

  return (
    <div style={{ borderTop: '3px solid #444' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '2px solid #333', background: '#222' }}>
        <h2 style={{ ...mono, fontSize: 11, letterSpacing: 4, color: '#ccc', fontWeight: 'bold', margin: 0 }}>GOALS</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ position: 'absolute', left: '-9999px' }} htmlFor="goal-cat-filter">
            Filter goals by category
          </label>
          <select
            id="goal-cat-filter"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            style={{ ...selectSt, fontSize: 11 }}
          >
            <option value="all">All</option>
            {uniqueCats.map((c) => <option key={c} value={c}>{CATEGORIES[c] || c}</option>)}
          </select>
          <button
            onClick={onAdd}
            aria-label="Add new goal"
            style={{ width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#fff', color: '#000', ...mono, fontSize: 18, fontWeight: 'bold', lineHeight: '28px', padding: 0 }}
          >
            +
          </button>
        </div>
      </div>

      <div style={{ background: '#222' }}>
        {filtered.length === 0 ? (
          habits.length === 0 ? (
            <EmptyState
              icon="🎯"
              title="Start tracking a habit"
              description="Goals are things you want to do regularly — exercise, read, study. Track them daily and build streaks."
              shortcut="Ctrl+N"
              ctaLabel="+ ADD YOUR FIRST GOAL"
              onCta={onAdd}
            />
          ) : (
            <p style={{ ...mono, fontSize: 11, color: '#aaa', padding: '16px', textAlign: 'center', lineHeight: 1.6 }}>
              No goals match this filter
            </p>
          )
        ) : (
          filtered.map((h) => {
            const { current, best } = getStreaks(h.id, history)
            const isDone = (history[todayKey()] || []).includes(h.id)
            const col = CAT_COLORS[h.category] || '#888'
            return (
              <div key={h.id} style={{ borderBottom: '2px solid #2a2a2a', padding: '11px 16px', background: '#222' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => onToggle(h.id, todayKey())}
                    aria-label={isDone ? `Mark ${h.name} as not done` : `Mark ${h.name} as done`}
                    aria-pressed={isDone}
                    style={{
                      width: 18, height: 18, borderRadius: 4,
                      border: `2px solid ${isDone ? col : '#666'}`,
                      background: isDone ? col : 'transparent',
                      cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                    }}
                  >
                    {isDone && <span style={{ fontSize: 11, color: '#000', display: 'block', textAlign: 'center', lineHeight: '18px', fontWeight: 'bold' }}>✓</span>}
                  </button>
                  <button
                    onClick={() => onEdit(h.id)}
                    aria-label={`Edit ${h.name}`}
                    style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', color: isDone ? '#bbb' : '#fff', ...mono, fontSize: 14, textAlign: 'left', transition: 'color 0.15s', fontWeight: 600 }}
                  >
                    {h.pinned && <span style={{ color: '#fff', marginRight: 5 }} aria-hidden="true">★</span>}
                    {h.name}
                  </button>
                  <button
                    onClick={() => onTogglePin(h.id)}
                    aria-label={h.pinned ? `Unpin ${h.name}` : `Pin ${h.name}`}
                    aria-pressed={!!h.pinned}
                    style={iconBtn(h.pinned ? '#fff' : '#888')}
                  >
                    ★
                  </button>
                  <button
                    onClick={() => onDelete(h.id)}
                    aria-label={`Delete ${h.name}`}
                    style={iconBtn('#888')}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 12, marginLeft: 28, marginTop: 5, alignItems: 'center' }}>
                  <span style={{ ...mono, fontSize: 11, color: '#aaa', fontWeight: 500 }}>
                    🔥 {current} · best {best}
                  </span>
                  {h.category && (
                    <span style={{ ...mono, fontSize: 11, color: col, background: col + '35', padding: '2px 7px', borderRadius: 4, fontWeight: 'bold' }}>
                      {CATEGORIES[h.category] || h.category}
                    </span>
                  )}
                  {h.specificDays?.length > 0 && (
                    <span style={{ ...mono, fontSize: 10, color: '#aaa', fontWeight: 500 }}>
                      {h.specificDays.map((d) => DAYS_SHORT[d][0]).join('')}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
