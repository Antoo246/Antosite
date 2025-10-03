/**
 * Background Component
 * Animated starfield background with connections and shooting stars
 */

export class Background {
  static DEFAULT_PALETTE = [
    "26, 0, 55",
    "59, 1, 86",
    "79, 0, 130",
    "147, 0, 255",
    "68, 0, 255",
  ];

  static DEFAULT_SETTINGS = {
    starCount: 250,
    starSize: { min: 0.5, max: 2.8 },
    starGlowOpacity: 0.1,
    moveSpeed: 0.05,
    connection: {
      distance: 110,
      lineWidth: 0.8,
    },
    parallaxStrength: 0.5,
    pulsatingStars: {
      enabled: true,
      speed: 0.2,
      intensity: 0.3,
    },
    shootingStars: {
      enabled: true,
      probability: 0.001,
      speed: 15,
      length: 150,
      lineWidth: 1.8,
    },
    mouseInteraction: {
      enabled: false,
      distance: 150,
    },
    performanceMode: {
      enabled: false,
      reducedStars: 100,
      reducedConnections: 50,
      disabledShootingStars: false,
    },
  };

  static TWO_PI = Math.PI * 2;

  constructor(canvasId, palette, userSettings = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas)
      throw new Error(`Canvas with id '${canvasId}' not found.`);

    this.ctx = this.canvas.getContext("2d");

    // Performance optimization variables
    this.lastUpdateTime = 0;
    this.resizeTimeout = null;

    // Merge settings with defaults
    this.settings = { ...Background.DEFAULT_SETTINGS, ...userSettings };
    this.palette = palette || Background.DEFAULT_PALETTE;

    // Initialize other properties
    this.time = 0;
    this.animationFrame = null;
    this.mouse = { x: 0, y: 0, active: false };
    this.stars = [];
    this.shootingStars = [];
    this.spatialGrid = new Map();
    this.gridCellSize = 50;

