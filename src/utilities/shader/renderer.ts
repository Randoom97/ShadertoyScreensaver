import { GLShader, ShaderToy } from "./interfaces";

interface GLInput {
  channel: number;
  type: GLint;
  texture: WebGLTexture;
  size: { w: number; h: number };
}

export class Renderer {
  private vertexBuffer: WebGLBuffer;
  private timeOffset: number = 0;
  private startTime: number | undefined = 0; // undefined means not looping
  private frame: number = 0;

  constructor(
    private gl: WebGL2RenderingContext,
    private shaderToy: ShaderToy
  ) {
    this.vertexBuffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]),
      this.gl.STATIC_DRAW
    );
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
  }

  public suspend() {
    if (this.startTime === undefined) {
      return;
    }
    this.timeOffset += Date.now() - this.startTime;
    this.startTime = undefined;
  }

  public renderLoop() {
    this.startTime = Date.now();
    const loop = () => {
      if (this.startTime === undefined) {
        return;
      }
      this.renderOnce();
      window.requestAnimationFrame(loop);
    };
    window.requestAnimationFrame(loop);
  }

  public renderOnce() {
    this.shaderToy.bufferShaders.forEach((bufferShader) => {
      const bufferPair = this.shaderToy.buffers.get(
        bufferShader.metadata.outputs[0].id
      )!;
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, bufferPair.frameBuffer);
      this.renderShader(bufferShader);
      bufferPair.swapTextures(this.gl);
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    });

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.renderShader(this.shaderToy.imageShader);
    this.frame += 1;
  }

  private renderShader(shader: GLShader) {
    const textures: GLInput[] = shader.metadata.inputs
      .map((input) => {
        switch (input.ctype) {
          case "buffer":
            return {
              channel: input.channel,
              type: this.gl.TEXTURE_2D,
              ...this.shaderToy.buffers.get(input.id)!.activeTexture,
            };
          case "texture":
            return {
              channel: input.channel,
              type: this.gl.TEXTURE_2D,
              ...this.shaderToy.inputs.get(input.id)!,
            };
          case "cubemap":
            return {
              channel: input.channel,
              type: this.gl.TEXTURE_CUBE_MAP,
              ...this.shaderToy.inputs.get(input.id)!,
            };
        }
        return undefined;
      })
      .filter((texture) => texture !== undefined);
    this.render(shader, textures);
  }

  private render(shader: GLShader, inputs: GLInput[] = []) {
    this.gl.useProgram(shader.program);

    // bind uniforms here
    const uniforms = shader.uniforms;
    this.gl.uniform3f(
      uniforms.iResolution,
      this.gl.canvas.width,
      this.gl.canvas.height,
      1.0
    );
    const timeDelta =
      this.startTime === undefined ? 0 : Date.now() - this.startTime;
    this.gl.uniform1f(uniforms.iTime, (this.timeOffset + timeDelta) / 1000);
    this.gl.uniform1f(uniforms.iFrameRate, 60.0);
    this.gl.uniform1i(uniforms.iFrame, this.frame);

    const inputSizes: { w: number; h: number }[] = [0, 0, 0, 0].map(() => {
      return { w: 0, h: 0 };
    });

    inputs.forEach((input) => {
      this.gl.uniform1i(
        shader.uniforms.iChannels[input.channel]!,
        input.channel
      );
      this.gl.activeTexture(this.gl.TEXTURE0 + input.channel);
      this.gl.bindTexture(input.type, input.texture);
      inputSizes[input.channel] = input.size;
    });

    const sizes: number[] = inputSizes.flatMap((size) => [size.w, size.h, 0]);
    this.gl.uniform3fv(uniforms.iChannelResolution, new Float32Array(sizes));

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.vertexAttribPointer(
      shader.attributes.pos,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.enableVertexAttribArray(shader.attributes.pos);

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }
}
