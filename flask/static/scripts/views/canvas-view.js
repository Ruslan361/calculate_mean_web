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
        this.categoryManager = new CategoryManager(); // Initialize the category manager
        this.contextMenuManager = new ContextMenuManager(); // Initialize the context menu manager
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
        this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
        this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
        this.canvas.addEventListener("wheel", this.handleWheel.bind(this));
        this.canvas.addEventListener("contextmenu", this.handleRightClick.bind(this));
        
        // Add document click listener to hide context menu when clicking elsewhere
        document.addEventListener("click", (e) => {
            if (this.contextMenu && e.button !== 2) {
                this.contextMenu.remove();
                this.contextMenu = null;
            }
        });
        
        // Add regular click handler for left click cell selection
        this.canvas.addEventListener("click", this.handleLeftClick.bind(this));
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
    
    handleRightClick(e) {
        e.preventDefault();
        
        if (!this.currentImage) return;
        
        const x = e.offsetX / this.scaleFactor;
        const y = e.offsetY / this.scaleFactor;
        
        // Check if clicked near a vertical line
        const nearVerticalLine = this.currentImage.verticalLines.findIndex(
            lineX => Math.abs(lineX - x) < 5
        );
        
        // Check if clicked near a horizontal line
        const nearHorizontalLine = this.currentImage.horizontalLines.findIndex(
            lineY => Math.abs(lineY - y) < 5
        );
        
        // Find the cell in the grid
        const vIndex = this.findGridIndex(x, this.currentImage.verticalLines);
        const hIndex = this.findGridIndex(y, this.currentImage.horizontalLines);
        
        // For exactly 2 categories, directly select with the second category without a menu
        /*
        if (this.currentImage.selectionCategories.length === 2 && 
            vIndex !== -1 && hIndex !== -1 && 
            nearVerticalLine === -1 && nearHorizontalLine === -1) {
            
            const tableView = window.app.tableView;
            tableView.toggleCellSelection(hIndex, vIndex, this.currentImage.selectionCategories[1].id);
            return; // Exit early, no context menu needed
        }
        */
        // Use the context menu manager to show the appropriate menu
        if (nearVerticalLine !== -1) {
            this.contextMenuManager.showLineMenu(
                this.currentImage, 
                this, 
                e.pageX, 
                e.pageY, 
                nearVerticalLine, 
                'vertical'
            );
        } else if (nearHorizontalLine !== -1) {
            this.contextMenuManager.showLineMenu(
                this.currentImage, 
                this, 
                e.pageX, 
                e.pageY, 
                nearHorizontalLine, 
                'horizontal'
            );
        } else if (vIndex !== -1 && hIndex !== -1) {
            // Show cell selection menu
            /*this.contextMenuManager.showCellMenu(
                this.currentImage,
                this,
                e.pageX,
                e.pageY,
                hIndex,
                vIndex
            );
            */
            this.contextMenuManager.showLineMenu(
                this.currentImage,
                this,
                e.pageX,
                e.pageY,
                -1, // No line index
                '' // No specific line type
            );
        } 
    }
    
    handleLeftClick(e) {
        if (!this.currentImage || this.isDraggingLine) return;
        
        const x = e.offsetX / this.scaleFactor;
        const y = e.offsetY / this.scaleFactor;
        
        // Don't process if near a line
        const nearVerticalLine = this.currentImage.verticalLines.findIndex(
            lineX => Math.abs(lineX - x) < 5
        );
        const nearHorizontalLine = this.currentImage.horizontalLines.findIndex(
            lineY => Math.abs(lineY - y) < 5
        );
        if (nearVerticalLine !== -1 || nearHorizontalLine !== -1) return;
        
        // Find the cell in the grid
        const vIndex = this.findGridIndex(x, this.currentImage.verticalLines);
        const hIndex = this.findGridIndex(y, this.currentImage.horizontalLines);
        
        if (vIndex !== -1 && hIndex !== -1) {
            // For exactly 2 categories, use the first category for left click
            if (this.currentImage.selectionCategories.length === 2) {
                const tableView = window.app.tableView;
                tableView.toggleCellSelection(hIndex, vIndex, this.currentImage.selectionCategories[0].id);
            }
        }
    }

    findGridIndex(value, lines) {
        lines.sort((a, b) => a - b);
        if (!lines || lines.length < 1) return -1;
        if (value < lines[0])
            return 0;
        for (let i = 0; i < lines.length - 1; i++) {
            if (value >= lines[i] && value < lines[i + 1]) {
                return i + 1;
            }
        }
        if (value > lines[lines.length - 1])
            return lines.length;
        return -1;
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
        // Recalculate luminance
        window.app.calculateLuminance();
    }
    
    addHorizontalLine() {
        if (!this.currentImage) return;
        
        this.currentImage.horizontalLines.push(this.canvas.height / (2 * this.scaleFactor));
        this.redraw();
        // Recalculate luminance
        window.app.calculateLuminance();
    }
    
    removeVerticalLine() {
        if (!this.currentImage || !this.currentImage.verticalLines.length) return;
        
        this.currentImage.verticalLines.pop();
        this.redraw();
        // Recalculate luminance
        window.app.calculateLuminance();
    }
    
    removeHorizontalLine() {
        if (!this.currentImage || !this.currentImage.horizontalLines.length) return;
        
        this.currentImage.horizontalLines.pop();
        this.redraw();
        // Recalculate luminance
        window.app.calculateLuminance();
    }
    
    getCurrentImage() {
        return this.currentImage;
    }
    
    showCategoryManager() {
        // Use the new CategoryManager class
        this.categoryManager.show(this.currentImage);
    }
}