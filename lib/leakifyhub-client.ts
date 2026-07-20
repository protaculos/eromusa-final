// LeakifyHub API Client
// Docs: https://leakifyhub.fun/pt/developer/docs
// Base URL: https://api.leakifyhub.fun/api/v1

const BASE_URL = "https://api.leakifyhub.fun/api/v1";

// ─── Types ───────────────────────────────────────────────────────────────────

export type JobType = "video" | "photo";

export interface StyleOption {
  id: string;
  name: string;
  cost: number;
  type: JobType;
  has_options: boolean;
  options: Record<string, string[]> | null;
  options_type: "classic" | "boolean" | null;
  boolean_categories: BooleanCategory[] | null;
  requires_user_phrase: boolean;
  user_phrase_max_words: number | null;
}

export interface BooleanCategory {
  category_key: string;
  name: string;
  options: { boolean_key: string; name: string }[];
}

export interface VideoStyle extends StyleOption {
  type: "video";
}

export interface PhotoStyle extends StyleOption {
  type: "photo";
}

export interface StylesResponse {
  video_styles: VideoStyle[];
  photo_styles: PhotoStyle[];
}

export interface GenerateRequest {
  image_url: string;
  style: string;
  type: JobType;
  image_url_2?: string;
  source_url?: string;
  face_url?: string;
  options?: Record<string, string | string[]>;
  boolean_selections?: Record<string, string[]>;
  user_phrase?: string;
  webhook_url?: string;
}

export interface JobResponse {
  job_id: number;
  status: "queued" | "processing" | "completed" | "failed";
  estimated_cost: number;
  message: string;
  queue_position: number | null;
  eta: number | null;
}

export interface JobStatus {
  id: number;
  status: "queued" | "processing" | "completed" | "failed";
  job_type: string;
  style: string;
  credits_cost: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  result_url: string | null;
  result_expires_at: string | null;
  error_message: string | null;
  encryption_metadata: EncryptionMetadata | null;
  queue_position: number | null;
  eta: number | null;
}

export interface EncryptionMetadata {
  encrypted_key: string;
  iv: string;
  algorithm: string;
  key_version: number;
}

export interface FaceswapRequest {
  image_url: string;
  face_image_url: string;
  webhook_url?: string;
}

export interface CustomGenerationRequest {
  image_url: string;
  prompt: string;
  webhook_url?: string;
}

export interface JOIConfig {
  configured: boolean;
  subject_variant: string;
  available_subject_variants: string[];
  languages: { locale: string; language_prompt: string }[];
  voices: JOIVoice[];
  presets: JOIPreset[];
  durations: JOIDuration[];
  pricing: JOIPricing;
  api_available: boolean;
}

export interface JOIVoice {
  voice_key: string;
  name: string;
  gender: string;
  language: string;
  accent: string | null;
  preview_url: string;
}

export interface JOIPreset {
  preset_key: string;
  name: string;
  description: string;
  sentences: Record<string, string>;
  durations: { seconds: number; credits: number; cost_usd: number }[];
}

export interface JOIDuration {
  seconds: number;
  credits: number;
  cost_usd: number;
}

export interface JOIPricing {
  credit_base: number;
  credit_base_duration: number;
  credit_step_seconds: number;
  credit_step_amount: number;
}

export interface JOIRequest {
  image_url: string;
  voice_key: string;
  language_locale: string;
  preset_key: string;
  duration_seconds: number;
  script?: string;
  webhook_url?: string;
}

export interface UsageSummary {
  total_jobs: number;
  total_credits_used: number;
  credits_remaining: number;
  // additional fields may exist
  [key: string]: unknown;
}

export interface UsageHistoryEntry {
  date: string;
  jobs: number;
  credits: number;
  // additional fields may exist
  [key: string]: unknown;
}

export interface APIKey {
  id: string;
  key_prefix: string;
  name: string;
  created_at: string;
  // additional fields may exist
  [key: string]: unknown;
}

export interface ApplicationStatus {
  status: "pending" | "approved" | "rejected";
  // additional fields may exist
  [key: string]: unknown;
}

// ─── Error Types ─────────────────────────────────────────────────────────────

export class LeakifyHubError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "LeakifyHubError";
  }
}

