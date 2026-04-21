export default function manifest() {
  return {
    name: "Employee Master",
    short_name: "Employee Master",
    description: "Employee Master System",
    start_url: "/login",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.jpg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        src: "/icons/icon-512.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  };
}