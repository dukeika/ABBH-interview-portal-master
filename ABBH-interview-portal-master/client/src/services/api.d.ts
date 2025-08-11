// client/src/services/api.d.ts
import type { AxiosInstance } from "axios";

export const setToken: (token: string) => void;
export const getToken: () => string | null;
export const clearToken: () => void;

export type Job = {
  id: string | number;
  title: string;
  department?: string | null;
  location?: string | null;
  description?: string | null;
  status?: string | null;
};

export type ApplicationStatus = {
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

export function login(body: {
  email: string;
  password: string;
}): Promise<{ token: string; user: any }>;
export function register(body: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<{ token: string; user: any }>;
export function me(): Promise<any>;

export function listJobs(): Promise<Job[]>;
export function getJob(id: string | number): Promise<Job>;

export function submitApplication(payload: {
  jobId: string | number;
  fullName: string;
  phone?: string;
  coverLetter?: string;
  file: File;
}): Promise<any>;

export function getApplicationStatus(): Promise<ApplicationStatus>;

export type Question = {
  id: string | number;
  text: string;
  category?: string | null;
  difficulty?: number | null;
  weight?: number | null;
};

export function getWrittenQuestions(params?: {
  jobId?: string | number;
}): Promise<Question[] | { questions: Question[] }>;
export function submitWrittenAnswers(body: {
  answers: Record<string, string>;
}): Promise<any>;

export function getVideoQuestions(params?: {
  jobId?: string | number;
}): Promise<Question[] | { questions: Question[] }>;
export function uploadVideoAnswer(
  applicationId: string | number,
  questionId: string | number,
  file: File | Blob
): Promise<any>;

export function getFinalLink(): Promise<{ finalLink?: string }>;

export function adminListCandidates(): Promise<any[]>;
export function adminGetCandidate(id: string | number): Promise<any>;
export function adminAdvanceStage(
  id: string | number,
  body?: { message?: string; note?: string }
): Promise<any>;
export function adminRevertStage(
  id: string | number,
  body?: { message?: string; note?: string }
): Promise<any>;
export function adminSetFinalLink(
  id: string | number,
  body: { finalLink: string; message?: string }
): Promise<any>;
export function adminCreateJob(role: {
  title: string;
  description?: string;
  department?: string;
  location?: string;
}): Promise<any>;
export function adminAddQuestion(q: {
  jobId: string | number;
  type: "WRITTEN" | "VIDEO";
  text: string;
  category?: string;
  difficulty?: number;
  weight?: number;
}): Promise<any>;
export function adminListJobQuestions(jobId: string | number): Promise<any>;

export function toPublicUrl(path: string): string;

declare const api: AxiosInstance;
export default api;
