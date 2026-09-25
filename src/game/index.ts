/**
 * Frantic Battles - Phaser Game Configuration & Launcher
 */

import Phaser from 'phaser';
import { MainMenuScene } from './scenes/MainMenuScene';
import { HubScene } from './scenes/HubScene';
import { DungeonScene } from './scenes/DungeonScene';

export function createFranticGame(containerId: string): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: containerId,
    width: '100%',
    height: '100%',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    },
    pixelArt: true,
    roundPixels: true,
    scene: [MainMenuScene, HubScene, DungeonScene],
    backgroundColor: '#0a0e0c',
    input: {
      activePointers: 3
    }
  };

  return new Phaser.Game(config);
}
