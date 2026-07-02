"""
Form Auto-Fill API Server
使用 Qwen2-0.5B-Instruct 生成表单填充内容
提供 OpenAI 兼容的 /v1/chat/completions 接口
"""

import os
import json
import time
import uuid
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# ============ 使用 hf-mirror 镜像加速下载 ============
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

# ============ 配置 ============
MODEL_ID = os.getenv("MODEL_ID", "Qwen/Qwen2-0.5B-Instruct")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8080"))

# ============ 数据模型 ============
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    model: str = "local"
    messages: List[Message]
    max_tokens: int = 512
    temperature: float = 0.7
    stream: bool = False

# ============ FastAPI ============
app = FastAPI(title="Form Auto-Fill API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ 模型相关 ============
pipeline_obj = None

def load_model():
    global pipeline_obj
    from transformers import pipeline as hf_pipeline

    print(f"Loading model: {MODEL_ID}")
    print("First run will download the model (~1GB)...")
    print("This may take a few minutes...")

    pipeline_obj = hf_pipeline(
        "text-generation",
        model=MODEL_ID,
        device="cpu",
        torch_dtype="auto",
    )
    print("Model loaded!")

def generate_response(messages: List[Message], max_tokens: int = 512, temperature: float = 0.7) -> str:
    """使用模型生成回复"""
    if pipeline_obj is None:
        return '{"error": "Model not loaded"}'

    # 转换为 pipeline 格式
    formatted = []
    for msg in messages:
        formatted.append({"role": msg.role, "content": msg.content})

    result = pipeline_obj(
        formatted,
        max_new_tokens=max_tokens,
        temperature=temperature,
        do_sample=True,
        top_p=0.9,
    )

    return result[0]["generated_text"][-1]["content"]

# ============ 路由 ============
@app.get("/health")
async def health():
    return {"status": "ok" if pipeline_obj else "loading"}

@app.get("/v1/models")
async def list_models():
    return {
        "data": [{"id": MODEL_ID, "object": "model", "owned_by": "local"}]
    }

@app.post("/v1/chat/completions")
async def chat_completions(req: ChatRequest):
    if pipeline_obj is None:
        return {"error": "Model not loaded yet, please wait..."}

    try:
        print(f"Input: {req.messages[-1].content[:100]}...")
        content = generate_response(req.messages, req.max_tokens, req.temperature)
        print(f"Output: {content[:100]}...")
    except Exception as e:
        import traceback
        traceback.print_exc()
        content = json.dumps({"error": str(e)}, ensure_ascii=False)

    return {
        "id": "chatcmpl-" + str(uuid.uuid4())[:8],
        "object": "chat.completion",
        "created": int(time.time()),
        "model": MODEL_ID,
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": content},
            "finish_reason": "stop"
        }],
        "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
    }

# ============ 启动 ============
if __name__ == "__main__":
    load_model()
    print(f"\nServer running at http://{HOST}:{PORT}")
    print(f"\nChrome extension config:")
    print(f"  API address: http://localhost:{PORT}")
    print(f"  Model: {MODEL_ID}")
    uvicorn.run(app, host=HOST, port=PORT)
