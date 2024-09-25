import { convertFileSrc } from "@tauri-apps/api/tauri";
import { getMediaPath, RenderPassInput } from "../tauri-commands";
import { TextureAndSize } from "./interfaces";

type TextureType = Texture | CubeMap | Buffer | Keyboard;
class Texture {
  constructor(public readonly image: HTMLImageElement) {}
}
class CubeMap {
  constructor(public readonly images: HTMLImageElement[]) {}
}
class Buffer {}
class Keyboard {}

export async function loadTexture(
  gl: WebGL2RenderingContext,
  input: RenderPassInput,
  imageUrl: string
) {
  const image = await loadImage(imageUrl);
  return createTexture({ gl, input, texType: new Texture(image) });
}

export async function loadCubemap(
  gl: WebGL2RenderingContext,
  input: RenderPassInput,
  imageUrls: string[]
) {
  const images: HTMLImageElement[] = await Promise.all(
    imageUrls.map((imageUrl) => loadImage(imageUrl))
  );
  return createTexture({ gl, input, texType: new CubeMap(images) });
}

export function createBufferTexture(
  gl: WebGL2RenderingContext,
  input: RenderPassInput
) {
  return createTexture({ gl, input, texType: new Buffer() });
}

export function createKeyboardTexture(
  gl: WebGL2RenderingContext,
  input: RenderPassInput
) {
  return createTexture({ gl, input, texType: new Keyboard() });
}

function createTexture({
  gl,
  input,
  texType,
}: {
  gl: WebGL2RenderingContext;
  input: RenderPassInput;
  texType: TextureType;
}): TextureAndSize {
  const texture = gl.createTexture()!;
  let glTextureType: GLint;
  let size: { w: number; h: number };

  if (texType instanceof Texture) {
    const image = texType.image;
    size = { w: image.width, h: image.height };
    glTextureType = gl.TEXTURE_2D;
    gl.bindTexture(glTextureType, texture);
    gl.texImage2D(glTextureType, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  } else if (texType instanceof CubeMap) {
    const images = texType.images;
    size = { w: images[0].width, h: images[0].height };
    glTextureType = gl.TEXTURE_CUBE_MAP;
    gl.bindTexture(glTextureType, texture);
    images.forEach((image, idx) => {
      gl.texImage2D(
        gl.TEXTURE_CUBE_MAP_POSITIVE_X + idx,
        0,
        gl.RGB,
        gl.RGB,
        gl.UNSIGNED_BYTE,
        image
      );
    });
  } else if (texType instanceof Keyboard) {
    glTextureType = gl.TEXTURE_2D;
    size = { w: 256, h: 3 };
    gl.bindTexture(glTextureType, texture);
    gl.texImage2D(
      glTextureType,
      0,
      gl.R8,
      size.w,
      size.h,
      0,
      gl.RED,
      gl.UNSIGNED_BYTE,
      null
    );
  } else {
    glTextureType = gl.TEXTURE_2D;
    size = { w: gl.canvas.width, h: gl.canvas.height };
    gl.bindTexture(glTextureType, texture);
    gl.texImage2D(
      glTextureType,
      0,
      gl.RGBA32F,
      size.w,
      size.h,
      0,
      gl.RGBA,
      gl.FLOAT,
      null
    );
  }

  const wrap = input.sampler.wrap === "clamp" ? gl.CLAMP_TO_EDGE : gl.REPEAT;
  gl.texParameteri(glTextureType, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(glTextureType, gl.TEXTURE_WRAP_T, wrap);

  switch (input.sampler.filter) {
    case "none":
      gl.texParameteri(glTextureType, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(glTextureType, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      break;
    case "linear":
      gl.texParameteri(glTextureType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(glTextureType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      break;
    case "mipmap":
      gl.texParameteri(glTextureType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(
        glTextureType,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_NEAREST
      );
      gl.generateMipmap(glTextureType);
      break;
    default:
      gl.texParameteri(glTextureType, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(
        glTextureType,
        gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR
      );
      gl.generateMipmap(glTextureType);
  }

  gl.bindTexture(glTextureType, null);

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
