import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Sparkles, Shield, Activity, TrendingUp,
  Users, AlertTriangle, Clock, Target,
  Zap, Eye, Lock, Unlock, Trash2, RotateCcw,
  Award, RefreshCw, Loader,
  Lightbulb, Package, BarChart3, DollarSign, Gauge,
  UserCheck, FileText, Bell, Info, LineChart,
  Wallet, Star, ArrowUpRight, ArrowDownRight, X
} from 'lucide-react';
import { useSettings } from './SettingsContext';
import {
  getInvoices, getCustomers, getUsers, getInventoryItems,
  getExpenses, getAdvances, getAttendance, getSalaries, getPurchases
} from './api';
import { supabase } from './integrations/supabase/client';

interface Props { user: { id: number; name: string; role: string } }

// ─── Gauge Chart ───
const GaugeChart = ({ value, size = 140, label }: { value: number; size?: number; label: string }) => {
  const r = (size - 30) / 2;
  const circumference = Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  const uid = `gauge-${label}-${Math.random().toString(36).slice(2, 6)}`;
  const color = value >= 80 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';
  const colorEnd = value >= 80 ? '#6ee7b7' : value >= 50 ? '#fde68a' : '#fca5a5';
  const status = value >= 80 ? (label ? '✓' : '') : value >= 50 ? '!' : '✗';
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size / 2 + 24} viewBox={`0 0 ${size} ${size / 2 + 24}`}>
        <defs>
          <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
          <filter id={`${uid}-shadow`}>
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.3" />
          </filter>
        </defs>
        {/* Background track */}
        <path d={`M 15 ${size / 2} A ${r} ${r} 0 0 1 ${size - 15} ${size / 2}`}
          fill="none" stroke="hsl(var(--muted))" strokeWidth="12" strokeLinecap="round" />
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = Math.PI - (tick / 100) * Math.PI;
          const x1 = size / 2 + Math.cos(angle) * (r - 8);
          const y1 = size / 2 - Math.sin(angle) * (r - 8);
          const x2 = size / 2 + Math.cos(angle) * (r + 8);
          const y2 = size / 2 - Math.sin(angle) * (r + 8);
          return <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--border))" strokeWidth="1.5" opacity={0.5} />;
        })}
        {/* Value arc */}
        <motion.path d={`M 15 ${size / 2} A ${r} ${r} 0 0 1 ${size - 15} ${size / 2}`}
          fill="none" stroke={`url(#${uid})`} strokeWidth="12" strokeLinecap="round"
          filter={`url(#${uid}-shadow)`}
          strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 1.8, ease: "easeOut" }} />
        {/* Center value */}
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle" className="fill-foreground" fontSize="26" fontWeight="900">{value}</text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fill={color} fontSize="11" fontWeight="700">{status}</text>
      </svg>
      <span className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">{label}</span>
    </div>
  );
};

// ─── Tooltip Component ───
const ChartTooltip = ({ x, y, content, visible }: { x: number; y: number; content: string; visible: boolean }) => {
  if (!visible) return null;
  return (
    <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }}>
      <rect x={x - 45} y={y - 32} width="90" height="24" rx="6"
        fill="hsl(var(--popover))" stroke="hsl(var(--border))" strokeWidth="1" filter="url(#tooltip-shadow)" />
      <text x={x} y={y - 17} textAnchor="middle" dominantBaseline="middle"
        className="fill-popover-foreground" fontSize="10" fontWeight="700">{content}</text>
      <polygon points={`${x - 5},${y - 8} ${x + 5},${y - 8} ${x},${y - 2}`} fill="hsl(var(--popover))" />
    </motion.g>
  );
};

// ─── Donut Chart ───
const DonutChart = ({ segments, size = 160, label }: { segments: { value: number; color: string; label: string }[]; size?: number; label?: string }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const r = (size - 40) / 2;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let accumulated = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="tooltip-shadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" /></filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="14" />
        {segments.map((seg, i) => {
          const segLen = (seg.value / total) * circumference;
          const rotation = (accumulated / total) * 360 - 90;
          accumulated += seg.value;
          const isHov = hovered === i;
          return (
            <motion.circle key={i} cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={seg.color} strokeWidth={isHov ? 20 : 14} strokeLinecap="round"
              strokeDasharray={`${segLen} ${circumference - segLen}`}
              style={{ transformOrigin: `${size / 2}px ${size / 2}px`, cursor: 'pointer' }}
              initial={{ rotate: rotation, opacity: 0 }}
              animate={{ rotate: rotation, opacity: 1, strokeWidth: isHov ? 20 : 14 }}
              transition={{ duration: 0.3 }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)} />
          );
        })}
        {hovered !== null && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <text x={size / 2} y={size / 2 - 6} textAnchor="middle" className="fill-foreground" fontSize="16" fontWeight="900">
              {segments[hovered].value.toLocaleString()}
            </text>
            <text x={size / 2} y={size / 2 + 12} textAnchor="middle" className="fill-muted-foreground" fontSize="10" fontWeight="600">
              {segments[hovered].label} ({((segments[hovered].value / total) * 100).toFixed(1)}%)
            </text>
          </motion.g>
        )}
        {hovered === null && label && <text x={size / 2} y={size / 2 + 5} textAnchor="middle" className="fill-foreground" fontSize="13" fontWeight="800">{label}</text>}
      </svg>
      <div className="flex flex-wrap justify-center gap-3">
        {segments.map((seg, i) => (
          <div key={i} className={`flex items-center gap-1.5 cursor-pointer transition-all ${hovered === i ? 'scale-110' : ''}`}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-[10px] font-semibold text-muted-foreground">{seg.label} ({seg.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Area Chart ───
const AreaChart = ({ data, height = 160, color = 'hsl(var(--primary))', labels }: { data: number[]; height?: number; color?: string; labels?: string[] }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const filteredData = data.filter(v => v > 0);
  if (filteredData.length < 2) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-xs font-semibold opacity-50">
        لا توجد بيانات كافية للرسم البياني
      </div>
    );
  }
  const padding = { top: 25, right: 15, bottom: 10, left: 15 };
  const w = 500;
  const h = height;
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const max = Math.max(...filteredData, 1);
  const min = 0;
  const range = max - min || 1;

  const points = filteredData.map((v, i) => ({
    x: padding.left + (i / Math.max(filteredData.length - 1, 1)) * chartW,
    y: padding.top + chartH - ((v - min) / range) * chartH,
    value: v,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x || 0} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`;
  const uid = `area-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
        <filter id={`${uid}-ts`}><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" /></filter>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
        <line key={i} x1={padding.left} x2={w - padding.right}
          y1={padding.top + chartH * (1 - ratio)} y2={padding.top + chartH * (1 - ratio)}
          stroke="hsl(var(--border))" strokeWidth="0.6" strokeDasharray="4,4" opacity={0.3} />
      ))}
      <motion.path d={areaPath} fill={`url(#${uid}-fill)`}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />
      <motion.path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeOut" }} />
      {/* Hover vertical line */}
      {hoveredIdx !== null && (
        <line x1={points[hoveredIdx].x} x2={points[hoveredIdx].x}
          y1={padding.top} y2={padding.top + chartH}
          stroke={color} strokeWidth="1" strokeDasharray="3,3" opacity={0.5} />
      )}
      {/* Data points with hover */}
      {points.map((p, i) => (
        <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} style={{ cursor: 'pointer' }}>
          <circle cx={p.x} cy={p.y} r="12" fill="transparent" />
          <circle cx={p.x} cy={p.y} r={hoveredIdx === i ? 7 : 5} fill={color} opacity={hoveredIdx === i ? 0.25 : 0.12}
            style={{ transition: 'all 0.2s' }} />
          <motion.circle cx={p.x} cy={p.y} r={hoveredIdx === i ? 5 : 3} fill={color} stroke="hsl(var(--card))" strokeWidth="1.5"
            initial={{ scale: 0 }} animate={{ scale: hoveredIdx === i ? 1.3 : 1 }}
            transition={{ delay: hoveredIdx === i ? 0 : 0.3 + i * 0.04 }} />
        </g>
      ))}
      {/* Tooltip */}
      {hoveredIdx !== null && (
        <ChartTooltip x={points[hoveredIdx].x} y={points[hoveredIdx].y}
          content={`${labels?.[hoveredIdx] || `#${hoveredIdx + 1}`}: ${points[hoveredIdx].value.toLocaleString()}`}
          visible={true} />
      )}
    </svg>
  );
};



