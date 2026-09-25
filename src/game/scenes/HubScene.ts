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

  // Minimap
  private minimapCamera!: Phaser.Cameras.Scene2D.Camera;
  private minimapBorder!: Phaser.GameObjects.Graphics;

  // Mobile Controls (Native Virtual Joystick)
  private isPC = false;
  private joyStickBase!: Phaser.GameObjects.Arc;
  private joyStickThumb!: Phaser.GameObjects.Arc;
  private joyStickPointerId: number | null = null;
  private joyStickVector = new Phaser.Math.Vector2(0, 0);
  private joyStickOrigin = new Phaser.Math.Vector2(0, 0);

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
    portrait: Phaser.GameObjects.Image;
    key: string;
    statusText: Phaser.GameObjects.Text;
  }> = [];

  // View 2 (Detail View)
  private detailGroup: Phaser.GameObjects.GameObject[] = [];
  private detailHeroSprite!: Phaser.GameObjects.Image;
  private detailHeroName!: Phaser.GameObjects.Text;
  private detailSkillButtons: Array<{
    bg: Phaser.GameObjects.Rectangle;
    icon: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
  }> = [];
  private detailCardBox!: Phaser.GameObjects.Rectangle;
  private detailSkillTitle!: Phaser.GameObjects.Text;
  private detailSkillMeta!: Phaser.GameObjects.Text;
  private detailSkillDesc!: Phaser.GameObjects.Text;
  private detailSelectBtn!: Phaser.GameObjects.Rectangle;
  private detailSelectText!: Phaser.GameObjects.Text;
  private currentDetailSkillIndex = 0;

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
    this.cameras.main.setZoom(1);
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

    if (this.minimapCamera) {
      const uiToIgnore: Phaser.GameObjects.GameObject[] = [
        this.heroOverlay,
        this.altarBg,
        ...(this.rosterGroup || []),
        ...(this.detailGroup || []),
        ...(this.lobbyBaseGroup || []),
        ...(this.portalRootGroup || []),
        ...(this.pvpModesGroup || []),
        ...(this.dungeonModesGroup || []),
        ...(this.dungeonOnlineChoiceGroup || []),
        ...(this.dungeonCreateGroup || []),
        ...(this.dungeonServersGroup || []),
        ...(this.rankedGroup || []),
        ...(this.casualGroup || []),
        ...(this.searchGroup || []),
        this.interactPromptUI,
        this.joyStickBase,
        this.joyStickThumb,
        exitBtn,
        fsBtn,
        ...(this.combatElements || [])
      ].filter(Boolean);
      this.minimapCamera.ignore(uiToIgnore);
    }

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

    // Resize listener
    this.scale.on('resize', this.handleResize, this);
  }

  // --- MINIMAP ---
  private createMinimap(width: number) {
    const miniRadius = 54;
    const miniX = width - miniRadius - 20;
    const miniY = miniRadius + 20;

    this.minimapCamera = this.cameras.add(miniX - miniRadius, miniY - miniRadius, miniRadius * 2, miniRadius * 2)
      .setZoom(0.12)
      .setName('minimap');
    this.minimapCamera.setBackgroundColor(0x09100d);
    this.minimapCamera.startFollow(this.player);

    const maskGfx = this.make.graphics({});
    maskGfx.fillCircle(miniX, miniY, miniRadius);
    this.minimapCamera.setMask(maskGfx.createGeometryMask());

    this.minimapBorder = this.add.graphics().setScrollFactor(0).setDepth(299);
    this.minimapBorder.lineStyle(3, 0x4ade80);
    this.minimapBorder.strokeCircle(miniX, miniY, miniRadius);
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

    // Multi-touch tracking for joystick on left side of screen
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isHeroMenuOpen || this.isLobbyOpen) return;
      if (pointer.x < width * 0.42 && pointer.y > height * 0.4) {
        this.joyStickPointerId = pointer.id;
        this.updateJoystick(pointer);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.joyStickPointerId) {
        this.updateJoystick(pointer);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.joyStickPointerId) {
        this.joyStickPointerId = null;
        this.joyStickVector.set(0, 0);
        this.joyStickThumb.setPosition(this.joyStickOrigin.x, this.joyStickOrigin.y);
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

  // --- COMBAT UI ---
  private setupCombatUI(width: number, height: number) {
    // Attack Button (Large, prominent)
    this.btnAttack = this.add.circle(0, 0, 56, 0xdc2626, 0.9)
      .setScrollFactor(0).setDepth(300).setStrokeStyle(3, 0xfca5a5).setInteractive();
    this.txtAttack = this.add.text(0, 0, 'АТАКА\n[SPACE]', {
      fontSize: '13px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    this.cdAttackOverlay = this.add.circle(0, 0, 56, 0x000000, 0.65)
      .setScrollFactor(0).setDepth(302).setVisible(false);

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

    // Main Modal Frame (Landscape 760 x 460)
    this.altarBg = this.add.rectangle(cx, cy, 760, 460, 0x111827)
      .setStrokeStyle(4, 0x38bdf8)
      .setScrollFactor(0).setDepth(501).setVisible(false);

    // ==========================================
    // 1. ROSTER VIEW (PIXEL CHARACTERS ONLY)
    // ==========================================
    const rosterTitle = this.add.text(cx, cy - 185, '✦ ВЫБОР БОЙЦА ✦', {
      fontSize: '22px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#f0f9ff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(502).setVisible(false);

    const rosterCloseBtn = this.add.text(cx + 345, cy - 188, '[X]', {
      fontSize: '22px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#f87171'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    rosterCloseBtn.on('pointerdown', () => {
      soundEngine.playClick();
      this.closeHeroMenu();
    });

    this.rosterGroup = [rosterTitle, rosterCloseBtn];
    this.rosterCards = [];

    const heroKeys = ['char_zaza', 'char_grim', 'char_bjorn'];
    const cardOffsets = [-225, 0, 225];

    heroKeys.forEach((key, idx) => {
      const hero = HEROES[key];
      const cardX = cx + cardOffsets[idx];
      const cardY = cy + 22;

      const cardBg = this.add.rectangle(cardX, cardY, 210, 280, 0x1f2937)
        .setStrokeStyle(3, hero.color)
        .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

      // Authentic pixel art character standing on altar
      const charSprite = this.add.image(cardX, cardY - 45, hero.texture)
        .setScale(2.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

      this.tweens.add({
        targets: charSprite,
        y: '-=6',
        duration: 750 + idx * 80,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      const name = this.add.text(cardX, cardY + 45, hero.name, {
        fontSize: '18px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

      const statusText = this.add.text(cardX, cardY + 95, key === this.selectedHeroKey ? '[ ТЕКУЩИЙ ✓ ]' : '[ ВЫБРАТЬ ]', {
        fontSize: '14px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: key === this.selectedHeroKey ? '#4ade80' : '#38bdf8',
        backgroundColor: '#111827',
        padding: { x: 14, y: 6 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

      const onCardClick = () => {
        soundEngine.playClick();
        this.openHeroDetailView(key);
      };

      cardBg.on('pointerdown', onCardClick);
      charSprite.on('pointerdown', onCardClick);
      name.on('pointerdown', onCardClick);
      statusText.on('pointerdown', onCardClick);

      cardBg.on('pointerover', () => cardBg.setStrokeStyle(3, 0xfef08a));
      cardBg.on('pointerout', () => cardBg.setStrokeStyle(3, hero.color));

      this.rosterCards.push({ bg: cardBg, portrait: charSprite, key, statusText });
      this.rosterGroup.push(cardBg, charSprite, name, statusText);
    });

    // =========================================================================
    // 2. DETAIL VIEW:
    //    LEFT: Hero Showcase (Standing Sprite, Name, [ ВЫБРАТЬ ЭТОГО БОЙЦА ])
    //    RIGHT: 3 SKILL BUTTONS ON TOP-RIGHT + CLEAN DESCRIPTION BOX
    // =========================================================================
    const detailBackBtn = this.add.text(cx - 240, cy - 195, '< К СПИСКУ ГЕРОЕВ', {
      fontSize: '14px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#facc15',
      backgroundColor: '#1f2937',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    detailBackBtn.on('pointerdown', () => {
      soundEngine.playClick();
      this.showRosterView();
    });

    const detailCloseBtn = this.add.text(cx + 345, cy - 195, '[X]', {
      fontSize: '22px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#f87171'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    detailCloseBtn.on('pointerdown', () => {
      soundEngine.playClick();
      this.closeHeroMenu();
    });

    // Left Column: Hero Showcase
    const heroLeftX = cx - 180;

    this.detailHeroSprite = this.add.image(heroLeftX, cy - 35, 'char_zaza')
      .setScale(3.2).setScrollFactor(0).setDepth(503).setVisible(false);

    this.tweens.add({
      targets: this.detailHeroSprite,
      y: '-=8',
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.detailHeroName = this.add.text(heroLeftX, cy + 80, 'ZAZA', {
      fontSize: '24px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setVisible(false);

    this.detailSelectBtn = this.add.rectangle(heroLeftX, cy + 140, 260, 48, 0x16a34a)
      .setStrokeStyle(3, 0x86efac)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    this.detailSelectText = this.add.text(heroLeftX, cy + 140, '[ ВЫБРАТЬ БОЙЦА ]', {
      fontSize: '16px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const onSelectClick = () => {
      this.applySelectedHero();
    };
    this.detailSelectBtn.on('pointerdown', onSelectClick);
    this.detailSelectText.on('pointerdown', onSelectClick);

    // Right Column: 3 Skill Buttons in Top-Right Corner + Skill Info Box
    const skillsRightX = cx + 175;
    this.detailSkillButtons = [];

    const skillLabels = ['[ 1. НАВЫК ]', '[ 2. НАВЫК ]', '[ ★ УЛЬТА ]'];
    const btnWidth = 110;
    const btnSpacing = 116;

    for (let i = 0; i < 3; i++) {
      const btnX = skillsRightX - 116 + i * btnSpacing;
      const btnY = cy - 130;

      const sBtnBg = this.add.rectangle(btnX, btnY, btnWidth, 42, 0x1f2937)
        .setStrokeStyle(2, i === 0 ? 0x4ade80 : 0x475569)
        .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

      const sIcon = this.add.image(btnX - 34, btnY, 'skill_zaza_1')
        .setScale(1.1).setScrollFactor(0).setDepth(503).setVisible(false);

      const sLabel = this.add.text(btnX + 12, btnY, skillLabels[i], {
        fontSize: '12px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: i === 0 ? '#4ade80' : '#ffffff'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setVisible(false);

      const onSkillBtnClick = () => {
        soundEngine.playClick();
        this.selectDetailSkill(i);
      };

      sBtnBg.on('pointerdown', onSkillBtnClick);

      this.detailSkillButtons.push({ bg: sBtnBg, icon: sIcon, label: sLabel });
      this.detailGroup.push(sBtnBg, sIcon, sLabel);
    }

    // Prominent Single Skill Description Card Below Buttons
    this.detailCardBox = this.add.rectangle(skillsRightX, cy + 25, 360, 210, 0x1e293b)
      .setStrokeStyle(3, 0x38bdf8)
      .setScrollFactor(0).setDepth(502).setVisible(false);

    this.detailSkillTitle = this.add.text(skillsRightX - 160, cy - 55, 'ПЛЕВОК СЛИЗЬЮ', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#4ade80'
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(503).setVisible(false);

    this.detailSkillMeta = this.add.text(skillsRightX + 160, cy - 55, '[ КД: 3.0с ]', {
      fontSize: '13px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#fbbf24'
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(503).setVisible(false);

    this.detailSkillDesc = this.add.text(skillsRightX - 160, cy - 30, 'Описание способности...', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#e2e8f0',
      lineSpacing: 5,
      wordWrap: { width: 320 }
    }).setOrigin(0, 0).setScrollFactor(0).setDepth(503).setVisible(false);

    this.detailGroup.push(
      detailBackBtn,
      detailCloseBtn,
      this.detailHeroSprite,
      this.detailHeroName,
      this.detailSelectBtn,
      this.detailSelectText,
      this.detailCardBox,
      this.detailSkillTitle,
      this.detailSkillMeta,
      this.detailSkillDesc
    );
  }

  private openHeroMenu() {
    this.isHeroMenuOpen = true;
    this.player.setVelocity(0, 0);
    this.interactPromptUI.setVisible(false);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const cx = width / 2;
    const cy = height / 2;

    this.heroOverlay.setPosition(cx, cy).setSize(width * 2, height * 2).setVisible(true);
    this.altarBg.setPosition(cx, cy).setVisible(true);
    this.repositionAltarElements(width, height);
    this.showRosterView();

    this.minimapCamera.setVisible(false);
    this.minimapBorder.setVisible(false);
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

    this.minimapCamera.setVisible(true);
    this.minimapBorder.setVisible(true);
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
      c.statusText.setText(isEquipped ? '[ ТЕКУЩИЙ ✓ ]' : '[ ВЫБРАТЬ ]');
      c.statusText.setColor(isEquipped ? '#4ade80' : '#38bdf8');
    });

    this.rosterGroup.forEach(obj => (obj as unknown as { setVisible: (v: boolean) => void }).setVisible(true));
  }

  private openHeroDetailView(heroKey: string) {
    this.tempHeroKey = heroKey;
    const hero = HEROES[heroKey];

    this.rosterGroup.forEach(obj => (obj as unknown as { setVisible: (v: boolean) => void }).setVisible(false));

    // Show actual character sprite in large authentic pixel form
    this.tweens.killTweensOf(this.detailHeroSprite);
    this.detailHeroSprite.setTexture(hero.texture).setScale(3.2).setAngle(0);
    this.tweens.add({
      targets: this.detailHeroSprite,
      scaleY: 3.4,
      scaleX: 3.25,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.detailHeroName.setText(hero.name).setColor('#ffffff');

    // Update 3 skill button icons & active state
    hero.skills.forEach((skill, idx) => {
      const btn = this.detailSkillButtons[idx];
      btn.icon.setTexture(skill.icon);
    });

    // Select skill 0 by default
    this.selectDetailSkill(0);

    // Update select button state
    const isAlreadyEquipped = this.selectedHeroKey === this.tempHeroKey;
    if (isAlreadyEquipped) {
      this.detailSelectBtn.setFillStyle(0x374151).setStrokeStyle(2, 0x94a3b8);
      this.detailSelectText.setText('[ ТЕКУЩИЙ БОЕЦ ✓ ]').setColor('#94a3b8');
    } else {
      this.detailSelectBtn.setFillStyle(0x16a34a).setStrokeStyle(3, 0x86efac);
      this.detailSelectText.setText('[ ВЫБРАТЬ ЭТОГО БОЙЦА ]').setColor('#ffffff');
    }

    this.detailGroup.forEach(obj => (obj as unknown as { setVisible: (v: boolean) => void }).setVisible(true));
  }

  private selectDetailSkill(index: number) {
    this.currentDetailSkillIndex = index;
    const hero = HEROES[this.tempHeroKey];
    if (!hero) return;

    this.detailSkillButtons.forEach((btn, i) => {
      const isSelected = i === index;
      btn.bg.setStrokeStyle(2, isSelected ? 0x4ade80 : 0x475569);
      btn.bg.setFillStyle(isSelected ? 0x1e3a8a : 0x1f2937);
      btn.label.setColor(isSelected ? '#4ade80' : '#ffffff');
    });

    const skill = hero.skills[index];
    if (skill) {
      this.detailSkillTitle.setText(skill.name.toUpperCase());
      this.detailSkillMeta.setText(`[ КД: ${skill.cooldown}с ] • ${skill.type}`);
      this.detailSkillDesc.setText(skill.desc);
    }
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

    // Window Frame (640 x 440)
    this.lobbyBg = this.add.rectangle(cx, cy, 640, 440, 0x18181b)
      .setStrokeStyle(4, 0xef4444)
      .setScrollFactor(0).setDepth(501).setVisible(false);

    // Title
    this.lobbyTitle = this.add.text(cx, cy - 175, '✦ ПОРТАЛ ПРИКЛЮЧЕНИЙ ✦', {
      fontSize: '22px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(502).setVisible(false);

    // Back Button
    this.lobbyBackBtn = this.add.text(cx - 260, cy - 175, '< НАЗАД', {
      fontSize: '15px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#facc15',
      backgroundColor: '#3f3f46',
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
    const btnRootPvpBg = this.add.rectangle(cx, rootPvpY, 480, 80, 0x1e293b)
      .setStrokeStyle(3, 0x38bdf8)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnRootPvpTitle = this.add.text(cx, rootPvpY - 14, '[ ⚔️ ПВП АРЕНА ]', {
      fontSize: '21px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#38bdf8'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnRootPvpDesc = this.add.text(cx, rootPvpY + 16, 'Обычные матчи • Рейтинговая лига • Битва за кубки', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#94a3b8'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const triggerRootPvp = () => {
      soundEngine.playClick();
      this.showPvPModes();
    };
    btnRootPvpBg.on('pointerdown', triggerRootPvp);
    btnRootPvpTitle.on('pointerdown', triggerRootPvp);
    btnRootPvpDesc.on('pointerdown', triggerRootPvp);

    btnRootPvpBg.on('pointerover', () => {
      btnRootPvpBg.setStrokeStyle(3, 0x7dd3fc).setFillStyle(0x334155);
      btnRootPvpTitle.setColor('#7dd3fc');
    });
    btnRootPvpBg.on('pointerout', () => {
      btnRootPvpBg.setStrokeStyle(3, 0x38bdf8).setFillStyle(0x1e293b);
      btnRootPvpTitle.setColor('#38bdf8');
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
    const btnCasualBg = this.add.rectangle(cx, casualY, 460, 78, 0x27272a)
      .setStrokeStyle(3, 0x38bdf8)
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
    const btnSoloBg = this.add.rectangle(cx, soloY, 460, 78, 0x1e3a8a)
      .setStrokeStyle(3, 0x60a5fa)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnSoloTitle = this.add.text(cx, soloY - 14, '[ 🛡️ СОЛО РЕЖИМ ]', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#93c5fd'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnSoloDesc = this.add.text(cx, soloY + 16, 'Одиночный поход • Случайная генерация • Испытание героя', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#bfdbfe'
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
    const btnCreateChoiceBg = this.add.rectangle(cx, createChoiceY, 460, 78, 0x1e293b)
      .setStrokeStyle(3, 0x38bdf8)
      .setScrollFactor(0).setDepth(502).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnCreateChoiceTitle = this.add.text(cx, createChoiceY - 14, '[ ➕ СОЗДАТЬ КОМНАТУ ]', {
      fontSize: '20px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#38bdf8'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true }).setVisible(false);

    const btnCreateChoiceDesc = this.add.text(cx, createChoiceY + 16, 'Задать имя, пароль и создать персональный код для друзей', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#94a3b8'
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
    const createBox = this.add.rectangle(cx, cy, 520, 260, 0x18181b)
      .setStrokeStyle(2, 0x38bdf8)
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
      .setStrokeStyle(2, 0x52525b)
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
        .setStrokeStyle(1, 0x38bdf8)
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

    this.lobbyOverlay.setPosition(cx, cy).setSize(width * 2, height * 2).setVisible(true);
    this.lobbyBg.setPosition(cx, cy).setVisible(true);
    this.lobbyTitle.setPosition(cx, cy - 175).setVisible(true);
    this.lobbyCloseBtn.setPosition(cx + 275, cy - 175).setVisible(true);

    this.showPortalRoot();

    this.minimapCamera.setVisible(false);
    this.minimapBorder.setVisible(false);
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

    this.minimapCamera.setVisible(true);
    this.minimapBorder.setVisible(true);
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
          soundEngine.playWhirlwind();
          this.tweens.add({
            targets: this.player,
            x: this.player.x + dir * 160,
            duration: 200,
            ease: 'Power2'
          });
          this.dealDamageInArea(this.player.x + dir * 80, this.player.y, 65, 150);
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

    if (this.heroOverlay) {
      this.heroOverlay.setSize(width * 2, height * 2).setPosition(cx, cy);
    }
    if (this.altarBg) {
      this.altarBg.setPosition(cx, cy);
    }

    // Reposition roster elements
    const cardOffsets = [-225, 0, 225];
    if (this.rosterCards && this.rosterCards.length === 3) {
      if (this.rosterGroup[0]) (this.rosterGroup[0] as Phaser.GameObjects.Text).setPosition(cx, cy - 185);
      if (this.rosterGroup[1]) (this.rosterGroup[1] as Phaser.GameObjects.Text).setPosition(cx + 345, cy - 188);

      this.rosterCards.forEach((c, idx) => {
        const cX = cx + cardOffsets[idx];
        const cY = cy + 22;
        if (c.bg) c.bg.setPosition(cX, cY);
        if (c.portrait) c.portrait.setPosition(cX, cY - 45);
        if (c.statusText) c.statusText.setPosition(cX, cY + 95);
      });
    }

    // Reposition detail elements (Hero showcase on left, 3 skills and info box on right)
    if (this.detailGroup && this.detailGroup.length > 0) {
      const backBtn = this.detailGroup[0] as Phaser.GameObjects.Text;
      const closeBtn = this.detailGroup[1] as Phaser.GameObjects.Text;

      if (backBtn) backBtn.setPosition(cx - 240, cy - 195);
      if (closeBtn) closeBtn.setPosition(cx + 345, cy - 195);

      const heroLeftX = cx - 180;
      if (this.detailHeroSprite) this.detailHeroSprite.setPosition(heroLeftX, cy - 35);
      if (this.detailHeroName) this.detailHeroName.setPosition(heroLeftX, cy + 80);
      if (this.detailSelectBtn) this.detailSelectBtn.setPosition(heroLeftX, cy + 140);
      if (this.detailSelectText) this.detailSelectText.setPosition(heroLeftX, cy + 140);

      const skillsRightX = cx + 175;
      const btnSpacing = 116;
      this.detailSkillButtons.forEach((btn, i) => {
        const btnX = skillsRightX - 116 + i * btnSpacing;
        const btnY = cy - 130;
        if (btn.bg) btn.bg.setPosition(btnX, btnY);
        if (btn.icon) btn.icon.setPosition(btnX - 34, btnY);
        if (btn.label) btn.label.setPosition(btnX + 12, btnY);
      });

      if (this.detailCardBox) this.detailCardBox.setPosition(skillsRightX, cy + 25);
      if (this.detailSkillTitle) this.detailSkillTitle.setPosition(skillsRightX - 160, cy - 55);
      if (this.detailSkillMeta) this.detailSkillMeta.setPosition(skillsRightX + 160, cy - 55);
      if (this.detailSkillDesc) this.detailSkillDesc.setPosition(skillsRightX - 160, cy - 30);
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

    this.interactPromptUI.setPosition(width / 2, height - 35);

    // Reposition and scale controls & combat buttons cleanly
    this.positionCombatUI(width, height);

    // Minimap
    const miniRadius = Math.min(52, Math.max(36, Math.round(Math.min(width, height) * 0.1)));
    const miniX = width - miniRadius - 16;
    const miniY = miniRadius + 16;
    if (this.minimapCamera) {
      this.minimapCamera.setPosition(miniX - miniRadius, miniY - miniRadius);
      this.minimapCamera.setSize(miniRadius * 2, miniRadius * 2);
    }
    if (this.minimapBorder) {
      this.minimapBorder.clear();
      this.minimapBorder.lineStyle(3, 0x4ade80);
      this.minimapBorder.strokeCircle(miniX, miniY, miniRadius);
    }
  }
}
