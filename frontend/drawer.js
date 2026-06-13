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
            case 'cylinder':
                return this._drawCylinderTemplate(params);
            case 'cone':
                return this._drawConeTemplate(params);
            case 'triangular_pyramid':
                return this._drawTriangularPyramidTemplate(params);
            case 'cube':
                return this._drawCubeTemplate(params);
            case 'sphere':
                return this._drawSphereTemplate(params);
            case 'pikachu':
                return this._drawPikachuTemplate(params);
            case 'cat':
                return this._drawCatTemplate(params);
            case 'dog':
                return this._drawDogTemplate(params);
            case 'rabbit':
                return this._drawRabbitTemplate(params);
            case 'fish':
                return this._drawFishTemplate(params);
            case 'flower':
                return this._drawFlowerTemplate(params);
            case 'car':
                return this._drawCarTemplate(params);
            case 'rocket':
                return this._drawRocketTemplate(params);
            case 'sea_scene':
                return this._drawSeaSceneTemplate(params);
            case 'forest_scene':
                return this._drawForestSceneTemplate(params);
            case 'person':
                return this._drawPersonTemplate(params);
            case 'robot':
                return this._drawRobotTemplate(params);
            case 'house_scene':
                return this._drawHouseSceneTemplate(params);
            default:
                return false;
        }
    }

    _drawCylinderTemplate() {
        const ctx = this.ctx;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        this._paintGradientBackground('#e8f4ff', '#cfe9f8');
        this._drawGroundShadow(400, 520, 150, 24);

        const x = 400, topY = 185, bottomY = 455, rx = 118, ry = 38;
        const side = ctx.createLinearGradient(x - rx, 0, x + rx, 0);
        side.addColorStop(0, '#9fb4c7');
        side.addColorStop(0.5, '#f5f8fb');
        side.addColorStop(1, '#7f96aa');

        ctx.beginPath();
        ctx.moveTo(x - rx, topY);
        ctx.lineTo(x - rx, bottomY);
        ctx.ellipse(x, bottomY, rx, ry, 0, Math.PI, 0, true);
        ctx.lineTo(x + rx, topY);
        ctx.ellipse(x, topY, rx, ry, 0, 0, Math.PI, true);
        ctx.closePath();
        ctx.fillStyle = side;
        ctx.strokeStyle = '#243447';
        ctx.lineWidth = 5;
        ctx.fill();
        ctx.stroke();

        this._ellipsePatch(x, topY, rx, ry, 0, '#eef5fb', '#243447', 5);
        ctx.beginPath();
        ctx.ellipse(x, bottomY, rx, ry, 0, 0, Math.PI);
        ctx.strokeStyle = '#243447';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.ellipse(x, bottomY, rx, ry, 0, Math.PI, 0);
        ctx.strokeStyle = 'rgba(36,52,71,0.45)';
        ctx.stroke();
        ctx.setLineDash([]);

        this._templateLabel('Canvas Cylinder');
        ctx.restore();
        return this._commit('template_cylinder');
    }

    _drawConeTemplate() {
        const ctx = this.ctx;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        this._paintGradientBackground('#f3f8ff', '#dcecff');
        this._drawGroundShadow(400, 512, 150, 24);

        const apex = { x: 400, y: 125 };
        const base = { x: 400, y: 465, rx: 145, ry: 42 };
        const fill = ctx.createLinearGradient(260, 0, 540, 0);
        fill.addColorStop(0, '#b7c4d6');
        fill.addColorStop(0.55, '#f6f7fb');
        fill.addColorStop(1, '#8798ad');

        ctx.beginPath();
        ctx.moveTo(apex.x, apex.y);
        ctx.lineTo(base.x - base.rx, base.y);
        ctx.ellipse(base.x, base.y, base.rx, base.ry, 0, Math.PI, 0, true);
        ctx.lineTo(apex.x, apex.y);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.strokeStyle = '#243447';
        ctx.lineWidth = 5;
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(base.x, base.y, base.rx, base.ry, 0, 0, Math.PI);
        ctx.stroke();
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.ellipse(base.x, base.y, base.rx, base.ry, 0, Math.PI, 0);
        ctx.strokeStyle = 'rgba(36,52,71,0.45)';
        ctx.stroke();
        ctx.setLineDash([]);

        this._templateLabel('Canvas Cone');
        ctx.restore();
        return this._commit('template_cone');
    }

    _drawTriangularPyramidTemplate() {
        const ctx = this.ctx;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        this._paintGradientBackground('#eef8ff', '#d9ecf5');
        this._drawGroundShadow(400, 525, 190, 26);

        const top = { x: 400, y: 130 };
        const left = { x: 245, y: 470 };
        const right = { x: 585, y: 470 };
        const back = { x: 430, y: 360 };

        this._polygonPatch([top, left, back], '#d7dde4', '#1f2937', 5);
        this._polygonPatch([top, back, right], '#bcc7d2', '#1f2937', 5);
        this._polygonPatch([left, right, back], '#aeb9c6', '#1f2937', 5);
        ctx.beginPath();
        ctx.moveTo(top.x, top.y);
        ctx.lineTo(back.x, back.y);
        ctx.moveTo(left.x, left.y);
        ctx.lineTo(right.x, right.y);
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 5;
        ctx.stroke();

        this._templateLabel('Canvas Triangular Pyramid');
        ctx.restore();
        return this._commit('template_triangular_pyramid');
    }

    _drawCubeTemplate() {
        const ctx = this.ctx;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        this._paintGradientBackground('#f2f7ff', '#d8e8f4');
        this._drawGroundShadow(405, 520, 170, 24);

        const front = [{ x: 290, y: 260 }, { x: 485, y: 260 }, { x: 485, y: 455 }, { x: 290, y: 455 }];
        const top = [{ x: 290, y: 260 }, { x: 380, y: 175 }, { x: 575, y: 175 }, { x: 485, y: 260 }];
        const side = [{ x: 485, y: 260 }, { x: 575, y: 175 }, { x: 575, y: 370 }, { x: 485, y: 455 }];
        this._polygonPatch(top, '#dce7f2', '#243447', 5);
        this._polygonPatch(side, '#aab8c8', '#243447', 5);
        this._polygonPatch(front, '#c7d3df', '#243447', 5);

        this._templateLabel('Canvas Cube');
        ctx.restore();
        return this._commit('template_cube');
    }

    _drawSphereTemplate() {
        const ctx = this.ctx;
        ctx.save();
        this._paintGradientBackground('#f4fbff', '#dbeef8');
        this._drawGroundShadow(400, 518, 145, 24);

        const gradient = ctx.createRadialGradient(350, 245, 20, 400, 330, 150);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.38, '#b8d7ee');
        gradient.addColorStop(1, '#4f7fa3');
        this._ellipsePatch(400, 330, 145, 145, 0, gradient, '#243447', 5);

        ctx.beginPath();
        ctx.ellipse(400, 330, 95, 145, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(36,52,71,0.38)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(400, 330, 145, 42, 0, 0, Math.PI * 2);
        ctx.stroke();
        this._fillCircle(348, 258, 22, 'rgba(255,255,255,0.85)');

        this._templateLabel('Canvas Sphere');
        ctx.restore();
        return this._commit('template_sphere');
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

    _drawDogTemplate() {
        const ctx = this.ctx;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        this._paintGradientBackground('#fff1d8', '#f8d9a5');
        this._drawGroundShadow(400, 525, 170, 28);

        const fur = '#c9823a';
        const dark = '#3a2618';
        const cream = '#ffe0ad';
        const ear = '#8a4f2a';

        // Tail.
        ctx.beginPath();
        ctx.moveTo(520, 400);
        ctx.bezierCurveTo(640, 330, 610, 250, 548, 290);
        ctx.strokeStyle = fur;
        ctx.lineWidth = 28;
        ctx.stroke();
        ctx.strokeStyle = dark;
        ctx.lineWidth = 5;
        ctx.stroke();

        // Body and head.
        this._ellipsePatch(400, 405, 135, 115, 0, fur, dark, 5);
        this._ellipsePatch(400, 255, 118, 96, 0, fur, dark, 5);
        this._ellipsePatch(400, 286, 62, 42, 0, cream, 'rgba(0,0,0,0)', 0);

        // Ears.
        this._ellipsePatch(305, 250, 42, 82, -0.45, ear, dark, 5);
        this._ellipsePatch(495, 250, 42, 82, 0.45, ear, dark, 5);

        this._fillCircle(356, 238, 15, dark);
        this._fillCircle(444, 238, 15, dark);
        this._fillCircle(362, 232, 5, '#ffffff');
        this._fillCircle(450, 232, 5, '#ffffff');
        this._fillCircle(400, 276, 13, '#20140d');

        ctx.beginPath();
        ctx.moveTo(400, 290);
        ctx.bezierCurveTo(382, 306, 365, 300, 356, 290);
        ctx.moveTo(400, 290);
        ctx.bezierCurveTo(418, 306, 435, 300, 444, 290);
        ctx.strokeStyle = dark;
        ctx.lineWidth = 4;
        ctx.stroke();

        this._drawPaw(330, 505, '#a85f2e', dark);
        this._drawPaw(470, 505, '#a85f2e', dark);
        this._templateLabel('Canvas Dog');
        ctx.restore();
        return this._commit('template_dog');
    }

    _drawRabbitTemplate() {
        const ctx = this.ctx;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        this._paintGradientBackground('#f8fbff', '#e8f2ff');
        this._drawGroundShadow(400, 525, 150, 26);

        const fur = '#f7f0e8';
        const ink = '#3a312b';
        const pink = '#f5a3bd';

        this._ellipsePatch(352, 150, 34, 112, -0.16, fur, ink, 5);
        this._ellipsePatch(448, 150, 34, 112, 0.16, fur, ink, 5);
        this._ellipsePatch(352, 155, 15, 78, -0.16, pink, 'rgba(0,0,0,0)', 0);
        this._ellipsePatch(448, 155, 15, 78, 0.16, pink, 'rgba(0,0,0,0)', 0);
        this._ellipsePatch(400, 410, 122, 132, 0, fur, ink, 5);
        this._ellipsePatch(400, 260, 112, 96, 0, fur, ink, 5);
        this._ellipsePatch(400, 430, 66, 82, 0, '#fffaf4', 'rgba(0,0,0,0)', 0);

        this._fillCircle(360, 245, 14, ink);
        this._fillCircle(440, 245, 14, ink);
        this._fillCircle(365, 240, 5, '#ffffff');
        this._fillCircle(445, 240, 5, '#ffffff');
        this._fillCircle(400, 275, 9, pink);

        ctx.beginPath();
        ctx.moveTo(400, 284);
        ctx.bezierCurveTo(385, 300, 372, 296, 364, 287);
        ctx.moveTo(400, 284);
        ctx.bezierCurveTo(415, 300, 428, 296, 436, 287);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 4;
        ctx.stroke();

        this._ellipsePatch(332, 522, 58, 24, -0.12, '#eee2d8', ink, 4);
        this._ellipsePatch(468, 522, 58, 24, 0.12, '#eee2d8', ink, 4);
        this._templateLabel('Canvas Rabbit');
        ctx.restore();
        return this._commit('template_rabbit');
    }

    _drawFishTemplate() {
        const ctx = this.ctx;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        this._paintGradientBackground('#b9f3ff', '#4aa3df');
        this._drawBubbleSet();

        const orange = '#ff9f1c';
        const coral = '#ff6b6b';
        const ink = '#1f3b4d';

        this._ellipsePatch(405, 310, 155, 88, 0, orange, ink, 6);
        this._drawTrianglePatch(245, 310, 145, 235, 145, 385, coral, ink);
        this._drawTrianglePatch(378, 230, 430, 160, 470, 238, coral, ink);
        this._drawTrianglePatch(395, 390, 455, 455, 482, 382, coral, ink);
        this._fillCircle(485, 285, 20, '#ffffff');
        this._fillCircle(492, 286, 9, ink);

        ctx.beginPath();
        ctx.moveTo(518, 325);
        ctx.bezierCurveTo(500, 350, 470, 352, 450, 328);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 4;
        ctx.stroke();

        [340, 380, 420].forEach(x => {
            ctx.beginPath();
            ctx.arc(x, 310, 40, -0.9, 0.9);
            ctx.strokeStyle = 'rgba(255,255,255,0.65)';
            ctx.lineWidth = 5;
            ctx.stroke();
        });

        this._templateLabel('Canvas Fish');
        ctx.restore();
        return this._commit('template_fish');
    }

    _drawFlowerTemplate() {
        const ctx = this.ctx;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        this._paintGradientBackground('#fff8e9', '#dff5c8');
        ctx.strokeStyle = '#2f8f4e';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(400, 500);
        ctx.bezierCurveTo(390, 420, 410, 360, 400, 300);
        ctx.stroke();

        this._ellipsePatch(350, 405, 62, 28, -0.4, '#5ec76b', '#2f8f4e', 4);
        this._ellipsePatch(450, 430, 62, 28, 0.35, '#5ec76b', '#2f8f4e', 4);

        const petals = [
            [400, 230, 34, 76, 0], [400, 370, 34, 76, 0],
            [330, 300, 76, 34, 0], [470, 300, 76, 34, 0],
            [350, 250, 34, 72, -0.75], [450, 250, 34, 72, 0.75],
            [350, 350, 34, 72, 0.75], [450, 350, 34, 72, -0.75],
        ];
        petals.forEach(([x, y, rx, ry, rot], i) => this._ellipsePatch(x, y, rx, ry, rot, i % 2 ? '#ff8fab' : '#ff6f91', '#ad3156', 4));
        this._fillCircle(400, 300, 44, '#ffd166');
        this._fillCircle(385, 292, 6, '#bf7b00');
        this._fillCircle(412, 306, 6, '#bf7b00');
        this._fillCircle(404, 282, 5, '#bf7b00');

        this._templateLabel('Canvas Flower');
        ctx.restore();
        return this._commit('template_flower');
    }

    _drawCarTemplate() {
        const ctx = this.ctx;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        this._paintGradientBackground('#eef7ff', '#d6e6f5');
        ctx.fillStyle = '#6c757d';
        ctx.fillRect(0, 500, this.width, 100);
        ctx.strokeStyle = 'rgba(255,255,255,0.65)';
        ctx.lineWidth = 6;
        ctx.setLineDash([40, 28]);
        ctx.beginPath();
        ctx.moveTo(0, 545);
        ctx.lineTo(800, 545);
        ctx.stroke();
        ctx.setLineDash([]);

        const red = '#ef476f';
        const ink = '#243447';
        this._roundedRectPath(220, 330, 360, 120, 34);
        ctx.fillStyle = red;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 6;
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(300, 330);
        ctx.lineTo(360, 255);
        ctx.lineTo(470, 255);
        ctx.lineTo(535, 330);
        ctx.closePath();
        ctx.fillStyle = '#ef476f';
        ctx.fill();
        ctx.stroke();

        this._roundedRectPath(335, 272, 58, 48, 8);
        ctx.fillStyle = '#9be7ff';
        ctx.fill();
        ctx.stroke();
        this._roundedRectPath(415, 272, 70, 48, 8);
        ctx.fill();
        ctx.stroke();

        this._fillCircle(310, 455, 42, ink);
        this._fillCircle(490, 455, 42, ink);
        this._fillCircle(310, 455, 20, '#dce8f2');
        this._fillCircle(490, 455, 20, '#dce8f2');
        this._fillCircle(565, 385, 12, '#ffd166');
        this._fillCircle(235, 390, 10, '#ffe8a1');

        this._templateLabel('Canvas Car');
        ctx.restore();
        return this._commit('template_car');
    }

    _drawRocketTemplate() {
        const ctx = this.ctx;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        this._paintGradientBackground('#0b1026', '#273469');
        this._drawStars();

        const ink = '#1d2338';
        ctx.save();
        ctx.translate(400, 300);
        ctx.rotate(-0.18);

        ctx.beginPath();
        ctx.moveTo(0, -180);
        ctx.bezierCurveTo(88, -90, 82, 80, 44, 170);
        ctx.lineTo(-44, 170);
        ctx.bezierCurveTo(-82, 80, -88, -90, 0, -180);
        ctx.closePath();
        ctx.fillStyle = '#f8f9fa';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 6;
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -180);
        ctx.bezierCurveTo(42, -135, 52, -80, 48, -45);
        ctx.lineTo(-48, -45);
        ctx.bezierCurveTo(-52, -80, -42, -135, 0, -180);
        ctx.closePath();
        ctx.fillStyle = '#ef476f';
        ctx.fill();
        ctx.stroke();

        this._fillCircle(0, 5, 36, '#64d2ff');
        this._fillCircle(0, 5, 20, '#dff7ff');

        this._drawTrianglePatch(-44, 100, -118, 176, -40, 164, '#ef476f', ink);
        this._drawTrianglePatch(44, 100, 118, 176, 40, 164, '#ef476f', ink);

        ctx.beginPath();
        ctx.moveTo(-28, 170);
        ctx.lineTo(0, 260);
        ctx.lineTo(28, 170);
        ctx.closePath();
        ctx.fillStyle = '#ffd166';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-18, 170);
        ctx.lineTo(0, 225);
        ctx.lineTo(18, 170);
        ctx.closePath();
        ctx.fillStyle = '#ff7a1a';
        ctx.fill();
        ctx.restore();

        this._templateLabel('Canvas Rocket', '#ffffff');
        ctx.restore();
        return this._commit('template_rocket');
    }

    _drawSeaSceneTemplate() {
        const ctx = this.ctx;
        ctx.save();
        this._paintGradientBackground('#83d9ff', '#fff0c2');
        this._fillCircle(650, 115, 52, '#ffd166');

        ctx.fillStyle = '#1f9bd1';
        ctx.fillRect(0, 285, this.width, 170);
        for (let y = 315; y <= 420; y += 34) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            for (let x = 0; x <= 820; x += 80) ctx.quadraticCurveTo(x + 40, y - 18, x + 80, y);
            ctx.strokeStyle = 'rgba(255,255,255,0.65)';
            ctx.lineWidth = 5;
            ctx.stroke();
        }

        ctx.fillStyle = '#f4c46d';
        ctx.beginPath();
        ctx.moveTo(0, 430);
        ctx.quadraticCurveTo(280, 380, 800, 440);
        ctx.lineTo(800, 600);
        ctx.lineTo(0, 600);
        ctx.closePath();
        ctx.fill();

        this._drawPalmTree(160, 405, 1.0);
        this._drawBeachUmbrella(540, 420);
        this._templateLabel('Canvas Beach Scene');
        ctx.restore();
        return this._commit('template_sea_scene');
    }

    _drawForestSceneTemplate() {
        const ctx = this.ctx;
        ctx.save();
        this._paintGradientBackground('#c8f7dc', '#7cc576');
        ctx.fillStyle = '#5ca85d';
        ctx.fillRect(0, 420, this.width, 180);

        for (let i = 0; i < 9; i++) {
            const x = 65 + i * 88;
            const scale = 0.72 + (i % 3) * 0.18;
            this._drawPineTree(x, 350 + (i % 2) * 35, scale);
        }
        this._fillCircle(680, 95, 38, '#ffd166');
        this._drawPathTrail();
        this._templateLabel('Canvas Forest Scene');
        ctx.restore();
        return this._commit('template_forest_scene');
    }

    _drawPersonTemplate() {
        const ctx = this.ctx;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        this._paintGradientBackground('#f0f7ff', '#ffe6d5');
        this._drawGroundShadow(400, 532, 120, 24);

        const ink = '#2d2a32';
        const skin = '#f2b18f';
        const hair = '#4b2e24';
        const shirt = '#4facfe';
        const pants = '#34495e';

        this._ellipsePatch(400, 190, 72, 76, 0, skin, ink, 5);
        ctx.beginPath();
        ctx.arc(400, 168, 76, Math.PI * 1.05, Math.PI * 1.95);
        ctx.fillStyle = hair;
        ctx.fill();
        ctx.strokeStyle = ink;
        ctx.lineWidth = 4;
        ctx.stroke();

        this._fillCircle(374, 190, 8, ink);
        this._fillCircle(426, 190, 8, ink);
        ctx.beginPath();
        ctx.arc(400, 216, 24, 0.15, Math.PI - 0.15);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 4;
        ctx.stroke();

        this._roundedRectPath(330, 270, 140, 160, 28);
        ctx.fillStyle = shirt;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 5;
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(330, 305);
        ctx.lineTo(245, 390);
        ctx.moveTo(470, 305);
        ctx.lineTo(555, 390);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 18;
        ctx.stroke();
        this._fillCircle(242, 392, 18, skin);
        this._fillCircle(558, 392, 18, skin);

        this._roundedRectPath(340, 430, 48, 96, 16);
        ctx.fillStyle = pants;
        ctx.fill();
        ctx.stroke();
        this._roundedRectPath(412, 430, 48, 96, 16);
        ctx.fill();
        ctx.stroke();
        this._roundedRectPath(320, 515, 78, 26, 12);
        ctx.fillStyle = '#2d2a32';
        ctx.fill();
        this._roundedRectPath(402, 515, 78, 26, 12);
        ctx.fill();

        this._templateLabel('Canvas Person');
        ctx.restore();
        return this._commit('template_person');
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

    _polygonPatch(points, fill, stroke, width = 4) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = width;
        ctx.stroke();
    }


    _paintGradientBackground(top, bottom) {
        const bg = this.ctx.createLinearGradient(0, 0, 0, this.height);
        bg.addColorStop(0, top);
        bg.addColorStop(1, bottom);
        this.ctx.fillStyle = bg;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    _drawGroundShadow(x, y, rx, ry) {
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(40, 30, 20, 0.16)';
        this.ctx.fill();
    }

    _ellipsePatch(x, y, rx, ry, rotation, fill, stroke, width = 4) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, rotation || 0, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke !== 'rgba(0,0,0,0)' && width > 0) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = width;
            ctx.stroke();
        }
    }

    _templateLabel(text, color = 'rgba(45, 33, 24, 0.72)') {
        const ctx = this.ctx;
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = color;
        ctx.fillText(text, 400, 575);
    }

    _drawBubbleSet() {
        [[110, 120, 10], [155, 210, 16], [650, 150, 13], [700, 250, 9], [600, 365, 12]].forEach(([x, y, r]) => {
            this.ctx.beginPath();
            this.ctx.arc(x, y, r, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255,255,255,0.72)';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        });
    }

    _drawStars() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255,255,255,0.86)';
        [[92, 80], [160, 180], [695, 105], [620, 230], [115, 410], [710, 425], [300, 90], [540, 70]].forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    _drawPalmTree(x, y, scale = 1) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.moveTo(0, 80);
        ctx.bezierCurveTo(20, 10, 10, -55, 30, -115);
        ctx.stroke();
        ctx.fillStyle = '#2e9f5b';
        for (let i = 0; i < 7; i++) {
            ctx.save();
            ctx.rotate((i - 3) * 0.48);
            ctx.beginPath();
            ctx.moveTo(28, -118);
            ctx.quadraticCurveTo(82, -155, 142, -120);
            ctx.quadraticCurveTo(82, -105, 28, -118);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }

    _drawBeachUmbrella(x, y) {
        const ctx = this.ctx;
        ctx.strokeStyle = '#7a4a2b';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(x, y - 10);
        ctx.lineTo(x + 35, y + 105);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 110, y - 20);
        ctx.quadraticCurveTo(x, y - 120, x + 110, y - 20);
        ctx.closePath();
        ctx.fillStyle = '#ff6b6b';
        ctx.fill();
        ctx.strokeStyle = '#9b2c2c';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y - 102);
        ctx.lineTo(x, y - 20);
        ctx.moveTo(x - 55, y - 70);
        ctx.lineTo(x - 36, y - 20);
        ctx.moveTo(x + 55, y - 70);
        ctx.lineTo(x + 36, y - 20);
        ctx.stroke();
    }

    _drawPineTree(x, y, scale = 1) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = '#6b4328';
        ctx.fillRect(-12, 58, 24, 82);
        [['#1f7a3f', -42, 55], ['#27934d', -55, 15], ['#33a85d', -68, -28]].forEach(([color, left, top]) => {
            ctx.beginPath();
            ctx.moveTo(0, top);
            ctx.lineTo(left, top + 95);
            ctx.lineTo(-left, top + 95);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        });
        ctx.restore();
    }

    _drawPathTrail() {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(380, 600);
        ctx.bezierCurveTo(360, 540, 420, 500, 390, 440);
        ctx.bezierCurveTo(360, 390, 410, 360, 395, 315);
        ctx.lineTo(455, 315);
        ctx.bezierCurveTo(475, 370, 435, 405, 470, 460);
        ctx.bezierCurveTo(505, 515, 470, 560, 520, 600);
        ctx.closePath();
        ctx.fillStyle = '#d8b27c';
        ctx.fill();
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
