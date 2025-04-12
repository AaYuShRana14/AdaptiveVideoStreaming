import React from "react";
import VideoPlayer from "./component/VideoPlayer";

const App = () => {
  const videoId = "809716870"; 

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h1>Adaptive Video Streaming</h1>
      <VideoPlayer videoId={videoId} />
    </div>
  );
};

export default App;
