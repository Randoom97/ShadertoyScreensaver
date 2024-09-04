import { getMediaPath } from "./tauri-commands";
import { convertFileSrc } from "@tauri-apps/api/tauri";

export async function loadImage(imgSrc: string) {
  // At time of writing, Shadertoy doesn't add Access-Control-Allow-Origin to media responses.
  // The rust side of things will download a temporary file and return a path to it.

  const url = convertFileSrc(await getMediaPath(imgSrc));

  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject("Image load failed"));
    image.crossOrigin = "anonymous";
    image.src = url;
  });
}
