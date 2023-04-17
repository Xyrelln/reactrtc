import asyncio
import websockets
import cv2
import base64


def stream_video_to_websocket(cap, url: str = 'localhost', port: int = 8765):
    async def send_video_frame(websocket, cap):
        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break

            # Resize and convert the frame to base64
            frame = cv2.resize(frame, (640, 640))
            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')

            await websocket.send(frame_base64)
            await asyncio.sleep(0.015)  # Adjust this value to control the frame rate

        cap.release()
        
    async def serve(websocket, _):
        await send_video_frame(websocket, cap)
        
    start_server = websockets.serve(serve, url, port)

    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()