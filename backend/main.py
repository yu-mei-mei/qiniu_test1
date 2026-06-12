"""
AI 语音绘图工具 - 后端入口
提供静态文件服务和 API 接口
"""
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="AI 语音绘图工具")

# 挂载前端静态文件
frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")


@app.get("/api/health")
async def health_check():
    """健康检查接口"""
    return {"status": "ok", "message": "AI 语音绘图工具服务运行中"}
