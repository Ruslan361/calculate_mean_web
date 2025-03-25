/**
 * Class for managing context menus throughout the application
 */
class ContextMenuManager {
    constructor() {
        this.menu = null;
        this.eventListeners = [];
        
        // Add document click listener to hide context menu when clicking elsewhere
        document.addEventListener("click", (e) => {
            if (this.menu && e.button !== 2) {
                this.hideMenu();
            }
        });
    }
    
    /**
     * Show a context menu at the specified position
     * @param {number} x - The x position for the menu
     * @param {number} y - The y position for the menu
     * @returns {HTMLElement} - The created menu element
     */
    showMenu(x, y) {
        // Hide any existing menu
        this.hideMenu();
        
        // Create new menu
        this.menu = document.createElement("div");
        this.menu.className = "context-menu";
        this.menu.style.position = "absolute";
        this.menu.style.background = "white";
        this.menu.style.border = "1px solid #ccc";
        this.menu.style.padding = "5px 0";
        this.menu.style.borderRadius = "4px";
        this.menu.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
        this.menu.style.zIndex = "1000";
        
        // Добавляем в DOM чтобы определить размеры
        document.body.appendChild(this.menu);
        
        // После того как меню добавлено в DOM, проверяем его размеры и
        // позиционируем с противоположной стороны, если близко к краю экрана
        setTimeout(() => {
            const menuRect = this.menu.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            // Определяем с какой стороны от курсора показывать меню
            let posX = x;
            let posY = y;
            
            // Проверяем горизонтальное переполнение - смещаем влево от курсора
            if (x + menuRect.width > windowWidth - 20) {
                posX = x - menuRect.width;
            }
            
            // Проверяем вертикальное переполнение - смещаем выше курсора
            if (y + menuRect.height > windowHeight - 20) {
                posY = y - menuRect.height;
            }
            
            // Убеждаемся, что меню не выходит за левый или верхний край
            posX = Math.max(10, posX);
            posY = Math.max(10, posY);
            
            // Применяем скорректированные координаты
            this.menu.style.left = posX + "px";
            this.menu.style.top = posY + "px";
        }, 0);
        
        // Prevent context menu click from triggering the document click handler
        this.menu.addEventListener("click", (e) => {
            e.stopPropagation();
        });
        
        // Prevent right-clicks inside the menu from closing it
        this.menu.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        
        return this.menu;
    }
    
    /**
     * Hide and remove the current menu
     */
    hideMenu() {
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
        }
        
