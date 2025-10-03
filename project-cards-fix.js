/* =========================
   JavaScript Fix per Progetti Invisibili
   ========================= */

// Funzione per forzare la visibilità di tutti i progetti
function forceProjectCardsVisibility() {
  console.log('🔧 Forcing project cards visibility...');
  
  // Seleziona TUTTI i project cards
  const projectCards = document.querySelectorAll('.project-card');
  const projectsGrid = document.querySelector('.projects-grid');
  const projectsSection = document.querySelector('.projects-section');
  
  // Forza la visibilità della griglia
  if (projectsGrid) {
    projectsGrid.style.opacity = '1';
    projectsGrid.style.visibility = 'visible';
    projectsGrid.style.display = 'grid';
    projectsGrid.style.transform = 'none';
    projectsGrid.classList.add('animate-in');
  }
  
  // Forza la visibilità della sezione
  if (projectsSection) {
    projectsSection.style.overflow = 'visible';
    projectsSection.style.height = 'auto';
    projectsSection.classList.add('animate-in');
  }
  
  // Forza la visibilità di ogni singola card
  projectCards.forEach((card, index) => {
    card.style.opacity = '1';
    card.style.visibility = 'visible';
    card.style.display = 'flex';
    card.style.transform = 'translateY(0)';
    card.classList.add('animate-in');
    
    // Rimuove qualsiasi style inline che potrebbe nascondere la card
    if (card.style.display === 'none') {
      card.style.display = 'flex';
    }
    
    console.log(`✅ Project card ${index + 1} forced visible`);
  });
  
  console.log(`🎯 Total project cards made visible: ${projectCards.length}`);
}

// Esegui immediatamente
forceProjectCardsVisibility();

// Esegui dopo il DOM load
document.addEventListener('DOMContentLoaded', forceProjectCardsVisibility);

// Esegui dopo il window load
window.addEventListener('load', forceProjectCardsVisibility);

// Esegui quando il contenuto è modificato (per caricamenti dinamici)
const observer = new MutationObserver((mutations) => {
  let shouldCheck = false;
  
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' || mutation.type === 'attributes') {
      // Controlla se sono stati aggiunti o modificati project cards
      const addedNodes = Array.from(mutation.addedNodes);
      const hasProjectCards = addedNodes.some(node => 
        node.nodeType === Node.ELEMENT_NODE && 
        (node.classList?.contains('project-card') || 
         node.querySelector?.('.project-card'))
      );
      
      if (hasProjectCards) {
        shouldCheck = true;
      }
    }
  });
  
  if (shouldCheck) {
    setTimeout(forceProjectCardsVisibility, 100);
  }
});

// Osserva modifiche al DOM
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['style', 'class']
});

// Controlla periodicamente (fallback di sicurezza)
setInterval(() => {
  const hiddenCards = document.querySelectorAll('.project-card[style*="opacity: 0"], .project-card[style*="display: none"]');
  if (hiddenCards.length > 0) {
    console.warn(`⚠️ Found ${hiddenCards.length} hidden project cards, fixing...`);
    forceProjectCardsVisibility();
  }
}, 2000);

console.log('🚀 Project cards visibility fixer loaded');