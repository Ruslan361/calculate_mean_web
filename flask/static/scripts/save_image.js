function saveImageWithMetadata() {
    // Get the selected cells from the table
    const selectedCells = [];
    const table = document.getElementById('luminance-table');
    
    for (let i = 1; i < table.rows.length; i++) {
        for (let j = 1; j < table.rows[i].cells.length - 1; j++) {
            if (table.rows[i].cells[j].classList.contains('selected')) {
                selectedCells.push({row: i-1, col: j-1});
            }
        }
    }
    
    // Store selected cells in the image object
    canvasContainer.image.selectedCells = selectedCells;
    
    const jsonData = {
        originalImage: canvasContainer.image.sourceImg,
        blurredImage: canvasContainer.image.blurredImage,
        metadata: {
            luminance: data ? data.luminance : null, // Store the luminance calculation results
            timestamp: new Date().toISOString(),
            verticalLines: canvasContainer.image.verticalLines,
            horizontalLines: canvasContainer.image.horizontalLines,
            selectedCells: selectedCells,
            name: canvasContainer.image.name
        }
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = canvasContainer.image.name ? 
        `${canvasContainer.image.name.split('.')[0]}_data.json` : 
        'image_data.json';
    link.click();

    // Free resources
    URL.revokeObjectURL(link.href);
}

// Функция для загрузки данных из JSON файла
async function loadImageData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                const image = await ImageProcessorWithCanvasInfo.create({
                    imageURL: jsonData.originalImage,
                    name: jsonData.metadata.name,
                    verticalLines: jsonData.metadata.verticalLines,
                    horizontalLines: jsonData.metadata.horizontalLines,
                    selectedCells: jsonData.metadata.selectedCells,
                    luminanceData: jsonData.metadata.luminance
                });
                
                // Add event to mark cells after table is drawn
                const originalInsert = canvasContainer.insert;
                canvasContainer.insert = function(img) {
                    originalInsert.call(canvasContainer, img);
                    
                    // Need to wait for the table to be created
                    setTimeout(() => {
                        if (img.selectedCells && img.selectedCells.length > 0) {
                            const table = document.getElementById('luminance-table');
                            img.selectedCells.forEach(cell => {
                                if (table.rows[cell.row + 1] && 
                                    table.rows[cell.row + 1].cells[cell.col + 1]) {
                                    table.rows[cell.row + 1].cells[cell.col + 1].classList.add('selected');
                                }
                            });
                            meanSelectedCells(); // Update means after selecting cells
                        }
                    }, 500); // Give time for table to be created
                };
                
                resolve(image);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

document.getElementById('save-button').addEventListener('click', saveImageWithMetadata);