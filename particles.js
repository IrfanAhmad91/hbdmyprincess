/**
 * Particle Engine for Birthday Greeting Website
 * Handles heart rain, burst effects, and confetti animations.
 * Uses DOM element pooling and requestAnimationFrame for 60fps performance.
 */
(function () {
    'use strict';

    var MOBILE_BREAKPOINT = 768;
    var MAX_PARTICLES_DESKTOP = 50;
    var MAX_PARTICLES_MOBILE = 20;

    var HEART_EMOJIS = ['❤️', '💕', '💖', '💗', '💓'];
    var CONFETTI_EMOJIS = ['🎊', '🎉', '✨', '⭐', '🌟'];
    var STAR_EMOJIS = ['⭐', '🌟', '✨'];

    /**
     * @typedef {Object} Particle
     * @property {HTMLElement} element
     * @property {number} x
     * @property {number} y
     * @property {number} vx
     * @property {number} vy
     * @property {number} life
     * @property {number} maxLife
     * @property {string} type - 'heart' | 'confetti' | 'star' | 'balloon'
     */

    var particles = [];
    var maxParticles = MAX_PARTICLES_DESKTOP;
    var container = null;
    var isRunning = false;
    var animationFrameId = null;
    var heartRainInterval = null;
    var lastTimestamp = 0;

    // DOM element pool for reuse
    var elementPool = [];

    /**
     * Detect if viewport is mobile-sized.
     * @returns {boolean}
     */
    function isMobile() {
        return window.innerWidth < MOBILE_BREAKPOINT;
    }

    /**
     * Get or create a particle DOM element from the pool.
     * @returns {HTMLElement}
     */
    function getPooledElement() {
        if (elementPool.length > 0) {
            return elementPool.pop();
        }
        var el = document.createElement('span');
        el.className = 'particle';
        el.style.position = 'fixed';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '9999';
        el.style.fontSize = '1.2rem';
        el.style.userSelect = 'none';
        el.style.willChange = 'transform, opacity';
        return el;
    }

    /**
     * Return a particle element to the pool for reuse.
     * @param {HTMLElement} el
     */
    function returnToPool(el) {
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
        el.style.opacity = '';
        el.style.transform = '';
        elementPool.push(el);
    }

    /**
     * Force-remove the oldest particle to make room for new ones.
     */
    function forceRemoveOldest() {
        if (particles.length === 0) return;
        var oldest = particles.shift();
        returnToPool(oldest.element);
    }

    /**
     * Create a single particle and add it to the system.
     * @param {number} x - Initial x position
     * @param {number} y - Initial y position
     * @param {number} vx - Horizontal velocity (px/frame)
     * @param {number} vy - Vertical velocity (px/frame)
     * @param {number} life - Lifetime in ms
     * @param {string} type - 'heart' | 'confetti' | 'star' | 'balloon'
     * @returns {Particle|null}
     */
    function createParticle(x, y, vx, vy, life, type) {
        // Enforce max particle limit
        while (particles.length >= maxParticles) {
            forceRemoveOldest();
        }

        var el = getPooledElement();
        var emoji = '';

        switch (type) {
            case 'heart':
                emoji = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];
                break;
            case 'confetti':
                emoji = CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)];
                break;
            case 'star':
                emoji = STAR_EMOJIS[Math.floor(Math.random() * STAR_EMOJIS.length)];
                break;
            case 'balloon':
                emoji = '🎈';
                break;
            default:
                emoji = '❤️';
        }

        el.textContent = emoji;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.opacity = '1';

        if (container) {
            container.appendChild(el);
        }

        var particle = {
            element: el,
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            life: life,
            maxLife: life,
            type: type
        };

        particles.push(particle);
        return particle;
    }

    /**
     * Update a single particle's position and opacity.
     * @param {Particle} particle
     * @param {number} deltaTime - Time elapsed since last frame in ms
     */
    function updateParticle(particle, deltaTime) {
        var factor = deltaTime / 16.67; // Normalize to ~60fps

        particle.x += particle.vx * factor;
        particle.y += particle.vy * factor;
        particle.life -= deltaTime;

        var opacity = Math.max(0, particle.life / particle.maxLife);

        particle.element.style.transform = 'translate(' + particle.x + 'px, ' + particle.y + 'px)';
        particle.element.style.opacity = opacity.toFixed(2);
    }

    /**
     * Remove dead particles from the system and return elements to pool.
     */
    function cleanup() {
        var i = particles.length;
        while (i--) {
            if (particles[i].life <= 0) {
                returnToPool(particles[i].element);
                particles.splice(i, 1);
            }
        }
    }

    /**
     * Main animation loop using requestAnimationFrame.
     * @param {number} timestamp
     */
    function animationLoop(timestamp) {
        if (!isRunning) return;

        var deltaTime = lastTimestamp ? (timestamp - lastTimestamp) : 16.67;
        // Cap deltaTime to prevent huge jumps if tab was inactive
        if (deltaTime > 100) deltaTime = 100;
        lastTimestamp = timestamp;

        for (var i = 0; i < particles.length; i++) {
            updateParticle(particles[i], deltaTime);
        }

        cleanup();

        animationFrameId = requestAnimationFrame(animationLoop);
    }

    /**
     * Initialize the particle engine.
     * @param {HTMLElement} containerElement - The DOM element to contain particles
     */
    function init(containerElement) {
        container = containerElement || document.getElementById('particle-container');
        maxParticles = isMobile() ? MAX_PARTICLES_MOBILE : MAX_PARTICLES_DESKTOP;
        isRunning = true;
        lastTimestamp = 0;
        animationFrameId = requestAnimationFrame(animationLoop);
    }

    /**
     * Start continuous heart rain effect.
     * Emits 15-30 heart particles falling from top to bottom.
     * @param {number} [count] - Number of hearts per emission cycle (default random 15-30)
     */
    function startHeartRain(count) {
        var heartCount = count || (Math.floor(Math.random() * 16) + 15); // 15-30

        // Clamp to valid range
        if (heartCount < 15) heartCount = 15;
        if (heartCount > 30) heartCount = 30;

        function emitHearts() {
            var viewportWidth = window.innerWidth;
            var toEmit = Math.min(heartCount, maxParticles - particles.length);

            for (var i = 0; i < toEmit; i++) {
                var x = Math.random() * viewportWidth;
                var y = -20; // Start above viewport
                var vx = (Math.random() - 0.5) * 1; // Slight horizontal drift
                var vy = Math.random() * 1.5 + 1; // Fall speed 1-2.5 px/frame
                var life = 4000 + Math.random() * 3000; // 4-7 seconds lifetime

                createParticle(x, y, vx, vy, life, 'heart');
            }
        }

        // Emit initial batch
        emitHearts();

        // Continuously emit hearts
        if (heartRainInterval) {
            clearInterval(heartRainInterval);
        }
        heartRainInterval = setInterval(emitHearts, 3000);
    }

    /**
     * Trigger a burst of particles at a specific position.
     * Creates 5-10 particles radiating from (x, y) with max 1000ms lifetime.
     * @param {number} x - Click x position
     * @param {number} y - Click y position
     * @param {number} [count] - Number of particles (clamped to 5-10)
     */
    function triggerBurst(x, y, count) {
        var burstCount = count || (Math.floor(Math.random() * 6) + 5); // 5-10

        // Clamp to valid range
        if (burstCount < 5) burstCount = 5;
        if (burstCount > 10) burstCount = 10;

        for (var i = 0; i < burstCount; i++) {
            var angle = (Math.PI * 2 * i) / burstCount;
            var speed = Math.random() * 2 + 1;
            var vx = Math.cos(angle) * speed;
            var vy = Math.sin(angle) * speed;
            var life = 600 + Math.random() * 400; // 600-1000ms, max 1000ms

            createParticle(x, y, vx, vy, life, 'heart');
        }
    }

    /**
     * Trigger a confetti explosion from the viewport center.
     * Creates 30-50 particles spreading outward with 2000-3000ms lifetime.
     * @param {number} x - Origin x (typically viewport center)
     * @param {number} y - Origin y (typically viewport center)
     * @param {number} [count] - Number of particles (clamped to 30-50)
     */
    function triggerConfetti(x, y, count) {
        var confettiCount = count || (Math.floor(Math.random() * 21) + 30); // 30-50

        // Clamp to valid range
        if (confettiCount < 30) confettiCount = 30;
        if (confettiCount > 50) confettiCount = 50;

        // Use viewport center as origin
        var originX = x !== undefined ? x : window.innerWidth / 2;
        var originY = y !== undefined ? y : window.innerHeight / 2;

        for (var i = 0; i < confettiCount; i++) {
            var angle = (Math.PI * 2 * i) / confettiCount + (Math.random() * 0.3 - 0.15);
            var speed = Math.random() * 3 + 2;
            var vx = Math.cos(angle) * speed;
            var vy = Math.sin(angle) * speed - 1; // Slight upward bias
            var life = 2000 + Math.random() * 1000; // 2000-3000ms

            var types = ['confetti', 'star', 'heart'];
            var type = types[Math.floor(Math.random() * types.length)];

            createParticle(originX, originY, vx, vy, life, type);
        }
    }

    /**
     * Get the current number of active particles.
     * @returns {number}
     */
    function getActiveCount() {
        return particles.length;
    }

    /**
     * Set the maximum number of simultaneous particles.
     * @param {number} max - New max particle count
     * @returns {number} The new max value
     */
    function setMaxParticles(max) {
        maxParticles = max;

        // Remove excess particles if over the new limit
        while (particles.length > maxParticles) {
            forceRemoveOldest();
        }

        return maxParticles;
    }

    /**
     * Stop the particle engine and clean up all particles.
     */
    function destroy() {
        isRunning = false;

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        if (heartRainInterval) {
            clearInterval(heartRainInterval);
            heartRainInterval = null;
        }

        // Remove all particles
        while (particles.length > 0) {
            var p = particles.pop();
            returnToPool(p.element);
        }

        lastTimestamp = 0;
    }

    // Expose the ParticleEngine on the window for testability
    window.ParticleEngine = {
        init: init,
        startHeartRain: startHeartRain,
        triggerBurst: triggerBurst,
        triggerConfetti: triggerConfetti,
        cleanup: cleanup,
        getActiveCount: getActiveCount,
        setMaxParticles: setMaxParticles,
        destroy: destroy
    };

    // Auto-initialize on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function () {
        var containerEl = document.getElementById('particle-container');
        if (containerEl) {
            init(containerEl);
            startHeartRain();
        }
    });

    // Update max particles on window resize
    window.addEventListener('resize', function () {
        var newMax = isMobile() ? MAX_PARTICLES_MOBILE : MAX_PARTICLES_DESKTOP;
        setMaxParticles(newMax);
    });
})();
