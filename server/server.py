from Yolo import CreateYoloVideoCapture
from StreamUtils import stream_video_to_websocket


# create a processed video cap
cap = CreateYoloVideoCapture(model='yolov8n.pt', video_source=0)

# stream processed video to websocket, default socket is localhost:8765
stream_video_to_websocket(cap)




