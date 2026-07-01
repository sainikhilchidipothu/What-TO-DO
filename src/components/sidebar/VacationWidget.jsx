import { getVacationStatus } from '../../utils/date.js'

export function VacationWidget({ vm, vacationHistory, onManage }) {
  const status = getVacationStatus(vm)
  const totalVacations = (vacationHistory || []).length

  return (
    <div className={`bg-zinc-800/50 border rounded-xl p-4 ${vm.active ? 'border-zinc-600' : 'border-zinc-700'}`}>
      <div className="flex justify-between items-center">
        <span className={`font-sans text-[11px] tracking-wider font-bold ${vm.active ? 'text-zinc-300' : 'text-zinc-500'}`}>
          🏖 VACATION
        </span>
        <button
          onClick={onManage}
          aria-label="Manage vacation"
          className="bg-transparent border border-zinc-600 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 cursor-pointer rounded-md px-2.5 py-1 text-xs transition-colors duration-150"
        >
          ⚙
        </button>
      </div>

      {vm.active && status ? (
        <div>
          <p
            className="font-sans text-xs text-zinc-300 mt-2 font-medium cursor-help"
            title={`${vm.startDate} to ${vm.endDate}`}
          >
            {status.verb} a break for {status.duration}
          </p>
          {totalVacations > 0 && (
            <p className="font-sans text-[10px] text-zinc-500 mt-1">
              Total: {totalVacations} vacation{totalVacations !== 1 ? 's' : ''} taken
            </p>
          )}
        </div>
      ) : (
        <p className="font-sans text-xs text-zinc-400 mt-2 font-medium">
          {totalVacations > 0
            ? `${totalVacations} vacation${totalVacations !== 1 ? 's' : ''} completed · click ⚙ to schedule`
            : 'No vacations · click ⚙ to schedule'}
        </p>
      )}
    </div>
  )
}
