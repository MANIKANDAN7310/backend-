import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import Footer from '../components/Footer';
import LanguageSelector from '../components/LanguageSelector';

function Plans() {
    const [step, setStep] = useState(1);
    const [showTerms, setShowTerms] = useState(false);

    // Close modal when moving to step 3
    const handleTermsAccept = () => {
        setShowTerms(false);
        setStep(3);
    };

    const handleInvestClick = () => {
        // Move to step 2
        setStep(2);
    };

    const handleNextStep = () => {
        // If we're on step 2, show terms or move to payment
        if (step === 2) {
            setShowTerms(true);
        }
    };

    return (
        <div className="main-bg">
            <header className="header">
                <div className="logo"><Link to="/"> <img src="../src/assets/logo.png" alt="Logo" width="50px" height="40px" />Octoink Studio </Link></div>
                <nav>
                    <Link to="/#services">Services</Link>
                    <Link to="/#portfolios">portfolios</Link>
                    <Link to="/#process">Process</Link>
                    <Link to="/#testimonials">Testimonials</Link>
                    <Link to="/#contact">Contact</Link>
                    <Link to="/quote" className="btn-quote-nav">Get a Quote</Link>

                </nav>
            </header>

            <section className="plans" style={{ paddingTop: '100px' }}>
                <span className="section-label">OUR SUBSCRIPTIONS</span>
                <h2>Pick a plan to start saving</h2>
                <p className="process-description">Start with any plan and save thousands every month </p>
                <div className="plan-cards">
                    <div className="plan-card">
                        <h3>Weekly Plan</h3>
                        <p>$500 <span>$299 per month</span></p>
                        <Link to="/quote"><button>Choose Subscription</button></Link>
                        <ul>
                            <li>Features</li>
                            <li>1 design per week</li>
                            <li>Priority support</li>
                            <li>Flexible pausing</li>
                        </ul>
                    </div>
                    <div className="plan-card">
                        <h3>Monthly Plan</h3>
                        <p>$1500 <span>$1199 per month</span></p>
                        <Link to="/quote"><button>Choose Subscription</button></Link>
                        <ul>
                            <li>Features</li>
                            <li>Up to 4 designs/month</li>
                            <li>Priority support</li>
                            <li>Flexible pausing</li>
                        </ul>
                    </div>
                    <div className="plan-card">
                        <h3>Budget Plan</h3>
                        <p>$1000 <span>$800 per month</span></p>
                        <Link to="/quote"><button>Choose Subscription</button></Link>
                        <ul>
                            <li>Features</li>
                            <li>2 designs/month</li>
                            <li>Priority support</li>
                            <li>Flexible pausing</li>
                        </ul>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
}

export default Plans;
