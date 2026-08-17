import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CONNECTOR_ID = "google_drive";
const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
const BUCKET = "wedding-media";
const FOLDER_NAME = "Greta & Matas — vestuvių akimirkos";
const BATCH = 20;

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/drive.file",
];

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Forbidden");
}

export const startDriveConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const clientKey = process.env['GOOGLE_DRIVE_APP_USER_CONNECTOR_CLIENT_API_KEY'];
    if (!clientKey) {
      throw new Error("GOOGLE_DRIVE_APP_USER_CONNECTOR_CLIENT_API_KEY is not set");
    }

    const { getRequest } = await import("@tanstack/react-start/server");
    const { authorizeAppUserOAuth } = await import(
      "@/integrations/lovable/appUserConnector"
    );
    const { getConnectionKeyForUser } = await import("@/server/appUserConnections.server");

    const request = getRequest();
    if (!request) throw new Error("OAuth must start from an app request.");
    const url = new URL(request.url);
    const sandboxHost =
      url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
    const returnUrl = new URL(
      "/oauth/google/return",
      sandboxHost ? `https://${sandboxHost}` : url.origin,
    ).toString();

    const existing = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);

    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: CONNECTOR_ID,
      appUserId: context.userId,
      clientAPIKey: clientKey,
      returnUrl,
      connectionAPIKey: existing ?? undefined,
      credentialsConfiguration: { scopes: GOOGLE_SCOPES },
    });

    return { authorizationUrl };
  });

export const completeDriveConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { exchangeAppUserOAuthCode } = await import(
      "@/integrations/lovable/appUserConnector"
    );
    const { saveConnectionKeyForUser } = await import(
      "@/server/appUserConnections.server"
    );
    const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(
      GATEWAY_BASE_URL,
      data.code,
    );
    if (connectorId !== CONNECTOR_ID) {
      throw new Error("OAuth completion returned the wrong connector");
    }
    await saveConnectionKeyForUser(context.userId, connectorId, connectionAPIKey);
    return { ok: true };
  });

export const getDriveStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { getConnectionKeyForUser } = await import("@/server/appUserConnections.server");
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (!key) return { connected: false as const, email: null };

    const { callAsAppUser } = await import("@/integrations/lovable/appUserConnector");
    const res = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey: key,
      connectorId: CONNECTOR_ID,
      path: "/drive/v3/about?fields=user(emailAddress)",
    });
    if (!res.ok) return { connected: true as const, email: null };
    const body = (await res.json()) as { user?: { emailAddress?: string } };
    return { connected: true as const, email: body.user?.emailAddress ?? null };
  });

export const disconnectDrive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { getConnectionKeyForUser, deleteConnectionForUser } = await import(
      "@/server/appUserConnections.server"
    );
    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (key) {
      const { disconnectAppUser } = await import("@/integrations/lovable/appUserConnector");
      try {
        await disconnectAppUser({
          gatewayBaseUrl: GATEWAY_BASE_URL,
          connectionAPIKey: key,
          connectorId: CONNECTOR_ID,
        });
      } catch {
        /* the local row still needs to go */
      }
    }
    await deleteConnectionForUser(context.userId, CONNECTOR_ID);
    return { ok: true };
  });

export const syncDriveBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { getConnectionKeyForUser, getDriveFolderId, setDriveFolderId } = await import(
      "@/server/appUserConnections.server"
    );
    const { callAsAppUser } = await import("@/integrations/lovable/appUserConnector");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const key = await getConnectionKeyForUser(context.userId, CONNECTOR_ID);
    if (!key) throw new Error("Google Drive is not connected");

    const drive = (path: string, init?: RequestInit) =>
      callAsAppUser({
        gatewayBaseUrl: GATEWAY_BASE_URL,
        connectionAPIKey: key,
        connectorId: CONNECTOR_ID,
        path,
        init,
      });

    // 1. Make sure the wedding folder exists in the couple's Drive.
    let folderId = await getDriveFolderId(context.userId);
    if (folderId) {
      const check = await drive(`/drive/v3/files/${folderId}?fields=id,trashed`);
      if (!check.ok) folderId = null;
      else {
        const meta = (await check.json()) as { trashed?: boolean };
        if (meta.trashed) folderId = null;
      }
    }
    if (!folderId) {
      const created = await drive("/drive/v3/files?fields=id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: FOLDER_NAME,
          mimeType: "application/vnd.google-apps.folder",
        }),
      });
      if (!created.ok) {
        throw new Error(
          `Drive folder creation failed [${created.status}]: ${await created.text()}`,
        );
      }
      folderId = ((await created.json()) as { id: string }).id;
      await setDriveFolderId(context.userId, folderId);
    }

    // 2. Collect every stored file path.
    const paths: string[] = [];
    const folders = await supabaseAdmin.storage.from(BUCKET).list("", { limit: 1000 });
    if (folders.error) throw folders.error;
    for (const folder of folders.data ?? []) {
      if (folder.id) continue;
      const files = await supabaseAdmin.storage
        .from(BUCKET)
        .list(folder.name, { limit: 1000 });
      if (files.error) throw files.error;
      for (const file of files.data ?? []) paths.push(`${folder.name}/${file.name}`);
    }

    const synced = await supabaseAdmin
      .from("drive_synced_files")
      .select("storage_path")
      .eq("user_id", context.userId);
    if (synced.error) throw synced.error;
    const done = new Set((synced.data ?? []).map((row) => row.storage_path));
    const pending = paths.filter((path) => !done.has(path));
    const batch = pending.slice(0, BATCH);

    let uploaded = 0;
    let failed = 0;

    for (const path of batch) {
      try {
        const file = await supabaseAdmin.storage.from(BUCKET).download(path);
        if (file.error || !file.data) throw file.error ?? new Error("download failed");
        const bytes = new Uint8Array(await file.data.arrayBuffer());
        const contentType = file.data.type || "application/octet-stream";
        const name = path.split("/").pop() ?? path;

        const boundary = `gm${crypto.randomUUID().replace(/-/g, "")}`;
        const head = new TextEncoder().encode(
          `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
            `${JSON.stringify({ name, parents: [folderId] })}\r\n` +
            `--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`,
        );
        const tail = new TextEncoder().encode(`\r\n--${boundary}--\r\n`);
        const body = new Uint8Array(head.length + bytes.length + tail.length);
        body.set(head, 0);
        body.set(bytes, head.length);
        body.set(tail, head.length + bytes.length);

        const res = await drive("/upload/drive/v3/files?uploadType=multipart&fields=id", {
          method: "POST",
          headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
          body,
        });
        if (!res.ok) {
          throw new Error(`Drive upload failed [${res.status}]: ${await res.text()}`);
        }
        const driveFile = (await res.json()) as { id: string };
        await supabaseAdmin.from("drive_synced_files").upsert(
          { user_id: context.userId, storage_path: path, drive_file_id: driveFile.id },
          { onConflict: "user_id,storage_path" },
        );
        uploaded += 1;
      } catch (error) {
        console.error("Drive sync failed for", path, error);
        failed += 1;
      }
    }

    return {
      uploaded,
      failed,
      remaining: Math.max(pending.length - uploaded, 0),
      total: paths.length,
      alreadySynced: done.size + uploaded,
    };
  });
