import { PopupShell } from './PopupShell'
import type { PopupConfig, GradeResult } from '../../types/ai'

const TIER_COLORS: Record<string, string> = {
  S: 'text-yellow-400 border-yellow-400/30',
  A: 'text-emerald-400 border-emerald-400/30',
  B: 'text-blue-400 border-blue-400/30',
  C: 'text-slate-300 border-slate-300/30',
  D: 'text-orange-400 border-orange-400/30',
  F: 'text-red-400 border-red-400/30'
}

const CATEGORY_LABELS: Record<string, string> = {
  length: 'Length & Detail',
  specificity: 'Specificity',
  structure: 'Structure',
  creativity: 'Creativity'
}

export function ResponsePopup({ popup }: { popup: PopupConfig }): React.ReactElement {
  const response = popup.data.response as string
  const grade = popup.data.grade as GradeResult

  return (
    <PopupShell popup={popup} width={550}>
      <div className="space-y-4">
        {/* Grade summary */}
        {grade && (
          <div
            className={`border rounded-lg p-3 ${TIER_COLORS[grade.tier] || 'border-slate-600'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">{grade.tier}</span>
              <span className="text-sm text-slate-400">+{grade.credits} credits</span>
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(grade.breakdown).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{CATEGORY_LABELS[key] || key}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-current rounded-full"
                        style={{ width: `${(value / 25) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right">{value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback */}
            <div className="mt-2 text-xs text-slate-400 italic">{grade.feedback}</div>
          </div>
        )}

        {/* AI Response */}
        <div className="bg-slate-800/60 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">Response</div>
          <div className="text-sm text-slate-200 whitespace-pre-wrap">{response}</div>
        </div>
      </div>
    </PopupShell>
  )
}
