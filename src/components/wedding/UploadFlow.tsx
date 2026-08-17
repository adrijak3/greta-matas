import { useCallback, useEffect, useRef, useState } from "react";

import florals from "@/assets/wedding-florals.png";
import { useI18n } from "@/lib/i18n";
import { isMediaFile, runWithConcurrency, uploadFile } from "@/lib/upload";

type Status = "waiting" | "uploading" | "done" | "failed";

type Item = {
  id: string;
  file: File;
  status: Status;
  progress: number;
  preview?: string;
};

type Phase = "idle" | "uploading" | "finished";

export function UploadFlow() {
  const { t, lang, clearLang } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(
    () => () => {
      items.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const update = useCallback((id: string, patch: Partial<Item>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }, []);

  const startUploads = useCallback(
    async (targets: Item[]) => {
      if (targets.length === 0) return;
      setPhase("uploading");
      setNotice(null);

      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setNotice(t.offline);
      }

      const tasks = targets.map((item) => async () => {
        update(item.id, { status: "uploading", progress: 0 });
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const { promise } = uploadFile(item.file, (fraction) =>
              update(item.id, { progress: fraction }),
            );
            await promise;
            update(item.id, { status: "done", progress: 1 });
            return;
          } catch {
            if (attempt === 2) {
              update(item.id, { status: "failed", progress: 0 });
              return;
            }
            await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
          }
        }
      });

      await runWithConcurrency(tasks, 3);
      setPhase("finished");
    },
    [t.offline, update],
  );

  const onPick = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(event.target.files ?? []);
      event.target.value = "";
      if (picked.length === 0) {
        setNotice(t.noFiles);
        return;
      }
      const media = picked.filter(isMediaFile);
      if (media.length === 0) {
        setNotice(t.wrongType);
        return;
      }
      const next: Item[] = media.map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "waiting",
        progress: 0,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      }));
      setItems(next);
      void startUploads(next);
    },
    [startUploads, t.noFiles, t.wrongType],
  );

  const retryFailed = useCallback(() => {
    const failed = items.filter((item) => item.status === "failed");
    void startUploads(failed);
  }, [items, startUploads]);

  const done = items.filter((item) => item.status === "done").length;
  const failed = items.filter((item) => item.status === "failed").length;
  const total = items.length;
  const overall =
    total === 0
      ? 0
      : Math.round(
          (items.reduce(
            (sum, item) => sum + (item.status === "done" ? 1 : item.progress),
            0,
          ) /
            total) *
            100,
        );

  const statusLabel: Record<Status, string> = {
    waiting: t.statusWaiting,
    uploading: t.statusUploading,
    done: t.statusDone,
    failed: t.statusFailed,
  };

  const pickButton = (label: string) => (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      aria-label={t.mainButtonAria}
      className="btn-hero hover:btn-hero-hover active:scale-[0.99]"
    >
      {label}
    </button>
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-6 py-10">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*,.heic,.heif,.mov"
        multiple
        onChange={onPick}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <header className="text-center">
        <p className="font-display text-3xl tracking-wide text-foreground sm:text-4xl">
          {t.coupleNames}
        </p>
        <div
          className="mx-auto mt-1 h-px w-24 bg-border"
          aria-hidden="true"
        />
      </header>

      {phase === "idle" && (
        <section className="mt-8 flex flex-1 flex-col">
          <img
            src={florals}
            alt=""
            aria-hidden="true"
            width={1024}
            height={768}
            className="mx-auto w-56 opacity-90 sm:w-64"
          />
          <h1 className="mt-2 text-center text-4xl leading-tight text-foreground sm:text-5xl">
            {t.heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-center text-lg leading-relaxed text-muted-foreground">
            {t.heroText}
          </p>

          <div className="mt-9">{pickButton(t.mainButton)}</div>
          <p className="mt-4 text-center text-base text-muted-foreground">{t.hint}</p>
          {notice && (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-secondary px-4 py-3 text-center text-base text-secondary-foreground"
            >
              {notice}
            </p>
          )}
        </section>
      )}

      {phase === "uploading" && (
        <section className="mt-10 flex flex-1 flex-col" aria-live="polite">
          <h1 className="text-center text-3xl leading-snug text-foreground">
            {t.uploadingTitle}
          </h1>
          <p className="mt-4 text-center text-2xl font-semibold text-foreground">
            {t.uploadedCount(done, total)}
          </p>
          <div
            role="progressbar"
            aria-label={t.progressLabel}
            aria-valuenow={overall}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-5 h-4 w-full overflow-hidden rounded-full bg-secondary"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${overall}%` }}
            />
          </div>
          <p className="mt-4 text-center text-base text-muted-foreground">
            {t.pleaseWait}
          </p>

          <ul className="mt-7 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="card-paper flex items-center gap-4 p-3">
                {item.preview ? (
                  <img
                    src={item.preview}
                    alt=""
                    aria-hidden="true"
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-secondary text-2xl"
                    aria-hidden="true"
                  >
                    🎬
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base text-foreground">
                    {item.file.type.startsWith("video/") ? t.video : t.photo}
                  </p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full ${
                        item.status === "failed" ? "bg-destructive" : "bg-primary"
                      }`}
                      style={{
                        width: `${item.status === "done" ? 100 : Math.round(item.progress * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-base text-muted-foreground">
                  {item.status === "done" ? "✓" : statusLabel[item.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {phase === "finished" && (
        <section className="mt-12 flex flex-1 flex-col items-center text-center">
          <span className="animate-heart text-5xl" aria-hidden="true">
            ❤️
          </span>
          {failed === 0 ? (
            <>
              <h1 className="mt-2 text-4xl leading-tight text-foreground">
                {t.doneTitle}
              </h1>
              <p className="mt-4 max-w-sm text-lg leading-relaxed text-muted-foreground">
                {t.doneText}
              </p>
              <p className="mt-3 text-base text-muted-foreground">
                {t.uploadedCount(done, total)}
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-2 text-3xl leading-snug text-foreground">
                {t.someFailedTitle}
              </h1>
              <p className="mt-4 max-w-sm text-lg leading-relaxed text-muted-foreground">
                {t.someFailedText}
              </p>
              <p className="mt-3 text-base text-muted-foreground">
                {t.uploadedCount(done, total)}
              </p>
              <div className="mt-7 w-full">
                <button
                  type="button"
                  onClick={retryFailed}
                  className="btn-hero hover:btn-hero-hover"
                >
                  {t.retryAll}
                </button>
              </div>
            </>
          )}

          <div className="mt-6 w-full">{pickButton(`📷 ${t.addMore}`)}</div>
        </section>
      )}

      <footer className="mt-12 flex justify-center pb-4">
        <button
          type="button"
          onClick={clearLang}
          className="rounded-lg px-4 py-2 text-base text-muted-foreground underline underline-offset-4"
        >
          {lang === "lt" ? "🇬🇧 English" : "🇱🇹 Lietuvių"} · {t.langSwitchLabel}
        </button>
      </footer>
    </main>
  );
}
