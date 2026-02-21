import { create } from 'zustand'

interface OnboardingState {
  showWelcome: boolean
  currentStep: number
  completed: boolean
  setShowWelcome: (v: boolean) => void
  setCurrentStep: (n: number) => void
  setCompleted: (v: boolean) => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  showWelcome: false,
  currentStep: 0,
  completed: false,
  setShowWelcome: (showWelcome) => set({ showWelcome }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  setCompleted: (completed) => set({ completed }),
}))
