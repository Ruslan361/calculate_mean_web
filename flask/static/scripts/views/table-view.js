/**
 * View class for handling the luminance table
 */
class TableView {
    constructor(tableElement) {
        this.table = tableElement;
        this.currentData = null;
        this.tableRendered = false;
        this.pendingSelectedCells = null;
        this.excelExporter = new ExcelExporter();
        this.contextMenuManager = new ContextMenuManager(); // Add context menu manager
        this.categoryStatsManager = new CategoryStatisticsManager(); // Add the statistics manager
    }
    
    updateTable(data) {
        this.currentData = data;
        this.table.innerHTML = "";
        
        if (this.handleEmptyData(data)) return;
        
        const currentImage = window.app.canvasView.getCurrentImage();
        const categories = currentImage ? currentImage.selectionCategories : [];
        
        this.createHeaderRow(data, categories);
        this.createDataRows(data, categories);
        this.finalizeTableCreation();
    }
    
    /**
     * Handles empty data case
     * @param {Object} data - The luminance data
     * @returns {boolean} - true if data is empty and placeholder was added
     */
    handleEmptyData(data) {
        if (!data || !data.luminance || !data.grid || 
            !data.grid[0] || !data.grid[1] || 
            data.luminance.length === 0) {
            
            const emptyRow = this.table.insertRow();
            const cell = emptyRow.insertCell(0);
            cell.textContent = "No luminance data available";
            
            const spanWidth = (this.currentData && this.currentData.luminance && 
                              this.currentData.luminance[0]) ? 
                              this.currentData.luminance[0].length + 2 : 5;
            cell.colSpan = spanWidth;
            return true;
        }
        return false;
    }
    
    /**
     * Creates the header row with column labels
     * @param {Object} data - The luminance data
     * @param {Array} categories - The categories
     */
    createHeaderRow(data, categories) {
        let headerRow = this.table.insertRow();
        headerRow.className = 'table-header-row';
        
        // Create corner cell
        let cornerCell = headerRow.insertCell(0);
        cornerCell.textContent = "Y\\X";
        cornerCell.className = 'table-header-cell corner-header';
        
        // Create column headers
        this.createColumnHeaders(headerRow, data);
        
        // Create category mean headers
        this.createCategoryHeaders(headerRow, data, categories);
    }
    
    /**
     * Creates column headers for the grid
     * @param {HTMLTableRowElement} headerRow - The header row
     * @param {Object} data - The luminance data
     */
    createColumnHeaders(headerRow, data) {
        for (let i = 1; i < data.grid[1].length; i++) {
            let headerCell = headerRow.insertCell(i);
            headerCell.textContent = 
                data.grid[1][i-1].toFixed(0).toString() + " - " + data.grid[1][i].toFixed(0).toString();
            headerCell.className = 'table-header-cell';
        }
    }
    
    /**
     * Creates category mean headers
     * @param {HTMLTableRowElement} headerRow - The header row
     * @param {Object} data - The luminance data
     * @param {Array} categories - The categories
     */
    createCategoryHeaders(headerRow, data, categories) {
        for (let i = 0; i < categories.length; i++) {
            const category = categories[i];
            let catHeaderCell = headerRow.insertCell(data.luminance[0].length + 1 + i);
            catHeaderCell.textContent = "Сред. " + category.name;
            catHeaderCell.className = 'table-header-cell average-header';
            catHeaderCell.style.backgroundColor = this.hexToRgba(category.color, 0.2);
        }
    }
    
    /**
     * Creates data rows with cell values
     * @param {Object} data - The luminance data
     * @param {Array} categories - The categories
     */
    createDataRows(data, categories) {
        for (let i = 0; i < data.luminance.length; i++) {
            let row = this.table.insertRow();
            
            this.createRowHeader(row, data, i);
            this.createDataCells(row, data, i);
            this.createCategoryCells(row, data, categories);
        }
    }
    
    /**
     * Creates the row header cell
     * @param {HTMLTableRowElement} row - The table row
     * @param {Object} data - The luminance data
     * @param {number} rowIndex - The row index
     */
    createRowHeader(row, data, rowIndex) {
        let rowHeaderCell = row.insertCell(0);
        rowHeaderCell.className = 'table-header-cell row-header';
        
        if (rowIndex < data.grid[0].length - 1) {
            rowHeaderCell.textContent = 
                data.grid[0][rowIndex].toFixed(0).toString() + " - " + 
                data.grid[0][rowIndex+1].toFixed(0).toString();
        } else {
            rowHeaderCell.textContent = "Row " + rowIndex;
        }
    }
    
