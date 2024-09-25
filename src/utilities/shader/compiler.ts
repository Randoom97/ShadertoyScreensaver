import { RenderPass } from "../tauri-commands";
import { GLShader } from "./interfaces";

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
uniform float iSampleRate;
`;

const fragmentMain = `
out vec4 fragColor;
void mainImage( out vec4 fragColor, in vec2 fragCoord );
void main(void) { 
  mainImage(fragColor, gl_FragCoord.xy);
}
`;

export function compileRenderPass(
  gl: WebGL2RenderingContext,
  renderPass: RenderPass,
  common: RenderPass | undefined = undefined,
  shaderId: string
): GLShader | null {
  const vertexShader = createGLShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource,
    shaderId
  );
  if (vertexShader === null) {
    return null;
  }

  let fragmentSource = fragmentHeader;

  const cubemapChannels = renderPass.inputs
    .filter((input) => input.ctype === "cubemap")
    .map((input) => input.channel);
  [0, 1, 2, 3].forEach((channel) => {
    const type =
      cubemapChannels.find((c) => c === channel) !== undefined ? "Cube" : "2D";
    fragmentSource += `uniform sampler${type} iChannel${channel};
    `;
  });

  fragmentSource += fragmentMain;

  if (common) {
    fragmentSource += common.code + "\n";
  }
  fragmentSource += renderPass.code;

  const fragmentShader = createGLShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentSource,
    shaderId
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
    metadata: renderPass,
    program: shaderProgram,
    attributes: {
      pos: gl.getAttribLocation(shaderProgram, "position"),
    },
    uniforms: {
      iResolution: gl.getUniformLocation(shaderProgram, "iResolution")!,
      iTime: gl.getUniformLocation(shaderProgram, "iTime")!,
      iFrameRate: gl.getUniformLocation(shaderProgram, "iFrameRate")!,
      iFrame: gl.getUniformLocation(shaderProgram, "iFrame")!,
      iChannelResolution: gl.getUniformLocation(
        shaderProgram,
        "iChannelResolution"
      )!,
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
  source: string,
  id: string
) {
  const shader = gl.createShader(type)!;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log(`an error occured compiling shader ${id}!`);
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
