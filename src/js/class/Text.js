class TextClass {
    /**
     * Simulates a typewriter effect on a given element
     * @param {string} text - The text to animate
     * @param {HTMLElement} element - The DOM element to write the text into
     * @param {number} [speed=60] - Speed of typing in milliseconds
     * @returns {Promise} Resolves when animation is complete
     */
    textWriter(text, element, speed = 60) {
        if (!element || !(element instanceof HTMLElement)) {
            throw new Error('Invalid element provided');
        }

        if (typeof text !== 'string') {
            throw new Error('Text must be a string');
        }

        return new Promise((resolve) => {
            element.innerHTML = '';

            if (text.length === 0) {
                console.warn('Text is empty');
                resolve();
                return;
            }

            const characters = text.split('');
            characters.forEach((char, index) => {
                setTimeout(() => {
                    element.innerHTML += char;
                    if (index === characters.length - 1) resolve();
                }, speed * index);
            });
        });
    }

    /**
     * Calculates and sets the width of a text field based on its content
     * @param {HTMLElement} textField - The text field element
     * @param {string} text - The text to measure
     * @returns {number} The calculated width in pixels
     */
    setTextLength(textField, text) {
        if (!textField || !(textField instanceof HTMLElement)) {
            throw new Error('Invalid text field element');
        }

        if (typeof text !== 'string') {
            throw new Error('Text must be a string');
        }

        const measureElement = document.createElement('span');
        const computedStyle = window.getComputedStyle(textField);

        // Copy relevant styles
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

        // Add small padding to prevent text cutoff
        const finalWidth = width + 2;
        textField.style.width = `${finalWidth}px`;

        return finalWidth;
    }
}
