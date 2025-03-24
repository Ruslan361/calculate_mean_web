/**
 * Class for processing and managing images
 */
class ImageProcessor {
    constructor(options) {
        this.imageURL = options.imageURL;
        this.name = options.name;
        this.verticalLines = options.verticalLines || [];
        this.horizontalLines = options.horizontalLines || [];
        this.selectedCells = options.selectedCells || [];
        this.luminanceData = options.luminanceData || null;
        this.blurredImageUrl = options.blurredImage || null;
        this.img = new Image();
    }

    static async create(options) {
        const instance = new ImageProcessor(options);
        
        if (!options.blurredImage) {
            await instance.blurImage();
        }
        
        await instance.loadImage();
        return instance;
    }
    
    async blurImage() {
        try {
            const apiService = new APIService();
            let data = await apiService.blurImage(this.imageURL);
            this.blurredImageUrl = 'data:image/png;base64,' + data;
        } catch (error) {
            console.error('Error blurring image:', error);
            throw error;
        }
    }
    
    async loadImage() {
        return new Promise((resolve, reject) => {
            this.img.onload = () => {
                if (this.verticalLines.length === 0) {
                    this.initializeVerticalLines();
                }
                
                if (this.horizontalLines.length === 0) {
                    this.initializeHorizontalLines();
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
    
    initializeVerticalLines() {
        const N = 3;
        const stepWidth = this.img.width / N;
        this.verticalLines = [];
        for (let i = stepWidth; i < this.img.width; i += stepWidth) {
            this.verticalLines.push(i);
        }
    }
    
    initializeHorizontalLines() {
        const N = 3;
        const stepHeight = this.img.height / N;
        this.horizontalLines = [];
        for (let i = stepHeight; i < this.img.height; i += stepHeight) {
            this.horizontalLines.push(i);
        }
    }
    
    updateSelectedCells(selectedCells) {
        this.selectedCells = selectedCells || [];
    }
    
    get sourceImg() {
        return this.imageURL;
    }
    
    get blurredImage() {
        return this.blurredImageUrl;
    }
}