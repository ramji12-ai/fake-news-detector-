import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";

const HERO_SLIDES = [
  {
    id: "slide-ai",
    title: "Artificial Intelligence & Natural Language Processing",
    subtitle: "Analyzing semantic patterns in text using statistical machine learning",
    imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1600&auto=format&fit=crop",
    fallbackColor: "#1e1b4b",
    alt: "Abstract visualization of artificial intelligence neural networks"
  },
  {
    id: "slide-journalism",
    title: "Independent Journalism & Editorial Integrity",
    subtitle: "Separating factual investigative journalism from clickbait fabrication",
    imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1600&auto=format&fit=crop",
    fallbackColor: "#0f172a",
    alt: "Printed newspapers and journalistic editorial desks"
  },
  {
    id: "slide-newsroom",
    title: "Global Digital News & Information Ecosystem",
    subtitle: "Real-time updates aggregated from accredited international publishers",
    imageUrl: "https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1600&auto=format&fit=crop",
    fallbackColor: "#082f49",
    alt: "Modern digital newsroom monitors and live feeds"
  },
  {
    id: "slide-cybersecurity",
    title: "Information Verification & Misinformation Defense",
    subtitle: "Safeguarding public discourse against coordinated disinformation campaigns",
    imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1600&auto=format&fit=crop",
    fallbackColor: "#141a29",
    alt: "Digital lock and cyber defense shield representing information security"
  },
  {
    id: "slide-analytics",
    title: "Data Science & TF-IDF Linguistic Analytics",
    subtitle: "Transforming raw textual tokens into 30,000 weighted numerical vectors",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop",
    fallbackColor: "#062016",
    alt: "Interactive data analytics charts and statistical dashboards"
  },
  {
    id: "slide-technology",
    title: "Modern Computing & Web-Grounded Retrieval",
    subtitle: "Combining local classification models with real-time web search grounding",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop",
    fallbackColor: "#241107",
    alt: "Microprocessor circuitry and high performance computing matrix"
  }
];

export default function HeroCarousel() {
  const { settings, activeThemeColor } = useSettings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const touchStartXRef = useRef(0);
  const containerRef = useRef(null);

  // Auto-advance slides every 4.5 seconds when not paused and animations are enabled
  useEffect(() => {
    if (isPaused || !settings.animations) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, settings.animations]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  // Keyboard navigation when carousel container has focus
  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNext();
    }
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartXRef.current;
    if (deltaX > 45) {
      handlePrev();
    } else if (deltaX < -45) {
      handleNext();
    }
  };

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section
      className={`hero-carousel-section theme-overlay-${activeThemeColor}`}
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="VeriText NLP Featured Intelligence Showcase"
    >
      {/* Background Slides */}
      <div className="hero-slides-wrapper">
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === currentIndex;
          const hasError = imageErrors[slide.id];

          return (
            <div
              key={slide.id}
              className={`hero-slide ${isActive ? "active" : ""}`}
              aria-hidden={!isActive}
              style={{ backgroundColor: slide.fallbackColor }}
            >
              {!hasError ? (
                <img
                  src={slide.imageUrl}
                  alt={slide.alt}
                  className="hero-slide-img"
                  loading={idx === 0 ? "eager" : "lazy"}
                  onError={() => handleImageError(slide.id)}
                />
              ) : (
                <div className="hero-slide-fallback">
                  <div className="fallback-pattern" />
                </div>
              )}
              {/* Dynamic Theme Gradient Overlay */}
              <div className="hero-theme-overlay" />
            </div>
          );
        })}
      </div>

      {/* Foreground Content */}
      <div className="container hero-content-container">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="eyebrow-pulse" aria-hidden="true" />
            <span className="eyebrow-text">INTELLIGENT NEWS ANALYSIS</span>
          </div>

          <h1 className="hero-headline">
            Understand News.<br />
            <span className="hero-headline-accent">Detect Misinformation.</span>
          </h1>

          <p className="hero-description">
            VeriText NLP combines Natural Language Processing, Machine Learning, and
            web-grounded AI to help users analyze and understand news with empirical
            linguistic transparency and real-time citations.
          </p>

          <div className="hero-cta-group">
            <Link to="/detector" className="btn btn-primary btn-hero">
              <span className="btn-icon">⚡</span>
              <span>Detect Fake News</span>
            </Link>

            <Link to="/ai-news" className="btn btn-outline btn-hero">
              <span className="btn-icon">💬</span>
              <span>Explore AI News</span>
            </Link>
          </div>

          {/* 4 Feature Indicators */}
          <div className="hero-indicators-bar" aria-label="Platform Highlights">
            <div className="indicator-pill">
              <span className="indicator-dot" />
              <span className="indicator-label">AI Powered</span>
            </div>
            <div className="indicator-pill">
              <span className="indicator-dot" />
              <span className="indicator-label">ML Based</span>
            </div>
            <div className="indicator-pill">
              <span className="indicator-dot" />
              <span className="indicator-label">Web Grounded</span>
            </div>
            <div className="indicator-pill">
              <span className="indicator-dot" />
              <span className="indicator-label">24/7 Available</span>
            </div>
          </div>
        </div>

        {/* Current slide caption pill */}
        <div className="hero-caption-card">
          <span className="caption-badge">Topic #{currentIndex + 1}</span>
          <span className="caption-title">{HERO_SLIDES[currentIndex].title}</span>
        </div>
      </div>

      {/* Carousel Navigation Controls */}
      <button
        type="button"
        className="carousel-control prev"
        onClick={handlePrev}
        aria-label="Previous Slide"
        title="Previous (Left arrow)"
      >
        ‹
      </button>

      <button
        type="button"
        className="carousel-control next"
        onClick={handleNext}
        aria-label="Next Slide"
        title="Next (Right arrow)"
      >
        ›
      </button>

      {/* Dot Indicators */}
      <div className="carousel-dots" role="tablist" aria-label="Slide Selection">
        {HERO_SLIDES.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={idx === currentIndex}
            aria-label={`Slide ${idx + 1}: ${slide.title}`}
            className={`carousel-dot ${idx === currentIndex ? "active" : ""}`}
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>
    </section>
  );
}
