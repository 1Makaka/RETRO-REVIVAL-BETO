/**
 * Frantic Battles - Main Menu Scene
 * Fully responsive: expands and scales beautifully on any screen resolution.
 */

import Phaser from 'phaser';
import { generateAllTextures } from '../pixelArt';
import { soundEngine } from '../audio';

export class MainMenuScene extends Phaser.Scene {
  private bgRect!: Phaser.GameObjects.Rectangle;
  private ruinsContainer!: Phaser.GameObjects.Container;
  private caveEntrance!: Phaser.GameObjects.Rectangle;
  private mouseSprite!: Phaser.GameObjects.Image;
  private leftMenuContainer!: Phaser.GameObjects.Container;
  private fireflyParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  // Popups
  private popupContainer!: Phaser.GameObjects.Container;
  private popupBg!: Phaser.GameObjects.Rectangle;
  private popupDimBackdrop!: Phaser.GameObjects.Rectangle;
  private popupTitle!: Phaser.GameObjects.Text;
  private popupContentText!: Phaser.GameObjects.Text;

  // Settings UI
  private tabSoundsBtn!: Phaser.GameObjects.Text;
  private tabControlsBtn!: Phaser.GameObjects.Text;
  private musicVolBtn!: Phaser.GameObjects.Text;
  private soundVolBtn!: Phaser.GameObjects.Text;
  private muteAllBtn!: Phaser.GameObjects.Text;
  private openMusicBtn!: Phaser.GameObjects.Rectangle;
  private openMusicTxt!: Phaser.GameObjects.Text;
  private ctrlModeBtn!: Phaser.GameObjects.Text;

  // Music Selection Panel
  private musicPanel!: Phaser.GameObjects.Container;
  private track1CardBg!: Phaser.GameObjects.Rectangle;
  private track2CardBg!: Phaser.GameObjects.Rectangle;
  private track1BtnTxt!: Phaser.GameObjects.Text;
  private track2BtnTxt!: Phaser.GameObjects.Text;

  private isPC = false;
  private currentSettingsTab: 'sounds' | 'controls' = 'sounds';

  constructor() {
    super({ key: 'MainMenu' });
  }

