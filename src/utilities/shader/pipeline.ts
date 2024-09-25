import { RenderPassInput, RenderPassType, Shader } from "../tauri-commands";
import { compileRenderPass } from "./compiler";
import { BufferPair, GLShader, ShaderToy, TextureAndSize } from "./interfaces";
import {
  createBufferTexture,
  createKeyboardTexture,
  loadCubemap,
  loadTexture,
} from "./texture";

export async function initShader(
  gl: WebGL2RenderingContext,
  shader: Shader
): Promise<ShaderToy | null> {
  const compileResult = compileRenderPasses(gl, shader);
  if (compileResult === null) {
    return null;
  }
  const { imageShader, bufferShaders } = compileResult;

  const { inputs, buffers } = await initInputsAndBuffers(gl, shader);

  return {
    imageShader,
    bufferShaders,
    buffers,
    inputs,
  };
}

function compileRenderPasses(gl: WebGL2RenderingContext, shader: Shader) {
  const image = shader.renderpass.find(
    (renderpass) => renderpass.type === RenderPassType.Image
  );
  if (!image) {
    console.error(`No image shader found for ${shader.info.id}`);
    return null;
  }

  const common = shader.renderpass.find(
    (renderpass) => renderpass.type === RenderPassType.Common
  );

  const imageShader = compileRenderPass(gl, image, common, shader.info.id);
  if (!imageShader) {
    return null;
  }

  const bufferShaders: GLShader[] = [];
  for (const renderPass of shader.renderpass.filter(
    (pass) => pass.type === RenderPassType.Buffer
  )) {
    const bufferShader = compileRenderPass(
      gl,
      renderPass,
      common,
      shader.info.id
    );
    if (bufferShader === null) {
      return null;
    }
    bufferShaders.push(bufferShader);
  }

  return { imageShader, bufferShaders };
}

async function initInputsAndBuffers(
  gl: WebGL2RenderingContext,
  shader: Shader
) {
  const inputs = new Map<number, TextureAndSize>();
  const buffers = new Map<number, BufferPair>();
  for (const renderpass of shader.renderpass) {
    for (const input of renderpass.inputs) {
      if (input.id in buffers || input.id in inputs) {
        continue;
      }
      switch (input.ctype) {
        case "buffer":
          buffers.set(input.id, createBufferPair({ gl, input }));
          break;
        case "texture":
          inputs.set(input.id, await loadTexture(gl, input, input.src));
          break;
        case "cubemap":
          let [path, extension] = input.src.split(".");
          extension = "." + extension;
          // cubemaps have the first url as their soruce. following faces are stored as {id}_1.jpg, {id}_2.jpg ... {id}_5.jpg
          const paths: string[] = [
            path + extension,
            ...[1, 2, 3, 4, 5].map((i) => `${path}_${i}${extension}`),
          ];
          inputs.set(input.id, await loadCubemap(gl, input, paths));
          break;
        case "keyboard": // receives erroneous data from iChannel when a 0 texture isn't bound
          inputs.set(input.id, createKeyboardTexture(gl, input));
      }
    }
  }

  return { inputs, buffers };
}

function createBufferPair({
  gl,
  input,
}: {
  gl: WebGL2RenderingContext;
  input: RenderPassInput;
}): BufferPair {
  const activeTexture = createBufferTexture(gl, input);
  const bufferTexture = createBufferTexture(gl, input);

  const frameBuffer = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  const bufferPair = new BufferPair(frameBuffer, activeTexture, bufferTexture);

  bufferPair.swapTextures(gl);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  bufferPair.swapTextures(gl);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return bufferPair;
}