    /**
     * Creates data cells for a row
     * @param {HTMLTableRowElement} row - The table row
     * @param {Object} data - The luminance data
     * @param {number} rowIndex - The row index
     */
    createDataCells(row, data, rowIndex) {
        for (let j = 0; j < data.luminance[rowIndex].length; j++) {
            let cell = row.insertCell(j+1);
            cell.textContent = data.luminance[rowIndex][j].toFixed(3).toString();
            
            // Get current image to access categories
            const currentImage = window.app.canvasView.getCurrentImage();
            
            // Left click handler - always select with first category
            cell.onclick = (e) => {
                if (currentImage && currentImage.selectionCategories.length > 0) {
                    // Use first category for left click
                    const firstCategory = currentImage.selectionCategories[0];
                    this.toggleCellSelection(rowIndex, j, firstCategory.id);
                } else {
                    // Legacy behavior if no categories
                    if (cell.classList.contains('selected')) {
                        cell.classList.remove('selected');
                    } else {
                        cell.classList.add('selected');
                    }
                    this.calculateMeanOfSelectedCells();
                    this.syncSelectionsWithImageProcessor(); // Add this line
                }
            };
            
            // Right click handler - behavior depends on category count
            cell.oncontextmenu = (e) => {
                e.preventDefault(); // Prevent default context menu
                
                if (!currentImage) return;
                
                const categoryCount = currentImage.selectionCategories.length;
                
                if (categoryCount <= 1) {
                    // Standard behavior if only 1 category - same as left click
                    if (cell.classList.contains('selected')) {
                        cell.classList.remove('selected');
                    } else {
                        cell.classList.add('selected');
                    }
                    this.calculateMeanOfSelectedCells();
                    this.syncSelectionsWithImageProcessor(); // Add this line
                } 
                else if (categoryCount === 2) {
                    // Directly toggle second category when there are exactly 2
                    const secondCategory = currentImage.selectionCategories[1];
                    this.toggleCellSelection(rowIndex, j, secondCategory.id);
                }
                else {
                    // Show category selection menu for 3+ categories
                    this.showCellCategoryMenu(e, rowIndex, j);
                }
            };
        }
    }
    
    /**
     * Shows a context menu for selecting cell category
     * @param {MouseEvent} e - The mouse event
     * @param {number} rowIndex - The row index
     * @param {number} colIndex - The column index
     */
    showCellCategoryMenu(e, rowIndex, colIndex) {
        const currentImage = window.app.canvasView.getCurrentImage();
        if (!currentImage) return;
        
        // Use the context menu manager to show the menu
        this.contextMenuManager.showCellMenu(
            currentImage,
            window.app.canvasView,
            e.pageX,
            e.pageY,
            rowIndex,
            colIndex
        );
    }
    
    /**
     * Creates category mean cells for a row
     * @param {HTMLTableRowElement} row - The table row
     * @param {Object} data - The luminance data
     * @param {Array} categories - The categories
     */
    createCategoryCells(row, data, categories) {
        for (let c = 0; c < categories.length; c++) {
            row.insertCell(data.luminance[0].length + 1 + c).textContent = "NaN";
        }
    }
    
    /**
     * Finalizes table creation with post-processing
     */
    finalizeTableCreation() {
        // Mark table as rendered
        this.tableRendered = true;
        
        // Restore selected cells if needed
        if (this.pendingSelectedCells) {
            this.restoreSelectedCells(this.pendingSelectedCells);
            this.pendingSelectedCells = null;
        }

        // Highlight average cells
        this.highlightAverageCells();
        
        // Make table scrollable
        this.makeTableScrollable();
    }

    // Add a method to make the table horizontally scrollable
    makeTableScrollable() {
        // Find table container or create a wrapper
        let tableContainer = this.table.parentElement;
        if (!tableContainer || !tableContainer.classList.contains('table-container')) {
            // Create a container
            tableContainer = document.createElement('div');
            tableContainer.className = 'table-container';
            tableContainer.style.overflowX = 'auto';
            tableContainer.style.width = '100%';
            tableContainer.style.maxWidth = '100%';
            
            // Insert wrapper before table
            this.table.parentNode.insertBefore(tableContainer, this.table);
            
            // Move table into the wrapper
            tableContainer.appendChild(this.table);
        }
    }

