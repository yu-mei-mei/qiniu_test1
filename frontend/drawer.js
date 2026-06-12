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



    // ===== 模板绘制 =====

    drawTemplate(name) {
        if (name === 'pikachu') {
            return this._drawPikachuTemplate();
        }
        return false;
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
        this._renderBackground();
        // 重绘所有历史状态
        this._rebuildFromHistory();
        return this._commit('set_background');
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
