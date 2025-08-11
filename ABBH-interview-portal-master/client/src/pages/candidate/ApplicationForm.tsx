import React, { useEffect, useState } from "react";
import { listJobs, submitApplication } from "../../services/api";
import { useNavigate } from "react-router-dom";

type Job = {
  id: string | number;
  title: string;
  location?: string;
};

export default function ApplicationForm() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await listJobs();
        setJobs(data || []);
        if ((data || []).length > 0) {
          setJobId(String(data[0].id));
        }
      } catch (e: any) {
        setErr(e?.response?.data?.error || e?.message || "Failed to load jobs");
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resume) {
      setErr("Please attach your resume (PDF/DOC).");
      return;
    }
    setErr(null);
    setOk(null);
    setLoading(true);
    try {
      await submitApplication({
        jobId,
        fullName,
        phone,
        coverLetter,
        file: resume,
      });
      setOk(
        "Application submitted! You can check your progress on the Status page."
      );
      // optional: go straight to status
      setTimeout(() => navigate("/status"), 800);
    } catch (e: any) {
      setErr(
        e?.response?.data?.error || e?.message || "Failed to submit application"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "32px auto", padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Apply for a role</h2>
      <p style={{ color: "#666", marginTop: 0 }}>
        Select a job, upload your resume, and add a brief cover letter.
      </p>

      {err && (
        <div
          style={{
            background: "#fee",
            color: "#b00",
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {err}
        </div>
      )}
      {ok && (
        <div
          style={{
            background: "#eefbea",
            color: "#1b5e20",
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {ok}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <label style={{ display: "block", marginBottom: 12 }}>
          Job
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 4 }}
          >
            {jobs.map((j) => (
              <option key={String(j.id)} value={String(j.id)}>
                {j.title} {j.location ? `— ${j.location}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          Full name
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ width: "100%", padding: 10, marginTop: 4 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          Phone (optional)
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 4 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          Cover letter (optional)
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={6}
            style={{ width: "100%", padding: 10, marginTop: 4 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 16 }}>
          Resume (PDF/DOC)
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setResume(e.target.files?.[0] ?? null)}
            required
            style={{ display: "block", marginTop: 6 }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "none",
            background: "#222",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {loading ? "Submitting..." : "Submit application"}
        </button>
      </form>
    </div>
  );
}
