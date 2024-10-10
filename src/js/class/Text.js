class TextClass {


    //  Function for simulate a text writer
    textWrriter(text, element) {
        element.innerHTML = "";
        if (text.length > 0) {
            let caracther = text.split("");
            for (let i = 0; i < caracther.length; i++) {
                setTimeout(() => {
                    element.innerHTML += `${caracther[i]}`;
                }, 60 * i);
            }
        } else {
            console.log("Text is empty");
        }
    }


    // Function for calculate the width of a text
    // Function for calculating the width of a text
    setlenText(textFild, testo) {
        const stile = window.getComputedStyle(textFild);
        const elemento = document.createElement('span');
        elemento.style.cssText = stile.cssText;


        elemento.style.visibility = 'hidden';
        elemento.style.whiteSpace = 'nowrap';
        elemento.style.position = 'absolute';
        elemento.style.boxSizing = 'border-box';

        elemento.textContent = testo;
        document.body.appendChild(elemento);
        const len = elemento.offsetWidth;
        document.body.removeChild(elemento);

        // Applica la larghezza calcolata all'elemento target
        textFild.style.width = len + 'px';
        console.log("calculated length ", len + 'px');
    }









}

