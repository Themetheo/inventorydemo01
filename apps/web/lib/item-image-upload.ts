type ImageUrlSetter = (
  name: "imageUrl",
  value: string,
  options: { shouldDirty: boolean; shouldValidate: boolean },
) => void;

const MAX_UPLOAD_BYTES = 500 * 1024;
const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_HEIGHT = 600;
const WEBP_QUALITIES = [0.82, 0.74, 0.66, 0.58, 0.55] as const;

export type CompressedItemImage = {
  file: File;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
};

export type ItemImageProcessor = {
  width: number;
  height: number;
  encode: (width: number, height: number, quality: number) => Promise<Blob>;
  dispose?: () => void;
};

type ItemImageProcessorFactory = (file: File) => Promise<ItemImageProcessor>;

export function applyUploadedItemImage(setValue: ImageUrlSetter, uploaded: { imageUrl: string }) {
  setValue("imageUrl", uploaded.imageUrl, {
    shouldDirty: true,
    shouldValidate: true,
  });
}

export function formatImageFileSize(size: number): string {
  return `${(size / 1024).toFixed(size < 10 * 1024 ? 1 : 0)} KB`;
}

export function containedImageDimensions(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("Invalid image dimensions");
  }
  const scale = Math.min(1, MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function compressedWebpFilename(originalName: string): string {
  const stem = originalName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${stem || "item-image"}.webp`;
}

export async function compressItemImage(
  originalFile: File,
  createProcessor: ItemImageProcessorFactory = createBrowserImageProcessor,
): Promise<CompressedItemImage> {
  const processor = await createProcessor(originalFile);
  try {
    let { width, height } = containedImageDimensions(processor.width, processor.height);
    let compressed: Blob | undefined;

    for (const quality of WEBP_QUALITIES) {
      compressed = await processor.encode(width, height, quality);
      if (compressed.type !== "image/webp") throw new Error("WebP encoding is not supported");
      if (compressed.size <= MAX_UPLOAD_BYTES) return compressionResult(originalFile, compressed, width, height);
    }

    while (width > 1 || height > 1) {
      const nextWidth = Math.max(1, Math.floor(width * 0.9));
      const nextHeight = Math.max(1, Math.floor(height * 0.9));
      if (nextWidth === width && nextHeight === height) break;
      width = nextWidth;
      height = nextHeight;
      compressed = await processor.encode(width, height, 0.55);
      if (compressed.type !== "image/webp") throw new Error("WebP encoding is not supported");
      if (compressed.size <= MAX_UPLOAD_BYTES) return compressionResult(originalFile, compressed, width, height);
    }

    throw new Error("Compressed image is still too large");
  } finally {
    processor.dispose?.();
  }
}

function compressionResult(originalFile: File, blob: Blob, width: number, height: number): CompressedItemImage {
  const file = new File([blob], compressedWebpFilename(originalFile.name), {
    type: "image/webp",
    lastModified: Date.now(),
  });
  return {
    file,
    originalSize: originalFile.size,
    compressedSize: file.size,
    width,
    height,
  };
}

async function createBrowserImageProcessor(file: File): Promise<ItemImageProcessor> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return canvasProcessor(bitmap, bitmap.width, bitmap.height, () => bitmap.close());
    } catch {
      // Fall through for browsers that expose createImageBitmap but cannot decode this source.
    }
  }

  const image = await loadHtmlImage(file);
  return canvasProcessor(image, image.naturalWidth, image.naturalHeight);
}

function canvasProcessor(source: CanvasImageSource, width: number, height: number, dispose?: () => void): ItemImageProcessor {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available");
  return {
    width,
    height,
    dispose,
    encode: (targetWidth, targetHeight, quality) => new Promise<Blob>((resolve, reject) => {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      context.clearRect(0, 0, targetWidth, targetHeight);
      context.drawImage(source, 0, 0, targetWidth, targetHeight);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Image encoding failed"));
      }, "image/webp", quality);
    }),
  };
}

function loadHtmlImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image decoding failed"));
    };
    image.src = objectUrl;
  });
}
