/**
 * interactions.js - User interaction handlers
 * Handles click bursts, button confetti, hover effects, and rate limiting.
 * Depends on particles.js (window.ParticleEngine) being loaded first.
 */
(function () {
    'use strict';

    // --- Rate Limiter ---
    var RateLimiter = {
        activeBursts: 0,
        maxConcurrent: 3,

        canTrigger: function () {
            return this.activeBursts < this.maxConcurrent;
        },

        register: function () {
            this.activeBursts++;
        },

        release: function () {
            if (this.activeBursts > 0) {
                this.activeBursts--;
            }
        }
    };

    // --- Interaction Handlers ---

    /**
     * Selectors for interactive elements that should NOT trigger burst on click.
     */
    var INTERACTIVE_SELECTORS = 'button, a, input, [role="button"]';

    /**
     * Selectors for elements that get hover scale effects.
     */
    var HOVER_SELECTORS = '.personal-message, .slide-message, .hero-title';

    /**
     * Handle click on page (outside interactive elements) — trigger burst.
     */
    function handleClick(event) {
        // Ignore clicks on interactive elements
        if (event.target.closest(INTERACTIVE_SELECTORS)) {
            return;
        }

        // Check rate limiter
        if (!RateLimiter.canTrigger()) {
            return;
        }

        // Ensure particle engine is available
        if (!window.ParticleEngine || typeof window.ParticleEngine.triggerBurst !== 'function') {
            return;
        }

        RateLimiter.register();
        window.ParticleEngine.triggerBurst(event.clientX, event.clientY);

        // Release after burst animation completes (1000ms lifetime)
        setTimeout(function () {
            RateLimiter.release();
        }, 1000);
    }

    /**
     * Handle greeting button click — trigger confetti from viewport center.
     */
    function handleButtonClick(event) {
        // Prevent the click from also triggering handleClick burst
        event.stopPropagation();

        // Ensure particle engine is available
        if (!window.ParticleEngine || typeof window.ParticleEngine.triggerConfetti !== 'function') {
            return;
        }

        var centerX = window.innerWidth / 2;
        var centerY = window.innerHeight / 2;
        window.ParticleEngine.triggerConfetti(centerX, centerY);
    }

    /**
     * Setup hover scale effects on greeting text elements.
     */
    function setupHoverEffects() {
        var elements = document.querySelectorAll(HOVER_SELECTORS);

        elements.forEach(function (el) {
            // Set base transition
            el.style.transition = 'transform 0.3s';

            el.addEventListener('mouseenter', function () {
                el.style.transform = 'scale(1.05)';
            });

            el.addEventListener('mouseleave', function () {
                el.style.transform = 'scale(1)';
            });
        });
    }

    /**
     * Initialize all interaction handlers.
     */
    function init() {
        // Click burst on page
        document.addEventListener('click', handleClick);

        // Greeting button confetti
        var greetingBtn = document.getElementById('btn-ucapan');
        if (greetingBtn) {
            greetingBtn.addEventListener('click', handleButtonClick);
        }

        // Hover effects
        setupHoverEffects();
    }

    // --- Expose for testability ---
    window.Interactions = {
        init: init,
        handleClick: handleClick,
        handleButtonClick: handleButtonClick,
        setupHoverEffects: setupHoverEffects,
        rateLimiter: RateLimiter
    };

    // --- Initialize on DOMContentLoaded ---
    document.addEventListener('DOMContentLoaded', init);
})();
