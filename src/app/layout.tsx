import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "晨星共行 | 聖經恢復本與生命讀經共行追求平台",
  description: "與清心呼求主的同伴一同追求聖經恢復本、生命讀經與職事信息，每日打卡、摸著分享、彼此激勵同聲阿們。",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "晨星共行",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f59e0b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var u = sessionStorage.getItem('morningstar_current_user') || localStorage.getItem('morningstar_current_user');
                  if (u) {
                    var parsed = JSON.parse(u);
                    if (parsed && parsed.displayMode === 'dark') {
                      document.documentElement.classList.add('theme-dark', 'dark');
                    } else if (parsed && parsed.displayMode === 'warm') {
                      document.documentElement.classList.add('theme-warm');
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased selection:bg-amber-100 selection:text-amber-900">
        {children}
      </body>
    </html>
  );
}
