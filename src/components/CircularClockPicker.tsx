import React, { useRef, useState } from 'react';
import { Lock, Moon, Sun } from 'lucide-react';
import { isNightHour } from '../types/menu';

interface CircularClockPickerProps {
  hours24: number;
  minutes: number;
  isChristmas?: boolean;
  isHalloween?: boolean;
  onChange: (next: { hours: number; minutes: number }) => void;
}

const CLOCK_SIZE = 228;
const CENTER = CLOCK_SIZE / 2;
const NUMBER_RADIUS = 84;

const OPEN_HOUR_24 = 17; // 5 PM
const CLOSE_HOUR_24 = 23; // 11 PM

const HOUR_LABELS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTE_LABELS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function isAllowedClockHour12(hour12: number): boolean {
  return hour12 >= 5 && hour12 <= 11;
}

export const CircularClockPicker: React.FC<CircularClockPickerProps> = ({
  hours24,
  minutes,
  isChristmas = false,
  isHalloween = false,
  onChange,
}) => {
  const festiveMode = isChristmas || isHalloween;
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const [isDragging, setIsDragging] = useState(false);
  const [minHourWarning, setMinHourWarning] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const clampedHours24 = Math.max(
    OPEN_HOUR_24,
    Math.min(CLOSE_HOUR_24, hours24)
  );
  const isNight = isNightHour(clampedHours24);
  const displayHour12 = clampedHours24 % 12 === 0 ? 12 : clampedHours24 % 12;
  const snappedMinutes = (Math.round(minutes / 5) * 5) % 60;

  const updateFromPointer = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = CLOCK_SIZE / rect.width;
    const scaleY = CLOCK_SIZE / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const dx = x - CENTER;
    const dy = y - CENTER;
    if (Math.hypot(dx, dy) < 14) return;

    const deg = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;
    const stepIndex = Math.round(deg / 30) % 12;

    if (mode === 'hour') {
      const pickedHour12 = stepIndex === 0 ? 12 : stepIndex;

      if (!isAllowedClockHour12(pickedHour12)) {
        const clamped = stepIndex === 0 ? CLOSE_HOUR_24 : OPEN_HOUR_24;
        setMinHourWarning(true);
        onChange({ hours: clamped, minutes });
        return;
      }

      setMinHourWarning(false);
      const nextHours24 = pickedHour12 + 12;
      onChange({ hours: nextHours24, minutes });
    } else {
      const nextMinutes = stepIndex * 5;
      onChange({ hours: clampedHours24, minutes: nextMinutes });
    }
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if already released
    }
    if (mode === 'hour') {
      setMode('minute');
    }
  };

  const activeStepIndex =
    mode === 'hour' ? displayHour12 % 12 : Math.round(minutes / 5) % 12;
  const handAngleRad = ((activeStepIndex * 30 - 90) * Math.PI) / 180;
  const handX = CENTER + NUMBER_RADIUS * Math.cos(handAngleRad);
  const handY = CENTER + NUMBER_RADIUS * Math.sin(handAngleRad);

  const rad5 = ((5 * 30 - 90) * Math.PI) / 180;
  const rad11 = ((11 * 30 - 90) * Math.PI) / 180;
  const arcStartX = CENTER + NUMBER_RADIUS * Math.cos(rad5);
  const arcStartY = CENTER + NUMBER_RADIUS * Math.sin(rad5);
  const arcEndX = CENTER + NUMBER_RADIUS * Math.cos(rad11);
  const arcEndY = CENTER + NUMBER_RADIUS * Math.sin(rad11);

  const panelBg = isChristmas
    ? 'bg-[#0D2117] border-emerald-500/30'
    : isHalloween
    ? 'bg-[#120821] border-purple-400/25'
    : 'bg-[#151519] border-white/10';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
      {/* Left Digital Readout + Schedule Info */}
      <div className="flex flex-col items-center sm:items-start gap-3">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-300 block text-center sm:text-left">
            Hora de recojo (desde 5:00 PM)
          </span>
          <p className="text-[11px] text-zinc-400 mt-0.5 text-center sm:text-left">
            {mode === 'hour'
              ? '1. Elige la hora (5 PM a 11 PM)'
              : '2. Elige los minutos en el reloj'}
          </p>
        </div>

        {/* Digital Clock Display */}
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center border rounded-2xl p-1.5 tabular-nums ${panelBg}`}
          >
            <button
              type="button"
              onClick={() => setMode('hour')}
              aria-label="Seleccionar hora en el reloj"
              className={`px-3 py-1.5 rounded-xl text-2xl sm:text-3xl font-black transition-colors cursor-pointer ${
                mode === 'hour'
                  ? 'bg-[#FF6012] text-white shadow-sm'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              {String(displayHour12).padStart(2, '0')}
            </button>
            <span className="px-1 text-2xl font-black text-zinc-500">:</span>
            <button
              type="button"
              onClick={() => setMode('minute')}
              aria-label="Seleccionar minutos en el reloj"
              className={`px-3 py-1.5 rounded-xl text-2xl sm:text-3xl font-black transition-colors cursor-pointer ${
                mode === 'minute'
                  ? 'bg-[#FF6012] text-white shadow-sm'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              {String(minutes).padStart(2, '0')}
            </button>
          </div>

          <span
            className={`px-3 py-2 rounded-xl border text-sm font-extrabold text-[#FF6012] uppercase ${panelBg}`}
          >
            PM
          </span>
        </div>

        {/* Quick Preset Chips starting at 5:00 PM */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
          {[
            { label: '5:00 PM', h: 17, m: 0 },
            { label: '6:30 PM', h: 18, m: 30 },
            { label: '8:15 PM', h: 20, m: 15 },
          ].map((preset) => {
            const active =
              clampedHours24 === preset.h && minutes === preset.m;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setMinHourWarning(false);
                  onChange({ hours: preset.h, minutes: preset.m });
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer tabular-nums ${
                  active
                    ? 'bg-[#FF6012] text-white'
                    : 'bg-white/8 hover:bg-white/15 text-zinc-300'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Day / Night KR Tariff or Min-Hour Feedback */}
        {minHourWarning ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-[11px] font-semibold text-amber-200">
            <Lock className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>Abrimos 5:00 PM · No se permite antes</span>
          </div>
        ) : (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold text-zinc-300 ${panelBg}`}
          >
            {isNight ? (
              <>
                <Moon
                  className="w-3.5 h-3.5 text-[#FF6012]"
                  aria-hidden="true"
                />
                <span>Desde 6:00 PM (Noche) · KR S/ 1.50</span>
              </>
            ) : (
              <>
                <Sun
                  className="w-3.5 h-3.5 text-amber-400"
                  aria-hidden="true"
                />
                <span>5:00 – 5:55 PM (Tarde) · KR S/ 1.00</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Interactive Circular Clock Dial */}
      <div className="relative shrink-0">
        <svg
          ref={svgRef}
          width={CLOCK_SIZE}
          height={CLOCK_SIZE}
          viewBox={`0 0 ${CLOCK_SIZE} ${CLOCK_SIZE}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          role="application"
          aria-label={
            mode === 'hour'
              ? 'Reloj circular para elegir hora de recojo desde las 5 PM'
              : 'Reloj circular para elegir minutos de recojo'
          }
          className="w-[208px] h-[208px] sm:w-[228px] sm:h-[228px] touch-none cursor-pointer select-none drop-shadow-lg"
        >
          {/* Outer Clock Face */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={CENTER - 4}
            fill={
              isChristmas
                ? '#0B1D14'
                : isHalloween
                ? '#130923'
                : '#16161B'
            }
            stroke={
              isChristmas
                ? 'rgba(34,197,94,0.35)'
                : isHalloween
                ? 'rgba(168,85,247,0.35)'
                : 'rgba(255,255,255,0.1)'
            }
            strokeWidth="2"
          />

          {/* Track Ring */}
          {mode === 'minute' ? (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={NUMBER_RADIUS}
              fill="none"
              stroke={
                isChristmas
                  ? 'rgba(34,197,94,0.2)'
                  : isHalloween
                  ? 'rgba(168,85,247,0.18)'
                  : 'rgba(255,96,18,0.1)'
              }
              strokeWidth="30"
            />
          ) : (
            <>
              <circle
                cx={CENTER}
                cy={CENTER}
                r={NUMBER_RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.025)"
                strokeWidth="30"
              />
              <path
                d={`M ${arcStartX} ${arcStartY} A ${NUMBER_RADIUS} ${NUMBER_RADIUS} 0 0 1 ${arcEndX} ${arcEndY}`}
                fill="none"
                stroke={
                  isChristmas
                    ? 'rgba(34,197,94,0.28)'
                    : isHalloween
                    ? 'rgba(168,85,247,0.24)'
                    : 'rgba(255,96,18,0.14)'
                }
                strokeWidth="30"
                strokeLinecap="round"
              />
            </>
          )}

          {/* Clock Hand Line */}
          <line
            x1={CENTER}
            y1={CENTER}
            x2={handX}
            y2={handY}
            stroke="#FF6012"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Center Pivot Dot */}
          <circle cx={CENTER} cy={CENTER} r="5" fill="#FF6012" />

          {/* Selected Value Highlight Bubble */}
          <circle cx={handX} cy={handY} r="18" fill="#FF6012" />

          {/* Numbers Ring */}
          {(mode === 'hour' ? HOUR_LABELS : MINUTE_LABELS).map((val, idx) => {
            const angleRad = ((idx * 30 - 90) * Math.PI) / 180;
            const nx = CENTER + NUMBER_RADIUS * Math.cos(angleRad);
            const ny = CENTER + NUMBER_RADIUS * Math.sin(angleRad);

            const isDisabledHour =
              mode === 'hour' && !isAllowedClockHour12(val);

            const isActive =
              mode === 'hour'
                ? val === displayHour12
                : val === snappedMinutes;

            return (
              <text
                key={`${mode}-${val}`}
                x={nx}
                y={ny}
                textAnchor="middle"
                dominantBaseline="central"
                fill={
                  isActive
                    ? '#FFFFFF'
                    : isDisabledHour
                    ? 'rgba(255,255,255,0.2)'
                    : '#E4E4EA'
                }
                fontSize="13"
                fontWeight={isActive ? '800' : isDisabledHour ? '500' : '700'}
                className="pointer-events-none tabular-nums"
              >
                {mode === 'minute' ? String(val).padStart(2, '0') : val}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
