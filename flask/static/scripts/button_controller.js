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
    calculateLuminanceRemoute(canvasContainer.image.blurredImage, canvasContainer.image.verticalLines, canvasContainer.image.horizontalLines).then(result => {
        // luminanceOutput.textContent = "Средняя светимость: " + JSON.stringify(result);
        data = result;
        updateLuminanceTable(result);
    });
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
