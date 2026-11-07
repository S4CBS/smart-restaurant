import React, { useEffect, useState } from 'react';
import { MockDecor, MockFloor, MockTable, INITIAL_FLOORS } from '../../mockData';
import { FloorPlanSVG } from '../../components/FloorPlanSVG';
import { Copy, Download, RotateCw, Trash2, Undo2, Redo2, Upload, ZoomIn, ZoomOut } from 'lucide-react';

type Tool =
  | 'select'
  | 'wall'
  | 'door'
  | 'window'
  | 'label'
  | 'table-square'
  | 'table-round'
  | 'table-rect'
  | 'table-oval'
  | 'chair'
  | 'sofa'
  | 'plant'
  | 'wc'
  | 'basin'
  | 'sink'
  | 'stove'
  | 'counter';

const GROUPS: { title: string; items: { key: Tool; label: string }[] }[] = [
  {
    title: 'Помещение',
    items: [
      { key: 'wall', label: 'Стена' },
      { key: 'door', label: 'Дверь' },
      { key: 'window', label: 'Окно' },
      { key: 'label', label: 'Подпись' },
    ],
  },
  {
    title: 'Столы',
    items: [
      { key: 'table-square', label: 'Квадрат' },
      { key: 'table-round', label: 'Круг' },
      { key: 'table-rect', label: 'Прямоугольник' },
      { key: 'table-oval', label: 'Овал' },
    ],
  },
  {
    title: 'Мебель',
    items: [
      { key: 'chair', label: 'Стул' },
      { key: 'sofa', label: 'Диван' },
      { key: 'plant', label: 'Растение' },
    ],
  },
  {
    title: 'Санузел и кухня',
    items: [
      { key: 'wc', label: 'Санузел' },
      { key: 'basin', label: 'Раковина' },
      { key: 'sink', label: 'Мойка' },
      { key: 'stove', label: 'Плита' },
      { key: 'counter', label: 'Стойка' },
    ],
  },
];

const HINTS: Partial<Record<Tool, string>> = {
  wall: 'Клик — начало стены, второй клик — конец. Esc — отменить.',
  door: 'Клик по схеме — поставить дверь.',
  window: 'Клик по стене — вставить окно.',
  label: 'Клик — место подписи, затем введите текст.',
  'table-square': 'Клик — квадратный стол на 2 места.',
  'table-round': 'Клик — круглый стол на 4 места.',
  'table-rect': 'Клик — прямоугольный стол на 6 мест.',
  'table-oval': 'Клик — овальный стол на 8 мест.',
  chair: 'Клик — поставить стул.',
  sofa: 'Клик — поставить диван.',
  plant: 'Клик — поставить растение.',
  wc: 'Клик — поставить санузел.',
  basin: 'Клик — поставить раковину.',
  sink: 'Клик — поставить мойку.',
  stove: 'Клик — поставить плиту.',
  counter: 'Клик — поставить стойку.',
};

