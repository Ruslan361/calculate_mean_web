const dropzone = document.getElementById('dropzone');
const dropzoneText = document.querySelector('#dropzone p');
let images = [];

class ImageProcessor {
    constructor(options) {
        this.imageURL = options.imageURL;
        this.name = options.name;
    }

    static async create(options) {
        const instance = new ImageProcessor(options);
        await instance.blurImage();
        return instance;
    }
    
    async blurImage() {
        try {
            let data = await blurImage(this.imageURL);
            this.blurUrl = 'data:image/png;base64,' + data;
        } catch (error) {
            console.error('Error blurring image:', error);
        }
    }
    
    get sourceImg() {
        return this.imageURL;
    }
    
    get blurredImage() {
        return this.blurUrl;
    }
}

class ImageProcessorWithCanvasInfo extends ImageProcessor {
    constructor(options) {
        super(options);
        this.img = new Image();
        this.verticalLines = options.verticalLines;
        this.horizontalLines = options.horizontalLines;
        this.selectedCells = options.selectedCells || []; // Store selected table cells
        this.luminanceData = options.luminanceData || null; // Store luminance calculation results
    }

    static async create(options) {
        const instance = new ImageProcessorWithCanvasInfo(options);
        await instance.blurImage();
        await instance.loadImage(); // Исправлено: вызов метода экземпляра
        return instance;
    }
    
    async loadImage() {
        return new Promise((resolve, reject) => {
            const instance = this; // Сохраняем ссылку на экземпляр класса
            this.img.onload = function() {
                let N = 3;
                if (typeof(instance.horizontalLines) === 'undefined') {
                    let stepHeight = instance.img.height / N;
                    instance.horizontalLines = [];
                    for (let i = 0; i < instance.img.height; i += stepHeight) {
                        instance.horizontalLines.push(i);
                    }
                }
                if (typeof(instance.verticalLines) === 'undefined') {
                    let stepWidth = instance.img.width / N;
                    instance.verticalLines = [];
                    for (let i = 0; i < instance.img.width; i += stepWidth) {
                        instance.verticalLines.push(i);
                    }
                }
                resolve();
            };
            this.img.onerror = (error) => {
                console.error('Error loading image:', error);
                reject(error);
            };
            this.img.src = this.imageURL;
        });
    }
}

async function getExifData(file) {
    return new Promise((resolve, reject) => {
        EXIF.getData(file, function() {
            const metadata = EXIF.getAllTags(this);
            resolve(metadata);
        });
    });
}

async function loadImage(file) {
    try {
        const reader = new FileReader();
        const fileData = await new Promise((resolve, reject) => {
            reader.onload = resolve;
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const metadata = await getExifData(file);
        console.log('Metadata:', metadata);

        let image = await ImageProcessorWithCanvasInfo.create({
            imageURL: fileData.target.result,
            name: file.name,
            verticalLines: metadata.verticalLines,
            horizontalLines: metadata.horizontalLines
        });

        images.push(image);
    } catch (error) {
        console.error('Error loading image:', error);
    }
}

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

dropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropzoneText.textContent = 'Processing files...';
    const items = e.dataTransfer.items;

    for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
            const file = items[i].getAsFile();
            
            // Check if file is JSON
            if (file.name.toLowerCase().endsWith('.json')) {
                try {
                    const image = await loadImageData(file);
                    images.push(image);
                } catch (error) {
                    console.error('Error loading JSON file:', error);
                    alert('Error loading JSON file: ' + error.message);
                }
            } else if (validateFileType(file)) {
                await loadImage(file);
            } else {
                alert('Please upload .jpg, .jpeg, .png, .gif, or .json files.');
            }
        }
    }
    refreshThumbnails(images);
});

function setImage(imageURL) {
    dropzoneText.style.display = 'none';
    const existingImage = dropzone.querySelector('img');
    if (existingImage) {
        dropzone.removeChild(existingImage);
    }

    const img = document.createElement('img');
    img.src = imageURL;
    img.style.width = '100%';
    img.style.height = 'auto';

    dropzone.appendChild(img);
}

window.setImage = setImage;
window.images = images;
