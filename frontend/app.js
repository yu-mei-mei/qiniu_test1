/**
 * AI 语音绘图工具 - 应用逻辑
 * Web Speech API 语音识别 + 后端通信 + 绘图引擎集成 + UX 增强
 */

class VoiceController {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isProcessing = false;
        this.restartTimeout = null;
        this.onCommand = null;
        this.historyCount = 0;

        this._initElements();
        this._initRecognition();
    }

    _initElements() {
        this.micIcon = document.getElementById('micIcon');
        this.statusText = document.getElementById('statusText');
        this.transcriptArea = document.getElementById('transcriptArea');
        this.historyArea = document.getElementById('historyArea');
        this.historyCountEl = document.getElementById('historyCount');
        this.actionCountEl = document.getElementById('actionCount');
        this.undoInfoEl = document.getElementById('undoInfo');
        this.redoInfoEl = document.getElementById('redoInfo');
    }

    _initRecognition() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            this._setStatus('error', '❌', '浏览器不支持语音识别');
            return;
        }
        this.recognition = new SR();
        this.recognition.lang = 'zh-CN';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            this.isListening = true;
            this._setStatus('listening', '🎤', '正在聆听...');
        };
        this.recognition.onresult = (e) => this._onResult(e);
        this.recognition.onerror = (e) => this._onError(e);
        this.recognition.onend = () => {
            this.isListening = false;
            if (this.recognition) this._scheduleRestart();
        };
        this.start();
    }

    start() {
        if (!this.recognition) return;
        try { this.recognition.start(); } catch (_) {}
    }

    stop() {
        if (this.restartTimeout) { clearTimeout(this.restartTimeout); this.restartTimeout = null; }
        this.isListening = false;
        try { this.recognition?.stop(); } catch (_) {}
        this._setStatus('idle', '🎤', '已停止');
    }

    _onResult(event) {
        let interim = '', final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const r = event.results[i];
            if (r.isFinal) final += r[0].transcript;
            else interim += r[0].transcript;
        }
        this._displayTranscript(final, interim);
        if (final && !this.isProcessing && this.onCommand) {
            const text = final.trim();
            if (text) {
                this.isProcessing = true;
                this._setStatus('listening', '⏳', '正在处理...');
                this.onCommand(text);
            }
        }
    }

    _onError(event) {
        console.warn('语音识别错误:', event.error);
        const msgs = {
            'not-allowed': '请允许麦克风权限',
            'no-speech': '未检测到语音',
            'audio-capture': '未找到麦克风',
            'network': '网络异常',
            'aborted': '已中断',
            'service-not-allowed': '服务不可用',
        };
        this._setStatus('error', '⚠️', msgs[event.error] || event.error);
        this.isListening = false;
        if (!['not-allowed', 'service-not-allowed'].includes(event.error)) {
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

    setProcessingDone() {
        this.isProcessing = false;
        if (this.isListening) this._setStatus('listening', '🎤', '正在聆听...');
    }

    _setStatus(type, icon, text) {
        if (this.micIcon) { this.micIcon.className = `mic-icon ${type}`; this.micIcon.textContent = icon; }
        if (this.statusText) { this.statusText.className = `status-text ${type}`; this.statusText.textContent = text; }
    }

    _displayTranscript(final, interim) {
        if (!this.transcriptArea) return;
        let html = '';
        if (final) html += `<span class="final">${this._escapeHtml(final)}</span>`;
        if (interim) html += ` <span class="interim">${this._escapeHtml(interim)}</span>`;
        if (!final && !interim) html = '<span class="placeholder">🎤 说话后这里会显示识别文字...</span>';
        this.transcriptArea.innerHTML = html;
        this.transcriptArea.scrollTop = this.transcriptArea.scrollHeight;
    }

    addHistory(text, status = '') {
        this.historyCount++;
        const now = new Date();
        const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const statusMap = { '✅': '✅', '💬': '💬', '❌': '❌' };
        const icon = statusMap[status] || '';
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `<span class="time">${time}</span><span class="text">${this._escapeHtml(text)}</span><span class="status">${icon}</span>`;
        this.historyArea.appendChild(item);
        this.historyArea.scrollTop = this.historyArea.scrollHeight;
        if (this.historyCountEl) this.historyCountEl.textContent = `${this.historyCount} 条`;
    }

    updateCanvasInfo(status) {
        if (!status) return;
        if (this.actionCountEl) this.actionCountEl.textContent = `📐 ${status.actionCount || 0}`;
        if (this.undoInfoEl) this.undoInfoEl.textContent = `↩️ ${status.undoSteps || 0}`;
        if (this.redoInfoEl) this.redoInfoEl.textContent = `↪️ ${status.redoSteps || 0}`;
    }

    _escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }
}


class CommandClient {
    constructor() {
        this.apiUrl = '/api/parse';
    }

    async send(text) {
        const res = await fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error(`服务器错误: ${res.status}`);
        return res.json();
    }
}


// ===== 启动 =====
document.addEventListener('DOMContentLoaded', () => {
    const drawer = new DrawEngine('drawCanvas');
    const client = new CommandClient();
    const voice = new VoiceController();

    // 定期刷新画布状态
    setInterval(() => {
        voice.updateCanvasInfo(drawer.getStatus());
    }, 1000);

    voice.onCommand = async (text) => {
        try {
            const result = await client.send(text);
            if (result.commands && result.commands.length > 0) {
                drawer.executeCommands(result.commands);
                voice.addHistory(text, '✅');
            } else {
                voice.addHistory(text, '💬');
            }
            voice.updateCanvasInfo(drawer.getStatus());
            if (result.tts) speak(result.tts);
        } catch (err) {
            console.error('指令处理失败:', err);
            voice.addHistory(text, '❌');
            speak('抱歉，处理指令时出了点问题');
        } finally {
            voice.setProcessingDone();
        }
    };

    window.drawer = drawer;
    window.voiceController = voice;
});


/** 语音合成 */
function speak(text) {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 1.0;
    u.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const zh = voices.find(v => v.lang.startsWith('zh'));
    if (zh) u.voice = zh;
    window.speechSynthesis.speak(u);
}

if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}
