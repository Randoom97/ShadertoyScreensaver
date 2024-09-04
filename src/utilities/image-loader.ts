import { fetch as tauriFetch, ResponseType } from "@tauri-apps/api/http";

const baseUrl = "https://www.shadertoy.com";

export async function loadImage(imgSrc: string) {
  /*
  Shadertoy doesn't add Access-Control-Allow-Origin to image responses so CORS issues abound.
  TODO: Have rust handle image caching to a temporary directory and use a binding here.
  It will have to run thorugh a binding when the shaders get saved locally anyway.
  */

  // Blob is empty this way
  const baseResponse = await fetch(baseUrl + imgSrc, {
    mode: "no-cors",
    method: "GET",
  });
  const baseBlob = await baseResponse.blob();

  // This creates a blob, but fails to succesfully load the image
  const response = await tauriFetch<BlobPart[]>(baseUrl + imgSrc, {
    method: "GET",
    responseType: ResponseType.Binary,
  });
  const blob = new Blob(response.data);
  const url = URL.createObjectURL(blob);

  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject("Image load failed"));
    image.src = url;
  });
}
