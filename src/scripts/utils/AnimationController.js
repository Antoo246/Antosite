/**
 * Animation Controller - Gestisce animazioni avanzate e interazioni
 * Fornisce controlli per animazioni smooth, parallax e micro-interazioni
 */

export class AnimationController {
  constructor() {
    this.animatedElements = new Map();
    this.intersectionObserver = null;
    this.scrollElements = [];
    this.isInitialized = false;
    
    // Configurazione animazioni
    this.config = {
      fadeThreshold: 0.1,
      slideThreshold: 0.15,
      staggerDelay: 100,
      parallaxFactor: 0.5,
      enableReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };
  }

  /**
   * Inizializza il controller delle animazioni
   */
  init() {
    if (this.isInitialized) return;
    
    this.setupIntersectionObserver();
    this.setupParallaxEffects();
    this.setupHoverAnimations();
    this.setupScrollAnimations();
    
    this.isInitialized = true;
    console.log('AnimationController initialized');
  }

  /**
   * Configura l'Intersection Observer per animazioni on-scroll
   */
  setupIntersectionObserver() {
    if (this.config.enableReducedMotion) return;

    const options = {
      root: null,
      rootMargin: '-10% 0px -10% 0px',
      threshold: [0, 0.1, 0.5, 1.0]
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const element = entry.target;
        const animationType = element.dataset.animate || 'fadeInUp';
        const delay = parseInt(element.dataset.delay) || 0;
        
        if (entry.isIntersecting && entry.intersectionRatio >= this.config.fadeThreshold) {
          setTimeout(() => {
            this.triggerAnimation(element, animationType);
          }, delay);
        }
      });
    }, options);

    // Osserva elementi con data-animate
    document.querySelectorAll('[data-animate]').forEach(el => {
      this.intersectionObserver.observe(el);
    });
  }

  /**
   * Applica animazione a un elemento
   */
  triggerAnimation(element, animationType) {
    if (element.classList.contains('animated')) return;

    element.classList.add('animated', `animate-${animationType}`);
    
    // Rimuovi classe dopo l'animazione per permettere re-trigger
    element.addEventListener('animationend', () => {
      element.classList.remove(`animate-${animationType}`);
    }, { once: true });
  }

  /**
   * Configura effetti parallax per elementi di background
   */
  setupParallaxEffects() {
    if (this.config.enableReducedMotion) return;

    this.scrollElements = document.querySelectorAll('[data-parallax]');
    
    if (this.scrollElements.length > 0) {
      this.handleScroll = this.throttle(() => {
        const scrollY = window.pageYOffset;
        
        this.scrollElements.forEach(element => {
          const speed = parseFloat(element.dataset.parallax) || this.config.parallaxFactor;
          const yPos = -(scrollY * speed);
          element.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });
      }, 16); // 60fps
      
      window.addEventListener('scroll', this.handleScroll, { passive: true });
    }
  }

  /**
   * Configura animazioni hover avanzate
   */
  setupHoverAnimations() {
    // Animazioni per le skill cards
    document.querySelectorAll('.skill-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        if (!this.config.enableReducedMotion) {
          card.style.animation = 'heartbeat 0.6s ease';
        }
      });

      card.addEventListener('mouseleave', () => {
        card.style.animation = '';
      });
    });

    // Animazioni per i project cards
    document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        if (!this.config.enableReducedMotion) {
          const title = card.querySelector('.project-title');
          if (title) {
            title.style.animation = 'wiggle 0.5s ease';
            setTimeout(() => {
              title.style.animation = '';
            }, 500);
          }
        }
      });
    });

    // Animazioni per i bottoni
    document.querySelectorAll('.btn-elegant, .btn-primary').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        if (!this.config.enableReducedMotion) {
          btn.style.animation = 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.animation = '';
      });
    });
  }

  /**
   * Configura animazioni durante lo scroll
   */
  setupScrollAnimations() {
    let ticking = false;
    
    const updateScrollAnimations = () => {
      const scrollPercent = window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight);
      
      // Animazione della progress bar (se presente)
      const progressBar = document.querySelector('.scroll-progress');
      if (progressBar) {
        progressBar.style.width = `${scrollPercent * 100}%`;
      }

      // Rotazione sottile del logo durante scroll
      const logo = document.querySelector('.logo-wrapper');
      if (logo && !this.config.enableReducedMotion) {
        const rotation = scrollPercent * 360 * 0.5; // Rotazione molto sottile
        logo.style.transform = `rotate(${rotation}deg)`;
      }

      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollAnimations);
        ticking = true;
      }
    }, { passive: true });
  }

  /**
   * Aggiunge animazioni staggered a una lista di elementi
   */
  staggerAnimation(elements, animationType = 'fadeInUp', baseDelay = 0) {
    if (this.config.enableReducedMotion) return;

    elements.forEach((element, index) => {
      const delay = baseDelay + (index * this.config.staggerDelay);
      element.style.animationDelay = `${delay}ms`;
      this.triggerAnimation(element, animationType);
    });
  }

  /**
   * Crea effetto shimmer per elementi loading
   */
  addShimmerEffect(element) {
    if (this.config.enableReducedMotion) return;

    const shimmer = document.createElement('div');
    shimmer.className = 'shimmer-effect';
    shimmer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(255,255,255,0.4) 50%, 
        transparent 100%);
      animation: shimmer 2s infinite;
      pointer-events: none;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(shimmer);

    // Rimuovi dopo 3 secondi
    setTimeout(() => {
      if (shimmer.parentNode) {
        shimmer.remove();
      }
    }, 3000);
  }

  /**
   * Throttle utility per ottimizzare le performance
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Pulisce e distrugge il controller
   */
  destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    if (this.handleScroll) {
      window.removeEventListener('scroll', this.handleScroll);
    }
    
    this.animatedElements.clear();
    this.scrollElements = [];
    this.isInitialized = false;
  }
}

// Utility class per animazioni CSS
export class CSSAnimationUtils {
  /**
   * Aggiunge classe di animazione con auto-cleanup
   */
  static animate(element, animationClass, duration = 1000) {
    return new Promise(resolve => {
      element.classList.add(animationClass);
      
      const cleanup = () => {
        element.classList.remove(animationClass);
        resolve();
      };
      
      setTimeout(cleanup, duration);
    });
  }

  /**
   * Crea animazione di typing effect
   */
  static typeWriter(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';
    
    return new Promise(resolve => {
      const timer = setInterval(() => {
        if (i < text.length) {
          element.textContent += text.charAt(i);
          i++;
        } else {
          clearInterval(timer);
          resolve();
        }
      }, speed);
    });
  }

  /**
   * Crea animazione di conteggio numerico
   */
  static countUp(element, start, end, duration = 2000) {
    const startTime = performance.now();
    const range = end - start;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(start + (range * easeOutExpo));
      
      element.textContent = current;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }
}