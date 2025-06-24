import { RenderPassType, Shader } from "../tauri-commands";

export class ShaderBuilder {
  private shader: Shader = {
    ver: "",
    info: {
      id: "testId",
      date: "",
      viewed: 0,
      name: "test",
      username: "test user",
      description: "a test shader",
      likes: 0,
      published: 0,
      flags: 0,
      usePreview: 0,
      tags: [],
      hasliked: 0,
    },
    renderpass: [],
  };
  constructor() {}

  public getShader(): Shader {
    return this.shader;
  }

  public addImage(code: string): ShaderBuilder {
    this.shader.renderpass.push({
      inputs: [],
      outputs: [],
      code,
      name: "",
      description: "",
      type: RenderPassType.Image,
    });
    return this;
  }
}

export const basicShader: Shader = new ShaderBuilder()
  .addImage(
    `void mainImage(out vec4 frag_col, in vec2 frag_coord) {
      frag_col = vec4(1.0, 1.0, 1.0, 1.0);
    }`
  )
  .getShader();
