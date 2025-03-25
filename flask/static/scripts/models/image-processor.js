/**
 * Class for managing a category of selected cells
 */
class Category {
    constructor(id, name, color) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.selectedCells = []; // Array of {row, col} objects
    }

    addCell(row, col) {
        // Check if cell already exists in this category
        const existingIndex = this.selectedCells.findIndex(
            cell => cell.row === row && cell.col === col
        );
        
        if (existingIndex === -1) {
            this.selectedCells.push({ row, col });
            return true; // Cell was added
        }
        return false; // Cell already exists
    }

    removeCell(row, col) {
        const existingIndex = this.selectedCells.findIndex(
            cell => cell.row === row && cell.col === col
        );
        
        if (existingIndex !== -1) {
            this.selectedCells.splice(existingIndex, 1);
            return true; // Cell was removed
        }
        return false; // Cell wasn't found
    }

    hasCell(row, col) {
        return this.selectedCells.some(cell => cell.row === row && cell.col === col);
    }

    getCells() {
        return [...this.selectedCells];
    }
}

/**
 * Class for processing and managing images
 */
class ImageProcessor {
    constructor(options) {
        this.imageURL = options.imageURL;
        this.name = options.name;
        this.verticalLines = options.verticalLines || [];
        this.horizontalLines = options.horizontalLines || [];
        this.luminanceData = options.luminanceData || null;
        this.blurredImageUrl = options.blurredImage || null;
        this.img = new Image();
        
        // Initialize categories
        this.categories = [];
        const defaultCategories = options.selectionCategories || [
            { id: 'epidermis', name: 'Эпидермис', color: '#00C46D' },
            { id: 'dermis', name: 'Дерма', color: '#FFC107' }
        ];
        
        // Create category objects
        defaultCategories.forEach(cat => {
            this.categories.push(new Category(cat.id, cat.name, cat.color));
        });
        
        // Initialize selected cells
        this.initializeSelectedCells(options.selectedCells || []);
    }

    initializeSelectedCells(cells) {
        // Handle backward compatibility
        if (cells.length > 0) {
            cells.forEach(cell => {
                // Handle legacy format without categoryId
                const categoryId = cell.categoryId || 'default';
                // Find the category
                const category = this.getCategoryById(categoryId);
                // Add cell to category
                if (category) {
                    category.addCell(cell.row, cell.col);
                }
            });
        }
    }

    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static async create(options) {
        const instance = new ImageProcessor(options);
        
        if (!options.blurredImage) {
            await instance.blurImage();
        }
        
        await instance.loadImage();
        return instance;
    }
    
    async blurImage() {
        try {
            const apiService = new APIService();
            let data = await apiService.blurImage(this.imageURL);
            this.blurredImageUrl = 'data:image/png;base64,' + data;
        } catch (error) {
            console.error('Error blurring image:', error);
            throw error;
        }
    }
    
    async loadImage() {
        return new Promise((resolve, reject) => {
            this.img.onload = () => {
                if (this.verticalLines.length === 0) {
                    this.initializeVerticalLines();
                }
                
                if (this.horizontalLines.length === 0) {
                    this.initializeHorizontalLines();
                }
                
                resolve();
            };
            this.img.onerror = (error) => {
                console.error('Error loading image:', error);
                reject(error);
            };
            this.img.src = this.imageURL;
        });
    }
    
    initializeVerticalLines() {
        const N = 3;
        const stepWidth = this.img.width / N;
        this.verticalLines = [];
        for (let i = stepWidth; i < this.img.width; i += stepWidth) {
            this.verticalLines.push(i);
        }
    }
    
    initializeHorizontalLines() {
        const N = 3;
        const stepHeight = this.img.height / N;
        this.horizontalLines = [];
        for (let i = stepHeight; i < this.img.height; i += stepHeight) {
            this.horizontalLines.push(i);
        }
    }
    
    // Convert from TableView selected cells format to our new category-based format
    updateSelectedCells(selectedCells) {
        // Clear all current selections
        this.categories.forEach(category => {
            category.selectedCells = [];
        });
        
        // Add new selections
        if (selectedCells && selectedCells.length) {
            selectedCells.forEach(cell => {
                const categoryId = cell.categoryId || 'default';
                const category = this.getCategoryById(categoryId);
                if (category) {
                    category.addCell(cell.row, cell.col);
                }
            });
        }
    }
    
    // Add a cell to a specific category
    addSelectedCell(row, col, categoryId = 'default') {
        const category = this.getCategoryById(categoryId);
        if (!category) return false;
        
        // Check if already exists and toggle
        if (category.hasCell(row, col)) {
            return category.removeCell(row, col);
        } else {
            return category.addCell(row, col);
        }
    }
    
    // For backward compatibility - get all selected cells in the old format
    getSelectedCells() {
        const result = [];
        this.categories.forEach(category => {
            category.selectedCells.forEach(cell => {
                result.push({
                    row: cell.row,
                    col: cell.col,
                    categoryId: category.id,
                    id: this.generateUniqueId()
                });
            });
        });
        return result;
    }
    
    // Get a specific category by ID
    getCategoryById(categoryId) {
        return this.categories.find(cat => cat.id === categoryId) || 
               this.categories[0]; // Default to first category if not found
    }
    
    // Add a new category
    addSelectionCategory(name, color) {
        const id = name.toLowerCase().replace(/\s+/g, '-');
        
        // Check if category with this ID already exists
        if (!this.categories.some(cat => cat.id === id)) {
            this.categories.push(new Category(id, name, color));
            return true;
        }
        return false;
    }
    
    // Remove a category if possible
    removeSelectionCategory(categoryId) {
        // Don't remove if it's the only category or if it has cells selected with it
        if (this.categories.length <= 1) {
            return false;
        }
        
        const index = this.categories.findIndex(cat => cat.id === categoryId);
        if (index !== -1) {
            // Check if category has any selected cells
            if (this.categories[index].selectedCells.length > 0) {
                return false;
            }
            
            this.categories.splice(index, 1);
            return true;
        }
        return false;
    }
    
    get sourceImg() {
        return this.imageURL;
    }
    
    get blurredImage() {
        return this.blurredImageUrl;
    }
    
    // For backward compatibility
    get selectionCategories() {
        return this.categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            color: cat.color
        }));
    }
    
    // For backward compatibility
    get selectedCells() {
        return this.getSelectedCells();
    }

    /**
     * Synchronizes the current table selections with the ImageProcessor
     */
    syncSelectionsWithImageProcessor() {
        const currentImage = window.app.canvasView.getCurrentImage();
        if (!currentImage) return;
        
        // Get all currently selected cells from the table
        const selectedCells = this.getSelectedCells();
        
        // Update the image processor with these selections
        currentImage.updateSelectedCells(selectedCells);
    }
}