import asyncio
import cv2
import numpy as np
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, MediaStreamTrack
from aiortc import RTCIceServer, RTCConfiguration
from av import VideoFrame
from aiortc.contrib.media import MediaPlayer
import json
import socketio
import re
import configparser, os, pathlib
from ultralytics import YOLO

sio = socketio.AsyncClient()
me = ''

# read config
conf_path = os.path.join(pathlib.Path(__file__).parent.absolute(), 'server.conf') 
config = configparser.ConfigParser()
config.read(conf_path)
print(config.get('servers', 'signaling_server'))
SERVER_URL = config.get('servers', 'signaling_server')
MAX_CONCURRENT_FRAMES = config.getint('processing', 'max_concurrent_frames')


class VideoTransformTrack(MediaStreamTrack): # convert to greyscale now, change to yolo later
    
    def __init__(self, track, model='yolov8n.pt', max_concurrent_frames=MAX_CONCURRENT_FRAMES):
        super().__init__()
        self.track = track
        self.kind = track.kind
        self.model = YOLO(model)
        self.semaphore = asyncio.Semaphore(max_concurrent_frames)

    async def recv(self):
        frame = await self.track.recv()

        img = frame.to_ndarray(format="bgr24")

        # Process with Yolo
        res = self.model(img)
        res_plotted = res[0].plot()

        # Return the processed frame
        new_frame = VideoFrame.from_ndarray(res_plotted, format="bgr24")
        new_frame.pts = frame.pts
        new_frame.time_base = frame.time_base
        return new_frame

# Obtain my socket.io id from siganling server
@sio.on('me')
async def on_me(my_id):
    global me
    me = my_id
    print(f"My Socket ID: {me}")

# if somebody calls python server, it answers automatically
@sio.on('callUser')
async def on_callUser(data):
    from_user = data["from"]
    signal_data = data["signal"]
    from_name = data["name"]

    print(f"Received call from: {from_user}")
    print(f"name: {from_name}")

    # Answer the call automatically
    await answer_call(from_user, signal_data)


async def answer_call(from_user, signal_data):

    # ice_servers = [
    #     RTCIceServer(urls='stun:stun.l.google.com:19302')
    # ]

    # config = RTCConfiguration(ice_servers)

    pc = RTCPeerConnection()

    # test the js data channel
    @pc.on("datachannel")
    async def on_datachennel(channel):
        
        @channel.on("message")
        def on_message(message):
            print(f'---> Message from Remote: {message}')
        
        @channel.on("open")
        def on_open(e):
            print("-----datachennel opened-----")


    @pc.on("icecandidate")
    async def on_icecandidate(candidate):
        await sio.emit("sendIceCandidate", {"candidate": candidate, "to": from_user})

    @pc.on("track")
    def on_track(track):
        print("Track received:", track.kind)
        if track.kind == "video":
            print('a video track found')
            local_video = VideoTransformTrack(track)
            print('local video created')
            pc.addTrack(local_video)
            print('track added')
    
    @sio.on("receiveIceCandidate")
    async def on_candidate(data):
        candidate_string = data["candidate"]["candidate"]  # data[candidate] is a dict and looks like this: {'candidate': 'candidate:2806083971 1 udp 2122129151 172.16.55.152 33110 typ host generation 0 ufrag eOBR network-id 2 network-cost 10', 'sdpMid': '0', 'sdpMLineIndex': 0, 'usernameFragment': 'eOBR'}

        if candidate_string:
            candidate_dict = parse_candidate_string(candidate_string)

            if candidate_dict:
                candidate_dict["sdpMid"] = data["candidate"]["sdpMid"]
                candidate_dict["sdpMLineIndex"] = data["candidate"]["sdpMLineIndex"]
                await pc.addIceCandidate(RTCIceCandidate(**candidate_dict))

    await pc.setRemoteDescription(RTCSessionDescription(**signal_data))

    
    # Create answer and set as LocalDescription
    answer = await pc.createAnswer()
    print(f"Answer: {answer}")
    await pc.setLocalDescription(answer)

    # Send the answer to the signaling server
    await sio.emit('answerCall', {"signal": json.dumps({'sdp': pc.localDescription.sdp, 'type': pc.localDescription.type}), "id": me, "to": from_user})

def parse_candidate_string(candidate_string):
    pattern = re.compile(r"candidate:(?P<foundation>\S+) (?P<component>\d+) (?P<transport>\S+) (?P<priority>\d+) (?P<ip>\S+) (?P<port>\d+) typ (?P<type>\S+)(?: generation (?P<generation>\d+))?(?: ufrag (?P<ufrag>\S+))?(?: network-id (?P<network_id>\d+))?(?: network-cost (?P<network_cost>\d+))?")
    match = pattern.match(candidate_string)

    if match:
        return {
            "foundation": match.group("foundation"),
            "component": int(match.group("component")),
            "protocol": match.group("transport"),
            "priority": int(match.group("priority")),
            "ip": match.group("ip"),
            "port": int(match.group("port")),
            "type": match.group("type"),
            # "generation": int(match.group("generation")) if match.group("generation") else None,
            # "ufrag": match.group("ufrag"),
            # "network_id": int(match.group("network_id")) if match.group("network_id") else None,
            # "network_cost": int(match.group("network_cost")) if match.group("network_cost") else None
        }
    else:
        return None

async def main():
    await sio.connect(SERVER_URL)
    await sio.wait()

if __name__ == "__main__":
    asyncio.run(main())