class Background {
    constructor(canvasId, palette) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas || !(this.canvas instanceof HTMLCanvasElement)) {
            throw new Error(`Canvas element with id '${canvasId}' not found or is not a canvas`);
        }
        this.ctx = this.canvas.getContext('2d');
        this.palette = Array.isArray(palette) && palette.length 
            ? palette 
            : ['26, 0, 55', '59, 1, 86', '79, 0, 130'];
        this.resizeTimeoutId = null;

        this.settings = {
            dampening: 0.995,
            maxSpeed: 0.02,
            padding: 150,
            acceleration: 0.00005
        };

        // Bind methods for event listeners
        this.handleResize = this.handleResize.bind(this);

        this.initializeCanvas();
        this.addEventListeners();
        requestAnimationFrame(() => this.animate());
    }

    initializeCanvas() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.gradientPoints = this.createGradientPoints();
    }

    addEventListeners() {
        window.addEventListener('resize', this.handleResize);
    }

    handleResize() {
        if (this.resizeTimeoutId) {
            clearTimeout(this.resizeTimeoutId);
        }
        // Debounce resize events
        this.resizeTimeoutId = setTimeout(() => {
            this.initializeCanvas();
        }, 300);
    }

    createGradientPoints() {
        return [
            { x: 0, y: 0, vx: 0.015, vy: 0.01 },
            { x: this.width, y: 0, vx: -0.01, vy: 0.015 },
            { x: this.width, y: this.height, vx: -0.015, vy: -0.01 },
            { x: 0, y: this.height, vx: 0.01, vy: -0.015 }
        ];
    }

    updatePoints() {
        const { dampening, maxSpeed, padding, acceleration } = this.settings;
        this.gradientPoints.forEach(point => {
            // Add small random acceleration
            const ax = (Math.random() - 0.5) * acceleration;
            const ay = (Math.random() - 0.5) * acceleration;
            point.vx = (point.vx + ax) * dampening;
            point.vy = (point.vy + ay) * dampening;

            // Clamp velocity
            point.vx = Math.max(-maxSpeed, Math.min(maxSpeed, point.vx));
            point.vy = Math.max(-maxSpeed, Math.min(maxSpeed, point.vy));

            // Update position
            point.x += point.vx;
            point.y += point.vy;

            // Keep within padded area
            if (point.x <= padding) {
                point.vx = Math.abs(point.vx) * dampening;
                point.x = padding;
            } else if (point.x >= this.width - padding) {
                point.vx = -Math.abs(point.vx) * dampening;
                point.x = this.width - padding;
            }
            if (point.y <= padding) {
                point.vy = Math.abs(point.vy) * dampening;
                point.y = padding;
            } else if (point.y >= this.height - padding) {
                point.vy = -Math.abs(point.vy) * dampening;
                point.y = this.height - padding;
            }
        });
    }

    createGradient() {
        // Compute radial gradient centered at mid-point of diagonal points
        const centerX = (this.gradientPoints[0].x + this.gradientPoints[2].x) / 2;
        const centerY = (this.gradientPoints[0].y + this.gradientPoints[2].y) / 2;
        const radius = Math.hypot(this.width, this.height) * 0.9;

        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, radius * 0.02,
            centerX, centerY, radius
        );

        // Evenly space color stops
        this.palette.forEach((color, index) => {
            const position = index / (this.palette.length - 1);
            const opacity = 0.8 + position * 0.2;
            gradient.addColorStop(position, `rgba(${color}, ${opacity})`);
        });

        return gradient;
    }

    render() {
        this.ctx.globalCompositeOperation = 'source-over';
        const gradient = this.createGradient();
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    animate() {
        this.updatePoints();
        this.render();
        requestAnimationFrame(() => this.animate());
    }
}
