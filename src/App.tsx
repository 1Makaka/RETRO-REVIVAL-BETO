/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { createFranticGame } from './game';
import { soundEngine } from './game/audio';
import { Volume2, VolumeX, Shield, Swords, Gamepad2, Maximize2, Minimize2 } from 'lucide-react';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [musicOn, setMusicOn] = useState(soundEngine.isMusicOn());
  const [showHelp, setShowHelp] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    // Initialize the game
    gameRef.current = createFranticGame('game-container');

    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  const toggleSound = () => {
    const next = soundEngine.toggleMusic();
    setMusicOn(next);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#09100d] font-mono select-none">
      {/* Phaser Canvas Container */}
      <div id="game-container" ref={containerRef} className="w-full h-full absolute inset-0" />

      {/* Top Quick Utility Bar (Fullscreen button only) */}
      <div className="absolute top-2.5 right-3 z-40 flex items-center">
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#18201a]/90 hover:bg-[#253229] border border-[#38bdf8]/50 text-[#38bdf8] text-xs font-bold transition-colors cursor-pointer rounded-none shadow-md"
          title={isFullscreen ? 'Выйти из полноэкранного режима' : 'На весь экран'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{isFullscreen ? 'ОКНО' : 'НА ВЕСЬ ЭКРАН'}</span>
        </button>
      </div>

      {/* Controls Help Modal */}
      {showHelp && (
        <div
          className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-[#111827] border-4 border-[#38bdf8] p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#38bdf8]/30 mb-4">
              <div className="flex items-center gap-2 text-[#38bdf8] font-bold text-lg">
                <Swords className="w-5 h-5" />
                <span>КАК ИГРАТЬ В FRANTIC BATTLES</span>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-red-400 hover:text-red-300 font-bold text-lg px-2 cursor-pointer"
              >
                [X]
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="bg-[#1f2937] p-3 border border-slate-700">
                <p className="text-yellow-400 font-bold mb-1 flex items-center gap-1.5">
                  <Gamepad2 className="w-4 h-4" /> УПРАВЛЕНИЕ НА ПК:
                </p>
                <p>• Движение: <span className="text-white font-bold">W / A / S / D</span> или стрелки</p>
                <p>• Базовая Атака: <span className="text-white font-bold">ПРОБЕЛ (SPACE)</span></p>
                <p>• Навык 1: клавиша <span className="text-emerald-400 font-bold">J</span></p>
                <p>• Навык 2: клавиша <span className="text-sky-400 font-bold">K</span></p>
                <p>• УЛЬТИМЕЙТ: клавиша <span className="text-purple-400 font-bold">L</span></p>
              </div>

              <div className="bg-[#1f2937] p-3 border border-slate-700">
                <p className="text-green-400 font-bold mb-1 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> НА ТЕЛЕФОНЕ / ПЛАНШЕТЕ:
                </p>
                <p>• Виртуальный джойстик в левой нижней части экрана для бега</p>
                <p>• Большие экранные кнопки справа для Атаки и 3-х Навыков</p>
              </div>

              <div className="bg-[#1f2937] p-3 border border-slate-700 text-slate-400">
                <p className="text-white font-bold mb-1">ОБЪЕКТЫ В ХАБЕ:</p>
                <p>✦ <span className="text-[#38bdf8]">Алтарь Героев</span> (центр): Выбор и детальный просмотр бойцов (Zaza, Grim, Bjorn).</p>
                <p>⚔ <span className="text-red-400">Ворота Матчей</span> (сверху): Обычные и Рейтинговые бои.</p>
                <p>⚗ <span className="text-amber-400">Торговец</span> (справа): Покупка снаряжения.</p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-5 w-full py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-center border-2 border-[#86efac] cursor-pointer"
            >
              ПОНЯТНО, В БОЙ!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
