import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';
import quoteIllustration from '../assets/Untitled-1.png';
import Footer from '../components/Footer';
import LanguageSelector from '../components/LanguageSelector';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4999';

function Quote() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user, token } = useAuth();

    const [product, setProduct] = useState(location.state?.product || null);
    const [loading, setLoading] = useState(!product);
    const [error, setError] = useState(null);

    const [step, setStep] = useState(1);
    const [showTerms, setShowTerms] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        country: '',
        city: '',
        state: '',
        zipCode: '',
        address: ''
    });
    const [termsRead, setTermsRead] = useState(false);
    const modalBodyRef = useRef(null);

    useEffect(() => {
        if (!product && id) {
            const fetchProduct = async () => {
                try {
                    setLoading(true);
                    const res = await fetch(`${API}/api/products/${id}`);
                    const data = await res.json();
                    if (data.success) {
                        setProduct(data.product);
                        setError(null);
                    } else {
                        setError('Product not found');
                    }
                } catch (err) {
                    setError('Failed to fetch product details');
                } finally {
                    setLoading(false);
                }
            };
            fetchProduct();
        }
    }, [id, product]);

    const handleTermsAction = () => {
        if (!termsRead) {
            if (modalBodyRef.current) {
                modalBodyRef.current.scrollTo({
                    top: modalBodyRef.current.scrollHeight,
                    behavior: 'smooth'
                });
                setTermsRead(true);
            }
        } else {
            handleTermsAccept();
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const productTitle = product ? product.title : (loading ? "Loading..." : "Product Not Found");
    const productPrice = product ? product.price : 0;
    const originalPrice = product ? product.originalPrice : 0;
    const productImage = product && product.image ? `${API}/${product.image}` : quoteIllustration;
    const productCategory = product ? product.category : "";

    const discount = originalPrice && originalPrice > productPrice ? originalPrice - productPrice : 0;

    const handleTermsAccept = () => {
        setShowTerms(false);
        setStep(3);
    };

    const handleInvestClick = () => {
        setStep(2);
    };

    const handleNextStep = () => {
        if (step === 2) {
            const { name, companyName, country, city, state, zipCode, address } = formData;
            if (!name || !companyName || !country || !city || !state || !zipCode || !address) {
                alert("Please fill in all required fields.");
                return;
            }
            setShowTerms(true);
        }
    };

    const handlePayment = async () => {
        if (!user) {
            alert("Please login to proceed with payment.");
            navigate('/login');
            return;
        }

        if (productPrice <= 0) {
            alert("This product has no price set. Please contact support.");
            return;
        }

        console.log(`Initiating payment for ${productTitle} at ${API}/api/payment/create-order`);

        try {
            const res = await fetch(`${API}/api/payment/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: productPrice,
                    currency: 'INR',
                    items: [{
                        productId: product?._id,
                        title: productTitle,
                        price: productPrice,
                        quantity: 1
                    }],
                    // ✅ FIX: email also include பண்றோம்
                    clientInfo: {
                        ...formData,
                        email: user.email,
                    },
                    orderType: 'Product'
                })
            });

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                console.error("Non-JSON response received:", text.substring(0, 200));
                throw new Error(`Server returned ${res.status} ${res.statusText} as HTML. Is the API URL correct?`);
            }

            const data = await res.json();
            if (!data.success) {
                alert(data.message || "Failed to initialize payment");
                return;
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: data.amount,
                currency: data.currency,
                display_currency: "USD",
                display_amount: productPrice,
                name: "Octoink Studio",
                description: `Payment for ${productTitle}`,
                order_id: data.orderId,
                handler: async function (response) {
                    const verifyRes = await fetch(`${API}/api/payment/verify`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                    });

                    const verifyData = await verifyRes.json();
                    if (verifyData.success) {
                        navigate('/success', { state: { order: verifyData.order } });
                    } else {
                        navigate('/failure');
                    }
                },
                prefill: {
                    name: formData.name,
                    email: user.email,
                },
                theme: {
                    color: "#7c3aed"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                navigate('/failure');
            });
            rzp.open();

        } catch (error) {
            console.error("Payment Error:", error);
            alert(`An error occurred: ${error.message}. Check console for details.`);
        }
    };

    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

    if (loading) return <div className="main-bg" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Loading product details...</div>;
    if (error) return <div className="main-bg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}><h2>{error}</h2><Link to="/store" className="btn-primary" style={{ marginTop: '1rem' }}>Back to Store</Link></div>;

    return (
        <div className="main-bg">
            <header className="header">
                <div className="logo"><Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '10px' }}><img src="/src/assets/logo.png" alt="Logo" width="50px" height="40px" />Octoink Studio</Link></div>
                <nav>
                    <Link to="/#services">Services</Link>
                    <Link to="/#portfolios">portfolios</Link>
                    <Link to="/#process">Process</Link>
                    <Link to="/#testimonials">Testimonials</Link>
                    <Link to="/store">Store</Link>
                    <Link to="/#contact" className="btn-quote-nav active">Get a Quote</Link>

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

            <div className="quote-container">
                <div className="quote-stepper">
                    <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
                        <span className="step-check">{step > 1 ? '✓' : '1'}</span>
                        <span>Service Details</span>
                    </div>
                    <div className="step-line"></div>
                    <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
                        <span className={`step-circle ${step >= 2 ? 'active-circle' : 'step-circle-inactive'}`}>{step > 2 ? '✓' : '2'}</span>
                        <span>Client Information</span>
                    </div>
                    <div className="step-line"></div>
                    <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
                        <span className={`step-circle ${step >= 3 ? 'active-circle' : 'step-circle-inactive'}`}>3</span>
                        <span>Payment</span>
                    </div>
                </div>

                <div className="quote-content-box">
                    {step === 1 && (
                        <>
                            <div className="quote-left">
                                <h2>{productTitle}</h2>
                                <div className="quote-illustration">
                                    <div className="illustration-placeholder">
                                        <img
                                            src={productImage}
                                            alt={productTitle}
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400?text=Product+Image' }}
                                            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="quote-divider"></div>

                            <div className="quote-right">
                                <h2>{productCategory}</h2>
                                <div className="quote-price">
                                    {originalPrice > productPrice && <span className="original-price">${originalPrice}</span>}
                                    <span className="current-price">${productPrice}</span>
                                </div>
                                <p className="quote-subtitle">{product?.description || `High quality ${productTitle} designed for your brand.`}</p>

                                <div className="quote-features">
                                    <h3>Features</h3>
                                    <ul>
                                        <li>Premium Quality Design</li>
                                        <li>Unlimited Revisions</li>
                                        <li>Fast Turnaround Time</li>
                                        <li>High-Resolution Files</li>
                                    </ul>
                                </div>

                                <button className="btn-invest" onClick={handleInvestClick}>Proceed</button>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <div className="client-info-step">
                            <div className="client-form-container">
                                <div className="form-group">
                                    <label>Name*</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter Your First Name" required />
                                </div>
                                <div className="form-group">
                                    <label>Company Name*</label>
                                    <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="Enter Your Company Name" required />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Country*</label>
                                        <input type="text" name="country" value={formData.country} onChange={handleInputChange} placeholder="Enter Your Country Name" required />
                                    </div>
                                    <div className="form-group">
                                        <label>City*</label>
                                        <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="Enter Your City Name" required />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>State/Province/Region*</label>
                                        <input type="text" name="state" value={formData.state} onChange={handleInputChange} placeholder="Enter Your State" required />
                                    </div>
                                    <div className="form-group">
                                        <label>Postal Code*</label>
                                        <input type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} placeholder="Enter Your Zip Code" required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Street Address*</label>
                                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="(Street address, apartment, suite, unit etc)" className="full-width-input" required />
                                </div>
                            </div>

                            <div className="quote-summary-sidebar">
                                <h3>ORDER DETAILS</h3>
                                <div className="summary-row">
                                    <span>Product Price</span>
                                    <span>${originalPrice > 0 ? originalPrice : productPrice}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="summary-row">
                                        <span>Discount</span>
                                        <span>-${discount}</span>
                                    </div>
                                )}
                                <div className="summary-row">
                                    <span>Tax</span>
                                    <span>$0</span>
                                </div>
                                <div className="summary-total">
                                    <span>Total Amount</span>
                                    <span>${productPrice}</span>
                                </div>
                                {discount > 0 && <p className="save-message">You will save ${discount} on this order</p>}
                                <button className="btn-invest" onClick={handleNextStep}>Proceed</button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="payment-step">
                            <div className="payment-left">
                                <h2>Select Payment Method</h2>
                                <div className="payment-methods-box">
                                    <div className="payment-logos">
                                        <span className="pay-logo paypal">PayPal</span>
                                        <span className="pay-logo gpay"><span className="g-blue">G</span> Pay</span>
                                        <span className="pay-logo apple"> Pay</span>
                                    </div>
                                    <button className="btn-payment-card">Debit or Credit Card</button>
                                </div>
                            </div>

                            <div className="payment-divider"></div>

                            <div className="payment-right">
                                <div className="quote-summary-sidebar payment-summary-box">
                                    <h2 className="summary-title-large">Order Summary</h2>
                                    <div className="summary-row large-row">
                                        <span>{productTitle}</span>
                                        <span>${originalPrice > 0 ? originalPrice : productPrice}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="summary-row large-row">
                                            <span>Discount</span>
                                            <span>-${discount}</span>
                                        </div>
                                    )}
                                    <div className="summary-row large-row spacer-row">
                                        <span></span>
                                        <span></span>
                                    </div>
                                    <div className="summary-total large-total">
                                        <span>Your Investment</span>
                                        <span>${productPrice}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {step === 3 && (
                    <div className="step-navigation">
                        <button className="btn-nav-back" onClick={() => setStep(2)}>Back</button>
                        <button className="btn-nav-continue" onClick={handlePayment}>Continue</button>
                    </div>
                )}
            </div>

            {showTerms && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Terms and Conditions</h2>
                        </div>
                        <div className="modal-body" ref={modalBodyRef}>
                            <div className="term-item">
                                <h3>1. No Pause or Suspension</h3>
                                <p>Once a subscription is activated, it cannot be paused, stopped, or put on hold during the subscribed period.</p>
                            </div>
                            <div className="term-item">
                                <h3>2. No Plan Switching Mid-Cycle</h3>
                                <p>Customers cannot switch, downgrade, or upgrade between subscription plans during an active billing period.</p>
                            </div>
                            <div className="term-item">
                                <h3>3. No Refund Policy</h3>
                                <p>Once payment is made and the subscription is activated, refunds will not be issued under any circumstances.</p>
                            </div>
                            <div className="term-item">
                                <h3>4. Non-Transferable Subscription</h3>
                                <p>Subscriptions are non-transferable and can only be used by the registered customer or company account.</p>
                            </div>
                            <div className="term-item">
                                <h3>5. Job Usage Policy</h3>
                                <p>Each plan includes a defined number of jobs per cycle. Unused jobs will not roll over to the next billing period.</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-back" onClick={() => setShowTerms(false)}>Back</button>
                            <button className="btn-next" onClick={handleTermsAction}>{termsRead ? 'Continue' : 'Next'}</button>
                        </div>
                        <div className="scroll-indicator">▼</div>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
}

export default Quote;