
# FamilyBridge Photos: Features & Code Breakdown

### Application Overview

**Name:** FamilyBridge Photos
**Description:** An elder-friendly, private, self-hosted photo-sharing web application inspired by Google Photos. It emphasizes simplicity, accessibility, and a user-friendly interface with a dark theme and large text. All file processing and storage are handled client-side in the browser.
**Core Technologies:**
*   **Framework:** React 18 with TypeScript
*   **Styling:** Tailwind CSS
*   **Mapping:** Leaflet.js, React Leaflet, Leaflet.markercluster, leaflet-geosearch
*   **Metadata:** `exifreader` for client-side EXIF data parsing.

---

### 1. Core App Structure & State Management

The application is a single-page app (SPA) with a central state management system in the `App.tsx` component.

**Key Components:**
*   `App.tsx`: The root component that holds all primary state (files, albums, sharing status, etc.) and passes data and callbacks down to child components.
*   `MainNavigation.tsx`: The primary tab-based navigation for switching between major views (`PHOTOS`, `ALBUMS`, `SHARING`).

**Important Code: State Management in `App.tsx`**
The application's state is managed using React's `useState` hooks. There is no external state management library like Redux.

```typescript
// App.tsx
export default function App() {
  // Core data stores
  const [files, setFiles] = useState<File[]>([]);
  const [albums, setAlbums] = useState<Map<string, Set<File>>>(new Map());
  
  // Custom metadata stores
  const [customLocations, setCustomLocations] = useState<Map<string, { latitude: number; longitude: number }>>(new Map());
  const [customTags, setCustomTags] = useState<Map<string, string[]>>(new Map());

  // UI State
  const [mainView, setMainView] = useState<MainView>('PHOTOS');
  const [viewingAlbumName, setViewingAlbumName] = useState<string | null>(null);

  // Slideshow State
  const [slideshowFiles, setSlideshowFiles] = useState<File[] | null>(null);

  // Sharing Flow State
  const [isSharing, setIsSharing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [filesToShare, setFilesToShare] = useState<File[]>([]);
  const [sharingHistory, setSharingHistory] = useState<SharedDetails[]>([]);

  // Upload Flow State
  const [isUploading, setIsUploading] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // ... rest of the component with handler functions
}
```

---

### 2. File Management & Upload

Files can be added via a file input, the device camera, or drag-and-drop. The upload process is simulated with a detailed progress screen.

**Key Components:**
*   `App.tsx`: Handles drag-and-drop event listeners attached to the `window`.
*   `FileUploadScreen.tsx`: A dedicated screen that shows the progress of each file being "uploaded" (processed). It includes pause, resume, and cancel functionality.
*   `DragDropOverlay.tsx`: A full-screen overlay that appears when a user drags files over the window.

**Important Code: Drag-and-Drop Logic in `App.tsx`**

```typescript
// App.tsx
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDraggingOver(false);
    }
  }, []);
  
  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounter.current = 0;
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    // ... other listeners
  }, [/* ... */]);
```

---

### 3. Gallery View

The main view for browsing all photos and videos. It features a responsive grid, filtering, sorting, and multi-select capabilities.

**Key Components:**
*   `GalleryScreen.tsx`: The container component for the gallery. It manages all filtering/sorting state and renders either the grid or map view.
*   `FileList.tsx`: Renders the grid of photos (`PhotoGridItem`). It includes a hover-to-preview-and-zoom feature for images.

**Important Code: Filtering and Sorting Logic in `GalleryScreen.tsx`**
The `processedFiles` memoized value contains all the logic for filtering and sorting the files based on user input.

