import React, { useMemo, useState } from 'react';
import { INITIAL_FLOORS, INITIAL_RESERVATIONS, MockReservation, ReservationStatus } from '../../mockData';
import { AlertTriangle, CheckCheck, PhoneCall, Search, UserX, XCircle } from 'lucide-react';

const SLOT_MIN = 30;
const SCALE = 1.65; // px на минуту
const DAY_START = 16 * 60;
const DAY_END = 23 * 60;

const STATUS_LABEL: Record<ReservationStatus, string> = {
  confirmed: 'подтверждена',
  seated: 'за столом',
  completed: 'завершена',
  cancelled: 'отменена',
  no_show: 'no-show',
};

const STATUS_STYLE: Record<ReservationStatus, string> = {
  confirmed: 'border-l-emerald-700 bg-emerald-50 text-emerald-900',
  seated: 'border-l-amber-600 bg-amber-50 text-amber-900',
  completed: 'border-l-stone-400 bg-stone-100 text-stone-600',
  cancelled: 'border-l-stone-300 bg-stone-50 text-stone-400 line-through',
  no_show: 'border-l-rose-700 bg-rose-50 text-rose-900',
};

export const ManagerView: React.FC = () => {
  const [reservations, setReservations] = useState<MockReservation[]>(INITIAL_RESERVATIONS);
  const [selectedRes, setSelectedRes] = useState<MockReservation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isManualOpen, setIsManualOpen] = useState(false);

  const [manualTableNumber, setManualTableNumber] = useState('5');
  const [manualGuestName, setManualGuestName] = useState('');
  const [manualGuestPhone, setManualGuestPhone] = useState('+7 (9');
  const [manualStartTime, setManualStartTime] = useState('18:30');
  const [manualDuration, setManualDuration] = useState(2);
  const [manualGuests, setManualGuests] = useState(2);
  const [manualError, setManualError] = useState<string | null>(null);

  const allTables = useMemo(() => INITIAL_FLOORS[0].zones.flatMap((z) => z.tables), []);

  const timeSlots = useMemo(() => {
    const out: string[] = [];
    for (let m = DAY_START; m <= DAY_END; m += SLOT_MIN) {
      out.push(`${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`);
    }
    return out;
  }, []);

  const filtered = useMemo(
    () =>
      reservations.filter((r) => {
        const q = searchQuery.toLowerCase();
        const hit = r.guestName.toLowerCase().includes(q) || r.guestPhone.includes(q) || r.tableNumber.includes(q);
        return hit && (statusFilter === 'all' || r.status === statusFilter);
      }),
    [reservations, searchQuery, statusFilter]
  );

  const total = reservations.length;
  const seated = reservations.filter((r) => r.status === 'seated').length;
  const noShow = reservations.filter((r) => r.status === 'no_show').length;
  const occupancy = Math.round(((seated + reservations.filter((r) => r.status === 'confirmed').length) / allTables.length) * 100);

  const updateStatus = (id: string, status: ReservationStatus) => {
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setSelectedRes((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
  };

  const extend = (id: string) => {
    setReservations((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const [h, m] = r.endTime.split(':').map(Number);
        const total = h * 60 + m + 30;
        return { ...r, endTime: `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}` };
      })
    );
  };

  const saveManual = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    const table = allTables.find((t) => t.number === manualTableNumber);
    if (!table) return setManualError('Стол не найден.');
    const [h, m] = manualStartTime.split(':').map(Number);
    const end = h * 60 + m + manualDuration * 60;
    const endTime = `${Math.floor(end / 60)}:${String(end % 60).padStart(2, '0')}`;
    const conflict = reservations.some(
      (r) => r.tableId === table.id && r.status !== 'cancelled' && manualStartTime < r.endTime && endTime > r.startTime
    );
    if (conflict) return setManualError(`Стол ${manualTableNumber} занят в этот интервал — учтите буфер 15 минут.`);

    const created: MockReservation = {
      id: `ML-MAN-${Math.floor(1000 + Math.random() * 9000)}`,
      tableId: table.id,
      tableNumber: table.number,
      guestName: manualGuestName || 'Гость по звонку',
      guestPhone: manualGuestPhone,
      startTime: manualStartTime,
      endTime,
      guestsCount: manualGuests,
      status: 'confirmed',
      notes: 'Оформлено метрдотелем по телефону',
    };
    setReservations((prev) => [...prev, created]);
    setIsManualOpen(false);
    setSelectedRes(created);
  };

  const blockStyle = (start: string, end: string) => {
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const s = Math.max(DAY_START, toMin(start));
    const e = Math.min(DAY_END, toMin(end));
    return { left: (s - DAY_START) * SCALE, width: Math.max(44, (e - s) * SCALE) };
  };

  const zoneLabel = (zoneId: string) => (zoneId === 'zone-main' ? 'Основной зал' : 'Летняя веранда');

  return (
    <section aria-labelledby="manager-heading" className="space-y-7">
      <header className="flex flex-col gap-5 border-b border-stone-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 id="manager-heading" className="text-[28px] leading-tight text-ink sm:text-[32px]">
            Журнал зала
          </h1>
          <p className="mt-2 max-w-[58ch] text-[13.5px] leading-relaxed text-stone-600">
            Посадка, переносы и неявки на одной шкале. Блок брони показывает интервал и гостя; буфер сервировки учтён в проверке пересечений.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setManualError(null);
            setIsManualOpen(true);
          }}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-[2px] bg-stone-900 px-4 py-2.5 text-[13px] font-medium text-stone-50 transition-colors hover:bg-black"
        >
          <PhoneCall className="h-4 w-4" aria-hidden="true" />
          Принять бронь по телефону
        </button>
      </header>

      <dl className="grid grid-cols-2 gap-x-8 gap-y-5 border-b border-stone-200 pb-6 md:grid-cols-4">
        {[
          { label: 'Броней на смену', value: total, tone: '' },
          { label: 'Загрузка посадки', value: `${occupancy}%`, tone: 'text-amber-700' },
          { label: 'Гостей за столами', value: seated, tone: 'text-emerald-800' },
          { label: 'Неявки', value: noShow, tone: noShow ? 'text-rose-700' : '' },
        ].map((s) => (
          <div key={s.label}>
            <dt className="text-[12px] text-stone-500">{s.label}</dt>
            <dd className={`mt-1 font-serif text-[26px] leading-none tabular-nums ${s.tone || 'text-ink'}`}>{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex min-w-[260px] flex-1 items-center gap-2 border-b border-stone-300 pb-2 focus-within:border-stone-900">
          <Search className="h-4 w-4 text-stone-400" aria-hidden="true" />
          <span className="sr-only">Поиск по брони</span>
          <input
            type="text"
            placeholder="Гость, телефон или номер стола"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[13px] text-ink placeholder:text-stone-400 focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Фильтр по статусу">
          {[
            { id: 'all', label: 'Все' },
            { id: 'confirmed', label: 'Подтверждены' },
            { id: 'seated', label: 'За столом' },
            { id: 'completed', label: 'Завершены' },
            { id: 'no_show', label: 'No-show' },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatusFilter(s.id)}
              aria-pressed={statusFilter === s.id}
              className={`px-3 py-1.5 text-[12px] transition-colors ${
                statusFilter === s.id
                  ? 'border-b-2 border-amber-600 text-ink'
                  : 'border-b-2 border-transparent text-stone-500 hover:text-ink'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-stone-200 bg-stone-50">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-stone-200 px-4 py-3">
          <h2 className="text-[15px] text-ink">Шахматка · 16:00 — 23:00</h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-stone-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2.5 border-l-2 border-emerald-700 bg-emerald-50" /> подтверждена</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2.5 border-l-2 border-amber-600 bg-amber-50" /> за столом</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2.5 border-l-2 border-rose-700 bg-rose-50" /> no-show</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2.5 border-l-2 border-dashed border-stone-400" /> буфер 15 мин</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div style={{ minWidth: `${210 + (DAY_END - DAY_START) * SCALE}px` }}>
            <div className="flex border-b border-stone-200 bg-stone-100/70">
              <div className="w-[210px] shrink-0 border-r border-stone-200 px-4 py-2.5 text-[12px] text-stone-500">Стол</div>
              <div className="flex flex-1">
                {timeSlots.slice(0, -1).map((t, i) => (
                  <div
                    key={t}
                    className={`flex-1 border-l border-stone-200 py-2.5 text-center text-[12px] tabular-nums ${
                      i % 2 === 0 ? 'text-stone-600' : 'text-stone-400'
                    }`}
                  >
                    {i % 2 === 0 ? t : ''}
                  </div>
                ))}
              </div>
            </div>

            <div className="divide-y divide-stone-200">
              {allTables.map((table) => {
                const rows = filtered.filter((r) => r.tableId === table.id);
                return (
                  <div key={table.id} className="flex h-[52px] items-stretch transition-colors hover:bg-stone-100/60">
                    <div className="flex w-[210px] shrink-0 flex-col justify-center border-r border-stone-200 px-4">
                      <span className="text-[12.5px] font-medium text-ink">
                        Стол {table.number} · {table.seats} мест
                      </span>
                      <span className="text-[12px] text-stone-500">{zoneLabel(table.zoneId)}</span>
                    </div>

                    <div className="relative flex-1">
                      <div className="pointer-events-none absolute inset-0 flex">
                        {timeSlots.slice(0, -1).map((_, i) => (
                          <div key={i} className={`flex-1 border-l ${i % 2 === 0 ? 'border-stone-200' : 'border-stone-100'}`} />
                        ))}
                      </div>

                      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-rose-300/70" aria-hidden="true" />

                      {rows.map((res) => {
                        const style = blockStyle(res.startTime, res.endTime);
                        return (
                          <button
                            key={res.id}
                            type="button"
                            onClick={() => setSelectedRes(res)}
                            style={{ left: style.left, width: style.width }}
                            className={`absolute top-[9px] z-10 flex h-[34px] items-center gap-2 overflow-hidden border-l-2 px-2 text-left text-[12px] transition-colors hover:brightness-[0.98] ${STATUS_STYLE[res.status]}`}
                            title={`${res.guestName} · ${res.startTime}—${res.endTime}`}
                          >
                            <span className="truncate">{res.guestName.split(' ')[0]}</span>
                            <span className="ml-auto shrink-0 tabular-nums opacity-70">{res.startTime}</span>
                            <span className="absolute inset-y-0 right-0 w-[3px] border-r border-dashed border-current opacity-30" aria-hidden="true" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-stone-200 px-4 py-2.5 text-[12px] text-stone-500">
          Вертикальная линия — текущее время смены. Блок продолжается до конца интервала брони.
        </div>
      </div>

      {/* Карточка брони */}
      {selectedRes && (
        <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[400px] flex-col border-l border-stone-300 bg-stone-50 shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-6 py-5">
            <div>
              <div className="text-[12px] text-stone-500">{selectedRes.id}</div>
              <h2 className="mt-1 text-[22px] text-ink">Стол {selectedRes.tableNumber}</h2>
              <div className="mt-1 text-[12px] text-stone-500">
                {selectedRes.startTime} — {selectedRes.endTime} · {selectedRes.guestsCount} гостя
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRes(null)}
              aria-label="Закрыть карточку брони"
              className="rounded-[2px] border border-stone-300 px-2 py-1 text-[13px] text-stone-600 transition-colors hover:bg-stone-100"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-auto px-6 py-5">
            <div>
              <div className="text-[15px] text-ink">{selectedRes.guestName}</div>
              <a href={`tel:${selectedRes.guestPhone.replace(/[^\d+]/g, '')}`} className="text-[12.5px] text-stone-600 underline-offset-2 hover:underline">
                {selectedRes.guestPhone}
              </a>
            </div>

            <dl className="space-y-2 text-[12.5px]">
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Статус</dt>
                <dd className="text-ink">{STATUS_LABEL[selectedRes.status]}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Повод</dt>
                <dd className="text-ink">{selectedRes.occasion === 'birthday' ? 'день рождения' : selectedRes.occasion === 'date' ? 'свидание' : selectedRes.occasion === 'business' ? 'переговоры' : selectedRes.occasion === 'anniversary' ? 'годовщина' : 'ужин'}</dd>
              </div>
            </dl>

            {selectedRes.specialRequests && (
              <div className="border-l-2 border-amber-600 bg-amber-50 px-3 py-2.5 text-[12px] leading-relaxed text-amber-900">
                {selectedRes.specialRequests}
              </div>
            )}
            {selectedRes.notes && <p className="text-[12px] leading-relaxed text-stone-600">{selectedRes.notes}</p>}

            <div className="space-y-2 border-t border-stone-200 pt-4">
              {selectedRes.status === 'confirmed' && (
                <button
                  type="button"
                  onClick={() => updateStatus(selectedRes.id, 'seated')}
                  className="flex w-full items-center gap-2 rounded-[2px] bg-stone-900 px-4 py-2.5 text-[13px] font-medium text-stone-50 hover:bg-black"
                >
                  <CheckCheck className="h-4 w-4" aria-hidden="true" /> Посадить гостей
                </button>
              )}
              {selectedRes.status === 'seated' && (
                <button
                  type="button"
                  onClick={() => updateStatus(selectedRes.id, 'completed')}
                  className="flex w-full items-center gap-2 rounded-[2px] bg-stone-900 px-4 py-2.5 text-[13px] font-medium text-stone-50 hover:bg-black"
                >
                  <CheckCheck className="h-4 w-4" aria-hidden="true" /> Освободить стол
                </button>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => extend(selectedRes.id)}
                  className="flex-1 rounded-[2px] border border-stone-300 px-3 py-2 text-[12.5px] text-stone-700 transition-colors hover:bg-stone-100"
                >
                  +30 минут
                </button>
                {selectedRes.status === 'confirmed' && (
                  <button
                    type="button"
                    onClick={() => updateStatus(selectedRes.id, 'no_show')}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-[2px] border border-stone-300 px-3 py-2 text-[12.5px] text-stone-700 transition-colors hover:bg-stone-100"
                  >
                    <UserX className="h-3.5 w-3.5" aria-hidden="true" /> No-show
                  </button>
                )}
              </div>
              {selectedRes.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() => updateStatus(selectedRes.id, 'cancelled')}
                  className="flex w-full items-center justify-center gap-1.5 rounded-[2px] border border-rose-200 px-3 py-2 text-[12.5px] text-rose-800 transition-colors hover:bg-rose-50"
                >
                  <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Отменить бронь
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ручная бронь */}
      {isManualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="manual-title">
          <div className="w-full max-w-[480px] rounded-[3px] border border-stone-300 bg-stone-50">
            <div className="border-b border-stone-200 px-6 py-5">
              <h2 id="manual-title" className="text-[22px] text-ink">Бронь по телефону</h2>
              <p className="mt-1 text-[12px] text-stone-500">Проверим пересечение по столу и буфер 15 минут.</p>
            </div>

            <form onSubmit={saveManual} className="space-y-3.5 px-6 py-5">
              {manualError && (
                <div className="flex items-start gap-2 border-l-2 border-rose-700 bg-rose-50 px-3 py-2 text-[12px] text-rose-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{manualError}</span>
                </div>
              )}

              <label className="block">
                <span className="mb-1.5 block text-[12px] text-stone-500">Стол</span>
                <select
                  value={manualTableNumber}
                  onChange={(e) => setManualTableNumber(e.target.value)}
                  className="w-full rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[13px] text-ink focus:border-stone-900 focus:outline-none"
                >
                  {allTables.map((t) => (
                    <option key={t.id} value={t.number}>
                      Стол {t.number} · {t.seats} мест · {zoneLabel(t.zoneId)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] text-stone-500">Начало</span>
                  <select
                    value={manualStartTime}
                    onChange={(e) => setManualStartTime(e.target.value)}
                    className="w-full rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[13px] tabular-nums text-ink focus:border-stone-900 focus:outline-none"
                  >
                    {timeSlots.slice(0, -2).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] text-stone-500">Длительность</span>
                  <select
                    value={manualDuration}
                    onChange={(e) => setManualDuration(Number(e.target.value))}
                    className="w-full rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[13px] text-ink focus:border-stone-900 focus:outline-none"
                  >
                    <option value={1}>1 час</option>
                    <option value={1.5}>1,5 часа</option>
                    <option value={2}>2 часа</option>
                    <option value={3}>3 часа</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-[12px] text-stone-500">Имя гостя</span>
                <input
                  type="text"
                  required
                  value={manualGuestName}
                  onChange={(e) => setManualGuestName(e.target.value)}
                  placeholder="Иван Петров"
                  className="w-full rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[13px] text-ink focus:border-stone-900 focus:outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] text-stone-500">Телефон</span>
                  <input
                    type="tel"
                    required
                    value={manualGuestPhone}
                    onChange={(e) => setManualGuestPhone(e.target.value)}
                    className="w-full rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[13px] tabular-nums text-ink focus:border-stone-900 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] text-stone-500">Гостей</span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={manualGuests}
                    onChange={(e) => setManualGuests(Number(e.target.value))}
                    className="w-full rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[13px] tabular-nums text-ink focus:border-stone-900 focus:outline-none"
                  />
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualOpen(false)}
                  className="flex-1 rounded-[2px] border border-stone-300 px-4 py-2.5 text-[13px] text-stone-700 transition-colors hover:bg-stone-100"
                >
                  Отмена
                </button>
                <button type="submit" className="flex-1 rounded-[2px] bg-stone-900 px-4 py-2.5 text-[13px] font-medium text-stone-50 transition-colors hover:bg-black">
                  Зафиксировать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
