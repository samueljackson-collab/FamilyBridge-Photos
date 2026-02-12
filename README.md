
# FamilyBridge Photos

> An elder-friendly, private photo-sharing web application inspired by Google Photos.

FamilyBridge Photos is a self-hosted web application designed with simplicity and accessibility at its core. It provides a straightforward way for families to share and organize their memories, with a special focus on being user-friendly for older adults. The interface features a dark theme, large text, and intuitive controls to ensure a comfortable and frustration-free experience.

## ✨ Key Features

- **🖼️ Rich Media Gallery:** View photos and videos in a beautiful, responsive grid with advanced sorting and filtering options.
- **🗺️ Interactive Map View:** Explore your photos geographically on a world map. Geotagged photos are automatically clustered by location and density, providing a "heatmap" of your travels.
- **🔍 Detailed Information:** View detailed EXIF metadata for your photos, including camera settings, date taken, and location. You can also add custom tags and manually set locations for photos without GPS data.
- **📤 Simple Upload:** Easily add photos by clicking the "Add Files" button, using your device camera, or simply dragging and dropping files anywhere onto the window.
- **✉️ Easy Sharing:** Select one or more files and share them with a personal message. A history of shared batches is kept for your reference.
- **♿ Accessibility First:** Designed for everyone, with full keyboard navigation, ARIA-compliant components, and accessible custom controls for all features.
- **🔒 Private & Self-Hosted:** All your files are managed within the application in your browser, giving you full control over your data without uploading to a third-party cloud.

## 💻 Technology Stack

This project is built with modern, browser-native technologies and requires no server-side build process.

- **UI Framework:** [React](https://reactjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Mapping:** [Leaflet.js](https://leafletjs.com/) with [React Leaflet](https://react-leaflet.js.org/)
- **Map Features:**
    - [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) for grouping photo markers.
    - [leaflet-geosearch](https://github.com/smeijer/leaflet-geosearch) for address lookup.
- **Photo Metadata:** [exifreader](https://github.com/mattiasw/ExifReader) for parsing EXIF data directly in the browser.

## 🚀 How to Use

1.  **Add Your Photos:** Click the **Add Files** button or drag and drop your photos/videos anywhere on the screen.
2.  **Explore Your Gallery:** Browse your memories in the main **Photos** tab. Use the toolbar to search, filter, and sort your files.
3.  **Switch Views:** Toggle between the **Grid** view and the **Map** view to see your collection in different ways.
4.  **View Details:** Click on any photo or video to see a detailed view with all available information, add tags, or set a location.
5.  **Manage Files:** In the gallery, click the checkbox on an item to select it. A toolbar will appear allowing you to **Share**, **Download**, or **Delete** your selected files.

## Accessibility Commitment

This application was built with a strong emphasis on accessibility to ensure it can be used by everyone, regardless of ability. Key accessibility features include:

-   **Full Keyboard Navigation:** All interactive elements, including the photo grid, map markers, popups, and modals, are navigable and operable using only a keyboard.
-   **Accessible Video Player:** The custom video player includes fully keyboard-operable controls for play/pause, volume, and seeking (using arrow keys).
-   **Screen Reader Support:** Proper use of ARIA attributes, semantic HTML, and focus management ensures a coherent experience for screen reader users.
-   **Visible Focus States:** Clear and consistent focus indicators help users track their position on the page at all times.
