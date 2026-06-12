/**
 * AI 语音绘图工具 - Canvas 绘图引擎
 * 支持圆形、矩形、线条、点、三角形等图形绘制
 * 支持样式状态管理、颜色转换、撤销/重做
 */

class DrawEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // 绘图历史（支持撤销）
        this.history = [];
        this.maxHistory = 50;

        // 样式状态
        this.style = {
            strokeColor: '#2d3436',
            fillColor: '#0984e3',
            fillMode: true,      // 默认填充
            lineWidth: 3,
        };

        // 背景色
        this.bgColor = '#ffffff';

        // 颜色映射（中文 → 十六进制）
        this.colorMap = {
            '红': '#e74c3c', '红色': '#e74c3c',
            '橙': '#e67e22', '橙色': '#e67e22',
            '黄': '#f1c40f', '黄色': '#f1c40f',
            '绿': '#2ecc71', '绿色': '#2ecc71',
            '青': '#1abc9c', '青色': '#1abc9c',
            '蓝': '#3498db', '蓝色': '#3498db',
            '紫': '#9b59b6', '紫色': '#9b59b6',
            '粉': '#e84393', '粉色': '#e84393', '粉红': '#e84393', '粉色': '#e84393',
            '棕': '#8B4513', '棕色': '#8B4513',
            '黑': '#2d3436', '黑色': '#2d3436',
            '白': '#ffffff', '白色': '#ffffff',
            '灰': '#95a5a6', '灰色': '#95a5a6',
            '深蓝': '#2c3e50', '深蓝': '#2c3e50',
            '天蓝': '#87CEEB', '天蓝': '#87CEEB',
            '深绿': '#27ae60',
            '浅绿': '#a8e6cf',
            '金': '#f39c12', '金色': '#f39c12',
            '银': '#bdc3c7', '银色': '#bdc3c7',
        };

        // 初始化空白画布
        this._saveState();
        this._renderBackground();
    }

    // ===== 基本绘图方法 =====

    /** 画圆形 */
    drawCircle(x = 400, y = 300, radius = 80, color, fill) {
        const c = this._resolveColor(color);
        const f = fill !== undefined ? fill : this.style.fillMode;

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this._applyStroke(c);
        if (f) this._applyFill(c);
        this.ctx.stroke();
        if (f) this.ctx.fill();
        this._saveState();
        return this;
    }

    /** 画矩形 */
    drawRectangle(x = 200, y = 150, width = 200, height = 200, color, fill, fillColor) {
        const c = this._resolveColor(color);
        const fc = fillColor ? this._resolveColor(fillColor) : c;
        const f = fill !== undefined ? fill : this.style.fillMode;

        this.ctx.beginPath();
        this.ctx.rect(x, y, width, height);
        this._applyStroke(c);
        if (f) this._applyFill(fc);
        this.ctx.stroke();
        if (f) this.ctx.fill();
        this._saveState();
        return this;
    }

    /** 画线条 */
    drawLine(x1 = 0, y1 = 0, x2 = 800, y2 = 600, color, width) {
        const c = this._resolveColor(color);
        const w = width || this.style.lineWidth;

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = c;
        this.ctx.lineWidth = w;
        this.ctx.stroke();
        this._saveState();
        return this;
    }

    /** 画三角形 */
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
        this.ctx.stroke();
        if (f) this.ctx.fill();
        this._saveState();
        return this;
    }

    /** 画点 */
    drawDot(x = 400, y = 300, size = 10, color) {
        const c = this._resolveColor(color);
        const r = (size || 10) / 2;

        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.fillStyle = c;
        this.ctx.fill();
        this._saveState();
        return this;
    }

    /** 绘制文字 */
    drawText(x = 400, y = 300, text = '', color, size = 24) {
        const c = this._resolveColor(color);
        const s = size || 24;

        this.ctx.font = `${s}px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = c;
        this.ctx.fillText(text, x, y);
        this._saveState();
        return this;
    }

    // ===== 样式控制 =====

    /** 设置样式状态 */
    setStyle(params = {}) {
        if (params.color) this.style.strokeColor = this._resolveColor(params.color);
        if (params.fill_color) this.style.fillColor = this._resolveColor(params.fill_color);
        if (params.fill !== undefined) this.style.fillMode = params.fill;
        if (params.line_width) this.style.lineWidth = params.line_width;
        if (params.lineWidth) this.style.lineWidth = params.lineWidth;
        this._saveState();
        return this;
    }

    // ===== 画布管理 =====

    /** 清空画布 */
    clear() {
        this.history = [];
        this._renderBackground();
        this._saveState();
        return this;
    }

    /** 撤销上一步 */
    undo() {
        if (this.history.length <= 1) return this;
        this.history.pop();
        this._restoreState();
        return this;
    }

    /** 设置背景色 */
    setBackground(color) {
        this.bgColor = this._resolveColor(color) || '#ffffff';
        this._renderBackground();
        this._saveState();
        return this;
    }

    /** 批量执行多个绘图命令 */
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

    // ===== 内部方法 =====

    /** 解析颜色：中文名称 → 十六进制/英文 */
    _resolveColor(color) {
        if (!color) return this.style.strokeColor;

        // 已经是十六进制或英文颜色名
        if (color.startsWith('#') || /^[a-zA-Z]+$/.test(color)) {
            return color;
        }

        // 中文颜色映射
        return this.colorMap[color] || color;
    }

    _applyStroke(color) {
        this.ctx.strokeStyle = color || this.style.strokeColor;
        this.ctx.lineWidth = this.style.lineWidth;
    }

    _applyFill(color) {
        this.ctx.fillStyle = color || this.style.fillColor;
    }

    /** 保存当前画布状态到历史栈 */
    _saveState() {
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        this.history.push(imageData);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    /** 从历史栈恢复 */
    _restoreState() {
        if (this.history.length > 0) {
            this.ctx.putImageData(this.history[this.history.length - 1], 0, 0);
        }
    }

    /** 渲染背景 */
    _renderBackground() {
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
}