    console.log("Starfield background initialized with performance optimizations");
    this._initialize();
  }

  _initialize() {
    this.handleResize = this._debounce(this._setupCanvas.bind(this), 250);
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleMouseLeave = this._handleMouseLeave.bind(this);

    window.addEventListener("resize", this.handleResize);
    if (this.settings.mouseInteraction.enabled) {
      this.canvas.addEventListener("mousemove", this._handleMouseMove);
      this.canvas.addEventListener("mouseleave", this._handleMouseLeave);
    }

    this._setupCanvas();
    this.animate();
  }

  _handleMouseMove(e) {
    this.mouse = { ...this.mouse, x: e.clientX, y: e.clientY, active: true };
  }

  _handleMouseLeave() {
    this.mouse.active = false;
  }

  _generateStars() {
    // Adjust star count based on performance mode and screen size
    let starCount = this.settings.starCount;

    if (this.settings.performanceMode.enabled) {
      starCount = Math.min(starCount, this.settings.performanceMode.reducedStars);
    } else {
      // Responsive star count based on screen size
      const screenArea = this.canvas.width * this.canvas.height;
      if (screenArea < 768 * 1024) { // Mobile/tablet
        starCount = Math.min(starCount, 150);
      } else if (screenArea < 1920 * 1080) { // Desktop
        starCount = Math.min(starCount, 200);
      }
      // Keep full count for larger screens
    }

    this.stars = Array.from({ length: starCount }, () => {
      const depth = Math.pow(Math.random(), 2);
      const origin = {
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
      };

      return {
        origin,
        pos: { ...origin },
        size: this.settings.starSize.min + depth * (this.settings.starSize.max - this.settings.starSize.min),
        depth,
        phaseX: Math.random() * Background.TWO_PI,
        phaseY: Math.random() * Background.TWO_PI,
        pulsePhase: Math.random() * Background.TWO_PI,
        opacity: 0.4 + depth * 0.5,
        color: this.palette[Math.floor(Math.random() * this.palette.length)],
      };
    });
  }

  _drawBackground() {
    const { ctx, canvas, palette, time } = this;
    const t = time * 0.05;

    const color1 = `rgb(${palette[0]})`;
    const color2 = `rgb(${palette[1 % palette.length]})`;
    const color3 = `rgb(${palette[2 % palette.length]})`;

    const x0 = canvas.width * (0.5 + 0.5 * Math.sin(t * 0.5));
    const y0 = canvas.height * (0.5 + 0.5 * Math.cos(t * 0.3));
    const x1 = canvas.width * (0.5 - 0.5 * Math.sin(t * 0.7));
    const y1 = canvas.height * (0.5 - 0.5 * Math.cos(t * 0.4));

    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(0.5, color2);
    gradient.addColorStop(1, color3);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  _drawConnections() {
    const { distance, lineWidth } = this.settings.connection;
    this.ctx.lineWidth = lineWidth;
    const connectionColor = this.palette[3 % this.palette.length];

    // Performance optimization: limit connections in performance mode
    const maxConnections = this.settings.performanceMode.enabled ?
      this.settings.performanceMode.reducedConnections : Infinity;
    let connectionCount = 0;

    for (const star1 of this.stars) {
      if (connectionCount >= maxConnections) break;

      const gridX = Math.floor(star1.pos.x / this.gridCellSize);
      const gridY = Math.floor(star1.pos.y / this.gridCellSize);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (connectionCount >= maxConnections) break;

          const key = `${gridX + dx},${gridY + dy}`;
          if (this.spatialGrid.has(key)) {
            for (const star2 of this.spatialGrid.get(key)) {
              if (star1 === star2 || connectionCount >= maxConnections) continue;
              const dist = Math.hypot(star1.pos.x - star2.pos.x, star1.pos.y - star2.pos.y);
              if (dist < distance) {
                const opacity = Math.pow(1 - dist / distance, 2) * 0.7;
                this.ctx.beginPath();
                this.ctx.strokeStyle = `rgba(${connectionColor}, ${opacity})`;
                this.ctx.moveTo(star1.pos.x, star1.pos.y);
                this.ctx.lineTo(star2.pos.x, star2.pos.y);
                this.ctx.stroke();
                connectionCount++;
              }
            }
          }
        }
      }
    }
  }

  _setupCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Dynamic star count based on screen size and performance mode
    const area = this.canvas.width * this.canvas.height;
    let baseStarCount = Math.max(50, Math.min(500, Math.floor(area / 8000)));

    if (this.settings.performanceMode.enabled) {
      baseStarCount = Math.min(baseStarCount, this.settings.performanceMode.reducedStars);
    }

    this.settings.starCount = baseStarCount;

    // Dynamic connection distance for performance
    this.settings.connection.distance = Math.max(60, Math.min(150, Math.floor(Math.sqrt(area) / 10)));

    this._generateStars();
  }

  _spawnShootingStar() {
    const t = Math.random() < 0.5 ? Math.random() * this.canvas.width : Math.random() < 0.5 ? -200 : this.canvas.width + 200;
    const e = Math.random() < 0.5 ? (Math.random() < 0.5 ? -200 : this.canvas.height + 200) : Math.random() * this.canvas.height;
    const angle = Math.random() < 0.5
      ? Math.PI * (0.25 + Math.random() * 0.5)
      : Math.PI * (1.25 + Math.random() * 0.5);

    this.shootingStars.push({
      pos: { x: t, y: e },
      angle,
      speed: this.settings.shootingStars.speed * (0.5 + Math.random() * 0.5),
      color: this.palette[Math.floor(Math.random() * this.palette.length)],
    });
  }

  _updateSpatialGrid() {
    this.spatialGrid.clear();
    this.stars.forEach((star) => {
      const key = `${Math.floor(star.pos.x / this.gridCellSize)},${Math.floor(star.pos.y / this.gridCellSize)}`;
      if (!this.spatialGrid.has(key)) this.spatialGrid.set(key, []);
      this.spatialGrid.get(key).push(star);
    });
  }

  update() {
    const t = this.time;
    const e = t * this.settings.moveSpeed;

    // Update stars positions
    this.stars.forEach((star) => {
      const parallax = 1 + star.depth * this.settings.parallaxStrength;
      const offsetX = Math.sin(e * parallax + star.phaseX) * 20 * star.depth;
      const offsetY = Math.cos(e * parallax + star.phaseY) * 20 * star.depth;

      star.pos.x = star.origin.x + offsetX;
      star.pos.y = star.origin.y + offsetY;

      if (star.pos.x < 0) star.origin.x += this.canvas.width;
      if (star.pos.x > this.canvas.width) star.origin.x -= this.canvas.width;
      if (star.pos.y < 0) star.origin.y += this.canvas.height;
      if (star.pos.y > this.canvas.height) star.origin.y -= this.canvas.height;
    });

    this._updateSpatialGrid();


        // Spawn shooting stars based on the defined probability
    if (this.settings.shootingStars.enabled && Math.random() < this.settings.shootingStars.probability) {
      this._spawnShootingStar();
    }

    // Update shooting stars position and remove those out of bounds
    this.shootingStars.forEach((shootingStar, index) => {
      shootingStar.pos.x += Math.cos(shootingStar.angle) * shootingStar.speed;
      shootingStar.pos.y += Math.sin(shootingStar.angle) * shootingStar.speed;

      if (
        shootingStar.pos.x < -200 ||
        shootingStar.pos.x > this.canvas.width + 200 ||
        shootingStar.pos.y < -200 ||
        shootingStar.pos.y > this.canvas.height + 200
      ) {
        this.shootingStars.splice(index, 1); // Remove out of bounds shooting star
      }
    });
  }

  draw() {
    // Clear the canvas before drawing new frames
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw the background gradient
    this.ctx.globalCompositeOperation = "source-over";
    this._drawBackground();

    // Draw stars and connections
    this.ctx.globalCompositeOperation = "screen";
    this._drawConnections();

    // If mouse interaction is enabled, draw connections to mouse position
    if (this.settings.mouseInteraction.enabled && this.mouse.active) {
      this._drawMouseConnections();
    }

    // Draw shooting stars if enabled
    if (this.settings.shootingStars.enabled) {
      this.shootingStars.forEach((shootingStar) => this._drawShootingStar(shootingStar));
    }

    // Draw stars with their pulsing effect
    this.stars.forEach((star) => this._drawStar(star));
  }

  _drawStar(star) {
    const { pos, opacity, color } = star;
    let size = star.size;
    const pulseFactor = Math.sin(this.time * this.settings.pulsatingStars.speed + star.pulsePhase);
    const pulseAmount = this.settings.pulsatingStars.intensity * star.depth;

    // Apply pulsating effect if enabled
    if (this.settings.pulsatingStars.enabled) {
      size *= 1 + pulseFactor * pulseAmount;
    }

    const gradientRadius = size * 5;
    const radialGradient = this.ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, gradientRadius);

    radialGradient.addColorStop(0, `rgba(${color}, ${opacity * this.settings.starGlowOpacity})`);
    radialGradient.addColorStop(1, `rgba(${color}, 0)`);

    // Draw the star's glowing effect
    this.ctx.fillStyle = radialGradient;
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, gradientRadius, 0, Background.TWO_PI);
    this.ctx.fill();

    // Draw the star's core
    this.ctx.fillStyle = `rgba(${color}, ${opacity})`;
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, size, 0, Background.TWO_PI);
    this.ctx.fill();
  }

  _drawMouseConnections() {
    const distance = this.settings.mouseInteraction.distance;
    const connectionColor = `rgb(${this.palette[3 % this.palette.length]})`;

    // Get grid coordinates of the mouse position
    const gridX = Math.floor(this.mouse.x / this.gridCellSize);
    const gridY = Math.floor(this.mouse.y / this.gridCellSize);

    // Loop through nearby grid cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${gridX + dx},${gridY + dy}`;
        if (this.spatialGrid.has(key)) {
          for (const star of this.spatialGrid.get(key)) {
            const dist = Math.hypot(this.mouse.x - star.pos.x, this.mouse.y - star.pos.y);
            if (dist < distance) {
              const opacity = Math.pow(1 - dist / distance, 3);
              this.ctx.beginPath();
              this.ctx.strokeStyle = `rgba(${connectionColor}, ${opacity})`;
              this.ctx.lineWidth = this.settings.connection.lineWidth;
              this.ctx.moveTo(this.mouse.x, this.mouse.y);
              this.ctx.lineTo(star.pos.x, star.pos.y);
              this.ctx.stroke();
            }
          }
        }
      }
    }
  }

  _drawShootingStar(shootingStar) {
    const { length, lineWidth } = this.settings.shootingStars;
    const endX = shootingStar.pos.x - Math.cos(shootingStar.angle) * length;
    const endY = shootingStar.pos.y - Math.sin(shootingStar.angle) * length;
    const gradient = this.ctx.createLinearGradient(shootingStar.pos.x, shootingStar.pos.y, endX, endY);

    gradient.addColorStop(0, `rgba(${shootingStar.color}, 1)`);
    gradient.addColorStop(1, `rgba(${shootingStar.color}, 0)`);

    this.ctx.beginPath();
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = lineWidth;
    this.ctx.moveTo(shootingStar.pos.x, shootingStar.pos.y);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
  }

  animate() {
    this.time += 0.01;

    // Performance optimization: reduce update frequency on slower devices
    const now = performance.now();
    if (!this.lastUpdateTime || now - this.lastUpdateTime > (this.settings.performanceMode.enabled ? 32 : 16)) { // ~30fps or ~60fps
      this.update();
      this.lastUpdateTime = now;
    }

    this.draw();
    this.animationFrame = requestAnimationFrame(this.animate.bind(this));
  }

  destroy() {
    window.removeEventListener("resize", this.handleResize);
    this.canvas.removeEventListener("mousemove", this._handleMouseMove);
    this.canvas.removeEventListener("mouseleave", this._handleMouseLeave);

    // Clean up performance optimization resources
    if (this.resizeTimeout) {
      cancelAnimationFrame(this.resizeTimeout);
    }
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    console.log("Starfield animation stopped and resources cleaned up.");
  }

  // Debounce function to limit the rate of resizing
  _debounce(func, wait) {
    let timeout;
    let lastCall = 0;
    return (...args) => {
      const now = performance.now();
      if (now - lastCall >= wait) {
        lastCall = now;
        func.apply(this, args);
      } else {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          lastCall = performance.now();
          func.apply(this, args);
        }, wait - (now - lastCall));
      }
    };
  }
}
