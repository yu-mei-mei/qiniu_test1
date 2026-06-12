/**
 * AI 语音绘图工具 - Canvas 绘图引擎
 * 支持圆形、矩形、线条等基本图形绘制
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

        // 默认样式
        this.defaultColor = '#2d3436';
        this.defaultFillColor = '#0984e3';
        this.defaultLineWidth = 3;

        // 背景色
        this.bgColor = '#ffffff';

        // 初始化空白画布
        this._saveState();
        this._render();
    }

    // ===== 基本绘图方法 =====

    /** 画圆形 */
    drawCircle(x, y, radius, color, fill) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this._applyStyle(color, fill);
        if (fill) {
            this.ctx.fill();
        }
        this.ctx.stroke();
        this._saveState();
        return this;
    }

    /** 画矩形 */
    drawRectangle(x, y, width, height, color, fill, fillColor) {
        this.ctx.beginPath();
        this.ctx.rect(x, y, width, height);
        this._applyStyle(color, fill, fillColor);
        if (fill) {
            this.ctx.fill();
        }
        this.ctx.stroke();
        this._saveState();
        return this;
    }

    /** 画线条 */
    drawLine(x1, y1, x2, y2, color, width) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = color || this.defaultColor;
        this.ctx.lineWidth = width || this.defaultLineWidth;
        this.ctx.stroke();
        this._saveState();
        return this;
    }

    /** 清空画布 */
    clear() {
        this.history = [];
        this._saveState();
        this._render();
        return this;
    }

    /** 撤销上一步 */
    undo() {
        if (this.history.length <= 1) return this;
        this.history.pop(); // 移除当前状态
        const prev = this.history[this.history.length - 1];
        this._render(prev);
        return this;
    }

    /** 设置背景色 */
    setBackground(color) {
        this.bgColor = color || '#ffffff';
        this._saveState();
        this._render();
        return this;
    }

    /** 批量执行多个绘图命令 */
    executeCommands(commands) {
        if (!commands || !commands.length) return;

        for (const cmd of commands) {
            const { action, params } = cmd;
            switch (action) {
                case 'draw_circle':
                    this.drawCircle(params.x, params.y, params.radius, params.color, params.fill !== false);
                    break;
                case 'draw_rectangle':
                    this.drawRectangle(params.x, params.y, params.width, params.height, params.color, params.fill !== false, params.fill_color);
                    break;
                case 'draw_line':
                    this.drawLine(params.x1, params.y1, params.x2, params.y2, params.color, params.width);
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
        }
        return this;
    }

    // ===== 内部方法 =====

    /** 应用样式 */
    _applyStyle(strokeColor, fill, fillColor) {
        this.ctx.strokeStyle = strokeColor || this.defaultColor;
        this.ctx.lineWidth = this.defaultLineWidth;
        if (fill) {
            this.ctx.fillStyle = fillColor || strokeColor || this.defaultFillColor;
        }
    }

    /** 保存当前画布状态到历史栈 */
    _saveState() {
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        this.history.push(imageData);
        // 限制历史栈大小
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    /** 渲染指定状态或重绘 */
    _render(imageData) {
        if (imageData) {
            this.ctx.putImageData(imageData, 0, 0);
        } else {
            // 用背景色填充
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(0, 0, this.width, this.height);
            // 如果历史中还有数据，重绘
            if (this.history.length > 0) {
                this.ctx.putImageData(this.history[this.history.length - 1], 0, 0);
            }
        }
    }
}
