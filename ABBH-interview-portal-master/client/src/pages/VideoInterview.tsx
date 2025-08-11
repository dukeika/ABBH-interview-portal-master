import { useState } from "react";
import api from "../services/api";

export default function VideoInterview() {
  const [videoPath, setVideoPath] = useState("");

  const submitVideo = () => {
    api
      .post("/video-submissions", { videoPath })
      .then(() => alert("Video submitted!"))
      .catch((err) => alert(err.response.data.error));
  };

  return (
    <div>
      <h2>Video Interview</h2>
      <input
        placeholder="Video file path"
        onChange={(e) => setVideoPath(e.target.value)}
      />
      <button onClick={submitVideo}>Submit</button>
    </div>
  );
}
