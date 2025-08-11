import React, { useEffect, useRef, useState } from "react";

type Props = { onRecorded: (blob: Blob, durationSec: number) => void };

export default function VideoRecorder({ onRecorded }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [startTs, setStartTs] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const s = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    })();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const start = () => {
    if (!stream) return;
    const mr = new MediaRecorder(stream, { mimeType: "video/webm" });
    setChunks([]);
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) setChunks((prev) => [...prev, e.data]);
    };
    mr.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const durationSec = Math.round((Date.now() - startTs) / 1000);
      onRecorded(blob, durationSec);
    };
    mr.start();
    setStartTs(Date.now());
    setRec(mr);
    setRecording(true);
  };
  const stop = () => {
    rec?.stop();
    setRecording(false);
  };

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: "100%", borderRadius: 12 }}
      />
      {!recording ? (
        <button onClick={start} style={{ marginTop: 8 }}>
          Start
        </button>
      ) : (
        <button onClick={stop} style={{ marginTop: 8 }}>
          Stop
        </button>
      )}
    </div>
  );
}
