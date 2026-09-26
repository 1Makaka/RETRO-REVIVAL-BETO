/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { createFranticGame } from './game';
import { soundEngine } from './game/audio';
import { Volume2, VolumeX, Shield, Swords, Gamepad2, Maximize2, Minimize2 } from 'lucide-react';

function AvatarIcon({ id }: { id: string }) {
  if (id === 'avatar_sq_1') {
    return (
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="#0f172a" />
        <rect x="2" y="2" width="60" height="60" fill="none" stroke="#facc15" strokeWidth="2" />
        <rect x="16" y="14" width="32" height="38" fill="#1e293b" />
        <rect x="20" y="24" width="24" height="18" fill="#020617" />
        <rect x="24" y="28" width="6" height="5" fill="#ef4444" />
        <rect x="34" y="28" width="6" height="5" fill="#ef4444" />
        <rect x="26" y="29" width="2" height="2" fill="#ffffff" />
        <rect x="36" y="29" width="2" height="2" fill="#ffffff" />
      </svg>
    );
  }
  if (id === 'avatar_sq_2') {
    return (
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="#051f12" />
        <rect x="2" y="2" width="60" height="60" fill="none" stroke="#22c55e" strokeWidth="2" />
        <rect x="16" y="14" width="32" height="38" fill="#14532d" />
        <rect x="20" y="24" width="24" height="18" fill="#052e16" />
        <rect x="24" y="28" width="6" height="5" fill="#4ade80" />
        <rect x="34" y="28" width="6" height="5" fill="#4ade80" />
        <circle cx="32" cy="12" r="4" fill="#84cc16" />
      </svg>
    );
  }
  if (id === 'avatar_sq_3') {
    return (
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="#1c0a0a" />
        <rect x="2" y="2" width="60" height="60" fill="none" stroke="#f97316" strokeWidth="2" />
        <rect x="10" y="10" width="6" height="16" fill="#fde047" />
        <rect x="48" y="10" width="6" height="16" fill="#fde047" />
        <rect x="16" y="14" width="32" height="38" fill="#7f1d1d" />
        <rect x="20" y="24" width="24" height="18" fill="#450a0a" />
        <rect x="24" y="28" width="6" height="5" fill="#facc15" />
        <rect x="34" y="28" width="6" height="5" fill="#facc15" />
      </svg>
    );
  }
  if (id === 'avatar_sq_4') {
    return (
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="#081726" />
        <rect x="2" y="2" width="60" height="60" fill="none" stroke="#38bdf8" strokeWidth="2" />
        <rect x="16" y="14" width="32" height="38" fill="#1e3a8a" />
        <rect x="18" y="20" width="28" height="5" fill="#94a3b8" />
        <rect x="20" y="26" width="24" height="16" fill="#172554" />
        <rect x="24" y="28" width="6" height="5" fill="#38bdf8" />
        <rect x="34" y="28" width="6" height="5" fill="#38bdf8" />
      </svg>
    );
  }
  if (id === 'avatar_sq_5') {
    return (
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="#1c051d" />
        <rect x="2" y="2" width="60" height="60" fill="none" stroke="#c084fc" strokeWidth="2" />
        <polygon points="16,18 24,8 32,16 40,8 48,18" fill="#facc15" />
        <rect x="16" y="18" width="32" height="36" fill="#581c87" />
        <rect x="20" y="26" width="24" height="16" fill="#3b0764" />
        <rect x="24" y="28" width="6" height="5" fill="#f43f5e" />
        <rect x="34" y="28" width="6" height="5" fill="#f43f5e" />
      </svg>
    );
  }
  if (id === 'avatar_sq_6') {
    return (
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="#0e1e12" />
        <rect x="2" y="2" width="60" height="60" fill="none" stroke="#a3e635" strokeWidth="2" />
        <rect x="16" y="14" width="32" height="38" fill="#365314" />
        <rect x="20" y="24" width="24" height="18" fill="#1a2e05" />
        <rect x="24" y="28" width="6" height="5" fill="#bef264" />
        <rect x="34" y="28" width="6" height="5" fill="#bef264" />
      </svg>
    );
  }
  if (id === 'avatar_sq_7') {
    return (
      <svg className="w-full h-full" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="#180e0e" />
        <rect x="2" y="2" width="60" height="60" fill="none" stroke="#e11d48" strokeWidth="2" />
        <rect x="12" y="8" width="6" height="16" fill="#e11d48" />
        <rect x="46" y="8" width="6" height="16" fill="#e11d48" />
        <rect x="16" y="14" width="32" height="38" fill="#881337" />
        <rect x="20" y="24" width="24" height="18" fill="#4c0519" />
        <rect x="24" y="28" width="6" height="5" fill="#fbbf24" />
        <rect x="34" y="28" width="6" height="5" fill="#fbbf24" />
      </svg>
    );
  }
  return (
    <svg className="w-full h-full" viewBox="0 0 64 64">
      <rect width="64" height="64" fill="#1e1b4b" />
      <rect x="2" y="2" width="60" height="60" fill="none" stroke="#c084fc" strokeWidth="2" />
      <polygon points="16,20 24,8 32,18 40,8 48,20" fill="#e879f9" />
      <rect x="14" y="20" width="36" height="38" fill="#0f051d" />
      <rect x="8" y="32" width="6" height="14" fill="#a855f7" />
      <rect x="50" y="32" width="6" height="14" fill="#a855f7" />
      <rect x="22" y="28" width="6" height="4" fill="#fae8ff" />
      <rect x="36" y="28" width="6" height="4" fill="#fae8ff" />
      <rect x="18" y="52" width="4" height="4" fill="#facc15" />
      <rect x="24" y="52" width="4" height="4" fill="#facc15" />
      <rect x="30" y="52" width="4" height="4" fill="#facc15" />
      <rect x="36" y="52" width="4" height="4" fill="#facc15" />
      <rect x="42" y="52" width="4" height="4" fill="#facc15" />
    </svg>
  );
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Profile Modal State with Editable Fields
  const [showProfile, setShowProfile] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_sq_1');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [bio, setBio] = useState('');

  const squareAvatars = [
    { id: 'avatar_sq_1', label: 'Гром', color: 'bg-slate-800 border-yellow-400' },
    { id: 'avatar_sq_2', label: 'Заза', color: 'bg-emerald-900 border-emerald-400' },
    { id: 'avatar_sq_3', label: 'Бьёрн', color: 'bg-red-950 border-orange-500' },
    { id: 'avatar_sq_4', label: 'Рыцарь', color: 'bg-blue-950 border-sky-400' },
    { id: 'avatar_sq_5', label: 'Маг', color: 'bg-purple-950 border-purple-400' },
    { id: 'avatar_sq_6', label: 'Следопыт', color: 'bg-lime-950 border-lime-400' },
    { id: 'avatar_sq_7', label: 'Проклятый', color: 'bg-rose-950 border-rose-500' },
    { id: 'avatar_sq_8', label: 'Властелин', color: 'bg-fuchsia-950 border-fuchsia-400' }
  ];

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    // Initialize the game
    gameRef.current = createFranticGame('game-container');

    const onOpenProfile = () => {
      setSelectedAvatar(localStorage.getItem('adv_avatar') || 'avatar_sq_1');
      setFirstName(localStorage.getItem('adv_firstname') || 'Элрик');
      setLastName(localStorage.getItem('adv_lastname') || 'Тенеход (Гром)');
      setDob(localStorage.getItem('adv_dob') || '14.05.1242 г.');
      setBio(localStorage.getItem('adv_bio') || 'Ветеран S-класса. Победитель 100 Боссов Подземелья.');
      setShowProfile(true);
    };

    gameRef.current.events.on('open-profile-modal', onOpenProfile);

    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      if (gameRef.current) {
        gameRef.current.events.off('open-profile-modal', onOpenProfile);
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  const handleSaveProfile = () => {
    localStorage.setItem('adv_avatar', selectedAvatar);
    localStorage.setItem('adv_firstname', firstName);
    localStorage.setItem('adv_lastname', lastName);
    localStorage.setItem('adv_dob', dob);
    localStorage.setItem('adv_bio', bio);
    setShowProfile(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05070a] font-mono select-none">
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

      {/* FULL EDITABLE PROFILE MODAL */}
      {showProfile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#0f172a] border-2 border-[#38bdf8] p-5 max-w-lg w-full shadow-2xl rounded-none text-white max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#38bdf8]/40 mb-4">
              <span className="text-[#facc15] font-bold text-sm tracking-wide">✦ ПРОФИЛЬ АВАНТЮРИСТА ✦</span>
              <button
                onClick={() => setShowProfile(false)}
                className="text-red-400 hover:text-red-300 font-bold text-sm px-2 cursor-pointer"
              >
                [X]
              </button>
            </div>

            {/* Top Row: Avatar on Left + Change Button Below, Fields on Right */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* Left Column: Avatar & Change Button Below */}
              <div className="flex flex-col items-center justify-start space-y-2">
                <div className="w-24 h-24 bg-[#020617] border-4 border-[#facc15] shadow-lg flex items-center justify-center relative overflow-hidden group">
                  <AvatarIcon id={selectedAvatar} />
                  <div className="absolute bottom-0 inset-x-0 bg-black/70 text-center py-0.5 text-[9px] text-amber-300 font-bold">
                    {squareAvatars.find(a => a.id === selectedAvatar)?.label}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="w-full py-1.5 px-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-[11px] border border-[#86efac] transition-colors cursor-pointer text-center"
                >
                  [ 📷 ИЗМЕНИТЬ ]
                </button>
              </div>

              {/* Right Column: Name, Surname & DOB Fields */}
              <div className="sm:col-span-2 space-y-2 text-xs">
                {/* Имя */}
                <div>
                  <label className="block font-bold text-[#4ade80] mb-0.5">ИМЯ:</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Введите имя..."
                    className="w-full px-2.5 py-1.5 bg-[#1e293b] border border-slate-600 text-white font-mono focus:border-[#4ade80] focus:outline-none"
                  />
                </div>

                {/* Фамилия */}
                <div>
                  <label className="block font-bold text-[#38bdf8] mb-0.5">ФАМИЛИЯ / ТИТУЛ:</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Введите фамилию..."
                    className="w-full px-2.5 py-1.5 bg-[#1e293b] border border-slate-600 text-white font-mono focus:border-[#38bdf8] focus:outline-none"
                  />
                </div>

                {/* Дата Рождения */}
                <div>
                  <label className="block font-bold text-[#fef08a] mb-0.5">ДАТА РОЖДЕНИЯ:</label>
                  <input
                    type="text"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="14.05.1242 г."
                    className="w-full px-2.5 py-1.5 bg-[#1e293b] border border-slate-600 text-white font-mono focus:border-[#fef08a] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Expandable Avatar Selection Grid when Change Button Clicked */}
            {showAvatarPicker && (
              <div className="mb-4 p-3 bg-[#020617] border-2 border-amber-500/80 animate-in fade-in duration-200">
                <p className="text-xs font-bold text-[#facc15] mb-2 text-center">ВЫБЕРИТЕ КВАДРАТНУЮ АВАТАРКУ:</p>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {squareAvatars.map((av, idx) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatar(av.id);
                        setShowAvatarPicker(false);
                      }}
                      className={`flex flex-col items-center p-1.5 border-2 transition-all cursor-pointer ${
                        selectedAvatar === av.id
                          ? 'border-[#4ade80] bg-[#1e293b] scale-105 shadow-lg'
                          : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                      }`}
                    >
                      <div className="w-10 h-10 bg-slate-900 border border-amber-500 overflow-hidden flex items-center justify-center">
                        <AvatarIcon id={av.id} />
                      </div>
                      <span className="text-[9px] text-slate-300 mt-1 font-bold">{av.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description Field Below */}
            <div className="text-xs">
              <label className="block font-bold text-slate-300 mb-1">ОПИСАНИЕ И ЛОР ГЕРОЯ:</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Напишите историю, достижения или характер вашего бойца..."
                rows={3}
                className="w-full px-3 py-2 bg-[#1e293b] border border-slate-600 text-white font-mono focus:border-[#38bdf8] focus:outline-none resize-none"
              />
            </div>

            {/* Save Button */}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowProfile(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                ОТМЕНА
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-5 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs border border-[#86efac] cursor-pointer"
              >
                💾 СОХРАНИТЬ ПРОФИЛЬ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
