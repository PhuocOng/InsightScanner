from google.cloud import vision

def run_quickstart(image_url: str) -> vision.EntityAnnotation:
    """Provides a quick start example for Cloud Vision with image URL."""

    # Instantiates a client
    client = vision.ImageAnnotatorClient()

    # Use the image_uri attribute to specify the image URL
    image = vision.Image()
    image.source.image_uri = image_url

    # Performs label detection on the image file
    response = client.label_detection(image=image)
    labels = response.label_annotations

    print("Labels:")
    for label in labels:
        print(label.description)

    return labels


print(123)
run_quickstart('https://img.freepik.com/free-vector/hand-drawn-annual-calendar-template_23-2149716984.jpg?w=900&t=st=1691593113~exp=1691593713~hmac=d75c25330891be0c31589c431717619d3812af30f7a81f1ae3dcc3a6615aa6c4')