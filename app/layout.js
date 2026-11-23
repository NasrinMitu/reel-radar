import "./globals.css";

export const metadata = {
  title: "Reel Radar — Find what you love",
  description: "Personalized movie and TV alerts, tuned to your taste.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
