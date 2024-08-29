import { RenderPass, RenderPassType, Shader } from "./tauri-commands";

export interface GLShader {
  program: WebGLProgram;
  attributes: {
    pos: GLint;
  };
  uniforms: {
    iResolution: WebGLUniformLocation;
    iTime: WebGLUniformLocation;
  };
}

export interface ShaderToy {
  image: GLShader;
  buffers: Map<number, GLShader>;
}

export function initShader(
  gl: WebGL2RenderingContext,
  shader: Shader
): ShaderToy | null {
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

  const buffers = new Map<number, GLShader>();
  let bufferInitHadError = false;
  shader.renderpass
    .filter((renderpass) => renderpass.type === RenderPassType.Buffer)
    .forEach((renderpass) => {
      const glShader = initRenderPass(gl, renderpass, common);
      if (!glShader) {
        bufferInitHadError = true;
        return;
      }
      buffers.set(renderpass.outputs[0].id, glShader);
    });
  if (bufferInitHadError) {
    return null;
  }

  return {
    image: imageShader,
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
uniform int iFrame;
uniform float iChannelTime[4];
uniform vec4 iMouse;
uniform vec4 iDate;
uniform float iSampleRate;
uniform vec3 iChannelResolution[4];
// uniform samplerXX iChannel0; sampler2D or samplerCube
// uniform samplerXX iChannel1;
// uniform samplerXX iChannel2;
// uniform samplerXX iChannel3;

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
  const fragmentShader = createGLShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentHeader + (common ? common.code : "") + renderPass.code
  );
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
    program: shaderProgram,
    attributes: {
      pos: gl.getAttribLocation(shaderProgram, "position"),
    },
    uniforms: {
      iResolution: gl.getUniformLocation(shaderProgram, "iResolution")!,
      iTime: gl.getUniformLocation(shaderProgram, "iTime")!,
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
