import { RenderPass } from "../tauri-commands";

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
    iFrame: WebGLUniformLocation;
    iChannelResolution: WebGLUniformLocation;
    iChannels: (WebGLUniformLocation | undefined)[];
  };
}

export interface ShaderToy {
  imageShader: GLShader;
  bufferShaders: GLShader[];
  buffers: Map<number, BufferPair>;
  inputs: Map<number, TextureAndSize>;
  // TODO move the following two into a renderer class
  start: number;
  frame: number;
}

export interface TextureAndSize {
  texture: WebGLTexture;
  size: { w: number; h: number };
}

export class BufferPair {
  constructor(
    public frameBuffer: WebGLFramebuffer,
    public activeTexture: TextureAndSize,
    public bufferTexture: TextureAndSize
  ) {}

  public swapTextures(gl: WebGL2RenderingContext) {
    const tempTexture = this.activeTexture;
    this.activeTexture = this.bufferTexture;
    this.bufferTexture = tempTexture;
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.bufferTexture.texture,
      0
    );
  }
}
