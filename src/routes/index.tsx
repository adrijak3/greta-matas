import { createFileRoute } from "@tanstack/react-router";

import { LanguageScreen } from "@/components/wedding/LanguageScreen";
import { UploadFlow } from "@/components/wedding/UploadFlow";
import { LanguageProvider, useI18n } from "@/lib/i18n";

const title = "Greta & Matas — Užfiksuok akimirką";
const description =
  "Galite iš karto pasirinkti ir kartu įkelti norimas nuotraukas bei vaizdo įrašus.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GuestPage,
});

function GuestPage() {
  return (
    <LanguageProvider>
      <GuestScreens />
    </LanguageProvider>
  );
}

function GuestScreens() {
  const { lang, ready } = useI18n();
  if (!ready) return <div className="min-h-screen bg-background" />;
  return lang ? <UploadFlow /> : <LanguageScreen />;
}
