import React, { useRef, useState } from 'react';
import { MockDecor, MockFloor, MockTable } from '../mockData';

interface FloorPlanSVGProps {
  floor: MockFloor;
  selectedTableId?: string | null;
  mode: 'constructor' | 'booking' | 'manager';
  availabilityMap?: Record<string, 'available' | 'optimal' | 'occupied' | 'not_suitable'>;
  zoom?: number;
  pan?: { x: number; y: number };
  gridSnap?: number;
  tool?: string;
  onPlace?: (x: number, y: number) => void;
  onWallClick?: (index: number) => void;
  selectedWall?: number | null;
  onTableClick?: (table: MockTable) => void;
  onTableDragEnd?: (tableId: string, newX: number, newY: number) => void;
  onTableRotate?: (tableId: string, newRotation: number) => void;
  onDecorClick?: (decor: MockDecor) => void;
  onDecorDragEnd?: (decorId: string, newX: number, newY: number) => void;
}

type Status = 'available' | 'optimal' | 'occupied' | 'not_suitable';

const STATUS_TEXT: Record<string, string> = {
  available: 'свободен',
  optimal: 'свободен, подходит по размеру',
  occupied: 'занят',
  not_suitable: 'не подходит',
  neutral: 'свободен',
  blocked: 'не бронируется',
};

/** Цвета столешницы и обводки по состоянию */
function tableTone(status: Status, mode: string) {
  if (mode === 'booking') {
    if (status === 'occupied') return { stroke: '#8C3B35', width: 2.6, overlay: '#8C3B35', overlayOpacity: 0.28, dashed: false, dim: 1 };
    if (status === 'not_suitable') return { stroke: '#8C8069', width: 1.4, overlay: '#8C8069', overlayOpacity: 0, dashed: true, dim: 0.45 };
    if (status === 'optimal') return { stroke: '#2E5A45', width: 2.6, overlay: '', overlayOpacity: 0, dashed: false, dim: 1 };
    return { stroke: '#3A2E24', width: 2, overlay: '', overlayOpacity: 0, dashed: false, dim: 1 };
  }
  if (mode === 'manager') {
    return status === 'occupied'
      ? { stroke: '#8C3B35', width: 2.4, overlay: '#8C3B35', overlayOpacity: 0.2, dashed: false, dim: 1 }
      : { stroke: '#3A2E24', width: 2, overlay: '', overlayOpacity: 0, dashed: false, dim: 1 };
  }
  return { stroke: '#3A2E24', width: 2, overlay: '', overlayOpacity: 0, dashed: false, dim: 1 };
}

const CHAIR = { fill: '#DCD6C9', back: '#C3BBAB', line: '#3A2E24' };