```typescript
// components/GalleryScreen.tsx
const processedFiles = useMemo(() => {
    const filtered = files.filter(file => {
      // 1. Filter by File Type (image, video, etc.)
      const typeMatch = fileTypeFilter === 'all' || getFileTypeCategory(file) === fileTypeFilter;
      
      // 2. Filter by Search Term (checks name, tags, metadata)
      const searchTermLower = searchTerm.toLowerCase();
      const searchMatch = /* ... logic to check file name, keywords, metadata ... */;
      
      // 3. Filter by Geolocation
      const locationMatch = !filterByLocation || !!metadata?.gps || !!customLocation;

      // 4. Filter by Date Range
      const dateMatch = /* ... logic to check if file date is within dateRange ... */;

      return typeMatch && searchMatch && locationMatch && dateMatch;
    });

    // 5. Sort the filtered results
    const sortable: File[] = [...filtered];
    switch (sortCriteria) {
        case 'datetaken-desc': sortable.sort(/* ... */); break;
        case 'date-asc': sortable.sort((a, b) => a.lastModified - b.lastModified); break;
        // ... other sort cases
    }
    return sortable;
}, [files, searchTerm, fileTypeFilter, sortCriteria, /* ... other dependencies */]);
```

---

### 4. Map View (Geolocation)

Displays geotagged photos on an interactive Leaflet map.

**Key Components:**
*   `MapView.tsx`: The main map component. It handles marker rendering, clustering, popups, and user interaction.
*   `GalleryScreen.tsx`: Switches to this view and passes the photo points.

**Important Code: Marker Clustering and Popups in `MapView.tsx`**
The component uses `react-leaflet-cluster` to group nearby markers. It provides a custom function (`iconCreateFunction`) to style clusters based on photo density (Heatmap mode) or simple count (Standard mode). It also renders a custom, interactive `Popup` component.

```typescript
// components/MapView.tsx

// Main map rendering
<MarkerClusterGroup 
    iconCreateFunction={isHeatmapMode ? createHeatmapClusterIcon : createStandardClusterIcon}
    // ... other options
>
    {photoPoints.map(({ file, position, exif }) => (
    <Marker position={position} key={file.name + file.lastModified} {...{file, exif} as any}>
        <Popup>
            <MarkerPopupContent 
                file={file}
                exif={exif}
                onViewDetails={onViewDetails}
                handleDownloadFile={handleDownloadFile}
                // ... other props
            />
        </Popup>
    </Marker>
    ))}
</MarkerClusterGroup>

// Custom cluster icon logic
const createHeatmapClusterIcon = (cluster: any) => {
    const photoCount = cluster.getAllChildMarkers().length;
    // ... logic to calculate photo density (photos per day)
    const density = photoCount / uniqueDateCount;
    // ... logic to determine color and size based on density and count
    const html = `<div style="..."><span ...>${photoCount}</span></div>`;
    return new L.DivIcon({ html, ... });
};

// Cluster click logic to show a modal with files
const handleClusterClick = (cluster: any) => {
    setClusterPreview(cluster.getAllChildMarkers().map((m: any) => m.options.file));
};
```

---

### 5. File Details & Metadata

Users can view detailed information for each file, including EXIF metadata for images.

**Key Components:**
*   `PhotoDetailScreen.tsx`: A dedicated screen to show a large preview of the file and all its associated data. Users can add tags and manually set a location here.
*   `utils/fileUtils.ts`: Contains the `extractPhotoMetadata` function.
*   `LocationPickerModal.tsx`: A modal that allows users to drop a pin on a map to add GPS data to a photo.

**Important Code: EXIF Data Extraction in `fileUtils.ts`**
This function runs entirely in the browser to read metadata from image files without needing a server.

```typescript
// utils/fileUtils.ts
import ExifReader from 'exifreader';

export const extractPhotoMetadata = async (file: File): Promise<PhotoMetadata> => {
  if (!file.type.startsWith('image/')) return {};
  try {
    const tags = await ExifReader.load(file);
    
    // Destructure desired tags
    const { Make, Model, DateTimeOriginal, GPSLatitude, /* ... */ } = tags;

    const metadata: PhotoMetadata = {
      dateTaken: parseDateTaken(tags), // Custom parser for date format
      gps: parseGps(tags),             // Custom parser for GPS coordinates
      cameraMake: Make?.description,
      cameraModel: Model?.description,
      // ... other metadata fields
    };
    return metadata;
  } catch (error) {
    return {}; // Fail silently
  }
};
```