    // Update calculateMeanOfSelectedCells method to calculate by category for each row
    calculateMeanOfSelectedCells() {
        if (!this.table || !this.currentData) return;
        
        const currentImage = window.app.canvasView.getCurrentImage();
        if (!currentImage) return;
        
        // Get all categories
        const categories = currentImage.selectionCategories;
        
        // Create a map to store sums and counts for each category (overall)
        const categoryStats = {};
        // Also track per-row stats for each category
        const rowCategoryStats = {};
        
        categories.forEach(cat => {
            categoryStats[cat.id] = { sum: 0, count: 0, cells: [] };
        });
        
        // Calculate means for each row
        for (let i = 1; i < this.table.rows.length; i++) {
            // Initialize row-specific category stats
            rowCategoryStats[i] = {};
            categories.forEach(cat => {
                rowCategoryStats[i][cat.id] = { sum: 0, count: 0 };
            });
            
            for (let j = 1; j < this.table.rows[i].cells.length - categories.length; j++) {
                const cell = this.table.rows[i].cells[j];
                
                if (cell.classList.contains('selected')) {
                    const value = parseFloat(cell.textContent);
                    
                    // Track by category
                    const cellCategories = cell.getAttribute('data-categories');
                    if (cellCategories) {
                        cellCategories.split(',').forEach(catId => {
                            if (categoryStats[catId]) {
                                // Update overall stats for this category
                                categoryStats[catId].sum += value;
                                categoryStats[catId].count += 1;
                                categoryStats[catId].cells.push({ row: i, col: j, value });
                                
                                // Update row-specific stats for this category
                                rowCategoryStats[i][catId].sum += value;
                                rowCategoryStats[i][catId].count += 1;
                            }
                        });
                    }
                }
            }
            
            // Calculate and update category means for this row
            for (let c = 0; c < categories.length; c++) {
                const catId = categories[c].id;
                const catStats = rowCategoryStats[i][catId];
                
                const catMean = catStats.count > 0 ? 
                    (catStats.sum / catStats.count).toFixed(3) : "NaN";
                
                // Category means are at the end of the row
                const catMeanCellIndex = this.currentData.luminance[0].length + 1 + c;
                this.table.rows[i].cells[catMeanCellIndex].textContent = catMean;
                
                // Apply the category color with transparency
                this.table.rows[i].cells[catMeanCellIndex].style.backgroundColor = 
                    this.hexToRgba(categories[c].color, 0.2);
            }
        }
        
        // Update category statistics using the new manager
        this.categoryStatsManager.updateCategoryAverages(categoryStats, categories, this.table.parentNode);
        
        
        // Update the overall average row (category averages by column)
        this.updateCategoryAverageRow(categories);
        
        // Add highlight after updating values
        this.highlightAverageCells();
    }
    
    getSelectedCells() {
        const selectedCells = [];
        
        if (!this.table) return selectedCells;
        
        // Get the current image to access categories
        const currentImage = window.app.canvasView.getCurrentImage();
        if (!currentImage) return selectedCells;
        
        for (let i = 1; i < this.table.rows.length; i++) {
            for (let j = 1; j < this.table.rows[i].cells.length - 1; j++) {
                const cell = this.table.rows[i].cells[j];
                
                if (cell.classList.contains('selected')) {
                    // Get cell categories from data attribute
                    const categories = cell.getAttribute('data-categories');
                    
                    if (categories) {
                        // Multiple categories
                        categories.split(',').forEach(categoryId => {
                            selectedCells.push({
                                row: i-1, 
                                col: j-1,
                                categoryId: categoryId,
                                id: currentImage.generateUniqueId()
                            });
                        });
                    } else {
                        // Legacy format or default category
                        selectedCells.push({
                            row: i-1, 
                            col: j-1,
                            categoryId: 'default',
                            id: currentImage.generateUniqueId()
                        });
                    }
                }
            }
        }
        
        return selectedCells;
    }
    
