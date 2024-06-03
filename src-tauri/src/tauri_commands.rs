use std::error::Error;

use serde::{Deserialize, Serialize};

use crate::shadertoy_api;

/*
---------------WARNING---------------
Keep in sync with tauri-commands.ts
---------------WARNING---------------
*/

// TODO: maybe see about auto generating these functions in typescript
// TODO: see about auto generating the .invoke_handler for all functions in this file
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

#[derive(Serialize, Deserialize, Debug)]
#[allow(non_snake_case)] // blame shadertoy's api
pub struct Shaders {
    Shaders: u64,
    Results: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Shader {
    ver: String,
    info: Info,
    renderpass: Vec<RenderPass>,
}

#[derive(Serialize, Deserialize, Debug)]
#[allow(non_snake_case)] // blame shadertoy's api
struct Info {
    id: String,
    date: String,
    viewed: u64,
    name: String,
    username: String,
    description: String,
    likes: u64,
    published: u64,
    flags: u64,
    usePreview: u64,
    tags: Vec<String>,
    hasliked: u64,
}

#[derive(Serialize, Deserialize, Debug)]
struct RenderPass {
    inputs: Vec<Input>,
    outputs: Vec<Output>,
    code: String,
    name: String,
    description: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct Input {
    id: u64,
    src: String,
    ctype: String,
    channel: u64,
    sampler: Sampler,
    published: u64,
}

#[derive(Serialize, Deserialize, Debug)]
struct Output {
    id: u64,
    channel: u64,
}

#[derive(Serialize, Deserialize, Debug)]
struct Sampler {
    filter: String,
    wrap: String,
    vflip: String,
    srgb: String,
    internal: String,
}

#[tauri::command]
pub async fn get_shaders() -> Result<Shaders, String> {
    return print_and_map_error(shadertoy_api::get_shaders().await);
}

#[tauri::command]
pub async fn get_shader(id: String) -> Result<Shader, String> {
    return print_and_map_error(shadertoy_api::get_shader_info(id).await);
}

fn print_and_map_error<T>(result: Result<T, Box<dyn Error>>) -> Result<T, String> {
    if result.is_err() {
        println!("{:?}", result.as_ref().err());
    }
    return result.map_err(|err| err.to_string());
}
