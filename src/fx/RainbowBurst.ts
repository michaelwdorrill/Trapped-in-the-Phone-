import Phaser from 'phaser';
import {
  BURST_DURATION_MS,
  BURST_DISTANCE_PX,
  BURST_SCALE_TO,
  BURST_ALPHA_FROM,
} from '../config/constants';

// Rainbow colors for the burst effect
const RAINBOW_COLORS = [
  0xff0000, // Red
  0xff7f00, // Orange
  0xffff00, // Yellow
  0x00ff00, // Green
  0x00ffff, // Cyan
  0x0000ff, // Blue
  0x8b00ff, // Purple
];

export function spawnRainbowBurst(
  scene: Phaser.Scene,
  targetImage: Phaser.GameObjects.Image
): void {
  const numClones = RAINBOW_COLORS.length;
  const textureKey = targetImage.texture.key;
  const frameKey = targetImage.frame.name;
  const originX = targetImage.originX;
  const originY = targetImage.originY;
  const x = targetImage.x;
  const y = targetImage.y;
  const scaleX = targetImage.scaleX;
  const scaleY = targetImage.scaleY;
  const depth = targetImage.depth;

  for (let i = 0; i < numClones; i++) {
    // Calculate direction angle (evenly distributed around circle)
    const angle = (i / numClones) * Math.PI * 2;
    const dx = Math.cos(angle) * BURST_DISTANCE_PX;
    const dy = Math.sin(angle) * BURST_DISTANCE_PX;

    // Create clone
    const clone = scene.add.image(x, y, textureKey, frameKey);
    clone.setOrigin(originX, originY);
    clone.setScale(scaleX, scaleY);
    clone.setAlpha(BURST_ALPHA_FROM);
    clone.setTint(RAINBOW_COLORS[i]);
    clone.setDepth(depth - 1); // Behind target
    clone.setBlendMode(Phaser.BlendModes.ADD);

    // Tween: move outward, scale up, fade out
    scene.tweens.add({
      targets: clone,
      x: x + dx,
      y: y + dy,
      scaleX: scaleX * BURST_SCALE_TO,
      scaleY: scaleY * BURST_SCALE_TO,
      alpha: 0,
      duration: BURST_DURATION_MS,
      ease: 'Quad.easeOut',
      onComplete: () => {
        clone.destroy();
      },
    });
  }
}
