// Mounts the wave-wall reveal diagram (uploaded module, used as-is) on the last sheet.
import { initWaveWallDiagram } from './wave-wall-reveal.js';
const host = document.getElementById('wave-wall-diagram');
if (host) {
  initWaveWallDiagram({
    containerId: 'wave-wall-diagram',
    wallUrl: 'img/wave_wall.glb',
    restUrl: 'img/stair_rest.glb',
    trackArea: 'container',
    background: null,
    smoothing: 0.08,
    autoRotate: true,
  }).then(() => host.classList.add('ready')).catch((e) => { console.error(e); host.classList.add('failed'); });
}
