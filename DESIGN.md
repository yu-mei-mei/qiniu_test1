# AI 语音绘图工具 - 设计文档

## 1. 项目概述

一款纯语音控制的 AI 绘图工具，用户无需使用鼠标或键盘，仅通过语音指令即可完成绘图创作。系统利用 MediaRecorder 录音并由后端 ASR 服务进行语音识别，DeepSeek API 将自然语言指令解析为结构化绘图命令，最终在 HTML Canvas 上呈现。

## 2. 技术架构

```
┌──────────────────────────────────────────────┐
│              前端 (Web 浏览器)                  │
│                                               │
│  ┌──────────────┐    ┌──────────────────┐     │
│  │ VoiceController│   │   DrawEngine     │     │
│  │ (MediaRecorder │──►│  (Canvas 2D)     │     │
│  │  浏览器录音)    │   │  绘图、撤销/重做  │     │
│  └──────┬───────┘    └──────────────────┘     │
│         │ HTTP POST /api/voice                 │
│         ▼                                      │
│  ┌──────────────────────────────────────┐      │
│  │         CommandClient               │      │
│  │   (上传音频，接收结构化指令)          │      │
│  └──────────────────────────────────────┘      │
└─────────────────────┬─────────────────────────┘
                      │ JSON
                      ▼
┌──────────────────────────────────────────────┐
│             后端 (Python/FastAPI)              │
│                                               │
│  ┌──────────────────────────────────────┐     │
│  │         /api/voice 接口              │     │
│  │  POST 接收浏览器录音文件              │     │
│  └──────────────┬───────────────────────┘     │
│                 ▼                             │
│  ┌──────────────────────────────────────┐     │
│  │         asr.py                       │     │
│  │   调用 ASR 服务转写语音为文本         │     │
│  └──────────────┬───────────────────────┘     │
│                 ▼                             │
│  ┌──────────────────────────────────────┐     │
│  │         command_parser.py            │     │
│  │   调用 DeepSeek API 解析自然语言指令      │     │
│  │   → 返回结构化 JSON 绘图命令           │     │
│  └──────────────────────────────────────┘     │
└──────────────────────────────────────────────┘
```

### 核心技术选型

| 模块 | 技术 | 选型理由 |
|------|------|----------|
| 语音识别 | MediaRecorder + 后端 ASR | 避免浏览器 Web Speech 网络限制，支持服务端可配置语音识别 |
| 绘图引擎 | HTML Canvas 2D | 功能丰富，性能优秀，像素级撤销/重做支持 |
| 后端框架 | FastAPI (Python) | 异步支持好，便于集成 OpenAI-compatible API |
| 指令解析 | DeepSeek API | 自然语言理解能力强，支持复杂指令拆解和空间推理 |
| AI 生图 | OpenAI Images API（可选） | 复杂对象和开放式创作可直接生成图片，再绘制到 Canvas |
| 语音合成 | Web Speech Synthesis | 浏览器内置，无需额外服务 |
| 通信协议 | HTTP REST (JSON) | 简单可靠，单接口满足需求 |

## 3. 指令能力清单

### 3.1 计划支持的指令

#### 图形绘制
- [x] 画圆形 (`draw_circle`)
- [x] 画矩形 (`draw_rectangle`)
- [x] 画线条 (`draw_line`)
- [x] 画三角形 (`draw_triangle`)
- [x] 画点 (`draw_dot`)
- [x] 绘制文字 (`draw_text`)
- [x] 画椭圆 (`draw_ellipse`)
- [x] 画多边形 (`draw_polygon`)
- [x] 画圆角矩形 (`draw_rounded_rectangle`)
- [x] 画圆弧 (`draw_arc`)
- [x] 画自由曲线路径 (`draw_path`)

#### 样式控制
- [x] 颜色设置（支持中英文 20+ 种颜色）
- [x] 填充/描边切换
- [x] 线条粗细

#### 画布管理
- [x] 清空画布 (`clear`)
- [x] 撤销 (`undo`)
- [x] 重做 (`redo`)
- [x] 设置背景色 (`set_background`)
- [x] 默认样式设置 (`set_style`)

#### 空间布局
- [x] 绝对位置（左上、右下、中间等 9 宫格区域）
- [x] 相对位置（在...左边/右边/上方/下方/里面）
- [x] 行列布局（排成一行/一列，等距分布）
- [x] 对称布局
- [x] 复杂对象自动拆解（"画一个房子"→ 矩形+三角形）
- [x] 常见复杂对象模板库（如"皮卡丘"走前端高质量 Canvas 模板）
- [x] 可选 AI 生图模式（复杂对象优先生成图片，未配置 Key 时回退 Canvas 命令）

#### 交互反馈
- [x] 实时显示识别文字（中间结果 + 最终结果）
- [x] 语音合成回复（TTS 播报）
- [x] 指令历史记录
- [x] 实时画布状态（动作计数、撤销/重做步数）
- [x] 聆听/处理/错误状态指示

### 3.2 最终实现清单

以上计划的所有指令能力**已全部实现**，覆盖了基本绘图、样式控制、画布管理、空间布局、交互反馈五大类功能。

### 3.3 未完成及原因

