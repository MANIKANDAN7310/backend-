import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';
import './Store.css';
import Footer from '../components/Footer';
import LanguageSelector from '../components/LanguageSelector';
import CustomDesignForm from '../components/CustomDesignForm';

import { getImageUrl, fetchWithRetry } from '../utils/api';
const API = import.meta.env.VITE_API_URL || 'http://localhost:4999';

const FilterItem = ({ label, active, onClick }) => (
    <li className={`filter-item ${active ? 'active' : ''}`} onClick={onClick}>
        {active ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--primary-color)" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <rect width="24" height="24" rx="4" fill="currentColor" />
                <path d="M7 12L10.5 15.5L18 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <rect x="1" y="1" width="22" height="22" rx="3" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
            </svg>
        )}
        <span style={{ marginLeft: '0.5rem' }}>{label}</span>
    </li>
);

function Store() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isStoreEnabled, setIsStoreEnabled] = useState(true);
    const [settingsLoading, setSettingsLoading] = useState(true);
    const { user, token } = useAuth();
    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
    const navigate = useNavigate();

    // ── Fetch settings and products with global retry ──────────
    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch Settings (graceful — defaults if fails)
                try {
                    const settingsData = await fetchWithRetry(`${API}/api/settings`);
                    if (settingsData?.success) {
                        setIsStoreEnabled(settingsData.settings.isStoreEnabled);
                    }
                } catch (settingsErr) {
                    console.warn('Settings fetch failed, using defaults:', settingsErr.message);
                    setIsStoreEnabled(true); 
                }

                // Fetch Products (critical — with global retry)
                const productData = await fetchWithRetry(`${API}/api/products`);
                if (productData?.success) {
                    setProducts(productData.products);
                } else {
                    setError('Failed to load products');
                }
            } catch (err) {
                console.error('Product load failed after retries:', err);
                setError(`Server is taking longer than expected. Please wait a moment and try refreshing. (${err.message})`);
            } finally {
                setLoading(false);
                setSettingsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleProductClick = (product) => {
        navigate(`/quote/${product._id}`, { state: { product } });
    };

    const filterGroups = [
        {
            title: 'Ornaments',
            items: ['Enamel Pin', 'Medals', 'Ornament Design', 'Keychain Design', 'Coins Design']
        },
        {
            title: 'Embroidery Design',
            items: ['Embroidery Design']
        },
        {
            title: 'Custom Design',
            items: ['Your Design']
        },
    ];

    const handleFilterClick = (category) => {
        setSelectedCategory(category === selectedCategory ? 'All' : category);
    };

    const filteredProducts = selectedCategory === 'All'
        ? products
        : products.filter(p => p.category === selectedCategory);

    if (settingsLoading) {
        return (
            <div className="store-page" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: '#0a0a0c',
                color: 'rgba(255,255,255,0.5)',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(124, 58, 237, 0.2)', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    Initializing Store...
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!isStoreEnabled) {
        return (
            <div className="store-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'white', textAlign: 'center', padding: '2rem', background: '#0a0a0c' }}>
                <header className="header" style={{ position: 'fixed', top: 0, width: '100%', left: 0, padding: '1.5rem 2rem', background: 'rgba(10, 10, 12, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                    <div className="logo">
                        <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src="/src/assets/logo.png" alt="Logo" width="50px" height="40px" />
                            Octoink Studio
                        </Link>
                    </div>
                </header>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '4rem 2rem', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)', maxWidth: '600px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '2rem', filter: 'drop-shadow(0 0 20px rgba(124, 58, 237, 0.3))' }}>🚧</div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '1.5rem', background: 'linear-gradient(to right, #fff, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Store Unavailable</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.8', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
                        We are currently fine-tuning our marketplace for a better experience.
                        The store is temporarily disabled. Please come back soon!
                    </p>
                    <Link to="/" style={{ display: 'inline-block', padding: '1.25rem 2.5rem', background: '#7c3aed', color: 'white', textDecoration: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 10px 20px -5px rgba(124, 58, 237, 0.4)', transition: 'all 0.3s ease' }}>
                        Return to Homepage
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="store-page">
            <header className="header">
                <div className="logo">
                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src="/logo.png" alt="Logo" width="50px" height="40px" />
                        Octoink Studio
                    </Link>
                </div>
                <nav>
                    <Link to="/#services">Services</Link>
                    <Link to="/#portfolios">portfolios</Link>
                    <Link to="/#process">Process</Link>
                    <Link to="/#testimonials">Testimonials</Link>
                    <Link to="/store" className="active">Store</Link>
                    <Link to="/#contact" className="btn-quote-nav">Get a Quote</Link>

                    {user ? (
                        <Link to="/profile" className="user-avatar-nav" style={{
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
                        <Link to="/login" className="btn-login-nav" style={{
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

            <div className="store-container">
                <aside className="store-sidebar">
                    <h2 className="section-label" style={{ marginBottom: '2rem' }}>Filters</h2>
                    {filterGroups.map((group, index) => (
                        <div key={index} className="filter-section">
                            <h3 className="filter-title">{group.title}</h3>
                            <ul className="filter-list">
                                {group.items.map(item => (
                                    <FilterItem
                                        key={item}
                                        label={item}
                                        active={selectedCategory === item}
                                        onClick={() => handleFilterClick(item)}
                                    />
                                ))}
                            </ul>
                        </div>
                    ))}
                </aside>

                <main className="store-content">
                    {selectedCategory === 'Your Design' ? (
                        <CustomDesignForm />
                    ) : (
                        <>
                            <div className="products-header">
                                <span className="product-count">{filteredProducts.length} Products</span>

                            </div>

                            {/* Loading */}
                            {loading && (
                                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                                    <p>Loading products...</p>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>
                                    <p>{error}</p>
                                    <button
                                        onClick={() => { setError(''); setLoading(true); window.location.reload(); }}
                                        style={{
                                            marginTop: '1rem',
                                            padding: '0.75rem 2rem',
                                            background: 'var(--primary-color)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: '600'
                                        }}
                                    >
                                        🔄 Retry
                                    </button>
                                </div>
                            )}

                            {/* No products */}
                            {!loading && !error && filteredProducts.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                                    <p>No products found.</p>
                                </div>
                            )}

                            {/* Products Grid */}
                            {!loading && !error && filteredProducts.length > 0 && (
                                <div className="product-grid">
                                    {filteredProducts.map(product => (
                                        <div
                                            key={product._id}
                                            className="product-card"
                                            onClick={() => handleProductClick(product)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <img
                                                src={getImageUrl(product.image)}
                                                alt={product.title}
                                                className="product-image"
                                            />
                                            <div className="product-info">
                                                <h3 className="product-title">{product.title}</h3>
                                                <p className="product-category">{product.category}</p>
                                                <div className="price-wrapper">
                                                    <span className="product-price">${product.price}</span>
                                                    {product.originalPrice && product.originalPrice > product.price && (
                                                        <span className="original-price">${product.originalPrice}</span>
                                                    )}
                                                </div>
                                                {/* Download button if file exists */}
                                                {product.file && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleProductClick(product);
                                                        }}
                                                        style={{
                                                            marginTop: '0.75rem',
                                                            padding: '0.5rem 1.25rem',
                                                            background: 'var(--primary-color)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem',
                                                            fontWeight: '600',
                                                            width: '100%',
                                                        }}
                                                    >
                                                        ⬇ Get Started
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            <Footer />
        </div>
    );
}

export default Store;
