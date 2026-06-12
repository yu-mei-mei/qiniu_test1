/**
 * AI 语音绘图工具 - 应用逻辑
 * MediaRecorder 录音 + 后端语音识别 + 指令解析 + 绘图引擎集成 + UX 增强
 */

class VoiceController {
    constructor() {
        this.stream = null;
        this.audioContext = null;
        this.source = null;
        this.processor = null;
        this.samples = [];
        this.isListening = false;
        this.isProcessing = false;
        this.restartTimeout = null;
        this.onAudio = null;
        this.historyCount = 0;
        this.segmentMs = 3200;
        this.targetSampleRate = 16000;

        this._initElements();
        this._initRecorder();
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

    async _initRecorder() {
        if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext && !window.webkitAudioContext) {
            this._setStatus('error', '❌', '浏览器不支持录音');
            return;
        }

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const AC = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AC();
            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this._setStatus('idle', '🎤', '准备录音...');
            this.start();
        } catch (err) {
            console.warn('麦克风初始化失败:', err);
            this._setStatus('error', '⚠️', '请允许麦克风权限');
        }
    }

    start() {
        if (!this.audioContext || this.isListening || this.isProcessing) return;

        this.samples = [];
        this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
        this.processor.onaudioprocess = (event) => {
            const input = event.inputBuffer.getChannelData(0);
            this.samples.push(new Float32Array(input));
        };
        this.source.connect(this.processor);
        this.processor.connect(this.audioContext.destination);
        this.isListening = true;
        this._setStatus('listening', '🎤', '正在聆听...');
        setTimeout(() => this.stop(), this.segmentMs);
    }

    stop() {
        if (!this.isListening) return;
        this.isListening = false;
        if (this.processor) {
            this.processor.disconnect();
            this.processor.onaudioprocess = null;
            this.processor = null;
        }

        if (this.samples.length > 0 && !this.isProcessing && this.onAudio) {
            const wav = this._encodeWav(this.samples, this.audioContext.sampleRate, this.targetSampleRate);
            this._handleAudio(wav);
        } else {
            this._scheduleRestart();
        }
    }

    async _handleAudio(blob) {
        this.isProcessing = true;
        this._setStatus('listening', '⏳', '正在识别...');
        try {
            await this.onAudio(blob);
        } finally {
            this.setProcessingDone();
        }
    }

    _encodeWav(chunks, sourceRate, targetRate) {
        const samples = this._mergeSamples(chunks);
        const resampled = this._resample(samples, sourceRate, targetRate);
        const buffer = new ArrayBuffer(44 + resampled.length * 2);
        const view = new DataView(buffer);
        this._writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + resampled.length * 2, true);
        this._writeString(view, 8, 'WAVE');
        this._writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, targetRate, true);
        view.setUint32(28, targetRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        this._writeString(view, 36, 'data');
        view.setUint32(40, resampled.length * 2, true);

        let offset = 44;
        for (const sample of resampled) {
            const clamped = Math.max(-1, Math.min(1, sample));
            view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
            offset += 2;
        }
        return new Blob([buffer], { type: 'audio/wav' });
    }

    _mergeSamples(chunks) {
        const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Float32Array(length);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        return result;
    }

    _resample(samples, sourceRate, targetRate) {
        if (sourceRate === targetRate) return samples;
        const ratio = sourceRate / targetRate;
        const length = Math.round(samples.length / ratio);
        const result = new Float32Array(length);
        for (let i = 0; i < length; i++) {
            const index = i * ratio;
            const left = Math.floor(index);
            const right = Math.min(left + 1, samples.length - 1);
            const weight = index - left;
            result[i] = samples[left] * (1 - weight) + samples[right] * weight;
        }
        return result;
    }

    _writeString(view, offset, text) {
        for (let i = 0; i < text.length; i++) {
            view.setUint8(offset + i, text.charCodeAt(i));
        }
    }

    _scheduleRestart() {
        if (this.restartTimeout || this.isProcessing) return;
        this.restartTimeout = setTimeout(() => {
            this.restartTimeout = null;
            this.start();
        }, 250);
    }

    setProcessingDone() {
        this.isProcessing = false;
        this._scheduleRestart();
    }

    _setStatus(type, icon, text) {
        if (this.micIcon) { this.micIcon.className = `mic-icon ${type}`; this.micIcon.textContent = icon; }
        if (this.statusText) { this.statusText.className = `status-text ${type}`; this.statusText.textContent = text; }
    }

    displayTranscript(text) {
        if (!this.transcriptArea) return;
        const safeText = this._escapeHtml(text || '');
        this.transcriptArea.innerHTML = safeText
            ? `<span class="final">${safeText}</span>`
            : '<span class="placeholder">🎤 正在等待语音指令...</span>';
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
        this.parseUrl = '/api/parse';
        this.voiceUrl = '/api/voice';
    }

    async send(text) {
        const res = await fetch(this.parseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error(`服务器错误: ${res.status}`);
        return res.json();
    }

    async sendAudio(blob) {
        const form = new FormData();
        form.append('file', blob, 'voice.wav');
        const res = await fetch(this.voiceUrl, { method: 'POST', body: form });
        if (!res.ok) throw new Error(`服务器错误: ${res.status}`);
        return res.json();
    }
}



function findDrawingTemplate(text) {
    const normalized = (text || '').toLowerCase();
    if (normalized.includes('皮卡丘') || normalized.includes('pikachu')) {
        return {
            name: 'pikachu',
            label: '皮卡丘',
            tts: '好的，我画了一个皮卡丘。',
        };
    }
    return null;
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

    voice.onAudio = async (blob) => {
        try {
            const result = await client.sendAudio(blob);
            const text = (result.text || '').trim();
            voice.displayTranscript(text);

            const template = findDrawingTemplate(text);
            if (template) {
                drawer.clear();
                drawer.drawTemplate(template.name);
                voice.addHistory(template.label, '✅');
                voice.updateCanvasInfo(drawer.getStatus());
                await speak(template.tts);
                return;
            }

            if (result.commands && result.commands.length > 0) {
                drawer.clear();
                drawer.executeCommands(result.commands);
                voice.addHistory(text || '语音指令', '✅');
            } else if (text) {
                voice.addHistory(text, '💬');
            }

            voice.updateCanvasInfo(drawer.getStatus());
            if (result.tts) await speak(result.tts);
        } catch (err) {
            console.error('语音指令处理失败:', err);
            voice.addHistory('语音识别失败', '❌');
            await speak('抱歉，处理语音时出了点问题');
        }
    };

    window.drawer = drawer;
    window.voiceController = voice;
});


/** 语音合成 */
function speak(text) {
    if (!text || !window.speechSynthesis) return Promise.resolve();

    return new Promise((resolve) => {
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            resolve();
        };

        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN';
        u.rate = 1.0;
        u.pitch = 1.0;
        u.onend = finish;
        u.onerror = finish;
        const voices = window.speechSynthesis.getVoices();
        const zh = voices.find(v => v.lang.startsWith('zh'));
        if (zh) u.voice = zh;
        window.speechSynthesis.speak(u);
        setTimeout(finish, Math.max(1500, text.length * 250));
    });
}

if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}
