use std::collections::HashMap;

use std::error::Error;

use serde::Deserialize;

use crate::secret::API_TOKEN;
use crate::tauri_commands::{Shader, Shaders};

const BASE_URL: &str = "https://www.shadertoy.com/api/v1";

#[derive(Deserialize, Debug)]
#[allow(non_snake_case)] // blame shadertoy's api
pub struct ShaderContainer {
    Shader: Shader,
}

pub async fn get_shaders() -> Result<Shaders, Box<dyn Error>> {
    let url = make_url("/shaders", &mut HashMap::from([("num", "10")]))?;
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
    params: &mut HashMap<&str, &str>,
) -> Result<reqwest::Url, Box<dyn std::error::Error>> {
    params.insert("key", API_TOKEN);
    return Ok(reqwest::Url::parse_with_params(
        &format!("{BASE_URL}{endpoint}"),
        params,
    )?);
}
