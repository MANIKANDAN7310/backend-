import React from 'react';
import { Link } from 'react-router-dom';
import instagramIcon from '../assets/instagram.png';
import pinterestIcon from '../assets/pinterest.png';
import gmailIcon from '../assets/gmail.png';
import whatsappIcon from '../assets/whatsapp.png';
import etsyIcon from '../assets/etsy (1).png';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-main">
                <div className="footer-col brand-col">
                    <h3 className="footer-brand">OctoInk Studios</h3>
                    <p className="footer-desc">Premium creative design excellence for vector art, pins & awards, and embroidery.</p>
                    <div className="social-icons">
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon"><img src={instagramIcon} alt="Instagram" /></a>
                        {/* <a href="#" className="social-icon"><img src={facebookIcon} alt="Facebook" /></a> - Upload facebook.png to assets */}
                        {/* <a href="#" className="social-icon"><img src={linkedinIcon} alt="LinkedIn" /></a> - Upload linkedin.png to assets */}
                        <a href="https://www.etsy.com/shop/octoinkstudios" target="_blank" rel="noopener noreferrer" className="social-icon"><img src={etsyIcon} alt="Etsy" /></a>
                        <a href="mailto:hello@octoinkstudios.com" className="social-icon"><img src={gmailIcon} alt="Email" /></a>
                        <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="social-icon"><img src={pinterestIcon} alt="Pinterest" /></a>
                        <a href="https://wa.me/919626107310" target="_blank" rel="noopener noreferrer" className="social-icon"><img src={whatsappIcon} alt="WhatsApp" /></a>
                    </div>
                </div>
                <div className="footer-col">
                    <h4>Services</h4>
                    <ul>
                        <li><a href="#">Vector Art Design</a></li>
                        <li><a href="#">Pin & Award Design</a></li>
                        <li><a href="#">Embroidery Design</a></li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>Company</h4>
                    <ul>
                        <li><Link to="/#process">Process</Link></li>
                        <li><Link to="/#portfolio">Portfolio</Link></li>
                        <li><Link to="/#process">Our Process</Link></li>
                        <li><Link to="/#testimonials">Testimonials</Link></li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>CONTACT</h4>
                    <ul className="footer-contact-list">
                        <li>Contact Us</li>
                        <li><a href="mailto:hello@octoinkstudios.com">hello@octoinkstudios.com</a></li>
                        <li>+(91) 962 610 7310</li>
                        <li>+(91) 787 170 7310</li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                <span className="copyright">© 2025 OctoInk Studios. All rights reserved.</span>
            </div>
        </footer>
    );
};

export default Footer;