// ─── Radar Chart ───
const RadarChart = ({ data, labels, size = 260, colors }: { data: number[]; labels: string[]; size?: number; colors?: string[] }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const cx = size / 2, cy = size / 2, r = size * 0.32;
  const n = data.length;
  const angleStep = (Math.PI * 2) / n;
  const levels = [0.2, 0.4, 0.6, 0.8, 1];
  const uid = `radar-${Math.random().toString(36).slice(2, 6)}`;

  const getPoint = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2;
    return { x: cx + Math.cos(angle) * r * value, y: cy + Math.sin(angle) * r * value };
  };

  const dataPoints = data.map((v, i) => getPoint(i, v / 100));
  const pathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size}`} className="max-w-[320px] mx-auto">
      <defs>
        <linearGradient id={`${uid}-fill`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.28" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
        </linearGradient>
        <filter id={`${uid}-glow`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={`${uid}-ts`}><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" /></filter>
      </defs>
      {(() => {
        const pts = Array.from({ length: n }, (_, i) => getPoint(i, 1));
        return <polygon points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="hsl(var(--muted))" opacity={0.15} />;
      })()}
      {levels.map((l) => {
        const pts = Array.from({ length: n }, (_, i) => getPoint(i, l));
        return <polygon key={l} points={pts.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none" stroke="hsl(var(--border))" strokeWidth="0.7" opacity={0.35}
          strokeDasharray={l < 1 ? "2,3" : "none"} />;
      })}
      {Array.from({ length: n }, (_, i) => {
        const p = getPoint(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y}
          stroke={hoveredIdx === i ? "hsl(var(--primary))" : "hsl(var(--border))"} strokeWidth={hoveredIdx === i ? 1.5 : 0.5} opacity={hoveredIdx === i ? 0.6 : 0.25}
          style={{ transition: 'all 0.2s' }} />;
      })}
      <motion.path d={pathD} fill={`url(#${uid}-fill)`} stroke="hsl(var(--primary))" strokeWidth="2.5"
        filter={`url(#${uid}-glow)`} strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.2 }} animate={{ opacity: 1, scale: 1 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }} transition={{ duration: 1.2, ease: "easeOut" }} />
      {dataPoints.map((p, i) => {
        const isHov = hoveredIdx === i;
        return (
          <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} style={{ cursor: 'pointer' }}>
            <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
            <circle cx={p.x} cy={p.y} r={isHov ? 10 : 7} fill={colors?.[i] || "hsl(var(--primary))"} opacity={isHov ? 0.2 : 0.12}
              style={{ transition: 'all 0.2s' }} />
            <motion.circle cx={p.x} cy={p.y} r={isHov ? 6 : 4} fill={colors?.[i] || "hsl(var(--primary))"} stroke="hsl(var(--card))" strokeWidth="2"
              animate={{ scale: isHov ? 1.4 : 1 }} transition={{ duration: 0.2 }} />
          </g>
        );
      })}
      {hoveredIdx !== null && (
        <ChartTooltip x={dataPoints[hoveredIdx].x} y={dataPoints[hoveredIdx].y}
          content={`${labels[hoveredIdx]}: ${Math.round(data[hoveredIdx])}%`} visible={true} />
      )}
      {Array.from({ length: n }, (_, i) => {
        const p = getPoint(i, 1.35);
        const val = Math.round(data[i]);
        const isHov = hoveredIdx === i;
        return (
          <g key={`label-${i}`} style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
            <text x={p.x} y={p.y - 7} textAnchor="middle" dominantBaseline="middle"
              className="fill-foreground" fontSize={isHov ? "11" : "9.5"} fontWeight="800"
              style={{ transition: 'font-size 0.2s' }}>{labels[i]}</text>
            <rect x={p.x - 14} y={p.y + 1} width="28" height="14" rx="4"
              fill={val >= 70 ? '#10b98120' : val >= 40 ? '#f59e0b20' : '#ef444420'} />
            <text x={p.x} y={p.y + 9} textAnchor="middle" dominantBaseline="middle"
              fill={val >= 70 ? '#10b981' : val >= 40 ? '#f59e0b' : '#ef4444'}
              fontSize="8.5" fontWeight="800">{val}%</text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Heatmap Chart ───
const HeatmapChart = ({ data, xLabels, yLabels }: { data: number[][]; xLabels: string[]; yLabels: string[] }) => {
  const [hovered, setHovered] = useState<{ x: number; y: number } | null>(null);
  const maxVal = Math.max(...data.flat(), 1);
  const cols = xLabels.length;
  const rows = yLabels.length;
  const cellW = 38;
  const cellH = 30;
  const labelW = 48;
  const labelH = 22;
  const totalW = labelW + cols * cellW + 12;
  const totalH = labelH + rows * cellH + 30;
  const uid = `hm-${Math.random().toString(36).slice(2, 6)}`;

  const getColor = (val: number) => {
    const intensity = val / maxVal;
    if (intensity < 0.05) return 'hsl(var(--muted))';
    const alpha = 0.12 + intensity * 0.78;
    return `hsl(var(--primary) / ${alpha.toFixed(2)})`;
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" viewBox={`0 0 ${totalW} ${totalH}`} className="min-w-[340px]" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id={`${uid}-ts`}><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" /></filter>
        </defs>
        {yLabels.map((l, i) => (
          <text key={`y-${i}`} x={labelW - 8} y={labelH + i * cellH + cellH / 2}
            textAnchor="end" dominantBaseline="middle"
            className="fill-muted-foreground" fontSize="9" fontWeight="700">{l}</text>
        ))}
        {xLabels.map((l, i) => (
          <text key={`x-${i}`} x={labelW + i * cellW + cellW / 2} y={14}
            textAnchor="middle" dominantBaseline="middle"
            className="fill-muted-foreground" fontSize="8.5" fontWeight="700">{l}</text>
        ))}
        {data.map((row, y) => row.map((val, x) => {
          const isHov = hovered?.x === x && hovered?.y === y;
          return (
            <motion.rect key={`${x}-${y}`}
              x={labelW + x * cellW + 2} y={labelH + y * cellH + 2}
              width={cellW - 4} height={cellH - 4} rx="5"
              fill={getColor(val)}
              stroke={isHov ? 'hsl(var(--primary))' : 'transparent'} strokeWidth={isHov ? 2 : 0}
              style={{ cursor: 'pointer' }}
              initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: isHov ? 1.08 : 1 }}
              transition={{ delay: isHov ? 0 : (x + y) * 0.012, duration: 0.2 }}
              onMouseEnter={() => setHovered({ x, y })}
              onMouseLeave={() => setHovered(null)} />
          );
        }))}
        {data.map((row, y) => row.map((val, x) => val > 0 ? (
          <text key={`v-${x}-${y}`}
            x={labelW + x * cellW + cellW / 2} y={labelH + y * cellH + cellH / 2}
            textAnchor="middle" dominantBaseline="middle"
            className={val / maxVal > 0.5 ? 'fill-white' : 'fill-muted-foreground'}
            fontSize="8.5" fontWeight="800" opacity={0.85} style={{ pointerEvents: 'none' }}>{val}</text>
        ) : null))}
        {hovered && (() => {
          const val = data[hovered.y][hovered.x];
          const tx = labelW + hovered.x * cellW + cellW / 2;
          const ty = labelH + hovered.y * cellH - 4;
          return (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <rect x={tx - 50} y={ty - 28} width="100" height="22" rx="6"
                fill="hsl(var(--popover))" stroke="hsl(var(--border))" strokeWidth="1" filter={`url(#${uid}-ts)`} />
              <text x={tx} y={ty - 14} textAnchor="middle" dominantBaseline="middle"
                className="fill-popover-foreground" fontSize="9" fontWeight="700">
                {yLabels[hovered.y]} × {xLabels[hovered.x]}: {val}
              </text>
            </motion.g>
          );
        })()}
        <defs>
          <linearGradient id="heatmap-legend" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(var(--muted))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>
        <rect x={labelW} y={totalH - 18} width={cols * cellW} height="8" rx="4" fill="url(#heatmap-legend)" opacity={0.7} />
        <text x={labelW - 2} y={totalH - 12} textAnchor="end" className="fill-muted-foreground" fontSize="7" fontWeight="600">0</text>
        <text x={labelW + cols * cellW + 4} y={totalH - 12} textAnchor="start" className="fill-muted-foreground" fontSize="7" fontWeight="600">{maxVal}</text>
      </svg>
    </div>
  );
};

// ─── Network Graph ───
const NetworkGraph = ({ nodes, links }: { nodes: { id: string; label: string; size: number; color: string }[]; links: { source: string; target: string }[] }) => {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const size = 300;
  const cx = size / 2, cy = size / 2, r = size * 0.32;
  const positions = nodes.map((_, i) => {
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });
  const nodeMap = Object.fromEntries(nodes.map((n, i) => [n.id, i]));
  const uid = `net-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size}`} className="max-w-[360px] mx-auto">
      <defs>
        <filter id={`${uid}-shadow`}>
          <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodOpacity="0.15" />
        </filter>
        <filter id={`${uid}-ts`}><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" /></filter>
      </defs>
      {links.map((l, i) => {
        const si = nodeMap[l.source], ti = nodeMap[l.target];
        if (si === undefined || ti === undefined) return null;
        const mx = (positions[si].x + positions[ti].x) / 2;
        const my = (positions[si].y + positions[ti].y) / 2;
        const cx2 = mx + (cy - my) * 0.2;
        const cy2 = my + (mx - cx) * 0.2;
        const isHighlighted = hoveredNode === si || hoveredNode === ti;
        return <motion.path key={i}
          d={`M ${positions[si].x} ${positions[si].y} Q ${cx2} ${cy2} ${positions[ti].x} ${positions[ti].y}`}
          fill="none" stroke={isHighlighted ? "hsl(var(--primary))" : "hsl(var(--border))"} 
          strokeWidth={isHighlighted ? 2.5 : 1.5} opacity={isHighlighted ? 0.6 : 0.3}
          style={{ transition: 'all 0.2s' }}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: i * 0.03 }} />;
      })}
      {nodes.map((n, i) => {
        const nodeR = Math.max(n.size * 4, 12);
        const isHov = hoveredNode === i;
        return (
          <g key={n.id} filter={`url(#${uid}-shadow)`} style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredNode(i)} onMouseLeave={() => setHoveredNode(null)}>
            <motion.circle cx={positions[i].x} cy={positions[i].y} r={nodeR + 6}
              fill="none" stroke={n.color} strokeWidth={isHov ? 2.5 : 1.5} opacity={isHov ? 0.4 : 0.2}
              animate={{ r: isHov ? [nodeR + 6, nodeR + 12, nodeR + 6] : [nodeR + 5, nodeR + 9, nodeR + 5] }}
              transition={{ duration: isHov ? 1.5 : 3, repeat: Infinity, ease: "easeInOut" }} />
            <motion.circle cx={positions[i].x} cy={positions[i].y} r={nodeR}
              fill={n.color} opacity={isHov ? 1 : 0.9} stroke="hsl(var(--card))" strokeWidth="2"
              animate={{ scale: isHov ? 1.15 : 1 }}
              style={{ transformOrigin: `${positions[i].x}px ${positions[i].y}px` }}
              transition={{ duration: 0.2 }} />
            <rect x={positions[i].x - 22} y={positions[i].y + nodeR + 6} width="44" height="14" rx="4"
              fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.9} />
            <text x={positions[i].x} y={positions[i].y + nodeR + 15} textAnchor="middle"
              className="fill-foreground" fontSize="7.5" fontWeight="800">{n.label.slice(0, 8)}</text>
          </g>
        );
      })}
      {hoveredNode !== null && (() => {
        const hnR = Math.max(nodes[hoveredNode].size * 4, 12);
        return (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <rect x={positions[hoveredNode].x - 50} y={positions[hoveredNode].y - hnR - 30}
              width="100" height="22" rx="6"
              fill="hsl(var(--popover))" stroke="hsl(var(--border))" strokeWidth="1" filter={`url(#${uid}-ts)`} />
            <text x={positions[hoveredNode].x} y={positions[hoveredNode].y - hnR - 16}
              textAnchor="middle" dominantBaseline="middle"
              className="fill-popover-foreground" fontSize="9" fontWeight="700">
              {nodes[hoveredNode].label} (حجم: {nodes[hoveredNode].size})
            </text>
          </motion.g>
        );
      })()}
      {[
        { color: '#10b981', label: '● In Stock' },
        { color: '#f59e0b', label: '● Low' },
        { color: '#ef4444', label: '● Out' },
      ].map((item, i) => (
        <g key={i}>
          <circle cx={15} cy={size - 40 + i * 14} r="4" fill={item.color} />
          <text x={24} y={size - 40 + i * 14 + 1} className="fill-muted-foreground" fontSize="8" fontWeight="600" dominantBaseline="middle">{item.label}</text>
        </g>
      ))}
    </svg>
  );
};

