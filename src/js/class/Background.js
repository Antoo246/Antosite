/**
 * @class Background
 * @description Manages a dynamic, animated canvas background with morphing color splashes.
 */
class Background {
  /** @type {string[]} Default color palette for splashes and gradients. */
  static DEFAULT_PALETTE = [
    "26, 0, 55",
    "59, 1, 86",
    "79, 0, 130",
    "147, 0, 255",
    "68, 0, 255",
  ];

  /** @type {object} Default settings for the animation. */
  static DEFAULT_SETTINGS = {
    splashCount: 30,
    minVertices: 6,
    maxVertices: 12,
    amplitude: 10,
    fps: 60,
    moveSpeed: 4,
    maxMovement: 100,
  };

  /** @type {string[]} A list of fullscreen change event names for cross-browser compatibility. */
  static FULLSCREEN_EVENTS = [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "MSFullscreenChange",
  ];

  /**
   * Creates an instance of the Background animation.
   * @param {string} canvasId The ID of the HTML canvas element.
   * @param {string[]} [palette] An array of RGB color strings.
   * @param {object} [userSettings={}] User-defined settings to override defaults.
   */
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

    // Bind and debounce the resize handler
    this.handleResize = this.debounce(this.handleResize.bind(this), 250);

    this.init();
  }

  /**
   * Initializes the canvas, generates splashes, and starts the animation loop.
   */
  init() {
    this.initializeCanvas();
    this.generateBrushSplashes();
    this.addEventListeners();
    this.animationFrame = requestAnimationFrame(this.animate.bind(this));
  }

  /**
   * Checks if the document is currently in fullscreen mode.
   * @returns {boolean} True if in fullscreen, otherwise false.
   */
  checkFullScreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  /**
   * Creates a debounced function that delays invoking `func` until after `wait` milliseconds.
   * @param {Function} func The function to debounce.
   * @param {number} wait The number of milliseconds to delay.
   * @returns {Function} The new debounced function.
   */
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Handles window resize and fullscreen change events by re-initializing the canvas.
   */
  handleResize() {
    this.initializeCanvas();
    this.generateBrushSplashes();
  }

  /**
   * Sets canvas dimensions to match the window's inner dimensions.
   */
  initializeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  /**
   * Generates the initial set of brush splashes with random properties.
   */
  generateBrushSplashes() {
    this.brushSplashes = [];
    const { splashCount, minVertices, maxVertices, moveSpeed } = this.settings;
    const { width, height, palette } = this;

    const minDim = Math.min(width, height);
    const baseRadiusMin = minDim / 25;
    const baseRadiusMax = minDim / 8;

    const gridSize = Math.ceil(Math.sqrt(splashCount));
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;

    for (let i = 0; i < splashCount; i++) {
      const gridX = i % gridSize;
      const gridY = Math.floor(i / gridSize);

      const x = gridX * cellWidth + Math.random() * cellWidth;
      const y = gridY * cellHeight + Math.random() * cellHeight;
      const baseRadius =
        baseRadiusMin + Math.random() * (baseRadiusMax - baseRadiusMin);
      const color = palette[Math.floor(Math.random() * palette.length)];

      const vertices =
        minVertices + Math.floor(Math.random() * (maxVertices - minVertices + 1));
      const multipliers = Array.from(
        { length: vertices },
        () => 0.95 + Math.random() * 0.1
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
        phase: Math.random() * Math.PI * 2,
        movePhase: Math.random() * Math.PI * 2,
        moveSpeed: moveSpeed * (0.5 + Math.random()),
      });
    }
  }

  /**
   * Updates the position of each splash for the current frame.
   */
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

  /**
   * Draws all splashes onto the canvas.
   */
  drawSplashes() {
    const { ctx, settings, time } = this;
    const t = time * 0.015;
    ctx.globalCompositeOperation = "screen";

    for (const splash of this.brushSplashes) {
      const {
        x,
        y,
        baseRadius,
        phase,
        color,
        vertices,
        multipliers,
      } = splash;

      const dynamicRadius =
        baseRadius +
        settings.amplitude *
          (Math.sin(t + phase) * 0.7 + Math.sin(t * 1.3 + phase) * 0.3);
      const opacity =
        0.7 +
        0.15 * Math.sin(t * 0.7 + phase) +
        0.05 * Math.cos(t * 1.1 + phase);

      const gradient = ctx.createRadialGradient(
        x, y, 0, x, y, dynamicRadius
      );
      gradient.addColorStop(0, `rgba(${color}, ${opacity})`);
      gradient.addColorStop(0.6, `rgba(${color}, ${opacity * 0.5})`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);

      ctx.beginPath();
      const angleStep = (Math.PI * 2) / vertices;
      for (let i = 0; i <= vertices; i++) {
        const idx = i % vertices;
        const angle = idx * angleStep;
        const r = dynamicRadius * multipliers[idx];
        const pointX = x + r * Math.cos(angle);
        const pointY = y + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(pointX, pointY) : ctx.lineTo(pointX, pointY);
      }
      ctx.closePath();

      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  /**
   * Renders a single frame of the animation.
   */
  render() {
    this.ctx.globalCompositeOperation = "source-over";
    this.renderBackgroundGradient();
    this.updateSplashPositions();
    this.drawSplashes();
    this.ctx.globalCompositeOperation = "source-over";
  }

  /**
   * Draws an animated linear gradient as the background.
   */
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

  /**
   * Adds necessary event listeners for resize and fullscreen changes.
   */
  addEventListeners() {
    window.addEventListener("resize", this.handleResize);
    Background.FULLSCREEN_EVENTS.forEach((event) =>
      document.addEventListener(event, this.handleResize)
    );
  }

  /**
   * The main animation loop, throttled to the specified FPS.
   * @param {number} timestamp The current time provided by requestAnimationFrame.
   */
  animate(timestamp) {
    this.animationFrame = requestAnimationFrame(this.animate.bind(this));
    const elapsed = timestamp - this.lastFrameTime;

    if (elapsed > this.frameInterval) {
      this.lastFrameTime = timestamp - (elapsed % this.frameInterval);
      this.time += 0.01;
      this.render();
    }
  }

  /**
   * Cleans up event listeners and stops the animation loop.
   */
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
