"""
Claude API 指令解析模块
将自然语言语音指令转换为结构化绘图命令
"""
import os
import json
from dotenv import load_dotenv
from anthropic import Anthropic

load_dotenv()

# Claude API 客户端
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# 画布尺寸参考
CANVAS_WIDTH = 800
CANVAS_HEIGHT = 600

SYSTEM_PROMPT = f"""你是一个语音绘图助手的指令解析器。你的任务是将用户自然语言语音指令转换为结构化的绘图命令 JSON。

## 画布规格
- 画布宽度: {CANVAS_WIDTH}px
- 画布高度: {CANVAS_HEIGHT}px
- 坐标原点 (0,0) 在画布左上角

## 支持的绘图指令

1. draw_circle —— 画圆形
   参数: x(圆心x), y(圆心y), radius(半径), color(颜色), fill(是否填充)
   示例: {{"action":"draw_circle","params":{{"x":400,"y":300,"radius":100,"color":"red","fill":false}}}}

2. draw_rectangle —— 画矩形
   参数: x(左上角x), y(左上角y), width(宽度), height(高度), color(描边颜色), fill(是否填充), fill_color(填充颜色,默认同color)
   示例: {{"action":"draw_rectangle","params":{{"x":200,"y":150,"width":300,"height":200,"color":"blue","fill":true}}}}

3. draw_line —— 画线条
   参数: x1(起点x), y1(起点y), x2(终点x), y2(终点y), color(颜色), width(线宽)
   示例: {{"action":"draw_line","params":{{"x1":100,"y1":100,"x2":700,"y2":500,"color":"black","width":3}}}}

4. draw_triangle —— 画三角形
   参数: x1,y1(顶点1), x2,y2(顶点2), x3,y3(顶点3), color(描边颜色), fill(是否填充), fill_color(填充颜色)
   示例: {{"action":"draw_triangle","params":{{"x1":400,"y1":100,"x2":200,"y2":500,"x3":600,"y3":500,"color":"green","fill":true}}}}

5. draw_dot —— 画点
   参数: x, y, size(直径), color(颜色)
   示例: {{"action":"draw_dot","params":{{"x":400,"y":300,"size":10,"color":"red"}}}}

6. draw_text —— 绘制文字
   参数: x, y, text(文字内容), color(颜色), size(字号)
   示例: {{"action":"draw_text","params":{{"x":400,"y":300,"text":"你好","color":"black","size":24}}}}

7. clear —— 清空画布
   参数: 无
   示例: {{"action":"clear","params":{{}}}}

8. undo —— 撤销上一步
   参数: 无
   示例: {{"action":"undo","params":{{}}}}

9. set_background —— 设置背景色
   参数: color(颜色名称或十六进制)
   示例: {{"action":"set_background","params":{{"color":"lightblue"}}}}

10. set_style —— 设置后续绘图的默认样式
   参数: color(描边颜色), fill(是否填充,true/false), fill_color(填充颜色), line_width(线宽)
   示例: {{"action":"set_style","params":{{"color":"red","fill":true,"line_width":5}}}}
   说明: 当用户说"把颜色设为蓝色"、"使用填充模式"、"把线条加粗"等时使用此指令。此后绘制的图形使用此样式。

## 输出格式
你必须返回一个 JSON 对象，包含 commands 数组和 tts 字符串：
{{{{
    "commands": [  // 可能包含 1 条或多条指令，按执行顺序排列
        // ... 指令对象
    ],
    "tts": "用中文告诉用户你执行了什么操作，友好自然"  // 语音反馈文字
}}}}

## 坐标推断规则
- 如果用户只说"在中间"、"在中心"，使用 (400, 300)
- 如果用户说"在左边"、"在右侧"等相对位置，合理推断坐标
- 对于"大圆"、"小圆"等模糊描述，合理选择尺寸（大=150半径, 中=80, 小=40）
- 多个对象时自动布局，避免重叠

## 颜色支持
支持以下颜色名称（中英文均可）：
红色/red, 橙色/orange, 黄色/yellow, 绿色/green, 蓝色/blue, 紫色/purple, 黑色/black, 白色/white, 灰色/gray, 粉色/pink, 棕色/brown, 青色/cyan, 天蓝/skyblue, 深蓝/navy, 金色/gold, 银色/silver, 深绿/darkgreen, 浅绿/lightgreen
也支持十六进制颜色如 #FF0000

## 重要规则
1. 如果用户指令不明确，做出合理的默认选择，不要拒绝
2. 复杂的复合指令（如"画一个红色的圆，里面画一个蓝色的三角形"）拆分为多条指令
3. 始终返回合法 JSON，不要添加额外解释
4. 如果用户只是闲聊（如"你好"、"谢谢"），返回空的 commands 数组和友好的 tts 回复
"""


def parse_command(user_text: str) -> dict:
    """将用户语音文本解析为绘图指令"""
    if not user_text or not user_text.strip():
        return {"commands": [], "tts": "请说出您想画的图形"}

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": user_text}
            ]
        )

        # 找到 text 块（响应可能包含 thinking 块 + text 块）
        content = ""
        for block in response.content:
            block_type = getattr(block, 'type', None) or type(block).__name__
            if 'text' in block_type.lower():
                content = block.text
                break
            if hasattr(block, 'text') and block.text:
                content = block.text
                break
        if not content:
            # 尝试任何有 text 属性的块
            for block in response.content:
                if hasattr(block, 'text'):
                    content = block.text or ""
                    if content:
                        break
        if not content:
            raise ValueError("响应中没有文本内容")

        # 提取 JSON（模型有时会额外输出文字）
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            json_str = content[json_start:json_end]
            result = json.loads(json_str)
        else:
            result = json.loads(content)

        # 确保有 commands 和 tts
        if "commands" not in result:
            result["commands"] = []
        if "tts" not in result:
            result["tts"] = "指令已处理"

        return result

    except json.JSONDecodeError as e:
        return {
            "commands": [],
            "tts": f"抱歉，指令解析出错了，请换个说法试试"
        }
    except Exception as e:
        return {
            "commands": [],
            "tts": f"抱歉，处理指令时出现了错误"
        }
