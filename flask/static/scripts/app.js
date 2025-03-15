/**
 * Main application class to coordinate all components
 */
class App {
    constructor() {
        // Core services
        this.imageService = new ImageService();
        this.apiService = new APIService();
        this.loadedImages = [];
        
        // UI Components
        this.canvasView = new CanvasView(document.getElementById("canvas"));
        this.tableView = new TableView(document.getElementById("luminance-table"));
        this.sidebarView = new SidebarView(document.getElementById("sidebar"));
        
        // Initialize application
        this.init();
    }
    
    init() {
        // Setup event handlers
        this.setupEventListeners();
        
        // Setup drag and drop
        this.setupDropZone(document.getElementById('dropzone'));
    }
    
    setupEventListeners() {
        // Existing button event listeners
        document.getElementById('add-vertical-line').addEventListener('click', () => this.canvasView.addVerticalLine());
        document.getElementById('add-horizontal-line').addEventListener('click', () => this.canvasView.addHorizontalLine());
        document.getElementById('remove-vertical-line').addEventListener('click', () => this.canvasView.removeVerticalLine());
        document.getElementById('remove-horizontal-line').addEventListener('click', () => this.canvasView.removeHorizontalLine());
        document.getElementById('save-button').addEventListener('click', () => this.imageService.saveImageWithMetadata(
            this.canvasView.getCurrentImage(),
            this.tableView.getSelectedCells()
        ));
        document.getElementById('toggle-sidebar').addEventListener('click', () => this.sidebarView.toggleSidebar());
        
        // Handle calculate luminance button
        document.getElementById('calculate-luminance').addEventListener('click', () => this.calculateLuminance());
        
        // Add listener for image selection from thumbnails
        document.addEventListener('image-selected', (e) => {
            const { image, index } = e.detail;
            
            // If the current image has selected cells, save them
            const currentImage = this.canvasView.getCurrentImage();
            if (currentImage && this.tableView) {
                currentImage.updateSelectedCells(this.tableView.getSelectedCells());
            }
            
            // Set the new image in canvas
            this.canvasView.setImage(image);
            
            // If the image has luminance data, update the table
            if (image.luminanceData) {
                // Ensure grid has 0 as first element and image dimensions as last element
                const horizontalLines = [...image.horizontalLines];
                const verticalLines = [...image.verticalLines];
                
                // Add 0 at the beginning if not present
                if (horizontalLines.length > 0 && horizontalLines[0] !== 0) {
                    horizontalLines.unshift(0);
                }
                if (verticalLines.length > 0 && verticalLines[0] !== 0) {
                    verticalLines.unshift(0);
                }
                
                // Add image dimensions at the end if not present
                if (image.img && image.img.height && 
                    (horizontalLines.length === 0 || horizontalLines[horizontalLines.length - 1] !== image.img.height)) {
                    horizontalLines.push(image.img.height);
                }
                if (image.img && image.img.width && 
                    (verticalLines.length === 0 || verticalLines[verticalLines.length - 1] !== image.img.width)) {
                    verticalLines.push(image.img.width);
                }

                const tableData = {
                    luminance: image.luminanceData,
                    grid: [horizontalLines, verticalLines]
                };
                this.tableView.updateTable(tableData);
                
                // Restore any selected cells
                if (image.selectedCells && image.selectedCells.length) {
                    this.tableView.restoreSelectedCells(image.selectedCells);
                }
            } else {
                // Clear the table if no luminance data
                this.tableView.updateTable({
                    luminance: [],
                    grid: [[], []]
                });
            }
        });

        // Add event listener for Excel export
        document.getElementById('export-excel').addEventListener('click', () => {
            this.tableView.exportToExcel();
        });
    }
    
    setupDropZone(dropzone) {
        const dropzoneText = dropzone.querySelector('p');
        
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzoneText.textContent = 'Drop files here';
        });
        
        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropzoneText.textContent = 'Перетащите изображение';
        });
        
        dropzone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropzoneText.textContent = 'Processing files...';
            
            const items = e.dataTransfer.items;
            
            for (let i = 0; i < items.length; i++) {
                if (items[i].kind === 'file') {
                    const file = items[i].getAsFile();
                    
                    try {
                        let image;
                        if (file.name.toLowerCase().endsWith('.json')) {
                            image = await this.imageService.loadImageData(file);
                        } else if (this.imageService.validateFileType(file)) {
                            image = await this.imageService.loadImage(file);
                        } else {
                            alert('Please upload .jpg, .jpeg, .png, .gif, or .json files.');
                            continue;
                        }
                        
                        this.loadedImages.push(image);
                    } catch (error) {
                        console.error('Error loading file:', error);
                        alert('Error loading file: ' + error.message);
                    }
                }
            }
            
            if (this.loadedImages.length > 0) {
                this.sidebarView.refreshThumbnails(this.loadedImages);
                this.imageService.addImages(this.loadedImages);
            }
        });
    }
    
    calculateLuminance() {
        const image = this.canvasView.getCurrentImage();
        
        if (!image) return;
        
        // Save current selected cells
        image.updateSelectedCells(this.tableView.getSelectedCells());
        
        this.apiService.calculateLuminance(
            image.sourceImg, 
            image.verticalLines, 
            image.horizontalLines
        ).then(result => {
            // Save luminance data to image
            image.luminanceData = result.luminance;
            
            // Update the table
            this.tableView.updateTable(result);
            
            // Restore selected cells
            this.tableView.restoreSelectedCells(image.selectedCells);
        });
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});