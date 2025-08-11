class TextClass {
  textWriter(text, element, speed = 60) {
    if (!element || !(element instanceof HTMLElement)) {
      throw new Error("Invalid element provided");
    }

    if (typeof text !== "string") {
      throw new Error("Text must be a string");
    }

    // Respect reduced motion preference
    const prefersReducedMotion =
      !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    return new Promise((resolve) => {
      // Build modern UI inside the target element
      element.innerHTML = "";
      element.classList.add("tw-upgraded");

      // Card container (use spans to remain valid inside <p>)
      const card = document.createElement("span");
      card.className = "tw-card";

      // Header
      const header = document.createElement("span");
      header.className = "tw-header";
      const headerLeft = document.createElement("span");
      headerLeft.className = "tw-header-left";
      const icon = document.createElement("i");
      icon.className = "bi bi-type";
      const title = document.createElement("span");
      title.className = "tw-title";
      title.textContent = "Typing";
      headerLeft.append(icon, title);
      const status = document.createElement("span");
      status.className = "tw-status";
      status.innerHTML = '<span class="tw-dot"></span> live';
      header.append(headerLeft, status);

      // Body (text + caret)
  const body = document.createElement("span");
  body.className = "tw-body";
  body.setAttribute("role", "status");
  body.setAttribute("aria-live", "polite");
  body.setAttribute("aria-atomic", "true");
      const textSpan = document.createElement("span");
      textSpan.className = "tw-text";
      const caret = document.createElement("span");
      caret.className = "tw-caret";
      body.append(textSpan, caret);

      // Progress
  const progress = document.createElement("span");
  progress.className = "tw-progress";
      const progressBar = document.createElement("span");
  progressBar.className = "tw-progress-bar";
  progressBar.setAttribute("role", "progressbar");
  progressBar.setAttribute("aria-valuemin", "0");
  progressBar.setAttribute("aria-valuemax", "100");
  progressBar.setAttribute("aria-valuenow", "0");
      progress.appendChild(progressBar);

      // Assemble
      card.append(header, body, progress);
      element.appendChild(card);

      if (text.length === 0) {
        console.warn("Text is empty");
        progressBar.style.width = "0%";
        resolve();
        return;
      }

      // Reduced motion: render immediately
      if (prefersReducedMotion) {
        textSpan.textContent = text;
        progressBar.style.width = "100%";
        caret.classList.add("tw-caret-hide");
        title.textContent = "Ready";
        status.innerHTML = '<span class="tw-dot tw-dot-idle"></span> idle';
        resolve();
        return;
      }

      // Typing animation
      const total = text.length;
      let index = 0;

      const tick = () => {
        // Safety: if element got detached, end gracefully
        if (!element.isConnected) {
          resolve();
          return;
        }

        textSpan.textContent += text.charAt(index);
        index += 1;
        const pct = Math.min(100, Math.round((index / total) * 100));
  progressBar.style.width = pct + "%";
  progressBar.setAttribute("aria-valuenow", String(pct));

        if (index < total) {
          setTimeout(tick, speed);
        } else {
          // Done
          caret.classList.add("tw-caret-done");
          title.textContent = "Ready";
          status.innerHTML = '<span class="tw-dot tw-dot-done"></span> done';
          resolve();
        }
      };

      // Start
      setTimeout(tick, speed);
    });
  }

  setTextLength(textField, text) {
    if (!textField || !(textField instanceof HTMLElement)) {
      throw new Error("Invalid text field element");
    }

    if (typeof text !== "string") {
      throw new Error("Text must be a string");
    }

    const measureElement = document.createElement("span");
    const computedStyle = window.getComputedStyle(textField);

    measureElement.style.cssText = `
            visibility: hidden;
            white-space: nowrap;
            position: absolute;
            box-sizing: border-box;
            font-family: ${computedStyle.fontFamily};
            font-size: ${computedStyle.fontSize};
            font-weight: ${computedStyle.fontWeight};
            letter-spacing: ${computedStyle.letterSpacing};
        `;

    measureElement.textContent = text;
    document.body.appendChild(measureElement);

    const width = measureElement.offsetWidth;
    document.body.removeChild(measureElement);

    const finalWidth = width + 2;
    textField.style.width = `${finalWidth}px`;

    return finalWidth;
  }
}
