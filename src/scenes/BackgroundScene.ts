import Phaser from 'phaser';
import { GAME_W, GAME_H, BG_SCROLL_X_PX_PER_SEC, BG_SCROLL_Y_PX_PER_SEC } from '../config/constants';

export class BackgroundScene extends Phaser.Scene {
  private bgTile!: Phaser.GameObjects.TileSprite;
  private isVisible: boolean = false;

  constructor() {
    super({ key: 'BackgroundScene' });
  }

  create(): void {
    // Create tile sprite covering the game area
    // Background.png is 1080x1920, so we use tileScale of 0.5 to fit 540x960
    this.bgTile = this.add.tileSprite(0, 0, GAME_W, GAME_H, 'start_bg');
    this.bgTile.setOrigin(0, 0);
    this.bgTile.setTileScale(0.5, 0.5);

    // Initially hidden
    this.bgTile.setVisible(false);
    this.isVisible = false;
  }

  update(_time: number, delta: number): void {
    if (!this.isVisible) return;

    // Scroll diagonally down-right
    const dtSeconds = delta / 1000;
    this.bgTile.tilePositionX += BG_SCROLL_X_PX_PER_SEC * dtSeconds;
    this.bgTile.tilePositionY += BG_SCROLL_Y_PX_PER_SEC * dtSeconds;
  }

  setBackgroundVisible(visible: boolean): void {
    this.isVisible = visible;
    this.bgTile.setVisible(visible);
  }
}