---

### 6. Sharing Functionality

A modal-based flow allows users to "send" files by entering recipient/sender emails and an optional message. The history of these shares is tracked.

**Key Components:**
*   `App.tsx`: Manages the state for the sharing flow (`isSharing`, `isSuccess`, `sharingHistory`).
*   `ShareScreen.tsx`: The form where users input email addresses and a message.
*   `SuccessScreen.tsx`: A confirmation screen shown after a successful share.
*   `SharingHistoryScreen.tsx`: The "Sharing" tab, which lists all past shares.

---

### 7. Album Management

Users can create albums and add photos to them, providing a way to organize their collections.

**Key Components:**
*   `App.tsx`: Manages the `albums` state, which is a `Map<string, Set<File>>`.
*   `AlbumListScreen.tsx`: The "Albums" tab, which displays all created albums and a form to create new ones.
*   `AddToAlbumModal.tsx`: A modal that appears when a user wants to add selected photos to an existing album or create a new one on the fly.

**Important Code: Album Data Structure in `App.tsx`**

```typescript
// App.tsx

// The core data structure for albums
const [albums, setAlbums] = useState<Map<string, Set<File>>>(new Map());

// Function to add files to an album
const handleAddToAlbum = (albumName: string, filesToAdd: File[]) => {
    setAlbums(prev => {
        const newAlbums = new Map<string, Set<File>>(prev);
        const existingSet = newAlbums.get(albumName) || new Set<File>();
        filesToAdd.forEach(file => existingSet.add(file));
        newAlbums.set(albumName, existingSet);
        return newAlbums;
    });
};
```

---

### 8. Special Features

**A. Slideshow**
*   **Description:** A full-screen, auto-playing slideshow of selected photos and videos with customizable speed.
*   **Key Component:** `Slideshow.tsx`
*   **Logic:** It's a portal-based component that overlays the entire UI. It uses `setTimeout` for image transitions and listens for the `onEnded` event on video elements to advance automatically.

**B. Memories**
*   **Description:** A feature that finds photos taken on the current day in previous years.
*   **Key Components:** `GalleryScreen.tsx` (contains the discovery logic), `MemoryViewerModal.tsx` (displays the found memory).
*   **Logic:**
    ```typescript
    // components/GalleryScreen.tsx
    const handleFindMemories = () => {
        const today = new Date();
        const memoriesByDate = new Map();

        files.forEach(file => {
            const dateTaken = metadataCache.get(file)?.dateTaken;
            if (dateTaken) {
                // Check if month and day match today, but year is in the past
                if (dateTaken.getMonth() === today.getMonth() && 
                    dateTaken.getDate() === today.getDate() && 
                    dateTaken.getFullYear() < today.getFullYear()) {
                    // Group files by date
                    // ...
                }
            }
        });
        // Find the most recent memory and display it in the modal
        setMemory(mostRecentMemory);
    };
    ```

---

### 9. UI/UX & Accessibility

The application is designed to be intuitive and accessible.

*   **Large UI Elements:** Buttons, text, and navigation are oversized for easy reading and interaction.
*   **Dark Theme:** Reduces eye strain.
*   **Keyboard Navigation:** Full keyboard accessibility is implemented across all components.
    *   The photo grid (`FileList.tsx`) can be navigated with arrow keys.
    *   Map markers and clusters (`MapView.tsx`) are focusable (`tabindex="0"`) and can be activated with Enter/Space.
    *   All modals (`ConfirmationModal`, `LocationPickerModal`, etc.) implement a focus trap to keep keyboard focus within the modal.
*   **ARIA Attributes:** Correct ARIA roles, states (`aria-checked`, `aria-current`), and labels (`aria-label`) are used throughout to ensure compatibility with screen readers.
*   **Custom Video Player (`PhotoDetailScreen.tsx`):** The custom video player is fully accessible, with keyboard controls for play/pause, volume, and seeking.

