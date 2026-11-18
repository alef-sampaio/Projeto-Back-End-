const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const AppError = require('./AppError');

// Pasta onde as imagens são gravadas (servida em /media)
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'uploads');
const EXTENSIONS = { 'image/png': 'png', 'image/jpg': 'jpg', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };

// Grava uma imagem em base64 e devolve o caminho relativo (ex.: products/uuid.png)
async function saveBase64Image({ type, content }) {
  const ext = EXTENSIONS[type];
  if (!ext) throw new AppError(400, 'Tipo de imagem inválido');

  const base64 = String(content).replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length === 0) throw new AppError(400, 'Conteúdo da imagem inválido');

  const relative = `products/${crypto.randomUUID()}.${ext}`;
  const full = path.join(UPLOAD_DIR, relative);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buffer);
  return relative;
}

// Remove o arquivo (ignora se ele não existir)
async function deleteImageFile(relative) {
  try {
    await fs.unlink(path.join(UPLOAD_DIR, relative));
  } catch (_) {
    /* arquivo já removido */
  }
}

const imageUrl = (baseUrl, relative) => `${baseUrl}/media/${relative}`;

module.exports = { UPLOAD_DIR, EXTENSIONS, saveBase64Image, deleteImageFile, imageUrl };
