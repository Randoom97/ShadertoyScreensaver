import {
  BufferPair,
  GLShader,
  ShaderToy,
  TextureAndSize,
} from "./shader-setup";

export function renderShaderToy(
  gl: WebGL2RenderingContext,
  shaderToy: ShaderToy
) {
  shaderToy.bufferShaders.forEach((bufferShader) => {
    const bufferPair = shaderToy.buffers.get(
      bufferShader.metadata.outputs[0].id
    )!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, bufferPair.frameBuffer);
    renderShader(
      gl,
      bufferShader,
      shaderToy.buffers,
      shaderToy.inputs,
      shaderToy
    );
    bufferPair.swapTextures(gl);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  });

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  renderShader(
    gl,
    shaderToy.image,
    shaderToy.buffers,
    shaderToy.inputs,
    shaderToy
  );
  shaderToy.frame++;
}

interface GLInput {
  channel: number;
  type: GLint;
  texture: WebGLTexture;
  size: { w: number; h: number };
}

export function renderShader(
  gl: WebGL2RenderingContext,
  shader: GLShader,
  buffers: Map<number, BufferPair>,
  inputs: Map<number, TextureAndSize>,
  toy: ShaderToy
) {
  const textures: GLInput[] = shader.metadata.inputs
    .map((input) => {
      switch (input.ctype) {
        case "buffer":
          return {
            channel: input.channel,
            type: gl.TEXTURE_2D,
            ...buffers.get(input.id)!.activeTexture,
          };
        case "texture":
          return {
            channel: input.channel,
            type: gl.TEXTURE_2D,
            ...inputs.get(input.id)!,
          };
        case "cubemap":
          return {
            channel: input.channel,
            type: gl.TEXTURE_CUBE_MAP,
            ...inputs.get(input.id)!,
          };
      }
      return undefined;
    })
    .filter((texture) => texture !== undefined);
  render(gl, shader, textures, toy);
}

function render(
  gl: WebGL2RenderingContext,
  shader: GLShader,
  inputs: GLInput[] = [],
  toy: ShaderToy
) {
  gl.useProgram(shader.program);

  // bind uniforms here
  const uniforms = shader.uniforms;
  gl.uniform3f(uniforms.iResolution, gl.canvas.width, gl.canvas.height, 1.0);
  gl.uniform1f(uniforms.iTime, new Date().getTime() / 1000 - toy.start);
  gl.uniform1f(uniforms.iFrameRate, 60.0);
  gl.uniform1i(uniforms.iFrame, toy.frame);

  const inputSizes: { w: number; h: number }[] = [0, 0, 0, 0].map(() => {
    return { w: 0, h: 0 };
  });

  inputs.forEach((input) => {
    gl.uniform1i(shader.uniforms.iChannels[input.channel]!, input.channel);
    gl.activeTexture(gl.TEXTURE0 + input.channel);
    gl.bindTexture(input.type, input.texture);
    inputSizes[input.channel] = input.size;
  });

  const sizes: number[] = inputSizes.flatMap((size) => [size.w, size.h, 0]);
  gl.uniform3fv(uniforms.iChannelResolution, new Float32Array(sizes));

  const vertexBuffer = gl.createBuffer()!; // TODO store this somwhere instead of re-creating it
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]),
    gl.STATIC_DRAW
  );
  gl.vertexAttribPointer(shader.attributes.pos, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shader.attributes.pos);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
