// Read an image File, center-crop it to a square, downscale to `size`px, and
// return a compact JPEG data URL. The white fill prevents transparent artwork
// from turning black when it is converted to JPEG.
export function fileToSquareImageDataUrl(file, size = 256, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image file'));
    };
    img.src = url;
  });
}

// Member photos are smaller in the UI and can use the original storage size.
export function fileToAvatarDataUrl(file, size = 256) {
  return fileToSquareImageDataUrl(file, size);
}

// Task pictures render at 75px. Storing twice that resolution keeps them crisp
// on a high-density tablet screen without retaining a full camera-sized photo.
export function fileToTaskImageDataUrl(file) {
  return fileToSquareImageDataUrl(file, 150, 0.82);
}
