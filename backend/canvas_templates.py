"""Canvas template routing for common complex objects."""

TEMPLATES = {
    "pikachu": {
        "aliases": ("皮卡丘", "pikachu"),
        "label": "皮卡丘",
        "tts": "好的，我用 Canvas 模板画了一个皮卡丘。",
    },
    "cat": {
        "aliases": ("小猫", "猫", "猫咪", "橘猫", "kitten", "cat"),
        "label": "小猫",
        "tts": "好的，我用 Canvas 模板画了一只小猫。",
    },

    "dog": {
        "aliases": ("小狗", "狗", "狗狗", "puppy", "dog"),
        "label": "小狗",
        "tts": "好的，我用 Canvas 模板画了一只小狗。",
    },
    "rabbit": {
        "aliases": ("兔子", "小兔子", "兔兔", "rabbit", "bunny"),
        "label": "兔子",
        "tts": "好的，我用 Canvas 模板画了一只兔子。",
    },
    "fish": {
        "aliases": ("鱼", "小鱼", "金鱼", "fish"),
        "label": "小鱼",
        "tts": "好的，我用 Canvas 模板画了一条小鱼。",
    },
    "flower": {
        "aliases": ("花", "花朵", "小花", "flower"),
        "label": "花朵",
        "tts": "好的，我用 Canvas 模板画了一朵花。",
    },
    "car": {
        "aliases": ("汽车", "小汽车", "轿车", "car"),
        "label": "汽车",
        "tts": "好的，我用 Canvas 模板画了一辆汽车。",
    },
    "rocket": {
        "aliases": ("火箭", "rocket"),
        "label": "火箭",
        "tts": "好的，我用 Canvas 模板画了一枚火箭。",
    },
    "sea_scene": {
        "aliases": ("海边", "大海", "海滩", "沙滩", "海边场景", "sea", "beach"),
        "label": "海边场景",
        "tts": "好的，我用 Canvas 模板画了一个海边场景。",
    },
    "forest_scene": {
        "aliases": ("森林", "树林", "森林场景", "forest"),
        "label": "森林场景",
        "tts": "好的，我用 Canvas 模板画了一个森林场景。",
    },
    "person": {
        "aliases": ("人物", "小男孩", "小女孩", "男孩", "女孩", "person", "boy", "girl"),
        "label": "人物",
        "tts": "好的，我用 Canvas 模板画了一个人物。",
    },
    "robot": {
        "aliases": ("机器人", "robot", "机械人"),
        "label": "机器人",
        "tts": "好的，我用 Canvas 模板画了一个机器人。",
    },
    "house_scene": {
        "aliases": ("房子", "小房子", "房屋", "小屋", "house"),
        "label": "房子场景",
        "tts": "好的，我用 Canvas 模板画了一个房子场景。",
    },
}


def match_canvas_template(text: str) -> dict | None:
    normalized = (text or "").lower().replace(" ", "")
    if not normalized:
        return None

    # Explicitly styled/open-ended requests should stay on the AI image route.
    ai_intent_words = ("插画", "海报", "照片", "写实", "精美", "复杂", "赛博朋克", "生成图片", "生成一张", "画一幅")
    if any(word in normalized for word in ai_intent_words):
        return None

    for name, template in TEMPLATES.items():
        for alias in template["aliases"]:
            if alias.lower().replace(" ", "") in normalized:
                return {
                    "name": name,
                    "label": template["label"],
                    "tts": template["tts"],
                }
    return None
