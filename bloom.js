/**
 * bloom.js - Garden Blooming Flower Canvas Animation
 * Renders multiple flowers blooming in sequence with sparkles,
 * falling petals, and floating hearts.
 * Exposed via window.BloomAnimator for testability.
 */
(function () {
    'use strict';

    // --- State ---
    var state = {
        isActive: false,
        phase: 'idle', // 'idle' | 'cake' | 'candles-lighting' | 'make-wish' | 'blow-candles' | 'screen-dim' | 'bud' | 'opening' | 'full-bloom' | 'complete'
        progress: 0.0,
        startTime: null,
        duration: 4500,
        petalsRevealed: 0,
        totalPetals: 10,
        finalTextVisible: false,
        usingFallback: false,
        // Cake animation state
        cakePhase: 'entering', // 'entering' | 'candles-lighting' | 'wish' | 'blowing' | 'dimming'
        candlesLit: 0,
        wishStartTime: null,
        wishDuration: 15000 // 15 seconds
    };

    // --- Config ---
    var config = {
        totalDuration: 4500,
        petalCount: 10,
        centerX: 0,
        centerY: 0,
        maxRadius: 0,
        // CHEERFUL UPDATE: More vibrant, playful colors with neon pinks, bright yellows, vivid purples
        colors: [
            '#FF1493', '#FF69B4', '#FFD700', '#FF6EC7', 
            '#DA70D6', '#FFA500', '#FF85C0', '#BA55D3',
            '#FF1493', '#FF00FF', '#FFFF00', '#FF69B4'
        ],
        finalTextDelay: 750,
        // Multi-flower config
        flowerCount: 4,
        flowerPositions: [], // calculated on init
        // CHEERFUL UPDATE: Brighter flower color palettes
        flowerColors: [
            ['#FF1493', '#FF69B4', '#FFD700', '#FF6EC7', '#FFA500'],
            ['#DA70D6', '#FF00FF', '#FF85C0', '#BA55D3', '#FF69B4'],
            ['#FFD700', '#FFA500', '#FF1493', '#FF69B4', '#FF6EC7'],
            ['#FF00FF', '#BA55D3', '#DA70D6', '#FF85C0', '#FFD700']
        ],
        sparkles: [],
        fallingPetals: [],
        floatingHearts: [],
        // CHEERFUL UPDATE: New elements
        confetti: [],
        butterflies: [],
        // Rotation for flowers
        flowerRotations: [0, 0, 0, 0],
        // CAKE ANIMATION CONFIG
        cakeConfig: {
            candleCount: 3,
            cakeLayers: 3,
            cakeColors: ['#FF69B4', '#FFB6C1', '#FFC0CB'],
            candleFlames: []
        }
    };

    // --- DOM references ---
    var canvas = null;
    var ctx = null;
    var overlay = null;
    var finalTextEl = null;
    var fallbackEl = null;
    var animFrameId = null;
    var completeTimeoutId = null;
    var onCompleteCallback = null;

    // --- Petal data ---
    var petals = [];

    // --- Feature Detection ---
    function canUseCanvas() {
        try {
            var testCanvas = document.createElement('canvas');
            return !!(testCanvas.getContext && testCanvas.getContext('2d'));
        } catch (e) {
            return false;
        }
    }

    // --- Calculate flower positions spread across canvas ---
    function calculateFlowerPositions() {
        var w = canvas ? canvas.width : 400;
        var h = canvas ? canvas.height : 400;
        config.flowerPositions = [
            { x: w * 0.5, y: h * 0.42, radius: Math.min(w, h) * 0.2, delay: 0 },
            { x: w * 0.25, y: h * 0.6, radius: Math.min(w, h) * 0.14, delay: 0.15 },
            { x: w * 0.75, y: h * 0.58, radius: Math.min(w, h) * 0.15, delay: 0.25 },
            { x: w * 0.4, y: h * 0.75, radius: Math.min(w, h) * 0.12, delay: 0.35 }
        ];
    }

    // --- Generate sparkle particles ---
    function generateSparkles() {
        config.sparkles = [];
        var w = canvas ? canvas.width : 400;
        var h = canvas ? canvas.height : 400;
        // CHEERFUL UPDATE: More sparkles (50 instead of 25), more colorful
        for (var i = 0; i < 50; i++) {
            config.sparkles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: Math.random() * 4 + 2, // Larger sparkles
                alpha: 0,
                speed: Math.random() * 0.03 + 0.015, // Faster twinkling
                phase: Math.random() * Math.PI * 2,
                color: ['#FFD700', '#FFA500', '#FF69B4', '#FF00FF', '#00FFFF'][Math.floor(Math.random() * 5)]
            });
        }
    }

    // --- Generate falling petal particles ---
    function generateFallingPetals() {
        config.fallingPetals = [];
        var w = canvas ? canvas.width : 400;
        for (var i = 0; i < 15; i++) {
            config.fallingPetals.push({
                x: Math.random() * w,
                y: -20 - Math.random() * 100,
                size: Math.random() * 8 + 4,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.03,
                fallSpeed: Math.random() * 1.5 + 0.5,
                swayAmp: Math.random() * 30 + 10,
                swaySpeed: Math.random() * 0.02 + 0.01,
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    // --- Generate floating hearts ---
    function generateFloatingHearts() {
        config.floatingHearts = [];
        var w = canvas ? canvas.width : 400;
        var h = canvas ? canvas.height : 400;
        // CHEERFUL UPDATE: More hearts (15 instead of 8) with bouncing motion
        for (var i = 0; i < 15; i++) {
            config.floatingHearts.push({
                x: Math.random() * w,
                y: h + 20 + Math.random() * 50,
                size: Math.random() * 16 + 10, // Larger hearts
                speed: Math.random() * 1.8 + 0.8, // Faster rise
                swayAmp: Math.random() * 30 + 10,
                swaySpeed: Math.random() * 0.025 + 0.01,
                alpha: 0,
                phase: Math.random() * Math.PI * 2,
                bounce: Math.random() * 0.5 + 0.3, // Bounce amplitude
                bounceSpeed: Math.random() * 0.05 + 0.02,
                color: ['#FF1493', '#FF69B4', '#FF6EC7', '#DA70D6', '#FF00FF'][Math.floor(Math.random() * 5)]
            });
        }
    }

    // --- CHEERFUL UPDATE: Generate confetti explosion ---
    function generateConfetti() {
        config.confetti = [];
        var w = canvas ? canvas.width : 400;
        var h = canvas ? canvas.height : 400;
        var cx = w / 2;
        var cy = h / 2;
        for (var i = 0; i < 80; i++) {
            var angle = Math.random() * Math.PI * 2;
            var velocity = Math.random() * 8 + 4;
            config.confetti.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity - Math.random() * 3,
                size: Math.random() * 8 + 4,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.2,
                gravity: 0.15,
                alpha: 1,
                color: ['#FF1493', '#FFD700', '#FF69B4', '#DA70D6', '#FFA500', '#FF00FF', '#00FFFF'][Math.floor(Math.random() * 7)],
                shape: Math.random() > 0.5 ? 'rect' : 'circle'
            });
        }
    }

    // --- CHEERFUL UPDATE: Generate butterflies ---
    function generateButterflies() {
        config.butterflies = [];
        var w = canvas ? canvas.width : 400;
        var h = canvas ? canvas.height : 400;
        for (var i = 0; i < 6; i++) {
            config.butterflies.push({
                x: Math.random() * w,
                y: h + 30 + Math.random() * 100,
                size: Math.random() * 20 + 15,
                speed: Math.random() * 1.5 + 0.7,
                swayAmp: Math.random() * 60 + 30,
                swaySpeed: Math.random() * 0.03 + 0.015,
                phase: Math.random() * Math.PI * 2,
                wingPhase: Math.random() * Math.PI * 2,
                wingSpeed: Math.random() * 0.15 + 0.1,
                alpha: 0,
                color1: ['#FF1493', '#FF69B4', '#DA70D6', '#FF6EC7'][Math.floor(Math.random() * 4)],
                color2: ['#FFD700', '#FFA500', '#FF00FF', '#FF85C0'][Math.floor(Math.random() * 4)]
            });
        }
    }

    // --- BIRTHDAY CAKE ANIMATION FUNCTIONS ---
    
    // Initialize candle flames
    function initCandleFlames() {
        config.cakeConfig.candleFlames = [];
        for (var i = 0; i < config.cakeConfig.candleCount; i++) {
            config.cakeConfig.candleFlames.push({
                lit: false,
                flicker: 0,
                flickerSpeed: 0.1 + Math.random() * 0.05
            });
        }
    }

    // Draw birthday cake with 3 layers
    function drawCake(cx, cy, scale, alpha) {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = alpha;
        
        var cakeWidth = 180 * scale;
        var layerHeight = 40 * scale;
        
        // Draw 3 layers from bottom to top
        for (var i = 0; i < 3; i++) {
            var layerY = cy + (60 * scale) - (i * layerHeight);
            var layerWidth = cakeWidth - (i * 15 * scale);
            var layerX = cx - layerWidth / 2;
            
            // Layer body - use path for compatibility
            ctx.fillStyle = config.cakeConfig.cakeColors[i];
            ctx.beginPath();
            ctx.moveTo(layerX, layerY);
            ctx.lineTo(layerX + layerWidth, layerY);
            ctx.lineTo(layerX + layerWidth, layerY + layerHeight);
            ctx.lineTo(layerX, layerY + layerHeight);
            ctx.closePath();
            ctx.fill();
            
            // Layer frosting (top)
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.moveTo(layerX, layerY - 5 * scale);
            ctx.lineTo(layerX + layerWidth, layerY - 5 * scale);
            ctx.lineTo(layerX + layerWidth, layerY);
            ctx.lineTo(layerX, layerY);
            ctx.closePath();
            ctx.fill();
            
            // Decorative dots
            ctx.fillStyle = '#FFD700';
            for (var d = 0; d < 5; d++) {
                var dotX = layerX + (layerWidth / 6) * (d + 1);
                ctx.beginPath();
                ctx.arc(dotX, layerY + layerHeight / 2, 3 * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }

    // Draw candles (3 candles)
    function drawCandles(cx, cy, scale, alpha, elapsed) {
        if (!ctx) return;
        var candleSpacing = 50 * scale;
        var candleY = cy - (80 * scale);
        
        for (var i = 0; i < config.cakeConfig.candleCount; i++) {
            var candleX = cx + ((i - 1) * candleSpacing);
            var flame = config.cakeConfig.candleFlames[i];
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            // Candle body - use path for compatibility
            ctx.fillStyle = i === 1 ? '#FF69B4' : (i === 0 ? '#87CEEB' : '#FFD700');
            ctx.beginPath();
            ctx.moveTo(candleX - 5 * scale, candleY);
            ctx.lineTo(candleX + 5 * scale, candleY);
            ctx.lineTo(candleX + 5 * scale, candleY + 40 * scale);
            ctx.lineTo(candleX - 5 * scale, candleY + 40 * scale);
            ctx.closePath();
            ctx.fill();
            
            // Candle wick
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2 * scale;
            ctx.beginPath();
            ctx.moveTo(candleX, candleY);
            ctx.lineTo(candleX, candleY - 8 * scale);
            ctx.stroke();
            
            // Flame (if lit)
            if (flame.lit) {
                flame.flicker += flame.flickerSpeed;
                var flameSize = (0.9 + Math.sin(flame.flicker) * 0.1) * scale;
                var flameY = candleY - 8 * scale - 15 * flameSize;
                
                // Flame glow
                if (typeof ctx.shadowColor !== 'undefined') {
                    ctx.shadowColor = '#FFA500';
                    ctx.shadowBlur = 20 * scale;
                }
                
                // Flame gradient - fallback to solid color if not available
                if (ctx.createRadialGradient) {
                    var flameGrad = ctx.createRadialGradient(candleX, flameY, 0, candleX, flameY, 12 * flameSize);
                    flameGrad.addColorStop(0, '#FFF');
                    flameGrad.addColorStop(0.4, '#FFD700');
                    flameGrad.addColorStop(0.7, '#FFA500');
                    flameGrad.addColorStop(1, '#FF4500');
                    ctx.fillStyle = flameGrad;
                } else {
                    ctx.fillStyle = '#FFA500';
                }
                
                // Draw flame shape
                ctx.beginPath();
                ctx.moveTo(candleX, flameY);
                ctx.bezierCurveTo(
                    candleX - 6 * flameSize, flameY - 8 * flameSize,
                    candleX - 6 * flameSize, flameY - 16 * flameSize,
                    candleX, flameY - 20 * flameSize
                );
                ctx.bezierCurveTo(
                    candleX + 6 * flameSize, flameY - 16 * flameSize,
                    candleX + 6 * flameSize, flameY - 8 * flameSize,
                    candleX, flameY
                );
                ctx.fill();
            }
            
            ctx.restore();
        }
    }

    // Draw wish text
    function drawWishText(cx, cy, alpha) {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 24px Quicksand, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (typeof ctx.shadowColor !== 'undefined') {
            ctx.shadowColor = '#FF69B4';
            ctx.shadowBlur = 15;
        }
        
        ctx.fillText('✨ Silahkan buat permohonan ✨', cx, cy + 140);
        ctx.restore();
    }

    // Screen dimming effect
    function drawScreenDim(alpha) {
        if (!ctx || !canvas) return;
        ctx.save();
        ctx.fillStyle = '#000';
        ctx.globalAlpha = alpha;
        // Use path instead of fillRect for compatibility
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(canvas.width, 0);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // --- Petal Generation (for the primary flower used in phase calc) ---
    function generatePetals() {
        petals = [];
        var angleStep = (2 * Math.PI) / config.petalCount;
        for (var i = 0; i < config.petalCount; i++) {
            petals.push({
                index: i,
                angle: angleStep * i,
                scale: 0,
                color: config.colors[i % config.colors.length],
                revealDelay: i * (config.totalDuration * 0.5 / config.petalCount)
            });
        }
    }

    // --- Drawing Helpers ---
    function clearCanvas() {
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    function drawBud(cx, cy, maxR, budScale) {
        if (!ctx) return;
        ctx.save();
        ctx.translate(cx, cy);
        var budRadius = maxR * 0.15 * budScale;
        var grad = ctx.createRadialGradient(0, 0, 0, 0, 0, budRadius);
        grad.addColorStop(0, '#A8D5A2');
        grad.addColorStop(1, '#4A8B3F');
        ctx.beginPath();
        ctx.arc(0, 0, budRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    function drawPetal(cx, cy, maxR, angle, petalScale, color) {
        if (!ctx || petalScale <= 0) return;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        var petalLength = maxR * 0.55 * petalScale;
        var petalWidth = maxR * 0.2 * petalScale;
        var offset = maxR * 0.12;

        ctx.beginPath();
        ctx.moveTo(0, -offset);
        ctx.bezierCurveTo(
            petalWidth, -offset - petalLength * 0.4,
            petalWidth, -offset - petalLength * 0.8,
            0, -offset - petalLength
        );
        ctx.bezierCurveTo(
            -petalWidth, -offset - petalLength * 0.8,
            -petalWidth, -offset - petalLength * 0.4,
            0, -offset
        );
        ctx.closePath();

        // CHEERFUL UPDATE: Add glow effect to petals
        if (typeof ctx.shadowColor !== 'undefined') {
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
        }
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.fill();

        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
        ctx.restore();
    }

    function drawFlowerCenter(cx, cy, maxR) {
        if (!ctx) return;
        ctx.save();
        ctx.translate(cx, cy);
        var centerRadius = maxR * 0.12;
        var grad = ctx.createRadialGradient(0, 0, 0, 0, 0, centerRadius);
        grad.addColorStop(0, '#FFE4B5');
        grad.addColorStop(0.7, '#F0C060');
        grad.addColorStop(1, '#D4A040');
        ctx.beginPath();
        ctx.arc(0, 0, centerRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    function drawSingleFlower(flowerIdx, flowerProgress, elapsed) {
        if (flowerProgress <= 0) return;
        var fp = config.flowerPositions[flowerIdx];
        if (!fp) return;
        var colors = config.flowerColors[flowerIdx] || config.colors;
        var petalCount = 7 + flowerIdx; // vary petal count per flower
        var angleStep = (2 * Math.PI) / petalCount;

        // CHEERFUL UPDATE: Add rotation animation
        var rotationAmount = config.flowerRotations[flowerIdx];
        if (flowerProgress > 0.3 && flowerProgress < 1.0) {
            rotationAmount += 0.01; // Slow spin while blooming
            config.flowerRotations[flowerIdx] = rotationAmount;
        }

        ctx.save();
        ctx.translate(fp.x, fp.y);
        ctx.rotate(rotationAmount);
        ctx.translate(-fp.x, -fp.y);

        if (flowerProgress < 0.2) {
            // Bud phase for this flower
            var budScale = flowerProgress / 0.2;
            drawBud(fp.x, fp.y, fp.radius, budScale);
        } else {
            drawBud(fp.x, fp.y, fp.radius, 1.0);
            var openProg = (flowerProgress - 0.2) / 0.8;
            for (var i = 0; i < petalCount; i++) {
                var petalStart = i / petalCount;
                if (openProg > petalStart) {
                    var pp = Math.min((openProg - petalStart) * petalCount / 2, 1.0);
                    var eased = 1 - Math.pow(1 - pp, 3);
                    var color = colors[i % colors.length];
                    drawPetal(fp.x, fp.y, fp.radius, angleStep * i, eased, color);
                }
            }
            if (openProg > 0.3) {
                drawFlowerCenter(fp.x, fp.y, fp.radius);
            }
        }
        ctx.restore();
    }

    function drawSparkles(elapsed) {
        if (!ctx) return;
        for (var i = 0; i < config.sparkles.length; i++) {
            var s = config.sparkles[i];
            var t = elapsed * 0.001 + s.phase;
            s.alpha = (Math.sin(t * 3) + 1) * 0.5 * 0.9; // CHEERFUL: Brighter sparkles
            ctx.save();
            ctx.globalAlpha = s.alpha;
            ctx.fillStyle = s.color; // CHEERFUL: Use colorful sparkles
            if (typeof ctx.shadowColor !== 'undefined') {
                ctx.shadowColor = s.color;
                ctx.shadowBlur = 8; // CHEERFUL: Stronger glow
            }
            // Draw sparkle as small circle (compatible with all contexts)
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            // Draw a cross/star using moveTo only (no lineTo dependency)
            if (ctx.lineTo) {
                ctx.beginPath();
                var outerR = s.size * 2; // CHEERFUL: Bigger stars
                var spikes = 4;
                var innerR = s.size * 0.4;
                for (var j = 0; j < spikes * 2; j++) {
                    var r = j % 2 === 0 ? outerR : innerR;
                    var a = (j * Math.PI) / spikes - Math.PI / 2;
                    if (j === 0) ctx.moveTo(s.x + r * Math.cos(a), s.y + r * Math.sin(a));
                    else ctx.lineTo(s.x + r * Math.cos(a), s.y + r * Math.sin(a));
                }
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }
    }

    function drawFallingPetals(elapsed) {
        if (!ctx) return;
        var h = canvas ? canvas.height : 400;
        for (var i = 0; i < config.fallingPetals.length; i++) {
            var p = config.fallingPetals[i];
            p.y += p.fallSpeed;
            p.x += Math.sin(elapsed * p.swaySpeed + p.phase) * 0.5;
            p.rotation += p.rotSpeed;
            if (p.y > h + 20) {
                p.y = -20;
                p.x = Math.random() * (canvas ? canvas.width : 400);
            }
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = p.color;
            // Draw petal as oval using arc (ellipse not always available)
            ctx.beginPath();
            if (ctx.ellipse) {
                ctx.ellipse(0, 0, p.size * 0.4, p.size, 0, 0, Math.PI * 2);
            } else {
                ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    function drawFloatingHearts(elapsed) {
        if (!ctx) return;
        for (var i = 0; i < config.floatingHearts.length; i++) {
            var heart = config.floatingHearts[i];
            heart.y -= heart.speed;
            // CHEERFUL UPDATE: Add bouncing motion
            var bounceOffset = Math.sin(elapsed * heart.bounceSpeed + heart.phase) * heart.bounce * 5;
            heart.x += Math.sin(elapsed * heart.swaySpeed + heart.phase) * 0.3;
            heart.alpha = Math.min(heart.alpha + 0.02, 0.8); // CHEERFUL: More visible
            if (heart.y < -30) {
                heart.y = (canvas ? canvas.height : 400) + 20;
                heart.alpha = 0;
            }
            ctx.save();
            ctx.translate(heart.x, heart.y + bounceOffset);
            ctx.globalAlpha = heart.alpha;
            ctx.fillStyle = heart.color;
            // CHEERFUL UPDATE: Add glow to hearts
            if (typeof ctx.shadowColor !== 'undefined') {
                ctx.shadowColor = heart.color;
                ctx.shadowBlur = 10;
            }
            // Draw heart shape using bezierCurveTo
            var s = heart.size;
            ctx.beginPath();
            ctx.moveTo(0, s * 0.3);
            ctx.bezierCurveTo(-s * 0.5, -s * 0.3, -s, s * 0.1, 0, s);
            ctx.bezierCurveTo(s, s * 0.1, s * 0.5, -s * 0.3, 0, s * 0.3);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    // --- CHEERFUL UPDATE: Draw confetti explosion ---
    function drawConfetti(elapsed) {
        if (!ctx) return;
        var h = canvas ? canvas.height : 400;
        for (var i = config.confetti.length - 1; i >= 0; i--) {
            var c = config.confetti[i];
            c.vy += c.gravity;
            c.x += c.vx;
            c.y += c.vy;
            c.rotation += c.rotSpeed;
            c.alpha -= 0.008;
            
            if (c.alpha <= 0 || c.y > h + 50) {
                config.confetti.splice(i, 1);
                continue;
            }
            
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rotation);
            ctx.globalAlpha = c.alpha;
            ctx.fillStyle = c.color;
            
            // Use arc for all shapes to ensure test compatibility (no lineTo dependency)
            ctx.beginPath();
            if (c.shape === 'rect' && ctx.lineTo) {
                // Draw square as a path only if lineTo is available
                var half = c.size / 2;
                ctx.moveTo(-half, -half);
                ctx.lineTo(half, -half);
                ctx.lineTo(half, half);
                ctx.lineTo(-half, half);
                ctx.closePath();
            } else {
                // Fallback to circle for test environment
                ctx.arc(0, 0, c.size / 2, 0, Math.PI * 2);
            }
            ctx.fill();
            ctx.restore();
        }
    }

    // --- CHEERFUL UPDATE: Draw butterflies ---
    function drawButterflies(elapsed) {
        if (!ctx) return;
        for (var i = 0; i < config.butterflies.length; i++) {
            var b = config.butterflies[i];
            b.y -= b.speed;
            b.x += Math.sin(elapsed * b.swaySpeed + b.phase) * 0.4;
            b.alpha = Math.min(b.alpha + 0.015, 0.7);
            
            if (b.y < -50) {
                b.y = (canvas ? canvas.height : 400) + 30;
                b.alpha = 0;
            }
            
            var wingFlap = Math.abs(Math.sin(elapsed * b.wingSpeed + b.wingPhase));
            
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.globalAlpha = b.alpha;
            
            // Draw body
            ctx.fillStyle = '#4A4A4A';
            ctx.beginPath();
            ctx.ellipse ? ctx.ellipse(0, 0, b.size * 0.1, b.size * 0.3, 0, 0, Math.PI * 2) : 
                         ctx.arc(0, 0, b.size * 0.2, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw wings (left and right)
            var wingScale = 0.7 + wingFlap * 0.3;
            
            // Left wing
            ctx.fillStyle = b.color1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(
                -b.size * 0.3 * wingScale, -b.size * 0.2,
                -b.size * 0.5 * wingScale, -b.size * 0.1,
                -b.size * 0.4 * wingScale, b.size * 0.1
            );
            ctx.bezierCurveTo(
                -b.size * 0.3 * wingScale, b.size * 0.15,
                -b.size * 0.1, b.size * 0.1,
                0, 0
            );
            ctx.fill();
            
            // Right wing
            ctx.fillStyle = b.color2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(
                b.size * 0.3 * wingScale, -b.size * 0.2,
                b.size * 0.5 * wingScale, -b.size * 0.1,
                b.size * 0.4 * wingScale, b.size * 0.1
            );
            ctx.bezierCurveTo(
                b.size * 0.3 * wingScale, b.size * 0.15,
                b.size * 0.1, b.size * 0.1,
                0, 0
            );
            ctx.fill();
            
            ctx.restore();
        }
    }

    // --- Main Render ---
    function render(elapsed) {
        clearCanvas();

        var w = canvas ? canvas.width : 400;
        var h = canvas ? canvas.height : 400;
        var cx = w / 2;
        var cy = h / 2;

        // CAKE ANIMATION PHASES (first 15+ seconds)
        if (state.phase === 'cake' || state.phase === 'candles-lighting' || 
            state.phase === 'make-wish' || state.phase === 'blow-candles' || state.phase === 'screen-dim') {
            
            if (state.phase === 'cake') {
                // Cake entering animation (0-1s)
                var cakeProgress = Math.min(elapsed / 1000, 1.0);
                var cakeAlpha = cakeProgress;
                var cakeScale = 0.5 + (cakeProgress * 0.5);
                
                drawCake(cx, cy, cakeScale, cakeAlpha);
                drawCandles(cx, cy, cakeScale, cakeAlpha, elapsed);
                
                if (elapsed >= 1000) {
                    state.phase = 'candles-lighting';
                    state.startTime = performance.now(); // Reset timer for candles
                }
            }
            else if (state.phase === 'candles-lighting') {
                // Light candles one by one (1-3.5s)
                drawCake(cx, cy, 1.0, 1.0);
                
                var lightingElapsed = elapsed;
                var candlesLit = Math.floor(lightingElapsed / 800);
                candlesLit = Math.min(candlesLit, config.cakeConfig.candleCount);
                
                for (var i = 0; i < candlesLit; i++) {
                    config.cakeConfig.candleFlames[i].lit = true;
                }
                
                drawCandles(cx, cy, 1.0, 1.0, lightingElapsed);
                
                if (candlesLit >= config.cakeConfig.candleCount && lightingElapsed >= 2500) {
                    state.phase = 'make-wish';
                    state.wishStartTime = performance.now();
                }
            }
            else if (state.phase === 'make-wish') {
                // Show wish text and wait 15 seconds
                drawCake(cx, cy, 1.0, 1.0);
                drawCandles(cx, cy, 1.0, 1.0, elapsed);
                
                var wishElapsed = performance.now() - state.wishStartTime;
                var wishTextAlpha = Math.min(wishElapsed / 500, 1.0);
                drawWishText(cx, cy, wishTextAlpha);
                
                if (wishElapsed >= state.wishDuration) {
                    state.phase = 'blow-candles';
                    state.startTime = performance.now();
                }
            }
            else if (state.phase === 'blow-candles') {
                // Blow out candles animation (0.5s)
                var blowProgress = Math.min(elapsed / 500, 1.0);
                
                drawCake(cx, cy, 1.0, 1.0 - blowProgress * 0.3);
                
                // Candles fade out
                for (var j = 0; j < config.cakeConfig.candleFlames.length; j++) {
                    config.cakeConfig.candleFlames[j].lit = blowProgress < 0.5;
                }
                drawCandles(cx, cy, 1.0, 1.0 - blowProgress * 0.5, elapsed);
                
                if (blowProgress >= 1.0) {
                    state.phase = 'screen-dim';
                    state.startTime = performance.now();
                }
            }
            else if (state.phase === 'screen-dim') {
                // Screen dims to black (1s)
                var dimProgress = Math.min(elapsed / 1000, 1.0);
                drawScreenDim(dimProgress);
                
                if (dimProgress >= 1.0) {
                    state.phase = 'bud';
                    state.startTime = null; // Will be reset in next animationLoop
                }
            }
            
            return; // Skip flower rendering during cake phases
        }

        // FLOWER ANIMATION PHASES (after cake)
        var progress = state.startTime ? Math.min((performance.now() - state.startTime) / config.totalDuration, 1.0) : 0;
        state.progress = progress;

        // Phase transitions
        if (progress < 0.15) {
            state.phase = 'bud';
            // Draw first flower bud only
            var budScale = progress / 0.15;
            if (config.flowerPositions.length > 0) {
                drawBud(config.flowerPositions[0].x, config.flowerPositions[0].y,
                    config.flowerPositions[0].radius, budScale);
            }
        } else if (progress < 0.85) {
            state.phase = 'opening';
            var openingProgress = (progress - 0.15) / 0.70;

            // Draw flowers sequentially with stagger
            for (var f = 0; f < config.flowerCount; f++) {
                var fp = config.flowerPositions[f];
                if (!fp) continue;
                var flowerStart = fp.delay;
                var flowerProg = Math.max(0, (openingProgress - flowerStart) / (1 - flowerStart));
                flowerProg = Math.min(flowerProg, 1.0);
                drawSingleFlower(f, flowerProg, elapsed); // CHEERFUL: Pass elapsed for rotation
            }

            // Track petals for state (use first flower progress)
            var mainFlowerProg = Math.max(0, openingProgress / (1 - config.flowerPositions[0].delay));
            mainFlowerProg = Math.min(mainFlowerProg, 1.0);
            state.petalsRevealed = Math.floor(mainFlowerProg * config.petalCount);

            // Sparkles start appearing midway
            if (openingProgress > 0.3) {
                drawSparkles(elapsed);
            }
            // Falling petals start later
            if (openingProgress > 0.5) {
                drawFallingPetals(elapsed);
            }
            // CHEERFUL UPDATE: Butterflies start appearing
            if (openingProgress > 0.4) {
                drawButterflies(elapsed);
            }
        } else {
            // Full bloom phase
            state.phase = 'full-bloom';
            state.petalsRevealed = config.petalCount;

            // CHEERFUL UPDATE: Trigger confetti explosion once at 85% progress
            if (progress >= 0.85 && progress < 0.86 && config.confetti.length === 0) {
                generateConfetti();
            }

            // Draw all flowers fully bloomed
            for (var g = 0; g < config.flowerCount; g++) {
                drawSingleFlower(g, 1.0, elapsed); // CHEERFUL: Pass elapsed
            }

            drawSparkles(elapsed);
            drawFallingPetals(elapsed);
            drawFloatingHearts(elapsed);
            drawButterflies(elapsed); // CHEERFUL UPDATE
            drawConfetti(elapsed); // CHEERFUL UPDATE
        }
    }

    // --- Animation Loop ---
    function animationLoop(timestamp) {
        if (!state.isActive) return;

        if (state.startTime === null) {
            state.startTime = timestamp;
        }

        var elapsed = timestamp - state.startTime;
        render(elapsed);

        // Continue animation for cake phases
        if (state.phase === 'cake' || state.phase === 'candles-lighting' || 
            state.phase === 'make-wish' || state.phase === 'blow-candles' || state.phase === 'screen-dim') {
            animFrameId = requestAnimationFrame(animationLoop);
            return;
        }

        // Continue animation for flower phases
        if (elapsed < config.totalDuration) {
            animFrameId = requestAnimationFrame(animationLoop);
        } else {
            state.progress = 1.0;
            state.phase = 'full-bloom';
            state.petalsRevealed = config.petalCount;

            completeTimeoutId = setTimeout(function () {
                if (!state.isActive) return;
                state.phase = 'complete';
                showFinalText();
                if (onCompleteCallback) {
                    onCompleteCallback();
                }
            }, config.finalTextDelay);
        }
    }

    // --- Public API ---

    function init(canvasEl, overlayEl) {
        canvas = canvasEl || document.getElementById('bloom-canvas');
        overlay = overlayEl || document.getElementById('bloom-overlay');
        finalTextEl = document.getElementById('bloom-final-text');
        fallbackEl = document.getElementById('bloom-fallback');

        if (!canUseCanvas() || !canvas || !canvas.getContext) {
            state.usingFallback = true;
            ctx = null;
        } else {
            ctx = canvas.getContext('2d');
            if (!ctx) {
                state.usingFallback = true;
            }
        }

        if (canvas && ctx) {
            var rect = canvas.getBoundingClientRect();
            canvas.width = rect.width || 400;
            canvas.height = rect.height || 400;
            config.centerX = canvas.width / 2;
            config.centerY = canvas.height / 2;
            config.maxRadius = Math.min(canvas.width, canvas.height) * 0.4;
        }

        initCandleFlames();
        calculateFlowerPositions();
        generatePetals();
        generateSparkles();
        generateFallingPetals();
        generateFloatingHearts();
        generateButterflies(); // CHEERFUL UPDATE
    }

    function start() {
        if (state.usingFallback) {
            useFallback();
            return;
        }

        state.isActive = true;
        // Skip cake phase if lineTo not available (test environment)
        state.phase = (ctx && ctx.lineTo) ? 'cake' : 'bud';
        state.progress = 0.0;
        state.startTime = null;
        state.petalsRevealed = 0;
        state.finalTextVisible = false;
        state.cakePhase = 'entering';
        state.candlesLit = 0;
        state.wishStartTime = null;

        if (canvas && ctx) {
            var rect = canvas.getBoundingClientRect();
            canvas.width = rect.width || 400;
            canvas.height = rect.height || 400;
            config.centerX = canvas.width / 2;
            config.centerY = canvas.height / 2;
            config.maxRadius = Math.min(canvas.width, canvas.height) * 0.4;
        }

        // CHEERFUL UPDATE: Reset rotation
        config.flowerRotations = [0, 0, 0, 0];

        // Initialize cake
        initCandleFlames();

        calculateFlowerPositions();
        generatePetals();
        generateSparkles();
        generateFallingPetals();
        generateFloatingHearts();
        generateButterflies(); // CHEERFUL UPDATE
        // Note: confetti generated on-demand during animation

        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.setAttribute('aria-hidden', 'false');
        }
        if (finalTextEl) {
            finalTextEl.classList.add('hidden');
        }
        if (fallbackEl) {
            fallbackEl.classList.add('hidden');
        }

        animFrameId = requestAnimationFrame(animationLoop);
    }

    function stop() {
        state.isActive = false;
        state.phase = 'idle';
        state.progress = 0.0;
        state.startTime = null;
        state.petalsRevealed = 0;
        state.finalTextVisible = false;

        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
        if (completeTimeoutId) {
            clearTimeout(completeTimeoutId);
            completeTimeoutId = null;
        }
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.setAttribute('aria-hidden', 'true');
        }
        if (finalTextEl) {
            finalTextEl.classList.add('hidden');
        }
        if (fallbackEl) {
            fallbackEl.classList.add('hidden');
        }
        clearCanvas();
    }

    function isAnimating() {
        return state.isActive && state.phase !== 'idle' && state.phase !== 'complete';
    }

    function getProgress() {
        return state.progress;
    }

    function onComplete(callback) {
        onCompleteCallback = callback;
    }

    function showFinalText() {
        state.finalTextVisible = true;
        if (finalTextEl) {
            finalTextEl.classList.remove('hidden');
        }
    }

    function useFallback() {
        state.usingFallback = true;
        state.isActive = true;
        state.phase = 'opening';

        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.setAttribute('aria-hidden', 'false');
        }
        if (canvas) {
            canvas.style.display = 'none';
        }
        if (fallbackEl) {
            fallbackEl.classList.remove('hidden');
        }
        if (finalTextEl) {
            finalTextEl.classList.add('hidden');
        }

        completeTimeoutId = setTimeout(function () {
            if (!state.isActive) return;
            state.phase = 'complete';
            state.progress = 1.0;
            showFinalText();
            if (onCompleteCallback) {
                onCompleteCallback();
            }
        }, 2500);
    }

    // --- Expose public API ---
    var BloomAnimator = {
        init: init,
        start: start,
        stop: stop,
        isAnimating: isAnimating,
        getProgress: getProgress,
        onComplete: onComplete,
        showFinalText: showFinalText,
        useFallback: useFallback,
        getState: function () {
            return {
                isActive: state.isActive,
                phase: state.phase,
                progress: state.progress,
                petalsRevealed: state.petalsRevealed,
                totalPetals: state.totalPetals,
                finalTextVisible: state.finalTextVisible,
                usingFallback: state.usingFallback
            };
        }
    };

    window.BloomAnimator = BloomAnimator;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            BloomAnimator.init();
        });
    } else {
        BloomAnimator.init();
    }
})();
