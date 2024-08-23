import { invoke } from "@tauri-apps/api/tauri";

/*
---------------WARNING---------------
Keep in sync with tauri_commands.rs
---------------WARNING---------------
*/

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

export enum SortBy {
  Name = "Name",
  Popular = "Popular",
  Newest = "Newest",
  Love = "Love",
  Hot = "Hot",
}

interface Shaders {
  Shaders: number;
  Results: string[];
}

export interface Shader {
  ver: string;
  info: Info;
  renderpass: RenderPass[];
}

interface Info {
  id: string;
  date: string;
  viewed: number;
  name: string;
  username: string;
  description: string;
  likes: number;
  published: number;
  flags: number;
  usePreview: number;
  tags: string[];
  hasliked: number;
}

interface RenderPass {
  inputs: Input[];
  outputs: Output[];
  code: string;
  name: string;
  description: string;
}

interface Input {
  id: number;
  src: string;
  ctype: string;
  channel: number;
  sampler: Sampler;
  published: number;
}

interface Output {
  id: number;
  channel: number;
}

interface Sampler {
  filter: string;
  wrap: string;
  vflip: string;
  srgb: string;
  internal: string;
}

export function getShaders(
  args: { sortBy?: SortBy; pageSize?: number; pageNumber?: number } = {}
): Promise<Shaders> {
  return invoke("get_shaders", args);
}

export function queryShaders(args: {
  query: string;
  sortBy?: SortBy;
  pageSize?: number;
  pageNumber?: number;
}) {
  return invoke("query_shaders", args);
}

export function getShader(id: string): Promise<Shader> {
  return invoke("get_shader", { id });
}
