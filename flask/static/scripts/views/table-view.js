/**
 * View class for handling the luminance table
 */
class TableView {
    constructor(tableElement) {
        this.table = tableElement;
        this.currentData = null;
        this.tableRendered = false;
        this.pendingSelectedCells = null;
    }
    
    updateTable(data) {
        this.currentData = data;
        this.table.innerHTML = "";
        
        // Check if we have valid data to display
        if (!data || !data.luminance || !data.grid || 
            !data.grid[0] || !data.grid[1] || 
            data.luminance.length === 0) {
            // Display empty or placeholder message
            const emptyRow = this.table.insertRow();
            const cell = emptyRow.insertCell(0);
            cell.textContent = "No luminance data available";
            // Use a more appropriate column span based on previous data or default to a larger value
            const spanWidth = (this.currentData && this.currentData.luminance && 
                              this.currentData.luminance[0]) ? 
                              this.currentData.luminance[0].length + 2 : 5;
            cell.colSpan = spanWidth;
            return;
        }
        
        // Create header row
        let headerRow = this.table.insertRow();
        headerRow.insertCell(0).textContent = "Y\\X";
        
        for (let i = 1; i < data.grid[1].length; i++) {
            headerRow.insertCell(i).textContent = 
                data.grid[1][i-1].toFixed(0).toString() + " - " + data.grid[1][i].toFixed(0).toString();
        }
        
        headerRow.insertCell(data.luminance[0].length + 1).textContent = "Среднее по среднему";

        // Create data rows
        for (let i = 0; i < data.luminance.length; i++) {
            let row = this.table.insertRow();
            
            // Add row header (with safe access)
            if (i < data.grid[0].length - 1) {
                row.insertCell(0).textContent = 
                    data.grid[0][i].toFixed(0).toString() + " - " + data.grid[0][i+1].toFixed(0).toString();
            } else {
                row.insertCell(0).textContent = "Row " + i;
            }
            
            // Add data cells
            for (let j = 0; j < data.luminance[i].length; j++) {
                let cell = row.insertCell(j+1);
                cell.textContent = data.luminance[i][j].toFixed(3).toString();
                
                // Add click handler for cell selection
                cell.onclick = () => {
                    if (cell.classList.contains('selected')) {
                        cell.classList.remove('selected');
                    } else {
                        cell.classList.add('selected');
                    }
                    this.calculateMeanOfSelectedCells();
                };
            }
            
            // Add mean cell
            row.insertCell(data.luminance[0].length + 1).textContent = "NaN";
        }
        
        // Add a flag indicating the table is fully rendered
        this.tableRendered = true;
        
        // If there are pending selected cells to restore, do it now
        if (this.pendingSelectedCells) {
            this.restoreSelectedCells(this.pendingSelectedCells);
            this.pendingSelectedCells = null;
        } else {
            // Выделяем максимальные значения в каждом столбце
            //this.highlightMaxValues();
        }
    }
    
    calculateMeanOfSelectedCells() {
        for (let i = 1; i < this.table.rows.length - 1; i++) { // Skip the last row (overall average)
            let sum = 0;
            let count = 0;
            
            for (let j = 1; j < this.table.rows[i].cells.length - 1; j++) {
                const cell = this.table.rows[i].cells[j];
                
                if (cell.classList.contains('selected')) {
                    sum += parseFloat(cell.textContent);
                    count += 1;
                }
            }
            
            // Avoid division by zero
            const mean = count > 0 ? (sum / count).toFixed(3) : "NaN";
            this.table.rows[i].cells[this.currentData.luminance[0].length + 1].textContent = mean;
        }
        
        // Update the overall average in the last row
        this.updateOverallAverageRow();
        
        // Выделяем максимальные значения в каждом столбце
        //this.highlightMaxValues();
    }
    
    getSelectedCells() {
        const selectedCells = [];
        
        if (!this.table) return selectedCells;
        
        for (let i = 1; i < this.table.rows.length; i++) {
            for (let j = 1; j < this.table.rows[i].cells.length - 1; j++) {
                if (this.table.rows[i].cells[j].classList.contains('selected')) {
                    selectedCells.push({row: i-1, col: j-1});
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
        
        // Filter valid cells with improved boundary checking
        const validCells = selectedCells.filter(cell => {
            // Check if cell indices are within current table dimensions
            return cell.row >= 0 && cell.row < rowCount && 
                   cell.col >= 0 && cell.col < colCount;
        });
        
        // Apply 'selected' class to valid cells
        validCells.forEach(cell => {
            if (this.table.rows[cell.row + 1] && 
                this.table.rows[cell.row + 1].cells[cell.col + 1]) {
                this.table.rows[cell.row + 1].cells[cell.col + 1].classList.add('selected');
            }
        });
        
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

    // Add this method to update or create the overall average row
    updateOverallAverageRow() {
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
            labelCell.style.fontWeight = "bold";
            
            // Add empty cells for data columns
            const colCount = this.currentData?.luminance[0]?.length || 0;
            for (let j = 0; j < colCount; j++) {
                bottomRow.insertCell(j + 1).textContent = "";
            }
            
            // Add cell for overall average
            bottomRow.insertCell(colCount + 1);
        }
        
        // Set the overall average value
        bottomRow.cells[bottomRow.cells.length - 1].textContent = overallAverage;
        bottomRow.cells[bottomRow.cells.length - 1].style.fontWeight = "bold";
    }

    // Add this method to TableView class
    exportToExcel() {
        // Check if table has data
        if (!this.currentData || !this.table.rows.length) {
            alert("Нет данных для экспорта");
            return;
        }
        
        // Create worksheet data array
        const wsData = [];
        
        // Add all rows from table to worksheet data
        for (let i = 0; i < this.table.rows.length; i++) {
            const rowData = [];
            const row = this.table.rows[i];
            
            for (let j = 0; j < row.cells.length; j++) {
                // For numeric cells, convert to numbers
                const cellContent = row.cells[j].textContent;
                if (i > 0 && j > 0 && cellContent !== "NaN" && !isNaN(parseFloat(cellContent))) {
                    rowData.push(parseFloat(cellContent));
                } else {
                    rowData.push(cellContent);
                }
            }
            
            wsData.push(rowData);
        }
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Set column widths
        const colWidths = [];
        for (let i = 0; i < (wsData[0]?.length || 0); i++) {
            colWidths.push({ wch: 15 }); // Set width to 15 characters
        }
        ws['!cols'] = colWidths;
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Luminance Data");
        
        // Generate Excel file and trigger download
        const fileName = "luminance_data_" + new Date().toISOString().split('T')[0] + ".xlsx";
        XLSX.writeFile(wb, fileName);
    }

    // Добавьте этот метод в класс TableView

    // Метод для выделения максимальных значений в каждом столбце
    highlightMaxValues() {
        if (!this.table || !this.currentData) return;
        
        // Удаляем все существующие классы max-value
        // document.querySelectorAll('.selected').forEach(el => {
        //     el.classList.remove('selected');
        // });
        
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
}