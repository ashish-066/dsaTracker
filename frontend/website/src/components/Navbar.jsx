import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function Navbar({ scrolled }) {

    const navigate = useNavigate();
    const location = useLocation();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showNavbar, setShowNavbar] = useState(true);
    const isLandingPage = location.pathname === "/";

    useEffect(() => {
        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY < lastScrollY) {
                setShowNavbar(true);
            } else {
                setShowNavbar(false);
            }
            if (currentScrollY < 80) {
                setShowNavbar(true);
            }

            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        < nav
            className={`ml-nav ${scrolled ? 'ml-nav-scrolled' : ''}`
            }
            style={{
                position: 'fixed',
                top: showNavbar ? '14px' : '-120px',
                left: '50%',
                transform: 'translateX(-50%)',
                transition: 'top 0.35s ease',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.8rem',
                width: 'min(1180px, calc(100% - 32px))',
                margin: '0 auto',
                padding: '0.9rem 1rem',

                flexDirection:
                    window.innerWidth <= 768
                        ? 'row'
                        : 'row',
            }}
        >
            <div
                className="ml-logo"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    flex:
                        window.innerWidth <= 768
                            ? 1
                            : '0 0 auto',
                    minWidth: 0,
                }}
            >
                <div className="ml-logo-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                            stroke="#F5EBD6"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                <span
                    className="ml-logo-text"
                    style={{
                        fontSize: '1rem',
                        whiteSpace: 'nowrap',
                    }}
                >
                    Algo<span>Sprint</span>
                </span>

                <span
                    className="ml-tape-sticker"
                    style={{
                        fontSize: '0.65rem',
                        padding: '0.15rem 0.45rem',
                    }}
                >
                    ✨ beta
                </span>
            </div>

            <button
                className="ml-hamburger"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                style={{
                    display: window.innerWidth <= 768 ? 'flex' : 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '42px',
                    height: '42px',
                    fontSize: '1.6rem',
                    color: '#F5EBD6',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                }}
            >
                {mobileMenuOpen ? '✕' : '☰'}
            </button>

            {isLandingPage && (
                <div className={`ml-nav-links ${mobileMenuOpen ? 'active' : ''}`}
                    style={{
                        display:
                            window.innerWidth <= 768
                                ? mobileMenuOpen
                                    ? 'flex'
                                    : 'none'
                                : 'flex',

                        flexDirection:
                            window.innerWidth <= 768
                                ? 'column'
                                : 'row',

                        alignItems:
                            window.innerWidth <= 768
                                ? 'flex-start'
                                : 'center',

                        width:
                            window.innerWidth <= 768
                                ? '100%'
                                : 'auto',

                        gap: '1rem',

                        marginTop:
                            window.innerWidth <= 768
                                ? '1rem'
                                : '0',

                        position:
                            window.innerWidth <= 768
                                ? 'static'
                                : 'absolute',

                        left:
                            window.innerWidth <= 768
                                ? 'auto'
                                : '50%',

                        transform:
                            window.innerWidth <= 768
                                ? 'none'
                                : 'translateX(-50%)',
                    }}
                >
                    <a href="#features" className="ml-nav-link">Features</a>
                    <a href="#why" className="ml-nav-link">Why it works</a>
                    <a href="#how" className="ml-nav-link">How it works</a>
                    <a href="#team" className="ml-nav-link">Team</a>
                    <a href="#faq" className="ml-nav-link">FAQ</a>
                    <a href="#contact" className="ml-nav-link">Contact</a>
                </div>
            )}

            <div
                className={`ml-nav-actions ${mobileMenuOpen ? 'active' : ''}`}
                style={{
                    display:
                        window.innerWidth <= 768
                            ? mobileMenuOpen
                                ? 'flex'
                                : 'none'
                            : 'flex',

                    flexDirection:
                        window.innerWidth <= 768
                            ? 'column'
                            : 'row',

                    alignItems: 'center',

                    width:
                        window.innerWidth <= 768
                            ? '100%'
                            : 'auto',

                    gap: '0.8rem',

                    marginTop:
                        window.innerWidth <= 768
                            ? '1rem'
                            : '0',
                    marginLeft:
                        window.innerWidth <= 768
                            ? '0'
                            : 'auto',
                }}
            >
                <button
                    className="ml-btn-ghost"
                    onClick={() => navigate('/login')}
                    style={{
                        width: mobileMenuOpen ? '100%' : 'auto',
                    }}
                >
                    Login
                </button>

                <button
                    className="ml-btn-primary"
                    onClick={() => navigate('/signup')}
                    style={{
                        width: mobileMenuOpen ? '100%' : 'auto',
                    }}
                >
                    Get started <span className="ml-arrow">→</span>
                </button>
            </div>
        </nav >
    );
}