    restoreSelectedCells(selectedCells) {
        if (!selectedCells || !this.table) return;
        
        // If table is not yet rendered, store cells to restore later
        if (!this.tableRendered || this.table.rows.length <= 1) {
            this.pendingSelectedCells = selectedCells;
            return;
        }
        
        // Get current table dimensions
        const rowCount = this.table.rows.length - 1; // Subtract header row
        const colCount = this.currentData.luminance[0] ? this.currentData.luminance[0].length : 0;
        
        // Clear all existing selections first
        for (let i = 1; i < this.table.rows.length; i++) {
            for (let j = 1; j < this.table.rows[i].cells.length - 1; j++) {
                const cell = this.table.rows[i].cells[j];
                cell.className = '';
                cell.style.backgroundColor = '';
                cell.removeAttribute('data-categories');
            }
        }
        
        // Get the current image to access categories
        const currentImage = window.app.canvasView.getCurrentImage();
        if (!currentImage) return;
        
        // Group cells by position first (to handle multi-category cells properly)
        const cellsByPosition = {};
        
        // Filter and group valid cells by position
        selectedCells.filter(cell => 
            cell.row >= 0 && cell.row < rowCount && 
            cell.col >= 0 && cell.col < colCount
        ).forEach(cell => {
            const key = `${cell.row},${cell.col}`;
            if (!cellsByPosition[key]) {
                cellsByPosition[key] = [];
            }
            cellsByPosition[key].push(cell);
        });
        
        // Process each unique cell position with all its categories
        for (const posKey in cellsByPosition) {
            const [row, col] = posKey.split(',').map(Number);
            
            if (this.table.rows[row + 1] && this.table.rows[row + 1].cells[col + 1]) {
                const tableCell = this.table.rows[row + 1].cells[col + 1];
                const categoryIds = [];
                
                // Collect all unique category IDs for this cell
                cellsByPosition[posKey].forEach(cell => {
                    const categoryId = cell.categoryId || 'default';
                    if (!categoryIds.includes(categoryId)) {
                        categoryIds.push(categoryId);
                    }
                });
                
                // Set the data-categories attribute
                tableCell.setAttribute('data-categories', categoryIds.join(','));
                
                // Add selected class and apply the multi-category style
                tableCell.classList.add('selected');
                this.applyMultiCategoryStyle(tableCell, categoryIds, currentImage);
            }
        }
        
        // Update means
        this.calculateMeanOfSelectedCells();
    }
    
    // Add this method to the TableView class
    calculateOverallAverage() {
        let sum = 0;
        let count = 0;
        
        // Start from row 1 (skip header) and iterate through all data rows
        for (let i = 1; i < this.table.rows.length-1; i++) {
            // Get the mean cell (last cell in each row)
            const meanCell = this.table.rows[i].cells[this.table.rows[i].cells.length - 1];
            const meanValue = meanCell.textContent;
            
            // Only include numeric values (ignore "NaN")
            if (meanValue !== "NaN") {
                sum += parseFloat(meanValue);
                count++;
            }
        }
        
        // Return the calculated average or "NaN" if no valid values
        return count > 0 ? (sum / count).toFixed(3) : "NaN";
    }

    // Update the overall average row to include category averages
    updateOverallAverageRow(categories = []) {
        const overallAverage = this.calculateOverallAverage();
        
        // Check if the bottom row already exists
        let bottomRow;
        if (this.table.rows.length > 0 && this.table.rows[this.table.rows.length - 1].classList.contains('overall-average')) {
            bottomRow = this.table.rows[this.table.rows.length - 1];
        } else {
            // Create new row if it doesn't exist
            bottomRow = this.table.insertRow();
            bottomRow.classList.add('overall-average');
            
            // Create label cell
            const labelCell = bottomRow.insertCell(0);
            labelCell.textContent = "Общее среднее";
            labelCell.className = 'overall-average-label';
            
            // Add empty cells for data columns
            const dataColCount = this.currentData?.luminance[0]?.length || 0;
            for (let j = 0; j < dataColCount; j++) {
                bottomRow.insertCell(j + 1).textContent = "";
            }
            
            // Add cells for category averages
            for (let c = 0; c < categories.length; c++) {
                bottomRow.insertCell(dataColCount + 1 + c);
            }
            
        }
        
        // Calculate category column averages
        if (categories.length > 0) {
            // For each category column, calculate the average
            for (let c = 0; c < categories.length; c++) {
                let catSum = 0;
                let catCount = 0;
                
                // Start from row 1 (skip header) and skip the bottom row
                for (let i = 1; i < this.table.rows.length - 1; i++) {
                    const catCell = this.table.rows[i].cells[this.currentData.luminance[0].length + 1 + c];
                    const catValue = catCell.textContent;
                    
                    if (catValue !== "NaN") {
                        catSum += parseFloat(catValue);
                        catCount++;
                    }
                }
                
                // Calculate category average
                const catAvg = catCount > 0 ? (catSum / catCount).toFixed(3) : "NaN";
                
                // Update the cell in the bottom row
                const catAvgCell = bottomRow.cells[this.currentData.luminance[0].length + 1 + c];
                catAvgCell.textContent = catAvg;
                catAvgCell.style.backgroundColor = this.hexToRgba(categories[c].color, 0.3);
                catAvgCell.className = 'category-average-value';
            }
        }
        
        // Set the overall average value (last cell)
        //bottomRow.cells[bottomRow.cells.length - 1].textContent = overallAverage;
        //bottomRow.cells[bottomRow.cells.length - 1].className = 'overall-average-value';
        
        
        // Add highlight after updating
        this.highlightAverageCells();
    }

