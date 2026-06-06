import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTour } from './TourContext'
import { getTourStepByIndex, TOTAL_TOUR_STEPS } from './tourSteps'

export default function TourOverlay() {
    const navigate = useNavigate()
    const { isTourActive, currentStep, nextStep, prevStep, skipTour, completeTour } = useTour()
    
    const [highlightBox, setHighlightBox] = useState(null)
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
    const [isVisible, setIsVisible] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(false)
    const overlayRef = useRef(null)

    const step = getTourStepByIndex(currentStep)

    // Sync theme configuration changes from document root attribute
    useEffect(() => {
        if (!isTourActive) return
        const checkTheme = () => {
            const theme = document.documentElement.getAttribute('data-theme')
            setIsDarkMode(theme === 'dark')
        }
        
        checkTheme()
        const observer = new MutationObserver(checkTheme)
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
        return () => observer.disconnect()
    }, [isTourActive])

    // Layout step dynamic paths
    useEffect(() => {
        if (!isTourActive || !step) {
            setIsVisible(false)
            return
        }

        if (step.navigate) navigate(step.navigate)

        const timer = setTimeout(() => setIsVisible(true), 400)
        return () => clearTimeout(timer)
    }, [currentStep, step, isTourActive, navigate])

    // Handle recalculation tracking bounds
    useEffect(() => {
        if (!isTourActive || !step) return

        const updatePositioning = () => {
            if (!step.highlight || step.target === 'body') {
                setHighlightBox(null)
                return
            }

            const element = document.querySelector(step.target)
            if (!element) return setHighlightBox(null)

            const rect = element.getBoundingClientRect()
            const padding = step.padding ?? 12

            setHighlightBox({
                top: rect.top - padding + window.scrollY,
                left: rect.left - padding + window.scrollX,
                width: rect.width + padding * 2,
                height: rect.height + padding * 2,
            })

            const tooltipWidth = 360, tooltipHeight = 280, gap = 16, paddingViewport = 20
            let top = 0, left = 0
            const position = step.position || 'right'

            switch (position) {
                case 'right':
                    left = rect.right + window.scrollX + gap
                    top = rect.top + window.scrollY - (tooltipHeight - rect.height) / 2
                    break
                case 'left':
                    left = rect.left + window.scrollX - tooltipWidth - gap
                    top = rect.top + window.scrollY - (tooltipHeight - rect.height) / 2
                    break
                case 'bottom':
                    left = rect.left + window.scrollX + (rect.width - tooltipWidth) / 2
                    top = rect.bottom + window.scrollY + gap
                    break
                case 'top':
                    left = rect.left + window.scrollX + (rect.width - tooltipWidth) / 2
                    top = rect.top + window.scrollY - tooltipHeight - gap
                    break
                default:
                    left = (window.innerWidth - tooltipWidth) / 2
                    top = Math.max(120, (window.innerHeight - tooltipHeight) / 2)
            }

            if (left < paddingViewport) left = paddingViewport
            if (left + tooltipWidth > window.innerWidth - paddingViewport) left = window.innerWidth - tooltipWidth - paddingViewport
            top = Math.max(paddingViewport, Math.min(top, window.innerHeight - tooltipHeight - paddingViewport))

            setTooltipPos({ top: Math.round(top), left: Math.round(left) })
        }

        const timer = setTimeout(updatePositioning, 500)
        window.addEventListener('resize', updatePositioning)
        window.addEventListener('scroll', updatePositioning)

        return () => {
            clearTimeout(timer)
            window.removeEventListener('resize', updatePositioning)
            window.removeEventListener('scroll', updatePositioning)
        }
    }, [isTourActive, step])

    // Hotkeys Listener
    useEffect(() => {
        if (!isTourActive) return
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault()
                currentStep < TOTAL_TOUR_STEPS - 1 ? nextStep() : completeTour()
            } else if (e.key === 'ArrowLeft' && currentStep > 0) {
                e.preventDefault()
                prevStep()
            } else if (e.key === 'Escape') {
                e.preventDefault()
                skipTour()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isTourActive, currentStep, nextStep, prevStep, skipTour, completeTour])

    if (!isTourActive || !step) return null

    const isLastStep = currentStep === TOTAL_TOUR_STEPS - 1
    const progress = ((currentStep + 1) / TOTAL_TOUR_STEPS) * 100

    const maskColor = isDarkMode ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.45)'

    return (
        <>
            {/* Context Backdrop */}
            <div style={{ position: 'fixed', inset: 0, background: maskColor, zIndex: 9998, pointerEvents: 'none', transition: 'background 0.3s ease' }} />

            {/* Spotlight Vector Wrap */}
            {highlightBox && (
                <div style={{
                    position: 'absolute',
                    ...highlightBox,
                    borderRadius: 12,
                    border: '2px solid var(--primary-color)',
                    boxShadow: `0 0 0 9999px ${maskColor}, 0 0 20px rgba(59, 130, 246, 0.4)`,
                    pointerEvents: 'none',
                    zIndex: 9998,
                    transition: 'box-shadow 0.3s ease'
                }} />
            )}

            {/* Main Presentation Card */}
            <div ref={overlayRef} style={{
                position: 'absolute',
                top: tooltipPos.top,
                left: tooltipPos.left,
                width: 360,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '24px',
                zIndex: 9999,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.98)',
                transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
                boxShadow: isDarkMode ? '0 16px 40px rgba(0, 0, 0, 0.5)' : '0 12px 32px rgba(0, 0, 0, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
            }}>
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--primary-color)', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em' }}>
                        STEP {currentStep + 1} OF {TOTAL_TOUR_STEPS}
                    </span>
                    <button onClick={skipTour} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 4 }}>✕</button>
                </div>

                {/* Content Elements */}
                <div>
                    <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px 0', fontSize: 18, fontWeight: 600 }}>{step.title}</h3>
                    {/* FIXED: whiteSpace handles parsing '\n' tags correctly */}
                    <p style={{ 
                        color: 'var(--text-secondary)', 
                        margin: 0, 
                        fontSize: 14, 
                        lineHeight: 1.6,
                        whiteSpace: 'pre-line' 
                    }}>
                        {step.description}
                    </p>
                </div>

                {/* Micro Linear Tracker */}
                <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'var(--primary-color)', width: `${progress}%`, transition: 'width 0.25s ease' }} />
                </div>

                {/* Balanced Actions Layout */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
                    <button 
                        onClick={prevStep} 
                        disabled={currentStep === 0} 
                        style={{
                            padding: '10px 20px', 
                            borderRadius: 10, 
                            border: '1px solid var(--border)',
                            background: 'var(--bg-primary)', 
                            color: 'var(--text-primary)',
                            fontSize: 13,
                            fontWeight: 500,
                            opacity: currentStep === 0 ? 0.3 : 1, 
                            cursor: currentStep === 0 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Back
                    </button>
                    
                    <button 
                        onClick={isLastStep ? completeTour : nextStep} 
                        style={{
                            padding: '10px 22px', 
                            borderRadius: 10, 
                            border: 'none',
                            background: 'var(--primary-color)', 
                            // FIXED: Text contrast color updates safely across theme modes
                            color: isDarkMode ? '#ffffff' : '#111827', 
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
                        }}
                    >
                        {isLastStep ? '🎉 Finish Tour' : 'Next Step →'}
                    </button>
                </div>
            </div>
        </>
    )
}