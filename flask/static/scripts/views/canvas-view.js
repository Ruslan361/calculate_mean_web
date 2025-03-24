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
        this.contextMenu = null;
        
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
        
        // Remove existing context menu if any
        if (this.contextMenu) {
            this.contextMenu.remove();
        }
        
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
        
        // Create context menu
        this.contextMenu = document.createElement("div");
        this.contextMenu.className = "context-menu";
        this.contextMenu.style.position = "absolute";
        this.contextMenu.style.left = e.pageX + "px";
        this.contextMenu.style.top = e.pageY + "px";
        this.contextMenu.style.background = "white";
        this.contextMenu.style.border = "1px solid #ccc";
        this.contextMenu.style.padding = "5px 0";
        this.contextMenu.style.borderRadius = "4px";
        this.contextMenu.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
        this.contextMenu.style.zIndex = "1000";
        
        if (nearVerticalLine !== -1) {
            // Near vertical line, add delete option
            this.addMenuItem(this.contextMenu, "Удалить вертикальную линию", () => {
                this.currentImage.verticalLines.splice(nearVerticalLine, 1);
                this.redraw();
                // Recalculate luminance
                window.app.calculateLuminance();
            });
        } else if (nearHorizontalLine !== -1) {
            // Near horizontal line, add delete option
            this.addMenuItem(this.contextMenu, "Удалить горизонтальную линию", () => {
                this.currentImage.horizontalLines.splice(nearHorizontalLine, 1);
                this.redraw();
                // Recalculate luminance
                window.app.calculateLuminance();
            });
        } else {
            // Not near any line, add options to add lines
            this.addMenuItem(this.contextMenu, "Добавить вертикальную линию", () => {
                this.currentImage.verticalLines.push(x);
                this.currentImage.verticalLines.sort((a, b) => a - b);
                this.redraw();
                // Recalculate luminance
                window.app.calculateLuminance();
            });
            
            this.addMenuItem(this.contextMenu, "Добавить горизонтальную линию", () => {
                this.currentImage.horizontalLines.push(y);
                this.currentImage.horizontalLines.sort((a, b) => a - b);
                this.redraw();
                // Recalculate luminance
                window.app.calculateLuminance();
            });
            
            this.addMenuItem(this.contextMenu, "Выделить ячейки в таблице", () => {
                // Find the cell in the grid where the click happened
                const vIndex = this.findGridIndex(x, this.currentImage.verticalLines);
                const hIndex = this.findGridIndex(y, this.currentImage.horizontalLines);
                
                if (vIndex !== -1 && hIndex !== -1) {
                    // Get table and toggle selection of the cell
                    const tableView = window.app.tableView;
                    tableView.toggleCellSelection(hIndex, vIndex);
                }
            });
        }
        
        document.body.appendChild(this.contextMenu);
    }
    
    addMenuItem(menu, text, onClick) {
        const item = document.createElement("div");
        item.textContent = text;
        item.style.padding = "8px 12px";
        item.style.cursor = "pointer";
        
        item.onmouseover = () => {
            item.style.backgroundColor = "#f0f0f0";
        };
        
        item.onmouseout = () => {
            item.style.backgroundColor = "transparent";
        };
        
        item.onclick = () => {
            onClick();
            this.contextMenu.remove();
            this.contextMenu = null;
        };
        
        menu.appendChild(item);
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
}