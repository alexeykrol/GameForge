/**
 * Конфигурация анимаций для игры Match-3
 * Все временные параметры в миллисекундах
 */

export const ANIMATION_CONFIG = {
  // Скорость обновления анимации (прогресс за кадр)
  ANIMATION_SPEED: 0.025, // Увеличьте для более быстрой анимации, уменьшите для более медленной
  
  // Продолжительность анимации исчезновения совпавших камней
  DISAPPEAR_DURATION: 1000, // 1 секунда
  
  // Продолжительность анимации падения камней
  FALLING_DURATION: 800, // 0.8 секунды
  
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
};

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