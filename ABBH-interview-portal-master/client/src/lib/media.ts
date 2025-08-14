// client/src/lib/media.ts
export async function getUserStream(opts: {
  videoDeviceId?: string | null;
  audioDeviceId?: string | null;
}) {
  const constraints: MediaStreamConstraints = {
    video: opts.videoDeviceId
      ? { deviceId: { exact: opts.videoDeviceId } }
      : true,
    audio: opts.audioDeviceId
      ? { deviceId: { exact: opts.audioDeviceId } }
      : true,
  };
  return await navigator.mediaDevices.getUserMedia(constraints);
}

// Creates a MediaRecorder that pushes every dataavailable chunk
export function createMediaRecorder(
  stream: MediaStream,
  onChunk: (b: Blob) => void
) {
  const mime = pickMimeType();
  const rec = new MediaRecorder(
    stream,
    mime
      ? { mimeType: mime, videoBitsPerSecond: 2_000_000 }
      : { videoBitsPerSecond: 2_000_000 }
  );
  rec.addEventListener("dataavailable", (ev) => {
    if (ev.data && ev.data.size > 0) onChunk(ev.data);
  });
  rec.addEventListener("stop", () => {
    try {
      rec.requestData?.();
    } catch {}
  });
  return rec;
}

function pickMimeType() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const c of candidates) {
    if ((window as any).MediaRecorder?.isTypeSupported?.(c)) return c;
  }
  return "";
}
