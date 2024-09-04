import { loadImage } from "./image-loader";
import {
  RenderPass,
  RenderPassInput,
  RenderPassType,
  Shader,
} from "./tauri-commands";

export interface GLShader {
  metadata: RenderPass;
  program: WebGLProgram;
  attributes: {
    pos: GLint;
  };
  uniforms: {
    iResolution: WebGLUniformLocation;
    iTime: WebGLUniformLocation;
    iFrameRate: WebGLUniformLocation;
    iChannels: (WebGLUniformLocation | undefined)[];
  };
}

export interface ShaderToy {
  image: GLShader;
  bufferShaders: GLShader[];
  buffers: Map<number, BufferPair>;
}

export interface BufferPair {
  frameBuffer: WebGLFramebuffer;
  texture: WebGLTexture;
}

export async function initShader(
  gl: WebGL2RenderingContext,
  shader: Shader
): Promise<ShaderToy | null> {
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

  const imageShader = initRenderPass(gl, image, common);
  if (!imageShader) {
    return null;
  }

  const bufferShaders = shader.renderpass
    .filter((renderpass) => renderpass.type === RenderPassType.Buffer)
    .map((renderpass) => initRenderPass(gl, renderpass, common));
  if (bufferShaders.some((shader) => shader === null)) {
    return null;
  }

  const buffers = new Map<number, BufferPair>();
  for (const renderpass of shader.renderpass) {
    renderpass.inputs
      .filter((input) => input.ctype === "buffer")
      .forEach((input) => {
        if (input.id in buffers) {
          return;
        }
        buffers.set(input.id, createBufferPair(gl, input));
      });

    for (const input of renderpass.inputs.filter(
      (input) => input.ctype === "texture"
    )) {
      if (input.id in buffers) {
        continue;
      }
      const image = await loadImage(input.src);
      buffers.set(input.id, createBufferPair(gl, input, image));
    }
  }

  return {
    image: imageShader,
    bufferShaders: bufferShaders as GLShader[], // type checked to not have null just after creation
    buffers,
  };
}

const vertexShaderSource = `#version 300 es
in vec2 position;
void main(void) {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentHeader = `#version 300 es

#define HW_PERFORMANCE 1

precision lowp float;

uniform vec3 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform float iFrameRate;
uniform int iFrame;
uniform float iChannelTime[4];
uniform vec3 iChannelResolution[4];
uniform vec4 iMouse;
uniform vec4 iDate;
uniform float iSampleRate;`;

const fragmentMain = `
out vec4 fragColor;
void mainImage( out vec4 fragColor, in vec2 fragCoord );
void main(void) { 
  mainImage(fragColor, gl_FragCoord.xy);
}
`;

function initRenderPass(
  gl: WebGL2RenderingContext,
  renderPass: RenderPass,
  common: RenderPass | undefined = undefined
): GLShader | null {
  const vertexShader = createGLShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  if (vertexShader === null) {
    return null;
  }

  let fragmentSource = fragmentHeader;

  renderPass.inputs.forEach((input) => {
    fragmentSource += `
    uniform sampler2D iChannel${input.channel};`; // TODO needs to be a samplerCube if id matches output id of cubemap renderpass
  });

  fragmentSource += fragmentMain;

  if (common) {
    fragmentSource += common.code;
  }
  fragmentSource += renderPass.code;

  const fragmentShader = createGLShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (fragmentShader === null) {
    return null;
  }

  const shaderProgram = gl.createProgram()!;
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log("unable to initialize the shader program!");
    console.log(gl.getProgramInfoLog(shaderProgram));
    gl.deleteProgram(shaderProgram);
    return null;
  }

  return {
    metadata: renderPass,
    program: shaderProgram,
    attributes: {
      pos: gl.getAttribLocation(shaderProgram, "position"),
    },
    uniforms: {
      iResolution: gl.getUniformLocation(shaderProgram, "iResolution")!,
      iTime: gl.getUniformLocation(shaderProgram, "iTime")!,
      iFrameRate: gl.getUniformLocation(shaderProgram, "iFrameRate")!,
      iChannels: [
        gl.getUniformLocation(shaderProgram, "iChannel0") ?? undefined,
        gl.getUniformLocation(shaderProgram, "iChannel1") ?? undefined,
        gl.getUniformLocation(shaderProgram, "iChannel2") ?? undefined,
        gl.getUniformLocation(shaderProgram, "iChannel3") ?? undefined,
      ],
    },
  };
}

function createGLShader(
  gl: WebGL2RenderingContext,
  type: GLenum,
  source: string
) {
  const shader = gl.createShader(type)!;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log("an error occured compiling shader!");
    logShaderError(gl, shader);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createBufferPair(
  gl: WebGL2RenderingContext,
  input: RenderPassInput,
  image: HTMLImageElement | null = null
): BufferPair {
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  if (image) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  } else {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.canvas.width,
      gl.canvas.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );
  }
  // TODO use input.sampler here to set these parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  const frameBuffer = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );
  if (!image) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return { texture, frameBuffer };
}

// because shader code is being spliced together, the line numbers from the info log are hard to match without this
function logShaderError(gl: WebGL2RenderingContext, shader: WebGLShader) {
  const errorLines = gl.getShaderInfoLog(shader)?.split("\n");

  let i = 1;
  const shaderLines = gl
    .getShaderSource(shader)!
    .replace(/^/gm, () => i++ + ":\t\t")
    .split("\n");

  const windowSize = 2;

  let message = "";
  errorLines?.forEach((errorLine) => {
    if (errorLine.indexOf(":") < 0) {
      return;
    }
    const parts = errorLine.split(" ");
    const line = parseInt(parts[1].split(":")[1]) - 1;
    const before = Math.max(0, line - windowSize);
    const after = Math.min(shaderLines.length - 1, line + windowSize);
    message += errorLine + "\n";
    message += "----------------------------------------\n";
    for (let i = before; i <= after; i++) {
      message += shaderLines[i] + (i === line ? "\t\t<---" : "") + "\n";
    }
    message += "\n";
  });

  console.log(message);
}
