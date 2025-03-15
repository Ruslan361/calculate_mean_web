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
                    cell.classList.toggle('selected');
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
        }
    }
    
    calculateMeanOfSelectedCells() {
        for (let i = 1; i < this.table.rows.length; i++) {
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
}