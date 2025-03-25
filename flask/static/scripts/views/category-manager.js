/**
 * Class for managing categories in a modal dialog
 */
class CategoryManager {
    constructor() {
        this.modal = null;
        this.dialog = null;
        this.currentImage = null;
    }
    
    /**
     * Shows the category management modal for a given image
     * @param {ImageProcessor} image - The current image with categories to manage
     */
    show(image) {
        this.currentImage = image;
        
        // Create modal container
        this.modal = document.createElement("div");
        this.modal.style.position = "fixed";
        this.modal.style.left = "0";
        this.modal.style.top = "0";
        this.modal.style.width = "100%";
        this.modal.style.height = "100%";
        this.modal.style.backgroundColor = "rgba(0,0,0,0.5)";
        this.modal.style.display = "flex";
        this.modal.style.justifyContent = "center";
        this.modal.style.alignItems = "center";
        this.modal.style.zIndex = "2000";
        
        // Create dialog container
        this.dialog = document.createElement("div");
        this.dialog.style.width = "400px";
        this.dialog.style.padding = "20px";
        this.dialog.style.backgroundColor = "white";
        this.dialog.style.borderRadius = "8px";
        this.dialog.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
        
        // Add title
        const title = document.createElement("h3");
        title.textContent = "Управление категориями";
        title.style.marginTop = "0";
        this.dialog.appendChild(title);
        
        // Create and add categories list
        this.renderCategoriesList();
        
        // Add new category form
        this.renderNewCategoryForm();
        
        // Add buttons row
        this.renderButtonsRow();
        
        // Add dialog to modal and modal to document
        this.modal.appendChild(this.dialog);
        document.body.appendChild(this.modal);
    }
    
    /**
     * Render the list of existing categories
     */
    renderCategoriesList() {
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
        
        this.dialog.appendChild(categoriesList);
    }
    
    /**
     * Render the form for adding new categories
     */
    renderNewCategoryForm() {
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
                // Refresh the dialog
                this.close();
                this.show(this.currentImage);
            }
        };
        
        newCategoryRow.appendChild(newColorInput);
        newCategoryRow.appendChild(newNameInput);
        newCategoryRow.appendChild(addBtn);
        this.dialog.appendChild(newCategoryRow);
    }
    
    /**
     * Render the bottom buttons row
     */
    renderButtonsRow() {
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
            this.close();
        };
        
        buttonRow.appendChild(closeBtn);
        this.dialog.appendChild(buttonRow);
    }
    
    /**
     * Close the modal dialog
     */
    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
            this.dialog = null;
        }
    }
}