/**
 * Service for handling Excel export operations
 */
class ExcelExporter {
    /**
     * Create an Excel exporter
     * @param {string} exportEndpoint - The API endpoint for exporting Excel files
     */
    constructor(exportEndpoint = '/export-excel') {
        this.exportEndpoint = exportEndpoint;
    }
    
    /**
     * Export table data to Excel
     * @param {TableView} tableView - The table view containing data to export
     * @returns {Promise} - A promise that resolves when the export is complete
     */
    exportTableData(tableView) {
        // Check if table has data
        if (!tableView.currentData || !tableView.table.rows.length) {
            return Promise.reject(new Error("Нет данных для экспорта"));
        }
        
        // Get the current image to access categories
        const currentImage = window.app.canvasView.getCurrentImage();
        if (!currentImage) {
            return Promise.reject(new Error("Нет активного изображения"));
        }
        
        // Prepare export data
        const exportData = this.prepareExportData(tableView, currentImage);
        
        // Send to the server
        return this.sendExportRequest(exportData);
    }
    
    /**
     * Prepare data for export
     * @param {TableView} tableView - The table view containing data
     * @param {ImageProcessor} currentImage - The current image with category data
     * @returns {Object} - The prepared export data
     */
    prepareExportData(tableView, currentImage) {
        // Gather table data including headers and formatting
        const tableData = this.extractTableData(tableView);
        
        // Get cell and category data
        const { selectedCells, categoryAverages } = this.extractCategoryData(tableView, currentImage);
        
        return {
            tableData,
            selectedCells,
            categoryAverages
        };
    }
    
    /**
     * Extract raw table data
     * @param {TableView} tableView - The table view
     * @returns {Array} - 2D array of table data
     */
    extractTableData(tableView) {
        const tableData = [];
        
        // Add all rows from table to dataset
        for (let i = 0; i < tableView.table.rows.length; i++) {
            const rowData = [];
            const row = tableView.table.rows[i];
            
            for (let j = 0; j < row.cells.length; j++) {
                // For numeric cells, try to convert to numbers
                const cellContent = row.cells[j].textContent;
                if (i > 0 && j > 0 && cellContent !== "NaN" && !isNaN(parseFloat(cellContent))) {
                    rowData.push(parseFloat(cellContent));
                } else {
                    rowData.push(cellContent);
                }
            }
            
            tableData.push(rowData);
        }
        
        return tableData;
    }
    
    /**
     * Extract category and selected cell data
     * @param {TableView} tableView - The table view
     * @param {ImageProcessor} currentImage - The current image with category data
     * @returns {Object} - Object containing selectedCells and categoryAverages
     */
    extractCategoryData(tableView, currentImage) {
        const selectedCells = [];
        const categoryCells = {};
        
        // Initialize category tracking
        currentImage.selectionCategories.forEach(cat => {
            categoryCells[cat.id] = {
                name: cat.name,
                color: cat.color,
                cells: []
            };
        });
        
        // Collect selected cells and their categories
        for (let i = 1; i < tableView.table.rows.length; i++) {
            for (let j = 1; j < tableView.table.rows[i].cells.length - 1; j++) {
                const cell = tableView.table.rows[i].cells[j];
                
                if (cell.classList.contains('selected')) {
                    // Get cell categories from data attribute
                    const cellCategories = cell.getAttribute('data-categories');
                    
                    if (cellCategories) {
                        // Multiple categories
                        cellCategories.split(',').forEach(categoryId => {
                            const cellInfo = {
                                row: i-1, 
                                col: j-1,
                                categoryId: categoryId,
                                value: parseFloat(cell.textContent)
                            };
                            selectedCells.push(cellInfo);
                            
                            // Add to category-specific tracking
                            if (categoryCells[categoryId]) {
                                categoryCells[categoryId].cells.push(cellInfo);
                            }
                        });
                    } else {
                        // Legacy format - default category
                        const defaultCat = 'default';
                        const cellInfo = {
                            row: i-1, 
                            col: j-1,
                            categoryId: defaultCat,
                            value: parseFloat(cell.textContent)
                        };
                        selectedCells.push(cellInfo);
                        
                        // Add to category-specific tracking
                        if (categoryCells[defaultCat]) {
                            categoryCells[defaultCat].cells.push(cellInfo);
                        }
                    }
                }
            }
        }
        
        // Calculate category averages
        const categoryAverages = this.calculateCategoryAverages(categoryCells);
        
        return { selectedCells, categoryAverages };
    }
    
    /**
     * Calculate averages for each category
     * @param {Object} categoryCells - Object mapping category IDs to cell info
     * @returns {Array} - Array of category average info
     */
    calculateCategoryAverages(categoryCells) {
        const categoryAverages = [];
        
        for (const catId in categoryCells) {
            const catInfo = categoryCells[catId];
            const cells = catInfo.cells;
            
            if (cells.length > 0) {
                const sum = cells.reduce((acc, cell) => acc + cell.value, 0);
                const avg = sum / cells.length;
                
                categoryAverages.push({
                    id: catId,
                    name: catInfo.name,
                    color: catInfo.color,
                    count: cells.length,
                    average: avg.toFixed(3)
                });
            } else {
                categoryAverages.push({
                    id: catId,
                    name: catInfo.name,
                    color: catInfo.color,
                    count: 0,
                    average: 'N/A'
                });
            }
        }
        
        return categoryAverages;
    }
    
    /**
     * Send export request to server and handle download
     * @param {Object} exportData - Data to be exported
     * @returns {Promise} - Promise that resolves when download is complete
     */
    sendExportRequest(exportData) {
        return fetch(this.exportEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(exportData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Server error: ' + response.status);
            }
            // Handle the file download
            return response.blob();
        })
        .then(blob => {
            this.triggerDownload(blob);
            return blob; // Return for chaining
        });
    }
    
    /**
     * Trigger file download in the browser
     * @param {Blob} blob - The file data as a blob
     */
    triggerDownload(blob) {
        // Create a temporary URL to the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a link element to trigger the download
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = "luminance_data_" + new Date().toISOString().split('T')[0] + ".xlsx";
        
        // Add to the DOM and trigger click
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}