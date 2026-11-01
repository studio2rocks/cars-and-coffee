import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CarsAndCoffeeDaily } from './components/CarsAndCoffeeDaily';
import { CarsAndCoffeeLeaderboard } from './components/CarsAndCoffeeLeaderboard';
import { LiveGlobalFeed } from './components/LiveGlobalFeed';
import { ScoringRules } from './components/ScoringRules';
import { CarsAndCoffeeModal } from './components/CarsAndCoffeeModal';
import { MyGarage, GarageCar } from './components/MyGarage';
import { CarsAndCoffeeEntry } from './types/coffee';
import { INITIAL_CARS_AND_COFFEE_ENTRIES } from './data/worldwideDatabase';
import { Check, RotateCcw, Car } from 'lucide-react';

const STORAGE_KEY = 'cars_and_coffee_paddock_ledger_v2';

export default function App() {
  const [entries, setEntries] = useState<CarsAndCoffeeEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load Cars & Coffee entries from localStorage', e);
    }
    return INITIAL_CARS_AND_COFFEE_ENTRIES;
  });

  const [activeView, setActiveView] = useState<'daily' | 'garage' | 'leaderboard' | 'feed' | 'rules'>('daily');
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<CarsAndCoffeeEntry | null>(null);
  const [prefillCar, setPrefillCar] = useState<GarageCar | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.error('Failed to save Cars & Coffee entries', e);
    }
  }, [entries]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Compute daily totals for header
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter((e) => e.dateTime.startsWith(todayStr));
  const todayMeetsCount = todayEntries.length;
  const todayCupsCount = todayEntries.reduce((sum, e) => sum + e.coffeeCupsCount, 0);
  const todayTotalPoints = todayEntries.reduce((sum, e) => sum + e.points.totalPoints, 0);

  const handleSaveEntry = (entry: CarsAndCoffeeEntry) => {
    setEntries((prev) => {
      const exists = prev.some((e) => e.id === entry.id);
      if (exists) {
        return prev.map((e) => (e.id === entry.id ? entry : e));
      } else {
        return [entry, ...prev];
      }
    });

    setEditingEntry(null);
    triggerToast(
      `✓ Logged ${entry.carYear} ${entry.carMake} ${entry.carModel} with ${entry.coffeeCupsCount} ${
        entry.coffeeCupsCount === 1 ? 'cup' : 'cups'
      } (+${entry.points.totalPoints} pts)`
    );
  };

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    triggerToast('Cars & Coffee run removed from ledger');
  };

  const handleEditEntry = (entry: CarsAndCoffeeEntry) => {
    setEditingEntry(entry);
    setIsLogModalOpen(true);
  };

  const handleResetData = () => {
    if (window.confirm('Reset paddock ledger to default Cars & Coffee demonstration runs?')) {
      setEntries(INITIAL_CARS_AND_COFFEE_ENTRIES);
      triggerToast('Paddock ledger reset to default demonstration entries');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors">
      {/* Top Bar Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenLogModal={() => {
          setEditingEntry(null);
          setPrefillCar(null);
          setIsLogModalOpen(true);
        }}
        todayMeetsCount={todayMeetsCount}
        todayCupsCount={todayCupsCount}
        todayTotalPoints={todayTotalPoints}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeView === 'daily' && (
          <CarsAndCoffeeDaily
            entries={entries}
            onOpenLogModal={() => {
              setEditingEntry(null);
              setPrefillCar(null);
              setIsLogModalOpen(true);
            }}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
            onNavigateToLeaderboard={() => setActiveView('leaderboard')}
          />
        )}

        {activeView === 'garage' && (
          <MyGarage
            onSelectCarForMeet={(car) => {
              setPrefillCar(car);
              setEditingEntry(null);
              setIsLogModalOpen(true);
            }}
          />
        )}

        {activeView === 'leaderboard' && (
          <CarsAndCoffeeLeaderboard
            entries={entries}
            onOpenLogModal={() => {
              setEditingEntry(null);
              setPrefillCar(null);
              setIsLogModalOpen(true);
            }}
          />
        )}

        {activeView === 'feed' && <LiveGlobalFeed />}

        {activeView === 'rules' && <ScoringRules />}
      </main>

      {/* Cars & Coffee Log Modal */}
      <CarsAndCoffeeModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setEditingEntry(null);
          setPrefillCar(null);
        }}
        onSave={handleSaveEntry}
        initialEntry={editingEntry}
        prefillCar={prefillCar}
      />

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 px-4 py-3 rounded-2xl shadow-2xl border border-stone-700 dark:border-stone-200 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer with Copyright */}
      <footer className="border-t border-stone-200 dark:border-stone-800/80 bg-white dark:bg-stone-900/50 py-8 text-xs text-stone-500 dark:text-stone-400 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-stone-900 dark:text-stone-100">
                Cars & Coffee
              </span>
              <span aria-hidden="true">·</span>
              <span>Worldwide Paddock & Coffee Tracker</span>
            </div>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span>© 2026 Cars & Coffee. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveView('rules')}
              className="hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
            >
              Scoring Formula
            </button>
            <button
              onClick={() => setActiveView('leaderboard')}
              className="hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
            >
              Paddock Rankings
            </button>
            <button
              onClick={handleResetData}
              className="hover:text-stone-900 dark:hover:text-stone-200 transition-colors flex items-center gap-1"
              title="Reset paddock to default demo entries"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Runs</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
