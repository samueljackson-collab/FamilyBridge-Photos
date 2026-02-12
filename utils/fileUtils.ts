
import ExifReader, { Tags } from 'exifreader';

export type FileType = 'image' | 'video' | 'pdf' | 'other';

export interface PhotoMetadata {
  dateTaken?: Date;
  gps?: { latitude: number; longitude: number };
  gpsDate?: Date;
  cameraModel?: string;
  cameraMake?: string;
  lensModel?: string;
  dimensions?: { width: number; height: number };
  iso?: string;
  exposureTime?: string;
  fNumber?: string;
  description?: string;
  keywords?: string[];
}

export const getFileTypeCategory = (file: File): FileType => {
  const type = file.type;
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type === 'application/pdf') return 'pdf';
  return 'other';
};

export const getFileIcon = (file: File): string => {
  const category = getFileTypeCategory(file);
  switch(category) {
    case 'image':
      return 'fas fa-file-image';
    case 'video':
      return 'fas fa-file-video';
    case 'pdf':
      return 'fas fa-file-pdf';
    default:
      return 'fas fa-file';
  }
};

const parseGps = (tags: Tags): { latitude: number; longitude: number } | undefined => {
  try {
    const latValue = tags.GPSLatitude?.value as number[];
    const latRef = tags.GPSLatitudeRef?.value[0] as string;
    const lonValue = tags.GPSLongitude?.value as number[];
    const lonRef = tags.GPSLongitudeRef?.value[0] as string;

    if (!latValue || !latRef || !lonValue || !lonRef) return undefined;

    let decLat = latValue[0] + latValue[1] / 60 + latValue[2] / 3600;
    if (latRef === 'S') decLat = -decLat;

    let decLon = lonValue[0] + lonValue[1] / 60 + lonValue[2] / 3600;
    if (lonRef === 'W') decLon = -decLon;

    if (isNaN(decLat) || isNaN(decLon)) return undefined;

    return { latitude: decLat, longitude: decLon };
  } catch {
    return undefined;
  }
};

const parseDateTaken = (tags: Tags): Date | undefined => {
    const dateTimeOriginal = tags.DateTimeOriginal?.description;
    if (dateTimeOriginal) {
        try {
            // Format is "YYYY:MM:DD HH:MM:SS"
            const [datePart, timePart] = dateTimeOriginal.split(' ');
            if (datePart && timePart) {
                const isoString = `${datePart.replace(/:/g, '-')}T${timePart}`;
                const date = new Date(isoString);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        } catch {}
    }
    return undefined;
};

const parseGpsDate = (tags: Tags): Date | undefined => {
  const gpsDate = tags.GPSDateStamp?.description;
  const gpsTime = tags.GPSTimeStamp?.description;
  if (gpsDate && gpsTime) {
      try {
          // GPS time is in UTC. Format it as an ISO string.
          const isoString = `${gpsDate.replace(/:/g, '-')}T${gpsTime}Z`;
          const dateObj = new Date(isoString);
          if (!isNaN(dateObj.getTime())) {
              return dateObj;
          }
      } catch {}
  }
  return undefined;
};

export const extractPhotoMetadata = async (file: File): Promise<PhotoMetadata> => {
  if (!file.type.startsWith('image/')) {
    return {};
  }
  try {
    const tags = await ExifReader.load(file);
    
    const { Make, Model, LensModel, ImageWidth, ImageHeight, ISOSpeedRatings, ExposureTime, FNumber, ImageDescription, XPKeywords, Keywords } = tags;
    
    // Combine both standard IPTC and Windows-specific keywords for better coverage.
    const xpKeywordsString = XPKeywords?.description;
    const iptcKeywords = Keywords?.value;
    const allKeywords = new Set<string>();

    if (typeof xpKeywordsString === 'string') {
        xpKeywordsString.split(';').map(k => k.trim()).filter(Boolean).forEach(k => allKeywords.add(k));
    }
    if (typeof iptcKeywords === 'string') {
        allKeywords.add(iptcKeywords.trim());
    } else if (Array.isArray(iptcKeywords)) {
        iptcKeywords.map(k => String(k).trim()).filter(Boolean).forEach(k => allKeywords.add(k));
    }
    const keywords = Array.from(allKeywords);

    const metadata: PhotoMetadata = {
      dateTaken: parseDateTaken(tags),
      gps: parseGps(tags),
      gpsDate: parseGpsDate(tags),
      cameraMake: Make?.description,
      cameraModel: Model?.description,
      lensModel: LensModel?.description,
      dimensions: (ImageWidth?.value?.[0] && ImageHeight?.value?.[0]) 
          ? { width: ImageWidth.value[0], height: ImageHeight.value[0] } 
          : undefined,
      iso: ISOSpeedRatings?.description,
      exposureTime: ExposureTime?.description,
      fNumber: FNumber?.description,
      description: ImageDescription?.description,
      keywords: keywords.length > 0 ? keywords : undefined,
    };
    return metadata;
  } catch (error) {
    // Could not read EXIF data. Fail silently in production.
    return {};
  }
};