export class RateLimitError extends LeakifyHubError {
  constructor(
    public retryAfter: number,
    message: string
  ) {
    super(429, "rate_limit", message);
    this.name = "RateLimitError";
  }
}

export class InsufficientCreditsError extends LeakifyHubError {
  constructor(message: string) {
    super(402, "insufficient_credits", message);
    this.name = "InsufficientCreditsError";
  }
}

// ─── Client ──────────────────────────────────────────────────────────────────

export class LeakifyHubClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(
    private apiKey: string,
    options?: { baseUrl?: string }
  ) {
    this.baseUrl = options?.baseUrl ?? BASE_URL;
    this.headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
  }

  // ─── Jobs ─────────────────────────────────────────────────────────────────

  /** List all available video and photo styles */
  async getStyles(): Promise<StylesResponse> {
    return this.get<StylesResponse>("/jobs/styles");
  }

  /** Submit a generation job (video or photo) */
  async generate(request: GenerateRequest): Promise<JobResponse> {
    return this.post<JobResponse>("/jobs/generate", request);
  }

  /** Poll a job's status and result */
  async getJobStatus(jobId: number): Promise<JobStatus> {
    return this.get<JobStatus>(`/jobs/${jobId}`);
  }

  /** List recent jobs */
  async listJobs(): Promise<JobStatus[]> {
    return this.get<JobStatus[]>("/jobs");
  }

  /** Wait for a job to complete (polling) */
  async waitForJob(
    jobId: number,
    options?: {
      intervalMs?: number;
      timeoutMs?: number;
      onPoll?: (status: JobStatus) => void;
    }
  ): Promise<JobStatus> {
    const interval = options?.intervalMs ?? 2000;
    const timeout = options?.timeoutMs ?? 120_000;
    const started = Date.now();

    while (true) {
      const status = await this.getJobStatus(jobId);
      options?.onPoll?.(status);

      if (status.status === "completed" || status.status === "failed") {
        return status;
      }

      if (Date.now() - started > timeout) {
        throw new Error(
          `Job ${jobId} did not complete within ${timeout}ms (last status: ${status.status})`
        );
      }

      await sleep(interval);
    }
  }

  // ─── Faceswap ────────────────────────────────────────────────────────────

  /** Submit a faceswap job */
  async faceswap(request: FaceswapRequest): Promise<JobResponse> {
    return this.post<JobResponse>("/faceswap/jobs", request);
  }

  // ─── Custom Generation ───────────────────────────────────────────────────

  /** Submit a custom image-to-image generation job */
  async customGenerate(request: CustomGenerationRequest): Promise<JobResponse> {
    return this.post<JobResponse>("/custom-generation/jobs", request);
  }

  // ─── JOI (Talking Video) ──────────────────────────────────────────────────

  /** Get JOI configuration (voices, presets, durations, pricing) */
  async getJOIConfig(): Promise<JOIConfig> {
    return this.get<JOIConfig>("/joi/config");
  }

  /** Submit a JOI talking video job */
  async createJOI(request: JOIRequest): Promise<JobResponse> {
    return this.post<JobResponse>("/joi/jobs", request);
  }

  // ─── Usage & Statistics ───────────────────────────────────────────────────

  /** Get usage summary (total jobs, credits used/remaining) */
  async getUsageSummary(): Promise<UsageSummary> {
    return this.get<UsageSummary>("/usage/summary");
  }

  /** Get usage history */
  async getUsageHistory(): Promise<UsageHistoryEntry[]> {
    return this.get<UsageHistoryEntry[]>("/usage/history");
  }

  // ─── API Key Management (requires website JWT) ───────────────────────────

  /** Create a new API key (requires website JWT auth) */
  async createAPIKey(
    name: string,
    jwtToken: string
  ): Promise<APIKey> {
    return this.post<APIKey>(
      "/keys",
      { name },
      { Authorization: `Bearer ${jwtToken}` }
    );
  }

  /** List API keys (requires website JWT auth) */
  async listAPIKeys(jwtToken: string): Promise<APIKey[]> {
    return this.get<APIKey[]>("/keys", {
      Authorization: `Bearer ${jwtToken}`,
    });
  }

  /** Delete an API key (requires website JWT auth) */
  async deleteAPIKey(keyId: string, jwtToken: string): Promise<void> {
    await this.delete(`/keys/${keyId}`, {
      Authorization: `Bearer ${jwtToken}`,
    });
  }

  // ─── API Access Application ──────────────────────────────────────────────

  /** Apply for API access (requires website JWT auth) */
  async applyForAccess(
    jwtToken: string,
    data?: Record<string, unknown>
  ): Promise<unknown> {
    return this.post("/applications/apply", data ?? {}, {
      Authorization: `Bearer ${jwtToken}`,
    });
  }

  /** Check API application status (requires website JWT auth) */
  async getApplicationStatus(jwtToken: string): Promise<ApplicationStatus> {
    return this.get<ApplicationStatus>("/applications/status", {
      Authorization: `Bearer ${jwtToken}`,
    });
  }

  // ─── Encryption Helpers ──────────────────────────────────────────────────

  /**
   * Derive the encryption key from your API secret using PBKDF2.
   * Matches the server-side derivation.
   */
  async deriveEncryptionKey(apiSecret: string): Promise<CryptoKey> {
    const salt = new TextEncoder().encode("leakify_api_secret_salt_v1");
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(apiSecret),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100_000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
  }

  /**
   * Decrypt a file downloaded from result_url using the encryption_metadata
   * and your API secret.
   */
  async decryptFile(
    encryptedFile: ArrayBuffer,
    metadata: EncryptionMetadata,
    apiSecret: string
  ): Promise<ArrayBuffer> {
    // 1. Derive user key from API secret
    const userKey = await this.deriveEncryptionKey(apiSecret);

    // 2. Decrypt the file key from metadata
    const fileKeyIv = new TextEncoder().encode("file_key_iv_16b");
    const encryptedFileKey = base64ToArrayBuffer(metadata.encrypted_key);

    const fileKeyRaw = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fileKeyIv, additionalData: undefined, tagLength: 128 },
      userKey,
      encryptedFileKey
    );

    const fileKey = await crypto.subtle.importKey(
      "raw",
      fileKeyRaw,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    // 3. Extract IV from encrypted file (first 12 bytes)
    const fileIv = encryptedFile.slice(0, 12);
    const fileContent = encryptedFile.slice(12);

    // 4. Decrypt file content
    return crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fileIv, additionalData: undefined, tagLength: 128 },
      fileKey,
      fileContent
    );
  }

  // ─── Internal HTTP Methods ───────────────────────────────────────────────

  private async get<T>(path: string, extraHeaders?: Record<string, string>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: { ...this.headers, ...extraHeaders },
    });
    return this.handleResponse<T>(response);
  }

  private async post<T>(
    path: string,
    body: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { ...this.headers, ...extraHeaders },
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  private async delete(
    path: string,
    extraHeaders?: Record<string, string>
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "DELETE",
      headers: { ...this.headers, ...extraHeaders },
    });
    if (!response.ok) {
      throw await this.parseError(response);
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw await this.parseError(response);
    }
    return response.json() as Promise<T>;
  }

  private async parseError(response: Response): Promise<LeakifyHubError> {
    let body: { detail?: string; errors?: unknown[] } = {};
    try {
      body = await response.json();
    } catch {
      // ignore parse errors
    }

    const message = body.detail ?? `HTTP ${response.status}`;
    const retryAfter = response.headers.get("Retry-After");

    switch (response.status) {
      case 402:
        return new InsufficientCreditsError(message);
      case 429:
        return new RateLimitError(
          retryAfter ? parseInt(retryAfter, 10) : 60,
          message
        );
      default:
        return new LeakifyHubError(
          response.status,
          `http_${response.status}`,
          message,
          body.errors
        );
    }
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ─── React Hook ──────────────────────────────────────────────────────────────

/**
 * React hook for using the LeakifyHub client.
 *
 * Usage:
 * ```tsx
 * const client = useLeakifyHub();
 * const styles = await client.getStyles();
 * ```
 */
export function useLeakifyHub(apiKey?: string): LeakifyHubClient {
  const key =
    apiKey ??
    (typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_LEAKIFYHUB_API_KEY
      : undefined);

  if (!key) {
    throw new Error(
      "LeakifyHub API key is required. " +
        "Pass it to useLeakifyHub(key) or set NEXT_PUBLIC_LEAKIFYHUB_API_KEY env var."
    );
  }

  return new LeakifyHubClient(key);
}
