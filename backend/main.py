"""
AI 语音绘图工具 - 后端入口
提供 API 接口并托管前端静态文件
"""
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .command_parser import parse_command

app = FastAPI(title="AI 语音绘图工具")

# 前端文件目录
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


# ===== 数据模型 =====

class ParseRequest(BaseModel):
    """指令解析请求"""
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


# ===== 前端静态文件（挂载在 /static 下） =====
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


# ===== 前端入口（SPA 捕获路由） =====
@app.get("/")
async def serve_frontend():
    """返回前端主页面"""
    return FileResponse(str(FRONTEND_DIR / "index.html"))
