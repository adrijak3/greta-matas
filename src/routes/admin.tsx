import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";

import { DrivePanel } from "@/components/wedding/DrivePanel";
import { supabase } from "@/integrations/supabase/client";
import { LanguageProvider, useI18n } from "@/lib/i18n";
import { claimAdminIfFirst } from "@/lib/wedding-admin.functions";


export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Greta & Matas — Media manager" },
      { name: "description", content: "Private wedding media manager for the couple." },
      { property: "og:title", content: "Greta & Matas — Media manager" },
      {
        property: "og:description",
        content: "Private wedding media manager for the couple.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const BUCKET = "wedding-media";

type MediaItem = { path: string; name: string; createdAt: string; url: string };

function AdminPage() {
  return (
    <LanguageProvider>
      <AdminShell />
    </LanguageProvider>
  );
}

function AdminShell() {
  const { t } = useI18n();
  const claimAdmin = useServerFn(claimAdminIfFirst);
  const [state, setState] = useState<
    "loading" | "signed-out" | "no-access" | "access-error" | "ready"
  >("loading");
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [busy, setBusy] = useState(false);

  const loadMedia = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const folders = await supabase.storage
        .from(BUCKET)
        .list("", { limit: 1000, sortBy: { column: "name", order: "desc" } });
      if (folders.error) throw folders.error;

      const collected: MediaItem[] = [];
      for (const folder of folders.data ?? []) {
        if (folder.id) continue; // a file at the root, not a day folder
        const files = await supabase.storage
          .from(BUCKET)
          .list(folder.name, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
        if (files.error) throw files.error;
        for (const file of files.data ?? []) {
          const path = `${folder.name}/${file.name}`;
          const signed = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(path, 60 * 60 * 4);
          collected.push({
            path,
            name: file.name,
            createdAt: file.created_at ?? "",
            url: signed.data?.signedUrl ?? "",
          });
        }
      }
      collected.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setItems(collected);
    } catch {
      setError(t.adminLoadError);
    } finally {
      setBusy(false);
    }
  }, [t.adminLoadError]);

  const bootstrap = useCallback(async () => {
    setState("loading");
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setState("signed-out");
      return;
    }

    try {
      let result: Awaited<ReturnType<typeof claimAdmin>> | undefined;
      let lastError: unknown;

      // A newly-created browser session can take a moment to become available
      // to the server-function middleware on hosted deployments.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          result = await claimAdmin();
          break;
        } catch (claimError) {
          lastError = claimError;
          if (attempt < 2) {
            await new Promise((resolve) => window.setTimeout(resolve, 400 * (attempt + 1)));
          }
        }
      }

      if (!result) throw lastError;
      if (!result.isAdmin) {
        setState("no-access");
        return;
      }
    } catch {
      setState("access-error");
      return;
    }
    setState("ready");
    await loadMedia();
  }, [claimAdmin, loadMedia]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const remove = useCallback(async (path: string) => {
    if (!window.confirm(t.confirmDelete)) return;
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([path]);
    if (removeError) return;
    setItems((prev) => prev.filter((item) => item.path !== path));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.confirmDelete]);

  if (state === "loading") {
    return <CenteredNote text={t.loading} />;
  }

  if (state === "signed-out") {
    return <AuthCard onAuthed={() => void bootstrap()} />;
  }

  if (state === "no-access") {
    return (
      <CenteredNote
        text={t.noAccess}
        action={
          <button
            type="button"
            className="btn-quiet mt-6"
            onClick={async () => {
              await supabase.auth.signOut();
              setState("signed-out");
            }}
          >
            {t.signOut}
          </button>
        }
      />
    );
  }

  if (state === "access-error") {
    return (
      <CenteredNote
        text={t.adminAccessError}
        action={
          <button type="button" className="btn-quiet mt-6" onClick={() => void bootstrap()}>
            {t.retry}
          </button>
        }
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-foreground">{t.adminTitle}</h1>
          <p className="mt-1 text-base text-muted-foreground">{t.adminSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-base text-muted-foreground">
            {t.filesCount(items.length)}
          </span>
          <button
            type="button"
            className="btn-quiet"
            onClick={async () => {
              await supabase.auth.signOut();
              setState("signed-out");
            }}
          >
            {t.signOut}
          </button>
        </div>
      </header>

      <DrivePanel />

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-secondary px-4 py-3 text-base">

          {error}
        </p>
      )}

      {busy && <p className="mt-6 text-base text-muted-foreground">{t.loading}</p>}

      {!busy && items.length === 0 && (
        <p className="mt-10 text-lg text-muted-foreground">{t.noMedia}</p>
      )}

      <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const isVideo = /\.(mp4|mov|m4v|webm|3gp|avi|mkv)$/i.test(item.name);
          return (
            <li key={item.path} className="card-paper overflow-hidden">
              {isVideo ? (
                <video src={item.url} controls preload="metadata" className="h-52 w-full bg-secondary object-cover" />
              ) : (
                <img
                  src={item.url}
                  alt={item.name}
                  loading="lazy"
                  className="h-52 w-full bg-secondary object-cover"
                />
              )}
              <div className="p-4">
                <p className="text-sm text-muted-foreground">
                  {t.uploadedAt}:{" "}
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
                </p>
                <div className="mt-3 flex gap-3">
                  <a
                    href={item.url}
                    download={item.name}
                    className="btn-quiet flex-1 !min-h-11 !text-base"
                  >
                    {t.download}
                  </a>
                  <button
                    type="button"
                    onClick={() => void remove(item.path)}
                    className="btn-quiet !min-h-11 !text-base text-destructive"
                  >
                    {t.delete}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function CenteredNote({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-lg text-muted-foreground">{text}</p>
      {action}
    </main>
  );
}

function AuthCard({ onAuthed }: { onAuthed: () => void }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const result =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setPending(false);
    if (result.error) {
      setMessage(mode === "in" ? t.signInError : t.signUpError);
      return;
    }
    onAuthed();
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="font-display text-3xl text-foreground">{t.adminTitle}</h1>
      <p className="mt-1 text-base text-muted-foreground">{t.adminSubtitle}</p>

      <form onSubmit={submit} className="card-paper mt-7 space-y-5 p-5">
        <label className="block">
          <span className="text-base font-medium text-foreground">{t.email}</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3 text-base"
          />
        </label>
        <label className="block">
          <span className="text-base font-medium text-foreground">{t.password}</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3 text-base"
          />
        </label>

        {message && (
          <p role="alert" className="text-base text-destructive">
            {message}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-hero !min-h-14 !text-lg">
          {pending ? t.loading : mode === "in" ? t.signIn : t.signUp}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="w-full text-base text-muted-foreground underline underline-offset-4"
        >
          {mode === "in" ? t.signUp : t.signIn}
        </button>
      </form>
    </main>
  );
}
