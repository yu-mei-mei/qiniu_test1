/**
 * AI 语音绘图工具 - 应用逻辑
 * Web Speech API 语音识别 + 后端通信 + 绘图引擎集成
 */

class VoiceController {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isProcessing = false; // 正在处理指令时忽略新的识别
        this.restartTimeout = null;
        this.onCommand = null;      // 回调：收到完整指令文本

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
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => this._onStart();
        this.recognition.onresult = (e) => this._onResult(e);
        this.recognition.onerror = (e) => this._onError(e);
        this.recognition.onend = () => this._onEnd();

        this.start();
    }

    /** 开始监听 */
    start() {
        if (!this.recognition) return;
        try { this.recognition.start(); } catch (_) {}
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

    _onStart() {
        this.isListening = true;
        this._setStatus('listening', '🎤', '正在聆听...');
    }

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

        this._displayTranscript(finalText, interimText);

        // 有最终结果且不在处理中时触发
        if (finalText && !this.isProcessing && this.onCommand) {
            const text = finalText.trim();
            if (text) {
                this.isProcessing = true;
                this._setStatus('listening', '⏳', '正在处理指令...');
                this.onCommand(text);
            }
        }
    }

    _onError(event) {
        console.warn('语音识别错误:', event.error);
        const messages = {
            'not-allowed': '麦克风权限被拒绝，请在浏览器设置中允许',
            'no-speech': '未检测到语音',
            'audio-capture': '未找到麦克风设备',
            'network': '网络连接异常',
            'aborted': '识别已中断',
            'service-not-allowed': '语音服务不可用',
        };
        const msg = messages[event.error] || `识别出错: ${event.error}`;
        this._setStatus('error', '⚠️', msg);
        this.isListening = false;

        if (!['not-allowed', 'service-not-allowed'].includes(event.error)) {
            this._scheduleRestart();
        }
    }

    _onEnd() {
        this.isListening = false;
        if (this.recognition) {
            this._scheduleRestart();
        }
    }

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

    /** 设置处理完成，恢复监听状态 */
    setProcessingDone() {
        this.isProcessing = false;
        if (this.isListening) {
            this._setStatus('listening', '🎤', '正在聆听...');
        }
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
        if (final) html += `<span class="final">${this._escapeHtml(final)}</span>`;
        if (interim) html += `<span class="interim">${this._escapeHtml(interim)}</span>`;
        if (!final && !interim) html = '<span class="placeholder">🎤 说话后这里会显示识别文字...</span>';
        this.transcriptArea.innerHTML = html;
        this.transcriptArea.scrollTop = this.transcriptArea.scrollHeight;
    }

    /** 添加历史记录 */
    addHistory(text, status = '') {
        const now = new Date();
        const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `<span class="time">${time}</span>${this._escapeHtml(text)} ${status}`;
        this.historyArea.appendChild(item);
        this.historyArea.scrollTop = this.historyArea.scrollHeight;
    }

    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}


// ===== 后端通信 & 指令执行 =====

class CommandClient {
    constructor() {
        this.apiUrl = '/api/parse';
    }

    /** 发送语音文本到后端，返回解析后的指令 */
    async send(text) {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        if (!response.ok) {
            throw new Error(`服务器错误: ${response.status}`);
        }
        return response.json();
    }
}


// ===== 启动 =====

document.addEventListener('DOMContentLoaded', () => {
    const drawer = new DrawEngine('drawCanvas');
    const client = new CommandClient();
    const voice = new VoiceController();

    voice.onCommand = async (text) => {
        try {
            // 发送到后端解析
            const result = await client.send(text);

            // 执行绘图指令
            if (result.commands && result.commands.length > 0) {
                drawer.executeCommands(result.commands);
                voice.addHistory(text, '✅');
            } else {
                // 无指令（闲聊等）
                voice.addHistory(text, '💬');
            }

            // TTS 语音反馈
            if (result.tts) {
                speak(result.tts);
            }
        } catch (err) {
            console.error('指令处理失败:', err);
            voice.addHistory(text, '❌');
            speak('抱歉，处理指令时出了点问题');
        } finally {
            voice.setProcessingDone();
        }
    };

    // 暴露到全局以便调试
    window.drawer = drawer;
    window.voiceController = voice;
    window.commandClient = client;
});


/**
 * 语音合成（TTS）
 */
function speak(text) {
    if (!text || !window.speechSynthesis) return;
    // 取消正在播放的语音
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // 尝试选择中文语音
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.startsWith('zh'));
    if (zhVoice) utterance.voice = zhVoice;

    window.speechSynthesis.speak(utterance);
}

// 预加载语音列表
if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}
