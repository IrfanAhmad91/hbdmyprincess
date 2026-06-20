/**
 * Slideshow State Manager and Navigation Controller
 * Validates: Requirements 8.1, 8.2, 8.3, 8.5, 8.6, 9.1, 9.2, 9.3, 9.4, 9.5
 */
(function () {
    'use strict';

    var TOTAL_SLIDES = 5;
    var TRANSITION_DURATION = 400; // 0.4s in ms
    var DEFAULT_NEXT_LABEL = 'Next ❯';
    var SURPRISE_LABEL = '🌺 Kejutan!';

    /**
     * @constructor
     */
    function SlideshowController() {
        this._currentIndex = 1;
        this._totalSlides = TOTAL_SLIDES;
        this._isTransitioning = false;
        this._container = null;
        this._slides = [];
        this._btnPrev = null;
        this._btnNext = null;
        this._dots = [];
        this._changeListeners = [];
        this._initialized = false;
    }

    /**
     * Initialize the slideshow controller.
     * Finds DOM elements, parses slides, sets initial state.
     */
    SlideshowController.prototype.init = function (container) {
        if (this._initialized) return;

        // Allow passing container or find from DOM
        this._container = container || document.querySelector('.slideshow-container');
        if (!this._container) return;

        // Parse slides
        this._slides = [];
        for (var i = 1; i <= this._totalSlides; i++) {
            var slideEl = this._container.querySelector('.slide[data-slide="' + i + '"]');
            if (slideEl) {
                this._slides.push(slideEl);
            }
        }

        if (this._slides.length !== this._totalSlides) return;

        // Find navigation buttons
        this._btnPrev = document.getElementById('btn-prev');
        this._btnNext = document.getElementById('btn-next');

        // Find dot indicators
        this._dots = [];
        for (var d = 1; d <= this._totalSlides; d++) {
            var dot = document.querySelector('.indicator-dot[data-dot="' + d + '"]');
            if (dot) {
                this._dots.push(dot);
            }
        }

        // Set initial state: show slide 1, hide slides 2-5
        this._currentIndex = 1;
        this._showInitialSlide();

        // Update navigation button states
        this._updateButtonStates();

        // Update indicator dots
        this._updateIndicators();

        // Bind navigation events
        this._bindEvents();

        this._initialized = true;
    };

    /**
     * Show slide 1 and hide all others on init.
     */
    SlideshowController.prototype._showInitialSlide = function () {
        for (var i = 0; i < this._slides.length; i++) {
            var slide = this._slides[i];
            if (i === 0) {
                slide.classList.add('active');
                slide.style.opacity = '1';
                slide.style.visibility = 'visible';
                slide.style.transform = 'translateX(0)';
                slide.style.position = 'relative';
            } else {
                slide.classList.remove('active');
                slide.style.opacity = '0';
                slide.style.visibility = 'hidden';
                slide.style.transform = 'translateX(100%)';
                slide.style.position = 'absolute';
            }
            // Clear any lingering transition classes
            slide.classList.remove('slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right');
        }
    };

    /**
     * Update previous/next button states based on current index.
     */
    SlideshowController.prototype._updateButtonStates = function () {
        if (!this._btnPrev || !this._btnNext) return;

        // Previous button: hidden on slide 1
        if (this._currentIndex === 1) {
            this._btnPrev.classList.add('hidden');
            this._btnPrev.setAttribute('disabled', 'true');
            this._btnPrev.setAttribute('aria-hidden', 'true');
        } else {
            this._btnPrev.classList.remove('hidden');
            this._btnPrev.removeAttribute('disabled');
            this._btnPrev.removeAttribute('aria-hidden');
        }

        // Next button: surprise label on slide 5
        if (this._currentIndex === this._totalSlides) {
            this._btnNext.textContent = SURPRISE_LABEL;
            this._btnNext.classList.add('surprise-btn');
        } else {
            this._btnNext.textContent = DEFAULT_NEXT_LABEL;
            this._btnNext.classList.remove('surprise-btn');
        }
    };

    /**
     * Update dot indicators to match current index.
     */
    SlideshowController.prototype._updateIndicators = function () {
        for (var i = 0; i < this._dots.length; i++) {
            if (i === this._currentIndex - 1) {
                this._dots[i].classList.add('active');
            } else {
                this._dots[i].classList.remove('active');
            }
        }
    };

    /**
     * Bind click events to navigation buttons and dots.
     */
    SlideshowController.prototype._bindEvents = function () {
        var self = this;

        if (this._btnNext) {
            this._btnNext.addEventListener('click', function () {
                self.goToNext();
            });
        }

        if (this._btnPrev) {
            this._btnPrev.addEventListener('click', function () {
                self.goToPrevious();
            });
        }

        // Dot click navigation
        for (var i = 0; i < this._dots.length; i++) {
            (function (index) {
                self._dots[index].addEventListener('click', function () {
                    self.goToSlide(index + 1);
                });
            })(i);
        }
    };

    /**
     * Navigate to next slide. If on slide 5, trigger bloom animation.
     */
    SlideshowController.prototype.goToNext = function () {
        if (this._isTransitioning) return;

        if (this._currentIndex < this._totalSlides) {
            this._transition(this._currentIndex + 1, 'left');
        } else if (this._currentIndex === this._totalSlides) {
            // Trigger bloom animation
            this._triggerBloom();
        }
    };

    /**
     * Navigate to previous slide.
     */
    SlideshowController.prototype.goToPrevious = function () {
        if (this._isTransitioning) return;

        if (this._currentIndex > 1) {
            this._transition(this._currentIndex - 1, 'right');
        }
    };

    /**
     * Navigate to a specific slide by index (1-5).
     */
    SlideshowController.prototype.goToSlide = function (index) {
        if (this._isTransitioning) return;
        if (index < 1 || index > this._totalSlides) return;
        if (index === this._currentIndex) return;

        var direction = index > this._currentIndex ? 'left' : 'right';
        this._transition(index, direction);
    };

    /**
     * Perform the slide transition animation.
     * @param {number} toIndex - Target slide index (1-5)
     * @param {string} direction - 'left' or 'right'
     */
    SlideshowController.prototype._transition = function (toIndex, direction) {
        var self = this;
        var fromIndex = this._currentIndex;
        var currentSlide = this._slides[fromIndex - 1];
        var nextSlide = this._slides[toIndex - 1];

        this._isTransitioning = true;

        // Determine exit and enter classes based on direction
        var exitClass = direction === 'left' ? 'slide-out-left' : 'slide-out-right';
        var enterFromDirection = direction === 'left' ? 'right' : 'left';

        // Prepare the next slide at the entering position
        nextSlide.style.position = 'absolute';
        nextSlide.style.visibility = 'visible';
        nextSlide.style.opacity = '0';
        nextSlide.style.transform = direction === 'left' ? 'translateX(100%)' : 'translateX(-100%)';
        nextSlide.classList.remove('active', 'slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right');

        // Force reflow to ensure the starting position is rendered
        void nextSlide.offsetWidth;

        // Animate current slide out
        currentSlide.classList.add(exitClass);
        currentSlide.style.transform = direction === 'left' ? 'translateX(-100%)' : 'translateX(100%)';
        currentSlide.style.opacity = '0';

        // Animate next slide in
        var enterClass = direction === 'left' ? 'slide-in-right' : 'slide-in-left';
        nextSlide.classList.add(enterClass);
        nextSlide.style.transform = 'translateX(0)';
        nextSlide.style.opacity = '1';

        // After transition duration, finalize states
        setTimeout(function () {
            // Clean up current slide
            currentSlide.classList.remove('active', exitClass);
            currentSlide.style.visibility = 'hidden';
            currentSlide.style.position = 'absolute';

            // Activate next slide
            nextSlide.classList.remove(enterClass);
            nextSlide.classList.add('active');
            nextSlide.style.position = 'relative';

            // Update state
            self._currentIndex = toIndex;
            self._isTransitioning = false;

            // Update UI
            self._updateButtonStates();
            self._updateIndicators();

            // Trigger text message fade-in by resetting the animation
            self._triggerTextFadeIn(nextSlide);

            // Notify listeners
            self._notifyListeners(fromIndex, toIndex, direction);
        }, TRANSITION_DURATION);
    };

    /**
     * Trigger the text message fade-in animation on the active slide.
     */
    SlideshowController.prototype._triggerTextFadeIn = function (slideEl) {
        var message = slideEl.querySelector('.slide-message');
        if (!message) return;

        // Reset animation by removing and re-adding the element's style
        message.style.animation = 'none';
        void message.offsetWidth; // Force reflow
        message.style.animation = '';
    };

    /**
     * Trigger the bloom animation (called when Next is clicked on slide 5).
     */
    SlideshowController.prototype._triggerBloom = function () {
        if (window.BloomAnimator && typeof window.BloomAnimator.start === 'function') {
            window.BloomAnimator.start();
        }
    };

    /**
     * Notify all registered slide change listeners.
     */
    SlideshowController.prototype._notifyListeners = function (fromIndex, toIndex, direction) {
        for (var i = 0; i < this._changeListeners.length; i++) {
            try {
                this._changeListeners[i](fromIndex, toIndex, direction);
            } catch (e) {
                // Silently ignore listener errors
            }
        }
    };

    // --- Public API ---

    /**
     * Get the current slide index (1-5).
     */
    SlideshowController.prototype.getCurrentSlide = function () {
        return this._currentIndex;
    };

    /**
     * Get total number of slides (always 5).
     */
    SlideshowController.prototype.getTotalSlides = function () {
        return this._totalSlides;
    };

    /**
     * Check if a transition is currently active.
     */
    SlideshowController.prototype.isTransitioning = function () {
        return this._isTransitioning;
    };

    /**
     * Get slide data for a given index.
     */
    SlideshowController.prototype.getSlideData = function (index) {
        if (index < 1 || index > this._totalSlides) return null;

        var slideEl = this._slides[index - 1];
        if (!slideEl) return null;

        var img = slideEl.querySelector('.slide-image');
        var placeholder = slideEl.querySelector('.photo-placeholder');
        var messageEl = slideEl.querySelector('.slide-message');

        return {
            index: index,
            photoSrc: img ? img.src : (placeholder ? '' : ''),
            photoAlt: img ? img.alt : (placeholder ? placeholder.getAttribute('aria-label') || '' : ''),
            message: messageEl ? messageEl.textContent : ''
        };
    };

    /**
     * Register a callback for slide change events.
     * @param {Function} callback - function(fromIndex, toIndex, direction)
     */
    SlideshowController.prototype.onSlideChange = function (callback) {
        if (typeof callback === 'function') {
            this._changeListeners.push(callback);
        }
    };

    // --- Expose globally ---
    window.SlideshowController = SlideshowController;

    // --- Auto-init on DOMContentLoaded ---
    function autoInit() {
        var instance = new SlideshowController();
        instance.init();
        window.slideshowInstance = instance;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }

})();
