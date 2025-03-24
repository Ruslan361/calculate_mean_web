/**
 * Service for handling API calls
 */
class APIService {
    async calculateLuminance(base64, verticalLines, horizontalLines) {
        let response = await fetch('/mean-luminance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                image: base64, 
                vertical_lines: verticalLines, 
                horizontal_lines: horizontalLines 
            })
        });
        
        if (response.ok) {
            let data = await response.json();
            return data;
        } else {
            throw new Error("HTTP error: " + response.status);
        }
    }
    
    async blurImage(image) {
        let response = await fetch('/gaussian-blur', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: image }),
        });
        
        if (response.ok) {
            let data = await response.json();
            return data.image;
        } else {
            throw new Error("HTTP error: " + response.status);
        }
    }
}