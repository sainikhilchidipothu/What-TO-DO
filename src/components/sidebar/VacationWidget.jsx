import { mono } from '../../theme.js'
import { getVacationStatus } from '../../utils/date.js'

export function VacationWidget({ vm, vacationHistory, onManage }) {
  const status = getVacationStatus(vm)
  const totalVacations = (vacationHistory || []).length

  return (
    <div style={{ background: '#2a2a2a', border: `3px solid ${vm.active ? '#555' : '#444'}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ ...mono, fontSize: 11, letterSpacing: 4, color: vm.active ? '#ddd' : '#aaa', fontWeight: 'bold' }}>
          🏖 VACATION
        </span>
        <button
          onClick={onManage}
          aria-label="Manage vacation"
          style={{ background: 'none', border: '2px solid #555', color: '#888', cursor: 'pointer', borderRadius: 6, padding: '5px 10px', fontSize: 12 }}
        >
          ⚙
        </button>
      </div>

      {vm.active && status ? (
        <div>
          <p
            style={{ ...mono, fontSize: 12, color: '#ccc', marginTop: 8, fontWeight: 500, cursor: 'help' }}
            title={`${vm.startDate} to ${vm.endDate}`}
          >
            {status.verb} a break for {status.duration}
          </p>
          {totalVacations > 0 && (
            <p style={{ ...mono, fontSize: 10, color: '#888', marginTop: 4 }}>
              Total: {totalVacations} vacation{totalVacations !== 1 ? 's' : ''} taken
            </p>
          )}
        </div>
      ) : (
        <p style={{ ...mono, fontSize: 12, color: '#bbb', marginTop: 8, fontWeight: 500 }}>
          {totalVacations > 0
            ? `${totalVacations} vacation${totalVacations !== 1 ? 's' : ''} completed · click ⚙ to schedule`
            : 'No vacations · click ⚙ to schedule'}
        </p>
      )}
    </div>
  )
}
