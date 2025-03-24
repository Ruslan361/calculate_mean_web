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
            
            // Find the cell in the grid where the click happened
            const vIndex = this.findGridIndex(x, this.currentImage.verticalLines);
            const hIndex = this.findGridIndex(y, this.currentImage.horizontalLines);
            
            if (vIndex !== -1 && hIndex !== -1) {
                // Add a selection submenu with categories
                const selectionMenuItem = document.createElement("div");
                selectionMenuItem.textContent = "Выделить ячейку как...";
                selectionMenuItem.style.padding = "8px 12px";
                selectionMenuItem.style.cursor = "pointer";
                selectionMenuItem.style.position = "relative";
                
                const categorySubmenu = document.createElement("div");
                categorySubmenu.className = "context-submenu";
                categorySubmenu.style.position = "absolute";
                categorySubmenu.style.left = "100%";
                categorySubmenu.style.top = "0";
                categorySubmenu.style.background = "white";
                categorySubmenu.style.border = "1px solid #ccc";
                categorySubmenu.style.padding = "5px 0";
                categorySubmenu.style.borderRadius = "4px";
                categorySubmenu.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
                categorySubmenu.style.display = "none";
                categorySubmenu.style.zIndex = "1001";
                
                selectionMenuItem.onmouseover = () => {
                    selectionMenuItem.style.backgroundColor = "#f0f0f0";
                    categorySubmenu.style.display = "block";
                };
                
                selectionMenuItem.onmouseout = (e) => {
                    // Check if mouse moved to submenu
                    if (!e.relatedTarget || !categorySubmenu.contains(e.relatedTarget)) {
                        selectionMenuItem.style.backgroundColor = "transparent";
                        categorySubmenu.style.display = "none";
                    }
                };
                
                categorySubmenu.onmouseover = () => {
                    selectionMenuItem.style.backgroundColor = "#f0f0f0";
                    categorySubmenu.style.display = "block";
                };
                
                categorySubmenu.onmouseout = () => {
                    categorySubmenu.style.display = "none";
                    selectionMenuItem.style.backgroundColor = "transparent";
                };
                
                // Add category options
                this.currentImage.selectionCategories.forEach(category => {
                    this.addMenuItem(categorySubmenu, category.name, () => {
                        // Get table and toggle selection of the cell with this category
                        const tableView = window.app.tableView;
                        tableView.toggleCellSelection(hIndex, vIndex, category.id);
                        
                        // Close menus
                        this.contextMenu.remove();
                        this.contextMenu = null;
                    }, category.color);
                });
                
                // Add option to manage categories
                this.addMenuItem(categorySubmenu, "Управление категориями...", () => {
                    this.showCategoryManager();
                    
                    // Close menus
                    this.contextMenu.remove();
                    this.contextMenu = null;
                });
                
                selectionMenuItem.appendChild(categorySubmenu);
                this.contextMenu.appendChild(selectionMenuItem);
            }
        }
        
        document.body.appendChild(this.contextMenu);
    }
    
    addMenuItem(menu, text, onClick, color = null) {
        const item = document.createElement("div");
        item.style.padding = "8px 12px";
        item.style.cursor = "pointer";
        item.style.display = "flex";
        item.style.alignItems = "center";
        
        if (color) {
            const colorIndicator = document.createElement("span");
            colorIndicator.style.display = "inline-block";
            colorIndicator.style.width = "12px";
            colorIndicator.style.height = "12px";
            colorIndicator.style.backgroundColor = color;
            colorIndicator.style.marginRight = "8px";
            colorIndicator.style.border = "1px solid #ccc";
            item.appendChild(colorIndicator);
        }
        
        const textSpan = document.createElement("span");
        textSpan.textContent = text;
        item.appendChild(textSpan);
        
        item.onmouseover = () => {
            item.style.backgroundColor = "#f0f0f0";
        };
        
        item.onmouseout = () => {
            item.style.backgroundColor = "transparent";
        };
        
        item.onclick = () => {
            onClick();
        };
        
        menu.appendChild(item);
        return item;
    }
    
    showCategoryManager() {
        // Create a modal dialog
        const modal = document.createElement("div");
        modal.style.position = "fixed";
        modal.style.left = "0";
        modal.style.top = "0";
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.backgroundColor = "rgba(0,0,0,0.5)";
        modal.style.display = "flex";
        modal.style.justifyContent = "center";
        modal.style.alignItems = "center";
        modal.style.zIndex = "2000";
        
        const dialog = document.createElement("div");
        dialog.style.width = "400px";
        dialog.style.padding = "20px";
        dialog.style.backgroundColor = "white";
        dialog.style.borderRadius = "8px";
        dialog.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
        
        const title = document.createElement("h3");
        title.textContent = "Управление категориями";
        title.style.marginTop = "0";
        dialog.appendChild(title);
        
        const categoriesList = document.createElement("div");
        categoriesList.style.maxHeight = "300px";
        categoriesList.style.overflowY = "auto";
        categoriesList.style.marginBottom = "15px";
        
        // Add existing categories
        this.currentImage.selectionCategories.forEach(category => {
            const categoryRow = document.createElement("div");
            categoryRow.style.display = "flex";
            categoryRow.style.alignItems = "center";
            categoryRow.style.marginBottom = "8px";
            
            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.value = category.color;
            colorInput.style.marginRight = "10px";
            colorInput.style.width = "30px";
            colorInput.style.height = "30px";
            colorInput.style.border = "none";
            colorInput.style.padding = "0";
            
            colorInput.onchange = () => {
                category.color = colorInput.value;
                // Update UI for existing selections with this category
                window.app.tableView.restoreSelectedCells(this.currentImage.selectedCells);
            };
            
            const nameInput = document.createElement("input");
            nameInput.type = "text";
            nameInput.value = category.name;
            nameInput.style.flexGrow = "1";
            nameInput.style.padding = "5px";
            nameInput.style.marginRight = "10px";
            
            nameInput.onchange = () => {
                category.name = nameInput.value;
            };
            
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "✕";
            deleteBtn.style.backgroundColor = "#f44336";
            deleteBtn.style.color = "white";
            deleteBtn.style.border = "none";
            deleteBtn.style.borderRadius = "4px";
            deleteBtn.style.padding = "5px 10px";
            deleteBtn.style.cursor = "pointer";
            
            // Can't delete if it's the only category or has selected cells
            if (this.currentImage.selectionCategories.length <= 1 || 
                this.currentImage.selectedCells.some(cell => cell.categoryId === category.id)) {
                deleteBtn.disabled = true;
                deleteBtn.style.backgroundColor = "#cccccc";
                deleteBtn.title = "Cannot delete: category in use or last remaining category";
            }
            
            deleteBtn.onclick = () => {
                if (this.currentImage.removeSelectionCategory(category.id)) {
                    categoryRow.remove();
                }
            };
            
            categoryRow.appendChild(colorInput);
            categoryRow.appendChild(nameInput);
            categoryRow.appendChild(deleteBtn);
            categoriesList.appendChild(categoryRow);
        });
        
        dialog.appendChild(categoriesList);
        
        // Add new category row
        const newCategoryRow = document.createElement("div");
        newCategoryRow.style.display = "flex";
        newCategoryRow.style.alignItems = "center";
        newCategoryRow.style.marginBottom = "15px";
        
        const newColorInput = document.createElement("input");
        newColorInput.type = "color";
        newColorInput.value = "#" + Math.floor(Math.random()*16777215).toString(16);
        newColorInput.style.marginRight = "10px";
        newColorInput.style.width = "30px";
        newColorInput.style.height = "30px";
        newColorInput.style.border = "none";
        newColorInput.style.padding = "0";
        
        const newNameInput = document.createElement("input");
        newNameInput.type = "text";
        newNameInput.placeholder = "New category name";
        newNameInput.style.flexGrow = "1";
        newNameInput.style.padding = "5px";
        newNameInput.style.marginRight = "10px";
        
        const addBtn = document.createElement("button");
        addBtn.textContent = "Add";
        addBtn.style.backgroundColor = "#4CAF50";
        addBtn.style.color = "white";
        addBtn.style.border = "none";
        addBtn.style.borderRadius = "4px";
        addBtn.style.padding = "5px 10px";
        addBtn.style.cursor = "pointer";
        
        addBtn.onclick = () => {
            if (newNameInput.value.trim()) {
                this.currentImage.addSelectionCategory(
                    newNameInput.value.trim(), 
                    newColorInput.value
                );
                // Refresh the modal
                modal.remove();
                this.showCategoryManager();
            }
        };
        
        newCategoryRow.appendChild(newColorInput);
        newCategoryRow.appendChild(newNameInput);
        newCategoryRow.appendChild(addBtn);
        dialog.appendChild(newCategoryRow);
        
        // Add buttons
        const buttonRow = document.createElement("div");
        buttonRow.style.display = "flex";
        buttonRow.style.justifyContent = "flex-end";
        
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "Close";
        closeBtn.style.backgroundColor = "#007bff";
        closeBtn.style.color = "white";
        closeBtn.style.border = "none";
        closeBtn.style.borderRadius = "4px";
        closeBtn.style.padding = "8px 15px";
        closeBtn.style.cursor = "pointer";
        
        closeBtn.onclick = () => {
            modal.remove();
        };
        
        buttonRow.appendChild(closeBtn);
        dialog.appendChild(buttonRow);
        
        modal.appendChild(dialog);
        document.body.appendChild(modal);
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