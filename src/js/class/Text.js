class TextClass {
  textWriter(text, element, speed = 60) {
    if (!element || !(element instanceof HTMLElement)) {
      throw new Error("Invalid element provided");
    }

    if (typeof text !== "string") {
      throw new Error("Text must be a string");
    }

    return new Promise((resolve) => {
      element.innerHTML = "";

      if (text.length === 0) {
        console.warn("Text is empty");
        resolve();
        return;
      }

      const characters = text.split("");
      characters.forEach((char, index) => {
        setTimeout(() => {
          element.innerHTML += char;
          if (index === characters.length - 1) resolve();
        }, speed * index);
      });
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
