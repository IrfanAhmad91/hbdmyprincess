/**
 * animations.js - Entrance Animations, Scroll Reveal, Floating & Balloon Rise
 * Validates: Requirements 3.1, 3.3, 3.4, 3.6, 7.4, 6.3
 */

(function () {
    'use strict';

    // --- State ---
    var heroAnimationComplete = false;
    var revealedElements = new Set();
    var observer = null;

    // --- Entrance Animation (Req 3.1, 3.6) ---

    /**
     * Animate hero title with entrance (fade-in + scale 0.8→1.0).
     * Once complete, marks heroAnimationComplete to prevent re-triggering.
     */
    function animateHeroTitle() {
        var heroTitle = document.querySelector('.hero-title');
        if (!heroTitle) return;

        // If already completed, ensure visible state and do nothing else (Req 3.6)
        if (heroAnimationComplete) {
            heroTitle.style.opacity = '1';
            heroTitle.style.transform = 'scale(1)';
            return;
        }

        // Add entrance class — CSS handles fade-in + scale via animation forwards fill
        heroTitle.classList.add('animate-entrance');

        // Listen for animation end to lock the final state
        heroTitle.addEventListener('animationend', function onEntranceEnd() {
            heroTitle.removeEventListener('animationend', onEntranceEnd);
            heroAnimationComplete = true;
            // Ensure final visible state persists (Req 3.6)
            heroTitle.style.opacity = '1';
            heroTitle.style.transform = 'scale(1)';
        });
    }

    // --- Scroll Reveal (Req 3.4) ---

    /**
     * Set up IntersectionObserver with threshold 0.2 for scroll reveal.
     * Targets: .slideshow-section, .message-section, .decorations-section, and individual .slide elements.
     * Each element is revealed only once (tracked via revealedElements Set).
     */
    function setupScrollReveal() {
        // Feature detection: if IntersectionObserver not supported, show all immediately (Req 6.3)
        if (!('IntersectionObserver' in window)) {
            showAllElementsImmediately();
            return;
        }

        var options = {
            root: null, // viewport
            rootMargin: '0px',
            threshold: 0.2
        };

        observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting && !revealedElements.has(entry.target)) {
                    revealedElements.add(entry.target);
                    entry.target.classList.add('animate-reveal');
                    // Stop observing this element since it's revealed
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        // Observe target sections and slides
        var targets = document.querySelectorAll(
            '.slideshow-section, .message-section, .decorations-section, .slide'
        );

        targets.forEach(function (el) {
            observer.observe(el);
        });
    }

    /**
     * Fallback: show all revealable elements immediately when
     * IntersectionObserver is not supported (Req 6.3).
     */
    function showAllElementsImmediately() {
        var targets = document.querySelectorAll(
            '.slideshow-section, .message-section, .decorations-section, .slide'
        );

        targets.forEach(function (el) {
            el.classList.add('animate-reveal');
            el.style.opacity = '1';
            el.style.transform = 'none';
            revealedElements.add(el);
        });
    }

    // --- Balloon Rise Animation (Req 7.4) ---

    /**
     * Trigger balloon rise animation on page load.
     * Targets elements with .balloon-icon class (3+ balloons, 3-6s each via CSS nth-child).
     */
    function triggerBalloonRise() {
        var balloons = document.querySelectorAll('.balloon-icon');
        balloons.forEach(function (balloon) {
            balloon.classList.add('animate-balloon-rise');
        });
    }

    // --- Init (DOMContentLoaded entry point) ---

    /**
     * Main initialization function.
     * - Animates hero title entrance
     * - Sets up scroll reveal
     * - Triggers balloon rise
     */
    function init() {
        animateHeroTitle();
        setupScrollReveal();
        triggerBalloonRise();
    }

    // --- Bind to DOMContentLoaded ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already ready (script loaded after DOM or deferred)
        init();
    }

    // --- Export for Testability (window.Animations namespace) ---
    window.Animations = {
        init: init,
        animateHeroTitle: animateHeroTitle,
        setupScrollReveal: setupScrollReveal,
        triggerBalloonRise: triggerBalloonRise,
        showAllElementsImmediately: showAllElementsImmediately,
        // Expose state getters for testing
        isHeroAnimationComplete: function () {
            return heroAnimationComplete;
        },
        getRevealedElements: function () {
            return revealedElements;
        },
        getObserver: function () {
            return observer;
        },
        // Reset for testing purposes
        _reset: function () {
            heroAnimationComplete = false;
            revealedElements = new Set();
            if (observer) {
                observer.disconnect();
                observer = null;
            }
        }
    };
})();
