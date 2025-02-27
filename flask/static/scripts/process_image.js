async function  calculateLuminanceRemoute(base64, vertical_lines, horizontal_lines) {
    // ipcRenderer.invoke("calculate-grid-luminance", imgsrc,  verticalLines, horizontalLines).then(result => {
    //     // luminanceOutput.textContent = "Средняя светимость: " + JSON.stringify(result);
    //     updateLuminanceTable(result);
    // }); 
    let response = await fetch('/mean-luminance', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64, vertical_lines: vertical_lines, horizontal_lines: horizontal_lines })
    });
    if (response.ok) {
        let data = await response.json();
        return data;
    } else {
        throw new Error("HTTP error: " + response.status);
    }
}





async function blurImage(image) {
    // let bitmap = fs.readFileSync(image);
    // let base64 = new Buffer(bitmap).toString('base64');
    let response = await fetch('/gaussian-blur', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: image }),
    });
    if (response.ok) {
        let data = await response.json();
        return data.image;
    } else {
        throw new Error("HTTP error: " + response.status)
    }
}
/*
function insertImageToCanvas(src) {
    let promise = new Promise((resolve, reject) => {
        blurImage(src).then(data => {
            imgsrc = src;
            img.src = 'data:image/png;base64,' + data;
            img.onload = () => {
                canvas.width = img.width * scaleFactor;
                canvas.height = img.height * scaleFactor;
                drawGrid();
                resolve();
            };
        });
    });
}
window.insertImageToCanvas = insertImageToCanvas;
*/
window.blurImage = blurImage;
window.calculateLuminanceRemoute = calculateLuminanceRemoute;