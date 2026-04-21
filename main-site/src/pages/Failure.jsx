import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import './Success.css'; // Reuse some styles or create specific ones

const Failure = () => {
    return (
        <div className="success-page failure-page">
            <header className="header">
                <div className="logo">
                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src="/src/assets/logo.png" alt="Logo" width="50px" height="40px" />
                        Octoink Studio
                    </Link>
                </div>
            </header>~

            <div className="success-container">
                <div className="success-card">
                    <div className="success-icon failure-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M15 9L9 15" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 9L15 15" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1 style={{ color: '#ef4444' }}>Payment Failed</h1>
                    <p>Unfortunately, your payment could not be processed at this time. Please try again.</p>

                    <div className="success-actions">
                        <Link to="/store" className="btn-primary">Back to Store</Link>
                        <button onClick={() => window.history.back()} className="btn-secondary">Try Again</button>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Failure;
