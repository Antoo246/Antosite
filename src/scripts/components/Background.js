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
    starGlowOpacity: 0.15,
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
      probability: 0.008,
      speed: 15,
      length: 150,
      lineWidth: 1.8,
    },
    mouseInteraction: {
      enabled: false,
      distance: 150,
    },
    animations: {
      pulseEffect: true,
      colorShifting: true,
      breathingEffect: true,
      twinkleStars: true,
    },
    performanceMode: {
      enabled: false,
      reducedStars: 100,
      reducedConnections: 50,
      disabledShootingStars: false,
    },
    colorMode: {
      dynamicColors: true,
      backgroundIntensity: 0.15,
      starColorVariation: true,
      connectionColorSync: true,
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
    this.rawPalette = palette || Background.DEFAULT_PALETTE;
    
    // Enhanced color processing
    this.colorManager = {
      currentPalette: [],
      backgroundColors: [],
      starColors: [],
      connectionColor: '',
      lastUpdate: 0,
    };

    // Initialize other properties
    this.time = 0;
    this.animationFrame = null;
    this.mouse = { x: 0, y: 0, active: false };
    this.stars = [];
    this.shootingStars = [];
    this.spatialGrid = new Map();
    this.gridCellSize = 50;

    // Animation state
    this.animationState = {
      pulsePhase: 0,
      breathingPhase: 0,
      colorShiftPhase: 0,
      twinklePhase: 0,
    };

    // Process colors
    this._processColors();

    console.log("✨ Starfield background initialized with enhanced color management");
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

  _processColors() {
    // Create enhanced color variations from the palette
    const palette = this.rawPalette;
    
    // Validate palette
    if (!Array.isArray(palette) || palette.length === 0) {
      console.warn("Invalid palette, using defaults");
      this.rawPalette = Background.DEFAULT_PALETTE;
      return this._processColors();
    }
    
    // Background gradient colors with opacity variations
    this.colorManager.backgroundColors = [
      { color: String(palette[0]), opacity: this.settings.colorMode.backgroundIntensity },
      { color: String(palette[1 % palette.length]), opacity: this.settings.colorMode.backgroundIntensity * 0.8 },
      { color: String(palette[2 % palette.length]), opacity: this.settings.colorMode.backgroundIntensity * 0.6 },
      { color: String(palette[3 % palette.length]), opacity: this.settings.colorMode.backgroundIntensity * 0.4 },
    ];

    // Star colors with different brightness levels
    this.colorManager.starColors = palette.map((color, index) => {
      const colorStr = String(color);
      return {
        base: colorStr,
        bright: this._enhanceColor(colorStr, 1.3),
        dim: this._enhanceColor(colorStr, 0.7),
        accent: this._shiftHue(colorStr, index * 30),
      };
    });

    // Connection color (use accent color)
    this.colorManager.connectionColor = String(palette[3 % palette.length]);
    
    console.log("🎨 Colors processed:", this.colorManager);
  }

  _enhanceColor(rgbString, factor) {
    // Ensure rgbString is a string
    const colorStr = typeof rgbString === 'string' ? rgbString : String(rgbString);
    const [r, g, b] = colorStr.split(',').map(n => Math.min(255, Math.max(0, parseInt(n.trim()) * factor)));
    return `${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}`;
  }

  _shiftHue(rgbString, degrees) {
    // Ensure rgbString is a string
    const colorStr = typeof rgbString === 'string' ? rgbString : String(rgbString);
    const [r, g, b] = colorStr.split(',').map(n => parseInt(n.trim()) / 255);
    
    // Convert RGB to HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const add = max + min;
    const l = add * 0.5;
    
    let h = 0;
    let s = 0;
    
    if (diff !== 0) {
      s = l < 0.5 ? diff / add : diff / (2 - add);
      
      if (max === r) h = ((g - b) / diff) + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / diff + 2;
      else h = (r - g) / diff + 4;
      
      h /= 6;
    }
    
    // Shift hue
    h = (h + degrees / 360) % 1;
    
    // Convert back to RGB
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    let newR, newG, newB;
    
    if (s === 0) {
      newR = newG = newB = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      newR = hue2rgb(p, q, h + 1/3);
      newG = hue2rgb(p, q, h);
      newB = hue2rgb(p, q, h - 1/3);
    }
    
    return `${Math.round(newR * 255)}, ${Math.round(newG * 255)}, ${Math.round(newB * 255)}`;
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

    this.stars = Array.from({ length: starCount }, (_, index) => {
      const depth = Math.pow(Math.random(), 2);
      const origin = {
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
      };

      // Enhanced star color selection
      const colorIndex = Math.floor(Math.random() * this.colorManager.starColors.length);
      const colorSet = this.colorManager.starColors[colorIndex];
      
      let starColor;
      if (this.settings.colorMode.starColorVariation) {
        const variation = Math.random();
        if (variation < 0.1) starColor = colorSet.bright;
        else if (variation < 0.8) starColor = colorSet.base;
        else if (variation < 0.95) starColor = colorSet.dim;
        else starColor = colorSet.accent;
      } else {
        starColor = colorSet.base;
      }

      return {
        origin,
        pos: { ...origin },
        size: this.settings.starSize.min + depth * (this.settings.starSize.max - this.settings.starSize.min),
        depth,
        phaseX: Math.random() * Background.TWO_PI,
        phaseY: Math.random() * Background.TWO_PI,
        pulsePhase: Math.random() * Background.TWO_PI,
        opacity: 0.4 + depth * 0.5,
        color: starColor,
        colorIndex: colorIndex,
      };
    });
  }

  _drawBackground() {
    const { ctx, canvas, time } = this;
    const t = time * 0.03;
    const bgColors = this.colorManager.backgroundColors;

    // Create multiple animated gradients for depth
    const gradients = [
      {
        x0: canvas.width * (0.5 + 0.4 * Math.sin(t * 0.5)),
        y0: canvas.height * (0.5 + 0.4 * Math.cos(t * 0.3)),
        x1: canvas.width * (0.5 - 0.4 * Math.sin(t * 0.7)),
        y1: canvas.height * (0.5 - 0.4 * Math.cos(t * 0.4)),
        colors: [bgColors[0], bgColors[1], bgColors[2]],
      },
      {
        x0: canvas.width * (0.3 + 0.3 * Math.cos(t * 0.6)),
        y0: canvas.height * (0.7 + 0.3 * Math.sin(t * 0.5)),
        x1: canvas.width * (0.7 - 0.3 * Math.cos(t * 0.8)),
        y1: canvas.height * (0.3 - 0.3 * Math.sin(t * 0.6)),
        colors: [bgColors[1], bgColors[2], bgColors[3]],
      }
    ];

    // Base gradient
    const mainGradient = ctx.createLinearGradient(
      gradients[0].x0, gradients[0].y0, 
      gradients[0].x1, gradients[0].y1
    );
    
    mainGradient.addColorStop(0, `rgba(${gradients[0].colors[0].color}, ${gradients[0].colors[0].opacity})`);
    mainGradient.addColorStop(0.5, `rgba(${gradients[0].colors[1].color}, ${gradients[0].colors[1].opacity})`);
    mainGradient.addColorStop(1, `rgba(${gradients[0].colors[2].color}, ${gradients[0].colors[2].opacity})`);

    ctx.fillStyle = mainGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Overlay gradient for depth
    ctx.globalCompositeOperation = 'overlay';
    const overlayGradient = ctx.createRadialGradient(
      canvas.width * 0.5, canvas.height * 0.5, 0,
      canvas.width * 0.5, canvas.height * 0.5, Math.max(canvas.width, canvas.height) * 0.7
    );
    
    overlayGradient.addColorStop(0, `rgba(${bgColors[2].color}, ${bgColors[2].opacity * 0.3})`);
    overlayGradient.addColorStop(0.7, `rgba(${bgColors[1].color}, ${bgColors[1].opacity * 0.15})`);
    overlayGradient.addColorStop(1, `rgba(${bgColors[0].color}, 0)`);

    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }

  _drawConnections() {
    const { distance, lineWidth } = this.settings.connection;
    this.ctx.lineWidth = lineWidth;
    
    // Enhanced connection colors
    const baseConnectionColor = this.colorManager.connectionColor;
    const connectionColorVariants = this.settings.colorMode.connectionColorSync ? 
      this.colorManager.starColors.map(s => s.base) : [baseConnectionColor];

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
                const opacity = Math.pow(1 - dist / distance, 2) * 0.6;
                
                // Color blending between connected stars
                let connectionColor;
                if (this.settings.colorMode.connectionColorSync && star1.colorIndex !== undefined && star2.colorIndex !== undefined) {
                  const color1 = connectionColorVariants[star1.colorIndex];
                  const color2 = connectionColorVariants[star2.colorIndex];
                  connectionColor = this._blendColors(color1, color2);
                } else {
                  connectionColor = baseConnectionColor;
                }

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

  _blendColors(color1, color2) {
    // Ensure both colors are strings
    const colorStr1 = typeof color1 === 'string' ? color1 : String(color1);
    const colorStr2 = typeof color2 === 'string' ? color2 : String(color2);
    
    const [r1, g1, b1] = colorStr1.split(',').map(n => parseInt(n.trim()));
    const [r2, g2, b2] = colorStr2.split(',').map(n => parseInt(n.trim()));
    
    const r = Math.round((r1 + r2) / 2);
    const g = Math.round((g1 + g2) / 2);
    const b = Math.round((b1 + b2) / 2);
    
    return `${r}, ${g}, ${b}`;
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

    // Enhanced shooting star colors
    const colorSet = this.colorManager.starColors[Math.floor(Math.random() * this.colorManager.starColors.length)];
    const shootingStarColor = Math.random() < 0.7 ? colorSet.bright : colorSet.accent;

    this.shootingStars.push({
      pos: { x: t, y: e },
      angle,
      speed: this.settings.shootingStars.speed * (0.5 + Math.random() * 0.5),
      color: shootingStarColor,
      intensity: 0.8 + Math.random() * 0.4,
    });
  }

  // Public method to update colors dynamically
  updateColors(newPalette) {
    if (newPalette && Array.isArray(newPalette) && newPalette.length > 0) {
      console.log("🎨 Updating background colors:", newPalette);
      
      // Validate all palette entries are strings or can be converted
      const validPalette = newPalette.map(color => String(color)).filter(color => color.includes(','));
      
      if (validPalette.length === 0) {
        console.warn("No valid RGB colors found in palette");
        return;
      }
      
      this.rawPalette = validPalette;
      this._processColors();
      
      // Update existing stars with new colors
      if (this.stars && this.colorManager.starColors) {
        this.stars.forEach(star => {
          const colorIndex = Math.floor(Math.random() * this.colorManager.starColors.length);
          const colorSet = this.colorManager.starColors[colorIndex];
          
          if (this.settings.colorMode.starColorVariation && colorSet) {
            const variation = Math.random();
            if (variation < 0.1) star.color = colorSet.bright;
            else if (variation < 0.8) star.color = colorSet.base;
            else if (variation < 0.95) star.color = colorSet.dim;
            else star.color = colorSet.accent;
          } else if (colorSet) {
            star.color = colorSet.base;
          }
          
          star.colorIndex = colorIndex;
        });
      }
    } else {
      console.warn("Invalid palette provided to updateColors");
    }
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

    // Update animation phases
    this.animationState.pulsePhase += 0.02;
    this.animationState.breathingPhase += 0.015;
    this.animationState.colorShiftPhase += 0.01;
    this.animationState.twinklePhase += 0.03;

    // Update stars positions with enhanced animations
    this.stars.forEach((star, index) => {
      const parallax = 1 + star.depth * this.settings.parallaxStrength;
      
      // Base movement
      let offsetX = Math.sin(e * parallax + star.phaseX) * 20 * star.depth;
      let offsetY = Math.cos(e * parallax + star.phaseY) * 20 * star.depth;

      // Breathing effect
      if (this.settings.animations.breathingEffect) {
        const breathe = Math.sin(this.animationState.breathingPhase + index * 0.1) * 5;
        offsetX += breathe * star.depth;
        offsetY += breathe * star.depth * 0.5;
      }

      // Pulse effect
      if (this.settings.animations.pulseEffect) {
        const pulse = Math.sin(this.animationState.pulsePhase + index * 0.2) * 3;
        star.currentSize = star.size + pulse * star.depth;
      }

      // Twinkle effect
      if (this.settings.animations.twinkleStars) {
        const twinkle = Math.sin(this.animationState.twinklePhase + index * 0.15);
        star.twinkleOpacity = 0.3 + (twinkle * 0.3 + 0.3) * star.depth;
      }

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
    let size = star.currentSize || star.size;
    const pulseFactor = Math.sin(this.time * this.settings.pulsatingStars.speed + star.pulsePhase);
    const pulseAmount = this.settings.pulsatingStars.intensity * star.depth;

    // Apply pulsating effect if enabled
    if (this.settings.pulsatingStars.enabled) {
      size *= 1 + pulseFactor * pulseAmount;
    }

    // Ensure size is always positive (fix for negative arc radius)
    size = Math.max(0.1, size);

    // Enhanced twinkle opacity
    let currentOpacity = opacity;
    if (this.settings.animations.twinkleStars && star.twinkleOpacity !== undefined) {
      currentOpacity = opacity * (0.7 + star.twinkleOpacity);
    }

    // Ensure gradient radius is positive
    const gradientRadius = Math.max(0.1, size * 5);
    const radialGradient = this.ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, gradientRadius);

    // Enhanced glow with animation
    const glowIntensity = this.settings.starGlowOpacity * (1 + Math.sin(this.animationState.pulsePhase * 0.5) * 0.3);
    radialGradient.addColorStop(0, `rgba(${color}, ${currentOpacity * glowIntensity})`);
    radialGradient.addColorStop(0.5, `rgba(${color}, ${currentOpacity * glowIntensity * 0.5})`);
    radialGradient.addColorStop(1, `rgba(${color}, 0)`);

    // Draw the star's glowing effect
    this.ctx.fillStyle = radialGradient;
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, gradientRadius, 0, Background.TWO_PI);
    this.ctx.fill();

    // Draw the star's core with enhanced brightness
    const coreOpacity = currentOpacity * (1 + Math.sin(this.animationState.twinklePhase + star.pulsePhase) * 0.2);
    this.ctx.fillStyle = `rgba(${color}, ${Math.min(1, coreOpacity)})`;
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, size, 0, Background.TWO_PI);
    this.ctx.fill();

    // Add sparkle effect for bright stars
    if (star.depth > 0.8 && Math.random() < 0.02) {
      this._drawSparkle(pos, size * 2, color, currentOpacity);
    }
  }
  

  _drawSparkle(pos, size, color, opacity) {
    const sparkleSize = size * 0.3;
    this.ctx.strokeStyle = `rgba(${color}, ${opacity * 0.7})`;
    this.ctx.lineWidth = 1;
    
    // Draw cross sparkle
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x - sparkleSize, pos.y);
    this.ctx.lineTo(pos.x + sparkleSize, pos.y);
    this.ctx.moveTo(pos.x, pos.y - sparkleSize);
    this.ctx.lineTo(pos.x, pos.y + sparkleSize);
    this.ctx.stroke();
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
    
    // Enhanced gradient with more color stops
    const gradient = this.ctx.createLinearGradient(shootingStar.pos.x, shootingStar.pos.y, endX, endY);
    const intensity = shootingStar.intensity || 1;

    gradient.addColorStop(0, `rgba(${shootingStar.color}, ${intensity})`);
    gradient.addColorStop(0.3, `rgba(${shootingStar.color}, ${intensity * 0.8})`);
    gradient.addColorStop(0.7, `rgba(${shootingStar.color}, ${intensity * 0.4})`);
    gradient.addColorStop(1, `rgba(${shootingStar.color}, 0)`);

    // Core trail
    this.ctx.beginPath();
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = lineWidth;
    this.ctx.moveTo(shootingStar.pos.x, shootingStar.pos.y);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    // Glow effect
    if (intensity > 0.7) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = `rgba(${shootingStar.color}, ${intensity * 0.3})`;
      this.ctx.lineWidth = lineWidth * 3;
      this.ctx.moveTo(shootingStar.pos.x, shootingStar.pos.y);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }
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
