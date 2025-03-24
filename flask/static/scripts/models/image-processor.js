/**
 * Class for processing and managing images
 */
class ImageProcessor {
    constructor(options) {
        this.imageURL = options.imageURL;
        this.name = options.name;
        this.verticalLines = options.verticalLines || [];
        this.horizontalLines = options.horizontalLines || [];
        this.selectedCells = this.initializeSelectedCells(options.selectedCells || []);
        this.luminanceData = options.luminanceData || null;
        this.blurredImageUrl = options.blurredImage || null;
        this.img = new Image();
        this.selectionCategories = options.selectionCategories || [
            { id: 'default', name: 'Default Selection', color: '#00C46D' },
            { id: 'highlight', name: 'Highlight', color: '#FFC107' },
            { id: 'important', name: 'Important', color: '#F44336' }
        ];
    }

    initializeSelectedCells(cells) {
        // Handle backward compatibility
        if (cells.length > 0 && cells[0].hasOwnProperty('row') && !cells[0].hasOwnProperty('categoryId')) {
            return cells.map(cell => ({
                row: cell.row,
                col: cell.col,
                categoryId: 'default',
                id: this.generateUniqueId()
            }));
        }
        return cells;
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
    
    updateSelectedCells(selectedCells) {
        this.selectedCells = selectedCells || [];
    }
    
    addSelectedCell(row, col, categoryId = 'default') {
        // Check if this cell with this category already exists
        const existingIndex = this.selectedCells.findIndex(
            cell => cell.row === row && cell.col === col && cell.categoryId === categoryId
        );
        
        if (existingIndex === -1) {
            // Add new selection
            this.selectedCells.push({
                row: row,
                col: col,
                categoryId: categoryId,
                id: this.generateUniqueId()
            });
        } else {
            // Remove existing selection (toggle)
            this.selectedCells.splice(existingIndex, 1);
        }
    }
    
    removeSelectedCell(id) {
        const index = this.selectedCells.findIndex(cell => cell.id === id);
        if (index !== -1) {
            this.selectedCells.splice(index, 1);
        }
    }
    
    getCategoryById(categoryId) {
        return this.selectionCategories.find(cat => cat.id === categoryId) || 
               this.selectionCategories[0]; // Default to first category if not found
    }
    
    addSelectionCategory(name, color) {
        const id = name.toLowerCase().replace(/\s+/g, '-');
        
        // Check if category with this ID already exists
        if (!this.selectionCategories.some(cat => cat.id === id)) {
            this.selectionCategories.push({
                id: id,
                name: name,
                color: color
            });
        }
    }
    
    removeSelectionCategory(categoryId) {
        // Don't remove if it's the only category or if it has cells selected with it
        if (this.selectionCategories.length <= 1 || 
            this.selectedCells.some(cell => cell.categoryId === categoryId)) {
            return false;
        }
        
        const index = this.selectionCategories.findIndex(cat => cat.id === categoryId);
        if (index !== -1) {
            this.selectionCategories.splice(index, 1);
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
}