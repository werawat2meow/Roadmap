const GENERAL_DOCUMENT_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "application/pdf",
  "video/mp4",
];

const ID_CARD_IMAGE_MIME_TYPES = ["image/png", "image/jpeg"];

export function documentAccept(documentType) {
  return documentType === "id_card"
    ? ".png,.jpg,.jpeg"
    : ".png,.jpg,.jpeg,.pdf,.mp4";
}

export function isAllowedDocumentUpload(documentType, mimeType) {
  const allowedTypes =
    documentType === "id_card"
      ? ID_CARD_IMAGE_MIME_TYPES
      : GENERAL_DOCUMENT_MIME_TYPES;
  return allowedTypes.includes(mimeType);
}

export function isIdCardImageMimeType(mimeType) {
  return ID_CARD_IMAGE_MIME_TYPES.includes(mimeType);
}

export function resolveIdCardPhotoUrl(document) {
  const fileUrl = document?.file_url?.trim();
  if (!fileUrl) return null;

  const fileName = document?.file_name?.trim().toLowerCase() || "";
  return fileName.endsWith(".pdf") ? null : fileUrl;
}