    // Replace the existing exportToExcel method with this simplified version
    exportToExcel() {
        this.excelExporter.exportTableData(this)
            .catch(error => {
                console.error('Error exporting to Excel:', error);
                alert('Ошибка при экспорте в Excel: ' + error.message);
            });
    }

    // Добавьте этот метод в класс TableView

    // Метод для выделения максимальных значений в каждом столбце
    highlightMaxValues() {
        if (!this.table || !this.currentData) return;
    
        
        const rowCount = this.table.rows.length;
        const colCount = this.currentData.luminance[0].length;
        
        // Для каждого столбца (исключая первый столбец меток)
        for (let j = 1; j <= colCount; j++) {
            let maxVal = -Infinity;
            let maxRow = -1;
            
            // Находим максимальное значение в этом столбце (пропуская строку заголовка и возможную строку общего среднего)
            for (let i = 1; i < rowCount - 1; i++) {
                if (this.table.rows[i].cells[j]) {
                    const cellValue = parseFloat(this.table.rows[i].cells[j].textContent);
                    if (!isNaN(cellValue) && cellValue > maxVal) {
                        maxVal = cellValue;
                        maxRow = i;
                    }
                }
                if (this.table.rows[i].cells[j].classList.contains('selected')) {
                    this.table.rows[i].cells[j].classList.remove('selected');
                } 
            }

            // Выделяем ячейку с максимальным значением
            if (maxRow > 0) {
                this.table.rows[maxRow].cells[j].classList.add('selected');
            }
        }
    }

    findMaxValueCells() {
        if (!this.table || !this.currentData) return [];
        
        const maxCells = [];
        const rowCount = this.table.rows.length;
        const colCount = this.currentData.luminance[0].length;
        
        // Для каждого столбца (исключая первый столбец меток)
        for (let j = 1; j <= colCount; j++) {
            let maxVal = -Infinity;
            let maxRow = -1;
            
            // Находим максимальное значение в этом столбце
            // (пропускаем строку заголовка и возможную строку общего среднего)
            for (let i = 1; i < rowCount - 1; i++) {
                if (this.table.rows[i].cells[j]) {
                    const cellValue = parseFloat(this.table.rows[i].cells[j].textContent);
                    if (!isNaN(cellValue) && cellValue > maxVal) {
                        maxVal = cellValue;
                        maxRow = i;
                    }
                }
            }
            
            // Добавляем координаты ячейки в наш массив
            if (maxRow > 0) {
                maxCells.push({row: maxRow-1, col: j-1}); // Корректируем индексы для соответствия формату API
            }
        }
        
        return maxCells;
    }

