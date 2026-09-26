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
  private track3CardBg!: Phaser.GameObjects.Rectangle;
  private track1BtnTxt!: Phaser.GameObjects.Text;
  private track2BtnTxt!: Phaser.GameObjects.Text;
  private track3BtnTxt!: Phaser.GameObjects.Text;

  // Adventurer Profile Panel (7 Avatars & Fantasy Lore)
  private profilePanel!: Phaser.GameObjects.Container;
  private selectedAvatarKey = 'char_grim';
  private avatarCards: Array<{ key: string; bg: Phaser.GameObjects.Rectangle }> = [];
  private profileNameText!: Phaser.GameObjects.Text;
  private profileAvatarImage!: Phaser.GameObjects.Image;

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
    this.bgRect = this.add.rectangle(0, 0, width, height, 0x050807).setOrigin(0, 0);

    // Vignette overlay for dark atmospheric edges
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.45);
    vignette.fillRect(0, 0, width, height);
    vignette.fillStyle(0x000000, 0.65);
    vignette.fillRect(0, 0, width, 60);
    vignette.fillRect(0, height - 60, width, 60);

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
    if (this.bgRect && typeof this.bgRect.setDisplaySize === 'function') {
      this.bgRect.setDisplaySize(width, height);
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
      if (this.popupDimBackdrop && typeof this.popupDimBackdrop.setDisplaySize === 'function') {
        this.popupDimBackdrop.setDisplaySize(width * 4, height * 4);
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

    // Adventurer Profile Panel (7 Avatars & Fantasy Lore)
    this.buildProfilePanel();
    this.popupContainer.add(this.profilePanel);
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
    const t1X = -170;
    const t1Y = -15;
    this.track1CardBg = this.add.rectangle(t1X, t1Y, 155, 185, 0x1e293b)
      .setStrokeStyle(3, soundEngine.getSelectedTrack() === 'Wiklund' ? 0x4ade80 : 0x475569)
      .setInteractive({ useHandCursor: true });

    const pic1 = this.add.image(t1X, t1Y - 35, 'WiklundPic').setDisplaySize(72, 72);

    const name1 = this.add.text(t1X, t1Y + 22, 'WIKLUND', {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', color: '#fef08a'
    }).setOrigin(0.5);

    const desc1 = this.add.text(t1X, t1Y + 40, 'Поход (8-bit)', {
      fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8'
    }).setOrigin(0.5);

    this.track1BtnTxt = this.add.text(t1X, t1Y + 65, soundEngine.getSelectedTrack() === 'Wiklund' ? '▶ ИГРАЕТ' : '[ ВЫБРАТЬ ]', {
      fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold',
      color: soundEngine.getSelectedTrack() === 'Wiklund' ? '#4ade80' : '#ffffff'
    }).setOrigin(0.5);

    this.track1CardBg.on('pointerdown', () => {
      soundEngine.playClick();
      soundEngine.selectTrack('Wiklund');
      this.updateTrackSelectionUI();
    });

    // Track 2 Card: NEOWAVE
    const t2X = 0;
    const t2Y = -15;
    this.track2CardBg = this.add.rectangle(t2X, t2Y, 155, 185, 0x1e293b)
      .setStrokeStyle(3, soundEngine.getSelectedTrack() === 'Neowave' ? 0x4ade80 : 0x475569)
      .setInteractive({ useHandCursor: true });

    const pic2 = this.add.image(t2X, t2Y - 35, 'NeowavePic').setDisplaySize(72, 72);

    const name2 = this.add.text(t2X, t2Y + 22, 'NEOWAVE', {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', color: '#e0aaff'
    }).setOrigin(0.5);

    const desc2 = this.add.text(t2X, t2Y + 40, 'Замок (Synth)', {
      fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8'
    }).setOrigin(0.5);

    this.track2BtnTxt = this.add.text(t2X, t2Y + 65, soundEngine.getSelectedTrack() === 'Neowave' ? '▶ ИГРАЕТ' : '[ ВЫБРАТЬ ]', {
      fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold',
      color: soundEngine.getSelectedTrack() === 'Neowave' ? '#4ade80' : '#ffffff'
    }).setOrigin(0.5);

    this.track2CardBg.on('pointerdown', () => {
      soundEngine.playClick();
      soundEngine.selectTrack('Neowave');
      this.updateTrackSelectionUI();
    });

    // Track 3 Card: VOID OVERLORD
    const t3X = 170;
    const t3Y = -15;
    this.track3CardBg = this.add.rectangle(t3X, t3Y, 155, 185, 0x1e293b)
      .setStrokeStyle(3, soundEngine.getSelectedTrack() === 'VoidOverlord' ? 0x4ade80 : 0x475569)
      .setInteractive({ useHandCursor: true });

    const pic3 = this.add.image(t3X, t3Y - 35, 'VoidOverlordPic').setDisplaySize(72, 72);

    const name3 = this.add.text(t3X, t3Y + 22, 'ВЛАСТЕЛИН', {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', color: '#c084fc'
    }).setOrigin(0.5);

    const desc3 = this.add.text(t3X, t3Y + 40, 'Экшен №3 (Techno)', {
      fontSize: '10px', fontFamily: 'monospace', color: '#94a3b8'
    }).setOrigin(0.5);

    this.track3BtnTxt = this.add.text(t3X, t3Y + 65, soundEngine.getSelectedTrack() === 'VoidOverlord' ? '▶ ИГРАЕТ' : '[ ВЫБРАТЬ ]', {
      fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold',
      color: soundEngine.getSelectedTrack() === 'VoidOverlord' ? '#4ade80' : '#ffffff'
    }).setOrigin(0.5);

    this.track3CardBg.on('pointerdown', () => {
      soundEngine.playClick();
      soundEngine.selectTrack('VoidOverlord');
      this.updateTrackSelectionUI();
    });

    // Back button from Music panel
    const musicBackBtn = this.add.rectangle(0, 138, 220, 38, 0x334155)
      .setInteractive({ useHandCursor: true });
    const musicBackTxt = this.add.text(0, 138, '< НАЗАД В НАСТРОЙКИ', {
      fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    musicBackBtn.on('pointerdown', () => {
      soundEngine.playClick();
      this.musicPanel.setVisible(false);
      this.showSettingsPopup();
    });

    // Corner close X
    const musicClose = this.add.text(230, -150, '[X]', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#f87171'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    musicClose.on('pointerdown', () => {
      soundEngine.playClick();
      this.popupContainer.setVisible(false);
      this.musicPanel.setVisible(false);
    });

    this.musicPanel.add([
      musicBg, musicTitle,
      this.track1CardBg, pic1, name1, desc1, this.track1BtnTxt,
      this.track2CardBg, pic2, name2, desc2, this.track2BtnTxt,
      this.track3CardBg, pic3, name3, desc3, this.track3BtnTxt,
      musicBackBtn, musicBackTxt,
      musicClose
    ]);
  }

  private updateTrackSelectionUI() {
    const track = soundEngine.getSelectedTrack();
    this.track1CardBg.setStrokeStyle(3, track === 'Wiklund' ? 0x4ade80 : 0x475569);
    this.track2CardBg.setStrokeStyle(3, track === 'Neowave' ? 0x4ade80 : 0x475569);
    this.track3CardBg.setStrokeStyle(3, track === 'VoidOverlord' ? 0x4ade80 : 0x475569);

    this.track1BtnTxt.setText(track === 'Wiklund' ? '▶ ИГРАЕТ' : '[ ВЫБРАТЬ ]')
      .setColor(track === 'Wiklund' ? '#4ade80' : '#ffffff');
    this.track2BtnTxt.setText(track === 'Neowave' ? '▶ ИГРАЕТ' : '[ ВЫБРАТЬ ]')
      .setColor(track === 'Neowave' ? '#4ade80' : '#ffffff');
    this.track3BtnTxt.setText(track === 'VoidOverlord' ? '▶ ИГРАЕТ' : '[ ВЫБРАТЬ ]')
      .setColor(track === 'VoidOverlord' ? '#4ade80' : '#ffffff');
  }

  private openMusicSelectionModal() {
    this.hideSettingsElements();
    this.popupTitle.setVisible(false);
    this.popupContentText.setVisible(false);
    this.updateTrackSelectionUI();
    this.musicPanel.setVisible(true);
  }

  private buildProfilePanel() {
    this.profilePanel = this.add.container(0, 0).setVisible(false);

    let savedAvatar = localStorage.getItem('adv_avatar') || 'avatar_sq_1';
    let savedFirstName = localStorage.getItem('adv_firstname') || 'Элрик';
    let savedLastName = localStorage.getItem('adv_lastname') || 'Тенеход (Гром)';
    let savedDob = localStorage.getItem('adv_dob') || '14.05.1242 г.';
    let savedBio = localStorage.getItem('adv_bio') || 'Ветеран S-класса. Победитель 100 Боссов Подземелья.';

    this.selectedAvatarKey = savedAvatar;

    // Outer Profile Card Container
    const cardBg = this.add.rectangle(0, -10, 500, 310, 0x0f172a).setStrokeStyle(3, 0x38bdf8);

    // Title
    const title = this.add.text(0, -148, '✦ КАРТОЧКА АВАНТЮРИСТА ✦', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#facc15'
    }).setOrigin(0.5);

    // TOP: Square Avatar Frame & Picture (80x80)
    const avatarFrame = this.add.rectangle(-180, -70, 84, 84, 0x1e293b).setStrokeStyle(3, 0x4ade80);
    this.profileAvatarImage = this.add.image(-180, -70, this.selectedAvatarKey).setDisplaySize(76, 76);

    const changeAvatarBtn = this.add.text(-180, -18, '[ 📷 ИЗМЕНИТЬ ]', {
      fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff',
      backgroundColor: '#16a34a', padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Grid Popup for 7 Square Avatars Selection
    const avatarPickerGrid = this.add.container(0, -10).setVisible(false);
    const pickerBg = this.add.rectangle(0, 0, 480, 240, 0x020617, 0.95).setStrokeStyle(3, 0xfacc15).setInteractive();
    const pickerTitle = this.add.text(0, -95, '✦ ВЫБЕРИТЕ КВАДРАТНУЮ АВАТАРКУ ✦', {
      fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', color: '#facc15'
    }).setOrigin(0.5);

    const sqAvatars = [
      { key: 'avatar_sq_1', label: 'Гром' },
      { key: 'avatar_sq_2', label: 'Заза' },
      { key: 'avatar_sq_3', label: 'Бьёрн' },
      { key: 'avatar_sq_4', label: 'Рыцарь' },
      { key: 'avatar_sq_5', label: 'Маг' },
      { key: 'avatar_sq_6', label: 'Следопыт' },
      { key: 'avatar_sq_7', label: 'Проклятый' },
      { key: 'avatar_sq_8', label: 'Властелин' }
    ];

    sqAvatars.forEach((av, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const px = -150 + col * 100;
      const py = -40 + row * 80;

      const avBox = this.add.rectangle(px, py, 68, 68, 0x1e293b)
        .setStrokeStyle(2, this.selectedAvatarKey === av.key ? 0x4ade80 : 0x475569)
        .setInteractive({ useHandCursor: true });

      const avImg = this.add.image(px, py - 6, av.key).setDisplaySize(54, 54);
      const avTxt = this.add.text(px, py + 22, av.label, {
        fontSize: '9px', fontFamily: 'monospace', fontStyle: 'bold', color: '#cbd5e1'
      }).setOrigin(0.5);

      avBox.on('pointerdown', () => {
        soundEngine.playClick();
        this.selectedAvatarKey = av.key;
        localStorage.setItem('adv_avatar', av.key);
        this.profileAvatarImage.setTexture(av.key);
        avatarPickerGrid.setVisible(false);
      });

      avatarPickerGrid.add([avBox, avImg, avTxt]);
    });

    const pickerClose = this.add.text(0, 90, '[ ЗАКРЫТЬ ]', {
      fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff',
      backgroundColor: '#ef4444', padding: { x: 12, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    pickerClose.on('pointerdown', () => {
      soundEngine.playClick();
      avatarPickerGrid.setVisible(false);
    });
    avatarPickerGrid.add([pickerBg, pickerTitle, pickerClose]);

    changeAvatarBtn.on('pointerdown', () => {
      soundEngine.playClick();
      avatarPickerGrid.setVisible(true);
    });

    // EDITABLE PROFILE FIELDS (Right of avatar & below avatar)
    const firstNamesList = ['Элрик', 'Артур', 'Гарольд', 'Заза', 'Бьёрн', 'Леопард', 'Вальтер'];
    const lastNamesList = ['Тенеход (Гром)', 'Безумный Варитель', 'Сокрушитель Скал', 'Легенда Гильдии', 'Одинокий Волшебник'];
    const dobsList = ['14.05.1242 г.', '01.09.1238 г.', '28.11.1245 г.', '07.03.1240 г.', '19.08.1235 г.'];
    const biosList = [
      'Ветеран S-класса. Победитель 100 Боссов Подземелья.',
      'Мастер ядов и защитных эликсиров подземного царства.',
      'Северный берсерк с громовыми топорами и ледяным щитом.',
      'Секретный агент Гильдии Исследователей Тёмных Пещер.',
      'Великий рыцарь круглого стола Древней Крепости.'
    ];

    let fnIdx = firstNamesList.indexOf(savedFirstName); if (fnIdx < 0) fnIdx = 0;
    let lnIdx = lastNamesList.indexOf(savedLastName); if (lnIdx < 0) lnIdx = 0;
    let dobIdx = dobsList.indexOf(savedDob); if (dobIdx < 0) dobIdx = 0;
    let bioIdx = biosList.indexOf(savedBio); if (bioIdx < 0) bioIdx = 0;

    // Имя
    const firstNameText = this.add.text(-120, -100, `ИМЯ: [ ${savedFirstName} ] ✏`, {
      fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: '#4ade80',
      backgroundColor: '#1e293b', padding: { x: 8, y: 4 }
    }).setInteractive({ useHandCursor: true });

    firstNameText.on('pointerdown', () => {
      soundEngine.playClick();
      fnIdx = (fnIdx + 1) % firstNamesList.length;
      savedFirstName = firstNamesList[fnIdx];
      localStorage.setItem('adv_firstname', savedFirstName);
      firstNameText.setText(`ИМЯ: [ ${savedFirstName} ] ✏`);
    });

    // Фамилия
    const lastNameText = this.add.text(-120, -68, `ФАМИЛИЯ: [ ${savedLastName} ] ✏`, {
      fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: '#38bdf8',
      backgroundColor: '#1e293b', padding: { x: 8, y: 4 }
    }).setInteractive({ useHandCursor: true });

    lastNameText.on('pointerdown', () => {
      soundEngine.playClick();
      lnIdx = (lnIdx + 1) % lastNamesList.length;
      savedLastName = lastNamesList[lnIdx];
      localStorage.setItem('adv_lastname', savedLastName);
      lastNameText.setText(`ФАМИЛИЯ: [ ${savedLastName} ] ✏`);
    });

    // Дата рождения
    const dobText = this.add.text(-120, -36, `ДАТА РОЖДЕНИЯ: [ ${savedDob} ] ✏`, {
      fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold', color: '#fef08a',
      backgroundColor: '#1e293b', padding: { x: 8, y: 4 }
    }).setInteractive({ useHandCursor: true });

    dobText.on('pointerdown', () => {
      soundEngine.playClick();
      dobIdx = (dobIdx + 1) % dobsList.length;
      savedDob = dobsList[dobIdx];
      localStorage.setItem('adv_dob', savedDob);
      dobText.setText(`ДАТА РОЖДЕНИЯ: [ ${savedDob} ] ✏`);
    });

    // Описание
    const bioTitle = this.add.text(-220, 10, 'ОПИСАНИЕ И ЛОР ГЕРОЯ: [ КЛИКНИТЕ ДЛЯ СМЕНЫ ✏ ]', {
      fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold', color: '#cbd5e1'
    });

    const bioBox = this.add.rectangle(0, 60, 440, 75, 0x1e293b).setStrokeStyle(2, 0x475569).setInteractive({ useHandCursor: true });
    const bioText = this.add.text(-210, 32, savedBio, {
      fontSize: '11px', fontFamily: 'monospace', color: '#e2e8f0',
      wordWrap: { width: 420 }, lineSpacing: 4
    });

    const cycleBio = () => {
      soundEngine.playClick();
      bioIdx = (bioIdx + 1) % biosList.length;
      savedBio = biosList[bioIdx];
      localStorage.setItem('adv_bio', savedBio);
      bioText.setText(savedBio);
    };

    bioBox.on('pointerdown', cycleBio);

    this.profilePanel.add([
      cardBg, title,
      avatarFrame, this.profileAvatarImage, changeAvatarBtn,
      firstNameText, lastNameText, dobText,
      bioTitle, bioBox, bioText,
      avatarPickerGrid
    ]);
  }

  private showProfilePopup() {
    this.game.events.emit('open-profile-modal');
  }

  private showSettingsPopup() {
    this.musicPanel.setVisible(false);
    if (this.profilePanel) this.profilePanel.setVisible(false);
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
    const targetY = this.ruinsContainer.y + (this.caveEntrance.y + 10) * this.ruinsContainer.scaleY;

    // Cinematic zoom & pan flying straight inside the dark emerald cave
    this.cameras.main.pan(targetX, targetY, 700, 'Quad.easeInOut');
    this.cameras.main.zoomTo(3.5, 700, 'Quad.easeIn');
    this.cameras.main.fadeOut(750, 0, 0, 0);

    let started = false;
    const proceedToHub = () => {
      if (started) return;
      started = true;
      this.scene.start('HubScene');
    };

    this.cameras.main.once('camerafadeoutcomplete', proceedToHub);
    this.time.delayedCall(800, proceedToHub);
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    this.layoutElements(gameSize.width, gameSize.height);
  }
}
