/**
 * Class for managing category statistics display and calculations
 */
class CategoryStatisticsManager {
    /**
     * Create a new category statistics manager
     */
    constructor() {
        this.container = null;
        this.categoryStats = {};
    }
    
    /**
     * Update the category statistics display
     * @param {Object} categoryStats - Object containing statistics for each category
     * @param {Array} categories - Array of category objects
     * @param {HTMLElement} parentNode - The parent node to insert the statistics container
     */
    updateCategoryAverages(categoryStats, categories, parentNode) {
        // Find or create category averages container
        this.container = document.getElementById('category-averages');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'category-averages';
            this.container.className = 'category-averages';
            
            // Fix: Simply append the container to the parent node
            parentNode.appendChild(this.container);
        } else {
            // Clear existing content
            this.container.innerHTML = '';
        }
        
        // Store the statistics
        this.categoryStats = categoryStats;
        
        // Create and add the statistics content
        this.createStatisticsContent(categories);
    }
    
    /**
     * Create the statistics table and content
     * @param {Array} categories - Array of category objects
     */
    createStatisticsContent(categories) {
        // Create header
        const header = document.createElement('h3');
        header.textContent = 'Статистика по категориям';
        this.container.appendChild(header);
        
        // Create table for category averages
        const catTable = document.createElement('table');
        catTable.className = 'category-averages-table';
        
        // Add header row
        catTable.appendChild(this.createHeaderRow());
        
        // Add data rows for each category
        categories.forEach(category => {
            catTable.appendChild(this.createCategoryRow(category));
        });
        
        // Add the table to the container
        this.container.appendChild(catTable);
    }
    
    /**
     * Create the table header row
     * @returns {HTMLTableRowElement} - The created header row
     */
    createHeaderRow() {
        const headerRow = document.createElement('tr');
        
        const headers = [
            { text: 'Категория', className: '' },
            { text: 'Цвет', className: '' },
            { text: 'Кол-во ячеек', className: '' },
            { text: 'Среднее значение', className: '' }
        ];
        
        headers.forEach(headerInfo => {
            const header = document.createElement('th');
            header.textContent = headerInfo.text;
            if (headerInfo.className) {
                header.className = headerInfo.className;
            }
            headerRow.appendChild(header);
        });
        
        return headerRow;
    }
    
    /**
     * Create a row for a category's statistics
     * @param {Object} category - The category object
     * @returns {HTMLTableRowElement} - The created row
     */
    createCategoryRow(category) {
        const row = document.createElement('tr');
        
        // Add name cell
        const nameCell = document.createElement('td');
        nameCell.textContent = category.name;
        row.appendChild(nameCell);
        
        // Add color cell with swatch
        const colorCell = document.createElement('td');
        const colorSwatch = document.createElement('div');
        colorSwatch.className = 'color-swatch';
        colorSwatch.style.backgroundColor = category.color;
        colorSwatch.style.width = '20px';
        colorSwatch.style.height = '20px';
        colorSwatch.style.margin = '0 auto';
        colorSwatch.style.border = '1px solid #ccc';
        colorCell.appendChild(colorSwatch);
        row.appendChild(colorCell);
        
        // Add count cell
        const countCell = document.createElement('td');
        const categoryCount = this.categoryStats[category.id]?.count || 0;
        countCell.textContent = categoryCount;
        row.appendChild(countCell);
        
        // Add average value cell
        const avgCell = document.createElement('td');
        const stats = this.categoryStats[category.id];
        let avgValue = 'N/A';
        if (stats && stats.count > 0) {
            avgValue = (stats.sum / stats.count).toFixed(3);
            avgCell.textContent = avgValue;
        } else {
            avgCell.textContent = avgValue;
        }
        row.appendChild(avgCell);
        
        return row;
    }
    
    /**
     * Convert a hex color value to RGBA
     * @param {string} hex - Hex color code
     * @param {number} alpha - Alpha transparency value
     * @returns {string} - RGBA color string
     */
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
}