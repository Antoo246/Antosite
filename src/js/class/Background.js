class Background {
  static DEFAULT_PALETTE = [
    "26, 0, 55",
    "59, 1, 86",
    "79, 0, 130",
    "147, 0, 255",
    "68, 0, 255",
  ];

  static DEFAULT_SETTINGS = {
    splashCount: 30,
    minVertices: 6,
    maxVertices: 12,
    amplitude: 10,
    fps: 60,
    moveSpeed: 4,
    maxMovement: 100,
  };

  static FULLSCREEN_EVENTS = [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "MSFullscreenChange",
  ];

  constructor(canvasId, palette, userSettings = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!(this.canvas instanceof HTMLCanvasElement)) {
      throw new Error(`Canvas element with id '${canvasId}' not found.`);
    }

    this.ctx = this.canvas.getContext("2d");
    this.palette =
      Array.isArray(palette) && palette.length
        ? palette
        : Background.DEFAULT_PALETTE;

    this.settings = { ...Background.DEFAULT_SETTINGS, ...userSettings };

    this.time = 0;
    this.brushSplashes = [];
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / this.settings.fps;
    this.animationFrame = null;

    this.handleResize = this.debounce(this.handleResize.bind(this), 250);

    this.init();
  }

  init() {
    this.initializeCanvas();
    this.generateBrushSplashes();
    this.addEventListeners();
    this.animationFrame = requestAnimationFrame(this.animate.bind(this));
  }

  checkFullScreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  handleResize() {
    this.initializeCanvas();
    this.generateBrushSplashes();
  }

  initializeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  generateBrushSplashes() {
    this.brushSplashes = [];
    const { splashCount, minVertices, maxVertices, moveSpeed } = this.settings;
    const { width, height, palette } = this;

    const minDimension = Math.min(width, height);
    const baseRadiusRange = {
      min: minDimension / 25,
      max: minDimension / 8,
    };

    const gridSize = Math.ceil(Math.sqrt(splashCount));
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;

    for (let i = 0; i < splashCount; i++) {
      const gridX = i % gridSize;
      const gridY = Math.floor(i / gridSize);

      const x = gridX * cellWidth + Math.random() * cellWidth;
      const y = gridY * cellHeight + Math.random() * cellHeight;

      const baseRadius =
        baseRadiusRange.min +
        Math.random() * (baseRadiusRange.max - baseRadiusRange.min);
      const color = palette[i % palette.length];
      const vertices =
        minVertices +
        Math.floor(Math.random() * (maxVertices - minVertices + 1));

      const multipliers = Array.from(
        { length: vertices },
        () => 0.9 + Math.random() * 0.2 // Slightly larger random range for more variation
      );

      this.brushSplashes.push({
        originalX: x,
        originalY: y,
        x,
        y,
        baseRadius,
        color,
        vertices,
        multipliers,
        phase: Math.random() * Math.PI * 2, // For radius animation
        movePhase: Math.random() * Math.PI * 2, // For position animation
        moveSpeed: moveSpeed * (0.75 + Math.random() * 0.5), // More centered speed variation
      });
    }
  }

  updateSplashPositions() {
    const t = this.time * 0.15;
    const { maxMovement } = this.settings;

    for (const splash of this.brushSplashes) {
      splash.x =
        splash.originalX +
        Math.sin(t * splash.moveSpeed + splash.movePhase) * maxMovement;
      splash.y =
        splash.originalY +
        Math.cos(t * splash.moveSpeed * 0.7 + splash.movePhase) *
          maxMovement *
          0.8;
    }
  }

  drawSplashes() {
    const { ctx, settings, time } = this;
    const t = time * 0.015;
    ctx.globalCompositeOperation = "screen";

    for (const splash of this.brushSplashes) {
      const { x, y, baseRadius, phase, color, vertices, multipliers } = splash;

      const dynamicRadius =
        baseRadius +
        settings.amplitude *
          (Math.sin(t + phase) * 0.7 + Math.sin(t * 1.3 + phase) * 0.3);
      const opacity =
        0.7 +
        0.15 * Math.sin(t * 0.7 + phase) +
        0.05 * Math.cos(t * 1.1 + phase);

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, dynamicRadius);
      gradient.addColorStop(0, `rgba(${color}, ${opacity})`);
      gradient.addColorStop(0.6, `rgba(${color}, ${opacity * 0.5})`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);

      ctx.beginPath();

      const angleStep = (Math.PI * 2) / vertices;
      const points = [];

      for (let i = 0; i < vertices; i++) {
        const angle = i * angleStep;
        const r = dynamicRadius * multipliers[i];
        points.push({
          x: x + r * Math.cos(angle),
          y: y + r * Math.sin(angle),
        });
      }

      ctx.moveTo(
        (points[0].x + points[vertices - 1].x) / 2,
        (points[0].y + points[vertices - 1].y) / 2
      );

      for (let i = 0; i < vertices; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % vertices];
        const midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
      }

      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  render() {
    this.ctx.globalCompositeOperation = "source-over";
    this.renderBackgroundGradient();
    this.updateSplashPositions();
    this.drawSplashes();
    this.ctx.globalCompositeOperation = "source-over";
  }

  renderBackgroundGradient() {
    const { ctx, width, height, palette, time } = this;
    const t = time * 0.05;

    const color1 = `rgb(${palette[0]})`;
    const color2 = `rgb(${palette[1 % palette.length]})`;
    const color3 = `rgb(${palette[2 % palette.length]})`;

    const x0 = width * (0.5 + 0.5 * Math.sin(t * 0.5));
    const y0 = height * (0.5 + 0.5 * Math.cos(t * 0.3));
    const x1 = width * (0.5 - 0.5 * Math.sin(t * 0.7));
    const y1 = height * (0.5 - 0.5 * Math.cos(t * 0.4));

    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(0.5, color2);
    gradient.addColorStop(1, color3);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  addEventListeners() {
    window.addEventListener("resize", this.handleResize);
    Background.FULLSCREEN_EVENTS.forEach((event) =>
      document.addEventListener(event, this.handleResize)
    );
  }

  animate(timestamp) {
    this.animationFrame = requestAnimationFrame(this.animate.bind(this));
    const elapsed = timestamp - this.lastFrameTime;

    if (elapsed > this.frameInterval) {
      this.lastFrameTime = timestamp - (elapsed % this.frameInterval);
      this.time += 0.01;
      this.render();
    }
  }

  destroy() {
    window.removeEventListener("resize", this.handleResize);
    Background.FULLSCREEN_EVENTS.forEach((event) =>
      document.removeEventListener(event, this.handleResize)
    );

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}
