class Background {
  constructor(canvasId, palette) {
    this.canvas = document.getElementById(canvasId);
    if (!(this.canvas instanceof HTMLCanvasElement)) {
      throw new Error(
        `Canvas element with id '${canvasId}' not found or is not a canvas`
      );
    }

    this.ctx = this.canvas.getContext("2d");
    this.palette =
      Array.isArray(palette) && palette.length
        ? palette
        : ["26, 0, 55", "59, 1, 86", "79, 0, 130", "147, 0, 255", "68, 0, 255"];

    this.settings = {
      splashCount: 30,
      minVertices: 6,
      maxVertices: 12,
      amplitude: 10,
      fps: 30,
      moveSpeed: 7,
      maxMovement: 100,
    };

    this.time = 0;
    this.brushSplashes = [];
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / this.settings.fps;

    this.isFullScreen = this.checkFullScreen();
    this.lastWidth = window.innerWidth;
    this.lastHeight = window.innerHeight;

    this.handleResize = this.debounce(this.handleResize.bind(this), 250);

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
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  handleResize() {
    const nowFullScreen = this.checkFullScreen();
    const widthChanged = window.innerWidth !== this.lastWidth;
    const heightChanged = window.innerHeight !== this.lastHeight;

    if (nowFullScreen !== this.isFullScreen || widthChanged || heightChanged) {
      this.isFullScreen = nowFullScreen;
      this.lastWidth = window.innerWidth;
      this.lastHeight = window.innerHeight;
      this.initializeCanvas();
      this.generateBrushSplashes();
    }
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

    const minDim = Math.min(this.width, this.height);
    const baseRadiusMin = minDim / 25;
    const baseRadiusMax = minDim / 8;

    const gridSize = Math.ceil(Math.sqrt(splashCount));
    const cellWidth = this.width / gridSize;
    const cellHeight = this.height / gridSize;

    for (let i = 0; i < splashCount; i++) {
      const gridX = i % gridSize;
      const gridY = Math.floor(i / gridSize);

      const x = gridX * cellWidth + Math.random() * cellWidth * 0.8;
      const y = gridY * cellHeight + Math.random() * cellHeight * 0.8;
      const baseRadius =
        baseRadiusMin + Math.random() * (baseRadiusMax - baseRadiusMin);
      const phase = Math.random() * Math.PI * 2;
      const color =
        this.palette[Math.floor(Math.random() * this.palette.length)];

      const vertices =
        minVertices +
        Math.floor(Math.random() * (maxVertices - minVertices + 1));
      const multipliers = [];
      for (let v = 0; v < vertices; v++) {
        const base = 0.95 + Math.random() * 0.1; // più coerente
        const wave = Math.sin((v / vertices) * Math.PI * 2);
        multipliers.push(base + 0.05 * wave); // lieve "ondulazione" regolare
      }

      this.brushSplashes.push({
        originalX: x,
        originalY: y,
        x,
        y,
        baseRadius,
        phase,
        color,
        vertices,
        multipliers,
        movePhase: Math.random() * Math.PI * 2,
        moveSpeed: moveSpeed * (0.5 + Math.random()),
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
  const ctx = this.ctx;
  const t = this.time * 0.015;
  ctx.globalCompositeOperation = "screen";

  for (const splash of this.brushSplashes) {
    const dynamicRadius =
      splash.baseRadius +
      this.settings.amplitude *
        (Math.sin(t + splash.phase) * 0.7 +
          Math.sin(t * 1.3 + splash.phase) * 0.3);

    const opacity =
      0.7 +
      0.15 * Math.sin(t * 0.7 + splash.phase) +
      0.05 * Math.cos(t * 1.1 + splash.phase);

    const gradient = ctx.createRadialGradient(
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

    ctx.beginPath();
    const angleStep = (Math.PI * 2) / splash.vertices;

    let prevX, prevY;
    for (let i = 0; i <= splash.vertices; i++) {
      const idx = i % splash.vertices;
      const angle = idx * angleStep;
      const r = dynamicRadius * splash.multipliers[idx];
      const x = splash.x + r * Math.cos(angle);
      const y = splash.y + r * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const cpx = (prevX + x) / 2;
        const cpy = (prevY + y) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cpx, cpy);
      }

      prevX = x;
      prevY = y;
    }
    ctx.closePath();

    ctx.fillStyle = gradient;
    ctx.fill();
  }

  ctx.globalCompositeOperation = "source-over";
}


  render() {
    this.ctx.globalCompositeOperation = "source-over";
    this.renderBackgroundGradient(); // sfondo dinamico
    this.updateSplashPositions();
    this.drawSplashes();
  }

  renderBackgroundGradient() {
    const time = this.time * 0.05;
    const color1 = `rgb(${this.palette[0]})`;
    const color2 = `rgb(${this.palette[1] || this.palette[0]})`;

    const gradientX = Math.sin(time) * 0.5 + 0.5; // da 0 a 1
    const gradientY = Math.cos(time * 0.6) * 0.5 + 0.5;

    const gradient = this.ctx.createLinearGradient(
      this.width * gradientX,
      0,
      this.width * (1 - gradientX),
      this.height * gradientY
    );

    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  addEventListeners() {
    window.addEventListener("resize", this.handleResize);
    [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange",
    ].forEach((event) => document.addEventListener(event, this.handleResize));
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
    [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange",
    ].forEach((event) =>
      document.removeEventListener(event, this.handleResize)
    );

    cancelAnimationFrame(this.animationFrame);
  }
}
