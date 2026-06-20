const AudioCtx = window.AudioContext || window.webkitAudioContext;
let soundCtx = null;

export function getAudioCtx() {
    if (!soundCtx) {
        try { soundCtx = new AudioCtx(); } catch(e) { return null; }
    }
    if (soundCtx.state === 'suspended') { try { soundCtx.resume(); } catch(e) {} }
    return soundCtx;
}

export function playTone(freq, type, duration, vol = 0.3) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch(e) {}
}

export const SFX = {
    battleStart: () => { playTone(220, 'sawtooth', 0.5); setTimeout(()=>playTone(330,'square',0.3),100); },
    victory: () => { playTone(523, 'triangle', 0.2); setTimeout(()=>playTone(659,'triangle',0.2),150); },
    defeat: () => { playTone(200, 'sawtooth', 0.5); },
    cardOpen: () => { for(let i=0;i<3;i++) setTimeout(()=>playTone(800+Math.random()*400,'sine',0.1), i*60); },
    notification: () => playTone(880, 'sine', 0.1),
    levelUp: () => playTone(440, 'triangle', 0.2),
    buttonClick: () => playTone(600, 'sine', 0.05),
    error: () => playTone(150, 'square', 0.2),
    marsDiscovered: () => { playTone(110, 'sawtooth', 1.5); setTimeout(()=>{ playTone(165,'triangle',0.8); playTone(220,'square',0.6); }, 500); }
};
