"""
AI 语音绘图工具 - 后端入口
提供 API 接口并托管前端静态文件
"""
from pathlib import Path

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .asr import transcribe_audio
from .command_parser import parse_command
from .image_generator import generate_image, should_generate_image

app = FastAPI(title="AI 语音绘图工具")

# 前端文件目录
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


# ===== 数据模型 =====

class ParseRequest(BaseModel):
    """指令解析请求"""
    text: str


class ImageRequest(BaseModel):
    """AI 图片生成请求"""
    text: str


# ===== API 路由 =====

@app.get("/api/health")
async def health_check():
    """健康检查接口"""
    return {"status": "ok", "message": "AI 语音绘图工具服务运行中"}


@app.post("/api/parse")
async def parse_instruction(req: ParseRequest):
    """将自然语言指令解析为结构化绘图命令"""
    result = parse_command(req.text)
    return result


@app.post("/api/generate-image")
async def generate_image_from_text(req: ImageRequest):
    """根据文字生成图片，仅在后端使用图片模型 API Key。"""
    result = generate_image(req.text)
    if result.get("ok"):
        return {"text": req.text, "image": result, "tts": "好的，我用 AI 生成了一张图片。"}
    return {"text": req.text, "image": None, "tts": result.get("message", "AI 图像生成失败"), "error": result.get("error")}


@app.post("/api/voice")
async def parse_voice(file: UploadFile = File(...)):
    """将浏览器录音转写为文字，并解析为结构化绘图命令。"""
    audio_bytes = await file.read()
    suffix = Path(file.filename or "voice.webm").suffix or ".webm"
    asr_result = transcribe_audio(audio_bytes, suffix=suffix)
    text = (asr_result.get("text") or "").strip()

    if not text:
        return {
            "text": "",
            "commands": [],
            "tts": asr_result.get("message", "没有听清楚，请再说一遍"),
            "error": asr_result.get("error", "empty_transcript"),
        }

    if should_generate_image(text):
        image_result = generate_image(text)
        if image_result.get("ok"):
            return {
                "text": text,
                "commands": [],
                "image": image_result,
                "tts": "好的，我用 AI 生成了一张图片。",
            }

    result = parse_command(text)
    result["text"] = text
    return result


# ===== 前端静态文件（挂载在 /static 下） =====
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


# ===== 前端入口（SPA 捕获路由） =====
@app.get("/")
async def serve_frontend():
    """返回前端主页面"""
    return FileResponse(str(FRONTEND_DIR / "index.html"))
