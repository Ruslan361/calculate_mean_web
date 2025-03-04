const thumbnails = document.getElementById("thumbnails");
const luminanceOutput = document.getElementById("luminance-output");
const luminanceTable = document.getElementById("luminance-table");
const thumbnailSliderContainer = document.getElementById("thumbnail-slider-container");
const hideSideBar = document.getElementById("hide-sidebar");

function updateThumbnailSize() {
    const size = document.getElementById("thumbnail-size").value + "px";
    document.querySelectorAll("#thumbnails img").forEach(img => img.style.width = size);
}

function scrollThumbnails(amount) {
    thumbnails.scrollBy({ tsop: amount, behavior: 'smooth' });
}

function refreshThumbnails(images) 
{
    // const imgsrcs = images.imageURLs;
    // const names = images.names;
        thumbnails.innerHTML = "";
        if (images.length > 0) {
            thumbnailSliderContainer.style.display = "block";
        } else {
            thumbnailSliderContainer.style.display = "none";
        }
        for (let i = 0; i < images.length; i++) {
            const thumbnail = document.createElement("div");
            thumbnail.className = "thumbnail";
            const imgElem = document.createElement("img");
            imgElem.src = images[i].sourceImg;
            imgElem.title = images[i].name;
            imgElem.style.width = document.getElementById("thumbnail-size").value + "px";
            thumbnail.onclick = () => {
                const thumbnails = document.querySelectorAll('div.thumbnail');
                // Удаляем класс 'selected' у всех изображений
                thumbnails.forEach(t => t.classList.remove('selected'));
                
                // Добавляем класс 'selected' к текущему изображению
                thumbnail.classList.add('selected');
                
                // Сохраняем выбранные ячейки текущего изображения перед сменой
                if (canvasContainer.image && typeof canvasContainer.image.updateSelectedCells === 'function') {
                    canvasContainer.image.updateSelectedCells();
                }
                
                // Добавляем очистку выделения в таблице перед загрузкой нового изображения
                const table = document.getElementById('luminance-table');
                if (table) {
                    for (let i = 1; i < table.rows.length; i++) {
                        for (let j = 1; j < table.rows[i].cells.length - 1; j++) {
                            table.rows[i].cells[j].classList.remove('selected');
                        }
                    }
                }
                
                // Загружаем новое изображение
                canvasContainer.insert(images[i]);
                setImage(images[i].sourceImg);
                
                // Если у нового изображения есть данные светимости, обновляем таблицу и восстанавливаем ячейки
                if (images[i].luminanceData) {
                    data = {
                        luminance: images[i].luminanceData,
                        grid: [images[i].horizontalLines, images[i].verticalLines]
                    };
                    updateLuminanceTable(data);
                    restoreSelectedCells();
                }
            };
            thumbnail.appendChild(imgElem);
            const p = document.createElement("p");
            p.textContent = images[i].name;
            thumbnail.appendChild(p);
            thumbnails.appendChild(thumbnail);
        }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleButton = document.getElementById('toggle-sidebar');
    
    sidebar.classList.toggle('collapsed');
    
    // Меняем текст кнопки в зависимости от состояния боковой панели
    if (sidebar.classList.contains('collapsed')) {
        toggleButton.textContent = '⮞';
        hideSideBar.style.display = 'none';
    } else {
        toggleButton.textContent = '⮜';
        hideSideBar.style.display = 'block';
    }
}

window.refreshThumbnails = refreshThumbnails;