    // Add this new method for toggling cell selection from canvas
    toggleCellSelection(rowIndex, colIndex, categoryId = 'default') {
        if (!this.table || !this.currentData) return;
        
        // Add 1 to indices because of header row/column
        rowIndex += 1;
        colIndex += 1;
        
        // Check if indices are valid
        if (rowIndex >= this.table.rows.length || 
            colIndex >= this.table.rows[rowIndex].cells.length) {
            return;
        }
        
        const cell = this.table.rows[rowIndex].cells[colIndex];
        const currentImage = window.app.canvasView.getCurrentImage();
        
        if (!currentImage) return;
        
        // Get the category
        const category = currentImage.getCategoryById(categoryId);
        
        // Get current cell categories
        const cellCategories = cell.getAttribute('data-categories') || '';
        const categoryArray = cellCategories ? cellCategories.split(',') : [];
        
        if (categoryArray.includes(categoryId)) {
            // Remove this category
            const updatedCategories = categoryArray.filter(cat => cat !== categoryId).join(',');
            cell.setAttribute('data-categories', updatedCategories);
            
            // If all categories removed, remove selected class
            if (!updatedCategories) {
                cell.classList.remove('selected');
                cell.style.background = '';
            } else {
                // Update the multi-color style with remaining categories
                this.applyMultiCategoryStyle(cell, updatedCategories.split(','), currentImage);
            }
        } else {
            // Add this category
            categoryArray.push(categoryId);
            cell.setAttribute('data-categories', categoryArray.join(','));
            cell.classList.add('selected');
            
            // Apply multi-category style if there are multiple categories
            this.applyMultiCategoryStyle(cell, categoryArray, currentImage);
        }
        
        this.calculateMeanOfSelectedCells();
        
        // Add this line to sync with ImageProcessor
        this.syncSelectionsWithImageProcessor();
    }

    /**
     * Applies a visual style to represent multiple categories in a single cell
     * @param {HTMLTableCellElement} cell - The table cell element
     * @param {Array} categoryIds - Array of category IDs
     * @param {ImageProcessor} image - The current image with category data
     */
    applyMultiCategoryStyle(cell, categoryIds, image) {
        if (!categoryIds || categoryIds.length === 0) {
            cell.style.background = '';
            return;
        }
        
        // If only one category, use solid background
        if (categoryIds.length === 1) {
            const category = image.getCategoryById(categoryIds[0]);
            cell.style.background = category.color;
            return;
        }
        
        // Get colors for all categories
        const colors = categoryIds.map(id => image.getCategoryById(id).color);
        
        if (categoryIds.length === 2) {
            // For two categories, use diagonal gradient
            cell.style.background = `linear-gradient(45deg, ${colors[0]} 0%, ${colors[0]} 49%, ${colors[1]} 51%, ${colors[1]} 100%)`;
        } else if (categoryIds.length === 3) {
            // For three categories, use three vertical stripes
            cell.style.background = `linear-gradient(to right, ${colors[0]} 0%, ${colors[0]} 33%, ${colors[1]} 33%, ${colors[1]} 66%, ${colors[2]} 66%, ${colors[2]} 100%)`;
        } else {
            // For more than three, create a striped pattern
            // Calculate stripe width based on number of categories
            const stripeWidth = 100 / categoryIds.length;
            let gradientStr = 'linear-gradient(to right';
            
            colors.forEach((color, index) => {
                const start = index * stripeWidth;
                const end = (index + 1) * stripeWidth;
                gradientStr += `, ${color} ${start}%, ${color} ${end}%`;
            });
            
            gradientStr += ')';
            cell.style.background = gradientStr;
        }
    }


    // Helper method to convert hex to RGBA
    hexToRgba(hex, alpha = 1) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse hex values
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        
        // Return rgba
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Updates the category average row at the bottom of the table
     * @param {Array} categories - The categories to calculate averages for
     */
    updateCategoryAverageRow(categories = []) {
        if (!this.table || !this.currentData || categories.length === 0) return;
        
        // Check if the bottom row already exists
        let bottomRow;
        if (this.table.rows.length > 0 && this.table.rows[this.table.rows.length - 1].classList.contains('category-average-row')) {
            bottomRow = this.table.rows[this.table.rows.length - 1];
        } else {
            // Create new row if it doesn't exist
            bottomRow = this.table.insertRow();
            bottomRow.classList.add('category-average-row');
            
            // Create label cell
            const labelCell = bottomRow.insertCell(0);
            labelCell.textContent = "Средние по категориям";
            labelCell.className = 'average-label category-average-label';
            
            // Add empty cells for data columns
            const dataColCount = this.currentData?.luminance[0]?.length || 0;
            for (let j = 0; j < dataColCount; j++) {
                bottomRow.insertCell(j + 1).textContent = "";
            }
            
            // Add cells for category averages
            for (let c = 0; c < categories.length; c++) {
                bottomRow.insertCell(dataColCount + 1 + c);
            }
        }
        
        // Calculate category column averages
        if (categories.length > 0) {
            // For each category column, calculate the average
            for (let c = 0; c < categories.length; c++) {
                let catSum = 0;
                let catCount = 0;
                
                // Start from row 1 (skip header) and skip the bottom row
                for (let i = 1; i < this.table.rows.length - 1; i++) {
                    const catCell = this.table.rows[i].cells[this.currentData.luminance[0].length + 1 + c];
                    const catValue = catCell.textContent;
                    
                    if (catValue !== "NaN") {
                        catSum += parseFloat(catValue);
                        catCount++;
                    }
                }
                
                // Calculate category average
                const catAvg = catCount > 0 ? (catSum / catCount).toFixed(3) : "NaN";
                
                // Update the cell in the bottom row
                const catAvgCell = bottomRow.cells[this.currentData.luminance[0].length + 1 + c];
                catAvgCell.textContent = catAvg;
                catAvgCell.style.backgroundColor = this.hexToRgba(categories[c].color, 0.3);
                catAvgCell.className = 'category-average-value';
            }
        }
        
        // Calculate overall average of all selected cells
        const overallAvg = this.calculateOverallCategoryAverage();
        
        // Add this overall average to the category statistics manager
        if (this.categoryStatsManager) {
            this.categoryStatsManager.setOverallAverage(overallAvg);
        }
    }

