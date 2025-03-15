from flask import Flask
from flask import request
from flask import render_template
import image_processor as image_processor
import base64
import cv2
import numpy as np

app = Flask(__name__)

def apply_viridis_colormap(blurred_image:np.array) -> np.array:
    viridis_image = cv2.applyColorMap(blurred_image, cv2.COLORMAP_VIRIDIS)
    return viridis_image


def decode_base64_image(base64_image: str) -> np.array:
    try:
        # Удаление префикса, если он присутствует
        if base64_image.startswith('data:image'):
            base64_image = base64_image.split(',')[1]
        
        # Декодирование base64
        image_data = base64.b64decode(base64_image)
        # Преобразование в numpy массив
        np_array = np.frombuffer(image_data, np.uint8)
        # Декодирование изображения
        image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)
        
        if image is None:
            print("Ошибка: cv2.imdecode вернул None. Возможно, данные изображения повреждены или имеют неправильный формат.")
        return image
    except Exception as e:
        print(f"Ошибка при декодировании изображения: {e}")
        return None

def apply_gaussian_blur(image: np.array) -> np.array:
    processor = image_processor.ImageProcessor(image)
    blurred_image = processor.blurGaussian((3, 3), 0, 0)
    return blurred_image

def encode_image_to_base64(viridis_image: np.array) -> str:
    _, img_encoded = cv2.imencode('.png', viridis_image)
    result = base64.b64encode(img_encoded).decode()
    return result


def remove_similar_values(lines: list[int]) -> list[int]:
    for i in range(len(lines) - 1, 0, -1):
        if abs(lines[i] - lines[i - 1]) == 0:
            lines.pop(i)
    return lines


def compute_luminance_relative_to_lines(horizontal_lines_: list, vertical_lines_: list, image: np.array) -> tuple:
    processor = image_processor.ImageProcessor(image)
    horizontal_lines = horizontal_lines_
    horizontal_lines.insert(0, 0)
    horizontal_lines.append(image.shape[0])
    horizontal_lines = list(filter(lambda x: x >= 0 and x <= image.shape[0], horizontal_lines))
    horizontal_lines = list(map(int, horizontal_lines))
    horizontal_lines = sorted(horizontal_lines)
    horizontal_lines = remove_similar_values(horizontal_lines)
    vertical_lines = vertical_lines_
    vertical_lines.insert(0, 0)
    vertical_lines.append(image.shape[1])
    vertical_lines = list(filter(lambda x: x >= 0 and x <= image.shape[1], vertical_lines))
    vertical_lines = list(map(int, vertical_lines))
    vertical_lines = sorted(vertical_lines)
    vertical_lines = remove_similar_values(vertical_lines)
    luminance_values = processor.calculateMeanRelativeToLines(vertical_lines, horizontal_lines)
    grid = (horizontal_lines, vertical_lines)
    return luminance_values, grid


@app.route("/gaussian-blur", methods=["POST"])
def blur_image():
    if request.method == "POST":
        # base64image = request.args.get("image", default=None, type=str)
        base64image = request.json["image"]
        image = decode_base64_image(base64image)
        blurred_image = apply_gaussian_blur(image)
        viridis_image = apply_viridis_colormap(blurred_image)
        result = encode_image_to_base64(viridis_image)
        return {"image": result}, 200

@app.route("/mean-luminance", methods=["POST"])
def mean_luminance():
    if request.method == "POST":
        base64image = request.json["image"]
        image = decode_base64_image(base64image)
        # vertical_lines = request.args.get("vertical_lines", default=None, type=list)
        # horizontal_lines = request.args.get("horizontal_lines", default=None, type=list)
        vertical_lines = request.json["vertical_lines"]
        horizontal_lines = request.json["horizontal_lines"]
        #image = apply_gaussian_blur(image)
        luminance_values, grid = compute_luminance_relative_to_lines(horizontal_lines, vertical_lines, image)
        return {"luminance": luminance_values.tolist(), "grid": grid}, 200
@app.route("/", methods=["GET"])
def index():
    return render_template("index.html"), 200


if __name__ == "__main__":
    app.run(host="localhost", port=8000)