| 未实现功能 | 原因说明 |
|-----------|----------|
| 画笔/自由绘制模式 | 语音控制难以精确描述自由曲线的路径点，且线条跟踪需要实时坐标反馈，纯语音体验不佳 |
| 图片导出/保存 | 属于增强功能，核心绘图流程完成后可作为后续扩展 |
| 多用户协作 | 超出项目范围 |
| 语音指令的连续对话上下文 | 当前每次指令独立解析，没有记忆之前的操作状态。后续可通过在请求中携带历史指令上下文实现 |
| 画布缩放/平移 | 纯语音控制缩放操作比较笨拙，需要更精细的语音指令设计 |

## 4. PR 提交记录

| PR | 分支 | 功能 | 状态 |
|----|------|------|------|
| #1 | pr1-project-scaffold | 项目骨架 + Canvas 画布 | ✅ 已合并 |
| #2 | pr2-speech-recognition | Web Speech API 语音识别 | ✅ 已合并 |
| #3 | pr3-command-parser | 后端 AI 指令解析 | ✅ 已合并 |
| #4 | pr4-frontend-integration | 前后端打通 + 基本绘图 | ✅ 已合并 |
| #5 | pr5-color-style | 颜色与样式支持 | ✅ 已合并 |
| #6 | pr6-canvas-management | 绘图管理（撤销/重做） | ✅ 已合并 |
| #7 | pr7-relative-position | 复杂图形与相对位置 | ✅ 已合并 |
| #8 | pr8-ux-enhancement | 用户体验增强（深色主题） | ✅ 已合并 |
| #9 | pr9-design-doc | 设计文档 | ✅ 已合并 |

## 5. 运行方式

### 5.1 环境准备

```bash
# 1. 安装依赖
cd backend
pip install -r requirements.txt

# 2. 配置 API Key
cp .env.example .env
# 编辑 .env 填入你的 DEEPSEEK_API_KEY
```

### 5.2 启动应用

```bash
# 方式一：开发模式（热重载）
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 方式二：生产模式
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

打开浏览器访问 `http://localhost:8000`

### 5.3 使用示例

启动后对着麦克风说出以下指令：

- **基本图形**："画一个红色圆形"、"画一个蓝色矩形"、"画一条绿色线条"
- **颜色**："把颜色设为蓝色，然后画一个圆形"、"画一个天蓝色的圆"
- **填充**："画一个黄色填充的三角形"
- **相对位置**："在左边画一个圆，在右边画一个矩形"
- **布局**："画三个圆形排成一行，红黄蓝"
- **复合对象**："画一个房子"（自动拆解为矩形+三角形）
- **撤销**："撤销上一步"、"重做"
- **管理**："清空画布"、"把背景色设为浅蓝色"

## 6. 指令协议

前后端通信采用统一的 JSON 协议：

```json
// 请求
POST /api/parse
{
    "text": "画一个红色圆形在中间"
}

// 响应
{
    "commands": [
        {
            "action": "draw_circle",
            "params": {
                "x": 400,
                "y": 300,
                "radius": 80,
                "color": "red",
                "fill": true
            }
        }
    ],
    "tts": "好的，我在画布中央画了一个红色的圆形。"
}
```

### 支持的 Actions

| Action | 说明 | 关键参数 |
|--------|------|----------|
| `draw_circle` | 画圆形 | x, y, radius, color, fill |
| `draw_rectangle` | 画矩形 | x, y, width, height, color, fill, fill_color |
| `draw_line` | 画线条 | x1, y1, x2, y2, color, width |
| `draw_triangle` | 画三角形 | x1, y1, x2, y2, x3, y3, color, fill |
| `draw_dot` | 画点 | x, y, size, color |
| `draw_text` | 绘制文字 | x, y, text, color, size |
| `draw_ellipse` | 画椭圆 | x, y, radius_x, radius_y, rotation, color, fill |
| `draw_rounded_rectangle` | 画圆角矩形 | x, y, width, height, radius, color, fill |
| `draw_polygon` | 画多边形 | points, color, fill |
| `draw_arc` | 画圆弧 | x, y, radius, start_angle, end_angle, color, width |
| `draw_path` | 画自由曲线路径 | segments, color, width, fill, close |
| `set_style` | 设置默认样式 | color, fill, line_width |
| `clear` | 清空画布 | — |
| `undo` | 撤销 | — |
| `redo` | 重做 | — |
| `set_background` | 设置背景色 | color |

## 7. 项目结构

```
qiniu_test_1/
├── backend/
│   ├── __init__.py           # Python 包标识
│   ├── main.py               # FastAPI 应用入口
│   ├── command_parser.py     # DeepSeek API 指令解析
│   ├── requirements.txt      # Python 依赖
│   ├── .env                  # API Key 配置（不提交）
│   └── .env.example          # 环境变量模板
│   ├── image_generator.py   # AI 图片生成（可选）
├── frontend/
│   ├── index.html            # 主页面（深色主题 UI）
│   ├── app.js                # 应用逻辑（语音识别、通信）
│   └── drawer.js             # Canvas 绘图引擎
├── DESIGN.md                 # 本设计文档
└── .gitignore
```

## 8. 性能与优化

### 指令响应延迟
- **语音识别**：浏览器分段录音上传，ASR 返回文本，延迟约 2-5s（取决于音频长度和网络）
- **指令解析**：DeepSeek API 调用约 1-3s（含网络往返）
- **绘图渲染**：Canvas 操作 < 10ms
- **总延迟**：从说完话到看到图形约 2-5s

### 容错处理
- 语音识别失败自动重启（非致命错误）
- DeepSeek 解析失败返回友好提示
- 绘图引擎捕获异常防止崩溃
- canvas-info 实时反馈操作状态
