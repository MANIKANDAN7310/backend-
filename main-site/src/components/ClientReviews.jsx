import React, { useState, useEffect, useRef } from 'react';
import '../App.css';

// Import client images
import clint1 from '../assets/clint 1.png';
import clint2 from '../assets/clint 2.jpg';
import clint3 from '../assets/clint3.jpg';
import clint4 from '../assets/clint4.png';
import clint5 from '../assets/clint5.jpg';
import mountain from '../assets/Mountain.png';

const ClientReviews = () => {
    // Text Reviews Data
    const textReviews = [
        {
            id: 1,
            name: "David Wilson",
            role: "Marketing Director, Techvision Corp",
            rating: 5,
            text: "Really impressed with the enamel pins! The hard enamel has a smooth, premium finish with a great shine, while the soft enamel brings out the details beautifully. Colors came out exactly as expected. The quality and finishing are top-notch. Will definitely order again",
            image: clint1
        },
        {
            id: 2,
            name: "Michael Chen",
            role: "CEO, StartUp Inc",
            rating: 5,
            text: "Absolutely loved the design! The attention to detail is amazing and nothing was overlooked. It has a perfect balance of traditional elegance and modern style. The final result exceeded our expectations. Highly satisfied with the work",
            image: clint2
        },
        {
            id: 3,
            name: "Emily Davis",
            role: "Brand Manager, Creative Solutions",
            rating: 5,
            text: "The medal design looks very professional and well-crafted. The engraving is sharp and the layout is perfectly balanced. It matched our event theme really well and gave a premium feel overall. Great work and timely delivery",
            image: clint3
        },
        {
            id: 4,
            name: "Sarah Johnson",
            role: "Product Lead, InnovateX",
            rating: 5,
            text: "Excellent embroidery design! The pattern was clean and optimized perfectly for stitching. Thread detailing and clarity were spot on. It ran smoothly on the machine without any issues and the final output looked very neat. Highly recommended",
            image: clint4
        }
    ];

    // Video Reviews Data (Using placeholders as requested)
    // Video Reviews Data
    const videoReviews = [
        {
            id: 1,
            title: "Emily Davis",
            // subtitle: "CEO, TechFlow",
            rating: 5,
            description: "I’m extremely impressed with the army medal design. The detailing, precision, and overall finish exceeded my expectations. It truly represents strength and honor. Highly recommended!",
            videoUrl: "https://www.pexels.com/download/video/7467694/",
            thumbnail: clint4
        },
        {
            id: 2,
            title: "Mark Thompson",
            // subtitle: "Founder, GreenEarth",
            rating: 5,
            description: "We are very satisfied with the enamel pin design provided by the team. The artwork was perfectly prepared for manufacturing, with clear lines and accurate color separation. It made our production process smooth and efficient. The final output came out exactly as expected. Great work and highly reliable design support",
            videoUrl: "https://v.etsystatic.com/video/upload/ac_none,du_15,q_auto:good/cwmij68fcmbnu2whbrvb.mp4",
            thumbnail: clint5
        },
        {
            id: 3,
            title: "Sarah Jenkins",
            // subtitle: "Marketing Head, StyleUp",
            rating: 5,
            description: "Great experience! The embroidery design is accurate, and the overall look is premium. Thank you for the excellent work.",
            videoUrl: "https://www.pexels.com/download/video/3797445/",
            thumbnail: mountain
        },
        {
            id: 4,
            title: "David Chen",
            // subtitle: "Director, FutureTech",
            rating: 5,
            description: "The racing medal design is excellent. The detailing is sharp and the overall look is very dynamic and professional. It perfectly represents the spirit of racing. Really happy with the final result!",
            videoUrl: "https://www.pexels.com/download/video/6344467/",
            thumbnail: clint1
        },
        {
            id: 5,
            title: "Jessica Lee",
            // subtitle: "Owner, CreativeSpace",
            rating: 5,
            description: "The coin design is outstanding. The detailing is clean and precise, giving it a premium and professional look. I’m really impressed with the quality and overall finish. Highly satisfied with the result!",
            videoUrl: "https://www.pexels.com/download/video/8369977/",
            thumbnail: clint2
        }
    ];

    // Text Carousel State
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [isTextPaused, setIsTextPaused] = useState(false);
    const textIntervalRef = useRef(null);

    // Text Carousel Logic
    useEffect(() => {
        if (!isTextPaused) {
            textIntervalRef.current = setInterval(() => {
                setCurrentTextIndex((prevIndex) =>
                    prevIndex === textReviews.length - 1 ? 0 : prevIndex + 1
                );
            }, 3000); // Change slide every 3 seconds
        }

        return () => {
            if (textIntervalRef.current) clearInterval(textIntervalRef.current);
        };
    }, [isTextPaused, textReviews.length]);

    const handleTextHover = (isHovering) => {
        setIsTextPaused(isHovering);
    };


    // Video Carousel State
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const videoRefs = useRef([]);

    // Manage play/pause and preloading logic
    useEffect(() => {
        videoReviews.forEach((_, index) => {
            const video = videoRefs.current[index];
            if (video) {
                if (index === currentVideoIndex) {
                    // Start playing active video
                    video.play().catch(err => console.log("Autoplay failed:", err));
                } else {
                    // Pause others and rewind slightly to keep it ready
                    video.pause();
                    // Optional: video.currentTime = 0; 
                }
            }
        });
    }, [currentVideoIndex, videoReviews]);

    const handleVideoChange = (index) => {
        setCurrentVideoIndex(index);
    };

    const handleVideoEnd = () => {
        setCurrentVideoIndex((prevIndex) =>
            prevIndex === videoReviews.length - 1 ? 0 : prevIndex + 1
        );
    };

    // Toggle Audio Logic
    const toggleAudio = (index) => {
        const video = videoRefs.current[index];
        if (video) {
            video.muted = !video.muted;
        }
    };

    // Helper to render stars
    const renderStars = (rating) => {
        return "★".repeat(rating);
    };

    return (
        <section className="client-reviews-section">
            <div className="section-header">
                <span className="section-label-small">TESTIMONIALS</span>
                <h2>What our Clients<br />Say About Us</h2>
                <p className="section-subheader">Don't just take our word for it. Here's what businesses say about working with us.</p>
            </div>

            {/* Text Reviews Carousel */}
            <div className="reviews-carousel-container"
                onMouseEnter={() => handleTextHover(true)}
                onMouseLeave={() => handleTextHover(false)}>

                <div className="reviews-track" style={{ transform: `translateX(-${currentTextIndex * 100}%)` }}>
                    {textReviews.map((review) => (
                        <div className="review-card" key={review.id}>
                            <div className="review-stars">{renderStars(review.rating)}</div>
                            <p className="review-text">{review.text}</p>
                            <div className="review-author">
                                <div className="author-image">
                                    <img src={review.image} alt={review.name} />
                                </div>
                                <div className="author-info">
                                    <h4>{review.name}</h4>
                                    <p>{review.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dots for Text Carousel */}
                <div className="carousel-dots">
                    {textReviews.map((_, index) => (
                        <span
                            key={index}
                            className={`dot ${index === currentTextIndex ? 'active' : ''}`}
                            onClick={() => setCurrentTextIndex(index)}
                        ></span>
                    ))}
                </div>
            </div>

            {/* Video Reviews Section */}
            <div className="video-reviews-container">
                <div className="video-slide">
                    <div className="video-content-wrapper animate-fade-in-up">
                        {/* Video Side */}
                        <div className="video-wrapper">
                            {videoReviews.map((review, index) => (
                                <video
                                    key={index}
                                    src={review.videoUrl}
                                    poster={review.thumbnail}
                                    muted
                                    playsInline
                                    // Preload current and neighbors "auto", others "metadata"
                                    preload={Math.abs(index - currentVideoIndex) <= 1 ? "auto" : "metadata"}
                                    onEnded={handleVideoEnd}
                                    ref={el => (videoRefs.current[index] = el)}
                                    className={`client-video ${index === currentVideoIndex ? 'active' : 'hidden'}`}
                                />
                            ))}
                            <div className="video-overlay">
                                {/* <button
                                    className="audio-toggle-btn"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleAudio(currentVideoIndex);
                                    }}
                                >
                                    🔊/🔇
                                </button> */}
                            </div>
                        </div>

                        {/* Content Side */}
                        <div className="video-text-content">
                            <h3>{videoReviews[currentVideoIndex].title}</h3>
                            <p className="video-subtitle">{videoReviews[currentVideoIndex].subtitle}</p>
                            <div className="video-stars">{renderStars(videoReviews[currentVideoIndex].rating)} <span>5 Star</span></div>
                            <p className="video-description">
                                {videoReviews[currentVideoIndex].description}
                            </p>
                        </div>
                    </div>
                </div>


                {/* Navigation for Video Carousel */}
                <div className="video-carousel-dots">
                    {videoReviews.map((_, index) => (
                        <span
                            key={index}
                            className={`video-dot ${index === currentVideoIndex ? 'active' : ''}`}
                            onClick={() => handleVideoChange(index)}
                        ></span>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ClientReviews;
