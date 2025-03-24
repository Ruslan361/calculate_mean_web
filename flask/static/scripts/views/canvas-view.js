/**
 * View class for handling canvas rendering and interactions
 */
class CanvasView {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.currentImage = null;
        this.cachedImage = null; // Cache for the blurred image
        
        this.scaleFactor = 1;
        this.isDraggingLine = false;
        this.dragLineIndex = -1;
        this.dragLineType = '';
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
        this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
        this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
        this.canvas.addEventListener("wheel", this.handleWheel.bind(this));
    }
    
    handleMouseDown(e) {
        if (!this.currentImage) return;
        
        const x = e.offsetX / this.scaleFactor;
        const y = e.offsetY / this.scaleFactor;
        
        // Check if clicked on vertical line
        const dragLineIndex = this.currentImage.verticalLines.findIndex(
            lineX => Math.abs(lineX - x) < 5
        );
        
        if (dragLineIndex !== -1) {
            this.isDraggingLine = true;
            this.dragLineType = 'vertical';
            this.dragLineIndex = dragLineIndex;
            return;
        }
        
        // Check if clicked on horizontal line
        const horizLineIndex = this.currentImage.horizontalLines.findIndex(
            lineY => Math.abs(lineY - y) < 5
        );
        
        if (horizLineIndex !== -1) {
            this.isDraggingLine = true;
            this.dragLineType = 'horizontal';
            this.dragLineIndex = horizLineIndex;
            return;
        }
    }
    
    handleMouseMove(e) {
        if (!this.isDraggingLine || !this.currentImage) return;
        
        if (this.dragLineType === 'vertical') {
            this.currentImage.verticalLines[this.dragLineIndex] = e.offsetX / this.scaleFactor;
        } else if (this.dragLineType === 'horizontal') {
            this.currentImage.horizontalLines[this.dragLineIndex] = e.offsetY / this.scaleFactor;
        }
        
        this.redraw();
    }
    
    handleMouseUp() {
        this.isDraggingLine = false;
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        if (!this.currentImage || !this.cachedImage) return;
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.scaleFactor *= delta;
        
        this.canvas.width = this.cachedImage.width * this.scaleFactor;
        this.canvas.height = this.cachedImage.height * this.scaleFactor;
        
        this.redraw();
    }
    
    setImage(image) {
        this.currentImage = image;
        
        if (image) {
            // Cache the image for faster redrawing
            this.cachedImage = new Image();
            this.cachedImage.onload = () => {
                this.canvas.width = this.cachedImage.width * this.scaleFactor;
                this.canvas.height = this.cachedImage.height * this.scaleFactor;
                this.redraw();
            };
            this.cachedImage.src = image.blurredImage;
        } else {
            this.cachedImage = null;
        }
    }
    
    redraw() {
        if (!this.currentImage || !this.cachedImage) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw the cached image
        this.ctx.drawImage(this.cachedImage, 0, 0, this.canvas.width, this.canvas.height);
            
        // Draw grid lines
        this.ctx.strokeStyle = "red";    
        this.ctx.lineWidth = 3;  
        
        // Draw vertical lines
        if (this.currentImage.verticalLines && this.currentImage.verticalLines.length > 0) {
            this.currentImage.verticalLines.forEach(x => { 
                this.ctx.beginPath(); 
                this.ctx.moveTo(x * this.scaleFactor, 0); 
                this.ctx.lineTo(x * this.scaleFactor, this.canvas.height); 
                this.ctx.stroke();
            });
        }
        
        // Draw horizontal lines
        if (this.currentImage.horizontalLines && this.currentImage.horizontalLines.length > 0) {
            this.currentImage.horizontalLines.forEach(y => { 
                this.ctx.beginPath(); 
                this.ctx.moveTo(0, y * this.scaleFactor); 
                this.ctx.lineTo(this.canvas.width, y * this.scaleFactor); 
                this.ctx.stroke(); 
            });
        }
    }
    
    addVerticalLine() {
        if (!this.currentImage) return;
        
        this.currentImage.verticalLines.push(this.canvas.width / (2 * this.scaleFactor));
        this.redraw();
    }
    
    addHorizontalLine() {
        if (!this.currentImage) return;
        
        this.currentImage.horizontalLines.push(this.canvas.height / (2 * this.scaleFactor));
        this.redraw();
    }
    
    removeVerticalLine() {
        if (!this.currentImage || !this.currentImage.verticalLines.length) return;
        
        this.currentImage.verticalLines.pop();
        this.redraw();
    }
    
    removeHorizontalLine() {
        if (!this.currentImage || !this.currentImage.horizontalLines.length) return;
        
        this.currentImage.horizontalLines.pop();
        this.redraw();
    }
    
    getCurrentImage() {
        return this.currentImage;
    }
}