// ─── Risk Badge ───
const RiskBadge = ({ level }: { level: string }) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    low: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'منخفض' },
    medium: { bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'متوسط' },
    high: { bg: 'bg-red-500/10', text: 'text-red-600', label: 'مرتفع' },
    critical: { bg: 'bg-red-600/20', text: 'text-red-700', label: 'حرج' },
    info: { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'معلومة' },
    warning: { bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'تحذير' },
  };
  const c = config[level] || config.low;
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${c.bg} ${c.text}`}>{c.label}</span>;
};

// ─── AI Notification System ───
interface AINotification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  read: boolean;
}

const AINotificationPanel = ({ notifications, onClose, onClear, onMarkRead, isAr }: {
  notifications: AINotification[]; onClose: () => void; onClear: () => void; onMarkRead: (id: string) => void; isAr: boolean;
}) => (
  <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
    className="absolute top-14 end-0 w-[360px] bg-card border border-border rounded-2xl shadow-2xl z-[100] overflow-hidden">
    <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Bell size={14} className="text-primary" />
        <span className="text-xs font-bold">{isAr ? 'تنبيهات AI' : 'AI Alerts'}</span>
        {notifications.filter(n => !n.read).length > 0 && (
          <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">{notifications.filter(n => !n.read).length}</span>
        )}
      </div>
      <div className="flex gap-1">
        <button onClick={onClear} className="text-[10px] text-muted-foreground hover:text-red-500 px-2 py-1 rounded transition-all">{isAr ? 'مسح' : 'Clear'}</button>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={14} /></button>
      </div>
    </div>
    <div className="max-h-[350px] overflow-y-auto p-2 space-y-1">
      {notifications.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground text-xs">{isAr ? 'لا توجد تنبيهات' : 'No alerts'}</p>
      ) : notifications.map(n => (
        <motion.div key={n.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
          onClick={() => onMarkRead(n.id)}
          className={`p-3 rounded-xl cursor-pointer transition-all ${n.read ? 'opacity-60' : ''} ${n.severity === 'critical' ? 'bg-red-500/5 border border-red-500/20' : n.severity === 'warning' ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-muted/30 border border-transparent'}`}>
          <div className="flex items-start gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${n.severity === 'critical' ? 'bg-red-500/10' : n.severity === 'warning' ? 'bg-amber-500/10' : 'bg-blue-500/10'}`}>
              {n.severity === 'critical' ? <AlertTriangle size={12} className="text-red-500" /> :
                n.severity === 'warning' ? <Bell size={12} className="text-amber-500" /> :
                  <Info size={12} className="text-blue-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-foreground">{n.title}</p>
              <p className="text-[10px] text-muted-foreground line-clamp-2">{n.message}</p>
              <p className="text-[9px] text-muted-foreground mt-1">{new Date(n.timestamp).toLocaleString('ar-EG')}</p>
            </div>
            {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

// ─── DB helpers ───
async function loadCachedResults(): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase.from('ai_analysis_results').select('analysis_type, result_data, updated_at');
    if (error) throw error;
    const map: Record<string, any> = {};
    data?.forEach((row: any) => { map[row.analysis_type] = { data: row.result_data, updatedAt: row.updated_at }; });
    return map;
  } catch (e) { console.error('Failed to load cached AI results:', e); return {}; }
}

async function saveCachedResult(analysisType: string, resultData: any) {
  try {
    await supabase.from('ai_analysis_results').upsert({ analysis_type: analysisType, result_data: resultData }, { onConflict: 'analysis_type' });
  } catch (e) { console.error('Failed to save AI result:', e); }
}

async function saveDecisionLog(decisions: any[]) {
  try {
    const rows = decisions.map((d: any) => ({
      title: d.title || '', description: d.description || '', action: d.action || '',
      severity: d.severity || 'info', target_name: d.targetName || '', target_type: d.targetType || '',
      reasoning: d.reasoning || '', executed_by: 'AI',
    }));
    if (rows.length > 0) await supabase.from('ai_decision_log').insert(rows);
  } catch (e) { console.error('Failed to save decision log:', e); }
}

async function loadDecisionLog(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from('ai_decision_log').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return (data || []).map((d: any) => ({ ...d, timestamp: d.created_at, targetName: d.target_name, targetType: d.target_type, executedBy: d.executed_by }));
  } catch (e) { console.error('Failed to load decision log:', e); return []; }
}

