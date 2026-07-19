// SERVER-SIDE DEVELOPMENT CODE ONLY

import { createReadStream } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import Busboy from "busboy";
import { fileTypeFromBuffer } from "file-type";
import type { IncomingMessage, ServerResponse } from "node:http";
import type {
  LocalPortalConfig,
  ParsedMultipartFile,
  ParsedMultipartForm,
  StoredUpload
} from "./local-portal.types";

export type UploadCategory = "applicant-photos" | "payment-proofs" | "payment-qr-codes";

const acceptedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const extensionByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};
const mimeTypeByExtension: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

function assertConfigured(config: LocalPortalConfig): asserts config is Extract<LocalPortalConfig, { state: "configured" }> {
  if (config.state !== "configured") {
    throw new Error("LOCAL_PORTAL_NOT_CONFIGURED");
  }
}

function isPathInside(base: string, target: string): boolean {
  return target === base || target.startsWith(`${base}${sep}`);
}

export function parseMultipartForm(
  request: IncomingMessage,
  params: {
    maxFileBytes: number;
    maxTotalBytes?: number;
  }
): Promise<ParsedMultipartForm> {
  return new Promise((resolveForm, reject) => {
    const fields = new Map<string, string>();
    const files = new Map<string, ParsedMultipartFile>();
    const parser = Busboy({
      headers: request.headers,
      limits: {
        fileSize: params.maxFileBytes,
        files: 8,
        fields: 80,
        parts: 100
      }
    });
    let totalBytes = 0;
    let failed = false;

    parser.on("field", (name, value) => {
      fields.set(name, value);
    });
    parser.on("file", (fieldName, file, info) => {
      const chunks: Buffer[] = [];
      let fileBytes = 0;

      file.on("data", (chunk: Buffer) => {
        fileBytes += chunk.length;
        totalBytes += chunk.length;

        if (params.maxTotalBytes && totalBytes > params.maxTotalBytes) {
          failed = true;
          reject(new Error("REQUEST_BODY_TOO_LARGE"));
          file.resume();
          return;
        }

        chunks.push(chunk);
      });
      file.on("limit", () => {
        failed = true;
        reject(new Error("FILE_TOO_LARGE"));
      });
      file.on("end", () => {
        if (failed) {
          return;
        }

        files.set(fieldName, {
          buffer: Buffer.concat(chunks, fileBytes),
          declaredMimeType: info.mimeType,
          fieldName,
          originalFilename: info.filename || null
        });
      });
    });
    parser.on("error", reject);
    parser.on("finish", () => {
      if (!failed) {
        resolveForm({
          fields,
          files
        });
      }
    });
    request.pipe(parser);
  });
}

export async function validateAndStoreImage(params: {
  config: LocalPortalConfig;
  file: ParsedMultipartFile | undefined;
  category: UploadCategory;
  maxBytes: number;
}): Promise<StoredUpload> {
  assertConfigured(params.config);

  if (!params.file || params.file.buffer.length === 0) {
    throw new Error("INVALID_FILE");
  }

  if (params.file.buffer.length > params.maxBytes) {
    throw new Error("FILE_TOO_LARGE");
  }

  if (!acceptedImageMimeTypes.has(params.file.declaredMimeType)) {
    throw new Error("INVALID_FILE");
  }

  const detected = await fileTypeFromBuffer(params.file.buffer);

  if (!detected || !acceptedImageMimeTypes.has(detected.mime)) {
    throw new Error("INVALID_FILE");
  }

  if (detected.mime !== params.file.declaredMimeType) {
    throw new Error("INVALID_FILE");
  }

  const extension = extensionByMimeType[detected.mime];

  if (!extension) {
    throw new Error("INVALID_FILE");
  }

  const fileName = `${crypto.randomUUID()}.${extension}`;
  const directory = resolve(params.config.uploadsDirectory, params.category);
  const absolutePath = resolve(directory, fileName);

  if (!isPathInside(directory, absolutePath)) {
    throw new Error("INVALID_FILE");
  }

  await mkdir(directory, { recursive: true });
  await writeFile(absolutePath, params.file.buffer, {
    flag: "wx"
  });

  return {
    absolutePath,
    mimeType: detected.mime,
    relativePath: `${params.category}/${fileName}`,
    sizeBytes: params.file.buffer.length
  };
}

export async function removeStoredUpload(config: LocalPortalConfig, relativePath: string | null): Promise<void> {
  if (config.state !== "configured" || !relativePath) {
    return;
  }

  const absolutePath = getUploadAbsolutePath(config, relativePath);

  if (!absolutePath) {
    return;
  }

  await rm(absolutePath, {
    force: true
  });
}

export function getUploadAbsolutePath(
  config: LocalPortalConfig,
  relativePath: string
): string | null {
  if (config.state !== "configured" || relativePath.includes("..") || relativePath.startsWith("/") || extname(relativePath) === "") {
    return null;
  }

  const absolutePath = resolve(config.uploadsDirectory, relativePath);

  return isPathInside(config.uploadsDirectory, absolutePath) ? absolutePath : null;
}

export function serveStoredUpload(params: {
  config: LocalPortalConfig;
  relativePath: string;
  response: ServerResponse;
  mimeType?: string | null;
}): void {
  const absolutePath = getUploadAbsolutePath(params.config, params.relativePath);

  if (!absolutePath) {
    params.response.statusCode = 404;
    params.response.end("Not Found");
    return;
  }

  params.response.statusCode = 200;
  params.response.setHeader("Cache-Control", "private, no-store");

  params.response.setHeader("Content-Type", params.mimeType ?? mimeTypeByExtension[extname(params.relativePath).toLowerCase()] ?? "application/octet-stream");

  createReadStream(absolutePath)
    .on("error", () => {
      if (!params.response.headersSent) {
        params.response.statusCode = 404;
      }
      params.response.end("Not Found");
    })
    .pipe(params.response);
}
