use std::collections::HashMap;

use std::error::Error;

use serde::Deserialize;

use crate::secret::API_TOKEN;
use crate::tauri_commands::{Shader, Shaders, SortBy};

const BASE_URL: &str = "https://www.shadertoy.com/api/v1";
const DEFAULT_PAGE_SIZE: u64 = 10;

#[derive(Deserialize, Debug)]
#[allow(non_snake_case)] // blame shadertoy's api
pub struct ShaderContainer {
    Shader: Shader,
}

pub async fn get_shaders(
    sort_by: &Option<SortBy>,
    page_size: &Option<u64>,
    page_number: &Option<u64>,
) -> Result<Shaders, Box<dyn Error>> {
    let mut params = HashMap::new();
    if sort_by.is_some() {
        params.insert("sort", sort_by.as_ref().unwrap().as_str().to_owned());
    }
    let psize = page_size.unwrap_or(DEFAULT_PAGE_SIZE);
    params.insert("num", psize.to_string());
    if page_number.is_some() {
        params.insert("from", (psize * page_number.unwrap()).to_string());
    }

    let url = make_url("/shaders", &mut params)?;
    return Ok(reqwest::get(url).await?.json::<Shaders>().await?);
}

pub async fn query_shaders(
    query: &str,
    sort_by: &Option<SortBy>,
    page_size: &Option<u64>,
    page_number: &Option<u64>,
) -> Result<Shaders, Box<dyn Error>> {
    let mut params = HashMap::new();
    if sort_by.is_some() {
        params.insert("sort", sort_by.as_ref().unwrap().as_str().to_owned());
    }
    let psize = page_size.unwrap_or(DEFAULT_PAGE_SIZE);
    params.insert("num", psize.to_string());
    if page_number.is_some() {
        params.insert("from", (psize * page_number.unwrap()).to_string());
    }

    let url = make_url(&format!("/shaders/query/{query}"), &mut params)?;
    return Ok(reqwest::get(url).await?.json::<Shaders>().await?);
}

pub async fn get_shader_info(shader_id: String) -> Result<Shader, Box<dyn Error>> {
    let url = make_url(&format!("/shaders/{shader_id}"), &mut HashMap::new())?;
    return Ok(reqwest::get(url)
        .await?
        .json::<ShaderContainer>()
        .await?
        .Shader);
}

fn make_url(
    endpoint: &str,
    params: &mut HashMap<&str, String>,
) -> Result<reqwest::Url, Box<dyn std::error::Error>> {
    params.insert("key", API_TOKEN.to_owned());
    return Ok(reqwest::Url::parse_with_params(
        &format!("{BASE_URL}{endpoint}"),
        params,
    )?);
}
