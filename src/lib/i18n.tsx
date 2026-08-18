import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "lt" | "en";

const STORAGE_KEY = "gm-wedding-lang";

const dict = {
  lt: {
    langTitle: "Pasirinkite kalbą",
    langLt: "Lietuvių",
    langEn: "English",
    langSwitchLabel: "Pakeisti kalbą",
    coupleNames: "Greta & Matas",
    heroTitle: "Užfiksuok akimirką",
    heroText: "Pasidalinkite gražiausiomis šventės akimirkomis su mumis ❤️",
    mainButton: "📷 Pridėti nuotraukas ir vaizdo įrašus",
    mainButtonAria: "Pasirinkti nuotraukas ir vaizdo įrašus iš savo telefono",
    hint: "Galite pasirinkti iš karto daug nuotraukų ir vaizdo įrašų.",
    uploadingTitle: "Keliame jūsų akimirkas… ❤️",
    uploadedCount: (done: number, total: number) => `Įkelta ${done} iš ${total}`,
    pleaseWait: "Prašome neužverti šio lango, kol keliama.",
    progressLabel: "Įkėlimo eiga",
    doneTitle: "Jūsų akimirkos saugios ❤️",
    doneText: "Ačiū, kad pasidalinote savo prisiminimais su mumis!",
    addMore: "Pridėti daugiau",
    fileFailed: "Nepavyko įkelti šio failo.",
    someFailedTitle: "Kai kurių failų įkelti nepavyko",
    someFailedText:
      "Nesijaudinkite – įkeltos nuotraukos ir vaizdo įrašai jau saugūs. Galite pabandyti dar kartą.",
    retry: "Bandyti dar kartą",
    retryAll: "Bandyti dar kartą",
    noFiles: "Nepasirinkote nė vieno failo. Bandykite dar kartą.",
    wrongType: "Šis failas nėra nuotrauka ar vaizdo įrašas.",
    offline: "Nėra interneto ryšio. Patikrinkite ryšį ir bandykite dar kartą.",
    statusWaiting: "Laukiama",
    statusUploading: "Keliama",
    statusDone: "Įkelta",
    statusFailed: "Nepavyko",
    photo: "Nuotrauka",
    video: "Vaizdo įrašas",
    // Admin
    adminTitle: "Vestuvių akimirkų valdymas",
    adminSubtitle: "Tik Gretai ir Matui",
    email: "El. paštas",
    password: "Slaptažodis",
    signIn: "Prisijungti",
    signUp: "Sukurti paskyrą",
    signOut: "Atsijungti",
    signInError: "Neteisingas el. paštas arba slaptažodis.",
    signUpError: "Nepavyko sukurti paskyros. Bandykite dar kartą.",
    noAccess: "Ši paskyra neturi prieigos prie vestuvių akimirkų.",
    loading: "Kraunama…",
    noMedia: "Kol kas nieko neįkelta.",
    download: "Atsisiųsti",
    downloadAll: "Atsisiųsti visus",
    delete: "Ištrinti",
    confirmDelete: "Tikrai ištrinti šį failą?",
    uploadedAt: "Įkelta",
    filesCount: (n: number) => `Failų: ${n}`,
    adminLoadError: "Nepavyko įkelti sąrašo. Bandykite dar kartą.",
    driveTitle: "Google Diskas",
    driveNotConnected:
      "Prijunkite savo Google paskyrą, kad akimirkas galėtumėte nukopijuoti į savo Google Diską.",
    driveConnected: "Google Diskas prijungtas.",
    driveConnectedAs: (email: string) => `Prijungta: ${email}`,
    driveConnect: "Prijungti Google Diską",
    driveDisconnect: "Atjungti",
    driveCopy: "Kopijuoti į mano Diską",
    driveSyncing: "Kopijuojama į jūsų Google Diską…",
    driveProgress: (done: number, total: number) =>
      `Nukopijuota ${done} iš ${total} failų…`,
    driveSyncDone: (total: number) => `Visi ${total} failai nukopijuoti į jūsų Google Diską.`,
    driveSyncPartial: (done: number, total: number) =>
      `Nukopijuota ${done} iš ${total}. Kai kurių failų nepavyko – bandykite dar kartą.`,
    driveSyncError: "Kopijuoti nepavyko. Bandykite dar kartą.",
    driveConnectError: "Nepavyko prijungti Google Disko. Bandykite dar kartą.",
    drivePopupBlocked:
      "Naršyklė užblokavo prisijungimo langą. Leiskite iškylančius langus ir bandykite dar kartą.",

  },
  en: {
    langTitle: "Choose your language",
    langLt: "Lietuvių",
    langEn: "English",
    langSwitchLabel: "Change language",
    coupleNames: "Greta & Matas",
    heroTitle: "Capture a Moment",
    heroText: "Share your favorite moments from our special day ❤️",
    mainButton: "📷 Add Photos & Videos",
    mainButtonAria: "Choose photos and videos from your phone",
    hint: "You can select many photos and videos at once.",
    uploadingTitle: "Uploading your memories… ❤️",
    uploadedCount: (done: number, total: number) => `${done} of ${total} uploaded`,
    pleaseWait: "Please keep this page open while uploading.",
    progressLabel: "Upload progress",
    doneTitle: "Your memories are safe ❤️",
    doneText: "Thank you for sharing your memories with us!",
    addMore: "Add More Photos & Videos",
    fileFailed: "This file could not be uploaded.",
    someFailedTitle: "Some files could not be uploaded",
    someFailedText:
      "Don't worry — everything already uploaded is safe. You can try the rest again.",
    retry: "Try Again",
    retryAll: "Try Again",
    noFiles: "No files were selected. Please try again.",
    wrongType: "This file is not a photo or a video.",
    offline: "No internet connection. Please check it and try again.",
    statusWaiting: "Waiting",
    statusUploading: "Uploading",
    statusDone: "Uploaded",
    statusFailed: "Failed",
    photo: "Photo",
    video: "Video",
    // Admin
    adminTitle: "Wedding media manager",
    adminSubtitle: "For Greta & Matas only",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    signUp: "Create account",
    signOut: "Sign out",
    signInError: "Wrong email or password.",
    signUpError: "The account could not be created. Please try again.",
    noAccess: "This account does not have access to the wedding media.",
    loading: "Loading…",
    noMedia: "Nothing has been uploaded yet.",
    download: "Download",
    downloadAll: "Download all",
    delete: "Delete",
    confirmDelete: "Delete this file for good?",
    uploadedAt: "Uploaded",
    filesCount: (n: number) => `${n} files`,
    adminLoadError: "The list could not be loaded. Please try again.",
    driveTitle: "Google Drive",
    driveNotConnected: "Connect your Google account to copy the memories into your Drive.",
    driveConnected: "Google Drive is connected.",
    driveConnectedAs: (email: string) => `Connected as ${email}`,
    driveConnect: "Connect Google Drive",
    driveDisconnect: "Disconnect",
    driveCopy: "Copy to my Drive",
    driveSyncing: "Copying to your Google Drive…",
    driveProgress: (done: number, total: number) => `Copied ${done} of ${total} files…`,
    driveSyncDone: (total: number) => `All ${total} files are now in your Google Drive.`,
    driveSyncPartial: (done: number, total: number) =>
      `Copied ${done} of ${total}. Some files failed — please try again.`,
    driveSyncError: "The copy could not be finished. Please try again.",
    driveConnectError: "Google Drive could not be connected. Please try again.",
    drivePopupBlocked:
      "Your browser blocked the sign-in window. Allow pop-ups and try again.",

  },
};

export type Dict = (typeof dict)["lt"];

type Ctx = {
  lang: Lang | null;
  ready: boolean;
  t: Dict;
  setLang: (lang: Lang) => void;
  clearLang: () => void;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "lt" || stored === "en") setLangState(stored);
    } catch {
      /* storage unavailable */
    }
    setReady(true);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const clearLang = useCallback(() => {
    setLangState(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  return (
    <LanguageContext.Provider
      value={{ lang, ready, t: dict[lang ?? "lt"], setLang, clearLang }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useI18n must be used inside LanguageProvider");
  return ctx;
}