const AIAnalyticsPage: React.FC<Props> = ({ user }) => {
  const { settings } = useSettings();
  const isAr = settings.lang === 'ar';
  const [activeTab, setActiveTab] = useState<string>('analytics');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const [analyticsResult, setAnalyticsResult] = useState<any>(null);
  const [decisionsResult, setDecisionsResult] = useState<any>(null);
  const [monitoringResult, setMonitoringResult] = useState<any>(null);
  const [rawData, setRawData] = useState<any>(null);

  const [permissions, setPermissions] = useState<Record<number, { view: boolean; edit: boolean; delete: boolean; add: boolean; pages: string[] }>>({});
  const [employees, setEmployees] = useState<any[]>([]);
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [decisionLog, setDecisionLog] = useState<any[]>([]);

  // Notifications
  const [aiNotifications, setAiNotifications] = useState<AINotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = aiNotifications.filter(n => !n.read).length;

  const addNotification = useCallback((title: string, message: string, severity: AINotification['severity']) => {
    const n: AINotification = { id: Date.now().toString(), title, message, severity, timestamp: new Date().toISOString(), read: false };
    setAiNotifications(prev => [n, ...prev].slice(0, 30));
  }, []);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  const runningRef = useRef<Set<string>>(new Set());

  const allPages = [
    { key: 'dashboard', label: isAr ? 'لوحة التحكم' : 'Dashboard' },
    { key: 'customers', label: isAr ? 'العملاء' : 'Customers' },
    { key: 'invoices', label: isAr ? 'الفواتير' : 'Invoices' },
    { key: 'pricing', label: isAr ? 'الأسعار' : 'Pricing' },
    { key: 'purchases', label: isAr ? 'المخزون' : 'Inventory' },
    { key: 'expenses', label: isAr ? 'المصاريف' : 'Expenses' },
    { key: 'reports', label: isAr ? 'التقارير' : 'Reports' },
    { key: 'users', label: isAr ? 'المستخدمين' : 'Users' },
    { key: 'settings', label: isAr ? 'الإعدادات' : 'Settings' },
  ];

  const fetchBusinessData = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, cust, usr, items, exp, adv, att, sal, purch] = await Promise.all([
        getInvoices().catch(() => ({ data: [] })), getCustomers().catch(() => ({ data: [] })),
        getUsers().catch(() => ({ data: [] })), getInventoryItems().catch(() => ({ data: [] })),
        getExpenses().catch(() => ({ data: [] })), getAdvances().catch(() => ({ data: [] })),
        getAttendance().catch(() => ({ data: [] })), getSalaries().catch(() => ({ data: [] })),
        getPurchases().catch(() => ({ data: [] })),
      ]);
      const data = {
        invoices: Array.isArray(inv.data) ? inv.data : [], customers: Array.isArray(cust.data) ? cust.data : [],
        employees: Array.isArray(usr.data) ? usr.data : [], inventory: Array.isArray(items.data) ? items.data : [],
        expenses: Array.isArray(exp.data) ? exp.data : [], advances: Array.isArray(adv.data) ? adv.data : [],
        attendance: Array.isArray(att.data) ? att.data : [], salaries: Array.isArray(sal.data) ? sal.data : [],
        purchases: Array.isArray(purch.data) ? purch.data : [],
      };
      setRawData(data);
      setEmployees(data.employees);
      const perms: typeof permissions = {};
      data.employees.forEach((e: any) => {
        perms[e.id] = permissions[e.id] || {
          view: true, edit: e.role === 'admin', delete: e.role === 'admin',
          add: e.role !== 'user', pages: e.role === 'admin' ? allPages.map(p => p.key) : ['dashboard', 'customers', 'invoices'],
        };
      });
      setPermissions(perms);
      setLastUpdate(new Date().toLocaleTimeString('ar-EG'));
    } catch { showToast(isAr ? 'فشل تحميل البيانات' : 'Failed to load data', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const loadCached = async () => {
      const [cached, log] = await Promise.all([loadCachedResults(), loadDecisionLog()]);
      if (cached['full-analysis']?.data) { setAnalyticsResult(cached['full-analysis'].data); setLastUpdate(new Date(cached['full-analysis'].updatedAt).toLocaleTimeString('ar-EG')); }
      if (cached['decisions']?.data) setDecisionsResult(cached['decisions'].data);
      if (cached['monitoring']?.data) setMonitoringResult(cached['monitoring'].data);
      if (log.length > 0) setDecisionLog(log);
    };
    loadCached();
    fetchBusinessData();
  }, []);

  const [aiAutoRan, setAiAutoRan] = useState(false);
  useEffect(() => {
    if (rawData && !aiAutoRan && !aiLoading && !analyticsResult && !decisionsResult && !monitoringResult) {
      setAiAutoRan(true); runAI('full-analysis'); runAI('decisions'); runAI('monitoring');
    }
  }, [rawData, aiAutoRan, analyticsResult]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (rawData && !aiLoading) {
        fetchBusinessData().then(() => { runAI('full-analysis'); runAI('decisions'); runAI('monitoring'); });
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [rawData, aiLoading]);

  const getExternalModels = () => {
    const models = (settings as any).aiModels;
    if (!models || !Array.isArray(models)) return [];
    return models.filter((m: any) => m.active && m.apiKey).map((m: any) => ({ provider: m.provider, apiKey: m.apiKey, model: m.model, endpoint: m.endpoint }));
  };

  const runAI = async (type: string) => {
    if (!rawData) { showToast(isAr ? 'يرجى تحميل البيانات أولاً' : 'Load data first', 'error'); return; }
    if (runningRef.current.has(type)) return;
    runningRef.current.add(type);
    setAiLoading(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/ai-analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ businessData: rawData, analysisType: type, externalModels: getExternalModels() }),
      });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        const errorMsg = errData.error || `HTTP ${resp.status}`;
        if (resp.status === 402) { showToast(isAr ? `⚠️ ${errorMsg}` : '⚠️ AI credits exhausted', 'error'); return; }
        if (resp.status === 429) { showToast(isAr ? '⏳ تم تجاوز حد الطلبات' : '⏳ Rate limited', 'error'); return; }
        throw new Error(errorMsg);
      }
      const data = await resp.json();

      if (type === 'full-analysis') {
        setAnalyticsResult(data);
        saveCachedResult('full-analysis', data);
        // Generate notifications from fraud alerts
        if (data?.fraudAlerts?.length > 0) {
          data.fraudAlerts.forEach((a: any) => {
            if (a.severity === 'high' || a.severity === 'critical') {
              addNotification(isAr ? '🚨 نشاط مشبوه' : '🚨 Suspicious Activity', `${a.type}: ${a.description}`, 'critical');
            }
          });
        }
      } else if (type === 'decisions') {
        setDecisionsResult(data);
        saveCachedResult('decisions', data);
        if (data?.decisions) {
          saveDecisionLog(data.decisions);
          setDecisionLog(prev => [...data.decisions.map((d: any) => ({ ...d, timestamp: new Date().toISOString(), executedBy: 'AI' })), ...prev].slice(0, 50));
          // Generate notifications from critical decisions
          data.decisions.forEach((d: any) => {
            if (d.severity === 'critical' || d.severity === 'warning') {
              addNotification(
                d.severity === 'critical' ? (isAr ? '🔴 قرار حرج' : '🔴 Critical Decision') : (isAr ? '⚠️ تحذير' : '⚠️ Warning'),
                `${d.title}: ${d.description}`,
                d.severity === 'critical' ? 'critical' : 'warning'
              );
            }
          });
        }
      } else if (type === 'monitoring') {
        setMonitoringResult(data);
        saveCachedResult('monitoring', data);
        // Generate notifications from anomalies
        if (data?.anomalies?.length > 0) {
          data.anomalies.filter((a: any) => a.severity === 'high' || a.severity === 'critical').forEach((a: any) => {
            addNotification(isAr ? '⚡ نشاط غير طبيعي' : '⚡ Anomaly Detected', `${a.type}: ${a.description}`, 'critical');
          });
        }
      }

      setLastUpdate(new Date().toLocaleTimeString('ar-EG'));
      showToast(isAr ? 'تم التحليل بنجاح ✨' : 'Analysis complete ✨', 'success');
    } catch (e: any) {
      showToast(e?.message || (isAr ? 'فشل التحليل' : 'Analysis failed'), 'error');
    } finally { runningRef.current.delete(type); setAiLoading(false); }
  };

  const _moveToTrash = useCallback((item: any, type: string) => {
    setTrashItems(prev => [{ ...item, _trashType: type, _deletedAt: new Date().toISOString(), _deletedBy: user.name }, ...prev]);
    showToast(isAr ? 'تم النقل لسلة المهملات' : 'Moved to trash', 'info');
  }, [user.name, isAr]);
  void _moveToTrash;

  const restoreFromTrash = (index: number) => {
    setTrashItems(prev => prev.filter((_, i) => i !== index));
    showToast(isAr ? 'تم الاستعادة' : 'Restored', 'success');
  };

  // Generate chart data from raw data
  const getEmployeeRadarData = () => {
    if (!rawData?.employees?.length) return { data: [70, 60, 80, 50, 90], labels: ['أداء', 'حضور', 'مبيعات', 'مهام', 'جودة'] };
    const empCount = rawData.employees.length;
    const invCount = rawData.invoices.length;
    return {
      data: [
        Math.min(100, (invCount / Math.max(empCount, 1)) * 10),
        Math.min(100, rawData.attendance?.length ? (rawData.attendance.length / empCount) * 20 : 65),
        Math.min(100, rawData.invoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0) / Math.max(empCount * 100, 1)),
        Math.min(100, empCount * 15),
        Math.min(100, 70 + Math.random() * 20),
      ],
      labels: isAr ? ['الإنتاجية', 'الحضور', 'المبيعات', 'المهام', 'الجودة'] : ['Productivity', 'Attendance', 'Sales', 'Tasks', 'Quality'],
    };
  };

  const getEmployeeHeatmapData = () => {
    const days = isAr ? ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'] : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const hours = ['9AM', '10', '11', '12PM', '1', '2', '3', '4', '5'];
    const data = days.map(() => hours.map(() => Math.floor(Math.random() * 10)));
    // Enhance with real invoice data if available
    if (rawData?.invoices?.length) {
      rawData.invoices.forEach((inv: any) => {
        const d = new Date(inv.created_at);
        const dayIdx = d.getDay();
        const hourIdx = Math.max(0, Math.min(8, d.getHours() - 9));
        if (dayIdx < 7 && hourIdx >= 0 && hourIdx < 9) data[dayIdx][hourIdx] += 1;
      });
    }
    return { data, xLabels: hours, yLabels: days };
  };

  const getInventoryNetworkData = () => {
    if (!rawData?.inventory?.length) return { nodes: [], links: [] };
    const items = rawData.inventory.slice(0, 10);
    const nodes = items.map((item: any, i: number) => ({
      id: `item-${i}`, label: item.name || `#${item.id}`,
      size: Math.max(2, Math.min(6, Number(item.quantity || 1) / 10)),
      color: Number(item.quantity || 0) < 5 ? '#ef4444' : Number(item.quantity || 0) < 20 ? '#f59e0b' : '#10b981',
    }));
    const links: { source: string; target: string }[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      links.push({ source: nodes[i].id, target: nodes[i + 1].id });
      if (i + 2 < nodes.length && Math.random() > 0.5) links.push({ source: nodes[i].id, target: nodes[i + 2].id });
    }
    return { nodes, links };
  };

  const tabs = [
    { key: 'analytics', label: isAr ? 'التحليلات' : 'Analytics', icon: Brain, color: 'from-purple-500 to-indigo-600' },
    { key: 'decisions', label: isAr ? 'القرارات' : 'Decisions', icon: Target, color: 'from-emerald-500 to-teal-600' },
    { key: 'monitoring', label: isAr ? 'المراقبة' : 'Monitoring', icon: Eye, color: 'from-red-500 to-pink-600' },
    { key: 'financial', label: isAr ? 'المالية' : 'Financial', icon: DollarSign, color: 'from-green-500 to-emerald-600' },
    { key: 'customers', label: isAr ? 'العملاء' : 'Customers', icon: Users, color: 'from-blue-500 to-indigo-600' },
    { key: 'employees', label: isAr ? 'الموظفين' : 'Employees', icon: UserCheck, color: 'from-violet-500 to-purple-600' },
    { key: 'inventory', label: isAr ? 'المخزون' : 'Inventory', icon: Package, color: 'from-amber-500 to-yellow-600' },
    { key: 'forecasting', label: isAr ? 'التنبؤات' : 'Forecast', icon: Lightbulb, color: 'from-cyan-500 to-blue-600' },
    { key: 'kpis', label: isAr ? 'المؤشرات' : 'KPIs', icon: Gauge, color: 'from-teal-500 to-cyan-600' },
    { key: 'permissions', label: isAr ? 'الصلاحيات' : 'Permissions', icon: Shield, color: 'from-amber-500 to-orange-600' },
    { key: 'decision-log', label: isAr ? 'السجل' : 'Log', icon: FileText, color: 'from-slate-500 to-gray-600' },
    { key: 'trash', label: isAr ? 'المهملات' : 'Trash', icon: Trash2, color: 'from-rose-500 to-red-600' },
    { key: 'strategic', label: isAr ? 'استراتيجي' : 'Strategic', icon: Zap, color: 'from-orange-500 to-red-600' },
  ];

  const cardClass = "bg-card border border-border rounded-2xl p-5 transition-all hover:shadow-lg hover:shadow-primary/5";

  return (
    <div className="space-y-5 animate-fade-in text-start">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-xl shadow-xl text-sm font-bold text-white ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 flex items-center justify-center shadow-xl shadow-purple-500/30">
            <Brain size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">{isAr ? 'مركز الذكاء الاصطناعي' : 'AI Command Center'}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isAr ? `آخر تحديث: ${lastUpdate || 'لم يبدأ'} • تحديث تلقائي كل 5 دقائق` : `Last: ${lastUpdate || 'Not started'} • Auto-refresh 5m`}
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center relative">
          {/* Notification Bell */}
          <button onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-muted border border-border hover:bg-secondary transition-all">
            <Bell size={16} className={unreadCount > 0 ? 'text-primary' : 'text-muted-foreground'} />
            {unreadCount > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-1 -end-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{unreadCount}</motion.span>
            )}
          </button>
          <AnimatePresence>
            {showNotifications && (
              <AINotificationPanel notifications={aiNotifications} isAr={isAr}
                onClose={() => setShowNotifications(false)}
                onClear={() => setAiNotifications([])}
                onMarkRead={(id) => setAiNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))} />
            )}
          </AnimatePresence>

          <button onClick={fetchBusinessData} disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-xs font-bold hover:bg-secondary transition-all flex items-center gap-2 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
          <button onClick={() => { runAI('full-analysis'); runAI('decisions'); runAI('monitoring'); }}
            disabled={aiLoading || !rawData}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-500/25">
            {aiLoading ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {aiLoading ? (isAr ? 'جاري التحليل...' : 'Analyzing...') : (isAr ? 'تحليل AI' : 'Run AI')}
          </button>
        </div>
      </header>

      {/* Tabs - scrollable */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-2xl overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-card shadow-md text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${tab.color} flex items-center justify-center`}>
              <tab.icon size={10} className="text-white" />
            </div>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ ANALYTICS TAB ═══════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          {rawData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: isAr ? 'الفواتير' : 'Invoices', value: rawData.invoices.length, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { label: isAr ? 'العملاء' : 'Customers', value: rawData.customers.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: isAr ? 'الموظفين' : 'Employees', value: rawData.employees.length, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: isAr ? 'المنتجات' : 'Products', value: rawData.inventory.length, icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={cardClass}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}><s.icon size={16} className={s.color} /></div>
                    <span className="text-xl font-black text-foreground">{s.value}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-muted-foreground">{s.label}</p>
                </motion.div>
              ))}
            </div>
          )}
          {aiLoading && !analyticsResult && (
            <div className="text-center py-20"><Loader size={48} className="mx-auto text-primary animate-spin mb-4" /><p className="text-muted-foreground text-sm font-semibold">{isAr ? 'جاري التحليل...' : 'Running AI...'}</p></div>
          )}
           {analyticsResult ? (
            <div className="space-y-5">
              {/* Overall Score + Summary */}
              <div className={`${cardClass} bg-gradient-to-br from-card to-primary/5`}>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <GaugeChart value={analyticsResult.overallScore || 75} label={isAr ? 'الأداء العام' : 'Overall'} />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><Sparkles size={16} className="text-primary" />{isAr ? 'ملخص التحليل الذكي' : 'AI Summary'}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{analyticsResult.overallSummary}</p>
                  </div>
                </div>
              </div>

              {/* Charts Row 1: Sales Trend + Revenue Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {analyticsResult.salesAnalysis && (
                  <div className={cardClass}>
                    <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                      <TrendingUp size={16} className="text-emerald-500" />{isAr ? 'اتجاه المبيعات' : 'Sales Trend'}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${analyticsResult.salesAnalysis.trend === 'up' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                        {analyticsResult.salesAnalysis.trend === 'up' ? '↑' : '↓'} {analyticsResult.salesAnalysis.growthRate}%
                      </span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground mb-3">{analyticsResult.salesAnalysis.summary}</p>
                    {rawData && <AreaChart data={rawData.invoices.slice(0, 15).map((i: any) => Number(i.total_amount || 0))} color="#10b981" />}
                  </div>
                )}
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <BarChart3 size={16} className="text-purple-500" />{isAr ? 'توزيع الإيرادات' : 'Revenue Distribution'}
                  </h3>
                  {rawData && (
                    <DonutChart segments={[
                      { value: rawData.invoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0), color: '#10b981', label: isAr ? 'إيرادات' : 'Revenue' },
                      { value: rawData.expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0), color: '#ef4444', label: isAr ? 'مصروفات' : 'Expenses' },
                      { value: rawData.purchases.reduce((s: number, p: any) => s + Number(p.total_cost || 0), 0), color: '#f59e0b', label: isAr ? 'مشتريات' : 'Purchases' },
                    ]} label={rawData.invoices.length.toString()} />
                  )}
                </div>
              </div>

              {/* Charts Row 2: Performance Radar + Recent Invoices List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Target size={16} className="text-indigo-500" />{isAr ? 'مؤشرات الأداء' : 'Performance Radar'}
                  </h3>
                  <RadarChart
                    data={[
                      analyticsResult.overallScore || 70,
                      analyticsResult.customerAnalysis?.retentionRate || 60,
                      Math.min(100, (rawData?.invoices?.length || 0) * 3),
                      analyticsResult.forecasting?.confidence || 50,
                      Math.min(100, 100 - (analyticsResult.customerAnalysis?.atRisk || 0) * 10),
                    ]}
                    labels={isAr ? ['الأداء', 'الاحتفاظ', 'المبيعات', 'التنبؤ', 'الاستقرار'] : ['Performance', 'Retention', 'Sales', 'Forecast', 'Stability']}
                  />
                </div>
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-blue-500" />{isAr ? 'أحدث الفواتير' : 'Recent Invoices'}
                    {rawData?.invoices?.length > 0 && (
                      <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold ms-auto">{rawData.invoices.length}</span>
                    )}
                  </h3>
                  <div className="space-y-1.5">
                    {rawData?.invoices?.slice(0, 6).map((inv: any, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 p-2 rounded-xl bg-muted/30 hover:bg-muted/60 transition-all">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${Number(inv.paid_amount || 0) >= Number(inv.total_amount || 0) ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                          <FileText size={14} className={Number(inv.paid_amount || 0) >= Number(inv.total_amount || 0) ? 'text-emerald-500' : 'text-amber-500'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-foreground truncate">{inv.customer_name || `${isAr ? 'فاتورة' : 'Invoice'} #${inv.id}`}</p>
                          <p className="text-[9px] text-muted-foreground">{inv.created_at ? new Date(inv.created_at).toLocaleDateString('ar-EG') : ''}</p>
                        </div>
                        <div className="text-end">
                          <p className="text-[11px] font-black text-foreground">{Number(inv.total_amount || 0).toLocaleString()}</p>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${Number(inv.paid_amount || 0) >= Number(inv.total_amount || 0) ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                            {Number(inv.paid_amount || 0) >= Number(inv.total_amount || 0) ? (isAr ? 'مدفوع' : 'Paid') : (isAr ? 'معلق' : 'Pending')}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    {(!rawData?.invoices || rawData.invoices.length === 0) && (
                      <p className="text-center text-muted-foreground text-xs py-6">{isAr ? 'لا توجد فواتير' : 'No invoices'}</p>
                    )}
                  </div>
                  {rawData?.invoices?.length > 0 && (
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                      <span className="text-[10px] text-muted-foreground font-semibold">{isAr ? `${rawData.invoices.length} فاتورة` : `${rawData.invoices.length} invoices`}</span>
                      <span className="text-[10px] font-bold text-primary">{isAr ? 'الإجمالي:' : 'Total:'} {rawData.invoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Recommendations */}
              {analyticsResult.recommendations?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Zap size={16} className="text-primary" />{isAr ? 'توصيات AI' : 'AI Recommendations'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {analyticsResult.recommendations.slice(0, 4).map((r: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-muted/50 rounded-xl border border-border/50">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 mt-0.5 ${r.impact === 'high' ? 'bg-red-500/10 text-red-600' : r.impact === 'medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {r.impact === 'high' ? '🔴' : r.impact === 'medium' ? '🟡' : '🔵'}
                        </span>
                        <div><p className="text-xs font-bold text-foreground">{r.title}</p><p className="text-[10px] text-muted-foreground">{r.description}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fraud Alerts */}
              {analyticsResult.fraudAlerts?.length > 0 && (
                <div className={`${cardClass} border-red-500/20`}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500" />{isAr ? 'تنبيهات مشبوهة' : 'Fraud Alerts'}</h3>
                  <div className="space-y-2">
                    {analyticsResult.fraudAlerts.map((a: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                        <RiskBadge level={a.severity} />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-foreground">{a.type}</p>
                          <p className="text-[11px] text-muted-foreground">{a.description}</p>
                          <p className="text-[10px] text-emerald-600 mt-1 font-semibold">💡 {a.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
           ) : !aiLoading && (
            <div className="text-center py-20"><Brain size={48} className="mx-auto text-muted-foreground/20 mb-4" /><p className="text-muted-foreground text-sm">{isAr ? 'جاري تحميل التحليلات...' : 'Loading...'}</p></div>
          )}
        </div>
      )}

      {/* ═══════════════ DECISIONS TAB (cleaned - no duplicates) ═══════════════ */}
      {activeTab === 'decisions' && (
        <div className="space-y-5">
          {aiLoading && !decisionsResult && (
            <div className="text-center py-20"><Loader size={48} className="mx-auto text-primary animate-spin mb-4" /><p className="text-muted-foreground text-sm">{isAr ? 'جاري التحليل...' : 'Analyzing...'}</p></div>
          )}
          {decisionsResult ? (
            <div className={cardClass}>
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Target size={16} className="text-emerald-500" />{isAr ? 'القرارات التلقائية' : 'Auto Decisions'}</h3>
              {decisionsResult.decisions?.length > 0 ? (
                <div className="space-y-3">
                  {decisionsResult.decisions.map((d: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className={`flex items-start gap-3 p-4 rounded-xl border ${d.severity === 'critical' ? 'border-red-500/20 bg-red-500/5' : d.severity === 'warning' ? 'border-amber-500/20 bg-amber-500/5' : 'border-border bg-muted/30'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${d.severity === 'critical' ? 'bg-red-500/10 text-red-600' : d.severity === 'warning' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                        {d.severity === 'critical' ? <AlertTriangle size={16} /> : d.severity === 'warning' ? <Bell size={16} /> : <Info size={16} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1"><p className="text-xs font-bold text-foreground">{d.title}</p><RiskBadge level={d.severity} /></div>
                        <p className="text-[11px] text-muted-foreground mb-1">{d.description}</p>
                        <p className="text-[10px] text-primary font-semibold">🎯 {d.reasoning}</p>
                        {d.targetName && <p className="text-[10px] text-muted-foreground mt-1">{isAr ? 'الهدف:' : 'Target:'} <span className="font-bold">{d.targetName}</span></p>}
                      </div>
                      <span className={`text-[9px] px-2 py-1 rounded-lg font-bold ${d.action === 'suspend' ? 'bg-red-500/10 text-red-600' : d.action === 'reduce_permissions' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                        {d.action === 'alert' ? (isAr ? 'تنبيه' : 'Alert') : d.action === 'reduce_permissions' ? (isAr ? 'تقليل صلاحيات' : 'Reduce Perms') : d.action === 'suspend' ? (isAr ? 'إيقاف' : 'Suspend') : d.action}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-6">{isAr ? 'لا توجد قرارات حالياً' : 'No decisions'}</p>}
            </div>
          ) : !aiLoading && (
            <div className="text-center py-20"><Target size={48} className="mx-auto text-muted-foreground/20 mb-4" /><p className="text-muted-foreground text-sm">{isAr ? 'جاري التحميل...' : 'Loading...'}</p></div>
          )}
        </div>
      )}

      {/* ═══════════════ MONITORING TAB ═══════════════ */}
      {activeTab === 'monitoring' && (
        <div className="space-y-5">
          {aiLoading && !monitoringResult && (
            <div className="text-center py-20"><Loader size={48} className="mx-auto text-primary animate-spin mb-4" /><p className="text-muted-foreground text-sm">{isAr ? 'جاري المراقبة...' : 'Monitoring...'}</p></div>
          )}
          {monitoringResult ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`${cardClass} text-center`}><GaugeChart value={monitoringResult.systemHealth?.score || 0} label={isAr ? 'صحة النظام' : 'Health'} /></div>
                <div className={`${cardClass} flex flex-col items-center justify-center`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2 ${monitoringResult.riskLevel === 'low' ? 'bg-emerald-500/10' : monitoringResult.riskLevel === 'medium' ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                    <Shield size={28} className={monitoringResult.riskLevel === 'low' ? 'text-emerald-600' : monitoringResult.riskLevel === 'medium' ? 'text-amber-600' : 'text-red-600'} />
                  </div>
                  <p className="text-sm font-bold">{isAr ? 'مستوى الخطورة' : 'Risk Level'}</p>
                  <RiskBadge level={monitoringResult.riskLevel || 'low'} />
                </div>
                <div className={`${cardClass} text-center`}>
                  <p className="text-3xl font-black text-foreground mb-1">{monitoringResult.systemHealth?.activeUsers || 0}</p>
                  <p className="text-xs text-muted-foreground font-semibold">{isAr ? 'مستخدمين نشطين' : 'Active Users'}</p>
                </div>
              </div>
              {monitoringResult.anomalies?.length > 0 && (
                <div className={`${cardClass} border-amber-500/20`}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" />{isAr ? 'أنشطة غير طبيعية' : 'Anomalies'}</h3>
                  <div className="space-y-2">
                    {monitoringResult.anomalies.map((a: any, i: number) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${a.severity === 'high' ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
                        <RiskBadge level={a.severity} />
                        <div className="flex-1">
                          <p className="text-xs font-bold">{a.type}</p>
                          <p className="text-[11px] text-muted-foreground">{a.description}</p>
                          <p className="text-[10px] text-primary mt-1 font-semibold">💡 {a.suggestedAction}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {monitoringResult.activities?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Activity size={16} className="text-blue-500" />{isAr ? 'سجل الأنشطة' : 'Activity Feed'}</h3>
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                    {monitoringResult.activities.map((a: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-all">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${a.riskScore >= 70 ? 'bg-red-500' : a.riskScore >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate"><span className="font-bold text-primary">{a.user}</span> — {a.action}</p>
                          <p className="text-[10px] text-muted-foreground">{a.details}</p>
                        </div>
                        <p className={`text-xs font-bold ${a.riskScore >= 70 ? 'text-red-600' : a.riskScore >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>{a.riskScore}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : !aiLoading && (
            <div className="text-center py-20"><Eye size={48} className="mx-auto text-muted-foreground/20 mb-4" /><p className="text-muted-foreground text-sm">{isAr ? 'جاري التحميل...' : 'Loading...'}</p></div>
          )}
        </div>
      )}

      {/* ═══════════════ FINANCIAL TAB ═══════════════ */}
      {activeTab === 'financial' && (
        <div className="space-y-5">
          {analyticsResult?.salesAnalysis ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: isAr ? 'الإيرادات' : 'Revenue', value: rawData?.invoices?.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)?.toLocaleString() || '0', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { label: isAr ? 'المصروفات' : 'Expenses', value: rawData?.expenses?.reduce((s: number, e: any) => s + Number(e.amount || 0), 0)?.toLocaleString() || '0', icon: Wallet, color: 'text-red-500', bg: 'bg-red-500/10' },
                  { label: isAr ? 'صافي الربح' : 'Net Profit', value: ((rawData?.invoices?.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0) || 0) - (rawData?.expenses?.reduce((s: number, e: any) => s + Number(e.amount || 0), 0) || 0)).toLocaleString(), icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: isAr ? 'المعاملات' : 'Transactions', value: (rawData?.invoices?.length || 0) + (rawData?.expenses?.length || 0), icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={cardClass}>
                    <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}><s.icon size={16} className={s.color} /></div>
                    <p className="text-lg font-black text-foreground">{s.value}</p>
                    <p className="text-[10px] font-semibold text-muted-foreground">{s.label}</p>
                  </motion.div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><LineChart size={16} className="text-emerald-500" />{isAr ? 'تحليل المبيعات' : 'Sales'}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{analyticsResult.salesAnalysis.summary}</p>
                  {rawData && <AreaChart data={rawData.invoices.slice(0, 15).map((i: any) => Number(i.total_amount || 0))} color="#10b981" />}
                </div>
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><BarChart3 size={16} className="text-purple-500" />{isAr ? 'توزيع الإيرادات والمصروفات' : 'Revenue vs Expenses'}</h3>
                  <DonutChart segments={[
                    { value: rawData?.invoices?.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0) || 0, color: '#10b981', label: isAr ? 'إيرادات' : 'Revenue' },
                    { value: rawData?.expenses?.reduce((s: number, e: any) => s + Number(e.amount || 0), 0) || 0, color: '#ef4444', label: isAr ? 'مصروفات' : 'Expenses' },
                    { value: rawData?.purchases?.reduce((s: number, p: any) => s + Number(p.total_cost || 0), 0) || 0, color: '#f59e0b', label: isAr ? 'مشتريات' : 'Purchases' },
                  ]} label={isAr ? 'التوزيع' : 'Split'} />
                </div>
              </div>
              {analyticsResult.financialInsights && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3">{isAr ? 'رؤى مالية' : 'Financial Insights'}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{analyticsResult.financialInsights.summary || analyticsResult.financialInsights}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20"><DollarSign size={48} className="mx-auto text-muted-foreground/20 mb-4" /><p className="text-muted-foreground text-sm">{isAr ? 'شغّل التحليل أولاً' : 'Run analysis first'}</p></div>
          )}
        </div>
      )}

      {/* ═══════════════ CUSTOMER INSIGHTS TAB + Radar Chart ═══════════════ */}
      {activeTab === 'customers' && (
        <div className="space-y-5">
          {analyticsResult?.customerAnalysis ? (
            <>
              <div className={`${cardClass} bg-gradient-to-br from-card to-blue-500/5`}>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Users size={16} className="text-blue-500" />{isAr ? 'تحليل العملاء' : 'Customer Insights'}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{analyticsResult.customerAnalysis.summary}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { v: analyticsResult.customerAnalysis.totalActive, l: isAr ? 'نشطين' : 'Active' },
                    { v: `${analyticsResult.customerAnalysis.retentionRate}%`, l: isAr ? 'الاحتفاظ' : 'Retention' },
                    { v: analyticsResult.customerAnalysis.atRisk || 0, l: isAr ? 'معرضين للفقد' : 'At Risk' },
                    { v: rawData?.customers?.length || 0, l: isAr ? 'الإجمالي' : 'Total' },
                  ].map((s, i) => (
                    <div key={i} className="bg-muted rounded-xl p-3 text-center">
                      <p className="text-lg font-black text-foreground">{s.v}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Radar Chart for customer segments */}
              <div className={cardClass}>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <BarChart3 size={16} className="text-blue-500" />{isAr ? 'تحليل شرائح العملاء' : 'Customer Segments Radar'}
                </h3>
                <RadarChart
                  data={[
                    analyticsResult.customerAnalysis.retentionRate || 60,
                    Math.min(100, (analyticsResult.customerAnalysis.totalActive || 0) * 5),
                    Math.min(100, 100 - (analyticsResult.customerAnalysis.atRisk || 0) * 10),
                    Math.min(100, (rawData?.invoices?.length || 0) / Math.max(rawData?.customers?.length || 1, 1) * 20),
                    Math.min(100, analyticsResult.overallScore || 70),
                  ]}
                  labels={isAr ? ['الاحتفاظ', 'النشاط', 'الولاء', 'الإنفاق', 'الرضا'] : ['Retention', 'Activity', 'Loyalty', 'Spending', 'Satisfaction']}
                />
              </div>
              {analyticsResult.customerAnalysis.topCustomers?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3">{isAr ? 'أفضل العملاء' : 'Top Customers'}</h3>
                  <div className="space-y-2">
                    {analyticsResult.customerAnalysis.topCustomers.map((c: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">{(c.name || '?')[0]}</div>
                        <div className="flex-1"><p className="text-xs font-bold">{c.name}</p><p className="text-[10px] text-muted-foreground">{c.details || c.totalSpent}</p></div>
                        <Star size={14} className="text-amber-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {analyticsResult.customerAnalysis.riskCustomers?.length > 0 && (
                <div className={`${cardClass} border-amber-500/20`}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" />{isAr ? 'عملاء معرضين للخطر' : 'At-Risk'}</h3>
                  <div className="space-y-2">
                    {analyticsResult.customerAnalysis.riskCustomers.map((c: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                        <RiskBadge level={c.riskLevel || 'medium'} />
                        <div className="flex-1"><p className="text-xs font-bold">{c.name}</p><p className="text-[10px] text-muted-foreground">{c.reason}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20"><Users size={48} className="mx-auto text-muted-foreground/20 mb-4" /><p className="text-muted-foreground text-sm">{isAr ? 'شغّل التحليل أولاً' : 'Run analysis first'}</p></div>
          )}
        </div>
      )}

      {/* ═══════════════ EMPLOYEE ANALYTICS TAB + Heatmap + Radar ═══════════════ */}
      {activeTab === 'employees' && (
        <div className="space-y-5">
          {analyticsResult?.employeeAnalysis?.length > 0 || decisionsResult?.employeeScores?.length > 0 ? (
            <>
              {/* Employee Performance Scores */}
              {decisionsResult?.employeeScores?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Award size={16} className="text-purple-500" />{isAr ? 'تقييم الأداء' : 'Performance Scores'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {decisionsResult.employeeScores.map((e: any, i: number) => (
                      <div key={i} className="bg-muted/50 rounded-xl p-4 text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center text-white font-bold text-sm">{(e.name || '?')[0]}</div>
                        <p className="text-xs font-bold truncate">{e.name}</p>
                        <GaugeChart value={e.overallScore || 0} size={80} label={isAr ? 'الكلي' : 'Overall'} />
                        <div className="flex gap-2 text-[10px]">
                          <span className="flex-1 bg-card rounded-lg py-1.5 font-bold">📊 {e.performanceScore}</span>
                          <span className="flex-1 bg-card rounded-lg py-1.5 font-bold">⏰ {e.attendanceScore}</span>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold inline-block ${e.recommendation === 'promote' ? 'bg-emerald-500/10 text-emerald-600' : e.recommendation === 'warn' ? 'bg-amber-500/10 text-amber-600' : e.recommendation === 'review' ? 'bg-red-500/10 text-red-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {e.recommendation === 'promote' ? (isAr ? '⬆️ ترقية' : '⬆️ Promote') : e.recommendation === 'warn' ? (isAr ? '⚠️ تحذير' : '⚠️ Warn') : e.recommendation === 'review' ? (isAr ? '🔍 مراجعة' : '🔍 Review') : (isAr ? '✅ استمرار' : '✅ Maintain')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Radar Chart - Employee Skills */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <BarChart3 size={16} className="text-violet-500" />{isAr ? 'تقييم متعدد الأبعاد' : 'Multi-Dimension Assessment'}
                  </h3>
                  {(() => { const rd = getEmployeeRadarData(); return <RadarChart data={rd.data} labels={rd.labels} />; })()}
                </div>

                {/* Heatmap - Activity */}
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Activity size={16} className="text-orange-500" />{isAr ? 'خريطة حرارية للنشاط' : 'Activity Heatmap'}
                  </h3>
                  {(() => { const hm = getEmployeeHeatmapData(); return <HeatmapChart data={hm.data} xLabels={hm.xLabels} yLabels={hm.yLabels} />; })()}
                </div>
              </div>

              {/* Employee list from analytics */}
              {analyticsResult?.employeeAnalysis?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><UserCheck size={16} className="text-violet-500" />{isAr ? 'تقييم الموظفين' : 'Ratings'}</h3>
                  <div className="space-y-2">
                    {analyticsResult.employeeAnalysis.map((e: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[10px] font-bold shrink-0">{(e.name || '?')[0]}</div>
                        <div className="flex-1 min-w-0"><p className="text-xs font-bold truncate">{e.name}</p><p className="text-[10px] text-muted-foreground">{e.notes}</p></div>
                        <p className={`text-sm font-black ${e.score >= 80 ? 'text-emerald-600' : e.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{e.score}/100</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20"><UserCheck size={48} className="mx-auto text-muted-foreground/20 mb-4" /><p className="text-muted-foreground text-sm">{isAr ? 'شغّل التحليل أولاً' : 'Run analysis first'}</p></div>
          )}
        </div>
      )}

      {/* ═══════════════ INVENTORY TAB + Network Graph ═══════════════ */}
      {activeTab === 'inventory' && (
        <div className="space-y-5">
          {analyticsResult?.inventoryAnalysis ? (
            <>
              <div className={`${cardClass} bg-gradient-to-br from-card to-amber-500/5`}>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Package size={16} className="text-amber-500" />{isAr ? 'تحليل المخزون' : 'Inventory'}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{analyticsResult.inventoryAnalysis.summary}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-muted rounded-xl p-3 text-center"><p className="text-lg font-black text-foreground">{rawData?.inventory?.length || 0}</p><p className="text-[10px] text-muted-foreground font-semibold">{isAr ? 'المنتجات' : 'Products'}</p></div>
                  <div className="bg-muted rounded-xl p-3 text-center"><p className="text-lg font-black text-foreground">{analyticsResult.inventoryAnalysis.lowStock || 0}</p><p className="text-[10px] text-muted-foreground font-semibold">{isAr ? 'منخفض' : 'Low'}</p></div>
                  <div className="bg-muted rounded-xl p-3 text-center"><p className="text-lg font-black text-foreground">{analyticsResult.inventoryAnalysis.outOfStock || 0}</p><p className="text-[10px] text-muted-foreground font-semibold">{isAr ? 'نفد' : 'Out'}</p></div>
                </div>
              </div>

              {/* Network Graph */}
              {rawData?.inventory?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Activity size={16} className="text-amber-500" />{isAr ? 'شبكة علاقات المنتجات' : 'Product Network Graph'}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mb-2">{isAr ? '🟢 مخزون كافي • 🟡 منخفض • 🔴 نفد' : '🟢 In stock • 🟡 Low • 🔴 Out'}</p>
                  {(() => { const ng = getInventoryNetworkData(); return <NetworkGraph nodes={ng.nodes} links={ng.links} />; })()}
                </div>
              )}

              {analyticsResult.inventoryAnalysis.alerts?.length > 0 && (
                <div className={`${cardClass} border-amber-500/20`}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" />{isAr ? 'تنبيهات' : 'Alerts'}</h3>
                  <div className="space-y-2">
                    {analyticsResult.inventoryAnalysis.alerts.map((a: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-amber-600 bg-amber-500/5 rounded-lg px-3 py-2"><AlertTriangle size={12} className="shrink-0 mt-0.5" />{a}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {analyticsResult.inventoryAnalysis.fastMoving?.length > 0 && (
                  <div className={cardClass}>
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><ArrowUpRight size={14} className="text-emerald-500" />{isAr ? 'سريعة الحركة' : 'Fast Moving'}</h3>
                    <div className="space-y-1.5">
                      {analyticsResult.inventoryAnalysis.fastMoving.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-emerald-500/5 rounded-lg"><ArrowUpRight size={14} className="text-emerald-500" /><span className="text-xs font-bold flex-1">{p.name || p}</span></div>
                      ))}
                    </div>
                  </div>
                )}
                {analyticsResult.inventoryAnalysis.slowMoving?.length > 0 && (
                  <div className={cardClass}>
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><ArrowDownRight size={14} className="text-red-500" />{isAr ? 'راكدة' : 'Slow Moving'}</h3>
                    <div className="space-y-1.5">
                      {analyticsResult.inventoryAnalysis.slowMoving.map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-red-500/5 rounded-lg"><ArrowDownRight size={14} className="text-red-500" /><span className="text-xs font-bold flex-1">{p.name || p}</span></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20"><Package size={48} className="mx-auto text-muted-foreground/20 mb-4" /><p className="text-muted-foreground text-sm">{isAr ? 'شغّل التحليل أولاً' : 'Run analysis first'}</p></div>
          )}
        </div>
      )}

      {/* ═══════════════ FORECASTING TAB ═══════════════ */}
      {activeTab === 'forecasting' && (
        <div className="space-y-5">
          {analyticsResult?.forecasting ? (
            <>
              <div className={`${cardClass} bg-gradient-to-br from-card to-cyan-500/5`}>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Lightbulb size={16} className="text-cyan-500" />{isAr ? 'التنبؤات' : 'Forecasting'}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{analyticsResult.forecasting.summary}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { v: analyticsResult.forecasting.nextMonthRevenue?.toLocaleString(), l: isAr ? 'إيرادات متوقعة' : 'Expected Revenue' },
                    { v: `${analyticsResult.forecasting.confidence}%`, l: isAr ? 'الثقة' : 'Confidence' },
                    { v: `${analyticsResult.forecasting.expectedGrowth || '—'}%`, l: isAr ? 'النمو' : 'Growth' },
                    { v: analyticsResult.forecasting.seasonalTrend || '—', l: isAr ? 'الموسمية' : 'Seasonal' },
                  ].map((s, i) => (
                    <div key={i} className="bg-muted rounded-xl p-4 text-center"><p className="text-lg font-black text-foreground">{s.v}</p><p className="text-[10px] text-muted-foreground font-semibold">{s.l}</p></div>
                  ))}
                </div>
              </div>
              {analyticsResult.forecasting.predictions?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3">{isAr ? 'تنبؤات تفصيلية' : 'Predictions'}</h3>
                  <div className="space-y-2">
                    {analyticsResult.forecasting.predictions.map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                        <span className="text-[10px] px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 font-bold">{p.type || p.category}</span>
                        <div className="flex-1"><p className="text-xs font-bold">{p.title || p.description}</p><p className="text-[10px] text-muted-foreground">{p.details || p.impact}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20"><Lightbulb size={48} className="mx-auto text-muted-foreground/20 mb-4" /><p className="text-muted-foreground text-sm">{isAr ? 'شغّل التحليل أولاً' : 'Run analysis first'}</p></div>
          )}
        </div>
      )}

      {/* ═══════════════ KPIs TAB ═══════════════ */}
      {activeTab === 'kpis' && (
        <div className="space-y-5">
          {rawData ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(() => {
                  const totalRevenue = rawData.invoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
                  const totalExpenses = rawData.expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
                  const todayInvoices = rawData.invoices.filter((i: any) => new Date(i.created_at).toDateString() === new Date().toDateString());
                  const todayRevenue = todayInvoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
                  return [
                    { label: isAr ? 'مبيعات اليوم' : 'Today', value: todayRevenue.toLocaleString(), sub: `${todayInvoices.length} ${isAr ? 'فاتورة' : 'inv'}`, color: 'text-emerald-500' },
                    { label: isAr ? 'الإيرادات' : 'Revenue', value: totalRevenue.toLocaleString(), sub: settings.currency, color: 'text-blue-500' },
                    { label: isAr ? 'صافي الربح' : 'Profit', value: (totalRevenue - totalExpenses).toLocaleString(), sub: `${((totalRevenue - totalExpenses) / (totalRevenue || 1) * 100).toFixed(1)}%`, color: 'text-purple-500' },
                    { label: isAr ? 'العملاء' : 'Clients', value: rawData.customers.length, sub: isAr ? 'عميل' : 'clients', color: 'text-amber-500' },
                  ].map((kpi, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className={cardClass}>
                      <p className={`text-xl font-black ${kpi.color}`}>{kpi.value}</p>
                      <p className="text-[11px] font-bold text-foreground mt-1">{kpi.label}</p>
                      <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
                    </motion.div>
                  ));
                })()}
              </div>
              {analyticsResult && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`${cardClass} text-center`}><GaugeChart value={analyticsResult.overallScore || 0} label={isAr ? 'الأداء' : 'Overall'} /></div>
                  <div className={`${cardClass} text-center`}><GaugeChart value={analyticsResult.customerAnalysis?.retentionRate || 0} label={isAr ? 'الاحتفاظ' : 'Retention'} /></div>
                  <div className={`${cardClass} text-center`}><GaugeChart value={analyticsResult.forecasting?.confidence || 0} label={isAr ? 'التنبؤ' : 'Forecast'} /></div>
                </div>
              )}
              <div className={cardClass}>
                <h3 className="text-sm font-bold text-foreground mb-3">{isAr ? 'مخطط الإيرادات' : 'Revenue Trend'}</h3>
                <AreaChart data={rawData.invoices.slice(0, 15).map((i: any) => Number(i.total_amount || 0))} color="#6366f1" />
              </div>
            </>
          ) : (
            <div className="text-center py-20"><Gauge size={48} className="mx-auto text-muted-foreground/20 mb-4" /><p className="text-muted-foreground text-sm">{isAr ? 'جاري التحميل...' : 'Loading...'}</p></div>
          )}
        </div>
      )}

      {/* ═══════════════ PERMISSIONS TAB (cleaned - no trash here) ═══════════════ */}
      {activeTab === 'permissions' && (
        <div className="space-y-5">
          <div className={cardClass}>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Shield size={16} className="text-amber-500" />{isAr ? 'صلاحيات الموظفين' : 'Permissions'}</h3>
            {employees.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{isAr ? 'لا يوجد موظفين' : 'No employees'}</p>
            ) : (
              <div className="space-y-4">
                {employees.map((emp: any) => {
                  const p = permissions[emp.id] || { view: true, edit: false, delete: false, add: false, pages: [] };
                  return (
                    <div key={emp.id} className="bg-muted/30 rounded-xl p-4 border border-border/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">{(emp.name || '?')[0]}</div>
                        <div className="flex-1"><p className="text-sm font-bold">{emp.name}</p><p className="text-[10px] text-muted-foreground">{emp.email} • {emp.role}</p></div>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${emp.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                          {emp.status === 'active' ? (isAr ? 'نشط' : 'Active') : (isAr ? 'موقوف' : 'Inactive')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {([
                          { key: 'view' as const, label: isAr ? 'عرض' : 'View', icon: Eye },
                          { key: 'edit' as const, label: isAr ? 'تعديل' : 'Edit', icon: FileText },
                          { key: 'delete' as const, label: isAr ? 'حذف' : 'Delete', icon: Trash2 },
                          { key: 'add' as const, label: isAr ? 'إضافة' : 'Add', icon: Zap },
                        ]).map(perm => (
                          <button key={perm.key} onClick={() => {
                            setPermissions(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], [perm.key]: !prev[emp.id]?.[perm.key] } }));
                            showToast(isAr ? 'تم التحديث' : 'Updated', 'info');
                          }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${p[perm.key] ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-transparent'}`}>
                            {p[perm.key] ? <Unlock size={11} /> : <Lock size={11} />}{perm.label}
                          </button>
                        ))}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground mb-1.5">{isAr ? 'الصفحات:' : 'Pages:'}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {allPages.map(page => {
                            const isAllowed = p.pages?.includes(page.key);
                            return (
                              <button key={page.key} onClick={() => {
                                setPermissions(prev => {
                                  const current = prev[emp.id]?.pages || [];
                                  const next = isAllowed ? current.filter(k => k !== page.key) : [...current, page.key];
                                  return { ...prev, [emp.id]: { ...prev[emp.id], pages: next } };
                                });
                              }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${isAllowed ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground/50'}`}>{page.label}</button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ DECISION LOG TAB ═══════════════ */}
      {activeTab === 'decision-log' && (
        <div className="space-y-5">
          <div className={cardClass}>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText size={16} className="text-slate-500" />{isAr ? 'سجل القرارات' : 'Decision Log'}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">{decisionLog.length} {isAr ? 'قرار' : 'decisions'}</span>
            </h3>
            {decisionLog.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{isAr ? 'لا يوجد قرارات مسجلة' : 'No decisions yet'}</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {decisionLog.map((d: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                    className={`p-4 rounded-xl border ${d.severity === 'critical' ? 'border-red-500/20 bg-red-500/5' : d.severity === 'warning' ? 'border-amber-500/20 bg-amber-500/5' : 'border-border bg-muted/30'}`}>
                    <div className="flex items-start gap-3">
                      <Clock size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1"><p className="text-xs font-bold text-foreground">{d.title}</p><RiskBadge level={d.severity || 'info'} /></div>
                        {d.description && <p className="text-[11px] text-muted-foreground mb-1">{d.description}</p>}
                        {d.reasoning && <p className="text-[10px] text-primary font-semibold">🎯 {d.reasoning}</p>}
                        <p className="text-[9px] text-muted-foreground mt-1">
                          {new Date(d.timestamp || d.created_at).toLocaleString('ar-EG')}
                          {d.targetName && ` • ${d.targetName}`}
                          {d.executedBy && ` • ${d.executedBy}`}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ TRASH TAB ═══════════════ */}
      {activeTab === 'trash' && (
        <div className="space-y-5">
          <div className={cardClass}>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Trash2 size={16} className="text-red-500" />{isAr ? 'سلة المهملات الذكية' : 'Smart Trash'}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">{trashItems.length}</span>
            </h3>
            {trashItems.length === 0 ? (
              <div className="text-center py-12"><Trash2 size={48} className="mx-auto text-muted-foreground/20 mb-4" /><p className="text-sm text-muted-foreground">{isAr ? 'سلة المهملات فارغة' : 'Trash is empty'}</p></div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {trashItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                    <Trash2 size={14} className="text-red-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{item.name || item.description || item.invoice_no || `#${item.id}`}</p>
                      <p className="text-[10px] text-muted-foreground">{item._trashType} • {isAr ? 'بواسطة' : 'By'} {item._deletedBy} • {new Date(item._deletedAt).toLocaleString('ar-EG')}</p>
                    </div>
                    <button onClick={() => restoreFromTrash(i)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-1">
                      <RotateCcw size={10} />{isAr ? 'استعادة' : 'Restore'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ STRATEGIC TAB ═══════════════ */}
      {activeTab === 'strategic' && (
        <div className="space-y-5">
          {decisionsResult?.strategicActions?.length > 0 || analyticsResult?.recommendations?.length > 0 ? (
            <>
              {decisionsResult?.strategicActions?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Zap size={16} className="text-orange-500" />{isAr ? 'إجراءات استراتيجية' : 'Strategic Actions'}</h3>
                  <div className="space-y-3">
                    {decisionsResult.strategicActions.map((a: any, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold ${a.priority === 'high' ? 'bg-red-500/10 text-red-600' : a.priority === 'medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {a.priority === 'high' ? (isAr ? '🔴 حرج' : '🔴 High') : a.priority === 'medium' ? (isAr ? '🟡 متوسط' : '🟡 Med') : (isAr ? '🔵 منخفض' : '🔵 Low')}
                        </span>
                        <div className="flex-1"><p className="text-xs font-bold">{a.title}</p><p className="text-[10px] text-muted-foreground">{a.expectedImpact}</p></div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-muted font-semibold text-muted-foreground">{a.category}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              {analyticsResult?.recommendations?.length > 0 && (
                <div className={cardClass}>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Sparkles size={16} className="text-primary" />{isAr ? 'توصيات لزيادة الأرباح' : 'Profit Recommendations'}</h3>
                  <div className="space-y-2">
                    {analyticsResult.recommendations.map((r: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-muted/50 rounded-xl">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${r.impact === 'high' ? 'bg-red-500/10 text-red-600' : r.impact === 'medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'}`}>
                          {r.impact === 'high' ? '🔴' : r.impact === 'medium' ? '🟡' : '🔵'}
                        </span>
                        <div><p className="text-xs font-bold text-foreground">{r.title}</p><p className="text-[10px] text-muted-foreground">{r.description}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20"><Zap size={48} className="mx-auto text-muted-foreground/20 mb-4" /><p className="text-muted-foreground text-sm">{isAr ? 'شغّل التحليل أولاً' : 'Run analysis first'}</p></div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAnalyticsPage;
