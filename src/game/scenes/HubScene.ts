/**
 * Frantic Battles - HubScene (Game World, Heroes Altar, Combat & Matchmaking)
 */

import Phaser from 'phaser';
import { generateAllTextures } from '../pixelArt';
import { HEROES, HeroData } from '../players';
import { soundEngine } from '../audio';

export class HubScene extends Phaser.Scene {
  // Player
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private selectedHeroKey = 'char_zaza';
  private tempHeroKey = 'char_zaza';
  private isMonster = false;
  private monsterTimer = 0;
  private playerHp = 1000;
  private playerMaxHp = 1000;
  private playerSpeed = 290;
  private playerWeaponVisual!: Phaser.GameObjects.Image;

  // HP Bar & combat
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private nameLabel!: Phaser.GameObjects.Text;

  // Cooldowns
  private cds: Record<string, number> = { attack: 0, s1: 0, s2: 0, ult: 0 };
  private cdMax: Record<string, number> = { attack: 350, s1: 3000, s2: 4500, ult: 14000 };

  // Environment & Enemies
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private dummyGroup!: Phaser.Physics.Arcade.StaticGroup;
  private botsGroup!: Phaser.Physics.Arcade.Group;
  private interactables: Array<{ x: number; y: number; text: string; action: 'altar' | 'gate' | 'shop' }> = [];
  private currentInteractable: { x: number; y: number; text: string; action: 'altar' | 'gate' | 'shop' } | null = null;
  private interactPromptUI!: Phaser.GameObjects.Text;

  // Minimap (Radar style)
  private minimapContainer!: Phaser.GameObjects.Container;
  private minimapGfx!: Phaser.GameObjects.Graphics;
  private minimapIcons: Phaser.GameObjects.Text[] = [];

  // Mobile Controls & Red Aim Joystick
  private isPC = false;
  private joyStickBase!: Phaser.GameObjects.Arc;
  private joyStickThumb!: Phaser.GameObjects.Arc;
  private joyStickPointerId: number | null = null;
  private joyStickVector = new Phaser.Math.Vector2(0, 0);
  private joyStickOrigin = new Phaser.Math.Vector2(0, 0);

  private aimJoyBase!: Phaser.GameObjects.Arc;
  private aimJoyThumb!: Phaser.GameObjects.Arc;
  private aimJoyPointerId: number | null = null;
  private aimJoyVector = new Phaser.Math.Vector2(0, 0);
  private aimLineGfx!: Phaser.GameObjects.Graphics;

  // Combat buttons
  private combatElements: Phaser.GameObjects.GameObject[] = [];
  private btnAttack!: Phaser.GameObjects.Arc;
  private txtAttack!: Phaser.GameObjects.Text;
  private cdAttackOverlay!: Phaser.GameObjects.Arc;

  private btnS1!: Phaser.GameObjects.Arc;
  private iconS1!: Phaser.GameObjects.Image;
  private cdS1Overlay!: Phaser.GameObjects.Arc;

  private btnS2!: Phaser.GameObjects.Arc;
  private iconS2!: Phaser.GameObjects.Image;
  private cdS2Overlay!: Phaser.GameObjects.Arc;

  private btnUlt!: Phaser.GameObjects.Arc;
  private iconUlt!: Phaser.GameObjects.Image;
  private cdUltOverlay!: Phaser.GameObjects.Arc;

  // Keyboard
  private cursors!: {
    W: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    UP: Phaser.Input.Keyboard.Key;
    DOWN: Phaser.Input.Keyboard.Key;
    LEFT: Phaser.Input.Keyboard.Key;
    RIGHT: Phaser.Input.Keyboard.Key;
  };
  private keyAttack!: Phaser.Input.Keyboard.Key;
  private keyS1!: Phaser.Input.Keyboard.Key;
  private keyS2!: Phaser.Input.Keyboard.Key;
  private keyUlt!: Phaser.Input.Keyboard.Key;

  // --- HEROES ALTAR: TWO-STEP SELECTION MODAL ---
  private isHeroMenuOpen = false;
  private heroOverlay!: Phaser.GameObjects.Rectangle;
  private altarBg!: Phaser.GameObjects.Rectangle;

  // View 1 (Roster Previews)
  private rosterGroup: Phaser.GameObjects.GameObject[] = [];
  private rosterCards: Array<{
    bg: Phaser.GameObjects.Rectangle;
    banner: Phaser.GameObjects.Rectangle;
    portrait: Phaser.GameObjects.Image;
    nameText: Phaser.GameObjects.Text;
    rarityText: Phaser.GameObjects.Text;
    statsText: Phaser.GameObjects.Text;
    statusText: Phaser.GameObjects.Text;
    key: string;
  }> = [];

  // View 2 (Detail View)
  private detailGroup: Phaser.GameObjects.GameObject[] = [];
  private detailPedestalOuter!: Phaser.GameObjects.Ellipse;
  private detailPedestal!: Phaser.GameObjects.Ellipse;
  private detailHeroSprite!: Phaser.GameObjects.Image;
  private detailHeroName!: Phaser.GameObjects.Text;
  private detailHeroRarityBadgeBg!: Phaser.GameObjects.Rectangle;
  private detailHeroRarity!: Phaser.GameObjects.Text;
  private detailHeroTitleBoxBg!: Phaser.GameObjects.Rectangle;
  private detailHeroTitle!: Phaser.GameObjects.Text;
  private detailHeroAttackBoxBg!: Phaser.GameObjects.Rectangle;
  private detailHeroAttackDesc!: Phaser.GameObjects.Text;
  private detailHeroStatsBoxBg!: Phaser.GameObjects.Rectangle;
  private detailHeroStats!: Phaser.GameObjects.Text;
  private detailSkillSquareButtons: Array<{
    bg: Phaser.GameObjects.Rectangle;
    icon: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
  }> = [];
  private detailSkillNameBoxBg!: Phaser.GameObjects.Rectangle;
  private detailSkillTitle!: Phaser.GameObjects.Text;
  private detailSkillCdBoxBg!: Phaser.GameObjects.Rectangle;
  private detailSkillMeta!: Phaser.GameObjects.Text;
  private detailSkillDescBox!: Phaser.GameObjects.Rectangle;
  private detailSkillDesc!: Phaser.GameObjects.Text;
  private detailSelectBtn!: Phaser.GameObjects.Rectangle;
  private detailSelectText!: Phaser.GameObjects.Text;
  private currentDetailSkillIndex: number = 0;

  // --- MATCHMAKING & LOBBY MODAL (Flat Scene GameObjects for 100% reliable clicks) ---
  private isLobbyOpen = false;
  private lobbyOverlay!: Phaser.GameObjects.Rectangle;
  private lobbyBg!: Phaser.GameObjects.Rectangle;
  private lobbyTitle!: Phaser.GameObjects.Text;
  private lobbyBackBtn!: Phaser.GameObjects.Text;
  private lobbyCloseBtn!: Phaser.GameObjects.Text;
  private lobbyBaseGroup: Phaser.GameObjects.GameObject[] = [];

  // Portal View Hierarchies
  private lobbyView: 'portal_root' | 'pvp_modes' | 'casual' | 'ranked' | 'dungeon_modes' | 'dungeon_online_choice' | 'dungeon_create' | 'dungeon_servers' = 'portal_root';
  private portalRootGroup: Phaser.GameObjects.GameObject[] = [];
  private pvpModesGroup: Phaser.GameObjects.GameObject[] = [];
  private rankedGroup: Phaser.GameObjects.GameObject[] = [];
  private casualGroup: Phaser.GameObjects.GameObject[] = [];
  private searchGroup: Phaser.GameObjects.GameObject[] = [];
  private dungeonModesGroup: Phaser.GameObjects.GameObject[] = [];
  private dungeonOnlineChoiceGroup: Phaser.GameObjects.GameObject[] = [];
  private dungeonCreateGroup: Phaser.GameObjects.GameObject[] = [];
  private dungeonServersGroup: Phaser.GameObjects.GameObject[] = [];

  private currentPersonalCode: string = 'DG-7429';
  private currentRoomName: string = 'Подземелье Зазы';
  private isPrivateRoom: boolean = false;
  private personalCodeDisplay!: Phaser.GameObjects.Text;
  private roomNameDisplay!: Phaser.GameObjects.Text;
  private roomPassDisplay!: Phaser.GameObjects.Text;
  private dungeonServerRows: Array<{ label: Phaser.GameObjects.Text; btn: Phaser.GameObjects.Text; bg: Phaser.GameObjects.Rectangle; code: string }> = [];

  private serverLabels: Phaser.GameObjects.Text[] = [];
  private matchmakingSearchText!: Phaser.GameObjects.Text;
  private matchmakingTimer: Phaser.Time.TimerEvent | null = null;
  private matchLobbies: Array<{ name: string; players: string; map: string }> = [
    { name: 'Арена Магов', players: '4/8', map: 'АРЕНА' },
    { name: 'Лесная Засада', players: '7/8', map: 'ЛЕС' },
    { name: 'Древний Мост', players: '2/8', map: 'МОСТ' },
    { name: 'Токсичный Завод', players: '5/8', map: 'ЗАВОД' },
  ];
  private lobbyScroll = 0;

  // Active attacks
  private activeClub: Phaser.GameObjects.Rectangle | null = null;
  private activeAxe: Phaser.GameObjects.Rectangle | null = null;

  constructor() {
    super({ key: 'HubScene' });
  }

