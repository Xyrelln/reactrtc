from ultralytics import YOLO
import cv2


class YoloVideoCapture:
    """
        A wrapper for cv2.VideoCapture 
        Args:
        :param model: see https://docs.ultralytics.com/tasks/detect/#predict
        :param video_source: Video source (integer for camera index or string for video file path).
    """

    def __init__(self, model='yolov8n.pt', video_source=0):
        self.model = YOLO(model)
        self.cap = cv2.VideoCapture(video_source)

    def isOpened(self):
        return self.cap.isOpened()

    def read(self):
        """
        Read a frame from the video source, process it using the YOLO model, and return the annotated frame.

        :return: Tuple containing a boolean (True if a frame was successfully read) and the annotated frame.
        """
        success, frame = self.cap.read()
        if success:
            results = self.model(frame)
            annotated_frame = results[0].plot()
            return success, annotated_frame
        else:
            return success, None

    def release(self):
        self.cap.release()

def CreateYoloVideoCapture(model='yolov8n.pt', video_source=0):
    return YoloVideoCapture(model, video_source)