    /**
     * Calculate overall average across all selected cells
     * @returns {string} The calculated average as a string
     */
    calculateOverallCategoryAverage() {
        if (!this.table || !this.currentData) return "NaN";
        
        let totalSum = 0;
        let totalCount = 0;
        
        // Get all selected cells
        const selectedCells = this.table.querySelectorAll('.selected');
        selectedCells.forEach(cell => {
            const value = parseFloat(cell.textContent);
            if (!isNaN(value)) {
                totalSum += value;
                totalCount++;
            }
        });
        
        return totalCount > 0 ? (totalSum / totalCount).toFixed(3) : "NaN";
    }

    /**
     * Highlights average cells in the table for better visibility
     */
    highlightAverageCells() {
        if (!this.table || !this.currentData) return;
        
        const currentImage = window.app.canvasView.getCurrentImage();
        if (!currentImage) return;
        
        const categories = currentImage.selectionCategories;
        const dataColCount = this.currentData.luminance[0]?.length || 0;
        
        // Highlight category average cells in each row
        for (let i = 1; i < this.table.rows.length; i++) {
            const row = this.table.rows[i];
            
            // Skip if this is a summary row (already styled)
            if (row.classList.contains('category-average-row') || 
                row.classList.contains('overall-average')) {
                continue;
            }
            
            // Style category mean cells at the end of each data row
            for (let c = 0; c < categories.length; c++) {
                const catIndex = dataColCount + 1 + c;
                if (catIndex < row.cells.length) {
                    const cell = row.cells[catIndex];
                    cell.classList.add('category-average');
                    
                    // If it's a valid number and not already styled with category color, style it
                    if (cell.textContent !== "NaN" && !cell.style.backgroundColor) {
                        cell.style.backgroundColor = this.hexToRgba(categories[c].color, 0.2);
                    }
                }
            }
        }
        
        // Find and highlight the category average row
        const categoryAverageRow = Array.from(this.table.rows).find(
            row => row.classList.contains('category-average-row')
        );
        
        if (categoryAverageRow) {
            // Add special styling to the category average row
            categoryAverageRow.classList.add('category-summary-row');
            
            // Highlight each category average cell
            for (let c = 0; c < categories.length; c++) {
                const catIndex = dataColCount + 1 + c;
                if (catIndex < categoryAverageRow.cells.length) {
                    const cell = categoryAverageRow.cells[catIndex];
                    cell.classList.add('category-average-value');
                    
                    // Apply category color with higher opacity for emphasis
                    cell.style.backgroundColor = this.hexToRgba(categories[c].color, 0.3);
                }
            }
        }
        
        // Find and highlight the overall average row
        const overallAverageRow = Array.from(this.table.rows).find(
            row => row.classList.contains('overall-average')
        );
        
        if (overallAverageRow) {
            // Add special styling to the overall average row
            overallAverageRow.style.backgroundColor = '#f8f9fa';
            overallAverageRow.style.fontWeight = 'bold';
            overallAverageRow.style.borderTop = '2px solid #dee2e6';
        }
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