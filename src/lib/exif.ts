import exifr from "exifr";

/** Read the EXIF capture date (DateTimeOriginal) from an image, if present. */
export async function readTakenAt(file: File): Promise<string | null> {
  try {
    const data = await exifr.parse(file, ["DateTimeOriginal", "CreateDate"]);
    const d: Date | undefined = data?.DateTimeOriginal ?? data?.CreateDate;
    return d ? new Date(d).toISOString() : null;
  } catch {
    return null;
  }
}
