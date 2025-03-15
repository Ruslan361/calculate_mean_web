

import cv2
import numpy as np
from  image_processor import ImageProcessor
import matplotlib.pyplot as plt

image = cv2.imread('1.JPG')
processor = ImageProcessor(image)
blurred_image = processor.blurGaussian((3, 3), 0, 0)
trash = cv2.threshold(blurred_image, 127, 255, cv2.THRESH_BINARY, blurred_image)
plt.subplot(1, 2, 1)
plt.imshow(blurred_image)
plt.subplot(1, 2, 2)
plt.imshow(trash)
plt.show()

