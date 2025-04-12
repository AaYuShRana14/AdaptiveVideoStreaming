import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import "../component/video.css";

const VideoPlayer = ({ videoId }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState("auto");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    
    if (Hls.isSupported()) {
      const hls = new Hls({
        capLevelToPlayerSize: true,
        autoStartLoad: true,
      });
      
      hlsRef.current = hls;
      
      // Load the source
      const streamUrl = `http://127.0.0.1:8000/upload/stream/${videoId}/master.m3u8`;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      
      // When manifest is parsed, get available qualities
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const levels = data.levels.map((level, index) => ({
          id: index,
          width: level.width,
          height: level.height,
          bitrate: level.bitrate,
          name: `${level.height}p`,
        }));
        
        // Add auto quality option
        const qualityOptions = [
          { id: -1, name: "Auto" },
          ...levels,
        ];
        
        setQualities(qualityOptions);
      });
      
      // Update current level when changed
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const levelId = data.level;
        setCurrentQuality(levelId === -1 ? "auto" : levelId);
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // For Safari, which has native HLS support
      video.src = `http://127.0.0.1:8000/upload/stream/${videoId}/master.m3u8`;
      // Safari doesn't support quality switching via JS
      setQualities([{ id: -1, name: "Auto" }]);
    }
    
    // Set up video event listeners
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("play", () => setIsPlaying(true));
    video.addEventListener("pause", () => setIsPlaying(false));
    
    return () => {
      // Cleanup
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("play", () => setIsPlaying(true));
      video.removeEventListener("pause", () => setIsPlaying(false));
    };
  }, [videoId]);
  
  const handleTimeUpdate = () => {
    setCurrentTime(videoRef.current.currentTime);
  };
  
  const handleDurationChange = () => {
    setDuration(videoRef.current.duration);
  };
  
  const handleQualityChange = (qualityId) => {
    if (Hls.isSupported() && hlsRef.current) {
      hlsRef.current.currentLevel = qualityId;
      setCurrentQuality(qualityId === -1 ? "auto" : qualityId);
    }
  };
  
  const togglePlay = () => {
    const video = videoRef.current;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
  };
  
  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };
  
  const toggleFullscreen = () => {
    const container = playerContainerRef.current;
    
    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    
    setIsFullscreen(!isFullscreen);
  };
  
  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
    };
  }, []);
  
  // Format time to MM:SS
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "00:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="hls-player-container" ref={playerContainerRef}>
      <video
        ref={videoRef}
        className="hls-player-video"
        playsInline
        onClick={togglePlay}
      ></video>
      
      <div className="hls-player-controls">
        <div className="hls-player-progress">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="hls-player-progress-bar"
          />
          <div className="hls-player-time">
            <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <div className="hls-player-buttons">
          <button className="hls-player-control-btn" onClick={togglePlay}>
            {isPlaying ? "⏸️" : "▶️"}
          </button>
          
          <div className="hls-player-volume">
            <span>{volume > 0 ? "🔊" : "🔇"}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="hls-player-volume-slider"
            />
          </div>
          
          <div className="hls-player-quality-selector">
            <button className="hls-player-quality-btn">
              Quality: {currentQuality === "auto" ? "Auto" : `${qualities[currentQuality+1]?.name || ""}`}
            </button>
            <div className="hls-player-quality-options">
              {qualities.map((quality) => (
                <button
                  key={quality.id}
                  className={`hls-player-quality-option ${
                    (quality.id === -1 && currentQuality === "auto") || 
                    quality.id === currentQuality ? "active" : ""
                  }`}
                  onClick={() => handleQualityChange(quality.id)}
                >
                  {quality.name}
                </button>
              ))}
            </div>
          </div>
          
          <button className="hls-player-control-btn" onClick={toggleFullscreen}>
            {isFullscreen ? "⟲" : "⛶"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;