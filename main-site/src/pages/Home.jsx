import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../App.css';
import ClientReviews from '../components/ClientReviews';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import LanguageSelector from '../components/LanguageSelector';
import { getImageUrl, fetchWithRetry } from '../utils/api';
const API = import.meta.env.VITE_API_URL || 'https://octoink-backend.onrender.com';

function Home() {
    const testimonials = [
        {
            id: 1,
            name: "John Doe",
            image: "/client1.jpg",
            text: "Octoink transformed our branding with their incredible vector art. Highly recommended!   "
        },
        {
            id: 2,
            name: "Jane Smith",
            image: "/client1.jpg",
            text: "The enamel pins we ordered for our event were a hit! Exceptional quality and detail."
        },
        {
            id: 3,
            name: "Robert Brown",
            image: "/client1.jpg",
            text: "Professional, timely, and creative. Their embroidery designs exceeded our expectations."
        },
        {
            id: 4,
            name: "Emily Davis",
            image: "/client1.jpg",
            text: "Fantastic service! They helped us refine our logo and brand identity perfectly."
        },
        {
            id: 5,
            name: "Michael Wilson",
            image: "/client1.jpg",
            text: "Great experience working with the team. The production quality is top-notch."
        },
        {
            id: 6,
            name: "Sarah Johnson",
            image: "/client1.jpg",
            text: "I love the custom patches! They look amazing on our uniforms. Will order again."
        },
        {
            id: 7,
            name: "David Lee",
            image: "/client1.jpg",
            text: "Quick turnaround and excellent communication throughout the design process."
        },
        {
            id: 8,
            name: "Jessica White",
            image: "/client1.jpg",
            text: "The attention to detail in their work is unmatched. A true partner for our brand."
        },
        {
            id: 9,
            name: "Chris Green",
            image: "/client1.jpg",
            text: "Highly skilled designers who truly understand client needs. 5 stars!"
        },
        {
            id: 10,
            name: "Amanda Clark",
            image: "/client1.jpg",
            text: "From concept to delivery, everything was seamless. Thank you Octoink!"
        }
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(3);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setItemsPerPage(1);
            } else {
                setItemsPerPage(3);
            }
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            nextSlide();
        }, 3000);

        return () => clearInterval(interval);
    }, [currentIndex, isPaused, itemsPerPage]);

    const nextSlide = () => {
        setCurrentIndex((prevIndex) =>
            (prevIndex + 1) % (testimonials.length - itemsPerPage + 1)
        );
        // Reset to start loop smoothly or bounce back? 
        // Simple finite scroll loop:
        if (currentIndex >= testimonials.length - itemsPerPage) {
            setCurrentIndex(0);
        } else {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };



    const [heroIndex, setHeroIndex] = useState(0);
    const [activeCategory, setActiveCategory] = useState("All");

    const categories = [
        "All",
        "Embroidery Design",
        "Enamel Pin Collection",
        "Medals Design",
        "Coins Design",
        "Vector Art and Poster"
    ];
    const FALLBACK_PORTFOLIO = [
        { id: 1, category: "Embroidery Design", image: "/portfolio/emb1.jpg", title: "Custom Embroidery" },
        { id: 2, category: "Enamel Pin Collection", image: "/portfolio/91SPgUm6UEL._AC_UY1100_.jpg", title: "Custom Pins" },
        { id: 3, category: "Medals Design", image: "/portfolio/die-cast-medals.png", title: "Custom Medals" },
        { id: 4, category: "Coins Design", image: "/portfolio/coinimage1.jpg", title: "Custom Coins" },
        { id: 5, category: "Vector Art and Poster", image: "/portfolio/vector3.jpg", title: "Vector Illustration" },
        { id: 6, category: "Embroidery Design", image: "/portfolio/applique.jpg", title: "Applique" },
        { id: 7, category: "Enamel Pin Collection", image: "/portfolio/pin2.jpg", title: "Custom Pins" },
        { id: 8, category: "Enamel Pin Collection", image: "/portfolio/soft-vs-hard.jpg", title: "Soft vs Hard" },
        { id: 9, category: "Vector Art and Poster", image: "/portfolio/vector2.jpg", title: "Vector Art" },
        { id: 10, category: "Medals Design", image: "/portfolio/1754917181858.jpg", title: "Running Medals" },
        { id: 11, category: "Medals Design", image: "/portfolio/Ornanment2.jpg", title: "Custom Ornament" },
        { id: 12, category: "Coins Design", image: "/portfolio/coinimage2.jpg", title: "Commemorative Coin" },
        { id: 13, category: "Coins Design", image: "/portfolio/coinimage3.jpg", title: "Commemorative Coin" },
        { id: 14, category: "Embroidery Design", image: "/portfolio/emb2.jpg", title: "Anime Embroidery" },
        { id: 15, category: "Vector Art and Poster", image: "/portfolio/poster.jpg", title: "Poster Design" },
    ];

    const [portfolioItems, setPortfolioItems] = useState(FALLBACK_PORTFOLIO);

    const filteredPortfolio = activeCategory === "All"
        ? portfolioItems
        : portfolioItems.filter(item => item.category === activeCategory);

    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const data = await fetchWithRetry(`${API}/api/banners`);
                if (data.success) {
                    setBanners(data.banners);
                }
            } catch (err) {
                console.error("Error fetching banners:", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchPortfolio = async () => {
            try {
                const data = await fetchWithRetry(`${API}/api/portfolio`);
                if (data.success && data.items && data.items.length > 0) {
                    setPortfolioItems(data.items);
                }
            } catch (err) {
                console.error("Error fetching portfolio, using fallback:", err);
            }
        };

        fetchBanners();
        fetchPortfolio();
    }, []);

    useEffect(() => {
        if (banners.length === 0) return;
        const interval = setInterval(() => {
            setHeroIndex((prevIndex) => (prevIndex + 1) % banners.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [banners]);

    const { user } = useAuth();
    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


    return (
        <div className="main-bg">
            <header className="header">
                <div className="logo"> <img src="/logo.png" alt="Logo" width="50px" height="40px" />Octoink Studio</div>
                <button className={`hamburger ${mobileMenuOpen ? 'active' : ''}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
                    <span></span><span></span><span></span>
                </button>
                <nav className={mobileMenuOpen ? 'mobile-nav-open' : ''}>
                    <a href="#services" onClick={() => setMobileMenuOpen(false)}>Services</a>
                    <a href="#portfolio" onClick={() => setMobileMenuOpen(false)}>Portfolio</a>
                    <a href="#process" onClick={() => setMobileMenuOpen(false)}>Process</a>
                    <Link to="/store" onClick={() => setMobileMenuOpen(false)}>Store</Link>
                    <a href="#contact" className="btn-quote-nav" onClick={() => setMobileMenuOpen(false)}>Get a Quote</a>

                    {user ? (
                        <Link to="/profile" className="user-avatar-nav" onClick={() => setMobileMenuOpen(false)} style={{
                            width: '35px',
                            height: '35px',
                            borderRadius: '50%',
                            background: 'var(--primary-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            fontSize: '0.8rem'
                        }}>
                            {initials}
                        </Link>
                    ) : (
                        <Link to="/login" className="btn-login-nav" onClick={() => setMobileMenuOpen(false)} style={{
                            padding: '0.5rem 1rem',
                            border: '1px solid var(--primary-color)',
                            borderRadius: '6px',
                            color: 'var(--primary-color)',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                        }}>Login</Link>
                    )}


                </nav>
            </header>

            <section className="hero">
                <div className="hero-content">
                    {banners.map((banner, index) => (
                        <div key={index} className={`hero-content-slide ${index === heroIndex ? 'active' : ''}`}>
                            <h2>{banner.subHeading}</h2>
                            <h1>{banner.heading}</h1>
                            <p>{banner.description}</p>
                            <div className="hero-buttons">
                                {banner.button1Text && (
                                    <a href={banner.button1Link}><button>{banner.button1Text}</button></a>
                                )}
                                {banner.button2Text && (
                                    <a href={banner.button2Link}><button className="secondary">{banner.button2Text}</button></a>
                                )}
                            </div>
                        </div>
                    ))}

                    {banners.length === 0 && !loading && (
                        <div className="hero-content-slide active">
                            <h1>Transform Your Brand with Stunning Custom Designs</h1>
                            <p>
                                Expert enamel pins, vector art, and embroidery design that elevate your operation’s branding. Professional quality, unique visual style, delivered on time.
                            </p>
                            <div className="hero-buttons">
                                <a href="#services"><button>Start Your Project</button></a>
                                <a href="#portfolio"><button className="secondary">View Our Work</button></a>
                            </div>
                        </div>
                    )}

                    <div className="hero-stats">
                        <span>1000+ Projects Done</span>
                        <span>950+ Happy Clients</span>
                        <span>5 Star Rated Service</span>
                    </div>
                </div>
                <div className="hero-image">
                    {banners.map((banner, index) => (
                        <img
                            key={index}
                            src={getImageUrl(banner.image || banner.imageUrl)}
                            alt={banner.heading || `Slide ${index + 1}`}
                            className={`hero-slide ${index === heroIndex ? 'active' : ''}`}
                            onError={(e) => { e.target.src = 'https://placehold.co/1920x1080?text=Octoink+Image'; }}
                        />
                    ))}
                    {banners.length === 0 && (
                        <img
                            src="https://placehold.co/1920x1080?text=Octoink+Custom+Designs"
                            alt="Default Hero"
                            className="hero-slide active"
                        />
                    )}
                </div>
            </section>

            <section className="process" id="process">
                <span className="section-label">PROCESS</span>
                <h2>Simple Process, Outstanding Results</h2>
                <p className="process-description">From initial concept to final delivery, we make the entire process seamless and transparent</p>
                <div className="steps">
                    <div className="step">
                        <div className="step-badge">01</div>
                        <div className="step-icon">
                            <span>💬</span>
                        </div>
                        <h3>Consultation</h3>
                        <p>We discuss your vision, brand requirements, and project goals in detail.</p>
                    </div>
                    <div className="step">
                        <div className="step-badge">02</div>
                        <div className="step-icon">
                            <span>🎨</span>
                        </div>
                        <h3>Design & Revision</h3>
                        <p>Our team creates initial concepts and refines them based on your feedback.</p>
                    </div>
                    <div className="step">
                        <div className="step-badge">03</div>
                        <div className="step-icon">
                            <span>✅</span>
                        </div>
                        <h3>Approval</h3>
                        <p>Final Design Review and approval before we move to production.</p>
                    </div>
                    <div className="step">
                        <div className="step-badge">04</div>
                        <div className="step-icon">
                            <span>📦</span>
                        </div>
                        <h3>Production & Delivery</h3>
                        <p>Quality production and timely delivery of your custom designs.</p>
                    </div>
                </div>
            </section>

            <section className="services" id="services">
                <span className="section-label">SERVICES</span>
                <h2>Professional Design Services for Your Business</h2>
                <p className="process-description">We specialize in creating premium custom designs that make your brand stand out. From concept to production, we deliver excellence at every step.</p>
                <div className="service-cards">
                    <div className="service-card">
                        <div className="service-icon">
                            <span>📌</span>
                        </div>
                        <h3>Enamel Pins</h3>
                        <p className="service-desc">Custom enamel pins for corporate branding, promotional campaigns, and employee recognition programs.</p>
                        <ul>
                            <li>Hard & Soft Enamel</li>
                            <li>Coins & Medals</li>
                            <li>Trading Pins</li>
                            <li>Key Chains</li>
                        </ul>
                    </div>
                    <div className="service-card">
                        <div className="service-icon">
                            <span>✒️</span>
                        </div>
                        <h3>Vector Art</h3>
                        <p className="service-desc">Professional vector illustration and graphics perfect for logos, marketing materials, and brand assets.</p>
                        <ul>
                            <li>Logo & branding design</li>
                            <li>Brand identity</li>
                            <li>Scalable vector graphics</li>
                            <li>Custom illustrations</li>
                        </ul>
                    </div>
                    <div className="service-card">
                        <div className="service-icon">
                            <span>🧵</span>
                        </div>
                        <h3>Embroidery Design</h3>
                        <p className="service-desc">High-Quality Embroidery designs for corporate apparel, uniforms, and promotional merchandise.</p>
                        <ul>
                            <li>Embroidery</li>
                            <li>Applique Embroidery</li>
                            <li>Puff Embroidery</li>
                        </ul>
                    </div>
                </div>
            </section>


            {/* <section className="plans">
                <span className="section-label">OUR SUBSCRIPTIONS</span>
                <h2>Pick a plan to start saving</h2>
                <p className="process-description">Start with any plan and save thousands every month </p>
                <div className="plan-cards">
                    <div className="plan-card">
                        <h3>Weekly Plan</h3>
                        <p>$299 <span>$500 per  month</span></p>
                        <Link to="/quote"><button>Choose Subscription</button></Link>
                        <ul>
                            <li>Features</li>
                            <li>15 design per week</li>
                            <li>Priority support</li>
                            <li>Flexible pausing</li>
                        </ul>
                    </div>
                    <div className="plan-card">
                        <h3>Monthly Plan</h3>
                        <p>$1199 <span>$1500 per month</span></p>
                        <Link to="/quote"><button>Choose Subscription</button></Link>
                        <ul>
                            <li>Features</li>
                            <li>Up to 40 designs/month</li>
                            <li>Priority support</li>
                            <li>Flexible pausing</li>
                        </ul>
                    </div>
                    <div className="plan-card">
                        <h3>Budget Plan</h3>
                        <p>$800 <span>$1000 per month</span></p>
                        <Link to="/quote"><button>Choose Subscription</button></Link>
                        <ul>
                            <li>Features</li>
                            <li>25 designs/month</li>
                            <li>Priority support</li>
                            <li>Flexible pausing</li>
                        </ul>
                    </div>
                </div>
            </section> */}

            <section className="portfolios" id="portfolio">
                <span className="section-label">PORTFOLIO</span>
                <h2>Our Octoink Works, Done for Growing Brands</h2>
                <p className="process-description">Every design tells a story. Explore our curated works where creativity meets strategy.</p>

                <div className="portfolios-filter">
                    {categories.map((cat, index) => (
                        <button
                            key={index}
                            className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="portfolios-grid">
                    {filteredPortfolio.map((item) => (
                        <div key={item._id || item.id} className="portfolios-item animate-fade-in-up">
                            <img src={getImageUrl(item.image)} alt={item.title} />
                            <div className="portfolios-overlay">
                                <h3>{item.title}</h3>
                                <p>{item.category}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <ClientReviews />

            <Contact />


            <Footer />
        </div>
    );
}

export default Home;
