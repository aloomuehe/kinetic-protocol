import React from 'react';
import { ArrowUpRight, PieChart, Flame, Calendar as CalendarIcon } from 'lucide-react';
import type { KineticStore, ActiveNavId, HabitStats } from '../../store/types';
import type { WeeklyMetrics } from '../../store/selectors';
import { formatDurationMinutes } from '../../utils/formatting';
import { computeTelemetryAnalytics } from './analytics';

interface StatisticsViewProps {
  store: KineticStore;
  selectedDateISO: string;
  todayISO: string;
  statsTimeframe: 'daily' | 'weekly' | 'monthly';
  statsSeriesFilter: 'all' | 'planned' | 'actual' | 'velocity';
  statsHoverIdx: number | null;
  hoveredAllocationCat: string | null;
  weeklyMetrics: WeeklyMetrics;
  habitStatsById?: Record<string, HabitStats>;
  onSetStatsTimeframe: (tf: 'daily' | 'weekly' | 'monthly' | ((prev: 'daily' | 'weekly' | 'monthly') => 'daily' | 'weekly' | 'monthly')) => void;
  onSetStatsSeriesFilter: (filter: 'all' | 'planned' | 'actual' | 'velocity' | ((prev: 'all' | 'planned' | 'actual' | 'velocity') => 'all' | 'planned' | 'actual' | 'velocity')) => void;
  onSetStatsHoverIdx: (idx: number | null) => void;
  onSetHoveredAllocationCat: (cat: string | null) => void;
  onNavigateToCalendarHeatmap: () => void;
}

