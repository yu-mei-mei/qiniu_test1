"""Baidu short speech recognition adapter."""
import base64
import logging
import os

import httpx

logger = logging.getLogger(__name__)

TOKEN_URL = "https://aip.baidubce.com/oauth/2.0/token"
ASR_URL = "https://vop.baidu.com/server_api"


def _credentials() -> tuple[str | None, str | None, str | None]:
    return (
        os.getenv("BAIDU_APP_ID"),
        os.getenv("BAIDU_API_KEY"),
        os.getenv("BAIDU_SECRET_KEY"),
    )


def _access_token(api_key: str, secret_key: str) -> str:
    response = httpx.post(
        TOKEN_URL,
        params={
            "grant_type": "client_credentials",
            "client_id": api_key,
            "client_secret": secret_key,
        },
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()
    token = data.get("access_token")
    if not token:
        raise RuntimeError(f"Baidu token response missing access_token: {data}")
    return token


def transcribe_audio(audio_bytes: bytes, suffix: str = ".wav") -> dict:
    """Transcribe 16kHz mono WAV/PCM audio using Baidu short ASR."""
    if not audio_bytes:
        return {"text": "", "error": "empty_audio"}

    app_id, api_key, secret_key = _credentials()
    if not (app_id and api_key and secret_key):
        return {
            "text": "",
            "error": "asr_not_configured",
            "message": "请配置 BAIDU_APP_ID、BAIDU_API_KEY 和 BAIDU_SECRET_KEY",
        }

    try:
        token = _access_token(api_key, secret_key)
        payload = {
            "format": "wav",
            "rate": 16000,
            "channel": 1,
            "cuid": os.getenv("BAIDU_CUID", "voice-draw-demo"),
            "token": token,
            "dev_pid": int(os.getenv("BAIDU_DEV_PID", "1537")),
            "speech": base64.b64encode(audio_bytes).decode("ascii"),
            "len": len(audio_bytes),
        }
        response = httpx.post(ASR_URL, json=payload, timeout=20)
        response.raise_for_status()
        data = response.json()

        if data.get("err_no") != 0:
            logger.warning("Baidu ASR failed: %s", data)
            return {
                "text": "",
                "error": "asr_failed",
                "message": data.get("err_msg") or "百度语音识别失败",
            }

        result = data.get("result") or []
        text = result[0] if result else ""
        return {"text": text.strip()}
    except Exception:
        logger.exception("Failed to transcribe audio with Baidu ASR")
        return {"text": "", "error": "asr_failed", "message": "百度语音识别服务暂时不可用"}