        // Remove any registered event listeners
        this.eventListeners.forEach(listener => {
            document.removeEventListener(listener.type, listener.handler);
        });
        this.eventListeners = [];
    }
    
    /**
     * Add a menu item to the specified menu
     * @param {HTMLElement} menu - The menu to add the item to
     * @param {string} text - The text for the menu item
     * @param {Function} onClick - The click handler
     * @param {string} [color=null] - Optional color indicator
     * @returns {HTMLElement} - The created menu item
     */
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
            this.hideMenu();
        };
        
        menu.appendChild(item);
        return item;
    }
    
    /**
     * Creates a submenu item with child items
     * @param {HTMLElement} parentMenu - The parent menu
     * @param {string} text - The text for the menu item
     * @param {Array} subItems - Array of submenu items [{text, onClick, color}]
     * @returns {HTMLElement} - The created submenu item
     */
    addSubmenuItem(parentMenu, text, subItems) {
        const menuItem = document.createElement("div");
        menuItem.textContent = text;
        menuItem.style.padding = "8px 12px";
        menuItem.style.cursor = "pointer";
        menuItem.style.position = "relative";
        
        const submenu = document.createElement("div");
        submenu.className = "context-submenu";
        submenu.style.position = "absolute";
        submenu.style.top = "0";
        submenu.style.background = "white";
        submenu.style.border = "1px solid #ccc";
        submenu.style.padding = "5px 0";
        submenu.style.borderRadius = "4px";
        submenu.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
        submenu.style.display = "none";
        submenu.style.zIndex = "1001";
        
        // Add submenu items
        subItems.forEach(item => {
            this.addMenuItem(submenu, item.text, item.onClick, item.color);
        });
        
        // Position submenu to left or right based on available space
        menuItem.onmouseover = () => {
            menuItem.style.backgroundColor = "#f0f0f0";
            
            // Determine if submenu would overflow right edge
            const menuRect = parentMenu.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            
            // Show submenu to decide its size
            submenu.style.display = "block";
            const submenuRect = submenu.getBoundingClientRect();
            
            // If it would overflow right edge, position to the left
            if (menuRect.right + submenuRect.width > windowWidth) {
                submenu.style.left = "auto";
                submenu.style.right = "100%";
            } else {
                submenu.style.left = "100%";
                submenu.style.right = "auto";
            }
        };
        
        menuItem.onmouseout = (e) => {
            if (!e.relatedTarget || !submenu.contains(e.relatedTarget)) {
                menuItem.style.backgroundColor = "transparent";
                submenu.style.display = "none";
            }
        };
        
        submenu.onmouseover = () => {
            menuItem.style.backgroundColor = "#f0f0f0";
            submenu.style.display = "block";
        };
        
        submenu.onmouseout = () => {
            submenu.style.display = "none";
            menuItem.style.backgroundColor = "transparent";
        };
        
        menuItem.appendChild(submenu);
        parentMenu.appendChild(menuItem);
        return menuItem;
    }
    
    /**
     * Creates a line management menu (for vertical/horizontal lines)
     * @param {ImageProcessor} image - The current image
     * @param {CanvasView} canvasView - The canvas view
     * @param {number} x - The x coordinate for menu position (page coordinates)
     * @param {number} y - The y coordinate for menu position (page coordinates)
     * @param {number} lineIndex - The index of the line (-1 if no line)
     * @param {string} lineType - Type of line ('vertical' or 'horizontal')
     */
    showLineMenu(image, canvasView, x, y, lineIndex, lineType) {
        // Get the image coordinates from canvas coordinates
        // These are the actual coordinates to use when adding lines
        const rect = canvasView.canvas.getBoundingClientRect();
        const canvasX = x - rect.left;
        const canvasY = y - rect.top;
        
        // Convert to image coordinates (account for scale)
        const imageX = canvasX / canvasView.scaleFactor;
        const imageY = canvasY / canvasView.scaleFactor;
        
        const menu = this.showMenu(x, y);
        
        if (lineIndex !== -1) {
            // Remove line option
            this.addMenuItem(
                menu, 
                `Удалить ${lineType === 'vertical' ? 'вертикальную' : 'горизонтальную'} линию`, 
                () => {
                    if (lineType === 'vertical') {
                        image.verticalLines.splice(lineIndex, 1);
                    } else {
                        image.horizontalLines.splice(lineIndex, 1);
                    }
                    canvasView.redraw();
                    window.app.calculateLuminance();
                }
            );
        } else {
            // Add line options - use image coordinates
            this.addMenuItem(
                menu, 
                "Добавить вертикальную линию", 
                () => {
                    image.verticalLines.push(imageX);
                    image.verticalLines.sort((a, b) => a - b);
                    canvasView.redraw();
                    window.app.calculateLuminance();
                }
            );
            
            this.addMenuItem(
                menu, 
                "Добавить горизонтальную линию", 
                () => {
                    image.horizontalLines.push(imageY);
                    image.horizontalLines.sort((a, b) => a - b);
                    canvasView.redraw();
                    window.app.calculateLuminance();
                }
            );
            
            // Find the grid cell at the clicked position - use image coordinates
            const vIndex = canvasView.findGridIndex(imageX, image.verticalLines);
            const hIndex = canvasView.findGridIndex(imageY, image.horizontalLines);
            
            // If we're in a valid cell, add the cell selection options
            if (vIndex !== -1 && hIndex !== -1) {
                // Create submenu items for categories
                const categoryItems = image.selectionCategories.map(category => ({
                    text: category.name,
                    onClick: () => {
                        const tableView = window.app.tableView;
                        tableView.toggleCellSelection(hIndex, vIndex, category.id);
                    },
                    color: category.color
                }));
                
                // Add "Управление категориями" item
                categoryItems.push({
                    text: "Управление категориями...",
                    onClick: () => {
                        canvasView.showCategoryManager();
                    }
                });
                
                // Add submenu with all category options
                this.addSubmenuItem(menu, "Выделить ячейку как...", categoryItems);
            }
        }
        
        return menu;
    }
    
    /**
     * Creates a cell selection menu with categories
     * @param {ImageProcessor} image - The current image
     * @param {CanvasView} canvasView - The canvas view
     * @param {number} pageX - The page X coordinate for menu position
     * @param {number} pageY - The page Y coordinate for menu position
     * @param {number} hIndex - The horizontal grid index
     * @param {number} vIndex - The vertical grid index
     */
    showCellMenu(image, canvasView, pageX, pageY, hIndex, vIndex) {
        const menu = this.showMenu(pageX, pageY);
        
        // Create submenu items for categories
        const categoryItems = image.selectionCategories.map(category => ({
            text: category.name,
            onClick: () => {
                const tableView = window.app.tableView;
                tableView.toggleCellSelection(hIndex, vIndex, category.id);
            },
            color: category.color
        }));
        
        // Add "Управление категориями" item
        categoryItems.push({
            text: "Управление категориями...",
            onClick: () => {
                canvasView.showCategoryManager();
            }
        });
        
        // Add submenu with all category options
        this.addSubmenuItem(menu, "Выделить ячейку как...", categoryItems);
        
        return menu;
    }
}