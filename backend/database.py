import databases
import sqlalchemy
from dotenv import load_dotenv
import os
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
metadata = sqlalchemy.MetaData()
video_metadata = sqlalchemy.Table(
    "video_metadata",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("title", sqlalchemy.String),
    sqlalchemy.Column("video_url", sqlalchemy.String),
    sqlalchemy.Column("master_playlist_url", sqlalchemy.String),
    sqlalchemy.Column("thumbnail_url", sqlalchemy.String),
    sqlalchemy.Column("is_processed", sqlalchemy.Boolean, default=False),
)
video_resolution = sqlalchemy.Table(
    "video_resolution",
    metadata,
    sqlalchemy.Column("id", sqlalchemy.Integer, primary_key=True),
    sqlalchemy.Column("video_id", sqlalchemy.Integer, sqlalchemy.ForeignKey("video_metadata.id")),
    sqlalchemy.Column("resolution", sqlalchemy.String),
    sqlalchemy.Column("playlist_url", sqlalchemy.String),
    sqlalchemy.Column("bit_rate", sqlalchemy.Integer),
    sqlalchemy.Column("url", sqlalchemy.String),
)

engine=sqlalchemy.create_engine(DATABASE_URL)
metadata.create_all(engine)
database = databases.Database(DATABASE_URL)