export const ConstructorView: React.FC = () => {
  const [floors, setFloors] = useState<MockFloor[]>(INITIAL_FLOORS);
  const [activeFloorId, setActiveFloorId] = useState('floor-1');
  const [selectedTableId, setSelectedTableId] = useState<string | null>('t-1');
  const [selectedDecorId, setSelectedDecorId] = useState<string | null>(null);
  const [selectedWall, setSelectedWall] = useState<number | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null);

  const [zoom, setZoom] = useState(1);
  const [gridSnap, setGridSnap] = useState(10);

  const [revision, setRevision] = useState(4);
  const [publishComment, setPublishComment] = useState('Сезонное обновление рассадки основного зала');
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);

  const [history, setHistory] = useState<MockFloor[][]>([INITIAL_FLOORS]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const currentFloor = floors.find((f) => f.id === activeFloorId) || floors[0];
  const selectedTable = currentFloor.zones.flatMap((z) => z.tables).find((t) => t.id === selectedTableId);
  const selectedDecor = currentFloor.zones.flatMap((z) => z.decors || []).find((d) => d.id === selectedDecorId);
  const selectedLabel = (currentFloor.labels || []).find((l) => l.id === selectedLabelId);
  const wall = selectedWall != null ? (currentFloor.walls || [])[selectedWall] : undefined;

  const notify = (message: string) => {
    setAlert(message);
    window.setTimeout(() => setAlert(null), 3600);
  };

  const pushState = (next: MockFloor[]) => {
    const trimmed = history.slice(0, historyIndex + 1);
    trimmed.push(next);
    if (trimmed.length > 30) trimmed.shift();
    setHistory(trimmed);
    setHistoryIndex(trimmed.length - 1);
    setFloors(next);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setFloors(history[historyIndex - 1]);
    }
  };
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setFloors(history[historyIndex + 1]);
    }
  };

  const patchFloor = (mapper: (floor: MockFloor) => MockFloor) => floors.map((fl) => (fl.id === activeFloorId ? mapper(fl) : fl));

  const clearSelection = () => {
    setSelectedTableId(null);
    setSelectedDecorId(null);
    setSelectedWall(null);
    setSelectedLabelId(null);
  };

  const dragTable = (tableId: string, x: number, y: number) =>
    pushState(
      patchFloor((fl) => ({
        ...fl,
        zones: fl.zones.map((z) => ({ ...z, tables: z.tables.map((t) => (t.id === tableId ? { ...t, x, y } : t)) })),
      }))
    );

  const dragDecor = (decorId: string, x: number, y: number) =>
    pushState(
      patchFloor((fl) => ({
        ...fl,
        zones: fl.zones.map((z) => ({ ...z, decors: (z.decors || []).map((d) => (d.id === decorId ? { ...d, x, y } : d)) })),
      }))
    );

  const rotateTable = (tableId: string, rotation: number) =>
    setFloors((prev) =>
      prev.map((fl) =>
        fl.id === activeFloorId
          ? { ...fl, zones: fl.zones.map((z) => ({ ...z, tables: z.tables.map((t) => (t.id === tableId ? { ...t, rotation } : t)) })) }
          : fl
      )
    );

  const updateTable = (patch: Partial<MockTable>) => {
    if (!selectedTableId) return;
    pushState(
      patchFloor((fl) => ({
        ...fl,
        zones: fl.zones.map((z) => ({ ...z, tables: z.tables.map((t) => (t.id === selectedTableId ? { ...t, ...patch } : t)) })),
      }))
    );
  };

  const addTable = (shape: MockTable['shape'], x?: number, y?: number) => {
    const zone = currentFloor.zones.find((z) => z.isReservable) || currentFloor.zones[0];
    const id = `t-${Date.now()}`;
    const count = floors.flatMap((fl) => fl.zones.flatMap((z) => z.tables)).length;
    const size = shape === 'rect' ? [120, 80] : shape === 'oval' ? [140, 85] : shape === 'round' ? [85, 85] : [70, 70];
    const seats = shape === 'oval' ? 8 : shape === 'rect' ? 6 : shape === 'round' ? 4 : 2;
    const table: MockTable = {
      id,
      zoneId: zone.id,
      number: String(count + 1),
      seats,
      shape,
      x: x != null ? x - size[0] / 2 : 100,
      y: y != null ? y - size[1] / 2 : 100,
      w: size[0],
      h: size[1],
      rotation: 0,
      isReservable: true,
      minSeats: Math.max(1, Math.floor(seats / 2)),
    };
    pushState(patchFloor((fl) => ({ ...fl, zones: fl.zones.map((z) => (z.id === zone.id ? { ...z, tables: [...z.tables, table] } : z)) })));
    setSelectedTableId(id);
  };

  const addDecor = (type: MockDecor['type'], label: string, w: number, h: number, x?: number, y?: number, rotation = 0) => {
    const decor: MockDecor = {
      id: `dec-${Date.now()}-${Math.round(Math.random() * 999)}`,
      type,
      label,
      x: x != null ? x - w / 2 : 120,
      y: y != null ? y - h / 2 : 80,
      w,
      h,
      rotation,
    };
    pushState(
      patchFloor((fl) => ({ ...fl, zones: fl.zones.map((z, i) => (i === 0 ? { ...z, decors: [...(z.decors || []), decor] } : z)) }))
    );
    setSelectedDecorId(decor.id);
    setSelectedTableId(null);
  };

  const addWall = (x: number, y: number) => {
    if (!wallStart) {
      setWallStart({ x, y });
      notify('Начало стены отмечено — кликните конец');
      return;
    }
    if (Math.hypot(x - wallStart.x, y - wallStart.y) < 10) return;
    pushState(patchFloor((fl) => ({ ...fl, walls: [...(fl.walls || []), { x1: wallStart.x, y1: wallStart.y, x2: x, y2: y }] })));
    setWallStart(null);
  };

  const addWindow = (x: number, y: number) =>
    pushState(patchFloor((fl) => ({ ...fl, windows: [...(fl.windows || []), { x1: x - 40, y1: y, x2: x + 40, y2: y }] })));

  const addLabel = (x: number, y: number) => {
    const text = window.prompt('Подпись на схеме', 'Новая зона');
    if (!text) return;
    const label = { id: `lbl-${Date.now()}`, x, y, text };
    pushState(patchFloor((fl) => ({ ...fl, labels: [...(fl.labels || []), label] })));
    setSelectedLabelId(label.id);
    setSelectedTableId(null);
  };

  const place = (x: number, y: number) => {
    if (tool === 'wall') return addWall(x, y);
    if (tool === 'door') return addDecor('door', 'Дверь', 52, 52, x, y, 0);
    if (tool === 'window') return addWindow(x, y);
    if (tool === 'label') return addLabel(x, y);
    if (tool === 'table-square') return addTable('square', x, y);
    if (tool === 'table-round') return addTable('round', x, y);
    if (tool === 'table-rect') return addTable('rect', x, y);
    if (tool === 'table-oval') return addTable('oval', x, y);
    if (tool === 'chair') return addDecor('chair', 'Стул', 28, 28, x, y);
    if (tool === 'sofa') return addDecor('sofa', 'Диван', 110, 28, x, y);
    if (tool === 'plant') return addDecor('plant', 'Растение', 30, 30, x, y);
    if (tool === 'wc') return addDecor('wc', 'Санузел', 50, 66, x, y);
    if (tool === 'basin') return addDecor('basin', 'Раковина', 46, 28, x, y);
    if (tool === 'sink') return addDecor('sink', 'Мойка', 84, 54, x, y);
    if (tool === 'stove') return addDecor('stove', 'Плита', 82, 58, x, y);
    if (tool === 'counter') return addDecor('counter', 'Стойка', 140, 40, x, y);
  };

  const duplicateTable = () => {
    if (!selectedTable) return;
    const id = `t-${Date.now()}`;
    const copy: MockTable = { ...selectedTable, id, number: `${selectedTable.number}А`, x: selectedTable.x + 30, y: selectedTable.y + 30 };
    pushState(
      patchFloor((fl) => ({
        ...fl,
        zones: fl.zones.map((z) => (z.id === selectedTable.zoneId ? { ...z, tables: [...z.tables, copy] } : z)),
      }))
    );
    setSelectedTableId(id);
  };

  const deleteSelected = () => {
    if (selectedTableId) {
      pushState(
        patchFloor((fl) => ({ ...fl, zones: fl.zones.map((z) => ({ ...z, tables: z.tables.filter((t) => t.id !== selectedTableId) })) }))
      );
      setSelectedTableId(null);
      return;
    }
    if (selectedDecorId) {
      pushState(
        patchFloor((fl) => ({
          ...fl,
          zones: fl.zones.map((z) => ({ ...z, decors: (z.decors || []).filter((d) => d.id !== selectedDecorId) })),
        }))
      );
      setSelectedDecorId(null);
      return;
    }
    if (selectedWall != null) {
      pushState(patchFloor((fl) => ({ ...fl, walls: (fl.walls || []).filter((_, i) => i !== selectedWall) })));
      setSelectedWall(null);
      return;
    }
    if (selectedLabelId) {
      pushState(patchFloor((fl) => ({ ...fl, labels: (fl.labels || []).filter((l) => l.id !== selectedLabelId) })));
      setSelectedLabelId(null);
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(floors, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `layout-rev${revision}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result));
        if (Array.isArray(parsed)) {
          pushState(parsed);
          notify('Схема импортирована из файла');
        }
      } catch {
        notify('Не удалось прочитать JSON схемы');
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const publish = () => {
    setRevision((r) => r + 1);
    setIsPublishOpen(false);
    notify(`Ревизия #${revision + 1} опубликована`);
  };

  const renameDecor = (label: string) => {
    if (!selectedDecor) return;
    setFloors((prev) =>
      prev.map((fl) => ({
        ...fl,
        zones: fl.zones.map((z) => ({
          ...z,
          decors: (z.decors || []).map((d) => (d.id === selectedDecor.id ? { ...d, label } : d)),
        })),
      }))
    );
  };

  const rotateDecor = (rotation: number) => {
    if (!selectedDecor) return;
    setFloors((prev) =>
      prev.map((fl) => ({
        ...fl,
        zones: fl.zones.map((z) => ({
          ...z,
          decors: (z.decors || []).map((d) => (d.id === selectedDecor.id ? { ...d, rotation } : d)),
        })),
      }))
    );
  };

  const renameLabel = (text: string) => {
    if (!selectedLabelId) return;
    setFloors((prev) => prev.map((fl) => (fl.id === activeFloorId ? { ...fl, labels: (fl.labels || []).map((l) => (l.id === selectedLabelId ? { ...l, text } : l)) } : fl)));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (e.key === 'Escape') {
        setTool('select');
        setWallStart(null);
        return;
      }
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (mod && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === 'd' && selectedTableId) {
        e.preventDefault();
        duplicateTable();
      } else if (e.key === 'Delete') {
        e.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const panelTitle = selectedTable
    ? `Стол ${selectedTable.number}`
    : selectedDecor
      ? selectedDecor.label
      : selectedWall != null
        ? 'Стена'
        : selectedLabel
          ? 'Подпись'
          : tool !== 'select'
            ? 'Инструмент'
            : 'Параметры';

  return (
    <section aria-labelledby="constructor-heading" className="space-y-6">
      <header className="flex flex-col gap-5 border-b border-stone-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 id="constructor-heading" className="text-[28px] leading-tight text-ink sm:text-[32px]">
              Схема зала
            </h1>
            <span className="text-[12px] text-stone-500">ревизия #{revision}</span>
          </div>
          <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-stone-600">
            Стройте зал как в конструкторе: стены, двери, окна, столы, мебель и подписи. Перетаскивайте объекты, меняйте параметры справа.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-[12px] text-stone-500 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
            редактируете только вы
          </span>
          <button
            type="button"
            onClick={() => setIsPublishOpen(true)}
            className="rounded-[2px] bg-stone-900 px-4 py-2.5 text-[13px] font-medium text-stone-50 transition-colors hover:bg-black"
          >
            Опубликовать схему
          </button>
        </div>
      </header>

      {alert && (
        <div role="status" className="border-l-2 border-emerald-700 bg-emerald-50 px-4 py-2.5 text-[12.5px] text-emerald-900">
          {alert}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-stone-200 pb-4">
        <div className="flex overflow-hidden rounded-[2px] border border-stone-300" role="group" aria-label="Этаж">
          {floors.map((fl) => (
            <button
              key={fl.id}
              type="button"
              onClick={() => {
                setActiveFloorId(fl.id);
                clearSelection();
                setTool('select');
              }}
              aria-pressed={activeFloorId === fl.id}
              className={`px-3 py-1.5 text-[12.5px] transition-colors ${
                activeFloorId === fl.id ? 'bg-stone-900 text-stone-50' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {fl.name.split('—')[0].trim()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={undo} disabled={historyIndex === 0} aria-label="Отменить действие" title="Отменить (Ctrl+Z)" className="rounded-[2px] border border-stone-300 p-1.5 text-stone-600 transition-colors hover:bg-stone-100 disabled:opacity-35">
            <Undo2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={redo} disabled={historyIndex >= history.length - 1} aria-label="Повторить действие" title="Повторить (Ctrl+Y)" className="rounded-[2px] border border-stone-300 p-1.5 text-stone-600 transition-colors hover:bg-stone-100 disabled:opacity-35">
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(1))))} aria-label="Уменьшить масштаб" className="rounded-[2px] border border-stone-300 p-1.5 text-stone-600 hover:bg-stone-100">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="w-11 text-center text-[12px] tabular-nums text-stone-600">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.1).toFixed(1))))} aria-label="Увеличить масштаб" className="rounded-[2px] border border-stone-300 p-1.5 text-stone-600 hover:bg-stone-100">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setZoom(1)} className="ml-1 text-[12px] text-stone-500 underline-offset-2 hover:text-ink hover:underline">
            сброс
          </button>
        </div>

        <label className="flex items-center gap-2 text-[12px] text-stone-600">
          Сетка
          <select
            value={gridSnap}
            onChange={(e) => setGridSnap(Number(e.target.value))}
            className="rounded-[2px] border border-stone-300 bg-stone-50 px-2 py-1 text-[12px] text-ink focus:border-stone-900 focus:outline-none"
          >
            <option value={10}>10 px</option>
            <option value={20}>20 px</option>
            <option value={0}>выключена</option>
          </select>
        </label>

        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={exportJSON} className="inline-flex items-center gap-1.5 text-[12px] text-stone-600 underline-offset-2 hover:text-ink hover:underline">
            <Download className="h-3.5 w-3.5" aria-hidden="true" /> Экспорт
          </button>
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-[12px] text-stone-600 underline-offset-2 hover:text-ink hover:underline">
            <Upload className="h-3.5 w-3.5" aria-hidden="true" /> Импорт
            <input type="file" accept=".json" onChange={importJSON} className="hidden" />
          </label>
        </div>
      </div>

      {/* Палитра инструментов */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTool('select');
              setWallStart(null);
            }}
            aria-pressed={tool === 'select'}
            className={`rounded-[2px] border px-3 py-1.5 text-[12.5px] transition-colors ${
              tool === 'select' ? 'border-stone-900 bg-stone-900 text-stone-50' : 'border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100'
            }`}
          >
            Выбор
          </button>
          {GROUPS.map((group) => (
            <div key={group.title} className="flex flex-wrap items-center gap-1.5 border-l border-stone-200 pl-2">
              <span className="text-[11.5px] text-stone-500">{group.title}</span>
              {group.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setTool(item.key);
                    setWallStart(null);
                    clearSelection();
                  }}
                  aria-pressed={tool === item.key}
                  className={`rounded-[2px] border px-2.5 py-1.5 text-[12px] transition-colors ${
                    tool === item.key ? 'border-amber-600 bg-amber-50 text-amber-900' : 'border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        {tool !== 'select' && <p className="text-[12px] text-stone-500">{HINTS[tool] || ''}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-2 flex items-baseline justify-between gap-4">
            <h2 className="text-[15px] text-ink">{currentFloor.name}</h2>
            <span className="text-[12px] text-stone-500">960 × 560 px · шаг {gridSnap || 1} px</span>
          </div>
          <FloorPlanSVG
            floor={currentFloor}
            selectedTableId={selectedTableId}
            mode="constructor"
            zoom={zoom}
            gridSnap={gridSnap}
            tool={tool}
            onPlace={place}
            selectedWall={selectedWall}
            onWallClick={(i) => {
              setSelectedWall(i);
              setSelectedTableId(null);
              setSelectedDecorId(null);
              setSelectedLabelId(null);
              setTool('select');
            }}
            onTableClick={(t) => {
              setSelectedTableId(t.id);
              setSelectedDecorId(null);
              setSelectedWall(null);
              setSelectedLabelId(null);
              setTool('select');
            }}
            onDecorClick={(d) => {
              setSelectedDecorId(d.id);
              setSelectedTableId(null);
              setSelectedWall(null);
              setSelectedLabelId(null);
              setTool('select');
            }}
            onTableDragEnd={dragTable}
            onTableRotate={rotateTable}
            onDecorDragEnd={dragDecor}
          />
          <p className="mt-3 text-[12px] text-stone-500">
            Ctrl+Z — отменить, Ctrl+Y — повторить, Ctrl+D — дублировать, Delete — удалить, Esc — выйти из инструмента.
          </p>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="border border-stone-200 bg-stone-50 p-5">
            <div className="flex items-baseline justify-between gap-3 border-b border-stone-200 pb-3">
              <h2 className="text-[15px] text-ink">{panelTitle}</h2>
              {(selectedTable || selectedDecor || selectedWall != null || selectedLabel) && (
                <button type="button" onClick={clearSelection} className="text-[12px] text-stone-500 hover:text-ink">
                  снять выбор
                </button>
              )}
            </div>

            {selectedTable ? (
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] text-stone-500">Номер стола</span>
                  <input
                    type="text"
                    value={selectedTable.number}
                    onChange={(e) => updateTable({ number: e.target.value })}
                    className="w-full rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[13px] text-ink focus:border-stone-900 focus:outline-none"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] text-stone-500">Мест</span>
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={selectedTable.seats}
                      onChange={(e) => updateTable({ seats: parseInt(e.target.value, 10) || 2 })}
                      className="w-full rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[13px] tabular-nums text-ink focus:border-stone-900 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] text-stone-500">Мин. гостей</span>
                    <input
                      type="number"
                      min={1}
                      max={selectedTable.seats}
                      value={selectedTable.minSeats || 1}
                      onChange={(e) => updateTable({ minSeats: parseInt(e.target.value, 10) || 1 })}
                      className="w-full rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[13px] tabular-nums text-ink focus:border-stone-900 focus:outline-none"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] text-stone-500">Форма столешницы</span>
                  <select
                    value={selectedTable.shape}
                    onChange={(e) => updateTable({ shape: e.target.value as MockTable['shape'] })}
                    className="w-full rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[13px] text-ink focus:border-stone-900 focus:outline-none"
                  >
                    <option value="square">Квадратный</option>
                    <option value="round">Круглый</option>
                    <option value="rect">Прямоугольный</option>
                    <option value="oval">Овальный</option>
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] text-stone-500">Ширина</span>
                    <input
                      type="number"
                      min={40}
                      max={320}
                      step={2}
                      value={selectedTable.w}
                      onChange={(e) => updateTable({ w: parseInt(e.target.value, 10) || 60 })}
                      className="w-full rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[13px] tabular-nums text-ink focus:border-stone-900 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] text-stone-500">Высота</span>
                    <input
                      type="number"
                      min={40}
                      max={200}
                      step={2}
                      value={selectedTable.h}
                      onChange={(e) => updateTable({ h: parseInt(e.target.value, 10) || 60 })}
                      className="w-full rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[13px] tabular-nums text-ink focus:border-stone-900 focus:outline-none"
                    />
                  </label>
                </div>

                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="flex items-center gap-1.5 text-[12px] text-stone-500">
                      <RotateCw className="h-3 w-3" aria-hidden="true" /> Поворот
                    </span>
                    <span className="text-[12px] tabular-nums text-stone-600">{selectedTable.rotation}°</span>
                  </div>
                  <input type="range" min={0} max={360} step={15} value={selectedTable.rotation} onChange={(e) => updateTable({ rotation: parseInt(e.target.value, 10) })} className="w-full accent-stone-900" />
                </div>

                <label className="flex items-center gap-2 text-[12.5px] text-stone-700">
                  <input type="checkbox" checked={selectedTable.isReservable} onChange={(e) => updateTable({ isReservable: e.target.checked })} className="h-4 w-4 accent-stone-900" />
                  Доступен для онлайн-брони
                </label>

                <div className="flex items-center gap-2 border-t border-stone-200 pt-4">
                  <button type="button" onClick={duplicateTable} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[2px] border border-stone-300 px-3 py-2 text-[12.5px] text-stone-700 transition-colors hover:bg-stone-100">
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Дублировать
                  </button>
                  <button type="button" onClick={deleteSelected} aria-label="Удалить стол" className="rounded-[2px] border border-stone-300 p-2 text-stone-600 transition-colors hover:bg-rose-50 hover:text-rose-800">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : selectedDecor ? (
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] text-stone-500">Подпись на схеме</span>
                  <input
                    type="text"
                    value={selectedDecor.label}
                    onChange={(e) => renameDecor(e.target.value)}
                    className="w-full rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[13px] text-ink focus:border-stone-900 focus:outline-none"
                  />
                </label>
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-[12px] text-stone-500">Поворот</span>
                    <span className="text-[12px] tabular-nums text-stone-600">{selectedDecor.rotation || 0}°</span>
                  </div>
                  <input type="range" min={0} max={345} step={15} value={selectedDecor.rotation || 0} onChange={(e) => rotateDecor(parseInt(e.target.value, 10))} className="w-full accent-stone-900" />
                </div>
                <button type="button" onClick={deleteSelected} className="flex w-full items-center justify-center gap-1.5 rounded-[2px] border border-stone-300 px-3 py-2 text-[12.5px] text-stone-700 transition-colors hover:bg-rose-50 hover:text-rose-800">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Удалить объект
                </button>
              </div>
            ) : wall ? (
              <div className="mt-4 space-y-4">
                <dl className="space-y-2 text-[12.5px]">
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Длина</dt>
                    <dd className="tabular-nums text-ink">{Math.round(Math.hypot(wall.x2 - wall.x1, wall.y2 - wall.y1))} px</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Начало</dt>
                    <dd className="tabular-nums text-ink">{wall.x1}, {wall.y1}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Конец</dt>
                    <dd className="tabular-nums text-ink">{wall.x2}, {wall.y2}</dd>
                  </div>
                </dl>
                <button type="button" onClick={deleteSelected} className="flex w-full items-center justify-center gap-1.5 rounded-[2px] border border-stone-300 px-3 py-2 text-[12.5px] text-stone-700 transition-colors hover:bg-rose-50 hover:text-rose-800">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Удалить стену
                </button>
              </div>
            ) : selectedLabel ? (
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] text-stone-500">Текст</span>
                  <input
                    type="text"
                    value={selectedLabel.text}
                    onChange={(e) => renameLabel(e.target.value)}
                    className="w-full rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[13px] text-ink focus:border-stone-900 focus:outline-none"
                  />
                </label>
                <button type="button" onClick={deleteSelected} className="flex w-full items-center justify-center gap-1.5 rounded-[2px] border border-stone-300 px-3 py-2 text-[12.5px] text-stone-700 transition-colors hover:bg-rose-50 hover:text-rose-800">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Удалить подпись
                </button>
              </div>
            ) : (
              <p className="mt-4 text-[12.5px] leading-relaxed text-stone-500">
                Выберите объект на схеме или инструмент в палитре. Стены и мебель ставятся кликом, столы перетаскиваются.
              </p>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-stone-200 pt-3 text-[12px] text-stone-500">
              <span>холст 960 × 560</span>
              <span>снимок JSON</span>
            </div>
          </div>
        </aside>
      </div>

      {isPublishOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="publish-title">
          <div className="w-full max-w-[500px] rounded-[3px] border border-stone-300 bg-stone-50">
            <div className="border-b border-stone-200 px-6 py-5">
              <h2 id="publish-title" className="text-[22px] text-ink">
                Публикация ревизии #{revision + 1}
              </h2>
              <p className="mt-1 text-[12px] text-stone-500">Схема станет активной для гостей в бронировании.</p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <label className="block">
                <span className="mb-1.5 block text-[12px] text-stone-500">Комментарий к ревизии</span>
                <textarea
                  rows={3}
                  value={publishComment}
                  onChange={(e) => setPublishComment(e.target.value)}
                  className="w-full resize-none rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[13px] text-ink focus:border-stone-900 focus:outline-none"
                />
              </label>

              <ul className="space-y-1.5 border-l-2 border-amber-600 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-900">
                <li>пересечений геометрии не найдено</li>
                <li>столы с активными бронями сохранены</li>
                <li>снимок схемы фиксируется как ревизия</li>
              </ul>
            </div>

            <div className="flex gap-2 border-t border-stone-200 px-6 py-4">
              <button type="button" onClick={() => setIsPublishOpen(false)} className="flex-1 rounded-[2px] border border-stone-300 px-4 py-2.5 text-[13px] text-stone-700 transition-colors hover:bg-stone-100">
                Отмена
              </button>
              <button type="button" onClick={publish} className="flex-1 rounded-[2px] bg-stone-900 px-4 py-2.5 text-[13px] font-medium text-stone-50 transition-colors hover:bg-black">
                Опубликовать
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
