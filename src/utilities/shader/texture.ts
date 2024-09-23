import { convertFileSrc } from "@tauri-apps/api/tauri";
import { getMediaPath, RenderPassInput } from "../tauri-commands";
import { TextureAndSize } from "./interfaces";

export async function loadTexture({
  gl,
  input,
  media,
}: {
  gl: WebGL2RenderingContext;
  input: RenderPassInput;
  media: string[] | string;
}) {
  if (typeof media === "string") {
    const image = await loadImage(media);
    return createTexture({ gl, input, media: image });
  } else {
    const images: HTMLImageElement[] = await Promise.all(
      media.map((path) => loadImage(path))
    );
    return createTexture({ gl, input, media: images });
  }
}

export function createBufferTexture(
  gl: WebGL2RenderingContext,
  input: RenderPassInput
) {
  return createTexture({ gl, input });
}

function createTexture({
  gl,
  input,
  media = null,
}: {
  gl: WebGL2RenderingContext;
  input: RenderPassInput;
  media?: HTMLImageElement[] | HTMLImageElement | null;
}): TextureAndSize {
  const texture = gl.createTexture()!;
  let textureType: GLint;
  let size = { w: gl.canvas.width, h: gl.canvas.height };

  if (media instanceof HTMLImageElement) {
    size = { w: media.width, h: media.height };
    textureType = gl.TEXTURE_2D;
    gl.bindTexture(textureType, texture);
    gl.texImage2D(textureType, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, media);
  } else if (media !== null) {
    size = { w: media[0].width, h: media[0].height };
    textureType = gl.TEXTURE_CUBE_MAP;
    gl.bindTexture(textureType, texture);
    media.forEach((media, idx) => {
      gl.texImage2D(
        gl.TEXTURE_CUBE_MAP_POSITIVE_X + idx,
        0,
        gl.RGB,
        gl.RGB,
        gl.UNSIGNED_BYTE,
        media
      );
    });
  } else {
    textureType = gl.TEXTURE_2D;
    gl.bindTexture(textureType, texture);
    gl.texImage2D(
      textureType,
      0,
      gl.RGBA32F,
      gl.canvas.width,
      gl.canvas.height,
      0,
      gl.RGBA,
      gl.FLOAT,
      null
    );
  }

  const wrap = input.sampler.wrap === "clamp" ? gl.CLAMP_TO_EDGE : gl.REPEAT;
  gl.texParameteri(textureType, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(textureType, gl.TEXTURE_WRAP_T, wrap);

  switch (input.sampler.filter) {
    case "none":
      gl.texParameteri(textureType, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(textureType, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      break;
    case "linear":
      gl.texParameteri(textureType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(textureType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      break;
    case "mipmap":
      gl.texParameteri(textureType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(
        textureType,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_NEAREST
      );
      gl.generateMipmap(textureType);
      break;
    default:
      gl.texParameteri(textureType, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(
        textureType,
        gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR
      );
      gl.generateMipmap(textureType);
  }

  gl.bindTexture(textureType, null);

  return { texture, size };
}

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
