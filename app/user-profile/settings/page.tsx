"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNavigation from "@/components/BottomNavigation";
import FloatingStickers from "@/components/FloatingSticker";
const languages = ["English", "Kinyarwanda", "French", "Spanish", "Swahili"];

const translations: Record<string, Record<string, string>> = {
  English: {
    settings: "Settings",
    appearance: "Appearance",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    language: "Language",
    notifications: "Notifications",
    enableNotifications: "Enable Notifications",
    account: "Account",
    comingSoon: "Manage your account details here (coming soon).",
    toastDismiss: "Dismiss notification",
  },
  Kinyarwanda: {
    settings: "Igenamiterere",
    appearance: "Imiterere",
    darkMode: "Uburyo bwijimye",
    lightMode: "Uburyo bwumucyo",
    language: "Ururimi",
    notifications: "Amatangazo",
    enableNotifications: "Emeza Amatangazo",
    account: "Konti",
    comingSoon: "Ugenzure amakuru ya konti yawe hano (biraza vuba).",
    toastDismiss: "Funga itangazo",
  },
  French: {
    settings: "Paramètres",
    appearance: "Apparence",
    darkMode: "Mode sombre",
    lightMode: "Mode clair",
    language: "Langue",
    notifications: "Notifications",
    enableNotifications: "Activer les notifications",
    account: "Compte",
    comingSoon: "Gérez les détails de votre compte ici (bientôt disponible).",
    toastDismiss: "Fermer la notification",
  },
  Spanish: {
    settings: "Configuración",
    appearance: "Apariencia",
    darkMode: "Modo oscuro",
    lightMode: "Modo claro",
    language: "Idioma",
    notifications: "Notificaciones",
    enableNotifications: "Activar notificaciones",
    account: "Cuenta",
    comingSoon: "Administre los detalles de su cuenta aquí (próximamente).",
    toastDismiss: "Cerrar notificación",
  },
  Swahili: {
    settings: "Mipangilio",
    appearance: "Muonekano",
    darkMode: "Hali ya giza",
    lightMode: "Hali ya mwanga",
    language: "Lugha",
    notifications: "Arifa",
    enableNotifications: "Washa arifa",
    account: "Akaunti",
    comingSoon: "Simamia maelezo ya akaunti yako hapa (itakuja hivi karibuni).",
    toastDismiss: "Funga taarifa",
  },
};

function Toast({
  message,
  onClose,
  darkMode,
}: {
  message: string;
  onClose: () => void;
  darkMode: boolean;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg font-semibold text-center text-sm max-w-sm w-full
        transition-opacity duration-300
        ${darkMode ? "bg-gray-800 text-yellow-300" : "bg-yellow-400 text-black"}
      `}
    >
      {message}
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className={`ml-4 font-bold focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-full
          ${darkMode ? "text-yellow-500 hover:text-yellow-300" : "text-black hover:text-gray-700"}
        `}
      >
        ✕
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("English");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedDark = localStorage.getItem("darkMode");
    const savedLang = localStorage.getItem("language");
    const savedNotif = localStorage.getItem("notificationsEnabled");

    if (savedDark !== null) setDarkMode(savedDark === "true");
    if (savedLang && languages.includes(savedLang)) setLanguage(savedLang);
    if (savedNotif !== null) setNotificationsEnabled(savedNotif === "true");
  }, []);

  // Save on change
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("notificationsEnabled", notificationsEnabled.toString());
  }, [notificationsEnabled]);

  const t = translations[language];

  const toggleDarkMode = useCallback(() => {
    setDarkMode((d) => {
      const newVal = !d;
      setToastMessage(newVal ? t.darkMode + " activated" : t.lightMode + " activated");
      return newVal;
    });
  }, [t]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
    setToastMessage(`Language changed to ${e.target.value}`);
  };

  const toggleNotifications = () => {
    setNotificationsEnabled((n) => {
      const newVal = !n;
      setToastMessage(newVal ? `${t.enableNotifications} ✅` : `${t.enableNotifications} ❌`);
      return newVal;
    });
  };

  return (
    <div
      className={`flex flex-col min-h-screen font-[Fredoka] transition-colors duration-500
        ${
          darkMode
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white"
            : "bg-gradient-to-br from-sky-100 via-yellow-100 to-pink-100 text-black"
        }
      `}
    >
      <Header />

      <main className="flex-grow p-6 max-w-5xl mx-auto space-y-10">
        <h1 className="text-4xl font-extrabold text-pink-500 select-none">{t.settings}</h1>

        {/* Appearance Section */}
        <section
          className={`bg-white rounded-3xl shadow-xl p-8 space-y-6
          ${darkMode ? "bg-gray-800" : "bg-white"}
          transition-colors duration-500
        `}
        >
          <h2 className="text-2xl font-bold text-blue-600 select-none">{t.appearance}</h2>

          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold select-none">{t.darkMode}</span>
            <button
              onClick={toggleDarkMode}
              className={`px-5 py-2 rounded-full font-bold transition
                ${
                  darkMode
                    ? "bg-yellow-400 text-black hover:bg-yellow-500"
                    : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                }
              `}
              aria-pressed={darkMode}
              aria-label="Toggle dark mode"
            >
              {darkMode ? t.lightMode : t.darkMode}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="language-select" className="text-lg font-semibold select-none">
              {t.language}
            </label>
            <select
              id="language-select"
              value={language}
              onChange={handleLanguageChange}
              className="border rounded-full p-2 font-bold cursor-pointer"
              aria-label="Select language"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Notifications Section */}
        <section
          className={`rounded-3xl shadow-xl p-8 space-y-6
            ${darkMode ? "bg-gray-800" : "bg-white"}
            transition-colors duration-500
          `}
        >
          <h2 className="text-2xl font-bold text-blue-600 select-none">{t.notifications}</h2>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold select-none">{t.enableNotifications}</span>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={toggleNotifications}
              className="w-6 h-6 cursor-pointer accent-pink-500"
              aria-checked={notificationsEnabled}
              aria-label="Toggle notifications"
            />
          </div>
        </section>

        {/* Account Section */}
        <section
          className={`rounded-3xl shadow-xl p-8 space-y-6
            ${darkMode ? "bg-gray-800" : "bg-white"}
            transition-colors duration-500
          `}
        >
          <h2 className="text-2xl font-bold text-blue-600 select-none">{t.account}</h2>
          <p className="text-gray-600 dark:text-gray-300 italic select-text">{t.comingSoon}</p>
        </section>
      </main>

      <Footer />
      <BottomNavigation />

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} darkMode={darkMode} />
      )}
    </div>
  );
}
