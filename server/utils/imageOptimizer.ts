import { execFileSync } from 'child_process';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

const MAX_BASE64_IMAGE_CHARS = 65 * 1024; // ~48 KB binary image threshold

export function optimizeBase64ImageString(dataUri: string, maxDim = 256): string {
  if (
    typeof dataUri !== 'string' ||
    dataUri.length <= MAX_BASE64_IMAGE_CHARS ||
    !dataUri.startsWith('data:image/') ||
    dataUri.startsWith('data:image/svg')
  ) {
    return dataUri;
  }

  const match = dataUri.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return dataUri;

  const mime = match[1].toLowerCase();
  const base64Data = match[2];
  const uid = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const ext = mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png';
  const inFile = `/tmp/img_in_${uid}.${ext}`;
  const outFile = `/tmp/img_out_${uid}.${ext}`;

  try {
    fs.writeFileSync(inFile, Buffer.from(base64Data, 'base64'));
    if (ext === 'jpg') {
      execFileSync('convert', [
        inFile,
        '-resize',
        `${maxDim}x${maxDim}>`,
        '-strip',
        '-quality',
        '78',
        outFile,
      ]);
      const outBuf = fs.readFileSync(outFile);
      return `data:image/jpeg;base64,${outBuf.toString('base64')}`;
    } else {
      execFileSync('convert', [
        inFile,
        '-resize',
        `${maxDim}x${maxDim}>`,
        '-strip',
        '-depth',
        '8',
        '-colors',
        '256',
        outFile,
      ]);
      const outBuf = fs.readFileSync(outFile);
      return `data:image/png;base64,${outBuf.toString('base64')}`;
    }
  } catch {
    return dataUri;
  } finally {
    try {
      if (fs.existsSync(inFile)) fs.unlinkSync(inFile);
    } catch {
      // ignore
    }
    try {
      if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
    } catch {
      // ignore
    }
  }
}

function optimizeObjectImagesRecursively(obj: any, depth = 0): any {
  if (depth > 4 || !obj) return obj;
  if (typeof obj === 'string') {
    return optimizeBase64ImageString(obj, 280);
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = optimizeObjectImagesRecursively(obj[i], depth + 1);
    }
    return obj;
  }
  if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'string' && val.length > MAX_BASE64_IMAGE_CHARS && val.startsWith('data:image/')) {
        const maxDim =
          key === 'avatar' || key === 'foto' || key === 'escudoUrl' ? 240 : 480;
        obj[key] = optimizeBase64ImageString(val, maxDim);
      } else if (val && typeof val === 'object') {
        obj[key] = optimizeObjectImagesRecursively(val, depth + 1);
      }
    }
  }
  return obj;
}

export function autoOptimizeUploadedImagesMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if ((req.method === 'POST' || req.method === 'PUT') && req.body && typeof req.body === 'object') {
    try {
      optimizeObjectImagesRecursively(req.body);
    } catch {
      // continue safely
    }
  }
  next();
}
