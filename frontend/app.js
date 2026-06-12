/**
 * AI 语音绘图工具 - 应用逻辑
 * Web Speech API 语音识别集成
 */

class VoiceController {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isFinal = false;
        this.restartTimeout = null;
        this.onFinalTranscript = null; // 回调：最终识别结果

        this._initElements();
        this._initRecognition();
    }

    /** 绑定页面元素 */
    _initElements() {
        this.micIcon = document.getElementById('micIcon');
        this.statusText = document.getElementById('statusText');
        this.transcriptArea = document.getElementById('transcriptArea');
        this.historyArea = document.getElementById('historyArea');
    }

    /** 初始化 Web Speech API */
    _initRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            this._setStatus('error', '❌', '您的浏览器不支持语音识别，请使用 Chrome 或 Edge');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'zh-CN';
        this.recognition.continuous = true;      // 持续监听
        this.recognition.interimResults = true;  // 返回中间结果
        this.recognition.maxAlternatives = 1;

        // 绑定事件
        this.recognition.onstart = () => this._onStart();
        this.recognition.onresult = (e) => this._onResult(e);
        this.recognition.onerror = (e) => this._onError(e);
        this.recognition.onend = () => this._onEnd();

        // 自动开始监听
        this.start();
    }

    /** 开始监听 */
    start() {
        if (!this.recognition) return;
        try {
            this.recognition.start();
        } catch (e) {
            // 避免重复启动报错
            console.warn('语音启动:', e.message);
        }
    }

    /** 停止监听 */
    stop() {
        if (this.restartTimeout) {
            clearTimeout(this.restartTimeout);
            this.restartTimeout = null;
        }
        this.isListening = false;
        try { this.recognition?.stop(); } catch (_) {}
        this._setStatus('idle', '🎤', '语音识别已停止');
    }

    /** 监听启动 */
    _onStart() {
        this.isListening = true;
        this._setStatus('listening', '🎤', '正在聆听...');
    }

    /** 收到识别结果 */
    _onResult(event) {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
                finalText += result[0].transcript;
            } else {
                interimText += result[0].transcript;
            }
        }

        // 显示识别文字
        this._displayTranscript(finalText, interimText);

        // 有最终结果时触发回调
        if (finalText && this.onFinalTranscript) {
            const text = finalText.trim();
            if (text) {
                this._addHistory(text);
                this.onFinalTranscript(text);
            }
        }
    }

    /** 识别出错 */
    _onError(event) {
        console.warn('语音识别错误:', event.error);

        const errorMessages = {
            'not-allowed': '麦克风权限被拒绝，请在浏览器设置中允许',
            'no-speech': '未检测到语音',
            'audio-capture': '未找到麦克风设备',
            'network': '网络连接异常',
            'aborted': '识别已中断',
            'service-not-allowed': '语音服务不可用',
        };

        const msg = errorMessages[event.error] || `识别出错: ${event.error}`;
        this._setStatus('error', '⚠️', msg);
        this.isListening = false;

        // 非致命错误自动重启
        if (!['not-allowed', 'service-not-allowed'].includes(event.error)) {
            this._scheduleRestart();
        }
    }

    /** 监听结束（可能自动停止） */
    _onEnd() {
        this.isListening = false;
        // 如果没出错，自动重启保持持续监听
        if (this.recognition) {
            this._scheduleRestart();
        }
    }

    /** 延迟重启语音识别 */
    _scheduleRestart() {
        if (this.restartTimeout) return;
        this.restartTimeout = setTimeout(() => {
            this.restartTimeout = null;
            if (!this.isListening && this.recognition) {
                this._setStatus('idle', '🎤', '重新连接...');
                this.start();
            }
        }, 300);
    }

    /** 更新状态显示 */
    _setStatus(type, icon, text) {
        this.micIcon.className = `mic-icon ${type}`;
        this.micIcon.textContent = icon;
        this.statusText.className = `status-text ${type}`;
        this.statusText.textContent = text;
    }

    /** 显示识别文字 */
    _displayTranscript(final, interim) {
        let html = '';
        if (final) {
            html += `<span class="final">${this._escapeHtml(final)}</span>`;
        }
        if (interim) {
            html += `<span class="interim">${this._escapeHtml(interim)}</span>`;
        }
        if (!final && !interim) {
            html = '<span class="placeholder">🎤 说话后这里会显示识别文字...</span>';
        }
        this.transcriptArea.innerHTML = html;
        this.transcriptArea.scrollTop = this.transcriptArea.scrollHeight;
    }

    /** 添加历史记录 */
    _addHistory(text) {
        const now = new Date();
        const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `<span class="time">${time}</span>${this._escapeHtml(text)}`;
        this.historyArea.appendChild(item);
        this.historyArea.scrollTop = this.historyArea.scrollHeight;
    }

    /** HTML 转义 */
    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', () => {
    const voice = new VoiceController();

    voice.onFinalTranscript = (text) => {
        // 后续 PR：将识别文字发送到后端解析绘图指令
        console.log('🎤 识别结果:', text);
    };

    // 暴露到全局以便调试
    window.voiceController = voice;
});
