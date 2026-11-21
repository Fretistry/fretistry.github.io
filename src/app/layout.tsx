import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ServiceWorker } from "@/components/pwa/service-worker";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BASE_PATH, CREATOR, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, THEME_COLOR } from "@/lib/site";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Only the origin here: Next.js adds the sub-folder (base path) to file-based images itself,
  // so including it would double it (/fretistry/fretistry/opengraph-image.png).
  metadataBase: new URL(new URL(SITE_URL).origin),
  title: { default: SITE_TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // Web-app manifest (public/manifest.webmanifest): lets people install Fretistry as an app.
  // Its paths are relative, so it also works when the site lives in a sub-folder.
  manifest: `${BASE_PATH}/manifest.webmanifest`,
  authors: [{ name: CREATOR }],
  creator: CREATOR,
  publisher: CREATOR,
  keywords: [
    "guitar scales",
    "fretboard",
    "guitar theory",
    "CAGED",
    "pentatonic boxes",
    "chords in a key",
    "guitar modes",
    "learn guitar",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Fretistry — master the guitar fretboard",
    description: SITE_DESCRIPTION,
    url: `${BASE_PATH}/`,
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fretistry — master the guitar fretboard",
    description: SITE_DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <head>
        {/* Applies the saved light/dark preference before the first paint (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <TooltipProvider delayDuration={250}>{children}</TooltipProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
