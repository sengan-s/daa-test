import confetti from 'canvas-confetti';

export function fireConfetti(options?: confetti.Options): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  try {
    // Get or create an explicit, styled canvas element attached to document.body
    let canvas = document.getElementById('daa-confetti-canvas') as HTMLCanvasElement | null;

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'daa-confetti-canvas';
      canvas.style.position = 'fixed';
      canvas.style.pointerEvents = 'none';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.zIndex = '999999';
      document.body.appendChild(canvas);
    }

    // Ensure getBoundingClientRect is present and callable
    if (canvas && typeof canvas.getBoundingClientRect !== 'function') {
      canvas.getBoundingClientRect = function () {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth || 800,
          height: window.innerHeight || 600,
          right: window.innerWidth || 800,
          bottom: window.innerHeight || 600,
          x: 0,
          y: 0,
          toJSON: () => {},
        };
      };
    }

    // Create custom confetti instance attached to this safe canvas
    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: false,
    });

    myConfetti({
      particleCount: options?.particleCount || 80,
      spread: options?.spread || 70,
      origin: options?.origin || { y: 0.6 },
      disableForReducedMotion: true,
      ...options,
    });
  } catch (err) {
    console.warn('Canvas confetti execution caught error, using fallback:', err);
    runFallbackConfetti();
  }
}

function runFallbackConfetti() {
  try {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.pointerEvents = 'none';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '999999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth || 800;
    canvas.height = window.innerHeight || 600;

    const colors = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotSpeed: number;
      alpha: number;
    }> = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height * 0.5 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 10,
        vy: -Math.random() * 10 - 3,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        alpha: 1,
      });
    }

    let frame = 0;
    function animate() {
      if (!ctx || frame > 100) {
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.rotation += p.rotSpeed;
        p.alpha -= 0.01;

        if (p.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      frame++;
      requestAnimationFrame(animate);
    }
    animate();
  } catch (e) {
    // Non-fatal visual effect error guard
  }
}

