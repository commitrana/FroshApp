import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { GLView } from 'expo-gl';

const ElectricBorder = ({
  children,
  color = '#7df9ff',
  speed = 3,            // faster movement
  chaos = 3,           // more waviness
  thickness = 2,      // 6× thinner
  borderRadius = 22,
  margin = 14,
  style,
}) => {
  const glRef = useRef(null);
  const animFrameId = useRef(null);
  const startTime = useRef(Date.now());
  const propsRef = useRef({ thickness, speed, chaos, color, borderRadius });

  useEffect(() => {
    propsRef.current = { thickness, speed, chaos, color, borderRadius };
  }, [thickness, speed, chaos, color, borderRadius]);

  const vertexShaderSource = `
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentShaderSource = `
    precision highp float;

    uniform vec2  uResolution;
    uniform float uTime;
    uniform vec3  uColor;
    uniform float uThickness;
    uniform float uBorderRadius;
    uniform float uChaos;
    uniform float uSpeed;

    varying vec2 vUv;

    // ---- Noise ----
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    float noise2D(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(random(i + vec2(0.0,0.0)), random(i + vec2(1.0,0.0)), u.x),
                 mix(random(i + vec2(0.0,1.0)), random(i + vec2(1.0,1.0)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float value = 0.0;
      float amp = 0.5;
      float freq = 4.0;
      for (int i = 0; i < 4; i++) {
        value += amp * noise2D(p * freq);
        freq *= 2.0;
        amp *= 0.5;
      }
      return value;
    }

    // ---- Rounded rect SDF ----
    float sdRoundedRect(vec2 p, vec2 size, float r) {
      vec2 d = abs(p) - size + r;
      return length(max(d, 0.0)) - r;
    }

    void main() {
      vec2 uv = vUv;
      vec2 res = uResolution;
      float aspect = res.x / res.y;

      vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
      vec2 halfSize = vec2(0.45 * aspect, 0.45);

      float radius = uBorderRadius / min(res.x, res.y) * 1.8;
      float time = uTime * uSpeed;

      // ---- Displacement (wavy) ----
      float noiseX = fbm(vec2(uv.x * 6.0, uv.y * 3.0 + time * 0.2));
      float noiseY = fbm(vec2(uv.x * 6.0 + 1.7, uv.y * 3.0 + time * 0.2 + 2.3));
      vec2 displacement = vec2(noiseX - 0.5, noiseY - 0.5) * uChaos * 0.25; // increased amplitude

      vec2 displacedUv = uv + displacement;
      vec2 pDisplaced = (displacedUv - 0.5) * vec2(aspect, 1.0);

      float d = sdRoundedRect(pDisplaced, halfSize, radius);

      // ---- Thickness scaling (6× thinner) ----
      float thicknessNorm = uThickness * 0.0005;   // unchanged multiplier

      // ---- Line (sharp) ----
      float line = 1.0 - smoothstep(0.0, thicknessNorm, abs(d));

      // ---- Glow (tight and dim) ----
      float glow = exp(-abs(d) * 350.0) * 0.06;

      // ---- Color ----
      vec3 color = uColor * (0.9 + 0.2 * sin(time * 2.0 + uv.x * 20.0 + uv.y * 12.0));

      float alpha = max(line, glow);
      if (alpha < 0.01) discard;

      color *= 1.2;
      gl_FragColor = vec4(color, alpha);
    }
  `;

  const onContextCreate = (gl) => {
    glRef.current = gl;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vertexShaderSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error('VS error:', gl.getShaderInfoLog(vs));
      return;
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fragmentShaderSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error('FS error:', gl.getShaderInfoLog(fs));
      return;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(prog));
      return;
    }

    // Buffers
    const positions = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const uvs = new Float32Array([0, 0, 2, 0, 0, 2]);
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);

    const loc = (name) => gl.getUniformLocation(prog, name);
    const u = {
      uResolution: loc('uResolution'),
      uTime: loc('uTime'),
      uColor: loc('uColor'),
      uThickness: loc('uThickness'),
      uBorderRadius: loc('uBorderRadius'),
      uChaos: loc('uChaos'),
      uSpeed: loc('uSpeed'),
    };

    const posAttr = gl.getAttribLocation(prog, 'position');
    const uvAttr = gl.getAttribLocation(prog, 'uv');
    gl.enableVertexAttribArray(posAttr);
    gl.enableVertexAttribArray(uvAttr);

    startTime.current = Date.now();

    const render = () => {
      const now = Date.now();
      const time = (now - startTime.current) / 1000;
      const w = gl.drawingBufferWidth;
      const h = gl.drawingBufferHeight;

      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(prog);

      const currentProps = propsRef.current;
      const hex = currentProps.color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;

      gl.uniform3f(u.uColor, r, g, b);
      gl.uniform1f(u.uThickness, currentProps.thickness);
      gl.uniform1f(u.uBorderRadius, currentProps.borderRadius);
      gl.uniform1f(u.uChaos, currentProps.chaos);
      gl.uniform1f(u.uSpeed, currentProps.speed);
      gl.uniform2f(u.uResolution, w, h);
      gl.uniform1f(u.uTime, time);

      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
      gl.vertexAttribPointer(uvAttr, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.endFrameEXP();

      animFrameId.current = requestAnimationFrame(render);
    };
    render();
  };

  useEffect(() => {
    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, []);

  return (
    <View style={[styles.container, { padding: margin }, style]}>
      <GLView style={styles.glView} onContextCreate={onContextCreate} />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'visible',
  },
  glView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});

export default ElectricBorder;