  preload() {
    generateAllTextures(this);
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Reset camera & state cleanly
    this.cameras.main.setZoom(0.95);
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(400, 0, 0, 0);

    const mapW = 1600;
    const mapH = 1600;
    this.physics.world.setBounds(0, 0, mapW, mapH);

    // 1. World Tiles
    this.add.tileSprite(mapW / 2, mapH / 2, mapW, mapH, 'tile_floor');
    // Stone pathways
    this.add.tileSprite(mapW / 2, mapH / 2, 140, 1400, 'path_tile').setDepth(1);
    this.add.tileSprite(mapW / 2 + 250, mapH - 250, 600, 140, 'path_tile').setDepth(1);

    // 2. Fortress Stone Perimeter Walls
    this.walls = this.physics.add.staticGroup();
    for (let i = 0; i < mapW; i += 64) {
      this.walls.create(i + 32, 32, 'wall');
      this.walls.create(i + 32, mapH - 32, 'wall');
      this.walls.create(32, i + 32, 'wall');
      this.walls.create(mapW - 32, i + 32, 'wall');
    }

    // 3. World Buildings & Landmarks
    // Top: Matchmaking Gate / Dungeon Portal (Elevated to keep hero clearly visible)
    this.add.image(mapW / 2, 95, 'build_gate').setDepth(2);
    this.add.text(mapW / 2, 160, '⚔ ПОРТАЛ: ПОДЗЕМЕЛЬЕ И ПВП ⚔', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#f87171',
      backgroundColor: '#1c1917',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(3);

    // Center: Altar of Heroes
    this.add.image(mapW / 2, mapH / 2, 'build_altar').setDepth(2);
    this.add.text(mapW / 2, mapH / 2 + 95, '✦ АЛТАРЬ ГЕРОЕВ ✦', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#38bdf8',
      backgroundColor: '#0f172a',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(3);

    // Right: Merchant Shop
    this.add.image(mapW - 250, mapH - 250, 'build_shop').setDepth(2);
    this.add.text(mapW - 250, mapH - 140, '⚗ ТОРГОВЕЦ АРТЕФАКТАМИ', {
      fontSize: '16px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#fbbf24',
      backgroundColor: '#291805',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(3);

    // Interactive Trigger zones
    this.interactables = [
      { x: mapW / 2, y: mapH / 2 + 55, text: '[ АЛТАРЬ: ВЫБРАТЬ ГЕРОЯ ]', action: 'altar' },
      { x: mapW / 2, y: 135, text: '[ ПОРТАЛ: ПОДЗЕМЕЛЬЕ / ПВП ]', action: 'gate' },
      { x: mapW - 250, y: mapH - 180, text: '[ ТОРГОВЕЦ: КУПИТЬ ПРЕДМЕТЫ ]', action: 'shop' }
    ];

    // 4. Practice Training Dummies & Bots Group in the courtyard
    this.dummyGroup = this.physics.add.staticGroup();
    this.botsGroup = this.physics.add.group();
    this.physics.add.collider(this.botsGroup, this.walls);

    const dummy1 = this.dummyGroup.create(mapW / 2 - 200, mapH / 2 - 120, 'target_dummy');
    dummy1.hp = 1500;
    const dummy2 = this.dummyGroup.create(mapW / 2 + 200, mapH / 2 - 120, 'target_dummy');
    dummy2.hp = 1500;

    this.add.text(mapW / 2 - 200, mapH / 2 - 165, 'ТРЕНИРОВОЧНЫЙ МАСТЕРА', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#facc15'
    }).setOrigin(0.5).setDepth(2);
    this.add.text(mapW / 2 + 200, mapH / 2 - 165, 'ТРЕНИРОВОЧНЫЙ МАСТЕРА', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#facc15'
    }).setOrigin(0.5).setDepth(2);

    // 5. Spawn Player Character
    const savedHero = localStorage.getItem('fb_current_hero') || 'char_zaza';
    this.selectedHeroKey = savedHero;
    this.tempHeroKey = savedHero;
    const heroConfig = HEROES[this.selectedHeroKey];
    this.playerHp = heroConfig.hp;
    this.playerMaxHp = heroConfig.hp;
    this.playerSpeed = heroConfig.speed;

    this.player = this.physics.add.sprite(mapW / 2, mapH - 280, heroConfig.texture).setDepth(50);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.walls);

    let initWeaponTex = 'weapon_stick';
    if (this.selectedHeroKey === 'char_grim') initWeaponTex = 'weapon_flask_launcher';
    else if (this.selectedHeroKey === 'char_bjorn') initWeaponTex = 'weapon_battleaxe';
    this.playerWeaponVisual = this.add.image(this.player.x, this.player.y, initWeaponTex).setDepth(51);

    // Overhead HP Bar
    this.hpBarBg = this.add.rectangle(0, 0, 48, 7, 0x000000).setDepth(150);
    this.hpBarFill = this.add.rectangle(0, 0, 46, 5, 0x22c55e).setOrigin(0, 0.5).setDepth(150);
    this.nameLabel = this.add.text(0, 0, heroConfig.name, {
      fontSize: '11px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: heroConfig.colorHex
    }).setOrigin(0.5).setDepth(150);

    // Camera follow player
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // 6. UI: Top Navigation (Clean, with fullscreen toggle)
    const exitBtn = this.add.text(24, 24, '< В МЕНЮ', {
      fontSize: '14px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#991b1b',
      padding: { x: 12, y: 8 }
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(300).setInteractive({ useHandCursor: true });

    exitBtn.on('pointerdown', () => {
      soundEngine.playClick();
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(450, () => {
        this.scene.start('MainMenu');
      });
    });

    const fsBtn = this.add.text(125, 24, '⛶ ЭКРАН', {
      fontSize: '14px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#0284c7',
      padding: { x: 10, y: 8 }
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(300).setInteractive({ useHandCursor: true });

    fsBtn.on('pointerdown', () => {
      soundEngine.playClick();
      if (!this.scale.isFullscreen) {
        this.scale.startFullscreen();
      } else {
        this.scale.stopFullscreen();
      }
    });

    // Interaction Prompt at bottom center
    this.interactPromptUI = this.add.text(width / 2, height - 35, '', {
      fontSize: '15px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#0f172a',
      padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setInteractive({ useHandCursor: true });

    this.interactPromptUI.on('pointerdown', () => {
      this.handleCurrentInteraction();
    });

    // 7. Circular Minimap
    this.createMinimap(width);

    // 8. Virtual Joystick & Touch Controls
    this.isPC = this.registry.get('isPC') || false;
    this.setupControls(width, height);

    // 9. Combat Buttons (Attack, Skill 1, Skill 2, Ult)
    this.setupCombatUI(width, height);

    // 10. Modals: Heroes Altar & Matchmaking Gates
    this.buildHeroAltarModal(width, height);
    this.buildLobbyGateModal(width, height);

    // Post-update: keep overhead health bars & active attack weapons synced
    this.events.on('postupdate', () => {
      this.hpBarBg.setPosition(this.player.x, this.player.y - 42);
      this.hpBarFill.setPosition(this.player.x - 23, this.player.y - 42);
      this.nameLabel.setPosition(this.player.x, this.player.y - 54);

      if (this.activeClub && this.activeClub.active) {
        this.activeClub.setPosition(this.player.x, this.player.y);
      }
      if (this.activeAxe && this.activeAxe.active) {
        this.activeAxe.setPosition(this.player.x, this.player.y);
        this.player.angle = this.activeAxe.angle;
      }
    });
  }

  // --- MINIMAP (SQUARE RADAR HUD) ---
  private createMinimap(width: number) {
    const size = 110;
    const miniX = width - size / 2 - 20;
    const miniY = size / 2 + 20;

    this.minimapContainer = this.add.container(miniX, miniY).setScrollFactor(0).setDepth(290);
    const bgOuter = this.add.rectangle(0, 0, size + 6, size + 6, 0x0f172a, 0.95).setStrokeStyle(3, 0x38bdf8);
    const bgInner = this.add.rectangle(0, 0, size, size, 0x050a0e, 0.95);
    this.minimapGfx = this.add.graphics();

    this.minimapContainer.add([bgOuter, bgInner, this.minimapGfx]);
    this.updateMinimapRadar();
  }

  private updateMinimapRadar() {
    if (!this.minimapGfx || !this.player) return;
    this.minimapGfx.clear();

    // Radar grid lines
    this.minimapGfx.lineStyle(1, 0x1e293b, 0.6);
    this.minimapGfx.lineBetween(-50, 0, 50, 0);
    this.minimapGfx.lineBetween(0, -50, 0, 50);

    const mapW = 2000;
    const mapH = 2000;
    const miniRadius = 52;
    const scale = 0.055;

    // POIs: Altar, Gate, Shop, Dummies
    const pois = [
      { x: mapW / 2, y: mapH / 2, color: 0xfacc15 },
      { x: mapW / 2, y: 280, color: 0xef4444 },
      { x: mapW / 2 + 500, y: mapH / 2, color: 0x38bdf8 },
      { x: mapW / 2 - 450, y: mapH / 2, color: 0xa855f7 },
    ];

    pois.forEach(p => {
      const dx = (p.x - this.player.x) * scale;
      const dy = (p.y - this.player.y) * scale;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= miniRadius - 6) {
        this.minimapGfx.fillStyle(p.color, 0.95);
        this.minimapGfx.fillCircle(dx, dy, 4);
      }
    });

    // Player indicator in center (Emerald)
    this.minimapGfx.fillStyle(0x22c55e, 1.0);
    this.minimapGfx.fillCircle(0, 0, 5);
    this.minimapGfx.lineStyle(2, 0x86efac, 1.0);
    this.minimapGfx.strokeCircle(0, 0, 5);
  }

  // --- CONTROLS SETUP ---
  private setupControls(width: number, height: number) {
    // Keyboard inputs
    this.cursors = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      UP: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      DOWN: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      LEFT: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      RIGHT: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
    };

    this.keyAttack = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyS1 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.keyS2 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.keyUlt = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.L);

    // Native Virtual Joystick (Zero CDN dependency, completely stable)
    const jX = 90;
    const jY = height - 90;
    this.joyStickOrigin.set(jX, jY);

    this.joyStickBase = this.add.circle(jX, jY, 52, 0x334155, 0.5)
      .setScrollFactor(0).setDepth(300).setStrokeStyle(3, 0x94a3b8);
    this.joyStickThumb = this.add.circle(jX, jY, 24, 0x4ade80, 0.85)
      .setScrollFactor(0).setDepth(301);

    this.joyStickBase.setVisible(!this.isPC);
    this.joyStickThumb.setVisible(!this.isPC);

    // Multi-touch tracking for joystick on left side and aim joystick on right side of screen
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isHeroMenuOpen || this.isLobbyOpen) return;
      if (pointer.x < width * 0.42 && pointer.y > height * 0.4) {
        this.joyStickPointerId = pointer.id;
        this.updateJoystick(pointer);
      } else if (pointer.x > width * 0.52 && pointer.y > height * 0.35) {
        this.aimJoyPointerId = pointer.id;
        this.updateAimJoystick(pointer.x, pointer.y);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.joyStickPointerId) {
        this.updateJoystick(pointer);
      }
      if (pointer.id === this.aimJoyPointerId) {
        this.updateAimJoystick(pointer.x, pointer.y);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.joyStickPointerId) {
        this.joyStickPointerId = null;
        this.joyStickVector.set(0, 0);
        this.joyStickThumb.setPosition(this.joyStickOrigin.x, this.joyStickOrigin.y);
      }
      if (pointer.id === this.aimJoyPointerId) {
        this.aimJoyPointerId = null;
        if (this.aimJoyBase) this.aimJoyThumb.setPosition(this.aimJoyBase.x, this.aimJoyBase.y);
        this.aimJoyVector.set(0, 0);
        if (this.aimLineGfx) this.aimLineGfx.clear();
        this.executeSkill('attack');
      }
    });
  }

  private updateJoystick(pointer: Phaser.Input.Pointer) {
    const dist = Phaser.Math.Distance.Between(this.joyStickOrigin.x, this.joyStickOrigin.y, pointer.x, pointer.y);
    const maxRadius = 45;
    const angle = Phaser.Math.Angle.Between(this.joyStickOrigin.x, this.joyStickOrigin.y, pointer.x, pointer.y);

    if (dist > maxRadius) {
      this.joyStickThumb.setPosition(
        this.joyStickOrigin.x + Math.cos(angle) * maxRadius,
        this.joyStickOrigin.y + Math.sin(angle) * maxRadius
      );
    } else {
      this.joyStickThumb.setPosition(pointer.x, pointer.y);
    }

    if (dist > 8) {
      this.joyStickVector.set(Math.cos(angle), Math.sin(angle));
    } else {
      this.joyStickVector.set(0, 0);
    }
  }

  private updateAimJoystick(px: number, py: number) {
    if (!this.aimJoyBase) return;
    const baseX = this.aimJoyBase.x;
    const baseY = this.aimJoyBase.y;

    const dx = px - baseX;
    const dy = py - baseY;
    const angle = Math.atan2(dy, dx);
    const dist = Math.min(45, Math.sqrt(dx * dx + dy * dy));

    this.aimJoyThumb.setPosition(baseX + Math.cos(angle) * dist, baseY + Math.sin(angle) * dist);
    this.aimJoyVector.set(Math.cos(angle), Math.sin(angle));

    if (Math.cos(angle) !== 0) {
      this.player.setFlipX(Math.cos(angle) < 0);
    }
  }

  // --- COMBAT UI ---
  private setupCombatUI(width: number, height: number) {
    // Attack Button & Red Aim Joystick (Large, prominent)
    this.btnAttack = this.add.circle(0, 0, 56, 0xdc2626, 0.9)
      .setScrollFactor(0).setDepth(300).setStrokeStyle(3, 0xfca5a5).setInteractive();
    this.txtAttack = this.add.text(0, 0, 'ПРИЦЕЛ/АТАКА\n[SPACE]', {
      fontSize: '10px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    this.cdAttackOverlay = this.add.circle(0, 0, 56, 0x000000, 0.65)
      .setScrollFactor(0).setDepth(302).setVisible(false);

    this.aimJoyBase = this.add.circle(0, 0, 52, 0xdc2626, 0.35)
      .setScrollFactor(0).setDepth(299).setStrokeStyle(3, 0xef4444);
    this.aimJoyThumb = this.add.circle(0, 0, 26, 0xef4444, 0.9)
      .setScrollFactor(0).setDepth(300);
    this.aimLineGfx = this.add.graphics().setDepth(298);

    this.btnAttack.on('pointerdown', (_p: unknown, _lx: unknown, _ly: unknown, event: { stopPropagation: () => void }) => {
      event.stopPropagation();
      this.executeSkill('attack');
    });

    // Skill 1 Button (Green, enlarged)
    this.btnS1 = this.add.circle(0, 0, 40, 0x15803d, 0.9)
      .setScrollFactor(0).setDepth(300).setStrokeStyle(2, 0x86efac).setInteractive();
    this.iconS1 = this.add.image(0, 0, 'skill_zaza_1').setScale(1.25).setScrollFactor(0).setDepth(301);
    this.cdS1Overlay = this.add.circle(0, 0, 40, 0x000000, 0.65)
      .setScrollFactor(0).setDepth(302).setVisible(false);

    this.btnS1.on('pointerdown', (_p: unknown, _lx: unknown, _ly: unknown, event: { stopPropagation: () => void }) => {
      event.stopPropagation();
      this.executeSkill('s1');
    });

    // Skill 2 Button (Blue, enlarged)
    this.btnS2 = this.add.circle(0, 0, 40, 0x1d4ed8, 0.9)
      .setScrollFactor(0).setDepth(300).setStrokeStyle(2, 0x93c5fd).setInteractive();
    this.iconS2 = this.add.image(0, 0, 'skill_zaza_2').setScale(1.25).setScrollFactor(0).setDepth(301);
    this.cdS2Overlay = this.add.circle(0, 0, 40, 0x000000, 0.65)
      .setScrollFactor(0).setDepth(302).setVisible(false);

    this.btnS2.on('pointerdown', (_p: unknown, _lx: unknown, _ly: unknown, event: { stopPropagation: () => void }) => {
      event.stopPropagation();
      this.executeSkill('s2');
    });

    // Ultimate Button (Purple, enlarged)
    this.btnUlt = this.add.circle(0, 0, 46, 0x7e22ce, 0.9)
      .setScrollFactor(0).setDepth(300).setStrokeStyle(3, 0xd8b4fe).setInteractive();
    this.iconUlt = this.add.image(0, 0, 'skill_zaza_3').setScale(1.35).setScrollFactor(0).setDepth(301);
    this.cdUltOverlay = this.add.circle(0, 0, 46, 0x000000, 0.65)
      .setScrollFactor(0).setDepth(302).setVisible(false);

    this.btnUlt.on('pointerdown', (_p: unknown, _lx: unknown, _ly: unknown, event: { stopPropagation: () => void }) => {
      event.stopPropagation();
      this.executeSkill('ult');
    });

    this.combatElements = [
      this.btnAttack, this.txtAttack, this.cdAttackOverlay,
      this.btnS1, this.iconS1, this.cdS1Overlay,
      this.btnS2, this.iconS2, this.cdS2Overlay,
      this.btnUlt, this.iconUlt, this.cdUltOverlay
    ];

    this.positionCombatUI(width, height);
    this.updateCombatIcons();
  }

  private positionCombatUI(width: number, height: number) {
    // Dynamic scale for touch buttons optimized for landscape
    const btnScale = Math.min(1.25, Math.max(0.78, Math.min(width, height) / 480));
    const padRight = Math.max(22, 28 * btnScale);
    const padBottom = Math.max(22, 28 * btnScale);

    const cx = width - (58 * btnScale + padRight);
    const cy = height - (58 * btnScale + padBottom);

    const s1X = cx - (112 * btnScale);
    const s1Y = cy + (12 * btnScale);

    const s2X = cx - (92 * btnScale);
    const s2Y = cy - (92 * btnScale);

    const ultX = cx + (8 * btnScale);
    const ultY = cy - (116 * btnScale);

    if (this.btnAttack) {
      this.btnAttack.setPosition(cx, cy).setScale(btnScale);
      this.txtAttack.setPosition(cx, cy).setScale(btnScale);
      this.cdAttackOverlay.setPosition(cx, cy).setScale(btnScale);

      if (this.aimJoyBase) this.aimJoyBase.setPosition(cx, cy).setScale(btnScale);
      if (this.aimJoyThumb && this.aimJoyPointerId === null) this.aimJoyThumb.setPosition(cx, cy).setScale(btnScale);

      this.btnS1.setPosition(s1X, s1Y).setScale(btnScale);
      this.iconS1.setPosition(s1X, s1Y).setScale(btnScale);
      this.cdS1Overlay.setPosition(s1X, s1Y).setScale(btnScale);

      this.btnS2.setPosition(s2X, s2Y).setScale(btnScale);
      this.iconS2.setPosition(s2X, s2Y).setScale(btnScale);
      this.cdS2Overlay.setPosition(s2X, s2Y).setScale(btnScale);

      this.btnUlt.setPosition(ultX, ultY).setScale(btnScale);
      this.iconUlt.setPosition(ultX, ultY).setScale(btnScale);
      this.cdUltOverlay.setPosition(ultX, ultY).setScale(btnScale);
    }

    // Joystick placement and scale
    const jScale = Math.min(1.25, Math.max(0.8, Math.min(width, height) / 480));
    const jX = 64 * jScale + 22;
    const jY = height - (64 * jScale + 22);
    this.joyStickOrigin.set(jX, jY);

    if (this.joyStickBase) {
      this.joyStickBase.setPosition(jX, jY).setScale(jScale);
    }
    if (this.joyStickThumb && this.joyStickPointerId === null) {
      this.joyStickThumb.setPosition(jX, jY).setScale(jScale);
    }
  }

  // --- HEROES ALTAR: TWO-STEP SELECTION MODAL ---
  private buildHeroAltarModal(width: number, height: number) {
    const cx = width / 2;
    const cy = height / 2;

    // 0. Dim Backdrop (prevents clicks to scene behind)
    this.heroOverlay = this.add.rectangle(cx, cy, width * 2, height * 2, 0x000000, 0.85)
      .setScrollFactor(0).setDepth(500).setVisible(false).setInteractive();

    this.heroOverlay.on('pointerdown', (_p: unknown, _lx: unknown, _ly: unknown, event: { stopPropagation: () => void }) => {
      event.stopPropagation();
    });

    // Main Modal Frame (670 x 430 with luxury warm amber/gold border & obsidian background)
    this.altarBg = this.add.rectangle(cx, cy, 670, 430, 0x0f1422)
      .setStrokeStyle(3, 0xf59e0b)
      .setScrollFactor(0).setDepth(501).setVisible(false);

    // ==========================================
    // 1. ROSTER VIEW (COMPACT PIXEL CARDS)
    // ==========================================
    const rosterTitle = this.add.text(cx, cy - 180, '✦ ВЫБОР ГЕРОЯ ✦', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#facc15'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(502).setVisible(false);

    const rosterCloseBtn = this.add.text(cx + 305, cy - 180, '[X]', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ef4444'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    rosterCloseBtn.on('pointerdown', () => {
      soundEngine.playClick();
      this.closeHeroMenu();
    });

    this.rosterGroup = [rosterTitle, rosterCloseBtn];
    this.rosterCards = [];

    const heroKeys = ['char_zaza', 'char_grim', 'char_bjorn'];
    const cardOffsets = [-195, 0, 195];

    heroKeys.forEach((key, idx) => {
      const hero = HEROES[key];
      const cardX = cx + cardOffsets[idx];
      const cardY = cy + 18;

      // Card Background
      const cardBg = this.add.rectangle(cardX, cardY, 170, 245, 0x181c2b)
        .setStrokeStyle(2, hero.color)
        .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

      // Top Rarity Banner
      const cardBanner = this.add.rectangle(cardX, cardY - 102, 168, 24, 0x0b0f19)
        .setStrokeStyle(1, hero.color)
        .setScrollFactor(0).setDepth(503).setVisible(false);

      const rarityText = this.add.text(cardX, cardY - 102, `[ ${hero.rarity} ]`, {
        fontSize: '10px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: hero.colorHex
      }).setOrigin(0.5).setScrollFactor(0).setDepth(504).setVisible(false);

      // Double Concentric Stand Pedestals under character's feet
      const charPedestalOuter = this.add.ellipse(cardX, cardY - 12, 76, 22, 0x090d16)
        .setStrokeStyle(2, hero.color)
        .setScrollFactor(0).setDepth(503).setVisible(false);

      const charPedestalInner = this.add.ellipse(cardX, cardY - 12, 56, 14, 0x1e293b)
        .setStrokeStyle(1, 0x38bdf8)
        .setScrollFactor(0).setDepth(503).setVisible(false);

      // Pixel Sprite (Reduced size to 1.8, perfectly stationary, NO MOVING / TWEENS)
      const charSprite = this.add.image(cardX, cardY - 42, hero.texture)
        .setScale(1.8).setScrollFactor(0).setDepth(504).setInteractive({ useHandCursor: true }).setVisible(false);

      // Name & Clean Subtitle
      const displayName = key === 'char_zaza' ? 'ZAZA' : (key === 'char_grim' ? 'ГРИМ' : 'БЬОРН');
      const nameText = this.add.text(cardX, cardY + 28, displayName, {
        fontSize: '16px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(504).setInteractive({ useHandCursor: true }).setVisible(false);

      const statsText = this.add.text(cardX, cardY + 50, `HP ${hero.hp} • СПД ${hero.speed}`, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#94a3b8'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(504).setVisible(false);

      // Status indicator on card (Only shows equipped badge, NO "ВЫБРАТЬ" text)
      const isEquipped = key === this.selectedHeroKey;
      const statusText = this.add.text(cardX, cardY + 84, isEquipped ? '[ ТЕКУЩИЙ ✓ ]' : '', {
        fontSize: '11px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: '#4ade80',
        backgroundColor: '#064e3b',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(504).setVisible(false);

      const onCardClick = () => {
        soundEngine.playClick();
        this.openHeroDetailView(key);
      };

      cardBg.on('pointerdown', onCardClick);
      charSprite.on('pointerdown', onCardClick);
      nameText.on('pointerdown', onCardClick);

      cardBg.on('pointerover', () => cardBg.setStrokeStyle(2, 0xfacc15));
      cardBg.on('pointerout', () => cardBg.setStrokeStyle(2, hero.color));

      this.rosterCards.push({ bg: cardBg, banner: cardBanner, portrait: charSprite, nameText, rarityText, statsText, statusText, key });
      this.rosterGroup.push(cardBg, cardBanner, rarityText, charPedestalOuter, charPedestalInner, charSprite, nameText, statsText, statusText);
    });

    // =========================================================================
    // 2. DETAIL VIEW:
    //    TOP-LEFT: Hero Name & Subtitle & Attack & Stats Boxes
    //    CENTER: Hero Sprite on Pedestal (STATIONARY, NO MOVING)
    //    TOP-RIGHT: 3 SEPARATE BOXES (Skill Name Box, CD Box, Skill Desc Box)
    //    RIGHT COLUMN: 3 Skill Buttons
    //    BOTTOM-RIGHT: [ ВЫБРАТЬ ЭТОГО БОЙЦА ] Button
    // =========================================================================
    const detailBackBtn = this.add.text(cx - 290, cy - 180, '< НАЗАД', {
      fontSize: '12px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#facc15',
      backgroundColor: '#1e2230',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    detailBackBtn.on('pointerdown', () => {
      soundEngine.playClick();
      this.showRosterView();
    });

    const detailCloseBtn = this.add.text(cx + 305, cy - 180, '[X]', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ef4444'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    detailCloseBtn.on('pointerdown', () => {
      soundEngine.playClick();
      this.closeHeroMenu();
    });

    // 1. LEFT COLUMN: Name, Rarity Badge, Title, Attack & Stats
    const leftX = cx - 215;
    this.detailHeroName = this.add.text(leftX, cy - 135, 'ZAZA', {
      fontSize: '22px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setVisible(false);

    this.detailHeroRarityBadgeBg = this.add.rectangle(leftX, cy - 106, 130, 22, 0x2e1065)
      .setStrokeStyle(1, 0xa855f7)
      .setScrollFactor(0).setDepth(503).setVisible(false);

    this.detailHeroRarity = this.add.text(leftX, cy - 106, '[ ЭПИЧЕСКИЙ ]', {
      fontSize: '10px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#c084fc'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(504).setVisible(false);

    this.detailHeroTitleBoxBg = this.add.rectangle(leftX, cy - 76, 165, 24, 0x181c2b)
      .setStrokeStyle(1, 0x3f3f46)
      .setScrollFactor(0).setDepth(502).setVisible(false);

    this.detailHeroTitle = this.add.text(leftX, cy - 76, 'Токсичный Мутант', {
      fontSize: '11px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#e2e8f0'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setVisible(false);

    this.detailHeroAttackBoxBg = this.add.rectangle(leftX, cy - 30, 165, 44, 0x181c2b)
      .setStrokeStyle(1, 0x3f3f46)
      .setScrollFactor(0).setDepth(502).setVisible(false);

    this.detailHeroAttackDesc = this.add.text(leftX - 74, cy - 44, '⚔ Атака: Удар в ближнем бою.', {
      fontSize: '9px',
      fontFamily: 'monospace',
      color: '#94a3b8',
      wordWrap: { width: 150 },
      lineSpacing: 2
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(503).setVisible(false);

    this.detailHeroStatsBoxBg = this.add.rectangle(leftX, cy + 22, 165, 34, 0x090d16)
      .setStrokeStyle(1, 0x22c55e)
      .setScrollFactor(0).setDepth(502).setVisible(false);

    this.detailHeroStats = this.add.text(leftX, cy + 22, '❤ HP: 1000   ⚡ СПД: 290', {
      fontSize: '10px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#4ade80'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setVisible(false);

    // 2. CENTER: Glowing Circular Pedestal + Stationary Hero (NO MOVING BACK AND FORTH)
    const heroCenterX = cx - 10;
    this.detailPedestalOuter = this.add.ellipse(heroCenterX, cy + 62, 145, 42, 0x0f172a)
      .setStrokeStyle(3, 0xf59e0b)
      .setScrollFactor(0).setDepth(502).setVisible(false);

    this.detailPedestal = this.add.ellipse(heroCenterX, cy + 62, 125, 32, 0x181a26)
      .setStrokeStyle(2, 0x38bdf8)
      .setScrollFactor(0).setDepth(502).setVisible(false);

    this.detailHeroSprite = this.add.image(heroCenterX, cy - 12, 'char_zaza')
      .setScale(3.0).setScrollFactor(0).setDepth(503).setVisible(false);

    // 3. TOP-RIGHT: 3 DISTINCT SEPARATE BOXES (Skill Name, CD, Description)
    const rightColX = cx + 205;

    // Separate Box 1: Skill Name Box
    this.detailSkillNameBoxBg = this.add.rectangle(rightColX - 32, cy - 134, 140, 28, 0x181c2b)
      .setStrokeStyle(2, 0xfacc15)
      .setScrollFactor(0).setDepth(502).setVisible(false);

    this.detailSkillTitle = this.add.text(rightColX - 32, cy - 134, '1. ПЛЕВОК ЯДОМ', {
      fontSize: '10px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#facc15'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setVisible(false);

    // Separate Box 2: Skill Cooldown (CD) Badge Box
    this.detailSkillCdBoxBg = this.add.rectangle(rightColX + 70, cy - 134, 52, 28, 0x064e3b)
      .setStrokeStyle(2, 0x22c55e)
      .setScrollFactor(0).setDepth(502).setVisible(false);

    this.detailSkillMeta = this.add.text(rightColX + 70, cy - 134, '⏱ 3.0с', {
      fontSize: '10px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#86efac'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setVisible(false);

    // Separate Box 3: Skill Description Box
    this.detailSkillDescBox = this.add.rectangle(rightColX + 5, cy - 78, 205, 68, 0x111827)
      .setStrokeStyle(2, 0x475569)
      .setScrollFactor(0).setDepth(502).setVisible(false);

    this.detailSkillDesc = this.add.text(rightColX - 92, cy - 104, 'Описание способности...', {
      fontSize: '9.5px',
      fontFamily: 'monospace',
      color: '#e2e8f0',
      lineSpacing: 2,
      wordWrap: { width: 190 }
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(503).setVisible(false);

    // 4. RIGHT COLUMN: 3 Square Skill Buttons Stacked Vertically
    this.detailSkillSquareButtons = [];
    const skillLabels = ['1', '2', '★'];
    const sqYOffsets = [-16, 32, 80];

    for (let i = 0; i < 3; i++) {
      const sqY = cy + sqYOffsets[i];

      const sqBg = this.add.rectangle(rightColX + 5, sqY, 205, 38, 0x181c2b)
        .setStrokeStyle(2, i === 0 ? 0x4ade80 : 0x3f3f46)
        .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

      const sqIcon = this.add.image(rightColX - 75, sqY, 'skill_zaza_1')
        .setScale(1.0).setScrollFactor(0).setDepth(503).setVisible(false);

      const sqLabel = this.add.text(rightColX - 48, sqY, '', {
        fontSize: '10px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: i === 0 ? '#4ade80' : '#ffffff'
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(503).setVisible(false);

      const onSquareClick = () => {
        soundEngine.playClick();
        this.selectDetailSkill(i);
      };
      sqBg.on('pointerdown', onSquareClick);
      sqIcon.on('pointerdown', onSquareClick);
      sqLabel.on('pointerdown', onSquareClick);

      this.detailSkillSquareButtons.push({ bg: sqBg, icon: sqIcon, label: sqLabel });
      this.detailGroup.push(sqBg, sqIcon, sqLabel);
    }

    // 5. BOTTOM-RIGHT: Select Button
    this.detailSelectBtn = this.add.rectangle(rightColX + 5, cy + 140, 205, 40, 0x16a34a)
      .setStrokeStyle(2, 0x86efac)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    this.detailSelectText = this.add.text(rightColX + 5, cy + 140, '[ ВЫБРАТЬ БОЙЦА ]', {
      fontSize: '12px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const onSelectClick = () => {
      this.applySelectedHero();
    };
    this.detailSelectBtn.on('pointerdown', onSelectClick);
    this.detailSelectText.on('pointerdown', onSelectClick);

    this.detailGroup.push(
      detailBackBtn,
      detailCloseBtn,
      this.detailHeroName,
      this.detailHeroRarityBadgeBg,
      this.detailHeroRarity,
      this.detailHeroTitleBoxBg,
      this.detailHeroTitle,
      this.detailHeroAttackBoxBg,
      this.detailHeroAttackDesc,
      this.detailHeroStatsBoxBg,
      this.detailHeroStats,
      this.detailPedestalOuter,
      this.detailPedestal,
      this.detailHeroSprite,
      this.detailSkillNameBoxBg,
      this.detailSkillTitle,
      this.detailSkillCdBoxBg,
      this.detailSkillMeta,
      this.detailSkillDescBox,
      this.detailSkillDesc,
      this.detailSelectBtn,
      this.detailSelectText
    );
  }

  private selectDetailSkill(idx: number) {
    this.currentDetailSkillIndex = idx;
    const hero = HEROES[this.tempHeroKey] || HEROES.char_zaza;
    const skill = hero.skills[idx];
    if (!skill) return;

    this.detailSkillTitle.setText(skill.name.toUpperCase());
    this.detailSkillMeta.setText(`⏱ ${skill.cooldown}с`);
    this.detailSkillDesc.setText(skill.desc);

    const skillColor = idx === 2 ? 0xfbbf24 : (idx === 1 ? 0x38bdf8 : 0x4ade80);
    this.detailSkillNameBoxBg.setStrokeStyle(2, skillColor);

    this.detailSkillSquareButtons.forEach((btn, i) => {
      const isSelected = i === idx;
      btn.bg.setStrokeStyle(isSelected ? 2 : 1, isSelected ? skillColor : 0x3f3f46);
      btn.bg.setFillStyle(isSelected ? 0x14532d : 0x181a26);
      btn.label.setColor(isSelected ? '#86efac' : '#ffffff');
    });
  }

  private openHeroMenu() {
    this.isHeroMenuOpen = true;
    this.player.setVelocity(0, 0);
    this.interactPromptUI.setVisible(false);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const cx = width / 2;
    const cy = height / 2;

    if (this.heroOverlay && typeof this.heroOverlay.setDisplaySize === 'function') this.heroOverlay.setPosition(cx, cy).setDisplaySize(width * 2, height * 2).setVisible(true);
    if (this.altarBg) this.altarBg.setPosition(cx, cy).setVisible(true);
    this.repositionAltarElements(width, height);
    this.showRosterView();

    if (this.minimapContainer) this.minimapContainer.setVisible(false);
    this.combatElements.forEach(el => (el as unknown as { setVisible: (v: boolean) => void }).setVisible(false));
    if (this.joyStickBase) {
      this.joyStickBase.setVisible(false);
      this.joyStickThumb.setVisible(false);
    }
  }

  private closeHeroMenu() {
    this.isHeroMenuOpen = false;
    this.heroOverlay.setVisible(false);
    this.altarBg.setVisible(false);
    this.rosterGroup.forEach(obj => (obj as unknown as { setVisible: (v: boolean) => void }).setVisible(false));
    this.detailGroup.forEach(obj => (obj as unknown as { setVisible: (v: boolean) => void }).setVisible(false));

    if (this.minimapContainer) this.minimapContainer.setVisible(true);
    this.combatElements.forEach(el => (el as unknown as { setVisible: (v: boolean) => void }).setVisible(true));
    if (!this.isPC && this.joyStickBase) {
      this.joyStickBase.setVisible(true);
      this.joyStickThumb.setVisible(true);
    }
  }

  private showRosterView() {
    this.detailGroup.forEach(obj => (obj as unknown as { setVisible: (v: boolean) => void }).setVisible(false));

    this.rosterCards.forEach(c => {
      const isEquipped = c.key === this.selectedHeroKey;
      c.statusText.setText(isEquipped ? '[ ТЕКУЩИЙ ✓ ]' : '').setVisible(isEquipped);
      c.statusText.setColor('#4ade80');
      c.statusText.setBackgroundColor('#064e3b');
    });

    this.rosterGroup.forEach(obj => (obj as unknown as { setVisible: (v: boolean) => void }).setVisible(true));
  }

  private openHeroDetailView(heroKey: string) {
    this.tempHeroKey = heroKey;
    const hero = HEROES[heroKey];

    this.rosterGroup.forEach(obj => (obj as unknown as { setVisible: (v: boolean) => void }).setVisible(false));

    // Show actual character sprite stationary on center pedestal (NO moving back and forth)
    this.tweens.killTweensOf(this.detailHeroSprite);
    this.detailHeroSprite.setTexture(hero.texture).setScale(3.0).setAngle(0);

    const displayName = heroKey === 'char_zaza' ? 'ZAZA' : (heroKey === 'char_grim' ? 'ГРИМ' : 'БЬОРН');
    this.detailHeroName.setText(displayName).setColor('#ffffff');

    // Rarity badge directly below name
    this.detailHeroRarityBadgeBg.setStrokeStyle(1, hero.color).setFillStyle(heroKey === 'char_zaza' ? 0x2e1065 : 0x1e293b);
    this.detailHeroRarity.setText(`[ ${hero.rarity} ]`).setColor(hero.colorHex);

    this.detailHeroTitle.setText(hero.title);
    this.detailHeroAttackDesc.setText(`⚔ Атака: ${hero.attackDesc}`);
    this.detailHeroStats.setText(`❤ HP: ${hero.hp}   ⚡ СПД: ${hero.speed}`);

    // Update square skill buttons on right
    hero.skills.forEach((skill, idx) => {
      const sqBtn = this.detailSkillSquareButtons[idx];
      if (sqBtn) {
        sqBtn.icon.setTexture(skill.icon);
        sqBtn.label.setText(skill.name.toUpperCase());
      }
    });

    // Select first skill by default to show title & description on top-right
    this.selectDetailSkill(0);

    // Update select button state (in bottom-right corner)
    const isAlreadyEquipped = this.selectedHeroKey === this.tempHeroKey;
    if (isAlreadyEquipped) {
      this.detailSelectBtn.setFillStyle(0x27272a).setStrokeStyle(2, 0x52525b);
      this.detailSelectText.setText('[ ТЕКУЩИЙ БОЕЦ ✓ ]').setColor('#94a3b8');
    } else {
      this.detailSelectBtn.setFillStyle(0x16a34a).setStrokeStyle(2, 0x86efac);
      this.detailSelectText.setText('[ ВЫБРАТЬ ЭТОГО БОЙЦА ]').setColor('#ffffff');
    }

    this.detailGroup.forEach(obj => (obj as unknown as { setVisible: (v: boolean) => void }).setVisible(true));
  }

  private applySelectedHero() {
    soundEngine.playClick();
    this.selectedHeroKey = this.tempHeroKey;
    localStorage.setItem('fb_current_hero', this.selectedHeroKey);

    const hero = HEROES[this.selectedHeroKey];
    this.player.setTexture(hero.texture);
    this.playerSpeed = hero.speed;
    this.playerHp = hero.hp;
    this.playerMaxHp = hero.hp;
    this.nameLabel.setText(hero.name).setColor(hero.colorHex);

    this.isMonster = false;
    this.player.setScale(1.15);

    let wTex = 'weapon_stick';
    if (this.selectedHeroKey === 'char_grim') wTex = 'weapon_flask_launcher';
    else if (this.selectedHeroKey === 'char_bjorn') wTex = 'weapon_battleaxe';
    if (this.playerWeaponVisual) this.playerWeaponVisual.setTexture(wTex);

    this.updateCombatIcons();
    this.closeHeroMenu();

    // Floating text feedback
    this.showFloatingText(this.player.x, this.player.y - 60, `БОЕЦ ${hero.name} ВЫБРАН!`, hero.colorHex);
  }

  // --- LOBBY / MATCHMAKING GATE MODAL (Flat Scene GameObjects for 100% reliable clicks) ---
  private buildLobbyGateModal(width: number, height: number) {
    const cx = width / 2;
    const cy = height / 2;

    // Dim Backdrop (blocks clicks through to the world)
    this.lobbyOverlay = this.add.rectangle(cx, cy, width * 2, height * 2, 0x000000, 0.85)
      .setScrollFactor(0).setDepth(500).setVisible(false).setInteractive();

    this.lobbyOverlay.on('pointerdown', (_p: unknown, _lx: unknown, _ly: unknown, event: { stopPropagation: () => void }) => {
      event.stopPropagation();
    });

    // Window Frame (640 x 440 with gold/amber border)
    this.lobbyBg = this.add.rectangle(cx, cy, 640, 440, 0x0f111a)
      .setStrokeStyle(3, 0xd97706)
      .setScrollFactor(0).setDepth(501).setVisible(false);

    // Title
    this.lobbyTitle = this.add.text(cx, cy - 175, '✦ ПОРТАЛ ПРИКЛЮЧЕНИЙ ✦', {
      fontSize: '22px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#facc15'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(502).setVisible(false);

    // Back Button
    this.lobbyBackBtn = this.add.text(cx - 260, cy - 175, '< НАЗАД', {
      fontSize: '15px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#facc15',
      backgroundColor: '#1e2230',
      padding: { x: 10, y: 5 }
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    this.lobbyBackBtn.on('pointerdown', () => {
      soundEngine.playClick();
      this.handleLobbyBack();
    });

    // Close Button
    this.lobbyCloseBtn = this.add.text(cx + 275, cy - 175, '[X]', {
      fontSize: '22px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ef4444'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    this.lobbyCloseBtn.on('pointerdown', () => this.closeLobby());

    this.lobbyBaseGroup = [this.lobbyOverlay, this.lobbyBg, this.lobbyTitle, this.lobbyBackBtn, this.lobbyCloseBtn];

    // ==========================================
    // 1. ROOT VIEW: 2 MAIN BUTTONS [ ПВП ] & [ ПОДЗЕМЕЛЬЕ ]
    // ==========================================
    const rootPvpY = cy - 40;
    const btnRootPvpBg = this.add.rectangle(cx, rootPvpY, 480, 80, 0x181a26)
      .setStrokeStyle(3, 0xd97706)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnRootPvpTitle = this.add.text(cx, rootPvpY - 14, '[ ⚔️ ПВП АРЕНА ]', {
      fontSize: '21px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#facc15'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnRootPvpDesc = this.add.text(cx, rootPvpY + 16, 'Обычные матчи • Рейтинговая лига • Битва за кубки', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#cbd5e1'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const triggerRootPvp = () => {
      soundEngine.playClick();
      this.showPvPModes();
    };
    btnRootPvpBg.on('pointerdown', triggerRootPvp);
    btnRootPvpTitle.on('pointerdown', triggerRootPvp);
    btnRootPvpDesc.on('pointerdown', triggerRootPvp);

    btnRootPvpBg.on('pointerover', () => {
      btnRootPvpBg.setStrokeStyle(3, 0xfde047).setFillStyle(0x27273a);
      btnRootPvpTitle.setColor('#fde047');
    });
    btnRootPvpBg.on('pointerout', () => {
      btnRootPvpBg.setStrokeStyle(3, 0xd97706).setFillStyle(0x181a26);
      btnRootPvpTitle.setColor('#facc15');
    });

    const rootDungY = cy + 60;
    const btnRootDungBg = this.add.rectangle(cx, rootDungY, 480, 80, 0x064e3b)
      .setStrokeStyle(3, 0x10b981)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnRootDungTitle = this.add.text(cx, rootDungY - 14, '[ 🗝️ ПОДЗЕМЕЛЬЕ ]', {
      fontSize: '21px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#34d399'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnRootDungDesc = this.add.text(cx, rootDungY + 16, 'Рогалик Soul Knight • Монстры, комнаты, лут и Босс', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#a7f3d0'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const triggerRootDung = () => {
      soundEngine.playClick();
      this.showDungeonModes();
    };
    btnRootDungBg.on('pointerdown', triggerRootDung);
    btnRootDungTitle.on('pointerdown', triggerRootDung);
    btnRootDungDesc.on('pointerdown', triggerRootDung);

    btnRootDungBg.on('pointerover', () => {
      btnRootDungBg.setStrokeStyle(3, 0x6ee7b7).setFillStyle(0x047857);
      btnRootDungTitle.setColor('#6ee7b7');
    });
    btnRootDungBg.on('pointerout', () => {
      btnRootDungBg.setStrokeStyle(3, 0x10b981).setFillStyle(0x064e3b);
      btnRootDungTitle.setColor('#34d399');
    });

    this.portalRootGroup = [btnRootPvpBg, btnRootPvpTitle, btnRootPvpDesc, btnRootDungBg, btnRootDungTitle, btnRootDungDesc];

    // ==========================================
    // 2. PVP MODES: [ ОБЫЧНЫЙ ] & [ РЕЙТИНГОВЫЙ ]
    // ==========================================
    const casualY = cy - 40;
    const btnCasualBg = this.add.rectangle(cx, casualY, 460, 78, 0x181a26)
      .setStrokeStyle(3, 0xd97706)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnCasualTitle = this.add.text(cx, casualY - 14, '[ ⚔ ОБЫЧНЫЙ МАТЧ ]', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnCasualDesc = this.add.text(cx, casualY + 16, 'Быстрый вход • Свободный бой и тренировка арены', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#94a3b8'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const triggerCasual = () => {
      soundEngine.playClick();
      this.showCasualMatchLobby();
    };
    btnCasualBg.on('pointerdown', triggerCasual);
    btnCasualTitle.on('pointerdown', triggerCasual);
    btnCasualDesc.on('pointerdown', triggerCasual);

    const rankedY = cy + 60;
    const btnRankedBg = this.add.rectangle(cx, rankedY, 460, 78, 0x451a03)
      .setStrokeStyle(3, 0xfbbf24)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnRankedTitle = this.add.text(cx, rankedY - 14, '[ 👑 РЕЙТИНГОВЫЙ МАТЧ ]', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#fbbf24'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnRankedDesc = this.add.text(cx, rankedY + 16, 'Борьба за кубки и ранги • Золотая лига • Сезон 1', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#fde68a'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const triggerRanked = () => {
      soundEngine.playClick();
      this.showRankedMatchLobby();
    };
    btnRankedBg.on('pointerdown', triggerRanked);
    btnRankedTitle.on('pointerdown', triggerRanked);
    btnRankedDesc.on('pointerdown', triggerRanked);

    this.pvpModesGroup = [btnCasualBg, btnCasualTitle, btnCasualDesc, btnRankedBg, btnRankedTitle, btnRankedDesc];

    // ==========================================
    // 3. DUNGEON MODES: [ СОЛО ] & [ ОНЛАЙН ]
    // ==========================================
    const soloY = cy - 40;
    const btnSoloBg = this.add.rectangle(cx, soloY, 460, 78, 0x1e293b)
      .setStrokeStyle(3, 0xf59e0b)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnSoloTitle = this.add.text(cx, soloY - 14, '[ 🛡️ СОЛО РЕЖИМ ]', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#fcd34d'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnSoloDesc = this.add.text(cx, soloY + 16, 'Одиночный поход • Случайная генерация • Испытание героя', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#fef08a'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const triggerSoloDung = () => {
      soundEngine.playLevelUp();
      this.closeLobby();
      this.scene.start('DungeonScene', { selectedHeroKey: this.selectedHeroKey, mode: 'solo' });
    };
    btnSoloBg.on('pointerdown', triggerSoloDung);
    btnSoloTitle.on('pointerdown', triggerSoloDung);
    btnSoloDesc.on('pointerdown', triggerSoloDung);

    const onlineY = cy + 60;
    const btnOnlineBg = this.add.rectangle(cx, onlineY, 460, 78, 0x064e3b)
      .setStrokeStyle(3, 0x34d399)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnOnlineTitle = this.add.text(cx, onlineY - 14, '[ 🌐 ОНЛАЙН С ДРУЗЬЯМИ ]', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#6ee7b7'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnOnlineDesc = this.add.text(cx, onlineY + 16, 'Кооператив • Совместное подземелье и воскрешение соратников', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#a7f3d0'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const triggerOnlineChoice = () => {
      soundEngine.playClick();
      this.showDungeonOnlineChoice();
    };
    btnOnlineBg.on('pointerdown', triggerOnlineChoice);
    btnOnlineTitle.on('pointerdown', triggerOnlineChoice);
    btnOnlineDesc.on('pointerdown', triggerOnlineChoice);

    this.dungeonModesGroup = [btnSoloBg, btnSoloTitle, btnSoloDesc, btnOnlineBg, btnOnlineTitle, btnOnlineDesc];

    // ==========================================
    // 4. DUNGEON ONLINE CHOICE: [ СОЗДАТЬ ] & [ ВОЙТИ ]
    // ==========================================
    const createChoiceY = cy - 40;
    const btnCreateChoiceBg = this.add.rectangle(cx, createChoiceY, 460, 78, 0x181a26)
      .setStrokeStyle(3, 0xf59e0b)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnCreateChoiceTitle = this.add.text(cx, createChoiceY - 14, '[ ➕ СОЗДАТЬ КОМНАТУ ]', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#facc15'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnCreateChoiceDesc = this.add.text(cx, createChoiceY + 16, 'Задать имя, пароль и создать персональный код для друзей', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#cbd5e1'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const triggerShowCreate = () => {
      soundEngine.playClick();
      this.showDungeonCreateView();
    };
    btnCreateChoiceBg.on('pointerdown', triggerShowCreate);
    btnCreateChoiceTitle.on('pointerdown', triggerShowCreate);
    btnCreateChoiceDesc.on('pointerdown', triggerShowCreate);

    const joinChoiceY = cy + 60;
    const btnJoinChoiceBg = this.add.rectangle(cx, joinChoiceY, 460, 78, 0x312e81)
      .setStrokeStyle(3, 0xa855f7)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnJoinChoiceTitle = this.add.text(cx, joinChoiceY - 14, '[ 🚪 ВОЙТИ В КОМНАТУ ]', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#c084fc'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnJoinChoiceDesc = this.add.text(cx, joinChoiceY + 16, 'Список открытых серверов • Подбор • Вход по коду', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#e9d5ff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const triggerShowServers = () => {
      soundEngine.playClick();
      this.showDungeonServersView();
    };
    btnJoinChoiceBg.on('pointerdown', triggerShowServers);
    btnJoinChoiceTitle.on('pointerdown', triggerShowServers);
    btnJoinChoiceDesc.on('pointerdown', triggerShowServers);

    this.dungeonOnlineChoiceGroup = [btnCreateChoiceBg, btnCreateChoiceTitle, btnCreateChoiceDesc, btnJoinChoiceBg, btnJoinChoiceTitle, btnJoinChoiceDesc];

    // ==========================================
    // 5. DUNGEON CREATE VIEW (NAME, PASS, GEN CODE, START)
    // ==========================================
    const createBox = this.add.rectangle(cx, cy, 520, 260, 0x181a26)
      .setStrokeStyle(2, 0xd97706)
      .setScrollFactor(0).setDepth(502).setVisible(false);

    this.roomNameDisplay = this.add.text(cx, cy - 90, `ИМЯ КОМНАТЫ: ${this.currentRoomName} ✎`, {
      fontSize: '15px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#27272a',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    this.roomNameDisplay.on('pointerdown', () => {
      soundEngine.playClick();
      const names = ['Подземелье Зазы', 'Рейд Героев', 'Крипта Теней', 'Охота за Короной'];
      const nextIdx = (names.indexOf(this.currentRoomName) + 1) % names.length;
      this.currentRoomName = names[nextIdx];
      this.roomNameDisplay.setText(`ИМЯ КОМНАТЫ: ${this.currentRoomName} ✎`);
    });

    this.roomPassDisplay = this.add.text(cx, cy - 45, 'ПАРОЛЬ: [ БЕЗ ПАРОЛЯ ]', {
      fontSize: '14px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#4ade80',
      backgroundColor: '#27272a',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    this.roomPassDisplay.on('pointerdown', () => {
      soundEngine.playClick();
      this.isPrivateRoom = !this.isPrivateRoom;
      if (this.isPrivateRoom) {
        this.roomPassDisplay.setText('ПАРОЛЬ: [ ПРИВАТНЫЙ 🔒 1234 ]').setColor('#facc15');
      } else {
        this.roomPassDisplay.setText('ПАРОЛЬ: [ БЕЗ ПАРОЛЯ ]').setColor('#4ade80');
      }
    });

    // Personal Code Generator Button
    const btnGenCodeBg = this.add.rectangle(cx - 110, cy + 15, 240, 44, 0x3f3f46)
      .setStrokeStyle(2, 0xfbbf24)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnGenCodeText = this.add.text(cx - 110, cy + 15, '🎲 СОЗДАТЬ КОД', {
      fontSize: '14px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#facc15'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    this.personalCodeDisplay = this.add.text(cx + 120, cy + 15, `КОД: ${this.currentPersonalCode}`, {
      fontSize: '17px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#fbbf24',
      backgroundColor: '#451a03',
      padding: { x: 12, y: 7 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setVisible(false);

    const triggerGenCode = () => {
      soundEngine.playClick();
      this.currentPersonalCode = 'DG-' + Math.floor(1000 + Math.random() * 9000);
      this.personalCodeDisplay.setText(`КОД: ${this.currentPersonalCode}`);
      this.showFloatingText(this.personalCodeDisplay.x, this.personalCodeDisplay.y - 30, 'КОД СОЗДАН!', '#fbbf24');
    };
    btnGenCodeBg.on('pointerdown', triggerGenCode);
    btnGenCodeText.on('pointerdown', triggerGenCode);

    // Launch button
    const btnCreateLaunchBg = this.add.rectangle(cx, cy + 85, 340, 46, 0x16a34a)
      .setStrokeStyle(3, 0x86efac)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnCreateLaunchText = this.add.text(cx, cy + 85, 'СОЗДАТЬ И ВОЙТИ ▶', {
      fontSize: '17px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const triggerCreateLaunch = () => {
      soundEngine.playLevelUp();
      this.closeLobby();
      this.scene.start('DungeonScene', {
        selectedHeroKey: this.selectedHeroKey,
        mode: 'online',
        roomCode: this.currentPersonalCode
      });
    };
    btnCreateLaunchBg.on('pointerdown', triggerCreateLaunch);
    btnCreateLaunchText.on('pointerdown', triggerCreateLaunch);

    this.dungeonCreateGroup = [
      createBox,
      this.roomNameDisplay,
      this.roomPassDisplay,
      btnGenCodeBg,
      btnGenCodeText,
      this.personalCodeDisplay,
      btnCreateLaunchBg,
      btnCreateLaunchText
    ];

    // ==========================================
    // 6. DUNGEON SERVERS VIEW: [ ПОДБОР ] [ ПОИСК ] [ ВОЙТИ ПО КОДУ ]
    // ==========================================
    const serverBox = this.add.rectangle(cx, cy - 35, 540, 160, 0x09090b)
      .setStrokeStyle(2, 0xd97706)
      .setScrollFactor(0).setDepth(502).setVisible(false);

    this.dungeonServerRows = [];
    const initialServers = [
      { name: 'Логово Древнего Голема', players: '1/2', code: 'DG-1092' },
      { name: 'Крипта Теней (Кооп)', players: '1/2', code: 'DG-4820' },
      { name: 'Охота за Артефактами', players: '1/2', code: 'DG-7714' }
    ];

    this.dungeonServersGroup = [serverBox];

    for (let i = 0; i < 3; i++) {
      const sY = cy - 85 + i * 44;
      const sItem = initialServers[i];

      const rowBg = this.add.rectangle(cx, sY, 510, 36, 0x1f2937)
        .setStrokeStyle(1, 0xd97706)
        .setScrollFactor(0).setDepth(502).setVisible(false);

      const rowLabel = this.add.text(cx - 240, sY, `[▶] ${sItem.name} • ${sItem.players} • Код: ${sItem.code}`, {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: '#ffffff'
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(503).setVisible(false);

      const rowBtn = this.add.text(cx + 200, sY, '[ ВОЙТИ ]', {
        fontSize: '13px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: '#4ade80',
        backgroundColor: '#064e3b',
        padding: { x: 8, y: 3 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

      const joinServer = () => {
        soundEngine.playLevelUp();
        this.closeLobby();
        this.scene.start('DungeonScene', {
          selectedHeroKey: this.selectedHeroKey,
          mode: 'online',
          roomCode: sItem.code
        });
      };
      rowBtn.on('pointerdown', joinServer);

      this.dungeonServerRows.push({ label: rowLabel, btn: rowBtn, bg: rowBg, code: sItem.code });
      this.dungeonServersGroup.push(rowBg, rowLabel, rowBtn);
    }

    // Bottom 3 Action Buttons: [ ПОДБОР ] [ ПОИСК ] [ ПОЙТИ ПО КОДУ ]
    const btnMatchBg = this.add.rectangle(cx - 170, cy + 85, 155, 46, 0x16a34a)
      .setStrokeStyle(2, 0x86efac)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnMatchText = this.add.text(cx - 170, cy + 85, '[ ⚡ ПОДБОР ]', {
      fontSize: '15px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const triggerDungMatch = () => {
      soundEngine.playClick();
      this.showFloatingText(cx, cy - 30, 'ПОДБОР КООП КОМАНДЫ...', '#4ade80');
      this.time.delayedCall(700, () => {
        this.closeLobby();
        this.scene.start('DungeonScene', {
          selectedHeroKey: this.selectedHeroKey,
          mode: 'online',
          roomCode: 'DG-1092'
        });
      });
    };
    btnMatchBg.on('pointerdown', triggerDungMatch);
    btnMatchText.on('pointerdown', triggerDungMatch);

    const btnSearchBg = this.add.rectangle(cx, cy + 85, 155, 46, 0x27272a)
      .setStrokeStyle(2, 0x38bdf8)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnSearchText = this.add.text(cx, cy + 85, '[ 🔍 ПОИСК ]', {
      fontSize: '15px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#38bdf8'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const triggerDungSearch = () => {
      soundEngine.playClick();
      this.showFloatingText(cx, cy - 30, 'СЕРВЕРЫ ОБНОВЛЕНЫ ✓', '#38bdf8');
    };
    btnSearchBg.on('pointerdown', triggerDungSearch);
    btnSearchText.on('pointerdown', triggerDungSearch);

    const btnCodeBg = this.add.rectangle(cx + 170, cy + 85, 155, 46, 0x451a03)
      .setStrokeStyle(2, 0xfbbf24)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnCodeText = this.add.text(cx + 170, cy + 85, '[ 🔑 ПО КОДУ ]', {
      fontSize: '15px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#fbbf24'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const triggerJoinByCode = () => {
      soundEngine.playClick();
      // Prompt user or join friend's code
      const code = this.currentPersonalCode || 'DG-4820';
      this.showFloatingText(cx, cy - 30, `ВХОД ПО КОДУ: ${code}...`, '#fbbf24');
      this.time.delayedCall(600, () => {
        this.closeLobby();
        this.scene.start('DungeonScene', {
          selectedHeroKey: this.selectedHeroKey,
          mode: 'online',
          roomCode: code
        });
      });
    };
    btnCodeBg.on('pointerdown', triggerJoinByCode);
    btnCodeText.on('pointerdown', triggerJoinByCode);

    this.dungeonServersGroup.push(btnMatchBg, btnMatchText, btnSearchBg, btnSearchText, btnCodeBg, btnCodeText);

    // ==========================================
    // 7. RANKED MATCH VIEW
    // ==========================================
    const rankIcon = this.add.image(cx, cy - 90, 'rank_gold')
      .setScale(1.8).setScrollFactor(0).setDepth(502).setVisible(false);

    const rankName = this.add.text(cx, cy - 45, 'РАНГ: ЗОЛОТОЙ ВОИН', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#fbbf24'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setVisible(false);

    const rankPts = this.add.text(cx, cy - 15, 'ОЧКИ: 1450 / 1500  (До Платины: 50 pts)', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#e2e8f0'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setVisible(false);

    const teamModes = ['[ 👤 СОЛО ]', '[ 👥 ДУО ]', '[ 🫂 ТРИО ]'];
    let teamIdx = 0;

    const teamBg = this.add.rectangle(cx - 100, cy + 55, 170, 48, 0x3f3f46)
      .setStrokeStyle(2, 0xa1a1aa)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const teamBtn = this.add.text(cx - 100, cy + 55, teamModes[teamIdx], {
      fontSize: '17px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const toggleTeam = () => {
      soundEngine.playClick();
      teamIdx = (teamIdx + 1) % 3;
      teamBtn.setText(teamModes[teamIdx]);
    };
    teamBg.on('pointerdown', toggleTeam);
    teamBtn.on('pointerdown', toggleTeam);

    const startRankedBg = this.add.rectangle(cx + 100, cy + 55, 170, 48, 0x16a34a)
      .setStrokeStyle(3, 0x86efac)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const startRankedBtn = this.add.text(cx + 100, cy + 55, 'В БОЙ ▶', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const triggerStartRanked = () => {
      this.startMatchmaking(6);
    };
    startRankedBg.on('pointerdown', triggerStartRanked);
    startRankedBtn.on('pointerdown', triggerStartRanked);

    this.rankedGroup = [rankIcon, rankName, rankPts, teamBg, teamBtn, startRankedBg, startRankedBtn];

    // ==========================================
    // 8. CASUAL MATCH VIEW (SERVERS & QUICKPLAY)
    // ==========================================
    const listBorder = this.add.rectangle(cx, cy - 35, 520, 150, 0x09090b)
      .setStrokeStyle(2, 0x52525b)
      .setScrollFactor(0).setDepth(502).setVisible(false);

    this.serverLabels = [];
    for (let i = 0; i < 3; i++) {
      const lbl = this.add.text(cx - 230, cy - 85 + i * 42, '', {
        fontSize: '15px',
        fontFamily: 'monospace',
        color: '#ffffff'
      }).setScrollFactor(0).setDepth(503).setVisible(false);
      this.serverLabels.push(lbl);
    }

    const quickPlayBg = this.add.rectangle(cx - 130, cy + 75, 210, 46, 0x27272a)
      .setStrokeStyle(2, 0x4ade80)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const quickPlayBtn = this.add.text(cx - 130, cy + 75, '[ БЫСТРЫЙ ВХОД ]', {
      fontSize: '16px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#4ade80'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const triggerQuickPlay = () => {
      this.startMatchmaking(8);
    };
    quickPlayBg.on('pointerdown', triggerQuickPlay);
    quickPlayBtn.on('pointerdown', triggerQuickPlay);

    const createLobbyBg = this.add.rectangle(cx + 130, cy + 75, 210, 46, 0x27272a)
      .setStrokeStyle(2, 0x38bdf8)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const createLobbyBtn = this.add.text(cx + 130, cy + 75, '[ СОЗДАТЬ СЕРВЕР ]', {
      fontSize: '16px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#38bdf8'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const triggerCreate = () => {
      soundEngine.playClick();
      this.matchLobbies.unshift({
        name: `Комната ${this.matchLobbies.length + 1}`,
        players: '1/8',
        map: 'АРЕНА'
      });
      this.updateServerLabels();
      this.showFloatingText(this.player.x, this.player.y - 60, 'СЕРВЕР СОЗДАН!', '#38bdf8');
    };
    createLobbyBg.on('pointerdown', triggerCreate);
    createLobbyBtn.on('pointerdown', triggerCreate);

    this.casualGroup = [listBorder, ...this.serverLabels, quickPlayBg, quickPlayBtn, createLobbyBg, createLobbyBtn];

    // ==========================================
    // 9. MATCHMAKING SEARCH STATUS
    // ==========================================
    this.matchmakingSearchText = this.add.text(cx, cy - 20, '', {
      fontSize: '22px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#4ade80'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setVisible(false);

    const cancelSearchBg = this.add.rectangle(cx, cy + 50, 180, 44, 0x3f3f46)
      .setStrokeStyle(2, 0xef4444)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const cancelSearchBtn = this.add.text(cx, cy + 50, '[ ОТМЕНА ]', {
      fontSize: '16px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#f87171'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const triggerCancelSearch = () => {
      soundEngine.playClick();
      if (this.matchmakingTimer) {
        this.matchmakingTimer.remove();
        this.matchmakingTimer = null;
      }
      this.showPvPModes();
    };
    cancelSearchBg.on('pointerdown', triggerCancelSearch);
    cancelSearchBtn.on('pointerdown', triggerCancelSearch);

    this.searchGroup = [this.matchmakingSearchText, cancelSearchBg, cancelSearchBtn];
  }

  private handleLobbyBack() {
    if (this.lobbyView === 'pvp_modes' || this.lobbyView === 'dungeon_modes') {
      this.showPortalRoot();
    } else if (this.lobbyView === 'casual' || this.lobbyView === 'ranked') {
      this.showPvPModes();
    } else if (this.lobbyView === 'dungeon_online_choice') {
      this.showDungeonModes();
    } else if (this.lobbyView === 'dungeon_create' || this.lobbyView === 'dungeon_servers') {
      this.showDungeonOnlineChoice();
    } else {
      this.showPortalRoot();
    }
  }

  private hideAllLobbyViews() {
    this.hideArray(this.portalRootGroup);
    this.hideArray(this.pvpModesGroup);
    this.hideArray(this.rankedGroup);
    this.hideArray(this.casualGroup);
    this.hideArray(this.searchGroup);
    this.hideArray(this.dungeonModesGroup);
    this.hideArray(this.dungeonOnlineChoiceGroup);
    this.hideArray(this.dungeonCreateGroup);
    this.hideArray(this.dungeonServersGroup);
  }

  private openLobby() {
    this.isLobbyOpen = true;
    this.player.setVelocity(0, 0);
    this.interactPromptUI.setVisible(false);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const cx = width / 2;
    const cy = height / 2;

    this.repositionLobbyElements(cx, cy);

    if (this.lobbyOverlay && typeof this.lobbyOverlay.setDisplaySize === 'function') this.lobbyOverlay.setPosition(cx, cy).setDisplaySize(width * 2, height * 2).setVisible(true);
    if (this.lobbyBg) this.lobbyBg.setPosition(cx, cy).setVisible(true);
    this.lobbyTitle.setPosition(cx, cy - 175).setVisible(true);
    this.lobbyCloseBtn.setPosition(cx + 275, cy - 175).setVisible(true);

    this.showPortalRoot();

    if (this.minimapContainer) this.minimapContainer.setVisible(false);
    this.combatElements.forEach(el => (el as unknown as { setVisible: (v: boolean) => void }).setVisible(false));
    if (this.joyStickBase) {
      this.joyStickBase.setVisible(false);
      this.joyStickThumb.setVisible(false);
    }
  }

  private closeLobby() {
    soundEngine.playClick();
    this.isLobbyOpen = false;

    if (this.matchmakingTimer) {
      this.matchmakingTimer.remove();
      this.matchmakingTimer = null;
    }

    this.lobbyBaseGroup.forEach(obj => (obj as unknown as { setVisible: (v: boolean) => void }).setVisible(false));
    this.hideAllLobbyViews();

    if (this.minimapContainer) this.minimapContainer.setVisible(true);
    this.combatElements.forEach(el => (el as unknown as { setVisible: (v: boolean) => void }).setVisible(true));
    if (!this.isPC && this.joyStickBase) {
      this.joyStickBase.setVisible(true);
      this.joyStickThumb.setVisible(true);
    }
  }

  private showPortalRoot() {
    this.lobbyView = 'portal_root';
    this.lobbyTitle.setText('✦ ПОРТАЛ ПРИКЛЮЧЕНИЙ ✦');
    this.lobbyBackBtn.setVisible(false);
    this.hideAllLobbyViews();
    this.showArray(this.portalRootGroup);
  }

  private showPvPModes() {
    this.lobbyView = 'pvp_modes';
    this.lobbyTitle.setText('ПВП: ВЫБОР РЕЖИМА');
    this.lobbyBackBtn.setVisible(true);
    this.hideAllLobbyViews();
    this.showArray(this.pvpModesGroup);
  }

  private showDungeonModes() {
    this.lobbyView = 'dungeon_modes';
    this.lobbyTitle.setText('ПОДЗЕМЕЛЬЕ: ВЫБОР РЕЖИМА');
    this.lobbyBackBtn.setVisible(true);
    this.hideAllLobbyViews();
    this.showArray(this.dungeonModesGroup);
  }

  private showDungeonOnlineChoice() {
    this.lobbyView = 'dungeon_online_choice';
    this.lobbyTitle.setText('ОНЛАЙН ПОДЗЕМЕЛЬЕ');
    this.lobbyBackBtn.setVisible(true);
    this.hideAllLobbyViews();
    this.showArray(this.dungeonOnlineChoiceGroup);
  }

  private showDungeonCreateView() {
    this.lobbyView = 'dungeon_create';
    this.lobbyTitle.setText('СОЗДАНИЕ КОМНАТЫ');
    this.lobbyBackBtn.setVisible(true);
    this.hideAllLobbyViews();
    this.showArray(this.dungeonCreateGroup);
  }

  private showDungeonServersView() {
    this.lobbyView = 'dungeon_servers';
    this.lobbyTitle.setText('СЕРВЕРЫ ПОДЗЕМЕЛЬЯ');
    this.lobbyBackBtn.setVisible(true);
    this.hideAllLobbyViews();
    this.showArray(this.dungeonServersGroup);
  }

  private showCasualMatchLobby() {
    this.lobbyView = 'casual';
    this.lobbyTitle.setText('ОБЫЧНЫЕ МАТЧИ');
    this.lobbyBackBtn.setVisible(true);
    this.hideAllLobbyViews();
    this.showArray(this.casualGroup);
    this.updateServerLabels();
  }

  private updateServerLabels() {
    for (let i = 0; i < 3; i++) {
      const idx = this.lobbyScroll + i;
      if (idx < this.matchLobbies.length) {
        const item = this.matchLobbies[idx];
        this.serverLabels[i].setText(`[▶] ${item.name} | Игроки: ${item.players} | ${item.map}`);
      } else {
        this.serverLabels[i].setText('');
      }
    }
  }

  private showRankedMatchLobby() {
    this.lobbyView = 'ranked';
    this.lobbyTitle.setText('РЕЙТИНГОВАЯ АРЕНА');
    this.lobbyBackBtn.setVisible(true);
    this.hideAllLobbyViews();
    this.showArray(this.rankedGroup);
  }

  private startMatchmaking(limit: number) {
    soundEngine.playClick();
    this.hideAllLobbyViews();
    this.lobbyBackBtn.setVisible(false);
    this.lobbyTitle.setText('ПОДБОР ИГРОКОВ...');

    this.searchGroup.forEach(obj => (obj as unknown as { setVisible: (v: boolean) => void }).setVisible(true));

    let count = 1;
    this.matchmakingSearchText.setText(`ПОИСК ИГРОКОВ: 1/${limit}`);

    if (this.matchmakingTimer) {
      this.matchmakingTimer.remove();
    }

    this.matchmakingTimer = this.time.addEvent({
      delay: 450,
      repeat: limit - 2,
      callback: () => {
        count++;
        this.matchmakingSearchText.setText(`ПОИСК ИГРОКОВ: ${count}/${limit}`);
        soundEngine.playClick();

        if (count >= limit) {
          this.matchmakingSearchText.setText('МАТЧ НАЙДЕН! ЗАПУСК БОЯ...');
          this.time.delayedCall(800, () => {
            this.closeLobby();
            this.startArenaMatch();
          });
        }
      }
    });
  }

  private startArenaMatch() {
    // Spawns combat practice challenge in the courtyard
    this.showFloatingText(this.player.x, this.player.y - 70, '⚔ БОЙ НАЧАЛСЯ! ⚔', '#ef4444');
    soundEngine.playExplosion();

    // Clear any previous bots
    this.botsGroup.clear(true, true);

    // Spawn 2 enemy training bots
    for (let i = 0; i < 2; i++) {
      const offsetX = (i === 0 ? -1 : 1) * 140;
      const bot = this.physics.add.sprite(this.player.x + offsetX, this.player.y - 120, 'char_grim');
      this.botsGroup.add(bot);
      bot.setDepth(45);
      bot.setTint(0xef4444);
      (bot as unknown as { hp: number; maxHp: number }).hp = 600;
      (bot as unknown as { hp: number; maxHp: number }).maxHp = 600;

      // Bot movement towards player
      this.time.addEvent({
        delay: 500,
        repeat: 30,
        callback: () => {
          if (!bot || !bot.active || !this.player || !this.player.active) return;
          const angle = Phaser.Math.Angle.Between(bot.x, bot.y, this.player.x, this.player.y);
          bot.setVelocity(Math.cos(angle) * 140, Math.sin(angle) * 140);
        }
      });
    }
  }

  // --- COMBAT & SKILLS EXECUTION ---
  private executeSkill(type: 'attack' | 's1' | 's2' | 'ult') {
    const time = this.time.now;
    if (this.cds[type] > time) return;
    this.cds[type] = time + this.cdMax[type];

    const dir = this.player.flipX ? -1 : 1;

    // 1. ZAZA (Normal or Monster)
    if (this.selectedHeroKey === 'char_zaza') {
      if (!this.isMonster) {
        if (type === 'attack') {
          soundEngine.playAttack();
          this.activeClub = this.add.rectangle(this.player.x, this.player.y, 8, 42, 0x78350f)
            .setOrigin(0.5, 1).setDepth(100);
          this.tweens.add({
            targets: this.activeClub,
            angle: dir * 130,
            duration: 160,
            onComplete: () => {
              if (this.activeClub) {
                this.activeClub.destroy();
                this.activeClub = null;
              }
            }
          });
          this.dealDamageInArea(this.player.x + dir * 55, this.player.y, 50, 90);
        } else if (type === 's1') {
          soundEngine.playPoison();
          const startX = this.player.x;
          const startY = this.player.y;
          const targetX = startX + dir * 220;
          const proj = this.add.circle(startX, startY, 9, 0x84cc16).setDepth(100);
          let hasBurst = false;

          const burstSpit = (hitX: number, hitY: number) => {
            if (hasBurst) return;
            hasBurst = true;
            proj.destroy();
            soundEngine.playPoison();
            this.dealDamageInArea(hitX, hitY, 55, 95);

            const puddle = this.add.ellipse(hitX, hitY, 14, 8, 0x84cc16, 0.75).setDepth(10);
            this.tweens.add({
              targets: puddle,
              scaleX: 6,
              scaleY: 6,
              alpha: 0.45,
              duration: 350,
              onComplete: () => {
                this.time.addEvent({
                  delay: 400,
                  repeat: 5,
                  callback: () => {
                    if (puddle.active) {
                      this.dealDamageInArea(puddle.x, puddle.y, 65, 45);
                    }
                  }
                });
                this.time.delayedCall(2500, () => puddle.destroy());
              }
            });
          };

          this.tweens.add({
            targets: proj,
            x: targetX,
            duration: 250,
            onUpdate: () => {
              if (hasBurst || !proj.active) return;
              if (this.checkEnemyAtPosition(proj.x, proj.y, 35)) {
                burstSpit(proj.x, proj.y);
              }
            },
            onComplete: () => {
              if (!hasBurst && proj.active) {
                burstSpit(targetX, startY);
              }
            }
          });
        } else if (type === 's2') {
          soundEngine.playWhirlwind();
          const stick = this.add.rectangle(this.player.x, this.player.y, 80, 9, 0x78350f).setDepth(100);
          this.tweens.add({
            targets: stick,
            angle: 1080,
            duration: 800,
            onUpdate: () => {
              if (stick.active) stick.setPosition(this.player.x, this.player.y);
            },
            onComplete: () => stick.destroy()
          });

          // Continuous whirlwind damage ticks while Zaza is spinning!
          this.time.addEvent({
            delay: 190,
            repeat: 3,
            callback: () => {
              if (!this.player || !this.player.active) return;
              this.dealDamageInArea(this.player.x, this.player.y, 85, 75);
              const poisonPuff = this.add.circle(this.player.x + (Math.random() - 0.5) * 35, this.player.y + (Math.random() - 0.5) * 35, 16, 0x84cc16, 0.45).setDepth(49);
              this.tweens.add({
                targets: poisonPuff,
                scale: 1.6,
                alpha: 0,
                duration: 240,
                onComplete: () => poisonPuff.destroy()
              });
            }
          });
        } else if (type === 'ult') {
          soundEngine.playMonsterUlt();
          this.isMonster = true;
          if (this.playerWeaponVisual) this.playerWeaponVisual.setVisible(false);
          this.player.setTexture('char_zaza_monster');
          this.player.setScale(1.25);
          this.playerHp = 2200;
          this.playerMaxHp = 2200;
          this.monsterTimer = time + 10000;
          this.updateCombatIcons();

          const shock = this.add.circle(this.player.x, this.player.y, 12, 0xa855f7, 0.85).setDepth(100);
          this.tweens.add({
            targets: shock,
            scale: 16,
            alpha: 0,
            duration: 550,
            onComplete: () => shock.destroy()
          });
          this.showFloatingText(this.player.x, this.player.y - 70, 'МУТАЦИЯ МОНСТРА!', '#a855f7');
        }
      } else {
        // Monster form attacks
        if (type === 'attack') {
          soundEngine.playAttack();
          const bite = this.add.circle(this.player.x + dir * 65, this.player.y, 32, 0xef4444, 0.85).setDepth(100);
          this.tweens.add({
            targets: bite,
            scale: 1.5,
            alpha: 0,
            duration: 150,
            onComplete: () => bite.destroy()
          });
          this.dealDamageInArea(this.player.x + dir * 65, this.player.y, 60, 180);
        } else if (type === 's1') {
          soundEngine.playMonsterUlt();
          // Monster Claw Ground Slam with 3 Toxic Wave Bursts
          for (let step = 1; step <= 3; step++) {
            this.time.delayedCall(step * 90, () => {
              if (!this.player || !this.player.active) return;
              const slamX = this.player.x + dir * step * 50;
              const slamY = this.player.y;
              const wave = this.add.circle(slamX, slamY, 28, 0x84cc16, 0.8).setDepth(100);
              this.tweens.add({ targets: wave, scale: 2.2, alpha: 0, duration: 320, onComplete: () => wave.destroy() });
              this.dealDamageInArea(slamX, slamY, 70, 180);
            });
          }
        } else if (type === 's2') {
          soundEngine.playMonsterUlt();
          // Monster roar continuous ground shakes
          this.time.addEvent({
            delay: 220,
            repeat: 2,
            callback: () => {
              if (!this.player || !this.player.active) return;
              const roar = this.add.circle(this.player.x, this.player.y, 20, 0xef4444, 0.6).setDepth(100);
              this.tweens.add({
                targets: roar,
                scale: 6,
                alpha: 0,
                duration: 350,
                onComplete: () => roar.destroy()
              });
              this.dealDamageInArea(this.player.x, this.player.y, 110, 85);
            }
          });
        }
      }
    }
    // 2. GRIM
    else if (this.selectedHeroKey === 'char_grim') {
      if (type === 'attack') {
        soundEngine.playAttack();
        const startX = this.player.x;
        const startY = this.player.y;
        const targetX = startX + dir * 220;

        const flask = this.add.circle(startX, startY, 9, 0x38bdf8).setDepth(100);
        let hasHit = false;

        const explodeFlask = (fx: number, fy: number) => {
          if (hasHit) return;
          hasHit = true;
          flask.destroy();
          soundEngine.playPoison();

          // Visual chemical explosion splash
          const splash = this.add.circle(fx, fy, 22, 0x38bdf8, 0.65).setDepth(99);
          this.tweens.add({
            targets: splash,
            scale: 2.4,
            alpha: 0,
            duration: 260,
            onComplete: () => splash.destroy()
          });

          // Shatter fragments
          for (let p = 0; p < 4; p++) {
            const frag = this.add.circle(fx, fy, 4, 0x7dd3fc).setDepth(99);
            const ang = (p / 4) * Math.PI * 2;
            this.tweens.add({
              targets: frag,
              x: fx + Math.cos(ang) * 35,
              y: fy + Math.sin(ang) * 35,
              alpha: 0,
              duration: 200,
              onComplete: () => frag.destroy()
            });
          }

          // Deal reliable chemical splash damage
          this.dealDamageInArea(fx, fy, 65, 95);
        };

        this.tweens.add({
          targets: flask,
          x: targetX,
          duration: 240,
          onUpdate: () => {
            if (hasHit || !flask.active) return;
            // Check if flask hits any enemy in its flight path
            if (this.checkEnemyAtPosition(flask.x, flask.y, 36)) {
              explodeFlask(flask.x, flask.y);
            }
          },
          onComplete: () => {
            if (!hasHit && flask.active) {
              explodeFlask(targetX, startY);
            }
          }
        });
      } else if (type === 's1') {
        soundEngine.playPoison();
        const startX = this.player.x;
        const startY = this.player.y;
        const targetX = startX + dir * 220;
        const tar = this.add.circle(startX, startY, 11, 0x0f172a).setDepth(100);
        let tarBurst = false;

        const explodeTar = (tx: number, ty: number) => {
          if (tarBurst) return;
          tarBurst = true;
          tar.destroy();
          soundEngine.playAttack();
          this.dealDamageInArea(tx, ty, 60, 120);
          this.showFloatingText(tx, ty - 25, 'СМОЛА: ЗАМЕДЛЕНИЕ 50%!', '#38bdf8');

          const puddle = this.add.ellipse(tx, ty, 65, 34, 0x0f172a, 0.85).setDepth(10);
          this.time.addEvent({
            delay: 350,
            repeat: 6,
            callback: () => {
              if (puddle.active) {
                this.dealDamageInArea(puddle.x, puddle.y, 70, 40);
                if (this.botsGroup) {
                  this.botsGroup.getChildren().forEach(obj => {
                    const b = obj as Phaser.Physics.Arcade.Sprite & { isSlowed?: boolean };
                    if (b.active && Phaser.Math.Distance.Between(b.x, b.y, puddle.x, puddle.y) < 70) {
                      b.setVelocity(b.body ? b.body.velocity.x * 0.5 : 0, b.body ? b.body.velocity.y * 0.5 : 0);
                    }
                  });
                }
              }
            }
          });
          this.time.delayedCall(2600, () => puddle.destroy());
        };

        this.tweens.add({
          targets: tar,
          x: targetX,
          duration: 250,
          onUpdate: () => {
            if (tarBurst || !tar.active) return;
            if (this.checkEnemyAtPosition(tar.x, tar.y, 35)) {
              explodeTar(tar.x, tar.y);
            }
          },
          onComplete: () => {
            if (!tarBurst && tar.active) explodeTar(targetX, startY);
          }
        });
      } else if (type === 's2') {
        soundEngine.playClick();
        this.tweens.add({
          targets: this.player,
          x: this.player.x + dir * 140,
          duration: 150
        });
        this.player.setAlpha(0.25);
        this.time.delayedCall(1600, () => this.player.setAlpha(1));
      } else if (type === 'ult') {
        soundEngine.playExplosion();
        const pot = this.add.circle(this.player.x + dir * 90, this.player.y, 16, 0xef4444).setDepth(100);
        this.tweens.add({
          targets: pot,
          scale: 7,
          alpha: 0,
          delay: 1400,
          duration: 350,
          onComplete: () => {
            this.dealDamageInArea(pot.x, pot.y, 120, 650);
            pot.destroy();
          }
        });
      }
    }
    // 3. BJORN
    else if (this.selectedHeroKey === 'char_bjorn') {
      if (type === 'attack') {
        soundEngine.playAttack();
        const axeHit = this.add.rectangle(this.player.x + dir * 55, this.player.y, 35, 10, 0xe2e8f0).setDepth(100);
        this.tweens.add({
          targets: axeHit,
          scale: 1.5,
          alpha: 0,
          duration: 150,
          onComplete: () => axeHit.destroy()
        });
        this.dealDamageInArea(this.player.x + dir * 55, this.player.y, 55, 120);
      } else if (type === 's1') {
        soundEngine.playEarthquake();
        const sp1 = this.add.rectangle(this.player.x + dir * 60, this.player.y + 15, 16, 32, 0x78350f).setDepth(10).setScale(1, 0);
        const sp2 = this.add.rectangle(this.player.x + dir * 120, this.player.y + 15, 16, 32, 0x78350f).setDepth(10).setScale(1, 0);
        this.tweens.add({
          targets: sp1,
          scaleY: 2,
          duration: 160,
          yoyo: true,
          hold: 450,
          onComplete: () => sp1.destroy()
        });
        this.time.delayedCall(160, () => {
          this.tweens.add({
            targets: sp2,
            scaleY: 2,
            duration: 160,
            yoyo: true,
            hold: 450,
            onComplete: () => sp2.destroy()
          });
        });
        this.dealDamageInArea(this.player.x + dir * 90, this.player.y, 70, 220);
      } else if (type === 's2') {
        soundEngine.playAttack();
        this.tweens.add({
          targets: this.player,
          x: this.player.x + dir * 140,
          duration: 180
        });
        this.dealDamageInArea(this.player.x + dir * 80, this.player.y, 65, 240);
      } else if (type === 'ult') {
        soundEngine.playWhirlwind();
        this.activeAxe = this.add.rectangle(this.player.x, this.player.y, 95, 16, 0xe2e8f0).setDepth(100);

        // Spin axe for 1800ms
        this.tweens.add({
          targets: this.activeAxe,
          angle: 1440,
          duration: 1800,
          onUpdate: () => {
            if (this.activeAxe) {
              this.activeAxe.setPosition(this.player.x, this.player.y);
            }
          },
          onComplete: () => {
            if (this.activeAxe) {
              this.activeAxe.destroy();
              this.activeAxe = null;
            }
            this.player.angle = 0;
          }
        });

        // Continuous whirlwind damage ticks while Bjorn is spinning! (8 ticks over 1800ms)
        this.time.addEvent({
          delay: 220,
          repeat: 7,
          callback: () => {
            if (!this.player || !this.player.active) return;
            this.dealDamageInArea(this.player.x, this.player.y, 110, 85);
            // Visual spin wind slash
            const slash = this.add.circle(this.player.x, this.player.y, 65, 0xf97316, 0.25).setDepth(48);
            this.tweens.add({
              targets: slash,
              scale: 1.6,
              alpha: 0,
              duration: 200,
              onComplete: () => slash.destroy()
            });
          }
        });
      }
    }
  }

  private checkEnemyAtPosition(x: number, y: number, radius: number): boolean {
    let hit = false;
    if (this.dummyGroup) {
      this.dummyGroup.getChildren().forEach(obj => {
        const dummy = obj as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        if (Phaser.Math.Distance.Between(x, y, dummy.x, dummy.y) <= radius) {
          hit = true;
        }
      });
    }
    if (!hit && this.botsGroup) {
      this.botsGroup.getChildren().forEach(obj => {
        const bot = obj as Phaser.Physics.Arcade.Sprite;
        if (bot.active && Phaser.Math.Distance.Between(x, y, bot.x, bot.y) <= radius) {
          hit = true;
        }
      });
    }
    return hit;
  }

  private dealDamageInArea(x: number, y: number, radius: number, damage: number) {
    if (this.dummyGroup) {
      this.dummyGroup.getChildren().forEach(obj => {
        const dummy = obj as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody & { hp?: number };
        const dist = Phaser.Math.Distance.Between(x, y, dummy.x, dummy.y);
        if (dist <= radius) {
          dummy.setTint(0xff0000);
          this.time.delayedCall(120, () => dummy.clearTint());
          this.showFloatingText(dummy.x, dummy.y - 25, `-${damage}`, '#f87171');
        }
      });
    }

    if (this.botsGroup) {
      this.botsGroup.getChildren().forEach(obj => {
        const bot = obj as Phaser.Physics.Arcade.Sprite & { hp: number; maxHp: number };
        if (!bot.active) return;
        const dist = Phaser.Math.Distance.Between(x, y, bot.x, bot.y);
        if (dist <= radius) {
          bot.setTint(0xff0000);
          this.time.delayedCall(120, () => {
            if (bot.active) bot.clearTint();
          });
          this.showFloatingText(bot.x, bot.y - 25, `-${damage}`, '#f87171');
          bot.hp -= damage;
          if (bot.hp <= 0) {
            soundEngine.playExplosion();
            this.showFloatingText(bot.x, bot.y - 45, 'ПОБЕЖДЕН! +100', '#4ade80');
            const deadFx = this.add.circle(bot.x, bot.y, 20, 0xef4444, 0.8).setDepth(45);
            this.tweens.add({
              targets: deadFx,
              scale: 2.5,
              alpha: 0,
              duration: 300,
              onComplete: () => deadFx.destroy()
            });
            bot.destroy();
          }
        }
      });
    }
  }

  private showFloatingText(x: number, y: number, text: string, color: string) {
    const floatTxt = this.add.text(x, y, text, {
      fontSize: '14px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: color
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: floatTxt,
      y: y - 35,
      alpha: 0,
      duration: 750,
      onComplete: () => floatTxt.destroy()
    });
  }

  private updateCombatIcons() {
    if (this.isMonster && this.selectedHeroKey === 'char_zaza') {
      this.iconS1.setTexture('skill_monster_1');
      this.iconS2.setTexture('skill_monster_2');
      this.iconUlt.setTint(0x475569);
    } else {
      const hero = HEROES[this.selectedHeroKey];
      this.iconS1.setTexture(hero.skills[0].icon);
      this.iconS2.setTexture(hero.skills[1].icon);
      this.iconUlt.setTexture(hero.skills[2].icon).clearTint();
    }
  }

  private handleCurrentInteraction() {
    if (!this.currentInteractable) return;
    soundEngine.playClick();
    if (this.currentInteractable.action === 'altar') {
      this.openHeroMenu();
    } else if (this.currentInteractable.action === 'gate') {
      this.openLobby();
    } else if (this.currentInteractable.action === 'shop') {
      this.showFloatingText(this.player.x, this.player.y - 60, 'ТОРГОВЕЦ: Новые реликвии скоро!', '#fbbf24');
    }
  }

  private hideArray(arr: Phaser.GameObjects.GameObject[]) {
    arr.forEach(el => (el as unknown as { setVisible: (v: boolean) => void }).setVisible(false));
  }

  private showArray(arr: Phaser.GameObjects.GameObject[]) {
    arr.forEach(el => (el as unknown as { setVisible: (v: boolean) => void }).setVisible(true));
  }

  override update(time: number) {
    if (this.isHeroMenuOpen || this.isLobbyOpen) return;

    this.updateMinimapRadar();

    // Monster transformation expiration
    if (this.isMonster && time > this.monsterTimer) {
      this.isMonster = false;
      this.player.setTexture(HEROES[this.selectedHeroKey].texture);
      this.player.setScale(1);
      this.playerHp = HEROES[this.selectedHeroKey].hp;
      this.playerMaxHp = HEROES[this.selectedHeroKey].hp;
      this.updateCombatIcons();
      this.showFloatingText(this.player.x, this.player.y - 60, 'ДЕЙСТВИЕ МУТАЦИИ ЗАКОНЧИЛОСЬ', '#94a3b8');
    }

    if (this.playerWeaponVisual) {
      const facingRight = !this.player.flipX;
      this.playerWeaponVisual.setPosition(this.player.x + (facingRight ? 16 : -16), this.player.y + 4);
      this.playerWeaponVisual.setFlipX(!facingRight);
    }

    if (this.aimJoyPointerId !== null && this.aimJoyVector.lengthSq() > 0.05) {
      if (this.cds.attack <= time) {
        this.executeSkill('attack');
      }
    }

    // Cooldown overlays
    this.cdAttackOverlay.setVisible(this.cds.attack > time);
    this.cdS1Overlay.setVisible(this.cds.s1 > time);
    this.cdS2Overlay.setVisible(this.cds.s2 > time);
    this.cdUltOverlay.setVisible(this.cds.ult > time);

    // Keyboard Shortcuts
    if (this.isPC) {
      if (Phaser.Input.Keyboard.JustDown(this.keyAttack)) this.executeSkill('attack');
      if (Phaser.Input.Keyboard.JustDown(this.keyS1)) this.executeSkill('s1');
      if (Phaser.Input.Keyboard.JustDown(this.keyS2)) this.executeSkill('s2');
      if (Phaser.Input.Keyboard.JustDown(this.keyUlt)) this.executeSkill('ult');
    }

    // Movement calculation (WASD, Arrows, or Joystick)
    const velocity = new Phaser.Math.Vector2(0, 0);

    if (this.cursors.A.isDown || this.cursors.LEFT.isDown) velocity.x = -1;
    else if (this.cursors.D.isDown || this.cursors.RIGHT.isDown) velocity.x = 1;

    if (this.cursors.W.isDown || this.cursors.UP.isDown) velocity.y = -1;
    else if (this.cursors.S.isDown || this.cursors.DOWN.isDown) velocity.y = 1;

    if (!this.isPC && this.joyStickVector.lengthSq() > 0) {
      velocity.set(this.joyStickVector.x, this.joyStickVector.y);
    }

    if (velocity.lengthSq() > 0) {
      velocity.normalize();
      this.player.setVelocity(velocity.x * this.playerSpeed, velocity.y * this.playerSpeed);
      if (velocity.x !== 0) {
        this.player.setFlipX(velocity.x < 0);
      }
    } else {
      this.player.setVelocity(0, 0);
    }

    // Check distance to interactable world triggers
    let closest: { x: number; y: number; text: string; action: 'altar' | 'gate' | 'shop' } | null = null;
    let minDist = 130;

    for (const item of this.interactables) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
      if (dist < minDist) {
        closest = item;
        minDist = dist;
      }
    }

    this.currentInteractable = closest;
    if (closest) {
      this.interactPromptUI.setText(`${closest.text}\n(Нажми для открытия)`).setVisible(true);
    } else {
      this.interactPromptUI.setVisible(false);
    }
  }

  private repositionAltarElements(width: number, height: number) {
    const cx = width / 2;
    const cy = height / 2;

    if (this.heroOverlay && typeof this.heroOverlay.setDisplaySize === 'function') {
      this.heroOverlay.setDisplaySize(width * 2, height * 2).setPosition(cx, cy);
    }
    if (this.altarBg) {
      this.altarBg.setPosition(cx, cy);
    }

    // Reposition roster elements
    const cardOffsets = [-195, 0, 195];
    if (this.rosterCards && this.rosterCards.length === 3) {
      if (this.rosterGroup[0]) (this.rosterGroup[0] as Phaser.GameObjects.Text).setPosition(cx, cy - 180);
      if (this.rosterGroup[1]) (this.rosterGroup[1] as Phaser.GameObjects.Text).setPosition(cx + 305, cy - 180);

      this.rosterCards.forEach((c, idx) => {
        const cX = cx + cardOffsets[idx];
        const cY = cy + 18;
        if (c.bg) c.bg.setPosition(cX, cY);
        if (c.banner) c.banner.setPosition(cX, cY - 102);
        if (c.rarityText) c.rarityText.setPosition(cX, cY - 102);
        if (c.portrait) c.portrait.setPosition(cX, cY - 42);
        if (c.nameText) c.nameText.setPosition(cX, cY + 28);
        if (c.statsText) c.statsText.setPosition(cX, cY + 50);
        if (c.statusText) c.statusText.setPosition(cX, cY + 84);
      });
    }

    // Reposition detail elements (Hero Name top-left, Sprite & Pedestal center, 3 Separate Skill boxes, Skill selector buttons, Select button)
    if (this.detailGroup && this.detailGroup.length > 0) {
      const leftX = cx - 215;
      if (this.detailHeroName) this.detailHeroName.setPosition(leftX, cy - 135);
      if (this.detailHeroRarityBadgeBg) this.detailHeroRarityBadgeBg.setPosition(leftX, cy - 106);
      if (this.detailHeroRarity) this.detailHeroRarity.setPosition(leftX, cy - 106);
      if (this.detailHeroTitleBoxBg) this.detailHeroTitleBoxBg.setPosition(leftX, cy - 76);
      if (this.detailHeroTitle) this.detailHeroTitle.setPosition(leftX, cy - 76);
      if (this.detailHeroAttackBoxBg) this.detailHeroAttackBoxBg.setPosition(leftX, cy - 30);
      if (this.detailHeroAttackDesc) this.detailHeroAttackDesc.setPosition(leftX - 74, cy - 44);
      if (this.detailHeroStatsBoxBg) this.detailHeroStatsBoxBg.setPosition(leftX, cy + 22);
      if (this.detailHeroStats) this.detailHeroStats.setPosition(leftX, cy + 22);

      const heroCenterX = cx - 10;
      if (this.detailPedestalOuter) this.detailPedestalOuter.setPosition(heroCenterX, cy + 62);
      if (this.detailPedestal) this.detailPedestal.setPosition(heroCenterX, cy + 62);
      if (this.detailHeroSprite) this.detailHeroSprite.setPosition(heroCenterX, cy - 12);

      const rightColX = cx + 205;
      if (this.detailSkillNameBoxBg) this.detailSkillNameBoxBg.setPosition(rightColX - 32, cy - 134);
      if (this.detailSkillTitle) this.detailSkillTitle.setPosition(rightColX - 32, cy - 134);
      if (this.detailSkillCdBoxBg) this.detailSkillCdBoxBg.setPosition(rightColX + 70, cy - 134);
      if (this.detailSkillMeta) this.detailSkillMeta.setPosition(rightColX + 70, cy - 134);
      if (this.detailSkillDescBox) this.detailSkillDescBox.setPosition(rightColX + 5, cy - 78);
      if (this.detailSkillDesc) this.detailSkillDesc.setPosition(rightColX - 92, cy - 104);

      const sqYOffsets = [-16, 32, 80];
      this.detailSkillSquareButtons.forEach((sqBtn, i) => {
        const sqY = cy + sqYOffsets[i];
        if (sqBtn.bg) sqBtn.bg.setPosition(rightColX + 5, sqY);
        if (sqBtn.icon) sqBtn.icon.setPosition(rightColX - 75, sqY);
        if (sqBtn.label) sqBtn.label.setPosition(rightColX - 48, sqY);
      });

      if (this.detailSelectBtn) this.detailSelectBtn.setPosition(rightColX + 5, cy + 140);
      if (this.detailSelectText) this.detailSelectText.setPosition(rightColX + 5, cy + 140);
    }
  }

  private repositionLobbyElements(cx: number, cy: number) {
    if (this.lobbyOverlay) this.lobbyOverlay.setPosition(cx, cy);
    if (this.lobbyBg) this.lobbyBg.setPosition(cx, cy);
    if (this.lobbyTitle) this.lobbyTitle.setPosition(cx, cy - 175);
    if (this.lobbyBackBtn) this.lobbyBackBtn.setPosition(cx - 260, cy - 175);
    if (this.lobbyCloseBtn) this.lobbyCloseBtn.setPosition(cx + 275, cy - 175);

    // Root buttons [ ПВП ] & [ ПОДЗЕМЕЛЬЕ ]
    if (this.portalRootGroup && this.portalRootGroup.length === 6) {
      const rootPvpY = cy - 40;
      (this.portalRootGroup[0] as Phaser.GameObjects.Rectangle).setPosition(cx, rootPvpY);
      (this.portalRootGroup[1] as Phaser.GameObjects.Text).setPosition(cx, rootPvpY - 14);
      (this.portalRootGroup[2] as Phaser.GameObjects.Text).setPosition(cx, rootPvpY + 16);

      const rootDungY = cy + 60;
      (this.portalRootGroup[3] as Phaser.GameObjects.Rectangle).setPosition(cx, rootDungY);
      (this.portalRootGroup[4] as Phaser.GameObjects.Text).setPosition(cx, rootDungY - 14);
      (this.portalRootGroup[5] as Phaser.GameObjects.Text).setPosition(cx, rootDungY + 16);
    }

    // PVP modes [ ОБЫЧНЫЙ ] & [ РЕЙТИНГОВЫЙ ]
    if (this.pvpModesGroup && this.pvpModesGroup.length === 6) {
      const casualY = cy - 40;
      (this.pvpModesGroup[0] as Phaser.GameObjects.Rectangle).setPosition(cx, casualY);
      (this.pvpModesGroup[1] as Phaser.GameObjects.Text).setPosition(cx, casualY - 14);
      (this.pvpModesGroup[2] as Phaser.GameObjects.Text).setPosition(cx, casualY + 16);

      const rankedY = cy + 60;
      (this.pvpModesGroup[3] as Phaser.GameObjects.Rectangle).setPosition(cx, rankedY);
      (this.pvpModesGroup[4] as Phaser.GameObjects.Text).setPosition(cx, rankedY - 14);
      (this.pvpModesGroup[5] as Phaser.GameObjects.Text).setPosition(cx, rankedY + 16);
    }

    // Dungeon modes [ СОЛО ] & [ ОНЛАЙН ]
    if (this.dungeonModesGroup && this.dungeonModesGroup.length === 6) {
      const soloY = cy - 40;
      (this.dungeonModesGroup[0] as Phaser.GameObjects.Rectangle).setPosition(cx, soloY);
      (this.dungeonModesGroup[1] as Phaser.GameObjects.Text).setPosition(cx, soloY - 14);
      (this.dungeonModesGroup[2] as Phaser.GameObjects.Text).setPosition(cx, soloY + 16);

      const onlineY = cy + 60;
      (this.dungeonModesGroup[3] as Phaser.GameObjects.Rectangle).setPosition(cx, onlineY);
      (this.dungeonModesGroup[4] as Phaser.GameObjects.Text).setPosition(cx, onlineY - 14);
      (this.dungeonModesGroup[5] as Phaser.GameObjects.Text).setPosition(cx, onlineY + 16);
    }

    // Dungeon online choice [ СОЗДАТЬ ] & [ ВОЙТИ ]
    if (this.dungeonOnlineChoiceGroup && this.dungeonOnlineChoiceGroup.length === 6) {
      const createY = cy - 40;
      (this.dungeonOnlineChoiceGroup[0] as Phaser.GameObjects.Rectangle).setPosition(cx, createY);
      (this.dungeonOnlineChoiceGroup[1] as Phaser.GameObjects.Text).setPosition(cx, createY - 14);
      (this.dungeonOnlineChoiceGroup[2] as Phaser.GameObjects.Text).setPosition(cx, createY + 16);

      const joinY = cy + 60;
      (this.dungeonOnlineChoiceGroup[3] as Phaser.GameObjects.Rectangle).setPosition(cx, joinY);
      (this.dungeonOnlineChoiceGroup[4] as Phaser.GameObjects.Text).setPosition(cx, joinY - 14);
      (this.dungeonOnlineChoiceGroup[5] as Phaser.GameObjects.Text).setPosition(cx, joinY + 16);
    }

    // Dungeon create view
    if (this.dungeonCreateGroup && this.dungeonCreateGroup.length >= 8) {
      (this.dungeonCreateGroup[0] as Phaser.GameObjects.Rectangle).setPosition(cx, cy);
      if (this.roomNameDisplay) this.roomNameDisplay.setPosition(cx, cy - 90);
      if (this.roomPassDisplay) this.roomPassDisplay.setPosition(cx, cy - 45);
      (this.dungeonCreateGroup[3] as Phaser.GameObjects.Rectangle).setPosition(cx - 110, cy + 15);
      (this.dungeonCreateGroup[4] as Phaser.GameObjects.Text).setPosition(cx - 110, cy + 15);
      if (this.personalCodeDisplay) this.personalCodeDisplay.setPosition(cx + 120, cy + 15);
      (this.dungeonCreateGroup[6] as Phaser.GameObjects.Rectangle).setPosition(cx, cy + 85);
      (this.dungeonCreateGroup[7] as Phaser.GameObjects.Text).setPosition(cx, cy + 85);
    }

    // Ranked group
    if (this.rankedGroup && this.rankedGroup.length >= 7) {
      (this.rankedGroup[0] as Phaser.GameObjects.Image).setPosition(cx, cy - 90);
      (this.rankedGroup[1] as Phaser.GameObjects.Text).setPosition(cx, cy - 45);
      (this.rankedGroup[2] as Phaser.GameObjects.Text).setPosition(cx, cy - 15);
      (this.rankedGroup[3] as Phaser.GameObjects.Rectangle).setPosition(cx - 100, cy + 55);
      (this.rankedGroup[4] as Phaser.GameObjects.Text).setPosition(cx - 100, cy + 55);
      (this.rankedGroup[5] as Phaser.GameObjects.Rectangle).setPosition(cx + 100, cy + 55);
      (this.rankedGroup[6] as Phaser.GameObjects.Text).setPosition(cx + 100, cy + 55);
    }

    // Casual group
    if (this.casualGroup && this.casualGroup.length >= 6) {
      (this.casualGroup[0] as Phaser.GameObjects.Rectangle).setPosition(cx, cy - 35);
      for (let i = 0; i < 3; i++) {
        if (this.serverLabels[i]) {
          this.serverLabels[i].setPosition(cx - 230, cy - 85 + i * 42);
        }
      }
      (this.casualGroup[4] as Phaser.GameObjects.Rectangle).setPosition(cx - 130, cy + 75);
      (this.casualGroup[5] as Phaser.GameObjects.Text).setPosition(cx - 130, cy + 75);
      if (this.casualGroup[6]) (this.casualGroup[6] as Phaser.GameObjects.Rectangle).setPosition(cx + 130, cy + 75);
      if (this.casualGroup[7]) (this.casualGroup[7] as Phaser.GameObjects.Text).setPosition(cx + 130, cy + 75);
    }

    // Search group
    if (this.searchGroup && this.searchGroup.length >= 3) {
      (this.searchGroup[0] as Phaser.GameObjects.Text).setPosition(cx, cy - 20);
      (this.searchGroup[1] as Phaser.GameObjects.Rectangle).setPosition(cx, cy + 50);
      (this.searchGroup[2] as Phaser.GameObjects.Text).setPosition(cx, cy + 50);
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    const width = gameSize.width;
    const height = gameSize.height;

    this.repositionAltarElements(width, height);
    this.repositionLobbyElements(width / 2, height / 2);

    if (this.interactPromptUI) {
      this.interactPromptUI.setPosition(width / 2, height - 35);
    }

    // Reposition and scale controls & combat buttons cleanly
    this.positionCombatUI(width, height);

    // Minimap position
    if (this.minimapContainer) {
      this.minimapContainer.setPosition(width - 80, 80);
    }
  }
}
