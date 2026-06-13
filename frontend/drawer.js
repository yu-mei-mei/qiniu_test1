/**
 * AI 语音绘图工具 - Canvas 绘图引擎
 * 支持圆形、矩形、线条、三角形、点、文字等图形
 * 支持样式管理、撤销/重做、画布控制
 */

class DrawEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // 撤销/重做历史栈
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = 50;

        // 样式状态
        this.style = {
            strokeColor: '#2d3436',
            fillColor: '#0984e3',
            fillMode: true,
            lineWidth: 3,
        };

        // 背景色
        this.bgColor = '#ffffff';

        // 操作计数
        this.actionCount = 0;

        // 中文颜色映射表
        this.colorMap = {
            '红': '#e74c3c', '红色': '#e74c3c',
            '橙': '#e67e22', '橙色': '#e67e22',
            '黄': '#f1c40f', '黄色': '#f1c40f',
            '绿': '#2ecc71', '绿色': '#2ecc71',
            '青': '#1abc9c', '青色': '#1abc9c',
            '蓝': '#3498db', '蓝色': '#3498db',
            '紫': '#9b59b6', '紫色': '#9b59b6',
            '粉': '#e84393', '粉色': '#e84393', '粉红': '#e84393',
            '棕': '#8B4513', '棕色': '#8B4513',
            '黑': '#2d3436', '黑色': '#2d3436',
            '白': '#ffffff', '白色': '#ffffff',
            '灰': '#95a5a6', '灰色': '#95a5a6',
            '深蓝': '#2c3e50',
            '天蓝': '#87CEEB',
            '深绿': '#27ae60',
            '浅绿': '#a8e6cf',
            '金': '#f39c12', '金色': '#f39c12',
            '银': '#bdc3c7', '银色': '#bdc3c7',
        };

        // 初始化空白画布
        this._saveSnapshot();
        this._renderBackground();
    }

    // ===== 绘图方法 =====

    drawCircle(x = 400, y = 300, radius = 80, color, fill) {
        const c = this._resolveColor(color);
        const f = fill !== undefined ? fill : this.style.fillMode;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this._applyStroke(c);
        if (f) this._applyFill(c);
        if (f) this.ctx.fill();
        this.ctx.stroke();
        return this._commit('draw_circle');
    }

    drawRectangle(x = 200, y = 150, width = 200, height = 200, color, fill, fillColor) {
        const c = this._resolveColor(color);
        const fc = fillColor ? this._resolveColor(fillColor) : c;
        const f = fill !== undefined ? fill : this.style.fillMode;
        this.ctx.beginPath();
        this.ctx.rect(x, y, width, height);
        this._applyStroke(c);
        if (f) this._applyFill(fc);
        if (f) this.ctx.fill();
        this.ctx.stroke();
        return this._commit('draw_rectangle');
    }

    drawLine(x1, y1, x2, y2, color, width) {
        const c = this._resolveColor(color);
        const w = width || this.style.lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = c;
        this.ctx.lineWidth = w;
        this.ctx.stroke();
        return this._commit('draw_line');
    }

    drawTriangle(x1, y1, x2, y2, x3, y3, color, fill, fillColor) {
        const c = this._resolveColor(color);
        const fc = fillColor ? this._resolveColor(fillColor) : c;
        const f = fill !== undefined ? fill : this.style.fillMode;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineTo(x3, y3);
        this.ctx.closePath();
        this._applyStroke(c);
        if (f) this._applyFill(fc);
        if (f) this.ctx.fill();
        this.ctx.stroke();
        return this._commit('draw_triangle');
    }

    drawDot(x = 400, y = 300, size = 10, color) {
        const c = this._resolveColor(color);
        const r = (size || 10) / 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.fillStyle = c;
        this.ctx.fill();
        return this._commit('draw_dot');
    }

    drawText(x = 400, y = 300, text = '', color, size = 24) {
        const c = this._resolveColor(color);
        const s = size || 24;
        this.ctx.font = `${s}px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = c;
        this.ctx.fillText(text, x, y);
        return this._commit('draw_text');
    }


    drawImage(dataUrl, url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this._renderBackground();
                const scale = Math.min(this.width / img.width, this.height / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                const x = (this.width - w) / 2;
                const y = (this.height - h) / 2;
                this.ctx.drawImage(img, x, y, w, h);
                this._commit('draw_image');
                resolve(this);
            };
            img.onerror = reject;
            img.src = dataUrl || url;
        });
    }


    drawEllipse(x = 400, y = 300, radiusX = 100, radiusY = 60, rotation = 0, color, fill, fillColor) {
        const c = this._resolveColor(color);
        const fc = fillColor ? this._resolveColor(fillColor) : c;
        const f = fill !== undefined ? fill : this.style.fillMode;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, radiusX, radiusY, rotation || 0, 0, Math.PI * 2);
        this._applyStroke(c);
        if (f) this._applyFill(fc);
        if (f) this.ctx.fill();
        this.ctx.stroke();
        return this._commit('draw_ellipse');
    }

    drawRoundedRectangle(x = 200, y = 150, width = 200, height = 140, radius = 24, color, fill, fillColor) {
        const c = this._resolveColor(color);
        const fc = fillColor ? this._resolveColor(fillColor) : c;
        const f = fill !== undefined ? fill : this.style.fillMode;
        const r = Math.min(radius || 0, width / 2, height / 2);
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + width - r, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        this.ctx.lineTo(x + width, y + height - r);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        this.ctx.lineTo(x + r, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        this.ctx.closePath();
        this._applyStroke(c);
        if (f) this._applyFill(fc);
        if (f) this.ctx.fill();
        this.ctx.stroke();
        return this._commit('draw_rounded_rectangle');
    }

    drawPolygon(points = [], color, fill, fillColor) {
        if (!Array.isArray(points) || points.length < 2) return this;
        const c = this._resolveColor(color);
        const fc = fillColor ? this._resolveColor(fillColor) : c;
        const f = fill !== undefined ? fill : this.style.fillMode;
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.closePath();
        this._applyStroke(c);
        if (f) this._applyFill(fc);
        if (f) this.ctx.fill();
        this.ctx.stroke();
        return this._commit('draw_polygon');
    }

    drawArc(x = 400, y = 300, radius = 80, startAngle = 0, endAngle = Math.PI, color, width) {
        const c = this._resolveColor(color);
        const w = width || this.style.lineWidth;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, startAngle, endAngle);
        this.ctx.strokeStyle = c;
        this.ctx.lineWidth = w;
        this.ctx.stroke();
        return this._commit('draw_arc');
    }

    drawPath(segments = [], color, fill, fillColor, width, close = false) {
        if (!Array.isArray(segments) || segments.length === 0) return this;
        const c = this._resolveColor(color);
        const fc = fillColor ? this._resolveColor(fillColor) : c;
        const f = fill === true;
        this.ctx.beginPath();
        for (const segment of segments) {
            switch (segment.type) {
                case 'move':
                    this.ctx.moveTo(segment.x, segment.y);
                    break;
                case 'line':
                    this.ctx.lineTo(segment.x, segment.y);
                    break;
                case 'quadratic':
                    this.ctx.quadraticCurveTo(segment.cpx, segment.cpy, segment.x, segment.y);
                    break;
                case 'bezier':
                    this.ctx.bezierCurveTo(segment.cp1x, segment.cp1y, segment.cp2x, segment.cp2y, segment.x, segment.y);
                    break;
                case 'arc':
                    this.ctx.arc(segment.x, segment.y, segment.radius, segment.start_angle || 0, segment.end_angle || Math.PI * 2);
                    break;
                case 'close':
                    this.ctx.closePath();
                    break;
            }
        }
        if (close) this.ctx.closePath();
        this.ctx.strokeStyle = c;
        this.ctx.lineWidth = width || this.style.lineWidth;
        if (f) {
            this._applyFill(fc);
            this.ctx.fill();
        }
        this.ctx.stroke();
        return this._commit('draw_path');
    }



    // ===== 模板绘制 =====

    drawTemplate(name, params = {}) {
        switch (name) {
            case 'pikachu':
                return this._drawPikachuTemplate(params);
            case 'cat':
                return this._drawCatTemplate(params);
            case 'robot':
                return this._drawRobotTemplate(params);
            case 'house_scene':
                return this._drawHouseSceneTemplate(params);
            default:
                return false;
        }
    }

    _drawCatTemplate() {
        const ctx = this.ctx;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 5;

        const fur = '#f49b38';
        const furDark = '#d46f1f';
        const cream = '#ffe0a6';
        const ink = '#2d2118';
        const pink = '#f28aa8';

        const bg = ctx.createLinearGradient(0, 0, 0, this.height);
        bg.addColorStop(0, '#fff7df');
        bg.addColorStop(1, '#f7e8c2');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, this.width, this.height);

        // Soft ground shadow.
        ctx.beginPath();
        ctx.ellipse(400, 525, 175, 30, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(90, 60, 30, 0.16)';
        ctx.fill();

        // Tail behind the body.
        ctx.beginPath();
        ctx.moveTo(510, 405);
        ctx.bezierCurveTo(650, 345, 670, 210, 565, 190);
        ctx.bezierCurveTo(520, 182, 510, 242, 562, 258);
        ctx.strokeStyle = furDark;
        ctx.lineWidth = 36;
        ctx.stroke();
        ctx.strokeStyle = ink;
        ctx.lineWidth = 5;
        ctx.stroke();

        // Body and belly.
        ctx.beginPath();
        ctx.ellipse(400, 395, 125, 145, 0, 0, Math.PI * 2);
        ctx.fillStyle = fur;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 5;
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(400, 420, 72, 86, 0, 0, Math.PI * 2);
        ctx.fillStyle = cream;
        ctx.fill();

        // Head.
        ctx.beginPath();
        ctx.ellipse(400, 245, 128, 105, 0, 0, Math.PI * 2);
        ctx.fillStyle = fur;
        ctx.strokeStyle = ink;
        ctx.fill();
        ctx.stroke();

        // Ears.
        this._drawTrianglePatch(306, 190, 286, 62, 385, 148, fur, ink);
        this._drawTrianglePatch(494, 190, 514, 62, 415, 148, fur, ink);
        this._drawTrianglePatch(319, 170, 303, 98, 367, 152, pink, 'rgba(0,0,0,0)');
        this._drawTrianglePatch(481, 170, 497, 98, 433, 152, pink, 'rgba(0,0,0,0)');

        // Face.
        this._fillCircle(355, 235, 18, ink);
        this._fillCircle(445, 235, 18, ink);
        this._fillCircle(362, 228, 6, '#ffffff');
        this._fillCircle(452, 228, 6, '#ffffff');
        this._fillCircle(400, 270, 9, '#5b2b1b');

        ctx.beginPath();
        ctx.moveTo(400, 279);
        ctx.bezierCurveTo(385, 292, 366, 292, 355, 282);
        ctx.moveTo(400, 279);
        ctx.bezierCurveTo(415, 292, 434, 292, 445, 282);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Whiskers.
        ctx.lineWidth = 3;
        [[325, 266, 260, 246], [326, 282, 258, 286], [326, 298, 268, 326], [475, 266, 540, 246], [474, 282, 542, 286], [474, 298, 532, 326]].forEach(([x1, y1, x2, y2]) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        });

        // Paws.
        this._drawPaw(330, 520, furDark, ink);
        this._drawPaw(470, 520, furDark, ink);

        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(45, 33, 24, 0.72)';
        ctx.fillText('Canvas Cat', 400, 575);

        ctx.restore();
        return this._commit('template_cat');
    }

    _drawRobotTemplate() {
        const ctx = this.ctx;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const bg = ctx.createLinearGradient(0, 0, this.width, this.height);
        bg.addColorStop(0, '#e9fbff');
        bg.addColorStop(1, '#d8e7ff');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, this.width, this.height);

        const metal = '#9fb4c7';
        const dark = '#243447';
        const panel = '#dce8f2';
        const blue = '#35c5ff';
        const yellow = '#ffd166';

        ctx.strokeStyle = dark;
        ctx.lineWidth = 6;

        // Antenna.
        ctx.beginPath();
        ctx.moveTo(400, 118);
        ctx.lineTo(400, 76);
        ctx.stroke();
        this._fillCircle(400, 66, 14, '#ff5c7a');

        // Head.
        this._roundedRectPath(285, 125, 230, 160, 28);
        ctx.fillStyle = metal;
        ctx.fill();
        ctx.stroke();

        // Face panel.
        this._roundedRectPath(318, 162, 164, 82, 18);
        ctx.fillStyle = '#172331';
        ctx.fill();

        this._fillCircle(365, 202, 18, blue);
        this._fillCircle(435, 202, 18, blue);
        ctx.beginPath();
        ctx.moveTo(370, 238);
        ctx.lineTo(430, 238);
        ctx.strokeStyle = blue;
        ctx.lineWidth = 5;
        ctx.stroke();

        // Ears.
        this._roundedRectPath(252, 175, 34, 74, 12);
        ctx.fillStyle = '#71869a';
        ctx.fill();
        ctx.strokeStyle = dark;
        ctx.lineWidth = 5;
        ctx.stroke();
        this._roundedRectPath(514, 175, 34, 74, 12);
        ctx.fill();
        ctx.stroke();

        // Neck and body.
        this._roundedRectPath(365, 285, 70, 42, 12);
        ctx.fillStyle = '#71869a';
        ctx.fill();
        ctx.stroke();

        this._roundedRectPath(270, 320, 260, 180, 34);
        ctx.fillStyle = metal;
        ctx.fill();
        ctx.stroke();

        this._roundedRectPath(320, 350, 160, 92, 18);
        ctx.fillStyle = panel;
        ctx.fill();
        ctx.stroke();

        // Buttons and gauge.
        this._fillCircle(355, 396, 14, '#ef476f');
        this._fillCircle(400, 396, 14, yellow);
        this._fillCircle(445, 396, 14, '#06d6a0');
        ctx.beginPath();
        ctx.arc(400, 438, 34, Math.PI, 0);
        ctx.strokeStyle = dark;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(400, 438);
        ctx.lineTo(424, 418);
        ctx.stroke();

        // Arms and legs.
        this._drawRobotArm(270, 360, 205, 438, -1);
        this._drawRobotArm(530, 360, 595, 438, 1);
        this._drawRobotLeg(340, 500);
        this._drawRobotLeg(460, 500);

        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(36, 52, 71, 0.7)';
        ctx.fillText('Canvas Robot', 400, 575);

        ctx.restore();
        return this._commit('template_robot');
    }

    _drawHouseSceneTemplate() {
        const ctx = this.ctx;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const sky = ctx.createLinearGradient(0, 0, 0, this.height);
        sky.addColorStop(0, '#8bd3ff');
        sky.addColorStop(0.7, '#dff6ff');
        sky.addColorStop(1, '#c9f2b6');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, this.width, this.height);

        // Sun and clouds.
        this._fillCircle(100, 95, 42, '#ffd166');
        this._drawCloud(610, 95, 1.0);
        this._drawCloud(190, 145, 0.78);

        // Hills.
        ctx.beginPath();
        ctx.moveTo(0, 420);
        ctx.bezierCurveTo(170, 320, 290, 395, 420, 350);
        ctx.bezierCurveTo(560, 305, 680, 360, 800, 325);
        ctx.lineTo(800, 600);
        ctx.lineTo(0, 600);
        ctx.closePath();
        ctx.fillStyle = '#7cc576';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, 475);
        ctx.bezierCurveTo(220, 390, 430, 490, 800, 420);
        ctx.lineTo(800, 600);
        ctx.lineTo(0, 600);
        ctx.closePath();
        ctx.fillStyle = '#4fa95f';
        ctx.fill();

        // House body.
        ctx.strokeStyle = '#3d2b1f';
        ctx.lineWidth = 6;
        this._roundedRectPath(270, 320, 260, 170, 10);
        ctx.fillStyle = '#f6c06a';
        ctx.fill();
        ctx.stroke();

        // Roof.
        ctx.beginPath();
        ctx.moveTo(240, 325);
        ctx.lineTo(400, 210);
        ctx.lineTo(560, 325);
        ctx.closePath();
        ctx.fillStyle = '#b84c35';
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(400, 210);
        ctx.lineTo(585, 342);
        ctx.strokeStyle = 'rgba(61, 43, 31, 0.35)';
        ctx.lineWidth = 10;
        ctx.stroke();

        // Door and windows.
        this._roundedRectPath(375, 395, 58, 95, 12);
        ctx.fillStyle = '#7a4a2b';
        ctx.fill();
        ctx.strokeStyle = '#3d2b1f';
        ctx.lineWidth = 4;
        ctx.stroke();
        this._fillCircle(420, 443, 5, '#ffd166');

        this._drawWindow(300, 355);
        this._drawWindow(455, 355);

        // Trees and path.
        this._drawTree(165, 385, 1.0);
        this._drawTree(645, 400, 0.85);
        ctx.beginPath();
        ctx.moveTo(402, 490);
        ctx.bezierCurveTo(360, 535, 330, 560, 300, 600);
        ctx.lineTo(500, 600);
        ctx.bezierCurveTo(470, 560, 442, 535, 430, 490);
        ctx.closePath();
        ctx.fillStyle = '#d8b27c';
        ctx.fill();

        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(61, 43, 31, 0.72)';
        ctx.fillText('Canvas House Scene', 400, 575);

        ctx.restore();
        return this._commit('template_house_scene');
    }

    _drawPikachuTemplate() {
        const ctx = this.ctx;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#2b2118';
        ctx.lineWidth = 5;

        const yellow = '#ffd928';
        const shadowYellow = '#f3bd1b';
        const red = '#f05a42';
        const black = '#15120f';
        const brown = '#7b4a25';

        // Tail behind the body.
        ctx.beginPath();
        ctx.moveTo(570, 360);
        ctx.lineTo(670, 306);
        ctx.lineTo(636, 368);
        ctx.lineTo(704, 372);
        ctx.lineTo(610, 430);
        ctx.closePath();
        ctx.fillStyle = yellow;
        ctx.strokeStyle = '#2b2118';
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(585, 383);
        ctx.lineTo(622, 362);
        ctx.lineTo(646, 381);
        ctx.lineTo(602, 407);
        ctx.closePath();
        ctx.fillStyle = brown;
        ctx.fill();

        // Ears.
        this._drawEar(318, 210, 246, 42, 405, 173, yellow, black);
        this._drawEar(482, 173, 644, 42, 570, 210, yellow, black);

        // Body.
        ctx.beginPath();
        ctx.ellipse(400, 400, 145, 130, 0, 0, Math.PI * 2);
        ctx.fillStyle = yellow;
        ctx.strokeStyle = '#2b2118';
        ctx.lineWidth = 5;
        ctx.fill();
        ctx.stroke();

        // Head.
        ctx.beginPath();
        ctx.ellipse(400, 265, 130, 108, 0, 0, Math.PI * 2);
        ctx.fillStyle = yellow;
        ctx.strokeStyle = '#2b2118';
        ctx.fill();
        ctx.stroke();

        // Face cheeks.
        this._fillCircle(300, 302, 31, red);
        this._fillCircle(500, 302, 31, red);

        // Eyes and highlights.
        this._fillCircle(352, 238, 28, black);
        this._fillCircle(448, 238, 28, black);
        this._fillCircle(362, 228, 10, '#ffffff');
        this._fillCircle(438, 228, 10, '#ffffff');

        // Nose and mouth.
        ctx.beginPath();
        ctx.moveTo(400, 268);
        ctx.lineTo(389, 282);
        ctx.lineTo(411, 282);
        ctx.closePath();
        ctx.fillStyle = black;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(400, 284);
        ctx.bezierCurveTo(382, 302, 355, 302, 342, 286);
        ctx.moveTo(400, 284);
        ctx.bezierCurveTo(418, 302, 445, 302, 458, 286);
        ctx.strokeStyle = black;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Arms.
        ctx.beginPath();
        ctx.moveTo(286, 378);
        ctx.bezierCurveTo(240, 405, 244, 468, 300, 468);
        ctx.strokeStyle = '#2b2118';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(514, 378);
        ctx.bezierCurveTo(560, 405, 556, 468, 500, 468);
        ctx.stroke();

        // Belly shadow.
        ctx.beginPath();
        ctx.ellipse(400, 420, 88, 60, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 246, 128, 0.42)';
        ctx.fill();

        // Feet.
        ctx.beginPath();
        ctx.ellipse(328, 520, 48, 22, -0.12, 0, Math.PI * 2);
        ctx.ellipse(472, 520, 48, 22, 0.12, 0, Math.PI * 2);
        ctx.fillStyle = shadowYellow;
        ctx.strokeStyle = '#2b2118';
        ctx.fill();
        ctx.stroke();

        // Subtle label for clarity.
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(43, 33, 24, 0.75)';
        ctx.fillText('Pikachu', 400, 570);

        ctx.restore();
        return this._commit('template_pikachu');
    }

    _drawEar(ax, ay, bx, by, cx, cy, fillColor, tipColor) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo((ax + bx) / 2, by, cx, cy);
        ctx.quadraticCurveTo((ax + cx) / 2, cy + 24, ax, ay);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = '#2b2118';
        ctx.lineWidth = 5;
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo((bx + ax) / 2, by + 58, ax + (cx - ax) * 0.22, ay - 2);
        ctx.quadraticCurveTo((bx + cx) / 2, by + 58, cx - (cx - ax) * 0.22, cy - 2);
        ctx.closePath();
        ctx.fillStyle = tipColor;
        ctx.fill();
    }

    _fillCircle(x, y, radius, color) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    _drawTrianglePatch(x1, y1, x2, y2, x3, y3, fill, stroke) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke !== 'rgba(0,0,0,0)') {
            ctx.strokeStyle = stroke;
            ctx.stroke();
        }
    }

    _drawPaw(x, y, fill, stroke) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.ellipse(x, y, 42, 24, 0, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 4;
        ctx.fill();
        ctx.stroke();
        [x - 18, x, x + 18].forEach(px => this._fillCircle(px, y - 10, 5, '#ffd7a2'));
    }

    _roundedRectPath(x, y, width, height, radius) {
        const ctx = this.ctx;
        const r = Math.min(radius || 0, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    _drawRobotArm(x1, y1, x2, y2, direction) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#243447';
        ctx.lineWidth = 16;
        ctx.stroke();
        this._fillCircle(x2, y2, 24, '#9fb4c7');
        ctx.strokeStyle = '#243447';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x2 + direction * 2, y2);
        ctx.lineTo(x2 + direction * 28, y2 - 18);
        ctx.moveTo(x2 + direction * 2, y2);
        ctx.lineTo(x2 + direction * 28, y2 + 18);
        ctx.stroke();
    }

    _drawRobotLeg(x, y) {
        const ctx = this.ctx;
        this._roundedRectPath(x - 22, y, 44, 54, 12);
        ctx.fillStyle = '#71869a';
        ctx.strokeStyle = '#243447';
        ctx.lineWidth = 5;
        ctx.fill();
        ctx.stroke();
        this._roundedRectPath(x - 38, y + 48, 76, 26, 12);
        ctx.fillStyle = '#9fb4c7';
        ctx.fill();
        ctx.stroke();
    }

    _drawCloud(x, y, scale = 1) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        ctx.beginPath();
        ctx.ellipse(-42, 14, 42, 24, 0, 0, Math.PI * 2);
        ctx.ellipse(-12, -2, 38, 32, 0, 0, Math.PI * 2);
        ctx.ellipse(28, 10, 46, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    _drawWindow(x, y) {
        const ctx = this.ctx;
        this._roundedRectPath(x, y, 58, 50, 8);
        ctx.fillStyle = '#9be7ff';
        ctx.strokeStyle = '#3d2b1f';
        ctx.lineWidth = 4;
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 29, y + 2);
        ctx.lineTo(x + 29, y + 48);
        ctx.moveTo(x + 2, y + 25);
        ctx.lineTo(x + 56, y + 25);
        ctx.stroke();
    }

    _drawTree(x, y, scale = 1) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = '#7a4a2b';
        ctx.fillRect(-14, 40, 28, 72);
        ctx.fillStyle = '#2f8f4e';
        this._fillCircle(0, 18, 48, '#2f8f4e');
        this._fillCircle(-34, 42, 36, '#3fad5f');
        this._fillCircle(35, 42, 38, '#38a85a');
        ctx.restore();
    }

    // ===== 样式控制 =====

    setStyle(params = {}) {
        if (params.color) this.style.strokeColor = this._resolveColor(params.color);
        if (params.fill_color) this.style.fillColor = this._resolveColor(params.fill_color);
        if (params.fill !== undefined) this.style.fillMode = params.fill;
        if (params.line_width) this.style.lineWidth = params.line_width;
        if (params.lineWidth) this.style.lineWidth = params.lineWidth;
        // 样式变化不产生视觉快照
        return this;
    }

    // ===== 画布管理 =====

    /** 清空画布 */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.actionCount = 0;
        this._renderBackground();
        this._saveSnapshot();
        return this;
    }

    /** 撤销上一步 */
    undo() {
        if (this.undoStack.length <= 1) return this;
        const current = this.undoStack.pop();
        this.redoStack.push(current);
        this._restoreSnapshot();
        this.actionCount = Math.max(0, this.actionCount - 1);
        return this;
    }

    /** 重做 */
    redo() {
        if (this.redoStack.length === 0) return this;
        const snapshot = this.redoStack.pop();
        this.undoStack.push(snapshot);
        this.ctx.putImageData(snapshot, 0, 0);
        this.actionCount++;
        return this;
    }

    /** 设置背景色 */
    setBackground(color) {
        this.bgColor = this._resolveColor(color) || '#ffffff';
        this.undoStack = [];
        this.redoStack = [];
        this.actionCount = 0;
        this._renderBackground();
        this._saveSnapshot();
        return this;
    }

    /** 批量执行绘图命令 */
    executeCommands(commands) {
        if (!commands || !commands.length) return;
        for (const cmd of commands) {
            const { action, params } = cmd;
            try {
                switch (action) {
                    case 'draw_circle':
                        this.drawCircle(params.x, params.y, params.radius, params.color, params.fill);
                        break;
                    case 'draw_rectangle':
                        this.drawRectangle(params.x, params.y, params.width, params.height, params.color, params.fill, params.fill_color);
                        break;
                    case 'draw_line':
                        this.drawLine(params.x1, params.y1, params.x2, params.y2, params.color, params.width);
                        break;
                    case 'draw_triangle':
                        this.drawTriangle(params.x1, params.y1, params.x2, params.y2, params.x3, params.y3, params.color, params.fill, params.fill_color);
                        break;
                    case 'draw_dot':
                        this.drawDot(params.x, params.y, params.size, params.color);
                        break;
                    case 'draw_text':
                        this.drawText(params.x, params.y, params.text, params.color, params.size);
                        break;
                    case 'draw_ellipse':
                        this.drawEllipse(params.x, params.y, params.radius_x, params.radius_y, params.rotation, params.color, params.fill, params.fill_color);
                        break;
                    case 'draw_rounded_rectangle':
                        this.drawRoundedRectangle(params.x, params.y, params.width, params.height, params.radius, params.color, params.fill, params.fill_color);
                        break;
                    case 'draw_polygon':
                        this.drawPolygon(params.points, params.color, params.fill, params.fill_color);
                        break;
                    case 'draw_arc':
                        this.drawArc(params.x, params.y, params.radius, params.start_angle, params.end_angle, params.color, params.width);
                        break;
                    case 'draw_path':
                        this.drawPath(params.segments, params.color, params.fill, params.fill_color, params.width, params.close);
                        break;
                    case 'draw_template':
                        this.drawTemplate(params.name, params);
                        break;
                    case 'set_style':
                        this.setStyle(params);
                        break;
                    case 'clear':
                        this.clear();
                        break;
                    case 'undo':
                        this.undo();
                        break;
                    case 'redo':
                        this.redo();
                        break;
                    case 'set_background':
                        this.setBackground(params.color);
                        break;
                    default:
                        console.warn('未知指令:', action);
                }
            } catch (e) {
                console.error(`执行指令 ${action} 出错:`, e);
            }
        }
        return this;
    }

    /** 获取当前画布状态摘要 */
    getStatus() {
        return {
            actionCount: this.actionCount,
            undoSteps: this.undoStack.length,
            redoSteps: this.redoStack.length,
            style: { ...this.style },
            bgColor: this.bgColor,
        };
    }

    // ===== 内部方法 =====

    _resolveColor(color) {
        if (!color) return this.style.strokeColor;
        if (color.startsWith('#') || /^[a-zA-Z]+$/.test(color)) return color;
        return this.colorMap[color] || color;
    }

    _applyStroke(color) {
        this.ctx.strokeStyle = color || this.style.strokeColor;
        this.ctx.lineWidth = this.style.lineWidth;
    }

    _applyFill(color) {
        this.ctx.fillStyle = color || this.style.fillColor;
    }

    /** 提交一次绘图操作：保存快照，清空重做栈 */
    _commit(actionName) {
        this._saveSnapshot();
        this.redoStack = [];
        this.actionCount++;
        return this;
    }

    /** 保存画布快照到撤销栈 */
    _saveSnapshot() {
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        this.undoStack.push(imageData);
        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }
    }

    /** 恢复上一个快照 */
    _restoreSnapshot() {
        if (this.undoStack.length > 0) {
            this.ctx.putImageData(this.undoStack[this.undoStack.length - 1], 0, 0);
        }
    }

    /** 渲染背景 */
    _renderBackground() {
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /** 从历史快照重建画布（用于背景色变化后） */
    _rebuildFromHistory() {
        if (this.undoStack.length > 0) {
            // 重绘最新的快照（已经包含新背景）
            this.ctx.putImageData(this.undoStack[this.undoStack.length - 1], 0, 0);
        }
    }
}
