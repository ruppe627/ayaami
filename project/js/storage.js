import { repositories } from "./repositories.js?v=2";

export const StorageService = {
  async saveFile(file) {
    const record = await repositories.blobs.save({
      blob: file,
      file_name: file.name,
      mime_type: file.type || "application/octet-stream",
      size: file.size,
    });
    return record.id;
  },

  async getFile(blobKey) {
    if (!blobKey) return null;
    return repositories.blobs.get(blobKey);
  },

  async deleteFile(blobKey) {
    if (!blobKey) return;
    await repositories.blobs.delete(blobKey);
  },

  async objectUrl(blobKey) {
    const record = await this.getFile(blobKey);
    if (!record?.blob) return "";
    return URL.createObjectURL(record.blob);
  },
};
