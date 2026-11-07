import React, { useState } from 'react';
import { ConstructorView } from './modules/constructor/ConstructorView';
import { BookingView } from './modules/booking/BookingView';
import { ManagerView } from './modules/manager/ManagerView';

type Tab = 'booking' | 'manager' | 'constructor';

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'booking', label: 'Бронирование', hint: 'гостю' },
  { id: 'manager', label: 'Журнал зала', hint: 'менеджеру' },
  { id: 'constructor', label: 'Схема зала', hint: 'конструктору' },
];

const Mark: React.FC = () => (
  <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true" className="flex-none text-amber-600">
    <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="1.1" />
    <path d="M10.5 20.5c3-.4 4.8-2.4 5.5-7 0.9 4.7 2.7 6.6 5.5 7" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('booking');
  const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-stone-900 focus:px-3 focus:py-2 focus:text-sm focus:text-stone-50"
      >
        Перейти к содержимому
      </a>

      <header className="bg-stone-50 border-b border-stone-200" role="banner">
        <div className="mx-auto flex max-w-wrap flex-wrap items-center gap-x-10 gap-y-4 px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Mark />
            <div>
              <div className="font-serif text-[20px] leading-none tracking-[0.01em] text-ink">Maison Lumière</div>
              <div className="mt-1.5 text-[12px] leading-none text-stone-500">
                ресторан на Патриарших · Малая Бронная, 4
              </div>
            </div>
          </div>

          <nav role="tablist" aria-label="Разделы системы" className="order-3 flex w-full flex-wrap items-center gap-x-6 gap-y-2 lg:order-none lg:ml-6 lg:w-auto">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-controls={`panel-${tab.id}`}
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative -mb-px border-b-2 pb-2 pt-1 text-[13.5px] transition-colors duration-150 ${
                    active
                      ? 'border-amber-600 text-ink font-medium'
                      : 'border-transparent text-stone-500 hover:text-ink'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 hidden text-[12px] text-stone-400 sm:inline">{tab.hint}</span>
                </button>
              );
            })}
          </nav>

          <div className="ml-auto hidden items-center gap-6 text-[12px] text-stone-500 md:flex">
            <span className="tabular-nums">Сегодня, {today}</span>
            <span className="h-3 w-px bg-stone-300" aria-hidden="true" />
            <span className="tabular-nums">12:00 — 23:00</span>
            <span className="h-3 w-px bg-stone-300" aria-hidden="true" />
            <a href="tel:+74994441017" className="border-b border-stone-300 pb-0.5 text-ink hover:border-amber-600">
              +7 499 444-10-17
            </a>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-wrap flex-1 px-6 py-7 lg:px-8 lg:py-9" role="main">
        <div role="tabpanel" id="panel-booking" aria-labelledby="tab-booking" hidden={activeTab !== 'booking'}>
          {activeTab === 'booking' && <BookingView />}
        </div>
        <div role="tabpanel" id="panel-manager" aria-labelledby="tab-manager" hidden={activeTab !== 'manager'}>
          {activeTab === 'manager' && <ManagerView />}
        </div>
        <div role="tabpanel" id="panel-constructor" aria-labelledby="tab-constructor" hidden={activeTab !== 'constructor'}>
          {activeTab === 'constructor' && <ConstructorView />}
        </div>
      </main>

      <footer className="border-t border-stone-200" role="contentinfo">
        <div className="mx-auto flex max-w-wrap flex-col gap-2 px-6 py-6 text-[12px] text-stone-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>© 2026 Maison Lumière · управление залом и бронированием</span>
          <span className="text-stone-400">Проектная деятельность · PostgreSQL · Prisma · React</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
