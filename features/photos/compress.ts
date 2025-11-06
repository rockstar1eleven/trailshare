import imageCompression from 'browser-image-compression';

export type CompressOpts = {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
};

export async function compressFile(file: File, opts: CompressOpts = {}) {
  const options: any = {
    maxSizeMB: opts.maxSizeMB ?? 0.6,
    maxWidthOrHeight: opts.maxWidthOrHeight ?? 1600,
    useWebWorker: opts.useWebWorker ?? true,
    initialQuality: 0.7
  };
  return imageCompression(file, options);
}
