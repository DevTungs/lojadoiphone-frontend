/**
 * iPhone mockup em SVG puro — sem imagem externa, fundo transparente.
 * variant: 'front' | 'back' | 'tilt'
 * color: cor do corpo
 */
interface Props {
  variant?: 'front' | 'back' | 'tilt';
  bodyColor?: string;
  accentColor?: string;
  width?: number;
}

export default function IPhoneMockup({
  variant = 'front',
  bodyColor = '#1c1c1e',
  accentColor = '#00db84',
  width = 200,
}: Props) {
  const h = width * 2.16;
  const r = width * 0.12; // border-radius proporcional

  if (variant === 'tilt') {
    // iPhone em perspectiva 3/4, mostrando frente+lateral
    const W = width * 1.35;
    const H = W * 1.8;
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tiltBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={bodyColor === '#1c1c1e' ? '#2a2a2e' : bodyColor} />
            <stop offset="100%" stopColor={bodyColor} />
          </linearGradient>
          <linearGradient id="tiltSide" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>
          <linearGradient id="tiltScreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0a0f1a" />
            <stop offset="40%"  stopColor="#0d1525" />
            <stop offset="100%" stopColor="#060c14" />
          </linearGradient>
          <linearGradient id="tiltGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor={accentColor} stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00d1df"      stopOpacity="0.3" />
          </linearGradient>
          <radialGradient id="tiltScreenGlow" cx="40%" cy="35%" r="55%">
            <stop offset="0%"   stopColor={accentColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="tiltShadow">
            <feDropShadow dx="0" dy="24" stdDeviation="20" floodColor="rgba(0,0,0,0.75)" />
            <feDropShadow dx="0" dy="8"  stdDeviation="8"  floodColor="rgba(0,0,0,0.5)" />
          </filter>
          <clipPath id="tiltClip">
            <path d={`M${W*0.18},${H*0.025} Q${W*0.18},${H*0.005} ${W*0.22},${H*0.005} L${W*0.88},${H*0.005} Q${W*0.96},${H*0.005} ${W*0.96},${H*0.025} L${W*0.96},${H*0.975} Q${W*0.96},${H*0.995} ${W*0.88},${H*0.995} L${W*0.22},${H*0.995} Q${W*0.18},${H*0.995} ${W*0.18},${H*0.975} Z`} />
          </clipPath>
        </defs>

        <g filter="url(#tiltShadow)">
          {/* corpo principal */}
          <path
            d={`M${W*0.18},${H*0.025} Q${W*0.18},${H*0.005} ${W*0.22},${H*0.005} L${W*0.88},${H*0.005} Q${W*0.96},${H*0.005} ${W*0.96},${H*0.025} L${W*0.96},${H*0.975} Q${W*0.96},${H*0.995} ${W*0.88},${H*0.995} L${W*0.22},${H*0.995} Q${W*0.18},${H*0.995} ${W*0.18},${H*0.975} Z`}
            fill="url(#tiltBody)"
          />

          {/* lateral perspectiva */}
          <path
            d={`M${W*0.05},${H*0.04} L${W*0.18},${H*0.025} L${W*0.18},${H*0.975} L${W*0.05},${H*0.96} Z`}
            fill="url(#tiltSide)"
          />
          <path
            d={`M${W*0.05},${H*0.04} L${W*0.18},${H*0.025} L${W*0.18},${H*0.975} L${W*0.05},${H*0.96} Z`}
            fill="rgba(255,255,255,0.04)"
          />

          {/* tela */}
          <rect
            x={W*0.22} y={H*0.03}
            width={W*0.70} height={H*0.94}
            rx={W*0.07}
            fill="url(#tiltScreen)"
            clipPath="url(#tiltClip)"
          />

          {/* glow na tela */}
          <rect
            x={W*0.22} y={H*0.03}
            width={W*0.70} height={H*0.94}
            rx={W*0.07}
            fill="url(#tiltScreenGlow)"
          />

          {/* ondas de luz na tela */}
          <ellipse cx={W*0.55} cy={H*0.38} rx={W*0.22} ry={H*0.18}
            fill="none" stroke={accentColor} strokeWidth="1.5" strokeOpacity="0.18" />
          <ellipse cx={W*0.55} cy={H*0.38} rx={W*0.32} ry={H*0.26}
            fill="none" stroke={accentColor} strokeWidth="1" strokeOpacity="0.10" />
          <ellipse cx={W*0.55} cy={H*0.38} rx={W*0.42} ry={H*0.34}
            fill="none" stroke={accentColor} strokeWidth="0.5" strokeOpacity="0.06" />

          {/* dynamic island */}
          <rect
            x={W*0.46} y={H*0.045}
            width={W*0.18} height={H*0.022}
            rx={H*0.011}
            fill="#000"
          />

          {/* brilho superior */}
          <path
            d={`M${W*0.23},${H*0.03} L${W*0.90},${H*0.03} Q${W*0.92},${H*0.03} ${W*0.92},${H*0.045} L${W*0.23},${H*0.045} Z`}
            fill="rgba(255,255,255,0.05)"
          />

          {/* câmera traseira (visível na lateral) */}
          <rect x={W*0.06} y={H*0.12} width={W*0.09} height={W*0.09}
            rx={W*0.025} fill="rgba(255,255,255,0.08)" />
          <circle cx={W*0.105} cy={H*0.145} r={W*0.028}
            fill="rgba(0,0,0,0.6)" />
          <circle cx={W*0.105} cy={H*0.145} r={W*0.018}
            fill="rgba(30,30,40,0.9)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        </g>
      </svg>
    );
  }

  if (variant === 'back') {
    return (
      <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="backBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor={bodyColor === '#1c1c1e' ? '#252528' : bodyColor} />
            <stop offset="100%" stopColor={bodyColor} />
          </linearGradient>
          <radialGradient id="backSheen" cx="30%" cy="20%" r="70%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="backShadow">
            <feDropShadow dx="0" dy="20" stdDeviation="18" floodColor="rgba(0,0,0,0.7)" />
            <feDropShadow dx="0" dy="6"  stdDeviation="6"  floodColor="rgba(0,0,0,0.4)" />
          </filter>
          <linearGradient id="camModule" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
          </linearGradient>
        </defs>

        <g filter="url(#backShadow)">
          {/* corpo */}
          <rect width={width} height={h} rx={r} fill="url(#backBody)" />
          <rect width={width} height={h} rx={r} fill="url(#backSheen)" />

          {/* borda metálica */}
          <rect x="1" y="1" width={width-2} height={h-2} rx={r-1}
            fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.5" />

          {/* módulo câmera */}
          <rect
            x={width*0.10} y={h*0.04}
            width={width*0.53} height={width*0.53}
            rx={width*0.09}
            fill="url(#camModule)"
            stroke="rgba(255,255,255,0.08)" strokeWidth="1"
          />

          {/* 3 lentes */}
          {[
            { cx: width*0.275, cy: h*0.115 },
            { cx: width*0.52,  cy: h*0.115 },
            { cx: width*0.275, cy: h*0.195 },
          ].map((pos, i) => (
            <g key={i}>
              <circle cx={pos.cx} cy={pos.cy} r={width*0.095}
                fill="rgba(0,0,0,0.75)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" />
              <circle cx={pos.cx} cy={pos.cy} r={width*0.06}
                fill="#0a0a12" />
              <circle cx={pos.cx} cy={pos.cy} r={width*0.038}
                fill="#12121e" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
              <circle cx={pos.cx - width*0.018} cy={pos.cy - width*0.018} r={width*0.01}
                fill="rgba(255,255,255,0.35)" />
            </g>
          ))}

          {/* flash */}
          <circle cx={width*0.52} cy={h*0.195} r={width*0.038}
            fill="rgba(255,240,200,0.5)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />

          {/* logo Apple */}
          <g transform={`translate(${width*0.5 - width*0.06}, ${h*0.45}) scale(${width*0.0012})`} opacity="0.35">
            <path fill="rgba(255,255,255,0.6)"
              d="M100,15 C85,15 72,25 60,25 C46,25 35,15 20,15 C5,15 -5,30 -5,50 C-5,90 30,125 60,125 C75,125 85,115 100,115 C115,115 125,125 140,125 C170,125 205,90 205,50 C205,30 195,15 180,15 C165,15 154,25 140,25 C128,25 115,15 100,15 Z M100,-10 C110,-30 130,-35 140,-35 C138,-20 128,-5 118,0 C108,5 95,3 100,-10 Z" />
          </g>

          {/* botão lateral */}
          <rect x={width-2} y={h*0.28} width={4} height={h*0.10}
            rx={2} fill="rgba(255,255,255,0.15)" />
          {/* volume */}
          <rect x={-2} y={h*0.22} width={4} height={h*0.07}
            rx={2} fill="rgba(255,255,255,0.15)" />
          <rect x={-2} y={h*0.31} width={4} height={h*0.07}
            rx={2} fill="rgba(255,255,255,0.15)" />
        </g>
      </svg>
    );
  }

  // variant === 'front' (padrão)
  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`frontBody_${width}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor={bodyColor === '#1c1c1e' ? '#252528' : bodyColor} />
          <stop offset="100%" stopColor={bodyColor} />
        </linearGradient>
        <linearGradient id={`frontScreen_${width}`} x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%"   stopColor="#0b1020" />
          <stop offset="50%"  stopColor="#0d1828" />
          <stop offset="100%" stopColor="#060e18" />
        </linearGradient>
        <radialGradient id={`screenGlow_${width}`} cx="50%" cy="40%" r="55%">
          <stop offset="0%"   stopColor={accentColor} stopOpacity="0.22" />
          <stop offset="60%"  stopColor={accentColor} stopOpacity="0.06" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id={`frontShadow_${width}`}>
          <feDropShadow dx="0" dy="28" stdDeviation="22" floodColor="rgba(0,0,0,0.8)" />
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="rgba(0,0,0,0.5)" />
          <feDropShadow dx="0" dy="0"  stdDeviation="4"  floodColor={accentColor} floodOpacity="0.08" />
        </filter>
        <clipPath id={`screenClip_${width}`}>
          <rect
            x={width*0.065} y={h*0.015}
            width={width*0.87} height={h*0.97}
            rx={r * 0.85}
          />
        </clipPath>
      </defs>

      <g filter={`url(#frontShadow_${width})`}>
        {/* corpo */}
        <rect width={width} height={h} rx={r} fill={`url(#frontBody_${width})`} />

        {/* borda metálica */}
        <rect x="1.5" y="1.5" width={width-3} height={h-3} rx={r-1}
          fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />

        {/* tela */}
        <rect
          x={width*0.065} y={h*0.015}
          width={width*0.87} height={h*0.97}
          rx={r * 0.85}
          fill={`url(#frontScreen_${width})`}
        />

        {/* glow na tela */}
        <rect
          x={width*0.065} y={h*0.015}
          width={width*0.87} height={h*0.97}
          rx={r * 0.85}
          fill={`url(#screenGlow_${width})`}
        />

        {/* conteúdo abstrato na tela — circles de luz */}
        <g clipPath={`url(#screenClip_${width})`}>
          {/* onda 1 */}
          <ellipse cx={width*0.5} cy={h*0.42}
            rx={width*0.28} ry={h*0.16}
            fill="none" stroke={accentColor} strokeWidth="1.8" strokeOpacity="0.25" />
          {/* onda 2 */}
          <ellipse cx={width*0.5} cy={h*0.42}
            rx={width*0.42} ry={h*0.24}
            fill="none" stroke={accentColor} strokeWidth="1.2" strokeOpacity="0.14" />
          {/* onda 3 */}
          <ellipse cx={width*0.5} cy={h*0.42}
            rx={width*0.55} ry={h*0.32}
            fill="none" stroke="#00d1df" strokeWidth="0.8" strokeOpacity="0.09" />

          {/* ponto de luz central */}
          <radialGradient id={`centerLight_${width}`} cx="50%" cy="42%" r="25%">
            <stop offset="0%"   stopColor={accentColor} stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <ellipse cx={width*0.5} cy={h*0.42}
            rx={width*0.18} ry={h*0.10}
            fill={`url(#centerLight_${width})`} />

          {/* barra de status */}
          <rect x={width*0.10} y={h*0.026} width={width*0.24} height={h*0.008}
            rx={2} fill="rgba(255,255,255,0.25)" />
          <rect x={width*0.66} y={h*0.026} width={width*0.15} height={h*0.008}
            rx={2} fill="rgba(255,255,255,0.2)" />

          {/* brilho lateral */}
          <rect x={width*0.065} y={h*0.015} width={width*0.04} height={h*0.97}
            fill="rgba(255,255,255,0.04)" />
        </g>

        {/* dynamic island */}
        <rect
          x={width*0.33} y={h*0.022}
          width={width*0.34} height={h*0.028}
          rx={h*0.014}
          fill={bodyColor}
        />

        {/* botão direito */}
        <rect x={width-1.5} y={h*0.30} width={4} height={h*0.11}
          rx={2} fill="rgba(255,255,255,0.14)" />
        {/* volume esquerdo */}
        <rect x={-2.5} y={h*0.23} width={4} height={h*0.075}
          rx={2} fill="rgba(255,255,255,0.14)" />
        <rect x={-2.5} y={h*0.325} width={4} height={h*0.075}
          rx={2} fill="rgba(255,255,255,0.14)" />
        {/* mudo */}
        <rect x={-2.5} y={h*0.165} width={4} height={h*0.045}
          rx={2} fill="rgba(255,255,255,0.14)" />
      </g>
    </svg>
  );
}
