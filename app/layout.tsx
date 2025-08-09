import "./globals.css";
import { LanguageProvider}  from "@/contexts/LanguageContext";
import { NimiReaderProvider } from "@/contexts/NimiReaderContext";
import { UserProvider } from "@/contexts/UserContext"; // import your UserProvider
import NimiReaderButton from "@/components/NimiReaderButton";

export const metadata = {
  title: "Your Site",
  description: "Your description",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <LanguageProvider>
            <NimiReaderProvider>
              {children}
              <NimiReaderButton />
            </NimiReaderProvider>
          </LanguageProvider>
        </UserProvider>
      </body>
    </html>
  );
}