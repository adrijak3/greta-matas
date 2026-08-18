import { useCallback, useEffect, useState } from "react";

import { useI18n } from "@/lib/i18n";
import {
  completeDriveConnect,
  disconnectDrive,
  getDriveStatus,
  startDriveConnect,
  syncDriveBatch,
} from "@/lib/drive.functions";

const CONNECTOR_ID = "google_drive";

function waitForOAuthCompletion(popup: Window) {
  return new Promise<string | null>((resolve, reject) => {
    let poll: number | undefined;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (poll !== undefined) window.clearInterval(poll);
    };
    const onMessage = (event: MessageEvent) => {
      const type = (event.data as { type?: string } | null)?.type;
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        (event.data as { connectorId?: string } | null)?.connectorId !== CONNECTOR_ID ||
        (type !== "appUserConnectorOAuthComplete" && type !== "appUserConnectorOAuthFailed")
      ) {
        return;
      }
      cleanup();
      if (type === "appUserConnectorOAuthComplete") {
        const code = (event.data as { code?: unknown }).code;
        resolve(typeof code === "string" ? code : null);
        return;
      }
      popup.close();
      reject(new Error("oauth-failed"));
    };
    window.addEventListener("message", onMessage);
    poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error("oauth-closed"));
    }, 500);
  });
}

export function DrivePanel() {
  const { t } = useI18n();
  const [status, setStatus] = useState<{ connected: boolean; email: string | null } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await getDriveStatus();
      setStatus({ connected: next.connected, email: next.email });
    } catch {
      setStatus({ connected: false, email: null });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connect = async () => {
    setError(null);
    const popup = window.open("", "gm-drive-oauth", "width=600,height=720");
    if (!popup) {
      setError(t.drivePopupBlocked);
      return;
    }
    setBusy(true);
    try {
      const { authorizationUrl } = await startDriveConnect();
      const completion = waitForOAuthCompletion(popup);
      popup.location.href = authorizationUrl;
      const code = await completion;
      if (code) await completeDriveConnect({ data: { code } });
      await refresh();
    } catch {
      popup.close();
      setError(t.driveConnectError);
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    setError(null);
    try {
      await disconnectDrive();
      await refresh();
    } catch {
      setError(t.driveConnectError);
    } finally {
      setBusy(false);
    }
  };

  const copyAll = async () => {
    setBusy(true);
    setError(null);
    setProgress(t.driveSyncing);
    try {
      let guard = 0;
      for (;;) {
        const result = await syncDriveBatch();
        setProgress(t.driveProgress(result.alreadySynced, result.total));
        if (result.remaining <= 0 || (result.uploaded === 0 && result.failed > 0)) {
          setProgress(
            result.failed > 0
              ? t.driveSyncPartial(result.alreadySynced, result.total)
              : t.driveSyncDone(result.total),
          );
          break;
        }
        if (result.uploaded === 0 || (guard += 1) > 200) break;
      }
    } catch {
      setError(t.driveSyncError);
      setProgress(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card-paper mt-8 p-5">
      <h2 className="font-display text-2xl text-foreground">{t.driveTitle}</h2>
      <p className="mt-1 text-base text-muted-foreground">
        {status?.connected
          ? status.email
            ? t.driveConnectedAs(status.email)
            : t.driveConnected
          : t.driveNotConnected}
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        {status?.connected ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void copyAll()}
              className="btn-hero !min-h-12 !text-base"
            >
              {t.driveCopy}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void disconnect()}
              className="btn-quiet !min-h-12 !text-base"
            >
              {t.driveDisconnect}
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void connect()}
            className="btn-hero !min-h-12 !text-base"
          >
            {t.driveConnect}
          </button>
        )}
      </div>

      {progress && <p className="mt-4 text-base text-muted-foreground">{progress}</p>}
      {error && (
        <p role="alert" className="mt-4 text-base text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
