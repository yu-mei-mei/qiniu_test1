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

    for name, template in TEMPLATES.items():
        for alias in template["aliases"]:
            if alias.lower().replace(" ", "") in normalized:
                return {
                    "name": name,
                    "label": template["label"],
                    "tts": template["tts"],
                }
    return None
