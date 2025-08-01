import React from 'react';
import { useGame } from '../lib/stores/useGame';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useGame();

  if (!isOpen) return null;

  const handleDisappearSpeedChange = (value: number) => {
    updateSettings({ disappearSpeed: value });
  };

  const handleFallingSpeedChange = (value: number) => {
    updateSettings({ fallingSpeed: value });
  };

  const handleDifficultyChange = (value: number) => {
    updateSettings({ difficulty: value });
  };

  const getDifficultyText = (level: number) => {
    switch (level) {
      case 1: return 'Легкий - много простых ходов';
      case 2: return 'Средний - сбалансированная игра';
      case 3: return 'Сложный - мало вариантов';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Настройки</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Скорость исчезновения */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Скорость исчезновения: {settings.disappearSpeed}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={settings.disappearSpeed}
              onChange={(e) => handleDisappearSpeedChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Медленно</span>
              <span>Быстро</span>
            </div>
          </div>

          {/* Скорость замещения */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Скорость замещения: {settings.fallingSpeed}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={settings.fallingSpeed}
              onChange={(e) => handleFallingSpeedChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Медленно</span>
              <span>Быстро</span>
            </div>
          </div>

          {/* Уровень сложности */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Уровень сложности: {settings.difficulty}
            </label>
            <input
              type="range"
              min="1"
              max="3"
              step="1"
              value={settings.difficulty}
              onChange={(e) => handleDifficultyChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-gray-600 mt-2">
              {getDifficultyText(settings.difficulty)}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};