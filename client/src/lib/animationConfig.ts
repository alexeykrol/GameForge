/**
 * Конфигурация анимаций для игры Match-3
 * Все временные параметры в миллисекундах
 */

// Базовые настройки анимации (модифицируются пользовательскими настройками)
const BASE_DISAPPEAR_DURATION = 1200;  // Базовая продолжительность исчезновения
const BASE_FALLING_DURATION = 1000;    // Базовая продолжительность падения

// Мультипликаторы скорости: преобразует шкалу 1-5 в коэффициенты скорости
const SPEED_MULTIPLIERS = {
  1: 2.5,   // Очень медленно
  2: 1.8,   // Медленно  
  3: 1.0,   // Нормально
  4: 0.6,   // Быстро
  5: 0.3    // Очень быстро
};

// Функция для получения текущей конфигурации анимации на основе настроек
export const getAnimationConfig = (disappearSpeed: number = 3, fallingSpeed: number = 3) => ({
  // Продолжительность в миллисекундах - короткие, четкие анимации как в референсе
  SWAP_DURATION: Math.round(200 / SPEED_MULTIPLIERS[disappearSpeed as keyof typeof SPEED_MULTIPLIERS]),
  DISAPPEAR_DURATION: Math.round(300 / SPEED_MULTIPLIERS[disappearSpeed as keyof typeof SPEED_MULTIPLIERS]),
  FALLING_DURATION: Math.round(200 / SPEED_MULTIPLIERS[fallingSpeed as keyof typeof SPEED_MULTIPLIERS]),
  
  // Скорость обновления анимации (прогресс за кадр)
  ANIMATION_SPEED: 0.025,
  
  // Частота обновления анимации в миллисекундах
  ANIMATION_FRAME_RATE: 16, // ~60 FPS
  
  // Эффекты анимации
  EFFECTS: {
    // Минимальная прозрачность при исчезновении
    MIN_DISAPPEAR_ALPHA: 0.1,
    
    // Минимальный размер при исчезновении  
    MIN_DISAPPEAR_SCALE: 0.1,
    
    // Эффект подпрыгивания при падении (0-1, где 0 = нет эффекта)
    BOUNCE_EFFECT: 0.1
  }
});

// Конфигурация по умолчанию для обратной совместимости
export const ANIMATION_CONFIG = getAnimationConfig();

/**
 * Вспомогательные функции для работы с анимацией
 */
export const AnimationHelpers = {
  // Получить прогресс анимации с учетом времени
  getProgressIncrement: () => ANIMATION_CONFIG.ANIMATION_SPEED,
  
  // Проверить, завершена ли анимация
  isAnimationComplete: (progress: number) => progress >= 1.0,
  
  // Применить эффект замедления к анимации
  easeOut: (progress: number) => 1 - Math.pow(1 - progress, 3),
  
  // Применить эффект ускорения к анимации
  easeIn: (progress: number) => Math.pow(progress, 3),
  
  // Применить плавный эффект (медленный старт и конец)
  easeInOut: (progress: number) => 
    progress < 0.5 
      ? 2 * Math.pow(progress, 3) 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2
};