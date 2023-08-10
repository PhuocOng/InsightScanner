from flask import Flask
from flask import request, jsonify
from google.cloud import vision
from flask_cors import CORS

app = Flask(__name__)
# This will enable CORS for all routes
CORS(app)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"


@app.route("/detect-text", methods = ["POST"])
def detect_text():
    # Instantiates a client
    client = vision.ImageAnnotatorClient()

    # Use the image_uri attribute to specify the image URL
    image = vision.Image()
    image.source.image_uri = request.get_json()['image_url']
    print("I receive img.source is:", image.source.image_uri)

    # Performs label detection on the image file
    response = client.label_detection(image=image)
    labels = response.label_annotations

    
    label_descriptions = [label.description for label in labels]
    print("Labels:", label_descriptions)

    return jsonify(label_descriptions)


if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)  #we need host="0.0.0.0" => So the Iphone can send request to laptop network, if not => it will block requests sent from iphone