export function StatisticsView({
  store,
  selectedDateISO,
  todayISO,
  statsTimeframe,
  statsSeriesFilter,
  statsHoverIdx,
  hoveredAllocationCat,
  weeklyMetrics,
  habitStatsById,
  onSetStatsTimeframe,
  onSetStatsSeriesFilter,
  onSetStatsHoverIdx,
  onSetHoveredAllocationCat,
  onNavigateToCalendarHeatmap
}: StatisticsViewProps) {
  const telemetryAnalytics = computeTelemetryAnalytics(
    store,
    selectedDateISO,
    todayISO,
    statsTimeframe,
    habitStatsById
  );

  const {
    subtitle,
    points,
    totalAllocatedMins,
    capPct,
    allocationRows,
    topCategoryRow,
    maxStreak,
    daysLeft
  } = telemetryAnalytics;

  // SVG coordinate system matching the Cashflow reference layout
  const svgWidth = 680;
  const svgHeight = 265;
  const padLeft = 28;
  const padRight = 56;
  const padTop = 24;
  const padBottom = 38;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const maxVal = Math.max(
    120,
    ...points.map((p) => Math.max(p.plannedMins, p.actualMins, p.velocityMins))
  );
  const niceMax = Math.ceil(maxVal / 60) * 60;

  const getX = (idx: number) =>
    points.length <= 1
      ? padLeft + plotW / 2
      : padLeft + (idx / (points.length - 1)) * plotW;

  const getY = (val: number) =>
    padTop + plotH - (Math.max(0, Math.min(niceMax, val)) / niceMax) * plotH;

  const buildLinePath = (key: 'plannedMins' | 'actualMins' | 'velocityMins') =>
    points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p[key]).toFixed(1)}`)
      .join(' ');

  const plannedPath = buildLinePath('plannedMins');
  const actualPath = buildLinePath('actualMins');
  const velocityPath = buildLinePath('velocityMins');

  const areaBaselineY = padTop + plotH;
  const plannedAreaPath =
    points.length > 0
      ? `${plannedPath} L ${getX(points.length - 1).toFixed(1)} ${areaBaselineY} L ${getX(0).toFixed(1)} ${areaBaselineY} Z`
      : '';

  const showPlanned = statsSeriesFilter === 'all' || statsSeriesFilter === 'planned';
  const showActual = statsSeriesFilter === 'all' || statsSeriesFilter === 'actual';
  const showVelocity = statsSeriesFilter === 'all' || statsSeriesFilter === 'velocity';

  const yGridTicks = [1, 0.72, 0.44, 0.16].map((ratio) => {
    const mins = Math.round(niceMax * ratio);
    const y = getY(mins);
    return { mins, y, label: formatDurationMinutes(mins) };
  });

  const activeHoverIdx =
    statsHoverIdx !== null && statsHoverIdx >= 0 && statsHoverIdx < points.length
      ? statsHoverIdx
      : null;
  const hoveredPoint = activeHoverIdx !== null ? points[activeHoverIdx] : null;

  return (
    <div className="space-y-6">
      {/* Header & Unified 3-in-1 Timeframe Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Statistics & Telemetry</h1>
          <p className="text-xs text-slate-400">
            Interactive focus flow, execution velocity & category allocations
          </p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-2xl border border-white/[0.08] bg-[#10131c] p-1 self-start sm:self-auto">
          {[
            { id: 'daily' as const, label: 'Daily' },
            { id: 'weekly' as const, label: 'Weekly' },
            { id: 'monthly' as const, label: 'Monthly' }
          ].map((tf) => {
            const active = statsTimeframe === tf.id;
            return (
              <button
                key={tf.id}
                type="button"
                onClick={() => onSetStatsTimeframe(tf.id)}
                className={`kp-btn rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
              >
                {tf.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dual Analytics Row: Execution Flow + Focus Allocations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Card: Interactive Graph */}
        <div className="kp-card rounded-2xl border border-white/[0.08] bg-[#0d111a] p-5 sm:p-6 shadow-2xl lg:col-span-8 flex flex-col justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-extrabold tracking-tight text-white">
                  Execution Flow
                </h2>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
            </div>

            {/* Series Filter Pill Bar */}
            <div className="inline-flex items-center gap-1 rounded-xl border border-white/[0.07] bg-[#151a28] p-1 self-start">
              {[
                { id: 'all' as const, label: 'All' },
                { id: 'planned' as const, label: 'Planned' },
                { id: 'actual' as const, label: 'Actual' },
                { id: 'velocity' as const, label: 'Velocity' }
              ].map((tab) => {
                const isActive = statsSeriesFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onSetStatsSeriesFilter(tab.id)}
                    className={`kp-btn rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                      isActive
                        ? 'bg-[#22293e] text-blue-400 shadow-sm border border-blue-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive SVG Plot Container */}
          <div
            className="relative mt-5 select-none"
            onMouseLeave={() => onSetStatsHoverIdx(null)}
          >
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-64 sm:h-72 overflow-visible"
            >
              <defs>
                <linearGradient id="kpFlowAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
                  <stop offset="75%" stopColor="#3b82f6" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Dashed Grid Lines & Labels */}
              {yGridTicks.map((t, i) => (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={t.y}
                    x2={svgWidth - padRight + 8}
                    y2={t.y}
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={svgWidth - 4}
                    y={t.y + 3}
                    textAnchor="end"
                    className="fill-slate-500 text-[10px] font-semibold"
                  >
                    {t.label}
                  </text>
                </g>
              ))}

              {/* Shaded Area under Planned Line */}
              {showPlanned && plannedAreaPath && (
                <path d={plannedAreaPath} fill="url(#kpFlowAreaGrad)" />
              )}

              {/* Hover Crosshair */}
              {activeHoverIdx !== null && (
                <line
                  x1={getX(activeHoverIdx)}
                  y1={padTop - 6}
                  x2={getX(activeHoverIdx)}
                  y2={areaBaselineY}
                  stroke="#3b82f6"
                  strokeWidth="1.2"
                  strokeOpacity="0.6"
                />
              )}

              {/* Net Velocity Line */}
              {showVelocity && (
                <path
                  d={velocityPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Planned Line */}
              {showPlanned && (
                <path
                  d={plannedPath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Actual Line */}
              {showActual && (
                <path
                  d={actualPath}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.4"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Points */}
              {points.map((p, idx) => {
                const cx = getX(idx);
                const yPlan = getY(p.plannedMins);
                const yAct = getY(p.actualMins);
                const yVel = getY(p.velocityMins);
                const isHovered = activeHoverIdx === idx;

                return (
                  <g key={p.id}>
                    {showPlanned && (
                      <>
                        {isHovered && (
                          <circle
                            cx={cx}
                            cy={yPlan}
                            r="8"
                            fill="rgba(59, 130, 246, 0.18)"
                            stroke="#3b82f6"
                            strokeWidth="1.8"
                          />
                        )}
                        <circle
                          cx={cx}
                          cy={yPlan}
                          r={isHovered ? 4.2 : 3.2}
                          fill="#3b82f6"
                          stroke="#0d111a"
                          strokeWidth="1.5"
                        />
                      </>
                    )}

                    {showActual && (
                      <>
                        {isHovered && (
                          <circle
                            cx={cx}
                            cy={yAct}
                            r="8"
                            fill="rgba(244, 63, 94, 0.18)"
                            stroke="#f43f5e"
                            strokeWidth="1.8"
                          />
                        )}
                        <circle
                          cx={cx}
                          cy={yAct}
                          r={isHovered ? 4.2 : 3.2}
                          fill="#f43f5e"
                          stroke="#0d111a"
                          strokeWidth="1.5"
                        />
                      </>
                    )}

                    {showVelocity && isHovered && (
                      <>
                        <circle
                          cx={cx}
                          cy={yVel}
                          r="7"
                          fill="rgba(16, 185, 129, 0.18)"
                          stroke="#10b981"
                          strokeWidth="1.6"
                        />
                        <circle
                          cx={cx}
                          cy={yVel}
                          r="3.8"
                          fill="#10b981"
                          stroke="#0d111a"
                          strokeWidth="1.5"
                        />
                      </>
                    )}

                    {/* X-Axis Label */}
                    <text
                      x={cx}
                      y={svgHeight - 10}
                      textAnchor="middle"
                      className={`text-[11px] transition-colors ${
                        isHovered
                          ? 'fill-white font-extrabold'
                          : p.isCurrent
                          ? 'fill-blue-400 font-bold'
                          : 'fill-slate-500 font-medium'
                      }`}
                    >
                      {p.label}
                    </text>
                    {p.isCurrent && (
                      <circle cx={cx + 22} cy={svgHeight - 14} r="2.8" fill="#3b82f6" />
                    )}

                    {/* Hit Target */}
                    <rect
                      x={cx - plotW / Math.max(2, points.length * 2)}
                      y={padTop - 10}
                      width={plotW / Math.max(1, points.length)}
                      height={plotH + 28}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => onSetStatsHoverIdx(idx)}
                      onClick={() => onSetStatsHoverIdx(idx)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && activeHoverIdx !== null && (
              <div
                style={{
                  left:
                    activeHoverIdx >= points.length - 2
                      ? `${Math.max(6, ((getX(activeHoverIdx) - 195) / svgWidth) * 100)}%`
                      : `${Math.min(68, ((getX(activeHoverIdx) + 16) / svgWidth) * 100)}%`,
                  top: '10%'
                }}
                className="pointer-events-none absolute z-20 w-52 rounded-xl border border-white/15 bg-[#111624]/95 p-3.5 text-xs shadow-2xl backdrop-blur-md transition-all duration-150"
              >
                <div className="border-b border-white/10 pb-2 text-xs font-extrabold text-white">
                  {hoveredPoint.tooltipTitle}
                </div>
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sky-300">Planned:</span>
                    <span className="font-mono font-bold text-sky-400">
                      +{formatDurationMinutes(hoveredPoint.plannedMins)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-rose-300">Actual Focus:</span>
                    <span className="font-mono font-bold text-rose-400">
                      {formatDurationMinutes(hoveredPoint.actualMins)}
                    </span>
                  </div>
                  <div className="my-1.5 border-t border-white/[0.08]" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-400">Net Velocity:</span>
                    <span className="font-mono font-extrabold text-emerald-400">
                      {formatDurationMinutes(hoveredPoint.velocityMins)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Efficiency:</span>
                    <span className="font-mono text-slate-300">
                      {hoveredPoint.efficiencyPct}% ({hoveredPoint.habitsSummary})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Legend */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3.5 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  onSetStatsSeriesFilter((f) => (f === 'planned' ? 'all' : 'planned'))
                }
                className={`flex items-center gap-1.5 font-semibold transition ${
                  showPlanned ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />
                <span>Planned Capacity</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onSetStatsSeriesFilter((f) => (f === 'actual' ? 'all' : 'actual'))
                }
                className={`flex items-center gap-1.5 font-semibold transition ${
                  showActual ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-[#f43f5e]" />
                <span>Actual Focus</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onSetStatsSeriesFilter((f) => (f === 'velocity' ? 'all' : 'velocity'))
                }
                className={`flex items-center gap-1.5 font-semibold transition ${
                  showVelocity ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
                <span>Net Velocity</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-500">Live telemetry tracking</span>
          </div>
        </div>

        {/* Right Card: Focus Allocations */}
        <div className="kp-card rounded-2xl border border-white/[0.08] bg-[#0d111a] p-5 sm:p-6 shadow-2xl lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-blue-400" />
                <h2 className="text-base font-extrabold text-white">Focus Allocations</h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  onSetStatsTimeframe((prev) =>
                    prev === 'daily' ? 'weekly' : prev === 'weekly' ? 'monthly' : 'daily'
                  )
                }
                title="Click to cycle Daily / Weekly / Monthly"
                className="text-xs font-semibold lowercase text-slate-400 hover:text-indigo-300 transition"
              >
                {statsTimeframe}
              </button>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight text-white">
                {formatDurationMinutes(totalAllocatedMins)}
              </div>
              <div className="mt-0.5 text-xs text-slate-400">
                {capPct}% of {statsTimeframe} category targets
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 flex h-2.5 w-full items-center gap-1 overflow-hidden rounded-full bg-white/[0.05] p-0.5">
              {allocationRows.length === 0 ? (
                <div className="h-full w-full rounded-full bg-slate-700/50" />
              ) : (
                allocationRows.map((row) => (
                  <div
                    key={row.category}
                    onMouseEnter={() => onSetHoveredAllocationCat(row.category)}
                    onMouseLeave={() => onSetHoveredAllocationCat(null)}
                    style={{
                      width: `${Math.max(6, row.pct)}%`,
                      backgroundColor: row.color
                    }}
                    title={`${row.category}: ${formatDurationMinutes(row.minutes)} (${row.pct}%)`}
                    className={`h-full rounded-full transition-all duration-300 ${
                      hoveredAllocationCat && hoveredAllocationCat !== row.category
                        ? 'opacity-40'
                        : 'opacity-100'
                    }`}
                  />
                ))
              )}
            </div>

            {/* Category Breakdown List */}
            <div className="mt-4 space-y-2.5">
              {allocationRows.slice(0, 4).map((row) => (
                <div
                  key={row.category}
                  onMouseEnter={() => onSetHoveredAllocationCat(row.category)}
                  onMouseLeave={() => onSetHoveredAllocationCat(null)}
                  className={`flex items-center justify-between rounded-lg px-1.5 py-1 text-xs transition ${
                    hoveredAllocationCat === row.category ? 'bg-white/[0.05]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="font-semibold text-slate-200">{row.category}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-white">
                      {formatDurationMinutes(row.minutes)}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      ({row.pct}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Summary Stats */}
          <div className="mt-5 space-y-3 border-t border-white/[0.07] pt-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-400">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>Active Protocol Streak</span>
              </span>
              <span className="font-extrabold text-white">{maxStreak} Days</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-400">
                <CalendarIcon className="h-3.5 w-3.5 text-blue-400" />
                <span>Days Left</span>
              </span>
              <span className="font-extrabold text-white">{daysLeft} Days</span>
            </div>

            {topCategoryRow && (
              <div className="rounded-xl bg-white/[0.04] px-3 py-2 text-[11px] text-slate-400">
                Frequent:{' '}
                <strong className="text-white">{topCategoryRow.category}</strong> (
                {topCategoryRow.count} sessions)
              </div>
            )}

            <button
              type="button"
              onClick={onNavigateToCalendarHeatmap}
              className="kp-btn w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-center text-xs font-bold text-slate-200 hover:border-indigo-500/40 hover:bg-white/[0.06] hover:text-white"
            >
              View Daily Heatmap →
            </button>
          </div>
        </div>
      </div>

      {/* Secondary KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="kp-card kp-card-interactive rounded-2xl border border-white/[0.07] bg-[#10131c] p-5">
          <div className="text-xs text-slate-400">Task Completion Rate</div>
          <div className="mt-2 text-3xl font-extrabold text-indigo-400">
            {weeklyMetrics.taskCompletionPct}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {weeklyMetrics.completedTasksCount} of {weeklyMetrics.totalTasksCount} tasks completed
          </div>
        </div>
        <div className="kp-card kp-card-interactive rounded-2xl border border-white/[0.07] bg-[#10131c] p-5">
          <div className="text-xs text-slate-400">Weekly Planned vs Actual Time</div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-400">
            {formatDurationMinutes(weeklyMetrics.totalActualMins)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Planned: {formatDurationMinutes(weeklyMetrics.totalPlannedMins)}
          </div>
        </div>
        <div className="kp-card kp-card-interactive rounded-2xl border border-white/[0.07] bg-[#10131c] p-5">
          <div className="text-xs text-slate-400">Average Goal Progress</div>
          <div className="mt-2 text-3xl font-extrabold text-sky-400">
            {weeklyMetrics.avgGoalPct}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Across {weeklyMetrics.totalGoalsCount} active goals
          </div>
        </div>
      </div>
    </div>
  );
}
