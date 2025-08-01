import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type GamePhase = "ready" | "playing" | "ended";

interface GameSettings {
  disappearSpeed: number; // 1-5 scale
  fallingSpeed: number;   // 1-5 scale  
  difficulty: number;     // 1-3 scale
}

interface GameState {
  phase: GamePhase;
  settings: GameSettings;
  
  // Actions
  start: () => void;
  restart: () => void;
  end: () => void;
  updateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const useGame = create<GameState>()(
  subscribeWithSelector((set) => ({
    phase: "ready",
    settings: {
      disappearSpeed: 3, // Default medium speed
      fallingSpeed: 3,   // Default medium speed
      difficulty: 2      // Default medium difficulty
    },
    
    start: () => {
      set((state) => {
        // Only transition from ready to playing
        if (state.phase === "ready") {
          return { phase: "playing" };
        }
        return {};
      });
    },
    
    restart: () => {
      set(() => ({ phase: "ready" }));
    },
    
    end: () => {
      set((state) => {
        // Only transition from playing to ended
        if (state.phase === "playing") {
          return { phase: "ended" };
        }
        return {};
      });
    },
    
    updateSettings: (newSettings) => {
      set((state) => ({
        settings: { ...state.settings, ...newSettings }
      }));
    }
  }))
);
