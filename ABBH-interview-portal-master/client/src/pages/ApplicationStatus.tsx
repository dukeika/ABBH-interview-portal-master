import React, { useEffect, useState } from "react";
import { getApplicationStatus, toPublicUrl } from "../services/api";

type Status = {
  stage?: string;
  status?: string;
  noteBeforeWritten?: string | null;
  noteBeforeVideo?: string | null;
  noteBeforeFinal?: string | null;
  finalLink?: string | null;
  writtenScore?: number | null;
  videoAnswers?: Array<{ questionId: string | number; url: string }>;
  resumeUrl?: string | null;
};

export default function ApplicationStatus() {
  const [data, setData] = useState<Status | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getApplicationStatus();
        setData(res);
      } catch (e: any) {
        setErr(
          e?.response?.data?.error || e?.message || "Failed to load status"
        );
      }
    })();
  }, []);

  if (err) {
    return (
      <div style={{ maxWidth: 640, margin: "32px auto", padding: 16 }}>
        <div
          style={{
            background: "#fee",
            color: "#b00",
            padding: 12,
            borderRadius: 8,
          }}
        >
          {err}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ maxWidth: 640, margin: "32px auto", padding: 16 }}>
        Loading your status...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "32px auto", padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Application Status</h2>
      <p style={{ color: "#666", marginTop: 0 }}>
        Stage: <strong>{data.stage || "Unknown"}</strong> • Status:{" "}
        <strong>{data.status || "N/A"}</strong>
      </p>

      {data.resumeUrl && (
        <p>
          Resume:{" "}
          <a
            href={toPublicUrl(data.resumeUrl)}
            target="_blank"
            rel="noreferrer"
          >
            View
          </a>
        </p>
      )}

      {data.noteBeforeWritten && (
        <div
          style={{
            background: "#fff8e1",
            padding: 12,
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          <strong>Note from HR before written test:</strong>
          <div>{data.noteBeforeWritten}</div>
        </div>
      )}

      {data.noteBeforeVideo && (
        <div
          style={{
            background: "#fff8e1",
            padding: 12,
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          <strong>Note from HR before video stage:</strong>
          <div>{data.noteBeforeVideo}</div>
        </div>
      )}

      {data.noteBeforeFinal && (
        <div
          style={{
            background: "#fff8e1",
            padding: 12,
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          <strong>Note from HR before final chat:</strong>
          <div>{data.noteBeforeFinal}</div>
        </div>
      )}

      {data.finalLink && (
        <div
          style={{
            background: "#e3f2fd",
            padding: 12,
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          <strong>Final interview link (external): </strong>
          <a href={data.finalLink} target="_blank" rel="noreferrer">
            Join call
          </a>
        </div>
      )}

      {!!data.writtenScore && (
        <div
          style={{
            background: "#e8f5e9",
            padding: 12,
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          <strong>Written test score: </strong> {data.writtenScore}
        </div>
      )}

      {Array.isArray(data.videoAnswers) && data.videoAnswers.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <strong>Video answers:</strong>
          <ul>
            {data.videoAnswers.map((v) => (
              <li key={String(v.questionId)}>
                Q#{v.questionId}:{" "}
                <a href={toPublicUrl(v.url)} target="_blank" rel="noreferrer">
                  Watch
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
