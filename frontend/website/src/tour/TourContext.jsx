import { createContext, useContext, useState } from 'react'

const TourContext = createContext()

export const TourProvider = ({ children }) => {
    const [isTourActive, setIsTourActive] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [tourCompleted, setTourCompleted] = useState(() => {
        // Check if user has already completed the tour
        const stored = localStorage.getItem('algoSprint_tourCompleted')
        return stored === 'true'
    })

    // Start tour - typically called after onboarding completes
    const startTour = () => {
        localStorage.setItem('algoSprint_tourStarted', 'true')
        setIsTourActive(true)
        setCurrentStep(0)
    }

    // Go to next step
    const nextStep = () => {
        setCurrentStep(prev => prev + 1)
    }

    // Go to previous step
    const prevStep = () => {
        setCurrentStep(prev => Math.max(0, prev - 1))
    }

    // Jump to specific step
    const goToStep = (stepIndex) => {
        setCurrentStep(stepIndex)
    }

    // Complete tour
    const completeTour = () => {
        setIsTourActive(false)
        setTourCompleted(true)
        localStorage.setItem('algoSprint_tourCompleted', 'true')
    }

    // Skip tour
    const skipTour = () => {
        setIsTourActive(false)
        setTourCompleted(true)
        localStorage.setItem('algoSprint_tourCompleted', 'true')
    }

    // Reset tour (for demo purposes)
    const resetTour = () => {
        setTourCompleted(false)
        setCurrentStep(0)
        setIsTourActive(false)
        localStorage.removeItem('algoSprint_tourCompleted')
        localStorage.removeItem('algoSprint_tourStarted')
    }

    return (
        <TourContext.Provider
            value={{
                isTourActive,
                currentStep,
                tourCompleted,
                startTour,
                nextStep,
                prevStep,
                goToStep,
                completeTour,
                skipTour,
                resetTour,
                setCurrentStep,
                setIsTourActive,
            }}
        >
            {children}
        </TourContext.Provider>
    )
}

export const useTour = () => {
    const context = useContext(TourContext)
    if (!context) {
        throw new Error('useTour must be used within TourProvider')
    }
    return context
}