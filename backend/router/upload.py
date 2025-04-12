from fastapi import APIRouter, UploadFile, Form, HTTPException,BackgroundTasks
from pydantic import BaseModel, HttpUrl
from encoder import encode_video_to_hls
import os
from fastapi.responses import FileResponse
import json
from uuid import uuid4
from database import database, video_metadata, video_resolution
class Metadata(BaseModel):
    title: str
    thumbnail_url: HttpUrl

router = APIRouter()

basedir = os.path.dirname(os.path.abspath(__name__))
upload_dir = os.path.join(basedir, "videos")
os.makedirs(upload_dir, exist_ok=True)

@router.post("/")
async def upload_file(
    metadata: str = Form(...), 
    file: UploadFile = None,
    background_tasks: BackgroundTasks = None
):
    try:
        print("REQuEST", metadata)
        metadata_dict = json.loads(metadata)
        metadata_obj = Metadata(**metadata_dict)
        if file is None:
            raise HTTPException(status_code=400, detail="File is required")
        
        video_id = int(uuid4().int % 1_000_000_000)
        video_dir = os.path.join(upload_dir, str(video_id), "hls")
        os.makedirs(video_dir, exist_ok=True)

        file_path = os.path.join(video_dir, file.filename)
        with open(file_path, "wb") as buffer:
         while True:
            data = file.file.read()
            if not data:
                break
            buffer.write(data)
        master_playlist_url = f"{video_id}/hls/master.m3u8"

        video_detail= {
            "title": metadata_obj.title,
            "id": video_id,
            "video_url": f"{video_id}/{file.filename}",
            "master_playlist_url": master_playlist_url,
            "thumbnail_url": str(metadata_obj.thumbnail_url),
            "is_processed": False,
        }
        query = video_metadata.insert().values(**video_detail)
        await database.execute(query)
        background_tasks.add_task(
            encode_video_to_hls, str(video_id), file_path
        )
        return {
            "message": "File uploaded successfully",
            "metadata": video_detail,
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid metadata format. Must be JSON.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stream/{video_id}/{filename}")
async def stream_video(video_id: str, filename: str):
    videos_dir = os.path.join(upload_dir, video_id)
    file_path = os.path.join(videos_dir,"hls", filename)
  
    if not os.path.exists(videos_dir):
        raise HTTPException(status_code=404, detail="Video not found")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path, media_type="application/vnd.apple.mpegurl" if filename.endswith(".m3u8") else "video/MP2T")
