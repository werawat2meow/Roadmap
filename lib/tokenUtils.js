import crypto from "crypto";

export function generateApiToken() {
  const prefixRandom = crypto.randomBytes(4).toString("hex");
  const secretRandom = crypto.randomBytes(24).toString("hex");

  const tokenPrefix = `em_live_${prefixRandom}`;
  const plainToken = `${tokenPrefix}_${secretRandom}`;
  const tokenHash = sha256(plainToken);

  return {
    plainToken,
    tokenPrefix,
    tokenHash,
  };
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}