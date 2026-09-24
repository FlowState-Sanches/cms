/**
 * Upload direto do navegador para o S3 usando a URL assinada devolvida pela
 * API (`cmsApi.videoUploadUrl`). O token da sessão nunca sai do servidor: o
 * `PUT` aqui usa só a URL assinada e os `headers` que a API devolveu junto.
 *
 * `XMLHttpRequest` (em vez de `fetch`) porque só ele expõe progresso de
 * envio (`upload.onprogress`) e permite abortar a requisição em andamento.
 */

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export const MAX_VIDEO_MB = 300;

export type UploadHandle = {
  promise: Promise<void>;
  abort: () => void;
};

export function putWithProgress(
  url: string,
  file: Blob,
  headers: Record<string, string>,
  onProgress: (ratio: number) => void,
): UploadHandle {
  const xhr = new XMLHttpRequest();

  const promise = new Promise<void>((resolve, reject) => {
    xhr.open("PUT", url, true);
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(event.loaded / event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error("upload_failed"));
      }
    };

    xhr.onerror = () => reject(new Error("upload_failed"));
    xhr.onabort = () => reject(new Error("upload_aborted"));

    xhr.send(file);
  });

  return {
    promise,
    abort: () => xhr.abort(),
  };
}
