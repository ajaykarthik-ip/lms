import "./globals.css";

export const metadata = {
  title: "Library Management System",
  description: "Manage books, borrowers and returns",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
