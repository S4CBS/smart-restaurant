import React, { useEffect, useMemo, useState } from 'react';
import { MockFloor, MockTable, INITIAL_FLOORS, INITIAL_RESERVATIONS, MockReservation } from '../../mockData';
import { FloorPlanSVG } from '../../components/FloorPlanSVG';
import { Calendar, Clock, MapPin, Timer, Users } from 'lucide-react';

const TIME_SLOTS = [
  { value: '12:00', label: '12:00 — ланч' },
  { value: '14:00', label: '14:00 — дневное меню' },
  { value: '17:00', label: '17:00 — аперитив' },
  { value: '18:00', label: '18:00 — ранний ужин' },
  { value: '19:00', label: '19:00 — вечерний сет' },
  { value: '20:00', label: '20:00 — ужин' },
  { value: '21:00', label: '21:00 — поздний ужин' },
];

const OCCASIONS = [
  { id: 'none', label: 'Ужин' },
  { id: 'birthday', label: 'День рождения' },
  { id: 'date', label: 'Свидание' },
  { id: 'business', label: 'Переговоры' },
  { id: 'anniversary', label: 'Годовщина' },
];

export const BookingView: React.FC = () => {
  const [floors] = useState<MockFloor[]>(INITIAL_FLOORS);
  const [activeFloorId, setActiveFloorId] = useState('floor-1');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const [selectedDate, setSelectedDate] = useState('2026-11-07');
  const [selectedTime, setSelectedTime] = useState('19:00');
  const [guestsCount, setGuestsCount] = useState(2);

  const [selectedTable, setSelectedTable] = useState<MockTable | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [softLockSeconds, setSoftLockSeconds] = useState(300);
  const [guestName, setGuestName] = useState('Алексей Панов');
  const [guestPhone, setGuestPhone] = useState('+7 (905) 555-12-34');
  const [guestEmail, setGuestEmail] = useState('panov@maison-lumiere.ru');
  const [occasion, setOccasion] = useState('birthday');
  const [specialRequests, setSpecialRequests] = useState('Столик у окна, подать дижестив к десерту');
  const [confirmed, setConfirmed] = useState<MockReservation | null>(null);

  const currentFloor = floors.find((f) => f.id === activeFloorId) || floors[0];

  const availabilityMap = useMemo(() => {
    const map: Record<string, 'available' | 'optimal' | 'occupied' | 'not_suitable'> = {};
    for (const table of currentFloor.zones.flatMap((z) => z.tables)) {
      if (!table.isReservable || table.seats < guestsCount) {
        map[table.id] = 'not_suitable';
        continue;
      }
      const occupied = INITIAL_RESERVATIONS.some(
        (r) => r.tableId === table.id && r.status !== 'cancelled' && selectedTime >= r.startTime && selectedTime < r.endTime
      );
      if (occupied) map[table.id] = 'occupied';
      else if (table.seats === guestsCount || table.seats === guestsCount + 1) map[table.id] = 'optimal';
      else map[table.id] = 'available';
    }
    return map;
  }, [currentFloor, selectedTime, guestsCount]);

  const tables = currentFloor.zones.flatMap((z) => z.tables);
  const freeNow = tables.filter((t) => availabilityMap[t.id] === 'optimal' || availabilityMap[t.id] === 'available').length;
  const zoneName = (table: MockTable) => {
    const zone = currentFloor.zones.find((z) => z.id === table.zoneId);
    return zone ? zone.name : '—';
  };

  useEffect(() => {
    if (!isModalOpen || confirmed) return;
    if (softLockSeconds <= 0) return;
    const id = window.setInterval(() => setSoftLockSeconds((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [isModalOpen, confirmed, softLockSeconds]);

  const openBooking = () => {
    if (!selectedTable) return;
    setSoftLockSeconds(300);
    setConfirmed(null);
    setIsModalOpen(true);
  };

  const confirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;
    setConfirmed({
      id: `ML-${Math.floor(1000 + Math.random() * 9000)}`,
      tableId: selectedTable.id,
      tableNumber: selectedTable.number,
      guestName,
      guestPhone,
      guestEmail,
      startTime: selectedTime,
      endTime: '21:00',
      guestsCount,
      status: 'confirmed',
      occasion: occasion as MockReservation['occasion'],
      specialRequests,
    });
  };

  const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  const shapeLabel = (t: MockTable) =>
    t.shape === 'round' ? 'круглый' : t.shape === 'oval' ? 'овальный' : t.shape === 'square' ? 'квадратный' : 'прямоугольный';

  return (
    <section aria-labelledby="booking-heading" className="space-y-8">
      <header className="flex flex-col gap-5 border-b border-stone-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 id="booking-heading" className="text-[28px] leading-tight text-ink sm:text-[32px]">
            Бронирование стола
          </h1>
          <p className="mt-2 max-w-[54ch] text-[13.5px] leading-relaxed text-stone-600">
            Выберите дату и время, затем стол на схеме зала. Место удерживается за вами пять минут — пока вы заполняете данные.
          </p>
        </div>
        <dl className="flex shrink-0 gap-8 text-[12px]">
          <div>
            <dt className="text-stone-500">Свободно сейчас</dt>
            <dd className="mt-1 font-serif text-[22px] leading-none tabular-nums text-ink">{freeNow}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Слот</dt>
            <dd className="mt-1 font-serif text-[22px] leading-none tabular-nums text-ink">2 часа</dd>
          </div>
          <div>
            <dt className="text-stone-500">Буфер</dt>
            <dd className="mt-1 font-serif text-[22px] leading-none tabular-nums text-ink">15 мин</dd>
          </div>
        </dl>
      </header>

      {/* Параметры визита */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 border-b border-stone-200 pb-6 sm:grid-cols-2 lg:grid-cols-[1fr_1.1fr_1fr_1.2fr]">
        <label className="block">
          <span className="mb-2 flex items-center gap-1.5 text-[12px] text-stone-500">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> Дата визита
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-[2px] border border-stone-300 bg-stone-50 px-3 py-2 text-[13.5px] tabular-nums text-ink transition-colors hover:border-stone-400 focus:border-stone-900 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-2 flex items-center gap-1.5 text-[12px] text-stone-500">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Начало визита
          </span>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full rounded-[2px] border border-stone-300 bg-stone-50 px-3 py-2 text-[13.5px] text-ink transition-colors hover:border-stone-400 focus:border-stone-900 focus:outline-none"
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="mb-2 flex items-center gap-1.5 text-[12px] text-stone-500">
            <Users className="h-3.5 w-3.5" aria-hidden="true" /> Гостей
          </span>
          <div className="flex overflow-hidden rounded-[2px] border border-stone-300 bg-stone-50" role="group" aria-label="Число гостей">
            {[1, 2, 3, 4, 6, 8].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setGuestsCount(n)}
                aria-pressed={guestsCount === n}
                className={`flex-1 border-r border-stone-200 py-2 text-[12.5px] tabular-nums transition-colors last:border-r-0 ${
                  guestsCount === n ? 'bg-stone-900 text-stone-50' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-[12px] text-stone-500">Зал и вид</span>
          <div className="flex gap-2">
            <select
              aria-label="Зал ресторана"
              value={activeFloorId}
              onChange={(e) => {
                setActiveFloorId(e.target.value);
                setSelectedTable(null);
              }}
              className="min-w-0 flex-1 rounded-[2px] border border-stone-300 bg-stone-50 px-3 py-2 text-[13.5px] text-ink transition-colors hover:border-stone-400 focus:border-stone-900 focus:outline-none"
            >
              {floors.map((fl) => (
                <option key={fl.id} value={fl.id}>
                  {fl.name}
                </option>
              ))}
            </select>
            <div className="flex overflow-hidden rounded-[2px] border border-stone-300" role="group" aria-label="Вид">
              {(['map', 'list'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setViewMode(m)}
                  aria-pressed={viewMode === m}
                  className={`px-3 py-2 text-[12.5px] transition-colors ${
                    viewMode === m ? 'bg-stone-900 text-stone-50' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {m === 'map' ? 'План' : 'Список'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* План или список */}
        <div>
          {viewMode === 'map' ? (
            <div>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-[16px] text-ink">{currentFloor.name}</h2>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-stone-600">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-[1px] border-2" style={{ background: '#8C5A33', borderColor: '#2E5A45' }} /> подходит
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-[1px] border" style={{ background: '#8C5A33', borderColor: '#3A2E24' }} /> свободен
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-[1px] border-2" style={{ background: '#C9A79D', borderColor: '#8C3B35' }} /> занят
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-[1px] border border-dashed" style={{ background: '#D9CFC0', borderColor: '#8C8069' }} /> не подходит
                  </span>
                </div>
              </div>
              <FloorPlanSVG
                floor={currentFloor}
                selectedTableId={selectedTable?.id}
                mode="booking"
                availabilityMap={availabilityMap}
                onTableClick={(t) => setSelectedTable(t)}
              />
              <p className="mt-3 text-[12px] text-stone-500">
                Столы с зелёной обводкой свободны на выбранное время и вмещают вашу компанию; заштрихованные — заняты.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="mb-3 text-[16px] text-ink">Столы на {selectedTime}</h2>
              <div className="divide-y divide-stone-200 border-y border-stone-200">
                {tables.map((table) => {
                  const status = availabilityMap[table.id];
                  const free = status === 'optimal' || status === 'available';
                  return (
                    <button
                      key={table.id}
                      type="button"
                      disabled={!free}
                      onClick={() => setSelectedTable(table)}
                      className={`flex w-full items-center gap-4 py-3.5 text-left transition-colors ${
                        free ? 'hover:bg-stone-100' : 'cursor-not-allowed opacity-45'
                      } ${selectedTable?.id === table.id ? 'bg-stone-100' : ''}`}
                    >
                      <span className="w-10 font-serif text-[17px] tabular-nums text-ink">{table.number}</span>
                      <span className="flex-1 text-[12.5px] text-stone-600">
                        {zoneName(table)} · {table.seats} мест · {shapeLabel(table)}
                      </span>
                      <span className={`text-[12px] ${free ? 'text-emerald-800' : 'text-stone-500'}`}>
                        {status === 'occupied' ? 'занят' : status === 'not_suitable' ? 'не подходит' : status === 'optimal' ? 'подходит' : 'свободен'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Сводка визита */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-stone-200 bg-stone-50 p-5">
            <h2 className="text-[16px] text-ink">Ваш визит</h2>
            <dl className="mt-4 space-y-2.5 text-[12.5px]">
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Дата</dt>
                <dd className="tabular-nums text-ink">{selectedDate}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Начало</dt>
                <dd className="tabular-nums text-ink">{selectedTime}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Гостей</dt>
                <dd className="tabular-nums text-ink">{guestsCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-stone-500">Зал</dt>
                <dd className="text-right text-ink">{currentFloor.name}</dd>
              </div>
            </dl>

            <div className="my-5 border-t border-stone-200" />

            {selectedTable ? (
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-serif text-[26px] leading-none text-ink">Стол {selectedTable.number}</span>
                  <span className="text-[12px] text-emerald-800">свободен</span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[12px] text-stone-500">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {zoneName(selectedTable)}
                </p>
                <dl className="mt-4 space-y-2 text-[12.5px]">
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Мест</dt>
                    <dd className="text-ink">{selectedTable.seats}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Форма</dt>
                    <dd className="text-ink">{shapeLabel(selectedTable)}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={openBooking}
                  className="mt-6 w-full rounded-[2px] bg-stone-900 px-4 py-3 text-[13px] font-medium text-stone-50 transition-colors hover:bg-black"
                >
                  Забронировать стол {selectedTable.number}
                </button>
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-[12.5px] leading-relaxed text-stone-500">
                  Отметьте стол на схеме — здесь появятся его детали и кнопка бронирования.
                </p>
              </div>
            )}
          </div>

          <p className="mt-4 text-[12px] leading-relaxed text-stone-500">
            Отмена — не позднее чем за час до визита. При опоздании более 20 минут стол освобождается.
          </p>
        </aside>
      </div>

      {/* Оформление */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="booking-dialog-title">
          <div className="max-h-[92vh] w-full max-w-[520px] overflow-auto rounded-[3px] border border-stone-300 bg-stone-50">
            {!confirmed ? (
              <form onSubmit={confirmBooking}>
                <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-6 py-5">
                  <div>
                    <h2 id="booking-dialog-title" className="text-[22px] text-ink">
                      Стол {selectedTable?.number}
                    </h2>
                    <p className="mt-1 text-[12px] text-stone-500">
                      {selectedDate} · {selectedTime} · {guestsCount} гостя · {selectedTable && zoneName(selectedTable)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 border border-stone-300 px-2.5 py-1.5 text-[12px] tabular-nums text-stone-700">
                    <Timer className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                    {clock(Math.max(0, softLockSeconds))}
                  </div>
                </div>

                <div className="space-y-4 px-6 py-5">
                  <p className="text-[12px] leading-relaxed text-stone-600">
                    Стол удерживается за вами, пока вы заполняете форму. Данные нужны хостес, чтобы подтвердить визит.
                  </p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-[12px] text-stone-500">Имя и фамилия</span>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[13px] text-ink focus:border-stone-900 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[12px] text-stone-500">Телефон</span>
                      <input
                        type="tel"
                        required
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[13px] tabular-nums text-ink focus:border-stone-900 focus:outline-none"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-[12px] text-stone-500">Почта для подтверждения</span>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[13px] text-ink focus:border-stone-900 focus:outline-none"
                    />
                  </label>

                  <div>
                    <span className="mb-2 block text-[12px] text-stone-500">Повод</span>
                    <div className="flex flex-wrap gap-1.5">
                      {OCCASIONS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setOccasion(item.id)}
                          aria-pressed={occasion === item.id}
                          className={`rounded-[2px] border px-3 py-1.5 text-[12px] transition-colors ${
                            occasion === item.id
                              ? 'border-stone-900 bg-stone-900 text-stone-50'
                              : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-[12px] text-stone-500">Пожелания</span>
                    <textarea
                      rows={2}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Тихий стол, детский стульчик, аллергия на орехи"
                      className="w-full resize-none rounded-[2px] border border-stone-300 bg-white px-3 py-2 text-[12.5px] text-ink focus:border-stone-900 focus:outline-none"
                    />
                  </label>
                </div>

                <div className="flex gap-2 border-t border-stone-200 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-[2px] border border-stone-300 px-4 py-2.5 text-[13px] text-stone-700 transition-colors hover:bg-stone-100"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-[2px] bg-stone-900 px-4 py-2.5 text-[13px] font-medium text-stone-50 transition-colors hover:bg-black"
                  >
                    Подтвердить бронь
                  </button>
                </div>
              </form>
            ) : (
              <div className="px-6 py-7">
                <div className="border-b border-dashed border-stone-300 pb-5">
                  <div className="text-[12px] text-amber-800">Бронь подтверждена</div>
                  <h2 id="booking-dialog-title" className="mt-2 text-[24px] leading-tight text-ink">
                    Ждём вас за столом {confirmed.tableNumber}
                  </h2>
                  <p className="mt-1.5 text-[12px] text-stone-500">
                    Подтверждение отправлено на {confirmed.guestEmail}.
                  </p>
                </div>

                <dl className="divide-y divide-stone-200 text-[12.5px]">
                  {[
                    ['Гость', confirmed.guestName],
                    ['Дата и время', `${selectedDate}, ${confirmed.startTime} — 21:00`],
                    ['Гостей', String(confirmed.guestsCount)],
                    ['Номер брони', confirmed.id],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 py-2.5">
                      <dt className="text-stone-500">{k}</dt>
                      <dd className="text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-4 text-[12px] text-stone-500">
                  Покажите номер брони хостес. Стол держим 20 минут после начала визита.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedTable(null);
                  }}
                  className="mt-5 w-full rounded-[2px] bg-stone-900 px-4 py-2.5 text-[13px] font-medium text-stone-50 transition-colors hover:bg-black"
                >
                  Вернуться к залам
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