  preload() {
    generateAllTextures(this);
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.isPC = this.registry.get('isPC') || false;

    this.cameras.main.fadeIn(400, 0, 0, 0);

    // 1. Deep dark fantasy mossy forest background
    this.bgRect = this.add.rectangle(0, 0, width, height, 0x07110c).setOrigin(0, 0);

    // Decorative forest canopy silhouettes
    const darkTreesLeft = this.add.rectangle(-40, height / 2, 120, height * 1.5, 0x040906).setOrigin(0, 0.5);
    const darkTreesRight = this.add.rectangle(width + 40, height / 2, 120, height * 1.5, 0x040906).setOrigin(1, 0.5);

    // 2. Responsive ARCO-style Stone Temple Monolith & Cave entrance
    this.ruinsContainer = this.add.container(0, 0);

    const stonePathGfx = this.add.graphics();
    stonePathGfx.fillStyle(0x19271c, 0.9);
    stonePathGfx.fillPoints([
      new Phaser.Math.Vector2(-25, 120),
      new Phaser.Math.Vector2(25, 120),
      new Phaser.Math.Vector2(45, 230),
      new Phaser.Math.Vector2(-45, 230)
    ]);
    // Stepping stones
    stonePathGfx.fillStyle(0x324633, 0.9);
    stonePathGfx.fillRoundedRect(-14, 90, 28, 12, 3);
    stonePathGfx.fillRoundedRect(-18, 112, 36, 14, 4);
    stonePathGfx.fillRoundedRect(-22, 136, 44, 16, 4);
    stonePathGfx.fillRoundedRect(-26, 162, 52, 18, 4);

    const templeImage = this.add.image(0, 0, 'arco_ruins').setScale(1.2);

    // Mysterious inner emerald cave glow
    this.caveEntrance = this.add.rectangle(0, 56, 70, 75, 0x052e1a, 0.45);
    this.tweens.add({
      targets: this.caveEntrance,
      alpha: 0.85,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Warrior standing on the path looking towards the entrance (proudly visible)
    const warriorOnPath = this.add.image(0, 140, 'arco_warrior').setScale(1.5);
    this.tweens.add({
      targets: warriorOnPath,
      y: 137,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Running mouse creature placed directly by the entrance steps
    this.mouseSprite = this.add.image(0, 95, 'bg_mouse').setScale(1.4);

    this.ruinsContainer.add([
      stonePathGfx,
      templeImage,
      this.caveEntrance,
      warriorOnPath,
      this.mouseSprite
    ]);
    this.setupMousePatrol();

    // 4. Glowing ambient forest spores & fireflies
    this.fireflyParticles = this.add.particles(0, 0, 'firefly', {
      x: { min: width * 0.3, max: width },
      y: { min: height * 0.15, max: height },
      lifespan: { min: 3500, max: 7000 },
      speedY: { min: -10, max: -26 },
      speedX: { min: -14, max: 14 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.95, end: 0 },
      blendMode: 'ADD',
      frequency: 200
    });

    // 5. Left Branding & Menu Buttons Container (ARCO styled)
    this.leftMenuContainer = this.add.container(0, 0);

    // Bold rounded retro typography with shadow (matching ARCO reference)
    const titleShadow = this.add.text(4, 4, 'RETRO\nREVIVAL', {
      fontSize: '48px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#040b07'
    }).setOrigin(0, 0);

    const titleText = this.add.text(0, 0, 'RETRO\nREVIVAL', {
      fontSize: '48px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0);

    this.tweens.add({
      targets: titleText,
      alpha: 0.92,
      duration: 1400,
      yoyo: true,
      repeat: -1
    });

    this.leftMenuContainer.add([titleShadow, titleText]);

    // Menu Buttons: ВЗРЫВ, ПРОФИЛЬ, НАСТРОЙКИ
    const startY = 155;
    const spacing = 58;

    this.addMenuButtonToContainer(this.leftMenuContainer, 0, startY, 'ВЗРЫВ', '#4ade80', () => {
      this.startGame();
    });

    this.addMenuButtonToContainer(this.leftMenuContainer, 0, startY + spacing, 'ПРОФИЛЬ', '#ffffff', () => {
      this.showProfilePopup();
    });

    this.addMenuButtonToContainer(this.leftMenuContainer, 0, startY + spacing * 2, 'НАСТРОЙКИ', '#ffffff', () => {
      this.showSettingsPopup();
    });

    // 6. Build the Popup UI and Music Selection Modal
    this.buildPopups(width, height);

    // Initial Layout positioning
    this.layoutElements(width, height);

    // Handle First-touch audio start
    this.input.once('pointerdown', () => {
      soundEngine.startMusic();
    });

    // Listen to window / scale resize
    this.scale.on('resize', this.handleResize, this);
  }

  private addMenuButtonToContainer(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    text: string,
    defaultColor: string,
    callback: () => void
  ) {
    const item = this.add.text(x, y, text, {
      fontSize: '26px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: defaultColor
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    item.on('pointerover', () => {
      item.setColor('#fef08a');
      item.x = x + 10;
      soundEngine.playClick();
    });

    item.on('pointerout', () => {
      item.setColor(defaultColor);
      item.x = x;
    });

    item.on('pointerdown', () => {
      soundEngine.playClick();
      callback();
    });

    container.add(item);
  }

  private setupMousePatrol() {
    if (!this.mouseSprite) return;

    // Remove existing tweens to prevent conflict
    this.tweens.killTweensOf(this.mouseSprite);

    this.mouseSprite.setPosition(0, 95);
    this.mouseSprite.setFlipX(false);

    // Continuous cute hopping animation directly on the doorstep
    this.tweens.add({
      targets: this.mouseSprite,
      y: 86,
      duration: 220,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeOut'
    });

    // Pacing back and forth right in front of the cave entrance door
    const minX = -38;
    const maxX = 38;

    const runRight = () => {
      if (!this.mouseSprite || !this.scene.isActive('MainMenu')) return;
      this.mouseSprite.setFlipX(false);
      this.tweens.add({
        targets: this.mouseSprite,
        x: maxX,
        duration: 1800,
        ease: 'Linear',
        onComplete: () => {
          this.time.delayedCall(250, runLeft);
        }
      });
    };

    const runLeft = () => {
      if (!this.mouseSprite || !this.scene.isActive('MainMenu')) return;
      this.mouseSprite.setFlipX(true);
      this.tweens.add({
        targets: this.mouseSprite,
        x: minX,
        duration: 1800,
        ease: 'Linear',
        onComplete: () => {
          this.time.delayedCall(250, runRight);
        }
      });
    };

    runRight();
  }

  private layoutElements(width: number, height: number) {
    // 1. Background
    if (this.bgRect) {
      this.bgRect.setSize(width, height);
    }

    // 2. Ruins & Cave Entrance: Lowered comfortably so the composition is balanced and hero on path is visible
    if (this.ruinsContainer) {
      const rScale = Phaser.Math.Clamp(Math.min(width / 820, height / 580), 0.75, 1.45);
      const rx = Math.round(width * 0.72);
      const ry = Math.round(height * 0.54);
      this.ruinsContainer.setPosition(rx, ry).setScale(rScale);
    }

    // 4. Left Menu Container
    if (this.leftMenuContainer) {
      const menuScale = Phaser.Math.Clamp(Math.min(width / 750, height / 550), 0.85, 1.65);
      const leftPad = Math.max(30, Math.round(width * 0.08));
      const topPad = Math.max(30, Math.round(height * 0.12));
      this.leftMenuContainer.setPosition(leftPad, topPad).setScale(menuScale);
    }

    // 5. Popups & Modals: Expands with screen without 1.0 limit!
    if (this.popupContainer) {
      const popupScale = Phaser.Math.Clamp(Math.min((width * 0.92) / 520, (height * 0.90) / 360), 0.75, 2.1);
      this.popupContainer.setPosition(width / 2, height / 2).setScale(popupScale);
      if (this.popupDimBackdrop) {
        this.popupDimBackdrop.setSize(width * 4, height * 4);
      }
    }
  }

  private buildPopups(width: number, height: number) {
    const cx = width / 2;
    const cy = height / 2;

    this.popupContainer = this.add.container(cx, cy).setDepth(200).setVisible(false);

    // Dim backdrop
    this.popupDimBackdrop = this.add.rectangle(0, 0, width * 4, height * 4, 0x000000, 0.75)
      .setInteractive()
      .on('pointerdown', (_p: unknown, _lx: unknown, _ly: unknown, event: { stopPropagation: () => void }) => {
        event.stopPropagation();
      });
    this.popupContainer.add(this.popupDimBackdrop);

    // Window Frame
    this.popupBg = this.add.rectangle(0, 0, 520, 360, 0x18201a)
      .setStrokeStyle(4, 0x4ade80);
    this.popupContainer.add(this.popupBg);

    // Popup Title
    this.popupTitle = this.add.text(0, -135, '', {
      fontSize: '22px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.popupContainer.add(this.popupTitle);

    // Profile / General Text Content
    this.popupContentText = this.add.text(0, -10, '', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#e2e8f0',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);
    this.popupContainer.add(this.popupContentText);

    // Corner X button
    const cornerClose = this.add.text(230, -150, '[X]', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#f87171'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    cornerClose.on('pointerdown', () => {
      soundEngine.playClick();
      this.popupContainer.setVisible(false);
    });

    // Settings Tabs: [ ЗВУКИ ] and [ УПРАВЛЕНИЕ ]
    this.tabSoundsBtn = this.add.text(-110, -95, '[ ЗВУКИ ]', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#4ade80'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.tabControlsBtn = this.add.text(110, -95, '[ УПРАВЛЕНИЕ ]', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#94a3b8'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.tabSoundsBtn.on('pointerdown', () => this.switchSettingsTab('sounds'));
    this.tabControlsBtn.on('pointerdown', () => this.switchSettingsTab('controls'));

    // Sound Options
    this.musicVolBtn = this.add.text(0, -45, this.getMusicText(), {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: soundEngine.isMusicOn() ? '#4ade80' : '#f87171'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.soundVolBtn = this.add.text(0, -5, this.getSfxText(), {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: soundEngine.isSfxOn() ? '#4ade80' : '#f87171'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.musicVolBtn.on('pointerdown', () => {
      soundEngine.toggleMusic();
      this.musicVolBtn.setText(this.getMusicText()).setColor(soundEngine.isMusicOn() ? '#4ade80' : '#f87171');
    });

    this.soundVolBtn.on('pointerdown', () => {
      soundEngine.toggleSfx();
      this.soundVolBtn.setText(this.getSfxText()).setColor(soundEngine.isSfxOn() ? '#4ade80' : '#f87171');
    });

    // Button: Open Music Selection Panel
    this.openMusicBtn = this.add.rectangle(0, 42, 260, 38, 0x1d4ed8)
      .setStrokeStyle(2, 0x60a5fa)
      .setInteractive({ useHandCursor: true });
    this.openMusicTxt = this.add.text(0, 42, 'ВЫБРАТЬ МУЗЫКУ 🎵', {
      fontSize: '16px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.openMusicBtn.on('pointerdown', () => {
      soundEngine.playClick();
      this.openMusicSelectionModal();
    });

    // Mute All
    this.muteAllBtn = this.add.text(0, 88, '[ ВЫКЛЮЧИТЬ ВСЁ ]', {
      fontSize: '15px',
      fontFamily: 'monospace',
      color: '#ef4444'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.muteAllBtn.on('pointerdown', () => {
      soundEngine.setMuteAll(true);
      this.musicVolBtn.setText(this.getMusicText()).setColor('#f87171');
      this.soundVolBtn.setText(this.getSfxText()).setColor('#f87171');
    });

    // Controls Option
    this.ctrlModeBtn = this.add.text(0, 0, this.isPC ? 'РЕЖИМ: [ КЛАВИАТУРА ПК ]' : 'РЕЖИМ: [ ДЖОЙСТИК ТЕЛЕФОН ]', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#facc15'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.ctrlModeBtn.on('pointerdown', () => {
      soundEngine.playClick();
      this.isPC = !this.isPC;
      this.registry.set('isPC', this.isPC);
      this.ctrlModeBtn.setText(this.isPC ? 'РЕЖИМ: [ КЛАВИАТУРА ПК ]' : 'РЕЖИМ: [ ДЖОЙСТИК ТЕЛЕФОН ]');
    });

    this.popupContainer.add([
      this.tabSoundsBtn,
      this.tabControlsBtn,
      this.musicVolBtn,
      this.soundVolBtn,
      this.openMusicBtn,
      this.openMusicTxt,
      this.muteAllBtn,
      this.ctrlModeBtn,
      cornerClose
    ]);

    // Separate Music Selection Modal Panel
    this.buildMusicSelectionPanel();
    this.popupContainer.add(this.musicPanel);
  }

  private showExitPopup() {
    this.musicPanel.setVisible(false);
    this.hideSettingsElements();
    this.popupTitle.setText('ВЫХОД ИЗ ИГРЫ').setVisible(true);
    this.popupContentText.setText(
      'Спасибо за игру в Retro Revival!\n\n' +
      'Для продолжения приключения\nнажмите [ CONTINUE ] или [ NEW GAME ].\n\n' +
      'Чтобы покинуть игру, просто закройте вкладку браузера.'
    ).setVisible(true);
    this.popupContainer.setVisible(true);
  }

  private getMusicText(): string {
    return soundEngine.isMusicOn() ? 'МУЗЫКА: [ ВКЛЮЧЕНА ]' : 'МУЗЫКА: [ ВЫКЛЮЧЕНА ]';
  }

  private getSfxText(): string {
    return soundEngine.isSfxOn() ? 'ЗВУКИ ЭФФЕКТОВ: [ ВКЛ ]' : 'ЗВУКИ ЭФФЕКТОВ: [ ВЫКЛ ]';
  }

  private buildMusicSelectionPanel() {
    this.musicPanel = this.add.container(0, 0).setVisible(false).setDepth(210);

    const musicBg = this.add.rectangle(0, 0, 520, 360, 0x0f172a)
      .setStrokeStyle(4, 0x38bdf8);

    const musicTitle = this.add.text(0, -140, 'ВЫБОР МУЗЫКАЛЬНОГО ТРЕКА', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#f0f9ff'
    }).setOrigin(0.5);

    // Track 1 Card: WIKLUND
    const t1X = -120;
    const t1Y = -15;
    this.track1CardBg = this.add.rectangle(t1X, t1Y, 200, 195, 0x1e293b)
      .setStrokeStyle(3, soundEngine.getSelectedTrack() === 'Wiklund' ? 0x4ade80 : 0x475569)
      .setInteractive({ useHandCursor: true });

    const pic1 = this.add.image(t1X, t1Y - 35, 'WiklundPic').setDisplaySize(96, 96);

    const name1 = this.add.text(t1X, t1Y + 28, 'WIKLUND', {
      fontSize: '16px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#fef08a'
    }).setOrigin(0.5);

    const desc1 = this.add.text(t1X, t1Y + 46, 'Поход Кота (8-bit)', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#94a3b8'
    }).setOrigin(0.5);

    this.track1BtnTxt = this.add.text(t1X, t1Y + 74, soundEngine.getSelectedTrack() === 'Wiklund' ? '▶ ИГРАЕТ' : '[ ВЫБРАТЬ ]', {
      fontSize: '14px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: soundEngine.getSelectedTrack() === 'Wiklund' ? '#4ade80' : '#ffffff'
    }).setOrigin(0.5);

    this.track1CardBg.on('pointerdown', () => {
      soundEngine.playClick();
      soundEngine.selectTrack('Wiklund');
      this.updateTrackSelectionUI();
    });

    // Track 2 Card: NEOWAVE
    const t2X = 120;
    const t2Y = -15;
    this.track2CardBg = this.add.rectangle(t2X, t2Y, 200, 195, 0x1e293b)
      .setStrokeStyle(3, soundEngine.getSelectedTrack() === 'Neowave' ? 0x4ade80 : 0x475569)
      .setInteractive({ useHandCursor: true });

    const pic2 = this.add.image(t2X, t2Y - 35, 'NeowavePic').setDisplaySize(96, 96);

    const name2 = this.add.text(t2X, t2Y + 28, 'NEOWAVE', {
      fontSize: '16px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#e0aaff'
    }).setOrigin(0.5);

    const desc2 = this.add.text(t2X, t2Y + 46, 'Замок Короля (Synth)', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#94a3b8'
    }).setOrigin(0.5);

    this.track2BtnTxt = this.add.text(t2X, t2Y + 74, soundEngine.getSelectedTrack() === 'Neowave' ? '▶ ИГРАЕТ' : '[ ВЫБРАТЬ ]', {
      fontSize: '14px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: soundEngine.getSelectedTrack() === 'Neowave' ? '#4ade80' : '#ffffff'
    }).setOrigin(0.5);

    this.track2CardBg.on('pointerdown', () => {
      soundEngine.playClick();
      soundEngine.selectTrack('Neowave');
      this.updateTrackSelectionUI();
    });

    // Back button from Music panel
    const musicBackBtn = this.add.rectangle(0, 138, 220, 38, 0x334155)
      .setInteractive({ useHandCursor: true });
    const musicBackTxt = this.add.text(0, 138, '< НАЗАД В НАСТРОЙКИ', {
      fontSize: '15px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    musicBackBtn.on('pointerdown', () => {
      soundEngine.playClick();
      this.musicPanel.setVisible(false);
      this.showSettingsPopup();
    });

    // Corner close X
    const musicClose = this.add.text(230, -150, '[X]', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#f87171'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    musicClose.on('pointerdown', () => {
      soundEngine.playClick();
      this.popupContainer.setVisible(false);
      this.musicPanel.setVisible(false);
    });

    this.musicPanel.add([
      musicBg,
      musicTitle,
      this.track1CardBg, pic1, name1, desc1, this.track1BtnTxt,
      this.track2CardBg, pic2, name2, desc2, this.track2BtnTxt,
      musicBackBtn, musicBackTxt,
      musicClose
    ]);
  }

  private updateTrackSelectionUI() {
    const track = soundEngine.getSelectedTrack();
    this.track1CardBg.setStrokeStyle(3, track === 'Wiklund' ? 0x4ade80 : 0x475569);
    this.track2CardBg.setStrokeStyle(3, track === 'Neowave' ? 0x4ade80 : 0x475569);
    this.track1BtnTxt.setText(track === 'Wiklund' ? '▶ ИГРАЕТ' : '[ ВЫБРАТЬ ]')
      .setColor(track === 'Wiklund' ? '#4ade80' : '#ffffff');
    this.track2BtnTxt.setText(track === 'Neowave' ? '▶ ИГРАЕТ' : '[ ВЫБРАТЬ ]')
      .setColor(track === 'Neowave' ? '#4ade80' : '#ffffff');
  }

  private openMusicSelectionModal() {
    this.hideSettingsElements();
    this.popupTitle.setVisible(false);
    this.popupContentText.setVisible(false);
    this.updateTrackSelectionUI();
    this.musicPanel.setVisible(true);
  }

  private showProfilePopup() {
    this.musicPanel.setVisible(false);
    this.hideSettingsElements();
    this.popupTitle.setText('ПРОФИЛЬ БОЙЦА').setVisible(true);

    const savedRank = localStorage.getItem('fb_rank_points') || '1450';
    const profileInfo =
      '═══ СТАТИСТИКА БОЕВ ═══\n\n' +
      'Побед в боях: 12\n' +
      'Сражено противников: 45\n' +
      'Ранг: [ ЗОЛОТОЙ ВОИН ]\n' +
      `Рейтинговые очки: ${savedRank} / 1500 pts\n` +
      'Любимый боец: ZAZA (Эпический)\n\n' +
      'Управляй героями у Алтаря в Хабе!';

    this.popupContentText.setText(profileInfo).setVisible(true);
    this.popupContainer.setVisible(true);
  }

  private showSettingsPopup() {
    this.musicPanel.setVisible(false);
    this.popupContentText.setVisible(false);
    this.popupTitle.setText('НАСТРОЙКИ').setVisible(true);
    this.tabSoundsBtn.setVisible(true);
    this.tabControlsBtn.setVisible(true);
    this.switchSettingsTab(this.currentSettingsTab);
    this.popupContainer.setVisible(true);
  }

  private switchSettingsTab(tab: 'sounds' | 'controls') {
    this.currentSettingsTab = tab;
    if (tab === 'sounds') {
      this.tabSoundsBtn.setColor('#4ade80');
      this.tabControlsBtn.setColor('#94a3b8');
      this.musicVolBtn.setVisible(true);
      this.soundVolBtn.setVisible(true);
      this.openMusicBtn.setVisible(true);
      this.openMusicTxt.setVisible(true);
      this.muteAllBtn.setVisible(true);
      this.ctrlModeBtn.setVisible(false);
    } else {
      this.tabSoundsBtn.setColor('#94a3b8');
      this.tabControlsBtn.setColor('#4ade80');
      this.musicVolBtn.setVisible(false);
      this.soundVolBtn.setVisible(false);
      this.openMusicBtn.setVisible(false);
      this.openMusicTxt.setVisible(false);
      this.muteAllBtn.setVisible(false);
      this.ctrlModeBtn.setVisible(true);
    }
  }

  private hideSettingsElements() {
    this.tabSoundsBtn.setVisible(false);
    this.tabControlsBtn.setVisible(false);
    this.musicVolBtn.setVisible(false);
    this.soundVolBtn.setVisible(false);
    this.openMusicBtn.setVisible(false);
    this.openMusicTxt.setVisible(false);
    this.muteAllBtn.setVisible(false);
    this.ctrlModeBtn.setVisible(false);
  }

  private startGame() {
    soundEngine.playLevelUp();
    const targetX = this.ruinsContainer.x + this.caveEntrance.x * this.ruinsContainer.scaleX;
    const targetY = this.ruinsContainer.y + this.caveEntrance.y * this.ruinsContainer.scaleY;

    this.cameras.main.pan(targetX, targetY, 400, 'Sine.easeIn');
    this.cameras.main.fadeOut(450, 0, 0, 0);

    let started = false;
    const proceedToHub = () => {
      if (started) return;
      started = true;
      this.scene.start('HubScene');
    };

    this.cameras.main.once('camerafadeoutcomplete', proceedToHub);
    this.time.delayedCall(500, proceedToHub);
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    this.layoutElements(gameSize.width, gameSize.height);
  }
}
