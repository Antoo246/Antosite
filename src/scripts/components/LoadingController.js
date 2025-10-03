/**
 * Loading Controller Component - Redesigned
 * Manages the loading screen with smooth progress tracking synced to data fetching
 */

export class LoadingController {
  constructor(options = {}) {
    this.progressFill = document.getElementById("progressFill");
    this.progressText = document.getElementById("progressText");
    this.loadingText = document.getElementById("loadingText");
    this.loadingScreen = document.getElementById("loading");
    
    this.currentProgress = 0;
    this.targetProgress = 0;
    this.isComplete = false;
    this.isInitialized = false;
    
    // Configuration
    this.smoothFactor = options.smoothFactor ?? 0.15;
    this.rafId = null;

    console.log("✨ LoadingController initialized");
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log("� Starting loading sequence");
    
    // Create particles
    this.createParticles();
    
    // Start RAF animation loop
    this.startProgressAnimation();
  }

  createParticles() {
    // Remove existing particles if any
    const existing = this.loadingScreen?.querySelector('.loading-particles');
    if (existing) existing.remove();

    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'loading-particles';
    
    for (let i = 0; i < 5; i++) {
      const particle = document.createElement('div');
      particle.className = 'loading-particle';
      particlesContainer.appendChild(particle);
    }
    
    if (this.loadingScreen) {
      this.loadingScreen.appendChild(particlesContainer);
    }
  }

  startProgressAnimation() {
    const animate = () => {
      if (this.isComplete) {
        cancelAnimationFrame(this.rafId);
        return;
      }

      // Smooth interpolation toward target
      const diff = this.targetProgress - this.currentProgress;
      
      if (Math.abs(diff) > 0.01) {
        this.currentProgress += diff * this.smoothFactor;
      } else {
        this.currentProgress = this.targetProgress;
      }

      // Update UI
      this.updateProgressUI();

      // Continue loop
      this.rafId = requestAnimationFrame(animate);
    };

    this.rafId = requestAnimationFrame(animate);
  }

  updateProgressUI() {
    const roundedProgress = Math.min(100, Math.round(this.currentProgress));
    
    if (this.progressFill) {
      this.progressFill.style.width = `${this.currentProgress}%`;
    }
    
    if (this.progressText) {
      this.progressText.textContent = `${roundedProgress}%`;
    }
  }

  // Public API - Set progress (called from App.js during data loading)
  setProgress(progress) {
    const clamped = Math.max(0, Math.min(100, progress));
    this.targetProgress = clamped;
    console.log(`📊 Progress: ${clamped}%`);
  }

  // Public API - Set text (called from App.js during data loading)
  setText(text) {
    if (this.loadingText) {
      this.loadingText.style.opacity = "0";
      
      setTimeout(() => {
        this.loadingText.textContent = text;
        this.loadingText.style.opacity = "1";
      }, 150);
    }
    console.log(`💬 ${text}`);
  }

  // Public API - Complete and hide loading screen
  onDataLoaded() {
    console.log("✅ Data loaded - completing...");
    
    // Set to 100%
    this.setProgress(100);
    this.setText("✅ Complete!");

    // Wait for animation to reach 100%
    const checkComplete = () => {
      if (this.currentProgress >= 99.5) {
        this.complete();
      } else {
        requestAnimationFrame(checkComplete);
      }
    };
    
    setTimeout(() => checkComplete(), 300);
  }

  complete() {
    if (this.isComplete) return;
    
    this.isComplete = true;
    console.log("🎉 Loading complete!");

    // Cancel RAF
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Force 100%
    this.currentProgress = 100;
    this.updateProgressUI();

    // Hide after delay
    setTimeout(() => {
      this.hide();
    }, 600);
  }

  hide() {
    if (this.loadingScreen) {
      this.loadingScreen.classList.add("fade-out");

      setTimeout(() => {
        if (this.loadingScreen) {
          this.loadingScreen.style.display = "none";
        }
        // Re-enable scrolling
        document.body.classList.remove("loading-active");
        console.log("👋 Loading screen hidden");
      }, 1000);
    }
  }

  // Fallback - force complete if something goes wrong
  forceComplete() {
    console.log("⚠️ Force completing...");
    this.targetProgress = 100;
    this.currentProgress = 100;
    this.complete();
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isComplete = true;
    console.log("🧹 LoadingController destroyed");
  }
}