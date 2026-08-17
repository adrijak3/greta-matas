const SUPABASE_URL = import.meta.env['VITE_SUPABASE_URL'] as string;
const SUPABASE_KEY = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string;
const BUCKET = "wedding-media";

export function isMediaFile(file: File) {
  const type = (file.type || "").toLowerCase();
  if (type.startsWith("image/") || type.startsWith("video/")) return true;
  // Some browsers report an empty type for HEIC / MOV files.
  return /\.(jpg|jpeg|png|heic|heif|webp|gif|avif|mp4|mov|m4v|3gp|avi|mkv|webm|hevc)$/i.test(
    file.name,
  );
}

function safeName(file: File) {
  const ext = file.name.includes(".") ? file.name.split(".").pop()! : "bin";
  return `${crypto.randomUUID()}.${ext.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
}

/**
 * Uploads one file straight from the guest's device to private wedding storage
 * (never through the app server), reporting real progress via XHR.
 */
export function uploadFile(
  file: File,
  onProgress: (fraction: number) => void,
): { promise: Promise<void>; abort: () => void } {
  const day = new Date().toISOString().slice(0, 10);
  const path = `${day}/${safeName(file)}`;
  const xhr = new XMLHttpRequest();

  const promise = new Promise<void>((resolve, reject) => {
    xhr.open(
      "POST",
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURI(path)}`,
      true,
    );
    xhr.setRequestHeader("apikey", SUPABASE_KEY);
    xhr.setRequestHeader("authorization", `Bearer ${SUPABASE_KEY}`);
    xhr.setRequestHeader("x-upsert", "false");
    if (file.type) xhr.setRequestHeader("content-type", file.type);
    xhr.setRequestHeader("cache-control", "3600");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(1);
        resolve();
      } else {
        reject(new Error(`upload_failed_${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("network_error"));
    xhr.onabort = () => reject(new Error("aborted"));
    xhr.send(file);
  });

  return { promise, abort: () => xhr.abort() };
}

/** Runs tasks with limited concurrency so slow connections stay stable. */
export async function runWithConcurrency(
  tasks: Array<() => Promise<void>>,
  limit = 3,
) {
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (index < tasks.length) {
      const current = tasks[index++]!;
      await current();
    }
  });
  await Promise.all(workers);
}
