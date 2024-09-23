const rootStyles = getComputedStyle(document.documentElement);

const layoutroot = document.getElementById('layoutroot');

function textchenger(text, idtext) {
    let char = text.split('');
    for (let i = 0; i < char.length; i++) {
        
        char[i] = char[i].charCodeAt(0) + 1;
    }
}

