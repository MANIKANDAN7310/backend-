import { useState } from 'react';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        service: '',
        message: ''
    });
    const [submitStatus, setSubmitStatus] = useState({ state: 'idle', message: '' });

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        setSubmitStatus({ state: 'loading', message: 'Sending message...' });

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4999';
            const response = await fetch(`${apiUrl}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitStatus({ state: 'success', message: 'Your message has been sent successfully.' });
                setFormData({ name: '', email: '', service: '', message: '' });
            } else {
                setSubmitStatus({ state: 'error', message: data.message || data.error || 'Failed to send message. Backend status: ' + response.status });
            }
        } catch (error) {
            setSubmitStatus({ state: 'error', message: 'Failed to connect to the server. Please try again later.' });
        }
    };

    return (
        <section className="contact" id="contact">
            <div className="contact-container">
                <div className="contact-left">
                    <span className="contact-label">Send us an email ;</span>
                    <h2>Still not sure?<br /><span className="highlight-text">Let us help you out.</span></h2>
                    <p className="contact-desc">
                        Still have questions or doubts? No worries, that’s exactly what we’re here for. Our team would love to walk you through our services, clear up any confusion, and help you find the perfect plan that fits your needs.
                    </p>
                    <div className="contact-email-info">
                        <span>Send us an email ;</span>
                        <a href="mailto:hello@octoinkstudios.com">hello@octoinkstudios.com</a>
                    </div>
                </div>

                <div className="contact-right">
                    <form className="contact-form" onSubmit={handleContactSubmit}>
                        <div className="form-group">
                            <label>Name*</label>
                            <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="Your name..." required />
                        </div>
                        <div className="form-group">
                            <label>Email*</label>
                            <input type="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="Your email..." required />
                        </div>
                        <div className="form-group">
                            <label>Service Interested In</label>
                            <select name="service" value={formData.service} onChange={handleFormChange}>
                                <option value="" disabled>Select a services...</option>
                                <option value="pins">Enamel Pins</option>
                                <option value="vector">Vector Art</option>
                                <option value="embroidery">Embroidery Design</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Message *</label>
                            <textarea name="message" value={formData.message} onChange={handleFormChange} placeholder="Tell us about your project..." required></textarea>
                        </div>
                        <button type="submit" disabled={submitStatus.state === 'loading'}>
                            {submitStatus.state === 'loading' ? 'Sending...' : 'Send message'}
                        </button>
                        {submitStatus.message && (
                            <div className={`form-status ${submitStatus.state}`} style={{ marginTop: '10px', color: submitStatus.state === 'success' ? '#4ade80' : '#f87171' }}>
                                {submitStatus.message}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Contact;
