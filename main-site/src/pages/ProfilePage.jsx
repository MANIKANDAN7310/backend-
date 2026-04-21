import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import LanguageSelector from '../components/LanguageSelector';
import './Store.css';

import { fetchWithRetry } from '../utils/api';

function ProfilePage() {
    const { user, token, logout, loading: authLoading } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const API = import.meta.env.VITE_API_URL || 'http://localhost:4999';

    useEffect(() => {
        if (!authLoading && !token) {
            navigate('/login');
            return;
        }

        const fetchProfile = async () => {
            try {
                const data = await fetchWithRetry(`${API}/api/auth/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (data.success) {
                    setProfileData(data.user);
                } else {
                    setError('Failed to load profile');
                }
            } catch (err) {
                setError('Error connecting to server. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchProfile();
        }
    }, [token, authLoading, navigate, API]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (authLoading || loading) {
        return (
            <div className="main-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'white' }}>Loading profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="main-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
                    <button onClick={() => navigate('/login')} className="btn-quote-nav">Go to Login</button>
                </div>
            </div>
        );
    }

    const initials = profileData?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

    return (
        <div className="main-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
                    <Link to="/store">Store</Link>

                </nav>
            </header>

            <main style={{ flex: 1, padding: '4rem 1rem' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    {/* Profile Header */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '20px',
                        padding: '3rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        marginBottom: '2rem'
                    }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: 'var(--primary-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                            fontWeight: '700',
                            color: 'white',
                            marginBottom: '1.5rem',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                        }}>
                            {initials}
                        </div>
                        <h1 style={{ color: 'white', fontSize: '2rem', marginBottom: '0.5rem' }}>{profileData?.name}</h1>
                        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>{profileData?.email}</p>
                        <div style={{
                            padding: '0.5rem 1.5rem',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '100px',
                            fontSize: '0.85rem',
                            color: 'rgba(255,255,255,0.8)',
                            marginBottom: '1.5rem'
                        }}>
                            Member since {new Date(profileData?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Language:</span>
                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.2rem' }}>
                                <LanguageSelector />
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '2rem',
                        marginBottom: '2rem'
                    }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '16px',
                            padding: '2rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            textAlign: 'center'
                        }}>
                            <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Total Downloads</h3>
                            <p style={{ color: 'var(--primary-color)', fontSize: '2.5rem', fontWeight: '800' }}>{profileData?.downloadHistory?.length || 0}</p>
                        </div>
                    </div>

                    {/* Download History */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '20px',
                        padding: '2.5rem',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '2rem' }}>Download History</h2>

                        {(profileData?.downloadHistory?.length || 0) === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
                                <p>No downloads yet.</p>
                                <Link to="/store" style={{ color: 'var(--primary-color)', textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
                                    Visit Store to start downloading
                                </Link>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[...(profileData.downloadHistory || [])].reverse().map((item, idx) => (
                                    <div key={idx} style={{
                                        padding: '1.25rem',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <div>
                                            <h4 style={{ color: 'white', marginBottom: '0.25rem' }}>{item.productTitle}</h4>
                                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                                                {new Date(item.downloadedAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <Link to={`/store`} style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' }}>
                                            View in Store
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        style={{
                            marginTop: '3rem',
                            width: '100%',
                            padding: '1.25rem',
                            borderRadius: '12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            fontWeight: '700',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    >
                        Log Out
                    </button>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default ProfilePage;
