use std::{
    error::Error,
    fs::{self, File},
};

use serde::{Deserialize, Serialize};

use crate::shadertoy_api::ShadertoyAPI;

/*
---------------WARNING---------------
Keep in sync with tauri-commands.ts
---------------WARNING---------------
*/

// TODO: maybe see about auto generating these functions in typescript
// TODO: see about auto generating the .invoke_handler for all functions in this file
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

#[derive(Serialize, Deserialize, Debug)]
pub enum SortBy {
    Name,
    Love,
    Popular,
    Newest,
    Hot,
}

impl SortBy {
    pub fn as_str(&self) -> &'static str {
        return match self {
            SortBy::Name => "name",
            SortBy::Love => "love",
            SortBy::Popular => "popular",
            SortBy::Newest => "newest",
            SortBy::Hot => "hot",
        };
    }
}

#[derive(Serialize, Deserialize, Debug)]
#[allow(non_snake_case)] // blame shadertoy's api
pub struct Shaders {
    Shaders: u64,
    Results: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Shader {
    ver: String,
    info: Info,
    renderpass: Vec<RenderPass>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
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

#[derive(Serialize, Deserialize, Debug, Clone)]
struct RenderPass {
    inputs: Vec<Input>,
    outputs: Vec<Output>,
    code: String,
    name: String,
    description: String,
    r#type: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Input {
    id: u64,
    src: String,
    ctype: String,
    channel: u64,
    sampler: Sampler,
    published: u64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Output {
    id: u64,
    channel: u64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Sampler {
    filter: String,
    wrap: String,
    vflip: String,
    srgb: String,
    internal: String,
}

#[tauri::command]
pub async fn get_shaders(
    shadertoy_api: tauri::State<'_, ShadertoyAPI>,
    query: Option<String>,
    sort_by: Option<SortBy>,
    page_size: Option<u64>,
    page_number: Option<u64>,
) -> Result<Shaders, String> {
    return print_and_map_error(if query.is_some() {
        shadertoy_api
            .query_shaders(query.as_ref().unwrap(), &sort_by, &page_size, &page_number)
            .await
    } else {
        shadertoy_api
            .get_shaders(&sort_by, &page_size, &page_number)
            .await
    });
}

#[tauri::command]
pub async fn get_shader(
    shadertoy_api: tauri::State<'_, ShadertoyAPI>,
    id: String,
) -> Result<Shader, String> {
    return print_and_map_error(shadertoy_api.get_shader_info(id).await);
}

fn print_and_map_error<T>(result: Result<T, Box<dyn Error>>) -> Result<T, String> {
    if result.is_err() {
        println!("{:?}", result.as_ref().err());
    }
    return result.map_err(|err| err.to_string());
}

#[tauri::command]
pub async fn get_media_path(
    app_handle: tauri::AppHandle,
    shadertoy_api: tauri::State<'_, ShadertoyAPI>,
    path: String,
) -> Result<String, String> {
    let data_dir = app_handle.path_resolver().app_data_dir().unwrap();
    let filename = path.rsplit_once("/").unwrap().1;
    let mut media_path = data_dir.clone();
    media_path.push("media");
    let mut full_path = media_path.clone();
    full_path.push(filename);
    if full_path.exists() {
        return Ok(full_path.to_str().unwrap().to_owned());
    }
    fs::create_dir_all(media_path)
        .map_err(|err| format!("couldn't create media directory: {err}"))?;
    File::create(&full_path).map_err(|err| format!("couldn't create media file: {err}"))?;
    let file_data = shadertoy_api
        .get_media(path)
        .await
        .map_err(|err| format!("failed to download image: {err}"))?;
    fs::write(&full_path, file_data)
        .map_err(|err| format!("error writing to media file: {err}"))?;
    return Ok(full_path.to_str().unwrap().to_owned());
}
