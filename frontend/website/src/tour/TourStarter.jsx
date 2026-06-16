import { useTour } from './TourContext'

/**
 * TourStarter
 * Button component to manually start the tour
 * Can be placed in settings, profile, or anywhere user might want to re-run tour
 */
export default function TourStarter({ label = '🎯 Take the Tour', className = 'btn btn-secondary' }) {
    const { startTour } = useTour()

    return (
        <button className={className} onClick={startTour} title="Take an interactive tour of AlgoSprint">
            {label}
        </button>
    )
}