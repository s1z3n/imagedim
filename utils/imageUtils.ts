export const imageToBase64 = (image: HTMLImageElement): { data: string; mimeType: string } => {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  ctx.drawImage(image, 0, 0);
  
  // Use JPEG for potentially smaller size, suitable for AI vision models
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9); 
  
  const parts = dataUrl.split(',');
  if (parts.length < 2) throw new Error('Invalid data URL');
  
  const mimeType = parts[0].split(':')[1].split(';')[0];
  const data = parts[1];
  
  return { data, mimeType };
};
