class Background {
  static DEFAULT_PALETTE = [
    "26, 0, 55",
    "59, 1, 86",
    "79, 0, 130",
    "147, 0, 255",
    "68, 0, 255",
  ];

  static DEFAULT_SETTINGS = {
    starCount: 200,
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
  };

  static TWO_PI = Math.PI * 2;


  constructor(canvasId, palette, userSettings = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas)
      throw new Error(`Canvas con id '${canvasId}' non trovato.`);

    this.ctx = this.canvas.getContext("2d");
    this.settings = { ...Background.DEFAULT_SETTINGS, ...userSettings };


    this.palette =
      Array.isArray(palette) && palette.length
        ? palette
        : Background.DEFAULT_PALETTE;

    this.stars = [];
    this.shootingStars = [];
    this.animationFrame = null;
    this.time = 0;
    this.spatialGrid = new Map();
    this.gridCellSize = Math.max(
      this.settings.connection.distance,
      this.settings.mouseInteraction.distance
    );
    this.mouse = { x: null, y: null, active: false };

    this._init();
  }

  _init() {

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
    this.stars = [];
    for (let i = 0; i < this.settings.starCount; i++) {
      const depth = Math.pow(Math.random(), 2);
      const origin = {
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
      };

      this.stars.push({
        origin: origin,
        pos: { ...origin },
        size:
          this.settings.starSize.min +
          depth * (this.settings.starSize.max - this.settings.starSize.min),
        depth: depth,
        phaseX: Math.random() * Background.TWO_PI,
        phaseY: Math.random() * Background.TWO_PI,
        pulsePhase: Math.random() * Background.TWO_PI,
        opacity: 0.4 + depth * 0.5,
        color: this.palette[i % this.palette.length],
      });
    }
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

    for (const star1 of this.stars) {
      const gridX = Math.floor(star1.pos.x / this.gridCellSize);
      const gridY = Math.floor(star1.pos.y / this.gridCellSize);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = `${gridX + dx},${gridY + dy}`;
          if (this.spatialGrid.has(key)) {
            for (const star2 of this.spatialGrid.get(key)) {
              if (star1 === star2) continue;
              const dist = Math.hypot(
                star1.pos.x - star2.pos.x,
                star1.pos.y - star2.pos.y
              );
              if (dist < distance) {
                const opacity = Math.pow(1 - dist / distance, 2) * 0.7;
                this.ctx.beginPath();
                this.ctx.strokeStyle = `rgba(${connectionColor}, ${opacity})`;
                this.ctx.moveTo(star1.pos.x, star1.pos.y);
                this.ctx.lineTo(star2.pos.x, star2.pos.y);
                this.ctx.stroke();
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
    this._generateStars();
  }
  _spawnShootingStar() {
    let t, e, i;
    const s = Math.random() < 0.5,
      o = Math.random() < 0.5;
    s
      ? ((t = Math.random() * this.canvas.width),
        (e = o ? -200 : this.canvas.height + 200),
        (i = o
          ? Math.PI * (0.25 + Math.random() * 0.5)
          : Math.PI * (1.25 + Math.random() * 0.5)))
      : ((t = o ? -200 : this.canvas.width + 200),
        (e = Math.random() * this.canvas.height),
        (i = o
          ? Math.PI * (-0.25 + Math.random() * 0.5)
          : Math.PI * (0.75 + Math.random() * 0.5)));
    this.shootingStars.push({
      pos: { x: t, y: e },
      angle: i,
      speed: this.settings.shootingStars.speed * (0.5 + Math.random() * 0.5),
      color: this.palette[Math.floor(Math.random() * this.palette.length)],
    });
  }
  _updateSpatialGrid() {
    this.spatialGrid.clear();
    for (const t of this.stars) {
      const e = `${Math.floor(t.pos.x / this.gridCellSize)},${Math.floor(
        t.pos.y / this.gridCellSize
      )}`;
      this.spatialGrid.has(e) || this.spatialGrid.set(e, []),
        this.spatialGrid.get(e).push(t);
    }
  }
  update() {
    const t = this.time,
      e = t * this.settings.moveSpeed;
    for (const i of this.stars) {
      const s = 1 + i.depth * this.settings.parallaxStrength,
        o = Math.sin(e * s + i.phaseX) * 20 * i.depth,
        h = Math.cos(e * s + i.phaseY) * 20 * i.depth;
      (i.pos.x = i.origin.x + o),
        (i.pos.y = i.origin.y + h),
        i.pos.x < 0
          ? (i.origin.x += this.canvas.width)
          : i.pos.x > this.canvas.width && (i.origin.x -= this.canvas.width),
        i.pos.y < 0
          ? (i.origin.y += this.canvas.height)
          : i.pos.y > this.canvas.height && (i.origin.y -= this.canvas.height);
    }
    this._updateSpatialGrid(),
      this.settings.shootingStars.enabled &&
        (Math.random() < this.settings.shootingStars.probability &&
          this._spawnShootingStar(),
        this.shootingStars.forEach((t, e) => {
          (t.pos.x += Math.cos(t.angle) * t.speed),
            (t.pos.y += Math.sin(t.angle) * t.speed),
            (t.pos.x < -200 ||
              t.pos.x > this.canvas.width + 200 ||
              t.pos.y < -200 ||
              t.pos.y > this.canvas.height + 200) &&
              this.shootingStars.splice(e, 1);
        }));
  }
  draw() {
    (this.ctx.globalCompositeOperation = "source-over"),
      this._drawBackground(),
      (this.ctx.globalCompositeOperation = "screen"),
      this._drawConnections(),
      this.settings.mouseInteraction.enabled &&
        this.mouse.active &&
        this._drawMouseConnections(),
      this.settings.shootingStars.enabled &&
        this.shootingStars.forEach((t) => this._drawShootingStar(t)),
      this.stars.forEach((t) => this._drawStar(t));
  }
  _drawStar(t) {
    const { pos: e, opacity: i, color: s } = t;
    let o = t.size;
    const h = this.time;
    this.settings.pulsatingStars.enabled &&
      (o *=
        1 +
        Math.sin(h * this.settings.pulsatingStars.speed + t.pulsePhase) *
          this.settings.pulsatingStars.intensity *
          t.depth);
    const n = o * 5,
      a = this.ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, n);
    a.addColorStop(0, `rgba(${s}, ${i * this.settings.starGlowOpacity})`),
      a.addColorStop(1, `rgba(${s}, 0)`),
      (this.ctx.fillStyle = a),
      this.ctx.beginPath(),
      this.ctx.arc(e.x, e.y, n, 0, Background.TWO_PI),
      this.ctx.fill(),
      (this.ctx.fillStyle = `rgba(${s}, ${i})`),
      this.ctx.beginPath(),
      this.ctx.arc(e.x, e.y, o, 0, Background.TWO_PI),
      this.ctx.fill();
  }
  _drawMouseConnections() {
    const t = this.settings.mouseInteraction.distance,
      e = `rgb(${this.palette[3 % this.palette.length]})`,
      i = Math.floor(this.mouse.x / this.gridCellSize),
      s = Math.floor(this.mouse.y / this.gridCellSize);
    for (let o = -1; o <= 1; o++)
      for (let h = -1; h <= 1; h++) {
        const n = `${i + o},${s + h}`;
        if (this.spatialGrid.has(n))
          for (const a of this.spatialGrid.get(n)) {
            const r = Math.hypot(
              this.mouse.x - a.pos.x,
              this.mouse.y - a.pos.y
            );
            if (r < t) {
              const c = Math.pow(1 - r / t, 3);
              this.ctx.beginPath(),
                (this.ctx.strokeStyle = `rgba(${e}, ${c})`),
                (this.ctx.lineWidth = this.settings.connection.lineWidth),
                this.ctx.moveTo(this.mouse.x, this.mouse.y),
                this.ctx.lineTo(a.pos.x, a.pos.y),
                this.ctx.stroke();
            }
          }
      }
  }
  _drawShootingStar(t) {
    const { length: e, lineWidth: i } = this.settings.shootingStars,
      s = t.pos.x - Math.cos(t.angle) * e,
      o = t.pos.y - Math.sin(t.angle) * e,
      h = this.ctx.createLinearGradient(t.pos.x, t.pos.y, s, o);
    h.addColorStop(0, `rgba(${t.color}, 1)`),
      h.addColorStop(1, `rgba(${t.color}, 0)`),
      this.ctx.beginPath(),
      (this.ctx.strokeStyle = h),
      (this.ctx.lineWidth = i),
      this.ctx.moveTo(t.pos.x, t.pos.y),
      this.ctx.lineTo(s, o),
      this.ctx.stroke();
  }
  animate() {
    (this.time += 0.01),
      this.update(),
      this.draw(),
      (this.animationFrame = requestAnimationFrame(this.animate.bind(this)));
  }
  destroy() {
    window.removeEventListener("resize", this.handleResize),
      this.canvas.removeEventListener("mousemove", this._handleMouseMove),
      this.canvas.removeEventListener("mouseleave", this._handleMouseLeave),
      this.animationFrame && cancelAnimationFrame(this.animationFrame),
      console.log("Animazione cielo stellato terminata e risorse pulite.");
  }
  _debounce(t, e) {
    let i;
    return (...s) => {
      clearTimeout(i), (i = setTimeout(() => t.apply(this, s), e));
    };
  }
}
