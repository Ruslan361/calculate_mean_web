function updateLuminanceTable(data) {
    luminanceTable.innerHTML = "";
    let headerRow = luminanceTable.insertRow();
    headerRow.insertCell(0).textContent = "Y\\X";
    for (let i = 1; i < data.grid[1].length; i++) {
        headerRow.insertCell(i).textContent = data.grid[1][i-1].toString() + " - " + data.grid[1][i].toString();
    }
    headerRow.insertCell(data.grid[1].length).textContent = "Среднее по среднему";

    for (let i = 0; i < data.luminance.length; i++) {
        let row = luminanceTable.insertRow();
        row.insertCell(0).textContent = data.grid[0][i].toString() + " - " + data.grid[0][i+1].toString();
        for (let j = 0; j < data.luminance[i].length; j++) {
            row.insertCell(j+1).textContent = data.luminance[i][j].toFixed(3).toString();
            row.cells[j+1].onclick = function() {
                row.cells[j+1].classList.toggle('selected');
                meanSelectedCells();
            };
        }
        row.insertCell(data.luminance[i].length+1).textContent = "NaN";
    }
}

function meanSelectedCells() {
    const rows = luminanceTable.rows;
    for (let i = 1; i < rows.length; i++) { // Начинаем с 1, чтобы пропустить заголовок
        let sum = 0;
        let count = 0;
        for (let j = 1; j < rows[i].cells.length - 1; j++) { // Пропускаем первую и последнюю ячейки
            const cell = rows[i].cells[j];
            if (cell.classList.contains('selected')) {
                sum += parseFloat(cell.textContent);
                count += 1;
            }
        }
        rows[i].cells[rows[i].cells.length - 1].textContent = (sum / (count)).toFixed(3); // Записываем результат в последнюю ячейку
    }
}

data = null;
function calculateLuminance() 
{
    // Сохраняем выбранные ячейки перед пересчетом светимости
    if (canvasContainer.image && typeof canvasContainer.image.updateSelectedCells === 'function') {
        canvasContainer.image.updateSelectedCells();
    }
    
    // Сохраняем размеры текущей таблицы для проверки
    let oldTableSize = {
        rows: 0,
        cols: 0
    };
    
    const table = document.getElementById('luminance-table');
    if (table && table.rows.length > 0) {
        oldTableSize.rows = table.rows.length - 1; // Минус заголовок
        oldTableSize.cols = table.rows[0].cells.length - 2; // Минус первый столбец и столбец "Среднее"
    }
    
    calculateLuminanceRemoute(canvasContainer.image.sourceImg, canvasContainer.image.verticalLines, canvasContainer.image.horizontalLines).then(result => {
        // Сохраняем данные светимости в объекте изображения для будущего использования
        canvasContainer.image.luminanceData = result.luminance;
        
        data = result;
        updateLuminanceTable(result);
        
        // Восстанавливаем выбранные ячейки после обновления таблицы
        restoreSelectedCells();
    });
}

function restoreSelectedCells() {
    if (canvasContainer.image && canvasContainer.image.selectedCells) {
        setTimeout(() => {
            const table = document.getElementById('luminance-table');
            
            // Фильтруем выбранные ячейки, проверяя попадают ли они в размеры новой таблицы
            const validCells = canvasContainer.image.selectedCells.filter(cell => {
                // Проверка, что индексы строки и столбца не выходят за пределы таблицы
                // +1 для учета заголовка таблицы
                return table.rows.length > cell.row + 1 && 
                       table.rows[cell.row + 1] && 
                       table.rows[cell.row + 1].cells.length > cell.col + 1;
            });
            
            // Обновляем массив выбранных ячеек, сохраняя только валидные
            canvasContainer.image.selectedCells = validCells;
            
            // Применяем класс 'selected' к валидным ячейкам
            validCells.forEach(cell => {
                if (table.rows[cell.row + 1] && table.rows[cell.row + 1].cells[cell.col + 1]) {
                    table.rows[cell.row + 1].cells[cell.col + 1].classList.add('selected');
                }
            });
            
            // Обновляем средние значения
            meanSelectedCells();
        }, 100); // Небольшая задержка для уверенности, что таблица создана
    }
}

function addVerticalLine() {
    canvasContainer.addVerticalLine();
}
function addHorizontalLine() {
    canvasContainer.addHorizontalLine();
}
function removeVerticalLine() {
    canvasContainer.removeVerticalLine();
}
function removeHorizontalLine() {
    canvasContainer.removeHorizontalLine();
}
