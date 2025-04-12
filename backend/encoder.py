import os
import subprocess
from database import database, video_resolution, video_metadata

base_dir = os.path.dirname(os.path.abspath(__file__))
upload_dir = os.path.join(base_dir, "videos")

async def encode_video_to_hls(video_id: str, file_path: str):
    resolutions = {
        "360p": {"width": 640, "height": 360, "bitrate": "800k"},
        "480p": {"width": 854, "height": 480, "bitrate": "1200k"},
        "720p": {"width": 1280, "height": 720, "bitrate": "2500k"},
        "1080p": {"width": 1920, "height": 1080, "bitrate": "5000k"},
    }

    hls_dir = os.path.join(upload_dir, video_id, "hls")
    os.makedirs(hls_dir, exist_ok=True)

    master_playlist_path = os.path.join(hls_dir, "master.m3u8")
    playlists = []


    for res, config in resolutions.items():
        output_path = os.path.join(hls_dir, f"{res}.m3u8")
        playlists.append({
            "resolution": res,
            "path": output_path
        })
        command = [
            "ffmpeg", "-i", file_path,
            "-vf", f"scale=w={config['width']}:h={config['height']}",
            "-c:v", "libx264", "-b:v", config["bitrate"],
            "-hls_time", "10", "-hls_playlist_type", "vod",
            "-hls_segment_filename", os.path.join(hls_dir, f"{res}_%03d.ts"),
            output_path
        ]
        subprocess.run(command, check=True)

    with open(master_playlist_path, "w") as master_playlist:
        master_playlist.write("#EXTM3U\n")
        for playlist in playlists:
            resolution = playlist["resolution"]
            path = os.path.basename(playlist["path"])
            master_playlist.write(f"#EXT-X-STREAM-INF:BANDWIDTH={resolutions[resolution]['bitrate']},RESOLUTION={resolutions[resolution]['width']}x{resolutions[resolution]['height']}\n")
            master_playlist.write(f"{path}\n")

    for playlist in playlists:
        query = video_resolution.insert().values(
            video_id=int(video_id),
            resolution=playlist["resolution"],
            playlist_url=f"/videos/{video_id}/hls/{os.path.basename(playlist['path'])}"
        )
        await database.execute(query=query)

    query = video_metadata.update().where(video_metadata.c.id == int(video_id)).values(is_processed=True)
    await database.execute(query)

