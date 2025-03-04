const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let canvasContainer = {
    imsrc: '',
    blured: new Image(),
    blurredImg: null,
    isResizing: false,
    isDraggingLine: false,
    dragLineIndex: -1,
    dragLineType: '', // 'vertical' or 'horizontal'
    scaleFactor: 1,
    drawGrid: function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.image && this.blurredImg) {
            ctx.drawImage(this.blurredImg, 0, 0, canvas.width, canvas.height);
            
            // Рисуем линии после загрузки изображения
            ctx.strokeStyle = "red";    
            ctx.lineWidth = 3;  
            
            if (this.image.verticalLines && this.image.verticalLines.length > 0) {
                this.image.verticalLines.forEach(x => { 
                    ctx.beginPath(); 
                    ctx.moveTo(x * this.scaleFactor, 0); 
                    ctx.lineTo(x * this.scaleFactor, canvas.height); 
                    ctx.stroke();
                });
            }
            
            if (this.image.horizontalLines && this.image.horizontalLines.length > 0) {
                this.image.horizontalLines.forEach(y => { 
                    ctx.beginPath(); 
                    ctx.moveTo(0, y * this.scaleFactor); 
                    ctx.lineTo(canvas.width, y * this.scaleFactor); 
                    ctx.stroke(); 
                });
            }
        }
    },
    addVerticalLine : function() {
        this.image.verticalLines.push(canvas.width / (2 * this.scaleFactor));
        this.drawGrid();
    },
    addHorizontalLine : function() {
        this.image.horizontalLines.push(canvas.height / (2 * this.scaleFactor));
        this.drawGrid();
    },
    removeVerticalLine: function () {
        this.image.verticalLines.pop();
        this.drawGrid();
    },
    removeHorizontalLine: function () {
        this.image.horizontalLines.pop();
        this.drawGrid();
    },
    insert: function(image) {
        // Сохраняем выбранные ячейки текущего изображения перед сменой
        if (this.image && typeof this.image.updateSelectedCells === 'function') {
            this.image.updateSelectedCells();
        }
        
        this.image = image;
        
        // Создаем размытое изображение
        this.blurredImg = new Image();
        this.blurredImg.onload = () => {
            canvas.width = this.blurredImg.width * this.scaleFactor;
            canvas.height = this.blurredImg.height * this.scaleFactor;
            this.drawGrid();
            
            // Если у изображения есть данные светимости и выбранные ячейки
            if (image.luminanceData) {
                data = {
                    luminance: image.luminanceData,
                    grid: [image.horizontalLines, image.verticalLines]
                };
                updateLuminanceTable(data);
                restoreSelectedCells();
            } else {
                calculateLuminance(); // Вычисляем светимость с нуля
            }
        };
        this.blurredImg.src = image.blurredImage;
    }
};

canvas.addEventListener("mousedown", ((e) => {
    const x = e.offsetX / canvasContainer.scaleFactor;
    const y = e.offsetY / canvasContainer.scaleFactor;
    const dragLineIndex = canvasContainer.image.verticalLines.findIndex(lineX => Math.abs(lineX - x) < 5);
    if (dragLineIndex !== -1) {
        canvasContainer.isDraggingLine = true;
        canvasContainer.dragLineType = 'vertical';
        canvasContainer.dragLineIndex = dragLineIndex;
        return;
    }
    const horizLineIndex = canvasContainer.image.horizontalLines.findIndex(lineY => Math.abs(lineY - y) < 5);
    if (horizLineIndex !== -1) {
        canvasContainer.isDraggingLine = true;
        canvasContainer.dragLineType = 'horizontal';
        canvasContainer.dragLineIndex = horizLineIndex;
        return;
    }
}));

canvas.addEventListener("mousemove", ((e) => {
    if (canvasContainer.isDraggingLine) {
        if (canvasContainer.dragLineType === 'vertical') {
            canvasContainer.image.verticalLines[canvasContainer.dragLineIndex] = e.offsetX / canvasContainer.scaleFactor;
        } else if (canvasContainer.dragLineType === 'horizontal') {
            canvasContainer.image.horizontalLines[canvasContainer.dragLineIndex] = e.offsetY / canvasContainer.scaleFactor;
        }
        canvasContainer.drawGrid();
    }
}));

canvas.addEventListener("mouseup", (() => {
    canvasContainer.isDraggingLine = false;
}));

canvas.addEventListener("wheel", ((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    canvasContainer.scaleFactor *= delta;
    
    if (canvasContainer.image && canvasContainer.image.img) {
        canvas.width = canvasContainer.image.img.width * canvasContainer.scaleFactor;
        canvas.height = canvasContainer.image.img.height * canvasContainer.scaleFactor;
        canvasContainer.drawGrid();
    }
}));

window.canvasContainer = canvasContainer;