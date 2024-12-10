class Background {
    constructor(canvasId, palette) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas || !(this.canvas instanceof HTMLCanvasElement)) {
            throw new Error(`Canvas element with id '${canvasId}' not found or is not a canvas`);
        }
        this.ctx = this.canvas.getContext('2d');
        this.palette = palette;
        this.resizeTimeoutId = null;
        this.palette = palette || ['26, 0, 55', '59, 1, 86', '79, 0, 130'];  // Default palette using comma-separated values
        this.initializeCanvas();
        this.addEventListeners();
        this.animate();
    }

    initializeCanvas() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.gradientPoints = this.createGradientPoints();
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        if (this.resizeTimeoutId) {
            clearTimeout(this.resizeTimeoutId);
        }

        this.resizeTimeoutId = setTimeout(() => {
            this.initializeCanvas();
        }, 300); // Increased delay for smoother transition
    }

    createGradientPoints() {
        return [
            { x: 0, y: 0, vx: 0.015, vy: 0.01, ax: 0, ay: 0 },
            { x: this.width, y: 0, vx: -0.01, vy: 0.015, ax: 0, ay: 0 },
            { x: this.width, y: this.height, vx: -0.015, vy: -0.01, ax: 0, ay: 0 },
            { x: 0, y: this.height, vx: 0.01, vy: -0.015, ax: 0, ay: 0 }
        ];
    }

    animate() {
        const dampening = 0.995; // Increased dampening for smoother movement
        const maxSpeed = 0.02;   // Reduced max speed for gentler motion
        const padding = 150;     // Increased padding for softer edges
        const acceleration = 0.00005; // Reduced acceleration for smoother changes

        this.gradientPoints.forEach(point => {
            point.ax = (Math.random() - 0.5) * acceleration;
            point.ay = (Math.random() - 0.5) * acceleration;
            point.vx = (point.vx + point.ax) * dampening;
            point.vy = (point.vy + point.ay) * dampening;

            point.vx = Math.max(-maxSpeed, Math.min(maxSpeed, point.vx));
            point.vy = Math.max(-maxSpeed, Math.min(maxSpeed, point.vy));

            point.x += point.vx;
            point.y += point.vy;

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

        const centerX = (this.gradientPoints[0].x + this.gradientPoints[2].x) / 2;
        const centerY = (this.gradientPoints[0].y + this.gradientPoints[2].y) / 2;
        const radius = Math.hypot(this.width, this.height) * 0.9; // Increased radius
        
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, radius * 0.02, // Smaller inner radius for softer center
            centerX, centerY, radius
        );

        this.palette.forEach((color, index) => {
            const position = index / (this.palette.length - 1);
            // Smoother opacity transition with higher base opacity
            const opacity = 0.8 + position * 0.2;
            gradient.addColorStop(position, `rgba(${color}, ${opacity})`);
        });

        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        requestAnimationFrame(() => this.animate());
    }
}