export const FloorPlanSVG: React.FC<FloorPlanSVGProps> = ({
  floor,
  selectedTableId,
  mode,
  availabilityMap = {},
  zoom = 1,
  pan = { x: 0, y: 0 },
  gridSnap = 10,
  tool = 'select',
  onPlace,
  onWallClick,
  selectedWall = null,
  onTableClick,
  onTableDragEnd,
  onTableRotate,
  onDecorClick,
  onDecorDragEnd,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [draggingDecorId, setDraggingDecorId] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  const toLocal = (e: React.MouseEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left - pan.x) / zoom, y: (e.clientY - rect.top - pan.y) / zoom };
  };

  const beginTableDrag = (e: React.MouseEvent, table: MockTable) => {
    if (mode !== 'constructor') return;
    e.stopPropagation();
    const p = toLocal(e);
    setDraggingTableId(table.id);
    setDragOffset({ x: p.x - table.x, y: p.y - table.y });
    setDragPos({ x: table.x, y: table.y });
  };

  const beginRotate = (e: React.MouseEvent, table: MockTable) => {
    e.stopPropagation();
    setIsRotating(true);
    setDraggingTableId(table.id);
  };

  const beginDecorDrag = (e: React.MouseEvent, decor: MockDecor) => {
    if (mode !== 'constructor') return;
    e.stopPropagation();
    const p = toLocal(e);
    setDraggingDecorId(decor.id);
    setDragOffset({ x: p.x - decor.x, y: p.y - decor.y });
    setDragPos({ x: decor.x, y: decor.y });
  };

  const handleMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const p = toLocal(e);
    const snap = gridSnap > 0 ? gridSnap : 1;

    if (isRotating && draggingTableId && onTableRotate) {
      const table = floor.zones.flatMap((z) => z.tables).find((t) => t.id === draggingTableId);
      if (table) {
        const deg = (Math.atan2(p.y - (table.y + table.h / 2), p.x - (table.x + table.w / 2)) * 180) / Math.PI + 90;
        onTableRotate(draggingTableId, ((Math.round(deg / 15) * 15) % 360 + 360) % 360);
      }
      return;
    }
    if (draggingTableId) {
      setDragPos({
        x: Math.max(10, Math.min(940, Math.round((p.x - dragOffset.x) / snap) * snap)),
        y: Math.max(10, Math.min(540, Math.round((p.y - dragOffset.y) / snap) * snap)),
      });
      return;
    }
    if (draggingDecorId) {
      setDragPos({
        x: Math.max(10, Math.min(940, Math.round((p.x - dragOffset.x) / snap) * snap)),
        y: Math.max(10, Math.min(540, Math.round((p.y - dragOffset.y) / snap) * snap)),
      });
    }
  };

  const handleUp = () => {
    if (draggingTableId && dragPos && onTableDragEnd && !isRotating) onTableDragEnd(draggingTableId, dragPos.x, dragPos.y);
    if (draggingDecorId && dragPos && onDecorDragEnd) onDecorDragEnd(draggingDecorId, dragPos.x, dragPos.y);
    setDraggingTableId(null);
    setDraggingDecorId(null);
    setIsRotating(false);
    setDragPos(null);
  };

  const statusFor = (table: MockTable): Status => {
    if (mode === 'booking') return (availabilityMap[table.id] as Status) || 'available';
    if (mode === 'manager') return availabilityMap[table.id] === 'occupied' ? 'occupied' : 'available';
    return table.isReservable ? 'available' : 'not_suitable';
  };

  /* ------------------------------------------------------------- стулья */

  const chair = (x: number, y: number, deg: number, key: string) => (
    <g key={key} transform={`translate(${x} ${y}) rotate(${deg})`} className="pointer-events-none">
      <rect x={-8} y={-7} width={16} height={14} rx={4} fill={CHAIR.fill} stroke={CHAIR.line} strokeWidth={1.3} />
      <rect x={-8} y={-11} width={16} height={4.5} rx={2} fill={CHAIR.back} stroke={CHAIR.line} strokeWidth={1} />
    </g>
  );

  const renderChairs = (table: MockTable) => {
    const nodes: React.ReactNode[] = [];
    const horizontal = table.w >= table.h;

    if (table.chairSides === 'none') return nodes;

    if (table.chairSides === 'top' || table.chairSides === 'bottom') {
      const y = table.chairSides === 'top' ? -18 : table.h + 18;
      const deg = table.chairSides === 'top' ? 0 : 180;
      for (let i = 1; i <= table.seats; i++) nodes.push(chair((table.w / (table.seats + 1)) * i, y, deg, `${table.id}-s${i}`));
      return nodes;
    }

    if (table.shape === 'round' || table.shape === 'oval') {
      const rx = table.w / 2 + 17;
      const ry = table.h / 2 + 17;
      for (let i = 0; i < table.seats; i++) {
        const a = (i / table.seats) * Math.PI * 2 + (table.seats === 2 ? 0 : -Math.PI / 2);
        nodes.push(chair(table.w / 2 + rx * Math.cos(a), table.h / 2 + ry * Math.sin(a), (a * 180) / Math.PI + 90, `${table.id}-r${i}`));
      }
      return nodes;
    }

    if (horizontal) {
      const top = Math.ceil(table.seats / 2);
      const bottom = table.seats - top;
      for (let i = 1; i <= top; i++) nodes.push(chair((table.w / (top + 1)) * i, -18, 0, `${table.id}-t${i}`));
      for (let i = 1; i <= bottom; i++) nodes.push(chair((table.w / (bottom + 1)) * i, table.h + 18, 180, `${table.id}-b${i}`));
    } else {
      const left = Math.ceil(table.seats / 2);
      const right = table.seats - left;
      for (let i = 1; i <= left; i++) nodes.push(chair(-18, (table.h / (left + 1)) * i, 270, `${table.id}-l${i}`));
      for (let i = 1; i <= right; i++) nodes.push(chair(table.w + 18, (table.h / (right + 1)) * i, 90, `${table.id}-r${i}`));
    }
    return nodes;
  };

  /* ------------------------------------------------------------- декор */

  const renderDecor = (decor: MockDecor, x: number, y: number) => {
    const w = decor.w;
    const h = decor.h;
    switch (decor.type) {
      case 'sofa':
      case 'bench':
        return (
          <g>
            <rect width={w} height={h} rx={5} fill="#274A3A" stroke="#182C25" strokeWidth={1.6} />
            <rect x={4} y={4} width={Math.max(2, w - 8)} height={Math.max(2, h - 8)} rx={3} fill="none" stroke="#3F6757" strokeWidth={1} />
            {decor.type === 'bench' &&
              Array.from({ length: Math.max(1, Math.floor(w / 26)) }).map((_, i) => (
                <line key={i} x1={10 + i * 26} y1={4} x2={10 + i * 26} y2={h - 4} stroke="#3F6757" strokeWidth={1} />
              ))}
          </g>
        );
      case 'counter':
        return (
          <g>
            <rect width={w} height={h} fill="#ECE7DB" stroke="#2E2A24" strokeWidth={1.6} />
            <rect x={1} y={h - 10} width={w - 2} height={9} fill="#8C5A33" stroke="#2E2A24" strokeWidth={0.8} />
          </g>
        );
      case 'stove':
        return (
          <g>
            <rect width={w} height={h} fill="#EDE9E0" stroke="#2E2A24" strokeWidth={1.6} />
            {[
              [w * 0.28, h * 0.3],
              [w * 0.72, h * 0.3],
              [w * 0.28, h * 0.72],
              [w * 0.72, h * 0.72],
            ].map(([cx, cy], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r={Math.min(w, h) * 0.16} fill="#6E6656" stroke="#2E2A24" strokeWidth={1} />
                <circle cx={cx} cy={cy} r={Math.min(w, h) * 0.08} fill="#4A443A" />
              </g>
            ))}
          </g>
        );
      case 'sink':
        return (
          <g>
            <rect width={w} height={h} fill="#EDE9E0" stroke="#2E2A24" strokeWidth={1.6} />
            <rect x={8} y={8} width={w - 16} height={h - 16} rx={4} fill="#F9F7F1" stroke="#6E6656" strokeWidth={1.2} />
            <line x1={w / 2} y1={8} x2={w / 2} y2={2} stroke="#2E2A24" strokeWidth={2} />
          </g>
        );
      case 'fridge':
        return (
          <g>
            <rect width={w} height={h} fill="#E6E2D8" stroke="#2E2A24" strokeWidth={1.6} />
            <line x1={0} y1={h * 0.38} x2={w} y2={h * 0.38} stroke="#2E2A24" strokeWidth={1} />
            <line x1={w - 10} y1={6} x2={w - 10} y2={h * 0.3} stroke="#6E6656" strokeWidth={1.4} />
          </g>
        );
      case 'wc':
        return (
          <g>
            <rect x={w * 0.18} y={0} width={w * 0.64} height={h * 0.26} rx={2} fill="#E6E2D8" stroke="#2E2A24" strokeWidth={1.4} />
            <ellipse cx={w / 2} cy={h * 0.62} rx={w * 0.3} ry={h * 0.3} fill="#F9F7F1" stroke="#2E2A24" strokeWidth={1.4} />
            <ellipse cx={w / 2} cy={h * 0.6} rx={w * 0.18} ry={h * 0.18} fill="#EFEBE2" stroke="#8C8272" strokeWidth={1} />
          </g>
        );
      case 'basin':
        return (
          <g>
            <rect width={w} height={h} rx={6} fill="#F9F7F1" stroke="#2E2A24" strokeWidth={1.4} />
            <ellipse cx={w / 2} cy={h / 2} rx={w * 0.28} ry={h * 0.24} fill="#EDE9E0" stroke="#8C8272" strokeWidth={1} />
            <line x1={w / 2} y1={4} x2={w / 2} y2={0} stroke="#2E2A24" strokeWidth={1.6} />
          </g>
        );
      case 'plant':
        return (
          <g>
            <circle cx={w / 2} cy={h / 2} r={w * 0.46} fill="#5F8367" stroke="#3F6757" strokeWidth={1.2} />
            <circle cx={w * 0.36} cy={h * 0.42} r={w * 0.24} fill="#6F9376" />
            <circle cx={w * 0.64} cy={h * 0.58} r={w * 0.22} fill="#4F7358" />
          </g>
        );
      case 'chair':
        return chair(w / 2, h / 2, decor.rotation || 0, `chair-${decor.id}`);
      case 'door':
        return (
          <g transform={`rotate(${decor.rotation || 0} 0 0)`}>
            <line x1={0} y1={0} x2={0} y2={h} stroke="#2E2A24" strokeWidth={2.4} />
            <path d={`M ${w} 0 A ${h} ${h} 0 0 1 0 ${h}`} fill="none" stroke="#8C8272" strokeWidth={1.2} strokeDasharray="3 3" />
          </g>
        );
      case 'bar':
        return <rect width={w} height={h} rx={4} fill="#8C5A33" stroke="#2E2A24" strokeWidth={1.6} />;
      case 'stage':
        return <rect width={w} height={h} fill="#F1ECE1" stroke="#8C8272" strokeWidth={1.2} strokeDasharray="4 3" />;
      case 'pillar':
        return (
          <g>
            <rect width={w} height={h} fill="#E9DFCE" stroke="#2E2A24" strokeWidth={1.2} />
            <line x1={0} y1={0} x2={w} y2={h} stroke="#8C8272" strokeWidth={0.8} />
            <line x1={w} y1={0} x2={0} y2={h} stroke="#8C8272" strokeWidth={0.8} />
          </g>
        );
      case 'partition':
        return <rect width={w} height={h} fill="#C7D3C4" opacity={0.75} />;
      default:
        return null;
    }
  };

  /* --------------------------------------------------------------- svg */

  return (
    <div
      className="relative w-full overflow-hidden rounded-[3px] border border-stone-200 bg-[#FFFDF8]"
      role="region"
      aria-label="Интерактивная схема зала"
    >
      <svg
        ref={svgRef}
        viewBox="0 0 960 560"
        className="block h-auto w-full select-none"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'top left',
          transition: draggingTableId || draggingDecorId ? 'none' : 'transform 160ms ease-out',
          cursor: mode === 'constructor' && tool !== 'select' ? 'crosshair' : undefined,
        }}
        shapeRendering="geometricPrecision"
        onMouseMove={handleMove}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onClick={(e) => {
          if (mode !== 'constructor' || tool === 'select' || !onPlace) return;
          const rect = svgRef.current!.getBoundingClientRect();
          const vb = svgRef.current!.viewBox.baseVal;
          const x = vb.x + ((e.clientX - rect.left) / rect.width) * vb.width;
          const y = vb.y + ((e.clientY - rect.top) / rect.height) * vb.height;
          const snap = gridSnap > 0 ? gridSnap : 1;
          onPlace(Math.round(x / snap) * snap, Math.round(y / snap) * snap);
        }}
      >
        <defs>
          <pattern id="plan-grid" width={gridSnap > 0 ? gridSnap * 2 : 20} height={gridSnap > 0 ? gridSnap * 2 : 20} patternUnits="userSpaceOnUse">
            <path d={`M ${gridSnap > 0 ? gridSnap * 2 : 20} 0 L 0 0 0 ${gridSnap > 0 ? gridSnap * 2 : 20}`} fill="none" stroke="#F0EBDD" strokeWidth="0.7" />
          </pattern>
          <pattern id="plan-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#8C3B35" strokeWidth="1" opacity="0.55" />
          </pattern>
        </defs>

        <rect width="960" height="560" fill="#FFFDF8" />
        {mode === 'constructor' && <rect width="960" height="560" fill="url(#plan-grid)" />}

        {/* Заливка зон */}
        {floor.zones.map((zone) => (
          <polygon
            key={zone.id}
            points={zone.polygon.map((p) => `${p.x},${p.y}`).join(' ')}
            fill={zone.isReservable ? '#FFFDF8' : '#F7F4EC'}
            stroke="none"
          />
        ))}

        {/* Мебель и оборудование */}
        {floor.zones.flatMap((z) => z.decors || []).map((decor) => {
          const isDragging = draggingDecorId === decor.id;
          const x = isDragging && dragPos ? dragPos.x : decor.x;
          const y = isDragging && dragPos ? dragPos.y : decor.y;
          return (
            <g
              key={decor.id}
              transform={`translate(${x} ${y})`}
              className={mode === 'constructor' ? 'cursor-move' : 'pointer-events-none'}
              onMouseDown={(e) => beginDecorDrag(e, decor)}
              onClick={() => {
                if (mode === 'constructor' && tool !== 'select') return;
                onDecorClick && onDecorClick(decor);
              }}
            >
              {renderDecor(decor, 0, 0)}
            </g>
          );
        })}

        {/* Текстовые подписи */}
        {(floor.labels || []).map((label) => (
          <text
            key={label.id}
            x={label.x}
            y={label.y}
            fill="#3E3830"
            fontSize="13"
            fontFamily="Lora, Georgia, serif"
            letterSpacing="0.02em"
            className="pointer-events-none"
          >
            {label.text}
          </text>
        ))}

        {/* Стены */}
        {(floor.walls || []).map((wall, i) => {
          const isSel = selectedWall === i;
          return (
            <g key={`w${i}`}>
              {isSel && (
                <line x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2} stroke="#A37F45" strokeWidth={10} strokeLinecap="butt" opacity={0.35} />
              )}
              <line x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2} stroke="#2E2A24" strokeWidth={6} strokeLinecap="butt" />
              <line x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2} stroke="#FFFDF8" strokeWidth={1.6} strokeLinecap="butt" />
              {mode === 'constructor' && (
                <line
                  x1={wall.x1}
                  y1={wall.y1}
                  x2={wall.x2}
                  y2={wall.y2}
                  stroke="transparent"
                  strokeWidth={14}
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onWallClick && onWallClick(i);
                  }}
                >
                  <title>{`Стена · ${Math.round(Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1))} px`}</title>
                </line>
              )}
            </g>
          );
        })}

        {/* Окна */}
        {(floor.windows || []).map((win, i) => {
          const horizontal = win.y1 === win.y2;
          return horizontal ? (
            <g key={`win${i}`}>
              <rect x={Math.min(win.x1, win.x2)} y={win.y1 - 4} width={Math.abs(win.x2 - win.x1)} height={8} fill="#F4F7F7" stroke="#2E2A24" strokeWidth={1.2} />
              <line x1={win.x1} y1={win.y1} x2={win.x2} y2={win.y2} stroke="#A9B4B8" strokeWidth={1.2} />
            </g>
          ) : (
            <g key={`win${i}`}>
              <rect x={win.x1 - 4} y={Math.min(win.y1, win.y2)} width={8} height={Math.abs(win.y2 - win.y1)} fill="#F4F7F7" stroke="#2E2A24" strokeWidth={1.2} />
              <line x1={win.x1} y1={win.y1} x2={win.x2} y2={win.y2} stroke="#A9B4B8" strokeWidth={1.2} />
            </g>
          );
        })}

        {/* Подписи зон */}
        {floor.zones.filter((z) => !z.isReservable).map((zone) => {
          const xs = zone.polygon.map((p) => p.x);
          const ys = zone.polygon.map((p) => p.y);
          return (
            <text
              key={`label-${zone.id}`}
              x={Math.min(...xs) + 4}
              y={Math.min(...ys) - 8}
              fill="#8C8272"
              fontSize="12"
              fontFamily="Golos Text, sans-serif"
              letterSpacing="0.04em"
            >
              {zone.name}
            </text>
          );
        })}

        {/* Столы */}
        {floor.zones.flatMap((z) => z.tables).map((table) => {
          const status = statusFor(table);
          const tone = tableTone(status, mode);
          const isSelected = selectedTableId === table.id;
          const isDragging = draggingTableId === table.id && !isRotating;
          const x = isDragging && dragPos ? dragPos.x : table.x;
          const y = isDragging && dragPos ? dragPos.y : table.y;
          const clickable = mode === 'constructor' || mode === 'manager' || (mode === 'booking' && (status === 'optimal' || status === 'available'));

          return (
            <g
              key={table.id}
              role={clickable ? 'button' : 'img'}
              tabIndex={clickable ? 0 : -1}
              aria-label={`Стол ${table.number}, ${table.seats} мест, ${STATUS_TEXT[status] || 'свободен'}`}
              {...(clickable ? { 'aria-pressed': isSelected } : {})}
              transform={`translate(${x} ${y}) rotate(${table.rotation}, ${table.w / 2}, ${table.h / 2})`}
              className={`group ${clickable ? 'cursor-pointer' : 'cursor-default'} outline-none`}
              opacity={tone.dim}
              onMouseDown={(e) => beginTableDrag(e, table)}
              onClick={() => {
                if (mode === 'constructor' && tool !== 'select') return;
                if (clickable) onTableClick && onTableClick(table);
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && clickable && onTableClick) {
                  e.preventDefault();
                  onTableClick(table);
                }
              }}
            >
              {renderChairs(table)}

              {table.shape === 'round' ? (
                <circle
                  cx={table.w / 2}
                  cy={table.h / 2}
                  r={table.w / 2}
                  fill="#8C5A33"
                  stroke={tone.stroke}
                  strokeWidth={tone.width}
                  strokeDasharray={tone.dashed ? '5 4' : undefined}
                  className="transition-[stroke,stroke-width] duration-150 ease-out group-hover:stroke-[#A37F45] group-focus-visible:stroke-[#A37F45]"
                />
              ) : table.shape === 'oval' ? (
                <ellipse
                  cx={table.w / 2}
                  cy={table.h / 2}
                  rx={table.w / 2}
                  ry={table.h / 2}
                  fill="#8C5A33"
                  stroke={tone.stroke}
                  strokeWidth={tone.width}
                  strokeDasharray={tone.dashed ? '5 4' : undefined}
                  className="transition-[stroke,stroke-width] duration-150 ease-out group-hover:stroke-[#A37F45] group-focus-visible:stroke-[#A37F45]"
                />
              ) : (
                <rect
                  width={table.w}
                  height={table.h}
                  rx={7}
                  fill="#8C5A33"
                  stroke={tone.stroke}
                  strokeWidth={tone.width}
                  strokeDasharray={tone.dashed ? '5 4' : undefined}
                  className="transition-[stroke,stroke-width] duration-150 ease-out group-hover:stroke-[#A37F45] group-focus-visible:stroke-[#A37F45]"
                />
              )}

              {/* фактура столешницы */}
              {table.shape === 'rect' && (
                <rect x={7} y={7} width={Math.max(2, table.w - 14)} height={Math.max(2, table.h - 14)} rx={4} fill="none" stroke="#A9764B" strokeWidth={1} opacity={0.55} />
              )}

              {tone.overlayOpacity > 0 && (
                <rect
                  x={0}
                  y={0}
                  width={table.w}
                  height={table.h}
                  rx={table.shape === 'round' ? table.w / 2 : 7}
                  fill={status === 'occupied' ? 'url(#plan-hatch)' : tone.overlay}
                  opacity={tone.overlayOpacity}
                  className="pointer-events-none"
                />
              )}

              <text
                aria-hidden="true"
                x={table.w / 2}
                y={table.h / 2 + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#FBF7EF"
                fontSize={table.shape === 'rect' && table.h > 80 ? 13 : 12}
                fontFamily="Lora, Georgia, serif"
                className="pointer-events-none"
              >
                {table.number}
              </text>

              {status === 'optimal' && mode === 'booking' && (
                <circle cx={table.w - 2} cy={2} r={5} fill="#2E5A45" stroke="#FFFDF8" strokeWidth={1.6} className="pointer-events-none" />
              )}

              {isSelected && (
                <rect x={-7} y={-7} width={table.w + 14} height={table.h + 14} rx={9} fill="none" stroke="#A37F45" strokeWidth={1.6} strokeDasharray="5 4" className="pointer-events-none" />
              )}

              {mode === 'constructor' && isSelected && (
                <g>
                  <line x1={table.w / 2} y1={-8} x2={table.w / 2} y2={-24} stroke="#A37F45" strokeWidth={1.2} />
                  <circle
                    cx={table.w / 2}
                    cy={-26}
                    r={5}
                    fill="#FFFDF8"
                    stroke="#A37F45"
                    strokeWidth={1.4}
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => beginRotate(e, table)}
                  >
                    <title>Поворот стола</title>
                  </circle>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
