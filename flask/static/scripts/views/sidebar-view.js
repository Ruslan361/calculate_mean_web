/**
 * View class for handling the sidebar
 */
class SidebarView {
    constructor(sidebarElement) {
        this.sidebar = sidebarElement;
        this.thumbnails = document.getElementById("thumbnails");
        this.thumbnailSize = document.getElementById("thumbnail-size");
        
        // Set up thumbnail size slider
        if (this.thumbnailSize) {
            this.thumbnailSize.addEventListener('input', this.updateThumbnailSize.bind(this));
        }
    }
    
    updateThumbnailSize() {
        const size = this.thumbnailSize.value + "px";
        document.querySelectorAll("#thumbnails img").forEach(img => img.style.width = size);
    }
    
    refreshThumbnails(images) {
        if (!this.thumbnails) return;
        
        this.thumbnails.innerHTML = "";
        
        if (images.length > 0) {
            document.getElementById("thumbnail-slider-container").style.display = "block";
        } else {
            document.getElementById("thumbnail-slider-container").style.display = "none";
        }
        
        images.forEach((image, index) => {
            const thumbnail = document.createElement("div");
            thumbnail.className = "thumbnail";
            
            const imgElem = document.createElement("img");
            imgElem.src = image.sourceImg;
            imgElem.title = image.name;
            imgElem.style.width = this.thumbnailSize.value + "px";
            
            thumbnail.onclick = () => {
                this.selectThumbnail(thumbnail, image, index);
            };
            
            thumbnail.appendChild(imgElem);
            
            const p = document.createElement("p");
            p.textContent = image.name;
            thumbnail.appendChild(p);
            
            this.thumbnails.appendChild(thumbnail);
        });
    }
    
    selectThumbnail(thumbnail, image, index) {
        // Remove 'selected' class from all thumbnails
        document.querySelectorAll('div.thumbnail').forEach(t => 
            t.classList.remove('selected'));
        
        // Add 'selected' class to clicked thumbnail
        thumbnail.classList.add('selected');
        
        // Dispatch custom event for image selection
        const event = new CustomEvent('image-selected', {
            detail: { image, index }
        });
        document.dispatchEvent(event);
        
        // Update main image display
        this.updateMainImageDisplay(image.sourceImg);
    }
    
    updateMainImageDisplay(imageUrl) {
        const dropzone = document.getElementById('dropzone');
        const dropzoneText = dropzone.querySelector('p');
        
        dropzoneText.style.display = 'none';
        const existingImage = dropzone.querySelector('img');
        if (existingImage) {
            dropzone.removeChild(existingImage);
        }

        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.width = '100%';
        img.style.height = 'auto';

        dropzone.appendChild(img);
    }
    
    toggleSidebar() {
        this.sidebar.classList.toggle('collapsed');
        
        const toggleButton = document.getElementById('toggle-sidebar');
        const hideSideBar = document.getElementById('hide-sidebar');
        
        if (this.sidebar.classList.contains('collapsed')) {
            toggleButton.textContent = '⮞';
            hideSideBar.style.display = 'none';
        } else {
            toggleButton.textContent = '⮜';
            hideSideBar.style.display = 'block';
        }
    }
}