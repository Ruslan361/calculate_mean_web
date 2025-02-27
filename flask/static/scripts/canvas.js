const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let canvasContainer = {
    imsrc: '',
    img: new Image(),
    isResizing : false,
    isDraggingLine : false,
    dragLineIndex : -1,
    dragLineType: '', // 'vertical' or 'horizontal'
    scaleFactor: 1,
    drawGrid : function() {
        //console.log(this.img.src);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(this.img, 0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "red";    
        ctx.lineWidth = 3;  
        this.verticalLines.forEach(x => { 
            ctx.beginPath(); 
            ctx.moveTo(x * this.scaleFactor, 0); 
            ctx.lineTo(x * this.scaleFactor, canvas.height); 
            ctx.stroke();
        }); 
        this.horizontalLines.forEach(y => { 
            ctx.beginPath(); 
            ctx.moveTo(0, y * this.scaleFactor); 
            ctx.lineTo(canvas.width, y * this.scaleFactor); 
            ctx.stroke(); 
        });
    },
    addVerticalLine : function() {
        this.verticalLines.push(canvas.width / (2 * this.scaleFactor));
        this.drawGrid();
    },
    addHorizontalLine : function() {
        this.horizontalLines.push(canvas.height / (2 * this.scaleFactor));
        this.drawGrid();
    },
    removeVerticalLine: function () {
        this.verticalLines.pop();
        this.drawGrid();
    },
    removeHorizontalLine: function () {
        this.horizontalLines.pop();
        this.drawGrid();
    },
    insert: function(imsrc) {
        this.img.src = imsrc;
        this.imsrc = imsrc;
        //this.image = image;
        //console.log(this.img.src);
        // canvas.src = src;
        // ctx.drawImage(this.img, 0, 0, canvas.width, canvas.height);
        // this.drawGrid();
        this.img.onload = () => {
            ctx.drawImage(this.img, 0, 0, canvas.width, canvas.height);
            
            let N = 3;
            let stepWidth = this.img.width / (N+1);
            let stepHeight = this.img.height / (N+1);
            this.verticalLines = [];
            this.horizontalLines = [];
            for (let i = stepWidth; i < this.img.width; i+=stepWidth) {
                this.verticalLines.push(i);
            }
            for (let i = stepHeight; i < this.img.height; i+=stepHeight) {
                this.horizontalLines.push(i);
            }
            this.drawGrid();
            calculateLuminance();
        };
    }
};

canvas.addEventListener("mousedown", ((e) => {
    const x = e.offsetX / canvasContainer.scaleFactor;
    const y = e.offsetY / canvasContainer.scaleFactor;
    dragLineIndex = canvasContainer.verticalLines.findIndex(lineX => Math.abs(lineX - x) < 5);
    if (dragLineIndex !== -1) {
        canvasContainer.isDraggingLine = true;
        canvasContainer.dragLineType = 'vertical';
        return;
    }
    dragLineIndex = canvasContainer.horizontalLines.findIndex(lineY => Math.abs(lineY - y) < 5);
    if (dragLineIndex !== -1) {
        canvasContainer.isDraggingLine = true;
        canvasContainer.dragLineType = 'horizontal';
        return;
    }
}).bind(canvasContainer));

canvas.addEventListener("mousemove", ((e) => {
    if (canvasContainer.isDraggingLine) {
        if (canvasContainer.dragLineType === 'vertical') {
            canvasContainer.verticalLines[dragLineIndex] = e.offsetX / canvasContainer.scaleFactor;
        } else if (canvasContainer.dragLineType === 'horizontal') {
            canvasContainer.horizontalLines[dragLineIndex] = e.offsetY / canvasContainer.scaleFactor;
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
    canvas.width = canvasContainer.img.width * canvasContainer.scaleFactor;
    canvas.height = canvasContainer.img.height * canvasContainer.scaleFactor;
    canvasContainer.drawGrid();
}));

window.canvasContainer = canvasContainer;