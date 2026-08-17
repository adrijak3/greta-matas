import { useI18n, type Lang } from "@/lib/i18n";

export function LanguageScreen() {
  const { setLang } = useI18n();

  const options: Array<{ code: Lang; flag: string; label: string }> = [
    { code: "lt", flag: "🇱🇹", label: "Lietuvių" },
    { code: "en", flag: "🇬🇧", label: "English" },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-10 px-6 py-14">
      <div className="text-center">
        <p className="font-display text-4xl leading-tight text-foreground">
          Greta &amp; Matas
        </p>
        <span className="mt-3 block text-2xl" aria-hidden="true">
          ❤️
        </span>
      </div>

      <h1 className="text-center text-3xl leading-snug text-foreground">
        Pasirinkite kalbą
        <span className="mt-1 block text-xl text-muted-foreground">
          Choose your language
        </span>
      </h1>

      <div className="flex w-full flex-col gap-5">
        {options.map((option) => (
          <button
            key={option.code}
            type="button"
            onClick={() => setLang(option.code)}
            className="btn-hero hover:btn-hero-hover active:scale-[0.99]"
          >
            <span className="text-3xl" aria-hidden="true">
              {option.flag}
            </span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </main>
  );
}
