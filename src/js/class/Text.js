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
    setLarghezzaTesto(textFild, testo) {
        const stile = window.getComputedStyle(textFild);
        const elemento = document.createElement('span');
        elemento.style = stile;
        elemento.style.visibility = 'hidden';
        elemento.textContent = testo;
        document.body.appendChild(elemento);
        const larghezza = elemento.offsetWidth;
        document.body.removeChild(elemento);
        textFild.style.width = larghezza;
    }








}

