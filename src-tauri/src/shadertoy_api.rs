use std::collections::HashMap;

use std::error::Error;
use std::io::Read;

use serde::Deserialize;
use tauri::async_runtime::Mutex;

use crate::secret::API_TOKEN;
use crate::tauri_commands::{Shader, Shaders, SortBy};

const BASE_URL: &str = "https://www.shadertoy.com/api/v1";
const DEFAULT_PAGE_SIZE: u64 = 12;

#[derive(Deserialize, Debug)]
#[allow(non_snake_case)] // blame shadertoy's api
pub struct ShaderContainer {
    Shader: Shader,
}

pub struct ShadertoyAPI {
    shader_info_cache: Mutex<HashMap<String, Shader>>,
    client: reqwest::Client,
}

impl ShadertoyAPI {
    pub fn new() -> ShadertoyAPI {
        ShadertoyAPI {
            shader_info_cache: Mutex::new(HashMap::new()),
            client: reqwest::Client::new(),
        }
    }

    pub async fn get_shaders(
        &self,
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

        return Ok(self.client.get(url).send().await?.json::<Shaders>().await?);
    }

    pub async fn query_shaders(
        &self,
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
        return Ok(self.client.get(url).send().await?.json::<Shaders>().await?);
    }

    pub async fn get_shader_info(&self, shader_id: String) -> Result<Shader, Box<dyn Error>> {
        let mut cache = self.shader_info_cache.lock().await;
        if cache.contains_key(&shader_id) {
            return Ok(cache.get(&shader_id).unwrap().to_owned());
        }

        let url = make_url(&format!("/shaders/{shader_id}"), &mut HashMap::new())?;
        let shader = self
            .client
            .get(url)
            .send()
            .await?
            .json::<ShaderContainer>()
            .await?
            .Shader;
        cache.insert(shader_id, shader.clone());
        return Ok(shader);
    }

    pub async fn get_media(&self, path: String) -> Result<Vec<u8>, Box<dyn Error>> {
        let url = reqwest::Url::parse(&format!("https://www.shadertoy.com{path}"))?;
        let bytes: Vec<u8> = self
            .client
            .get(url)
            .send()
            .await?
            .bytes()
            .await?
            .bytes()
            .flatten()
            .collect();
        return Ok(bytes);
    }
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
