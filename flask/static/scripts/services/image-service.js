/**
 * Service for handling image operations
 */
class ImageService {
    constructor() {
        this.images = [];
    }
    
    addImages(newImages) {
        this.images = this.images.concat(newImages);
    }
    
    validateFileType(file) {
        const allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;
        return allowedExtensions.test(file.name);
    }
    
    async getExifData(file) {
        return new Promise((resolve, reject) => {
            EXIF.getData(file, function() {
                const metadata = EXIF.getAllTags(this);
                resolve(metadata);
            });
        });
    }
    
    async loadImage(file) {
        const reader = new FileReader();
        const fileData = await new Promise((resolve, reject) => {
            reader.onload = resolve;
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const metadata = await this.getExifData(file);
        
        let image = await ImageProcessor.create({
            imageURL: fileData.target.result,
            name: file.name,
            verticalLines: metadata.verticalLines,
            horizontalLines: metadata.horizontalLines
        });
        
        return image;
    }
    
    async loadImageData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    const image = await ImageProcessor.create({
                        imageURL: jsonData.originalImage,
                        name: jsonData.metadata.name,
                        verticalLines: jsonData.metadata.verticalLines,
                        horizontalLines: jsonData.metadata.horizontalLines,
                        selectedCells: jsonData.metadata.selectedCells,
                        luminanceData: jsonData.metadata.luminance,
                        blurredImage: jsonData.blurredImage,
                        selectionCategories: jsonData.metadata.selectionCategories
                    });
                    
                    resolve(image);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    
    saveImageWithMetadata(image, selectedCells) {
        if (!image) return;
        
        if (selectedCells) {
            image.updateSelectedCells(selectedCells);
        }
        
        const jsonData = {
            originalImage: image.sourceImg,
            blurredImage: image.blurredImage,
            metadata: {
                luminance: image.luminanceData,
                timestamp: new Date().toISOString(),
                verticalLines: image.verticalLines,
                horizontalLines: image.horizontalLines,
                selectedCells: image.selectedCells,
                selectionCategories: image.selectionCategories,
                name: image.name
            }
        };

        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = image.name ? 
            `${image.name.split('.')[0]}_data.json` : 
            'image_data.json';
        link.click();

        // Free resources
        URL.revokeObjectURL(link.href);
    }
}