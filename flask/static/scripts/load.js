const dropzone = document.getElementById('dropzone');
const dropzoneText = document.querySelector('#dropzone p');

class ImageProcessor {
    constructor(options) {
        this.imageURL = options.imageURL;
        this.name = options.name;
        //this.blur();
    }
    async blurImage() {
        try {
            let data = await blurImage(this.imageURL);
            this.blurUrl = 'data:image/png;base64,' + data;
            return this.blurUrl;
        } catch (error) {
            throw error;
        }
    }
    get sourceImg() {
        return this.imageURL;
    }
    get blurImg() {
        return this.blurUrl;
    }
}

// class ImageProcessorWithCanvasInfo extends ImageProcessor {
//     constructor(options) {
//         super(options);
//         this.img = new Image();
//         this.img.src = this.blurUrl;
//         let N = 3;
//         let stepWidth = this.img.width / N;
//         let stepHeight = this.img.height / N;
//         this.verticalLines = [];
//         this.horizontalLines = [];
//         for (let i = 0; i < this.img.width; i+=stepWidth) {
//             this.verticalLines.push(i);
//         }
//         for (let i = 0; i < this.img.height; i+=stepHeight) {
//             this.horizontalLines.push(i);
//         }
//     }
// }

images = [];
// const images = {
//     imageURLs: [],
//     bluredURLs: [],
//     names: [],
//     add: function(imageURL, name) {
//         this.imageURLs.push(imageURL);
//         this.names.push(name);
//     }
// }

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzoneText.textContent = 'Drop files here';
});
dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropzoneText.textContent = 'Перетащите изображение';
});

function validateFileType(file) {
    const allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;
    return allowedExtensions.test(file.name);
}

// function loadImage(file) {
//     const reader = new FileReader();
//     reader.onload = function(event) {
//         // images.add(event.target.result, file.name);
//         const image = new Image({imageURL: event.target.result, name: file.name});
//         images.push(image);
//         promises.push(image.blurImg());
        
//     };
//     reader.readAsDataURL(file);
// }

// function loadImage(file) {
//     return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onload = function(event) {
//             let image = new ImageProcessor({imageURL: event.target.result, name: file.name});
//             images.push(image);
//             image.blurImg.then(() => {
//                 resolve();
//             }).catch(error => {
//                 reject(error);
//             });
//         };
//         reader.onerror = function(error) {
//             reject(error);
//         };
//         reader.readAsDataURL(file);
//     });
// }

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(event) {
            let image = new ImageProcessor({ imageURL: event.target.result, name: file.name });
            images.push(image);

            try {
                await image.blurImage(); // теперь это метод, а не свойство
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = function(error) {
            reject(error);
        };
        reader.readAsDataURL(file);
    });
}


dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzoneText.textContent = 'Processing files...';
    const items = e.dataTransfer.items;
    promises = []
    for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
            const file = items[i].getAsFile();
            if (validateFileType(file)) {
                // Обработка файла
                console.log('Файл:', file);
                // Например, можно вызвать функцию для загрузки изображения
                promises.push(loadImage(file));
                
            } else {
                alert('Пожалуйста, загрузите файл с расширением .jpg, .jpeg, .png или .gif.');
            }
        }
    }
    Promise.all(promises).then(() => {
        refreshThumbnails(images);
        promises = [];
    });
});

function setImage(imageURL) {
    dropzoneText.style.display = 'none';
    //dropzone.style.backgroundImage = `url(${imageURL})`;
    // Удаляем предыдущее изображение, если оно есть
    const existingImage = dropzone.querySelector('img');
    if (existingImage) {
        dropzone.removeChild(existingImage);
    }

    // Создаем новый элемент img
    const img = document.createElement('img');
    img.src = imageURL;
    img.style.width = '100%'; // Настройте стили по вашему усмотрению
    img.style.height = 'auto'; // Настройте стили по вашему усмотрению

    // Вставляем img в dropzone
    dropzone.appendChild(img);
}

window.setImage = setImage;
window.images = images;
