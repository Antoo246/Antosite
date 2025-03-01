class Background {
  constructor(canvasId, palette) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas || !(this.canvas instanceof HTMLCanvasElement)) {
      throw new Error(
        `Canvas element with id '${canvasId}' not found or is not a canvas`
      );
    }
    this.ctx = this.canvas.getContext("2d");

    // Palette with colors in "R, G, B" format
    this.palette =
      Array.isArray(palette) && palette.length
        ? palette
        : ["26, 0, 55", "59, 1, 86", "79, 0, 130", "147, 0, 255", "68, 0, 255"];

    this.settings = {
      splashCount: 30, // Number of splashes
      minVertices: 6, // Minimum number of vertices for irregular shapes
      maxVertices: 12, // Maximum number of vertices
      amplitude: 10, // Amplitude of radius oscillation
      fps: 30, // Frame rate limit
    };

    this.time = 0;
    this.brushSplashes = [];
    this.isFullScreen = this.checkFullScreen();
    this.lastWidth = window.innerWidth;
    this.lastHeight = window.innerHeight;
    this.handleResize = this.debounce(this.handleResize.bind(this), 250);
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / this.settings.fps;

    this.initializeCanvas();
    this.generateBrushSplashes(); // Generate background splashes for the first time
    this.addEventListeners();
    this.animationFrame = requestAnimationFrame(this.animate.bind(this));
  }

  // Check if browser is in fullscreen mode
  checkFullScreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  // Debounce function to limit frequent updates on resize
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  handleResize() {
    // Check for transition between fullscreen and non-fullscreen
    const currentFullScreen = this.checkFullScreen();
    if (currentFullScreen !== this.isFullScreen) {
      this.isFullScreen = currentFullScreen;
      this.lastWidth = window.innerWidth;
      this.lastHeight = window.innerHeight;
      this.generateBrushSplashes(); // Regenerate brush splashes only if fullscreen state changes
    }
  }

  initializeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  // Generate brush splashes with irregular shapes
  generateBrushSplashes() {
    this.brushSplashes = [];
    const { splashCount, minVertices, maxVertices } = this.settings;
    const minDim = Math.min(this.width, this.height);
    const baseRadiusMin = minDim / 25;
    const baseRadiusMax = minDim / 8;

    // Create distribution zones for better splash placement
    const gridSize = Math.sqrt(splashCount);
    const cellWidth = this.width / gridSize;
    const cellHeight = this.height / gridSize;

    for (let i = 0; i < splashCount; i++) {
      // Grid-based positioning with random offset
      const gridX = i % gridSize;
      const gridY = Math.floor(i / gridSize);
      const x = gridX * cellWidth + Math.random() * cellWidth * 0.8;
      const y = gridY * cellHeight + Math.random() * cellHeight * 0.8;

      // Enhanced radius calculation with golden ratio variation
      const baseRadius =
        baseRadiusMin + Math.random() * (baseRadiusMax - baseRadiusMin);
      const phase = Math.random() * Math.PI * 2;

      // Improved color selection with weighted randomization
      const colorIndex = Math.min(
        this.palette.length - 1,
        Math.floor(Math.random() * (this.palette.length - 1))
      );
      const color = this.palette[colorIndex];

      // Dynamic vertices calculation
      const vertices =
        minVertices +
        Math.floor(Math.random() * (maxVertices - minVertices + 1));

      // Smoother multipliers with controlled variation
      const multipliers = Array.from({ length: vertices }, (_, index) => {
        const base = 0.85 + Math.random() * 0.3;
        const angle = (index / vertices) * Math.PI * 2;
        return base + 0.1 * Math.sin(angle);
      });

      this.brushSplashes.push({
        x,
        y,
        baseRadius,
        phase,
        color,
        vertices,
        multipliers,
      });
    }
  }

  // Draw splashes as irregular shapes
  drawSplashes() {
    // Set global composite operation for better blending
    this.ctx.globalCompositeOperation = "screen";

    this.brushSplashes.forEach((splash) => {
      // Enhanced dynamic radius with smoother animation
      const time = this.time * 0.015;
      const dynamicRadius =
        splash.baseRadius +
        this.settings.amplitude *
          (Math.sin(time + splash.phase) * 0.7 +
            Math.sin(time * 1.3 + splash.phase) * 0.3);

      // Improved opacity animation with multiple frequencies
      const opacity =
        0.7 +
        0.15 * Math.sin(time * 0.7 + splash.phase) +
        0.05 * Math.cos(time * 1.1 + splash.phase);

      // Create and optimize gradient
      const gradient = this.ctx.createRadialGradient(
        splash.x,
        splash.y,
        0,
        splash.x,
        splash.y,
        dynamicRadius
      );
      gradient.addColorStop(0, `rgba(${splash.color}, ${opacity})`);
      gradient.addColorStop(0.6, `rgba(${splash.color}, ${opacity * 0.5})`);
      gradient.addColorStop(1, `rgba(${splash.color}, 0)`);

      // Optimized path drawing
      this.ctx.beginPath();
      const angleStep = (Math.PI * 2) / splash.vertices;

      for (let i = 0; i <= splash.vertices; i++) {
        const angle = i * angleStep;
        const r = dynamicRadius * splash.multipliers[i % splash.vertices];
        const x = splash.x + r * Math.cos(angle);
        const y = splash.y + r * Math.sin(angle);

        i === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
      }

      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    });

    // Reset composite operation
    this.ctx.globalCompositeOperation = "source-over";
  }

  render() {
    // Fill background with the darkest color from the palette (assumed to be the first one)
    this.ctx.globalCompositeOperation = "source-over";
    this.ctx.fillStyle = `rgb(${this.palette[0]})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw the splashes
    this.drawSplashes();
  }

  addEventListeners() {
    window.addEventListener("resize", this.handleResize);
    document.addEventListener("fullscreenchange", this.handleResize);
    document.addEventListener("webkitfullscreenchange", this.handleResize);
    document.addEventListener("mozfullscreenchange", this.handleResize);
    document.addEventListener("MSFullscreenChange", this.handleResize);
  }

  animate(timestamp) {
    const elapsed = timestamp - this.lastFrameTime;

    if (elapsed > this.frameInterval) {
      this.lastFrameTime = timestamp - (elapsed % this.frameInterval);
      this.time += 0.01;
      this.render();
    }

    this.animationFrame = requestAnimationFrame(this.animate.bind(this));
  }

  destroy() {
    window.removeEventListener("resize", this.handleResize);
    document.removeEventListener("fullscreenchange", this.handleResize);
    document.removeEventListener("webkitfullscreenchange", this.handleResize);
    document.removeEventListener("mozfullscreenchange", this.handleResize);
    document.removeEventListener("MSFullscreenChange", this.handleResize);
    cancelAnimationFrame(this.animationFrame);
  }
}
