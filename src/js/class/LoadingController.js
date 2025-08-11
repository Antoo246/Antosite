
class LoadingController {
  constructor() {
    this.progressFill = document.getElementById("progressFill");
    this.progressText = document.getElementById("progressText");
    this.loadingText = document.getElementById("loadingText");
    this.loadingContainer = document.getElementById("loading");
    this.currentProgress = 0;
    this.targetProgress = 0;
    this.isComplete = false;
    this.isInitialized = false;

    this.loadingSteps = [
      { text: "Initializing", duration: 800 },
      { text: "Loading assets", duration: 1200 },
      { text: "Fetching data", duration: 1000 },
      { text: "Processing", duration: 800 },
      { text: "Almost ready", duration: 600 },
      { text: "Complete!", duration: 400 },
    ];

    this.currentStep = 0;
    this.intervals = [];

    console.log("LoadingController initialized");
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log("Starting loading sequence");
    this.startLoadingSequence();
  }

  startLoadingSequence() {
    // Start the progress animation
    this.animateProgress();

    // Start text sequence
    this.animateLoadingText();
  }

  animateProgress() {
    const progressInterval = setInterval(() => {
      if (this.currentProgress < 100 && !this.isComplete) {
        // Simulate realistic loading progress with varying speed
        const increment = Math.random() * 2.5 + 0.3;
        this.targetProgress = Math.min(95, this.targetProgress + increment);

        // Smooth animation to target progress
        this.smoothProgressUpdate();
      } else if (this.currentProgress >= 95 && !this.isComplete) {
        // Hold at 95% until manually completed
        this.targetProgress = 95;
      }
    }, 120);

    this.intervals.push(progressInterval);
  }

  smoothProgressUpdate() {
    const progressUpdateInterval = setInterval(() => {
      const diff = this.targetProgress - this.currentProgress;

      if (Math.abs(diff) < 0.1) {
        this.currentProgress = this.targetProgress;
        clearInterval(progressUpdateInterval);
      } else {
        this.currentProgress += diff * 0.08;
      }

      // Update UI
      if (this.progressFill) {
        this.progressFill.style.width = `${this.currentProgress}%`;
      }
      if (this.progressText) {
        this.progressText.textContent = `${Math.round(this.currentProgress)}%`;
      }
    }, 16); // ~60fps

    // Clean up after 3 seconds max
    setTimeout(() => clearInterval(progressUpdateInterval), 3000);
  }

  animateLoadingText() {
    if (this.currentStep < this.loadingSteps.length && !this.isComplete) {
      const step = this.loadingSteps[this.currentStep];

      if (this.loadingText) {
        // Fade out current text
        this.loadingText.style.transition = "opacity 0.2s ease";
        this.loadingText.style.opacity = "0";

        setTimeout(() => {
          // Change text and fade in
          this.loadingText.textContent = step.text;
          this.loadingText.style.opacity = "1";

          // Schedule next step
          const nextStepTimeout = setTimeout(() => {
            this.currentStep++;
            this.animateLoadingText();
          }, step.duration);

          this.intervals.push(nextStepTimeout);
        }, 200);
      }
    }
  }

  completeLoading() {
    if (this.isComplete) return;

    this.isComplete = true;
    console.log("Loading completed!");

    // Clear all intervals
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals = [];

    // Force 100% progress
    this.targetProgress = 100;
    this.currentProgress = 100;

    // Stop all animations by adding the complete class
    if (this.loadingContainer) {
      this.loadingContainer.classList.add("loading-complete");
    }

    // Update UI immediately
    if (this.progressFill) {
      this.progressFill.style.width = "100%";
    }
    if (this.progressText) {
      this.progressText.textContent = "100%";
    }
    if (this.loadingText) {
      this.loadingText.textContent = "Complete!";
    }

    // Wait a moment then trigger the fade out
    setTimeout(() => {
      this.hideLoading();
    }, 800);
  }

  hideLoading() {
    if (this.loadingContainer) {
      this.loadingContainer.classList.replace("show", "hide");

      // Remove from DOM after animation
      setTimeout(() => {
        if (this.loadingContainer) {
          this.loadingContainer.style.display = "none";
        }
        console.log("Loading UI hidden");
      }, 800);
    }
  }

  // Manual control methods
  setProgress(progress) {
    this.targetProgress = Math.max(0, Math.min(100, progress));
    console.log(`Progress set to: ${progress}%`);
  }

  setText(text) {
    if (this.loadingText) {
      this.loadingText.textContent = text;
    }
  }

  forceComplete() {
    console.log("Force completing loading...");
    this.completeLoading();
  }

  // Integration method for main app
  onDataLoaded() {
    // Move to final step
    this.setProgress(100);
    this.setText("Complete!");

    setTimeout(() => {
      this.completeLoading();
    }, 300);
  }

  destroy() {
    // Clean up resources
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals = [];
    this.isComplete = true;
    console.log("LoadingController destroyed");
  }
}
