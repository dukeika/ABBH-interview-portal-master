import React, { useEffect, useState } from "react";
import {
  listJobs,
  register as apiRegister,
  setToken,
  submitApplication,
} from "../services/api";
import { useNavigate, Link } from "react-router-dom";

type Job = {
  id: string | number;
  title: string;
  location?: string | null;
};

type SubmitState = "idle" | "submitting";

export default function ApplyNow() {
  const navigate = useNavigate();

  // account
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // application
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState<string>("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState<File | null>(null);

  // ui
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [state, setState] = useState<SubmitState>("idle");

  useEffect(() => {
    (async () => {
      try {
        const data = await listJobs();
        const arr: Job[] = Array.isArray(data) ? data : [];
        setJobs(arr);
        if (arr.length > 0) setJobId(String(arr[0].id));
      } catch (e: unknown) {
        setErr(extractErr(e, "Failed to load jobs"));
      }
    })();
  }, []);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setResume(f);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!resume) {
      setErr("Please attach your resume (PDF or DOC).");
      return;
    }
    if (!jobId) {
      setErr("Please select a job.");
      return;
    }

    setState("submitting");
    try {
      // 1) create account + login
      const auth = await apiRegister({ fullName, email, password, phone });
      setToken(auth.token);

      // 2) submit application (multipart)
      await submitApplication({
        jobId,
        fullName,
        phone,
        coverLetter,
        file: resume,
      });

      setOk("Application submitted! Redirecting to your status…");
      setTimeout(() => navigate("/status"), 900);
    } catch (e: unknown) {
      const msg = extractErr(e, "Failed to submit");
      // Tip UX for 409 (email exists)
      if (/409/.test(msg) || /exists/i.test(msg)) {
        setErr(
          "An account with this email already exists. Please log in instead on the Login page."
        );
        return;
      }
      setErr(msg);
    } finally {
      setState("idle");
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "32px auto", padding: 16 }}>
      <h2 style={{ marginBottom: 8 }}>Apply now</h2>
      <p style={{ color: "#666", marginTop: 0 }}>
        Create your account, pick a role, upload your resume, and add a brief
        cover letter.
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
            background: "#e8f5e9",
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
        <fieldset style={fs()}>
          <legend style={lg()}>Account</legend>

          <label style={lbl()}>
            Full name
            <input
              style={inp()}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>

          <label style={lbl()}>
            Email
            <input
              style={inp()}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label style={lbl()}>
            Password
            <input
              style={inp()}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          <label style={lbl()}>
            Phone (optional)
            <input
              style={inp()}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
        </fieldset>

        <fieldset style={fs()}>
          <legend style={lg()}>Application</legend>

          <label style={lbl()}>
            Job
            <select
              style={inp()}
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              required
            >
              {jobs.map((j) => (
                <option key={String(j.id)} value={String(j.id)}>
                  {j.title} {j.location ? `— ${j.location}` : ""}
                </option>
              ))}
            </select>
          </label>

          <label style={lbl()}>
            Cover letter (optional)
            <textarea
              style={inp()}
              rows={6}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </label>

          <label style={lbl()}>
            Resume (PDF/DOC)
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={onFileChange}
              required
              style={{ display: "block", marginTop: 8 }}
            />
          </label>
        </fieldset>

        <button type="submit" disabled={state === "submitting"} style={btn()}>
          {state === "submitting" ? "Submitting…" : "Submit application"}
        </button>

        <p style={{ marginTop: 12 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}

/** minimal styles */
function fs(): React.CSSProperties {
  return {
    border: "1px solid #eee",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  };
}
function lg(): React.CSSProperties {
  return { padding: "0 6px", fontWeight: 600 };
}
function lbl(): React.CSSProperties {
  return { display: "block", marginBottom: 12 };
}
function inp(): React.CSSProperties {
  return {
    width: "100%",
    padding: 10,
    marginTop: 6,
    border: "1px solid #ddd",
    borderRadius: 8,
  };
}
function btn(): React.CSSProperties {
  return {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "none",
    background: "#222",
    color: "#fff",
    cursor: "pointer",
  };
}

function extractErr(e: unknown, fallback: string): string {
  if (typeof e === "object" && e && "response" in e) {
    const res = (e as any).response;
    return res?.data?.error || res?.statusText || fallback;
  }
  return (e as Error)?.message || fallback;
}
