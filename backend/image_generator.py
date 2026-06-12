"""AI image generation adapter for complex voice drawing requests."""
import base64
import logging
import os
import re

import httpx
from openai import OpenAI

logger = logging.getLogger(__name__)

COMPLEX_KEYWORDS = (
    "皮卡丘", "小猫", "小狗", "人物", "女孩", "男孩", "机器人", "城市", "风景", "森林",
    "夜空", "宇宙", "城堡", "花园", "海边", "卡通", "动漫", "插画", "图片", "照片",
    "海报", "场景", "可爱", "漂亮", "复杂", "精美", "写实", "赛博朋克", "龙", "凤凰",
)
BASIC_WORDS = ("圆", "圆形", "矩形", "正方形", "三角形", "线", "点", "文字")


def should_generate_image(text: str) -> bool:
    normalized = (text or "").strip().lower()
    if not normalized:
        return False
    if any(word in normalized for word in ("生成图片", "生成一张", "画一幅", "画张", "照片", "插画", "海报")):
        return True
    if any(word in normalized for word in COMPLEX_KEYWORDS):
        return not _is_basic_geometry_request(normalized)
    return False


def generate_image(text: str) -> dict:
    provider = os.getenv("IMAGE_PROVIDER", "openai").lower().strip()
    prompt = _build_prompt(text)

    if provider == "zhipu":
        return _generate_openai_compatible_image(
            prompt=prompt,
            api_key=os.getenv("ZHIPU_IMAGE_API_KEY") or os.getenv("ZHIPU_API_KEY"),
            base_url=os.getenv("ZHIPU_IMAGE_BASE_URL", "https://open.bigmodel.cn/api/paas/v4"),
            model=os.getenv("ZHIPU_IMAGE_MODEL", "cogview-3-flash"),
            size=os.getenv("ZHIPU_IMAGE_SIZE", "1024x1024"),
            missing_message="未配置 ZHIPU_IMAGE_API_KEY",
            require_base_url=True,
        )

    if provider == "xiaomi":
        return _generate_openai_compatible_image(
            prompt=prompt,
            api_key=os.getenv("XIAOMI_IMAGE_API_KEY") or os.getenv("XIAOMI_API_KEY"),
            base_url=os.getenv("XIAOMI_IMAGE_BASE_URL"),
            model=os.getenv("XIAOMI_IMAGE_MODEL"),
            size=os.getenv("XIAOMI_IMAGE_SIZE", "1024x1024"),
            missing_message="未配置小米 MiMo 文生图接口参数",
            require_base_url=True,
        )

    return _generate_openai_compatible_image(
        prompt=prompt,
        api_key=os.getenv("OPENAI_IMAGE_API_KEY") or os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_IMAGE_BASE_URL") or None,
        model=os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-1"),
        size=os.getenv("OPENAI_IMAGE_SIZE", "1024x1024"),
        missing_message="未配置 OPENAI_IMAGE_API_KEY",
        require_base_url=False,
    )


def _generate_openai_compatible_image(
    prompt: str,
    api_key: str | None,
    base_url: str | None,
    model: str | None,
    size: str,
    missing_message: str,
    require_base_url: bool,
) -> dict:
    if not api_key or not model:
        return {"ok": False, "error": "image_api_not_configured", "message": missing_message}
    if require_base_url and not base_url:
        return {"ok": False, "error": "image_api_not_configured", "message": "未配置图片生成 Base URL"}

    client = OpenAI(api_key=api_key, base_url=base_url)
    try:
        response = client.images.generate(model=model, prompt=prompt, size=size)
        item = response.data[0]
        b64 = getattr(item, "b64_json", None)
        if not b64:
            url = getattr(item, "url", None)
            if url:
                data_url = _download_image_data_url(url)
                if data_url:
                    return {"ok": True, "data_url": data_url, "url": url, "prompt": prompt}
                return {"ok": True, "url": url, "prompt": prompt}
            return {"ok": False, "error": "empty_image_response", "message": "图像生成没有返回图片"}
        # Validate base64 enough to avoid returning malformed data URLs.
        base64.b64decode(b64[:128] + "===", validate=False)
        return {"ok": True, "data_url": f"data:image/png;base64,{b64}", "prompt": prompt}
    except Exception:
        logger.exception("Failed to generate image")
        return {"ok": False, "error": "image_generation_failed", "message": "AI 图像生成失败，已回退到 Canvas 绘图"}


def _download_image_data_url(url: str) -> str | None:
    try:
        response = httpx.get(url, follow_redirects=True, timeout=30)
        response.raise_for_status()
        content_type = response.headers.get("content-type", "image/png").split(";", 1)[0]
        if not content_type.startswith("image/"):
            content_type = "image/png"
        b64 = base64.b64encode(response.content).decode("ascii")
        return f"data:{content_type};base64,{b64}"
    except Exception:
        logger.exception("Failed to download generated image")
        return None


def _is_basic_geometry_request(text: str) -> bool:
    has_basic = any(word in text for word in BASIC_WORDS)
    has_complex = any(word in text for word in COMPLEX_KEYWORDS)
    return has_basic and not has_complex


def _build_prompt(text: str) -> str:
    clean = re.sub(r"\s+", " ", text).strip()
    if "皮卡丘" in clean or "pikachu" in clean.lower():
        subject = "a cute original yellow electric mouse mascot with red cheeks, long pointed ears, lightning-shaped tail, cheerful expression; not an exact copyrighted character"
    else:
        subject = clean
    return (
        "Create a polished, family-friendly digital illustration for a voice drawing canvas. "
        "Use clean shapes, strong composition, vivid colors, white or simple background, centered subject, "
        "clear readable silhouette, suitable for display inside an 800x600 drawing area. "
        f"User request: {subject}"
    )
