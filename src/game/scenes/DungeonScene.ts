/**
 * Frantic Battles - Soul Knight Style Procedural Multi-Floor Dungeon Scene
 * Features:
 * - 7 Dungeon Floors (1/7 to 7/7) with increasing difficulty
 * - Procedural 2D connected rooms layout with corridors (not a straight line!)
 * - Soul Knight style Minimap with unvisited fog of war, visited rooms, and icons (Shop, Companion, Portal, Combat, Boss)
 * - Companion / Pet system (Knight mercenary, Combat Dog, Guardian Bear) hired for gold
 * - Shop Room with Trader selling Potions, Relics, and Hero Class Weapons
 * - Class-specific weapons matching heroes with dynamic weapon rendering on player sprite
 * - Upgrade Cards selection at 2/7 (after floor 1), 4/7 (after floor 3), and 7/7 (after floor 6)
 * - Fixed enemy HP bars attached directly to mob sprites with advanced AI
 * - Floor 7 Boss Arena: "Cursed Knight" with Telegraph Dash, 12-Projectile Death Ring, and Triple Greatsword Slash!
 */

import Phaser from 'phaser';
import { HEROES, HeroData } from '../players';
import { soundEngine } from '../audio';
import { generateAllTextures } from '../pixelArt';

export interface DungeonWeapon {
  id: string;
  name: string;
  icon: string;
  texture: string;
  heroClass: 'char_zaza' | 'char_grim' | 'char_bjorn' | 'all';
  damage: number;
  attackSpeed: number; // ms cooldown
  rangeType: 'melee_fast' | 'melee_heavy_aoe' | 'ranged_single' | 'ranged_double' | 'ranged_explosive';
  energyCost: number;
  desc: string;
}

export const CLASS_WEAPONS: Record<string, DungeonWeapon> = {
  // Zaza Weapons
  weapon_stick: {
    id: 'weapon_stick',
    name: 'Посох мутанта',
    icon: 'weapon_stick',
    texture: 'weapon_stick',
    heroClass: 'char_zaza',
    damage: 26,
    attackSpeed: 280,
    rangeType: 'melee_fast',
    energyCost: 0,
    desc: 'Базовое оружие Зазы: быстрые токсичные удары посохом.'
  },
  weapon_scythe: {
    id: 'weapon_scythe',
    name: 'Чумная коса',
    icon: 'weapon_scythe',
    texture: 'weapon_scythe',
    heroClass: 'char_zaza',
    damage: 48,
    attackSpeed: 500,
    rangeType: 'melee_heavy_aoe',
    energyCost: 5,
    desc: 'Размашистый удар косой, отравляющий врагов ядом.'
  },
  weapon_claws: {
    id: 'weapon_claws',
    name: 'Когти мутанта',
    icon: 'weapon_claws',
    texture: 'weapon_claws',
    heroClass: 'char_zaza',
    damage: 32,
    attackSpeed: 220,
    rangeType: 'melee_fast',
    energyCost: 0,
    desc: 'Сверхбыстрые яростные царапающие удары когтями.'
  },

  // Grim Weapons
  weapon_flask_launcher: {
    id: 'weapon_flask_launcher',
    name: 'Алхимический флакон',
    icon: 'weapon_flask_launcher',
    texture: 'weapon_flask_launcher',
    heroClass: 'char_grim',
    damage: 38,
    attackSpeed: 400,
    rangeType: 'ranged_explosive',
    energyCost: 6,
    desc: 'Базовое оружие Грима: бросок взрывных токсичных флаконов!'
  },
  weapon_crossbow: {
    id: 'weapon_crossbow',
    name: 'Охотничий арбалет',
    icon: 'weapon_crossbow',
    texture: 'weapon_crossbow',
    heroClass: 'char_grim',
    damage: 30,
    attackSpeed: 300,
    rangeType: 'ranged_single',
    energyCost: 8,
    desc: 'Точная стрельба дальнобойными стрелами.'
  },
  weapon_pistols: {
    id: 'weapon_pistols',
    name: 'Двойные пистоли',
    icon: 'weapon_pistols',
    texture: 'weapon_pistols',
    heroClass: 'char_grim',
    damage: 22,
    attackSpeed: 340,
    rangeType: 'ranged_double',
    energyCost: 12,
    desc: 'Быстрый сдвоенный выстрел 2 пулями подряд!'
  },

  // Bjorn Weapons
  weapon_battleaxe: {
    id: 'weapon_battleaxe',
    name: 'Боевой топор',
    icon: 'weapon_battleaxe',
    texture: 'weapon_battleaxe',
    heroClass: 'char_bjorn',
    damage: 54,
    attackSpeed: 440,
    rangeType: 'melee_heavy_aoe',
    energyCost: 0,
    desc: 'Базовое оружие Бьорна: широкий сокрушительный размах секирой.'
  },
  weapon_mace: {
    id: 'weapon_mace',
    name: 'Тяжелая булава',
    icon: 'weapon_mace',
    texture: 'weapon_mace',
    heroClass: 'char_bjorn',
    damage: 62,
    attackSpeed: 560,
    rangeType: 'melee_heavy_aoe',
    energyCost: 0,
    desc: 'Сокрушительный размах на 180 градусов (АОЕ урон).'
  },
  weapon_thunder_hammer: {
    id: 'weapon_thunder_hammer',
    name: 'Молот Тора',
    icon: 'weapon_thunder_hammer',
    texture: 'weapon_thunder_hammer',
    heroClass: 'char_bjorn',
    damage: 80,
    attackSpeed: 700,
    rangeType: 'melee_heavy_aoe',
    energyCost: 10,
    desc: 'Удар молнии о землю с электрической ударной волной!'
  },

  // 2 New Weapons for Zaza
  weapon_toxic_staff: {
    id: 'weapon_toxic_staff',
    name: 'Чумной посох',
    icon: 'weapon_toxic_staff',
    texture: 'weapon_toxic_staff',
    heroClass: 'char_zaza',
    damage: 42,
    attackSpeed: 360,
    rangeType: 'ranged_single',
    energyCost: 7,
    desc: 'Спец-навык: выпускает дальнобойные самонаводящиеся споры скверны.'
  },
  weapon_mutant_blade: {
    id: 'weapon_mutant_blade',
    name: 'Клинок скверны',
    icon: 'weapon_mutant_blade',
    texture: 'weapon_mutant_blade',
    heroClass: 'char_zaza',
    damage: 52,
    attackSpeed: 290,
    rangeType: 'melee_fast',
    energyCost: 4,
    desc: 'Спец-навык: ядовитые комбо-удары, оставляющие едкие ожоги.'
  },

  // 2 New Weapons for Grim
  weapon_repeater_crossbow: {
    id: 'weapon_repeater_crossbow',
    name: 'Многозарядный арбалет',
    icon: 'weapon_repeater_crossbow',
    texture: 'weapon_repeater_crossbow',
    heroClass: 'char_grim',
    damage: 28,
    attackSpeed: 260,
    rangeType: 'ranged_double',
    energyCost: 10,
    desc: 'Спец-навык: скоростной веер из 3 стрел подряд.'
  },
  weapon_grenade_launcher: {
    id: 'weapon_grenade_launcher',
    name: 'Гранатомет теней',
    icon: 'weapon_grenade_launcher',
    texture: 'weapon_grenade_launcher',
    heroClass: 'char_grim',
    damage: 60,
    attackSpeed: 520,
    rangeType: 'ranged_explosive',
    energyCost: 16,
    desc: 'Спец-навык: запускает разрывные гранаты с огромным радиусом взрыва.'
  },

  // 2 New Weapons for Bjorn
  weapon_frost_hammer: {
    id: 'weapon_frost_hammer',
    name: 'Ледяной сокрушитель',
    icon: 'weapon_frost_hammer',
    texture: 'weapon_frost_hammer',
    heroClass: 'char_bjorn',
    damage: 75,
    attackSpeed: 620,
    rangeType: 'melee_heavy_aoe',
    energyCost: 8,
    desc: 'Спец-навык: удар льда, замедляющий и замораживающий противников.'
  },
  weapon_dual_daggers: {
    id: 'weapon_dual_daggers',
    name: 'Парные секиры',
    icon: 'weapon_dual_daggers',
    texture: 'weapon_dual_daggers',
    heroClass: 'char_bjorn',
    damage: 46,
    attackSpeed: 240,
    rangeType: 'melee_fast',
    energyCost: 0,
    desc: 'Спец-навык: сверхбыстрая серия рубящих ударов с двух рук.'
  }
};

export interface UpgradeCard {
  id: string;
  title: string;
  type: 'common' | 'hero';
  heroTarget?: string;
  icon: string;
  desc: string;
  effect: (scene: DungeonScene) => void;
}

interface DungeonMob extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  maxHp: number;
  mobType: 'skeleton' | 'mage' | 'slime' | 'cursed_knight' | 'goblin_bomber' | 'spider' | 'necromancer' | 'gargoyle' | 'golem';
  speed: number;
  damage: number;
  attackCd: number;
  roomId: number;
  hpBar: Phaser.GameObjects.Rectangle;
  hpBarBg: Phaser.GameObjects.Rectangle;
  isSlowed?: boolean;
  bossState?: 'idle' | 'charging_dash' | 'dashing' | 'bullet_hell' | 'triple_strike';
  bossDashTarget?: { x: number; y: number };
  bossAttackTimer?: number;
  gargoyleSwoopTimer?: number;
  golemStompTimer?: number;
}

interface CompanionFollower {
  sprite: Phaser.Physics.Arcade.Sprite;
  name: string;
  type: 'knight' | 'dog' | 'bear';
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  attackCd: number;
  hpBarBg: Phaser.GameObjects.Rectangle;
  hpBar: Phaser.GameObjects.Rectangle;
  nameText: Phaser.GameObjects.Text;
}

interface GridRoom {
  id: number;
  gridX: number;
  gridY: number;
  worldX: number;
  worldY: number;
  w: number;
  h: number;
  type: 'start' | 'combat' | 'companion' | 'shop' | 'portal' | 'boss';
  name: string;
  cleared: boolean;
  visited: boolean;
  active: boolean;
  mobCount: number;
  connections: { north?: number; south?: number; east?: number; west?: number };
  doors: Phaser.Physics.Arcade.Image[];
}

export class DungeonScene extends Phaser.Scene {
  private heroData!: HeroData;
  private selectedHeroKey: string = 'char_zaza';
  private mode: 'solo' | 'online' = 'solo';
  private roomCode: string = '#DUNGEON-7419';

  // Floor Progression (1/7 to 7/7)
  private currentFloor: number = 1;
  private maxFloors: number = 7;

  // Player Stats & Dual Weapons (2 Slots)
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerWeaponVisual!: Phaser.GameObjects.Image;
  private playerHp: number = 1000;
  private playerMaxHp: number = 1000;
  private playerEnergy: number = 100;
  private playerMaxEnergy: number = 100;
  private energyRegenRate: number = 12;
  private playerSpeed: number = 290;
  private damageMultiplier: number = 1.0;
  private isPlayerDown: boolean = false;
  private isMonster: boolean = false;
  private weapons: [DungeonWeapon, DungeonWeapon | null] = [CLASS_WEAPONS.weapon_stick, null];
  private activeWeaponIndex: number = 0;
  private currentWeapon: DungeonWeapon = CLASS_WEAPONS.weapon_stick;
  private dungeonGold: number = 50; // Starting gold
  private aimVector = new Phaser.Math.Vector2(1, 0);

  // Weapon Slot UI Badges & Energy Indicators
  private weaponSlot1Btn!: Phaser.GameObjects.Container;
  private weaponSlot2Btn!: Phaser.GameObjects.Container;
  private weaponSlot1Icon!: Phaser.GameObjects.Image;
  private weaponSlot2Icon!: Phaser.GameObjects.Image;
  private weaponSlot1Border!: Phaser.GameObjects.Rectangle;
  private weaponSlot2Border!: Phaser.GameObjects.Rectangle;
  private weaponSlot1EnergyText!: Phaser.GameObjects.Text;
  private weaponSlot2EnergyText!: Phaser.GameObjects.Text;
  private attackEnergyCostText!: Phaser.GameObjects.Text;

  // Aim Joystick (Dual-Stick Controls for Ranged Weapons)
  private aimStickBase!: Phaser.GameObjects.Arc;
  private aimStickThumb!: Phaser.GameObjects.Arc;
  private aimStickPointerId: number | null = null;
  private isAiming: boolean = false;

  // Hired Companion Follower
  private companion: CompanionFollower | null = null;

  // 2D Grid Dungeon Rooms
  private rooms: GridRoom[] = [];
  private currentRoomId: number = 0;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private coverObstacles!: Phaser.Physics.Arcade.StaticGroup;
  private doorsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private doorBarrierGfx!: Phaser.GameObjects.Graphics;
  private mobs: DungeonMob[] = [];
  private mobsGroup!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private propsContainer!: Phaser.GameObjects.Group;
  private playerLightGfx!: Phaser.GameObjects.Graphics;
  private isMobile: boolean = false;

  // Boss Elements
  private bossMob: DungeonMob | null = null;
  private bossHpContainer!: Phaser.GameObjects.Container;
  private bossHpFill!: Phaser.GameObjects.Rectangle;
  private bossHpText!: Phaser.GameObjects.Text;
  private bossTelegraphLine!: Phaser.GameObjects.Graphics;

  // Interactive Prompts
  private interactPromptText!: Phaser.GameObjects.Text;
  private touchActionBtn!: Phaser.GameObjects.Container;
  private touchActionLabel!: Phaser.GameObjects.Text;
  private currentInteraction: (() => void) | null = null;

  // HUD & Minimap
  private hpFill!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private energyFill!: Phaser.GameObjects.Rectangle;
  private energyText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private floorBadgeText!: Phaser.GameObjects.Text;
  private minimapGfx!: Phaser.GameObjects.Graphics;
  private minimapContainer!: Phaser.GameObjects.Container;
  private minimapIcons: Phaser.GameObjects.Text[] = [];

  // Combat Touch Controls & Buttons
  private attackBtnIcon!: Phaser.GameObjects.Image;
  private attackBtnLabel!: Phaser.GameObjects.Text;
  private skill1BtnIcon!: Phaser.GameObjects.Image;
  private skill2BtnIcon!: Phaser.GameObjects.Image;
  private ultBtnIcon!: Phaser.GameObjects.Image;
  private cdOverlays: Record<string, Phaser.GameObjects.Rectangle> = {};
  private cdTextLabels: Record<string, Phaser.GameObjects.Text> = {};
  private cds: Record<string, number> = { attack: 0, s1: 0, s2: 0, ult: 0 };
  private cdMax: Record<string, number> = { attack: 300, s1: 3000, s2: 4500, ult: 14000 };

  // Upgrade Cards Modal
  private upgradeModalContainer!: Phaser.GameObjects.Container;
  private isUpgradeModalOpen: boolean = false;
  private appliedUpgradeCards: string[] = [];

  // Buff Perks & Skill Replacements
  private zazaDoubleSpit: boolean = false;
  private zazaPoisonTrail: boolean = false;
  private zazaAcidGeyser: boolean = false;
  private zazaSpikedShell: boolean = false;
  private grimDoubleBullet: boolean = false;
  private grimClusterBomb: boolean = false;
  private grimLaserBolt: boolean = false;
  private grimSmokeScreen: boolean = false;
  private bjornFireWhirl: boolean = false;
  private bjornWarcry: boolean = false;
  private bjornAxeBoomerang: boolean = false;

  // Movement & Aim Joysticks
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private joyStickBase!: Phaser.GameObjects.Arc;
  private joyStickThumb!: Phaser.GameObjects.Arc;
  private joyStickPointerId: number | null = null;
  private joyStickVector = new Phaser.Math.Vector2(0, 0);

  private aimJoyBase!: Phaser.GameObjects.Arc;
  private aimJoyThumb!: Phaser.GameObjects.Arc;
  private aimJoyPointerId: number | null = null;
  private aimJoyVector = new Phaser.Math.Vector2(0, 0);
  private aimLineGfx!: Phaser.GameObjects.Graphics;
  private interactionPos: { x: number; y: number } | null = null;

  constructor() {
    super('DungeonScene');
  }

  init(data: {
    selectedHeroKey?: string;
    mode?: 'solo' | 'online';
    roomCode?: string;
    floor?: number;
    carryGold?: number;
    carryHp?: number;
    companionType?: 'knight' | 'dog' | 'bear';
    appliedUpgrades?: string[];
    weaponSlot1Id?: string;
    weaponSlot2Id?: string;
    currentWeaponId?: string;
  }) {
    this.selectedHeroKey = data.selectedHeroKey || 'char_zaza';
    this.mode = data.mode || 'solo';
    this.roomCode = data.roomCode || '#DUNGEON-7419';
    this.currentFloor = data.floor || 1;
    this.heroData = HEROES[this.selectedHeroKey] || HEROES.char_zaza;

    // Set Default Starting Weapon for Hero Class
    let defaultBaseWeapon = CLASS_WEAPONS.weapon_stick;
    if (this.selectedHeroKey === 'char_grim') defaultBaseWeapon = CLASS_WEAPONS.weapon_flask_launcher;
    else if (this.selectedHeroKey === 'char_bjorn') defaultBaseWeapon = CLASS_WEAPONS.weapon_battleaxe;

    const slot1 = (data.weaponSlot1Id && CLASS_WEAPONS[data.weaponSlot1Id])
      || (data.currentWeaponId && CLASS_WEAPONS[data.currentWeaponId])
      || defaultBaseWeapon;
    const slot2 = (data.weaponSlot2Id && CLASS_WEAPONS[data.weaponSlot2Id]) || null;

    this.weapons = [slot1, slot2];
    this.activeWeaponIndex = 0;
    this.currentWeapon = this.weapons[0]!;
    this.aimVector.set(1, 0);

    this.playerHp = data.carryHp ?? this.heroData.hp;
    this.playerMaxHp = this.heroData.hp;
    this.playerEnergy = 100;
    this.playerMaxEnergy = 100;
    this.playerSpeed = this.heroData.speed;
    this.damageMultiplier = 1.0;
    this.dungeonGold = data.carryGold ?? 50;
    this.appliedUpgradeCards = data.appliedUpgrades || [];
    this.isPlayerDown = false;
    this.isUpgradeModalOpen = false;
    this.mobs = [];
    this.rooms = [];
    this.cdOverlays = {};
    this.cdTextLabels = {};
    this.cds = { attack: 0, s1: 0, s2: 0, ult: 0 };
    this.cdMax = {
      attack: this.currentWeapon.attackSpeed,
      s1: (this.heroData.skills[0]?.cooldown || 3.0) * 1000,
      s2: (this.heroData.skills[1]?.cooldown || 4.5) * 1000,
      ult: (this.heroData.skills[2]?.cooldown || 14.0) * 1000
    };
    this.minimapIcons = [];
    this.companion = null;
    this.currentInteraction = null;

    // Reapply persistent upgrades
    this.zazaDoubleSpit = this.appliedUpgradeCards.includes('zaza_double_spit');
    this.zazaPoisonTrail = this.appliedUpgradeCards.includes('zaza_poison_trail');
    this.grimDoubleBullet = this.appliedUpgradeCards.includes('grim_double_bullet');
    this.grimClusterBomb = this.appliedUpgradeCards.includes('grim_cluster_bomb');
    this.bjornFireWhirl = this.appliedUpgradeCards.includes('bjorn_fire_whirl');
    if (this.appliedUpgradeCards.includes('up_hp')) this.playerMaxHp += 250;
    if (this.appliedUpgradeCards.includes('up_speed')) this.playerSpeed = Math.round(this.playerSpeed * 1.2);
    if (this.appliedUpgradeCards.includes('up_damage')) this.damageMultiplier += 0.25;
    if (this.appliedUpgradeCards.includes('up_energy')) {
      this.playerMaxEnergy += 50;
      this.energyRegenRate += 8;
    }
  }

  create() {
    generateAllTextures(this);

    // Detect mobile touch
    this.isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    const worldW = 8000;
    const worldH = 8000;
    this.physics.world.setBounds(0, 0, worldW, worldH);

    // Pure pitch-black void background outside rooms
    this.add.rectangle(worldW / 2, worldH / 2, worldW, worldH, 0x000000).setDepth(0);

    // Physics Groups
    this.walls = this.physics.add.staticGroup();
    this.coverObstacles = this.physics.add.staticGroup();
    this.doorsGroup = this.physics.add.staticGroup();
    this.mobsGroup = this.physics.add.group();
    this.pickups = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.propsContainer = this.add.group();

    // Door Barrier Graphic Overlay for Combat Lock
    this.doorBarrierGfx = this.add.graphics().setDepth(28);

    // Boss Telegraph Graphic
    this.bossTelegraphLine = this.add.graphics().setDepth(45);

    // Spawn Player BEFORE generating layout and rooms
    this.player = this.physics.add.sprite(worldW / 2, worldH / 2, this.heroData.texture).setDepth(50);
    this.player.setCollideWorldBounds(true);
    this.player.setScale(1.2);

    // Player Light Halo (Atmospheric Torch/Lantern Glow)
    this.playerLightGfx = this.add.graphics().setDepth(22);

    // Render Equipped Weapon directly in hero's hands
    this.playerWeaponVisual = this.add.image(this.player.x + 16, this.player.y + 4, this.currentWeapon.texture)
      .setDepth(51).setScale(1.2);

    // Build HUD, Minimap, Touch Controls & Modals first so all UI references exist
    this.buildHUD();
    this.buildMinimap();
    this.buildTouchControls();
    this.buildUpgradeModal();

    // Generate Procedural 2D Dungeon Layout (4 to 7 connected rooms)
    this.generateProceduralDungeonLayout();

    // Reposition Player to Start Room (Room 0)
    const startRoom = this.rooms[0] || { worldX: worldW / 2, worldY: worldH / 2 };
    this.player.setPosition(startRoom.worldX, startRoom.worldY);
    if (this.playerWeaponVisual) {
      this.playerWeaponVisual.setPosition(this.player.x + 16, this.player.y + 4);
    }

    // Collisions
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.coverObstacles);
    this.physics.add.collider(this.player, this.doorsGroup);

    // Camera setup: Clean 0.95 zoom everywhere in game
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(0.95);

    // Keyboard Controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        F: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),
        Q: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
        SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        ONE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
        TWO: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
        THREE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
      };

      this.input.keyboard.on('keydown-E', () => {
        if (this.currentInteraction) this.currentInteraction();
      });
      this.input.keyboard.on('keydown-F', () => {
        if (this.currentInteraction) this.currentInteraction();
      });
      this.input.keyboard.on('keydown-Q', () => {
        this.switchWeapon();
      });
    }

    // Check if Upgrade Card should trigger right at start of floor (e.g. Floor 2, Floor 4, Floor 7)
    if (this.currentFloor === 2 || this.currentFloor === 4 || this.currentFloor === 7) {
      this.time.delayedCall(600, () => this.openUpgradeModal());
    }

    // Periodic state loop
    this.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => this.handlePeriodicState()
    });

    // Pickups collision
    this.physics.add.overlap(this.player, this.pickups, (_p, pickup) => {
      this.collectPickup(pickup as Phaser.Physics.Arcade.Sprite);
    });

    // Projectile wall & obstacle collision
    this.physics.add.collider(this.projectiles, this.walls, (proj) => {
      proj.destroy();
    });
    this.physics.add.collider(this.projectiles, this.coverObstacles, (proj) => {
      proj.destroy();
    });

    // Show Biome Entrance Banner: "ЗАБРОШЕННЫЕ ПОДЗЕМЕЛЬЯ"
    this.showBiomeIntroBanner();
  }

  private showBiomeIntroBanner() {
    const w = this.cameras.main.width;
    const bannerContainer = this.add.container(w / 2, 130).setScrollFactor(0).setDepth(400);

    const bg = this.add.rectangle(0, 0, 480, 74, 0x090d16, 0.92)
      .setStrokeStyle(2, 0xf59e0b);
    const innerBorder = this.add.rectangle(0, 0, 470, 64, 0x000000, 0)
      .setStrokeStyle(1, 0x78350f);

    const subTitle = this.add.text(0, -18, '✦ БИОМ I • ДРЕВНИЕ КАТАКОМБЫ ✦', {
      fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold', color: '#fbbf24', letterSpacing: 2
    }).setOrigin(0.5);

    const mainTitle = this.add.text(0, 4, 'ЗАБРОШЕННЫЕ ПОДЗЕМЕЛЬЯ', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    const floorText = this.add.text(0, 24, `[ ЭТАЖ ${this.currentFloor} / ${this.maxFloors} ]`, {
      fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold', color: '#38bdf8'
    }).setOrigin(0.5);

    bannerContainer.add([bg, innerBorder, subTitle, mainTitle, floorText]);
    bannerContainer.setAlpha(0);
    bannerContainer.setScale(0.9);

    this.tweens.add({
      targets: bannerContainer,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2400, () => {
          this.tweens.add({
            targets: bannerContainer,
            alpha: 0,
            y: 110,
            duration: 600,
            ease: 'Sine.easeIn',
            onComplete: () => bannerContainer.destroy()
          });
        });
      }
    });
  }

  // --- 2D PROCEDURAL DUNGEON GENERATION (4 TO 7 CONNECTED ROOMS) ---
  private generateProceduralDungeonLayout() {
    const isBossFloor = this.currentFloor === this.maxFloors;
    const roomCount = isBossFloor ? 5 : Phaser.Math.Between(5, 7);

    // Grid coordinates (spacious rooms on 1200px grid)
    const cellSize = 1200;
    const originX = 4000;
    const originY = 4000;

    // Build Connected Grid Graph safely
    const gridOccupied = new Map<string, GridRoom>();
    const roomList: GridRoom[] = [];

    const directions = [
      { dx: 0, dy: -1, dir: 'north', opp: 'south' },
      { dx: 0, dy: 1, dir: 'south', opp: 'north' },
      { dx: 1, dy: 0, dir: 'east', opp: 'west' },
      { dx: -1, dy: 0, dir: 'west', opp: 'east' }
    ];

    // Start Room (0,0) - Spacious and decorated
    const startRoom: GridRoom = {
      id: 0,
      gridX: 0,
      gridY: 0,
      worldX: originX,
      worldY: originY,
      w: 800,
      h: 600,
      type: 'start',
      name: 'СТАРТОВЫЙ ЗАЛ',
      cleared: true,
      visited: true,
      active: false,
      mobCount: 0,
      connections: {},
      doors: []
    };
    gridOccupied.set('0,0', startRoom);
    roomList.push(startRoom);

    // Pick from existing rooms to branch outwards safely
    let safetyAttempts = 0;
    let shopSpawned = false;

    while (roomList.length < roomCount && safetyAttempts < 140) {
      safetyAttempts++;
      const parentRoom = Phaser.Utils.Array.GetRandom(roomList);
      const step = Phaser.Utils.Array.GetRandom(directions);
      const nextGX = Phaser.Math.Clamp(parentRoom.gridX + step.dx, -2, 2);
      const nextGY = Phaser.Math.Clamp(parentRoom.gridY + step.dy, -2, 2);
      const key = `${nextGX},${nextGY}`;

      if (!gridOccupied.has(key)) {
        const roomIndex = roomList.length;
        let rType: 'combat' | 'companion' | 'shop' | 'portal' | 'boss' = 'combat';

        if (isBossFloor && roomIndex === roomCount - 1) {
          rType = 'boss';
        } else if (!isBossFloor && roomIndex === roomCount - 1) {
          rType = 'portal';
        } else if (roomIndex === 1 && Math.random() < 0.3) {
          rType = 'companion';
        } else if (!shopSpawned && roomIndex >= 2 && roomIndex < roomCount - 1 && Math.random() < 0.28) {
          rType = 'shop';
          shopSpawned = true;
        }

        const newRoom: GridRoom = {
          id: roomIndex,
          gridX: nextGX,
          gridY: nextGY,
          worldX: originX + nextGX * cellSize,
          worldY: originY + nextGY * cellSize,
          w: rType === 'boss' ? 1000 : 840,
          h: rType === 'boss' ? 760 : 640,
          type: rType,
          name: this.getRoomTypeName(rType, roomIndex),
          cleared: rType === 'companion' || rType === 'shop',
          visited: false,
          active: false,
          mobCount: rType === 'combat' ? 4 + this.currentFloor : (rType === 'boss' ? 1 : 0),
          connections: {},
          doors: []
        };

        (parentRoom.connections as Record<string, number>)[step.dir] = roomIndex;
        (newRoom.connections as Record<string, number>)[step.opp] = parentRoom.id;

        gridOccupied.set(key, newRoom);
        roomList.push(newRoom);
      }
    }

    this.rooms = roomList;

    // Construct Walls, Corridors and Props for each room
    this.rooms.forEach(room => {
      this.buildRoomGeometry(room, cellSize);
    });
  }

  private getRoomTypeName(type: string, idx: number): string {
    if (type === 'start') return 'СТАРТОВЫЙ ЗАЛ';
    if (type === 'companion') return 'ЗАЛ НАЕМНИКОВ';
    if (type === 'shop') return 'МАГАЗИН ТОРГОВЦА';
    if (type === 'portal') return 'ВХОД В ПЕЩЕРУ (ПЕРЕХОД)';
    if (type === 'boss') return 'АРЕНА ПРОКЛЯТОГО РЫЦАРЯ';
    return `БОЕВОЙ ЗАЛ #${idx}`;
  }

  // --- ROOM GEOMETRY & CORRIDORS ---
  private buildRoomGeometry(room: GridRoom, cellSize: number) {
    const cx = room.worldX;
    const cy = room.worldY;
    const halfW = room.w / 2;
    const halfH = room.h / 2;
    const doorGap = 75;
    const corridorLen = (cellSize - room.h) / 2;

    // Room Interior Floor Tile
    this.add.tileSprite(cx, cy, room.w, room.h, 'tile_floor').setDepth(1).setAlpha(0.95);

    // Top Wall (North)
    if (room.connections.north !== undefined) {
      this.add.tileSprite(cx, cy - halfH - corridorLen / 2, doorGap * 2, corridorLen, 'tile_floor').setDepth(1).setAlpha(0.95);
      this.createWallLine(cx - halfW, cy - halfH, cx - doorGap, cy - halfH);
      this.createWallLine(cx + doorGap, cy - halfH, cx + halfW, cy - halfH);
      // Corridor to north
      this.createWallLine(cx - doorGap, cy - halfH, cx - doorGap, cy - halfH - corridorLen);
      this.createWallLine(cx + doorGap, cy - halfH, cx + doorGap, cy - halfH - corridorLen);
    } else {
      this.createWallLine(cx - halfW, cy - halfH, cx + halfW, cy - halfH);
    }

    // Bottom Wall (South)
    if (room.connections.south !== undefined) {
      this.add.tileSprite(cx, cy + halfH + corridorLen / 2, doorGap * 2, corridorLen, 'tile_floor').setDepth(1).setAlpha(0.95);
      this.createWallLine(cx - halfW, cy + halfH, cx - doorGap, cy + halfH);
      this.createWallLine(cx + doorGap, cy + halfH, cx + halfW, cy + halfH);
      // Corridor to south
      this.createWallLine(cx - doorGap, cy + halfH, cx - doorGap, cy + halfH + corridorLen);
      this.createWallLine(cx + doorGap, cy + halfH, cx + doorGap, cy + halfH + corridorLen);
    } else {
      this.createWallLine(cx - halfW, cy + halfH, cx + halfW, cy + halfH);
    }

    // Left Wall (West)
    if (room.connections.west !== undefined) {
      this.add.tileSprite(cx - halfW - corridorLen / 2, cy, corridorLen, doorGap * 2, 'tile_floor').setDepth(1).setAlpha(0.95);
      this.createWallLine(cx - halfW, cy - halfH, cx - halfW, cy - doorGap);
      this.createWallLine(cx - halfW, cy + doorGap, cx - halfW, cy + halfH);
      // Corridor to west
      this.createWallLine(cx - halfW, cy - doorGap, cx - halfW - corridorLen, cy - doorGap);
      this.createWallLine(cx - halfW, cy + doorGap, cx - halfW - corridorLen, cy + doorGap);
    } else {
      this.createWallLine(cx - halfW, cy - halfH, cx - halfW, cy + halfH);
    }

    // Right Wall (East)
    if (room.connections.east !== undefined) {
      this.add.tileSprite(cx + halfW + corridorLen / 2, cy, corridorLen, doorGap * 2, 'tile_floor').setDepth(1).setAlpha(0.95);
      this.createWallLine(cx + halfW, cy - halfH, cx + halfW, cy - doorGap);
      this.createWallLine(cx + halfW, cy + doorGap, cx + halfW, cy + halfH);
      // Corridor to east
      this.createWallLine(cx + halfW, cy - doorGap, cx + halfW + corridorLen, cy - doorGap);
      this.createWallLine(cx + halfW, cy + doorGap, cx + halfW + corridorLen, cy + doorGap);
    } else {
      this.createWallLine(cx + halfW, cy - halfH, cx + halfW, cy + halfH);
    }

    // Wall Torches with warm flickering light
    this.addWallTorch(cx - halfW + 45, cy - halfH + 20);
    this.addWallTorch(cx + halfW - 45, cy - halfH + 20);
    this.addWallTorch(cx - halfW + 45, cy + halfH - 20);
    this.addWallTorch(cx + halfW - 45, cy + halfH - 20);

    // Floor Title Marker
    this.add.text(cx, cy - halfH + 25, `[ ${room.name} ]`, {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold',
      color: room.type === 'boss' ? '#ef4444' : (room.type === 'shop' ? '#facc15' : (room.type === 'companion' ? '#38bdf8' : '#94a3b8'))
    }).setOrigin(0.5).setDepth(5);

    // Rich atmospheric decorations in every room
    this.decorateDungeonRoom(room);

    // Room Interactive Props
    if (room.type === 'companion') {
      this.buildCompanionPedestals(cx, cy);
    } else if (room.type === 'shop') {
      this.buildShopRoom(cx, cy);
    } else if (room.type === 'portal') {
      this.buildLevelPortal(cx, cy);
    }
  }

  private decorateDungeonRoom(room: GridRoom) {
    const cx = room.worldX;
    const cy = room.worldY;
    const hw = room.w / 2 - 50;
    const hh = room.h / 2 - 50;

    // 1. Cobwebs in room corners
    const cobwebNW = this.add.image(cx - hw, cy - hh, 'prop_cobweb').setDepth(6).setScale(1.2);
    const cobwebNE = this.add.image(cx + hw, cy - hh, 'prop_cobweb').setDepth(6).setScale(1.2).setFlipX(true);
    const cobwebSW = this.add.image(cx - hw, cy + hh, 'prop_cobweb').setDepth(6).setScale(1.2).setFlipY(true);
    const cobwebSE = this.add.image(cx + hw, cy + hh, 'prop_cobweb').setDepth(6).setScale(1.2).setFlipX(true).setFlipY(true);
    this.propsContainer.addMultiple([cobwebNW, cobwebNE, cobwebSW, cobwebSE]);

    // 2. Ancient Rune Stones in corners / sides with soft pulsing glow
    const rune1 = this.add.image(cx - hw + 40, cy - hh + 40, 'prop_rune_stone').setDepth(7).setScale(1.1);
    const rune2 = this.add.image(cx + hw - 40, cy + hh - 40, 'prop_rune_stone').setDepth(7).setScale(1.1);
    this.tweens.add({
      targets: [rune1, rune2],
      alpha: 0.7,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.propsContainer.addMultiple([rune1, rune2]);

    // 3. Broken stone pillars as solid cover
    const pillar1 = this.coverObstacles.create(cx - hw + 30, cy + hh - 35, 'prop_pillar_broken').setDepth(14).setScale(1.1);
    const pillar2 = this.coverObstacles.create(cx + hw - 30, cy - hh + 35, 'prop_pillar_broken').setDepth(14).setScale(1.1);
    pillar1.refreshBody(); pillar2.refreshBody();

    // 4. Skull piles & Bone debris
    const skulls = this.add.image(cx + 80, cy - hh + 30, 'prop_skull_pile').setDepth(8).setScale(1.0);
    this.propsContainer.add(skulls);

    // 5. Wooden Crates & Ancient Barrels as solid cover obstacles in room perimeter
    const barrelPos = [
      { x: cx - hw + 70, y: cy - hh + 30, tex: 'prop_barrel' },
      { x: cx - hw + 95, y: cy - hh + 30, tex: 'prop_crate' },
      { x: cx + hw - 70, y: cy + hh - 30, tex: 'prop_explosive_barrel' },
      { x: cx + hw - 95, y: cy + hh - 30, tex: 'prop_barrel' }
    ];

    barrelPos.forEach(b => {
      const obstacle = this.coverObstacles.create(b.x, b.y, b.tex).setDepth(12).setScale(1.1);
      obstacle.refreshBody();
    });
  }

  private createWallLine(x1: number, y1: number, x2: number, y2: number) {
    const dist = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    const steps = Math.max(1, Math.floor(dist / 44));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const wx = Phaser.Math.Linear(x1, x2, t);
      const wy = Phaser.Math.Linear(y1, y2, t);
      const wall = this.walls.create(wx, wy, 'wall');
      wall.setScale(0.85);
      wall.refreshBody();
      wall.setDepth(25);
    }
  }

  private addWallTorch(x: number, y: number) {
    const torch = this.add.image(x, y, 'dungeon_torch').setDepth(26);
    this.tweens.add({
      targets: torch,
      alpha: 0.8,
      scaleX: 1.06,
      scaleY: 1.08,
      duration: 350 + Math.random() * 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // --- COMPANION ROOM: HIRE 1 RANDOM RECRUIT PER FLOOR ---
  private buildCompanionPedestals(cx: number, cy: number) {
    const allRecruits: Array<{ type: 'knight' | 'dog' | 'bear'; name: string; cost: number; tex: string }> = [
      { type: 'knight', name: 'РЫЦАРЬ', cost: 50, tex: 'companion_knight' },
      { type: 'dog', name: 'БОЕВОЙ ПЕС', cost: 35, tex: 'companion_dog' },
      { type: 'bear', name: 'МЕДВЕДЬ', cost: 65, tex: 'companion_bear' }
    ];

    const r = Phaser.Utils.Array.GetRandom(allRecruits);
    const rx = cx;

    // Pedestal stone
    const pedBg = this.add.rectangle(rx, cy, 76, 76, 0x1e293b).setStrokeStyle(2, 0x38bdf8).setDepth(15);
    const sprite = this.add.image(rx, cy - 8, r.tex).setDepth(16).setScale(1.5);

    this.tweens.add({
      targets: sprite,
      y: '-=5',
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const pedLabel = this.add.text(rx, cy + 48, `${r.name}\n[ ${r.cost} 💰 ]`, {
      fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold', color: '#facc15', align: 'center'
    }).setOrigin(0.5).setDepth(16);

    // Hire Trigger zone
    const zone = this.add.zone(rx, cy, 90, 90);
    this.physics.world.enable(zone);
    if (this.player) {
      this.physics.add.overlap(this.player, zone, () => {
        this.setInteraction(`[ 🐾 НАНЯТЬ ${r.name}: ${r.cost} 💰 ]`, () => {
          this.hireCompanion(r.type, r.name, r.cost, r.tex);
          pedBg.destroy();
          sprite.destroy();
          pedLabel.destroy();
          zone.destroy();
        });
      });
    }
  }

  private hireCompanion(type: 'knight' | 'dog' | 'bear', name: string, cost: number, tex: string) {
    if (this.dungeonGold < cost) {
      this.showFloatingNotice('НЕДОСТАТОЧНО ЗОЛОТА!', '#ef4444');
      return;
    }

    if (this.companion) {
      // Remove old companion
      this.companion.sprite.destroy();
      this.companion.hpBar.destroy();
      this.companion.hpBarBg.destroy();
      this.companion.nameText.destroy();
    }

    this.dungeonGold -= cost;
    this.goldText.setText(`ЗОЛОТО: ${this.dungeonGold}`);
    soundEngine.playLevelUp();

    const maxHp = type === 'bear' ? 650 : (type === 'knight' ? 450 : 300);
    const dmg = type === 'bear' ? 45 : (type === 'knight' ? 35 : 28);
    const speed = type === 'dog' ? 260 : (type === 'knight' ? 220 : 190);

    const compSprite = this.physics.add.sprite(this.player.x + 30, this.player.y + 30, tex).setDepth(48).setScale(1.3);
    compSprite.setCollideWorldBounds(true);
    this.physics.add.collider(compSprite, this.walls);

    const hpBg = this.add.rectangle(compSprite.x, compSprite.y - 24, 36, 5, 0x000000).setDepth(49);
    const hpBar = this.add.rectangle(compSprite.x - 17, compSprite.y - 24, 34, 3, 0x38bdf8).setOrigin(0, 0.5).setDepth(50);
    const nameTxt = this.add.text(compSprite.x, compSprite.y - 32, name, {
      fontSize: '9px', fontFamily: 'monospace', fontStyle: 'bold', color: '#38bdf8'
    }).setOrigin(0.5).setDepth(50);

    this.companion = {
      sprite: compSprite,
      name,
      type,
      hp: maxHp,
      maxHp,
      damage: dmg,
      speed,
      attackCd: 0,
      hpBarBg: hpBg,
      hpBar,
      nameText: nameTxt
    };

    this.showFloatingNotice(`ПОМОЩНИК [ ${name} ] НАНЯТ И СЛЕДУЕТ ЗА ВАМИ! 🐾`, '#4ade80');
    this.clearInteraction();
  }

  // --- SHOP ROOM: RANDOMIZED GOODS ---
  private buildShopRoom(cx: number, cy: number) {
    // Trader NPC
    this.add.image(cx, cy - 80, 'dungeon_shopkeeper').setDepth(16).setScale(1.5);
    this.add.text(cx, cy - 40, '✦ ТОРГОВЕЦ ПОДЗЕМЕЛЬЯ ✦', {
      fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: '#c084fc'
    }).setOrigin(0.5).setDepth(16);

    // Random weapon selection from all available class weapons
    const weaponPool = Object.values(CLASS_WEAPONS);
    const shopWeapon = Phaser.Utils.Array.GetRandom(weaponPool);

    const items: Array<{ id: string; name: string; cost: number; icon: string; x: number; onBuy: () => void }> = [
      {
        id: 'potion_hp',
        name: 'ЗЕЛЬЕ HP (+250)',
        cost: 20,
        icon: 'potion_hp',
        x: cx - 140,
        onBuy: () => {
          this.playerHp = Math.min(this.playerMaxHp, this.playerHp + 250);
          this.updateHUD();
          this.showFloatingNotice('+250 HP ВОССТАНОВЛЕНО! ❤', '#4ade80');
        }
      },
      {
        id: 'potion_energy',
        name: 'ЗЕЛЬЕ ЭНЕРГИИ (+50)',
        cost: 15,
        icon: 'potion_energy',
        x: cx - 45,
        onBuy: () => {
          this.playerEnergy = Math.min(this.playerMaxEnergy, this.playerEnergy + 50);
          this.updateHUD();
          this.showFloatingNotice('+50 ЭНЕРГИИ ВОССТАНОВЛЕНО! ⚡', '#38bdf8');
        }
      },
      {
        id: 'weapon',
        name: shopWeapon.name.toUpperCase(),
        cost: 45,
        icon: shopWeapon.texture,
        x: cx + 50,
        onBuy: () => {
          if (this.weapons[1] === null) {
            this.weapons[1] = shopWeapon;
            this.activeWeaponIndex = 1;
          } else {
            this.weapons[this.activeWeaponIndex] = shopWeapon;
          }
          this.applyEquippedWeapon();
          this.showFloatingNotice(`ОРУЖИЕ В СЛОТЕ ${this.activeWeaponIndex + 1}: ${shopWeapon.name.toUpperCase()}! ⚔`, '#facc15');
        }
      },
      {
        id: 'relic',
        name: 'ТОТЕМ СИЛЫ (+20% УРОНА)',
        cost: 35,
        icon: 'relic_damage',
        x: cx + 145,
        onBuy: () => {
          this.damageMultiplier += 0.20;
          this.showFloatingNotice('+20% К УРОНУ АТАК И НАВЫКОВ! 🔥', '#ef4444');
        }
      }
    ];

    items.forEach(it => {
      const itemBg = this.add.rectangle(it.x, cy + 20, 64, 64, 0x1e293b).setStrokeStyle(2, 0xfacc15).setDepth(15);
      const icon = this.add.image(it.x, cy + 12, it.icon).setDepth(16).setScale(1.4);

      this.tweens.add({
        targets: icon,
        y: '-=4',
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      const label = this.add.text(it.x, cy + 62, `${it.name}\n[ ${it.cost} 💰 ]`, {
        fontSize: '9px', fontFamily: 'monospace', fontStyle: 'bold', color: '#fef08a', align: 'center', wordWrap: { width: 80 }
      }).setOrigin(0.5).setDepth(16);

      const zone = this.add.zone(it.x, cy + 20, 70, 70);
      this.physics.world.enable(zone);
      if (this.player) {
        this.physics.add.overlap(this.player, zone, () => {
          this.setInteraction(`[ 💰 КУПИТЬ: ${it.name} (${it.cost} 💰) ]`, () => {
            if (this.dungeonGold < it.cost) {
              this.showFloatingNotice('НЕДОСТАТОЧНО ЗОЛОТА!', '#ef4444');
              return;
            }
            this.dungeonGold -= it.cost;
            this.goldText.setText(`ЗОЛОТО: ${this.dungeonGold}`);
            soundEngine.playLevelUp();
            it.onBuy();
            this.clearInteraction();
            itemBg.destroy();
            icon.destroy();
            label.destroy();
            zone.destroy();
          });
        });
      }
    });
  }

  // --- PORTAL / CAVE ROOM: DESCEND TO NEXT FLOOR (1/7 -> 2/7) ---
  private buildLevelPortal(cx: number, cy: number) {
    const portal = this.add.image(cx, cy, 'dungeon_portal_active').setDepth(16).setScale(1.5);

    this.tweens.add({
      targets: portal,
      rotation: Math.PI * 2,
      scaleX: 1.6,
      scaleY: 1.6,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(cx, cy + 50, '[ ВХОД В ПЕЩЕРУ • СЛЕДУЮЩИЙ УРОВЕНЬ ]', {
      fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: '#4ade80'
    }).setOrigin(0.5).setDepth(16);

    const zone = this.add.zone(cx, cy, 90, 90);
    this.physics.world.enable(zone);
    if (this.player) {
      this.physics.add.overlap(this.player, zone, () => {
        this.setInteraction('НАЖМИТЕ E: СПУСТИТЬСЯ НА СЛЕДУЮЩИЙ ЭТАЖ', () => {
          this.descendToNextFloor();
        });
      });
    }
  }

  private descendToNextFloor() {
    soundEngine.playLevelUp();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart({
        selectedHeroKey: this.selectedHeroKey,
        mode: this.mode,
        roomCode: this.roomCode,
        floor: this.currentFloor + 1,
        carryGold: this.dungeonGold,
        carryHp: this.playerHp,
        weaponSlot1Id: this.weapons[0]?.id,
        weaponSlot2Id: this.weapons[1]?.id,
        currentWeaponId: this.currentWeapon.id,
        appliedUpgrades: this.appliedUpgradeCards
      });
    });
  }

  // --- ROOM TRIGGERS & COMBAT LOCKS ---
  private checkRoomTriggers() {
    const px = this.player.x;
    const py = this.player.y;

    for (const room of this.rooms) {
      if (Math.abs(px - room.worldX) < room.w / 2 && Math.abs(py - room.worldY) < room.h / 2) {
        if (!room.visited) {
          room.visited = true;
          this.updateMinimap();
        }

        if (this.currentRoomId !== room.id) {
          this.currentRoomId = room.id;
          this.updateMinimap();
        }

        if (!room.cleared && !room.active) {
          this.startRoomBattle(room);
        }
        break;
      }
    }
  }

  private startRoomBattle(room: GridRoom) {
    room.active = true;
    soundEngine.playExplosion();

    this.showFloatingNotice(`⚠ ${room.name}: ВОРОТА ЗАБЛОКИРОВАНЫ! ⚠`, '#ef4444');
    this.closeRoomDoors(room);

    // Teleport companion inside room if far away
    if (this.companion && this.companion.sprite && this.companion.sprite.active) {
      if (Phaser.Math.Distance.Between(this.companion.sprite.x, this.companion.sprite.y, room.worldX, room.worldY) > room.w / 2) {
        this.companion.sprite.setPosition(room.worldX - 40, room.worldY);
      }
    }

    if (room.type === 'combat') {
      const mobPool: Array<{ type: 'skeleton' | 'mage' | 'slime' | 'goblin_bomber' | 'spider' | 'necromancer'; tex: string; hp: number; spd: number; dmg: number }> = [
        { type: 'skeleton', tex: 'mob_skeleton', hp: 120, spd: 125, dmg: 24 },
        { type: 'mage', tex: 'mob_mage', hp: 80, spd: 100, dmg: 20 },
        { type: 'slime', tex: 'mob_slime', hp: 100, spd: 110, dmg: 18 },
        { type: 'goblin_bomber', tex: 'mob_goblin_bomber', hp: 95, spd: 135, dmg: 32 },
        { type: 'spider', tex: 'mob_spider', hp: 85, spd: 160, dmg: 22 },
        { type: 'necromancer', tex: 'mob_necromancer', hp: 140, spd: 90, dmg: 26 }
      ];

      for (let i = 0; i < room.mobCount; i++) {
        const ox = (Math.random() - 0.5) * (room.w - 180);
        const oy = (Math.random() - 0.5) * (room.h - 180);

        const chosen = Phaser.Utils.Array.GetRandom(mobPool);
        const hp = Math.round(chosen.hp * (1 + (this.currentFloor - 1) * 0.25));
        const dmg = Math.round(chosen.dmg * (1 + (this.currentFloor - 1) * 0.2));

        this.spawnMob(room.worldX + ox, room.worldY + oy, chosen.type, chosen.tex, hp, chosen.spd, dmg, room.id);
      }
    } else if (room.type === 'boss') {
      this.spawnCursedKnightBoss(room.worldX, room.worldY - 30, room.id);
    }
  }

  private closeRoomDoors(room: GridRoom) {
    this.doorsGroup.clear(true, true);
    const cx = room.worldX;
    const cy = room.worldY;
    const halfW = room.w / 2;
    const halfH = room.h / 2;

    if (room.connections.north !== undefined) {
      const door = this.doorsGroup.create(cx, cy - halfH, 'dungeon_door_closed').setDepth(25).setScale(1.2);
      door.refreshBody();
    }
    if (room.connections.south !== undefined) {
      const door = this.doorsGroup.create(cx, cy + halfH, 'dungeon_door_closed').setDepth(25).setScale(1.2);
      door.refreshBody();
    }
    if (room.connections.west !== undefined) {
      const door = this.doorsGroup.create(cx - halfW, cy, 'dungeon_door_closed').setDepth(25).setScale(1.2);
      door.refreshBody();
    }
    if (room.connections.east !== undefined) {
      const door = this.doorsGroup.create(cx + halfW, cy, 'dungeon_door_closed').setDepth(25).setScale(1.2);
      door.refreshBody();
    }
  }

  private spawnMob(
    x: number, y: number,
    mobType: 'skeleton' | 'mage' | 'slime' | 'goblin_bomber' | 'spider' | 'necromancer',
    tex: string, hp: number, speed: number, damage: number, roomId: number
  ) {
    const mob = this.physics.add.sprite(x, y, tex) as DungeonMob;
    mob.setCollideWorldBounds(true);
    mob.hp = hp;
    mob.maxHp = hp;
    mob.mobType = mobType;
    mob.speed = speed;
    mob.damage = damage;
    mob.attackCd = 0;
    mob.roomId = roomId;
    mob.setDepth(40);
    mob.setScale(1.25);

    // HP Bar directly tied to Mob Sprite
    const hpBg = this.add.rectangle(x, y - 24, 34, 4, 0x000000).setDepth(41);
    const hpBar = this.add.rectangle(x - 16, y - 24, 32, 3, 0xef4444).setOrigin(0, 0.5).setDepth(42);
    mob.hpBarBg = hpBg;
    mob.hpBar = hpBar;

    this.physics.add.collider(mob, this.walls);
    this.mobs.push(mob);
    if (this.mobsGroup) this.mobsGroup.add(mob);
  }

  private spawnCursedKnightBoss(x: number, y: number, roomId: number) {
    const boss = this.physics.add.sprite(x, y, 'boss_cursed_knight') as DungeonMob;
    boss.setCollideWorldBounds(true);
    boss.hp = 3000;
    boss.maxHp = 3000;
    boss.mobType = 'cursed_knight';
    boss.speed = 135;
    boss.damage = 60;
    boss.attackCd = 0;
    boss.roomId = roomId;
    boss.setDepth(40);
    boss.setScale(1.85);
    boss.bossState = 'idle';
    boss.bossAttackTimer = 2000;

    const hpBg = this.add.rectangle(x, y - 42, 60, 6, 0x000000).setDepth(41);
    const hpBar = this.add.rectangle(x - 29, y - 42, 58, 4, 0xdc2626).setOrigin(0, 0.5).setDepth(42);
    boss.hpBarBg = hpBg;
    boss.hpBar = hpBar;

    this.physics.add.collider(boss, this.walls);
    this.bossMob = boss;
    this.mobs.push(boss);
    if (this.mobsGroup) this.mobsGroup.add(boss);

    if (this.bossHpContainer) this.bossHpContainer.setVisible(true);
    if (this.bossHpText) this.bossHpText.setText('БОСС ФИНАЛА: ПРОКЛЯТЫЙ РЫЦАРЬ [3000 / 3000]');
    if (this.bossHpFill && typeof this.bossHpFill.setDisplaySize === 'function') this.bossHpFill.setDisplaySize(320, 16);
    soundEngine.playExplosion();
  }

  // --- MOBS & COMPANION AI ---
  private updateMobs(delta: number) {
    const px = this.player.x;
    const py = this.player.y;

    // 1. Companion AI
    if (this.companion && this.companion.sprite && this.companion.sprite.active) {
      this.updateCompanionAI(delta, px, py);
    }

    // 2. Mobs AI
    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const mob = this.mobs[i];
      if (!mob || !mob.active) continue;

      // Clamp mob strictly within its designated room floor boundaries
      const mobRoom = this.rooms.find(r => r.id === mob.roomId);
      if (mobRoom) {
        const minX = mobRoom.worldX - mobRoom.w / 2 + 32;
        const maxX = mobRoom.worldX + mobRoom.w / 2 - 32;
        const minY = mobRoom.worldY - mobRoom.h / 2 + 32;
        const maxY = mobRoom.worldY + mobRoom.h / 2 - 32;
        mob.x = Phaser.Math.Clamp(mob.x, minX, maxX);
        mob.y = Phaser.Math.Clamp(mob.y, minY, maxY);
      }

      // Stick HP bar directly above mob head
      if (mob.hpBar && mob.hpBar.active && mob.hpBarBg && mob.hpBarBg.active && typeof mob.hpBar.setDisplaySize === 'function') {
        mob.hpBarBg.setPosition(mob.x, mob.y - (mob.mobType === 'cursed_knight' ? 44 : 26));
        mob.hpBar.setPosition(mob.x - (mob.mobType === 'cursed_knight' ? 29 : 16), mob.y - (mob.mobType === 'cursed_knight' ? 44 : 26));
        const pct = Math.max(0, mob.hp / mob.maxHp);
        mob.hpBar.setDisplaySize(Math.max(1, (mob.mobType === 'cursed_knight' ? 58 : 32) * pct), mob.mobType === 'cursed_knight' ? 4 : 3);
      }

      mob.attackCd = Math.max(0, mob.attackCd - delta);

      if (mob.mobType === 'cursed_knight') {
        this.updateCursedKnightAI(mob, delta, px, py);
        continue;
      }

      // Determine target (Player or Companion)
      let tx = px;
      let ty = py;
      if (this.companion && this.companion.sprite.active) {
        const dComp = Phaser.Math.Distance.Between(mob.x, mob.y, this.companion.sprite.x, this.companion.sprite.y);
        const dPlay = Phaser.Math.Distance.Between(mob.x, mob.y, px, py);
        if (dComp < dPlay && Math.random() > 0.4) {
          tx = this.companion.sprite.x;
          ty = this.companion.sprite.y;
        }
      }

      const dist = Phaser.Math.Distance.Between(mob.x, mob.y, tx, ty);

      if (mob.mobType === 'skeleton') {
        if (dist > 40 && !this.isPlayerDown) {
          const angle = Phaser.Math.Angle.Between(mob.x, mob.y, tx, ty);
          const spd = mob.isSlowed ? mob.speed * 0.45 : mob.speed;
          mob.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
        } else {
          mob.setVelocity(0, 0);
          if (dist <= 46 && mob.attackCd <= 0 && !this.isPlayerDown) {
            mob.attackCd = 1200;
            this.mobMeleeSlash(mob, tx, ty, mob.damage);
          }
        }
      } else if (mob.mobType === 'mage') {
        if (dist < 260) {
          const angle = Phaser.Math.Angle.Between(tx, ty, mob.x, mob.y);
          mob.setVelocity(Math.cos(angle) * mob.speed, Math.sin(angle) * mob.speed);
        } else if (dist > 340) {
          const angle = Phaser.Math.Angle.Between(mob.x, mob.y, tx, ty);
          mob.setVelocity(Math.cos(angle) * mob.speed, Math.sin(angle) * mob.speed);
        } else {
          mob.setVelocity(0, 0);
        }

        if (mob.attackCd <= 0 && !this.isPlayerDown) {
          mob.attackCd = 2800;
          this.shootEnemyOrb(mob.x, mob.y, tx, ty, mob.damage);
        }
      } else if (mob.mobType === 'goblin_bomber') {
        // Goblin runs around unpredictably and tosses bombs
        if (dist < 200) {
          const angle = Phaser.Math.Angle.Between(tx, ty, mob.x, mob.y);
          mob.setVelocity(Math.cos(angle) * mob.speed, Math.sin(angle) * mob.speed);
        } else {
          const angle = Phaser.Math.Angle.Between(mob.x, mob.y, tx, ty);
          mob.setVelocity(Math.cos(angle) * mob.speed, Math.sin(angle) * mob.speed);
        }

        if (mob.attackCd <= 0 && !this.isPlayerDown) {
          mob.attackCd = 3200;
          this.shootGoblinBomb(mob.x, mob.y, tx, ty, mob.damage);
        }
      } else if (mob.mobType === 'spider') {
        // Spider dashes fast and shoots slowing webs
        const angle = Phaser.Math.Angle.Between(mob.x, mob.y, tx, ty);
        if (dist > 45 && !this.isPlayerDown) {
          mob.setVelocity(Math.cos(angle) * mob.speed, Math.sin(angle) * mob.speed);
        } else {
          mob.setVelocity(0, 0);
          if (mob.attackCd <= 0 && !this.isPlayerDown) {
            mob.attackCd = 1100;
            this.mobMeleeSlash(mob, tx, ty, mob.damage);
          }
        }
        if (mob.attackCd <= 0 && dist > 100 && Math.random() > 0.5 && !this.isPlayerDown) {
          mob.attackCd = 3000;
          this.shootSpiderWeb(mob.x, mob.y, tx, ty);
        }
      } else if (mob.mobType === 'necromancer') {
        // Necromancer floats, summons skeletons and shoots homing skulls
        if (dist < 220) {
          const angle = Phaser.Math.Angle.Between(tx, ty, mob.x, mob.y);
          mob.setVelocity(Math.cos(angle) * mob.speed, Math.sin(angle) * mob.speed);
        } else {
          mob.setVelocity(0, 0);
        }

        if (mob.attackCd <= 0 && !this.isPlayerDown) {
          mob.attackCd = 3500;
          if (Math.random() > 0.4) {
            this.shootNecromancerSkull(mob.x, mob.y, tx, ty, mob.damage);
          } else {
            // Summon a mini skeleton
            this.spawnMob(mob.x + (Math.random() - 0.5) * 60, mob.y + (Math.random() - 0.5) * 60, 'skeleton', 'mob_skeleton', 60, 130, 16, mob.roomId);
            soundEngine.playCast();
          }
        }
      }
    }
  }

  private updateCompanionAI(delta: number, px: number, py: number) {
    if (!this.companion || !this.companion.sprite || !this.companion.sprite.active) return;
    const comp = this.companion;
    const cs = comp.sprite;

    if (comp.hpBar && comp.hpBar.active && comp.hpBarBg && comp.hpBarBg.active && typeof comp.hpBar.setDisplaySize === 'function') {
      comp.hpBarBg.setPosition(cs.x, cs.y - 24);
      comp.hpBar.setPosition(cs.x - 17, cs.y - 24);
      comp.hpBar.setDisplaySize(Math.max(1, 34 * Math.max(0, comp.hp / comp.maxHp)), 3);
    }
    if (comp.nameText && comp.nameText.active) {
      comp.nameText.setPosition(cs.x, cs.y - 32);
    }

    comp.attackCd = Math.max(0, comp.attackCd - delta);

    // Find closest active mob in same room
    let nearestMob: DungeonMob | null = null;
    let minDist = 350;

    for (const mob of this.mobs) {
      if (mob.active) {
        const d = Phaser.Math.Distance.Between(cs.x, cs.y, mob.x, mob.y);
        if (d < minDist) {
          minDist = d;
          nearestMob = mob;
        }
      }
    }

    if (nearestMob) {
      // Attack nearest mob
      const angle = Phaser.Math.Angle.Between(cs.x, cs.y, nearestMob.x, nearestMob.y);
      if (minDist > 45) {
        cs.setVelocity(Math.cos(angle) * comp.speed, Math.sin(angle) * comp.speed);
      } else {
        cs.setVelocity(0, 0);
        if (comp.attackCd <= 0) {
          comp.attackCd = 1000;
          soundEngine.playSlash();
          this.damageMob(nearestMob, comp.damage);
          // Slash effect
          const sl = this.add.circle(nearestMob.x, nearestMob.y, 22, 0x38bdf8, 0.6).setDepth(46);
          this.tweens.add({ targets: sl, alpha: 0, duration: 180, onComplete: () => sl.destroy() });
        }
      }
    } else {
      // Follow player
      const distToPlayer = Phaser.Math.Distance.Between(cs.x, cs.y, px, py);
      if (distToPlayer > 80) {
        const angle = Phaser.Math.Angle.Between(cs.x, cs.y, px, py);
        cs.setVelocity(Math.cos(angle) * comp.speed, Math.sin(angle) * comp.speed);
      } else {
        cs.setVelocity(0, 0);
      }
    }
  }

  private mobMeleeSlash(mob: DungeonMob, tx: number, ty: number, dmg: number) {
    soundEngine.playHit();
    const slash = this.add.circle(mob.x + (tx > mob.x ? 18 : -18), mob.y, 22, 0xef4444, 0.6).setDepth(45);
    this.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 1.4,
      duration: 180,
      onComplete: () => slash.destroy()
    });

    if (Phaser.Math.Distance.Between(mob.x, mob.y, this.player.x, this.player.y) < 48) {
      this.damagePlayer(dmg);
    }
  }

  private detonateEnemyBomb(bomb: Phaser.Physics.Arcade.Sprite, dmg: number) {
    if (!bomb || !bomb.active) return;
    const bx = bomb.x;
    const by = bomb.y;
    bomb.destroy();
    soundEngine.playExplosion();
    const blast = this.add.circle(bx, by, 65, 0xef4444, 0.75).setDepth(46);
    this.tweens.add({ targets: blast, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 250, onComplete: () => blast.destroy() });
    if (Phaser.Math.Distance.Between(bx, by, this.player.x, this.player.y) < 75) {
      this.damagePlayer(dmg);
    }
  }

  private shootEnemyOrb(x: number, y: number, tx: number, ty: number, dmg: number) {
    soundEngine.playShoot();
    const orb = this.physics.add.sprite(x, y, 'proj_dark_orb').setDepth(45).setScale(1.2);
    this.projectiles.add(orb);

    const angle = Phaser.Math.Angle.Between(x, y, tx, ty);
    const speed = 210;
    orb.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    const onHit = () => {
      if (orb.active) {
        orb.destroy();
        this.damagePlayer(dmg);
        soundEngine.playHit();
      }
    };

    this.physics.add.overlap(orb, this.player, onHit);
    if (this.walls) this.physics.add.collider(orb, this.walls, () => orb.destroy());

    this.time.delayedCall(4000, () => {
      if (orb && orb.active) orb.destroy();
    });
  }

  private shootGoblinBomb(x: number, y: number, tx: number, ty: number, dmg: number) {
    soundEngine.playCast();
    const bomb = this.physics.add.sprite(x, y, 'proj_goblin_bomb').setDepth(45).setScale(1.3);
    this.projectiles.add(bomb);

    const angle = Phaser.Math.Angle.Between(x, y, tx, ty);
    const speed = 260;
    bomb.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    const triggerExplosion = () => {
      this.detonateEnemyBomb(bomb, dmg);
    };

    this.physics.add.overlap(bomb, this.player, triggerExplosion);
    if (this.walls) this.physics.add.collider(bomb, this.walls, triggerExplosion);

    this.time.delayedCall(1200, triggerExplosion);
  }

  private shootSpiderWeb(x: number, y: number, tx: number, ty: number) {
    soundEngine.playShoot();
    const web = this.physics.add.sprite(x, y, 'proj_web_shot').setDepth(45).setScale(1.4);
    this.projectiles.add(web);

    const angle = Phaser.Math.Angle.Between(x, y, tx, ty);
    const speed = 280;
    web.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    const onWebHit = () => {
      if (web.active) {
        web.destroy();
        this.showFloatingNotice('🕸 ЗАМЕДЛЕН ПАУТИНОЙ! 🕸', '#4ade80');
        const origSpeed = this.playerSpeed;
        this.playerSpeed = Math.round(this.playerSpeed * 0.5);
        this.time.delayedCall(2000, () => {
          this.playerSpeed = origSpeed;
        });
      }
    };

    this.physics.add.overlap(web, this.player, onWebHit);
    if (this.walls) this.physics.add.collider(web, this.walls, () => web.destroy());

    this.time.delayedCall(3000, () => {
      if (web && web.active) web.destroy();
    });
  }

  private shootNecromancerSkull(x: number, y: number, tx: number, ty: number, dmg: number) {
    soundEngine.playCast();
    const skull = this.physics.add.sprite(x, y, 'proj_skull_homing').setDepth(45).setScale(1.3);
    this.projectiles.add(skull);

    const angle = Phaser.Math.Angle.Between(x, y, tx, ty);
    const speed = 190;
    skull.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    const onSkullHit = () => {
      if (skull.active) {
        skull.destroy();
        this.damagePlayer(dmg);
        soundEngine.playHit();
      }
    };

    this.physics.add.overlap(skull, this.player, onSkullHit);
    if (this.walls) this.physics.add.collider(skull, this.walls, () => skull.destroy());

    this.time.delayedCall(4500, () => {
      if (skull && skull.active) skull.destroy();
    });
  }

  // --- BOSS: CURSED KNIGHT ---
  private updateCursedKnightAI(boss: DungeonMob, delta: number, px: number, py: number) {
    if (this.bossHpFill && this.bossHpFill.active && this.bossHpText && this.bossHpText.active && typeof this.bossHpFill.setDisplaySize === 'function') {
      const pct = Math.max(0, boss.hp / boss.maxHp);
      this.bossHpFill.setDisplaySize(Math.max(1, 320 * pct), 16);
      this.bossHpText.setText(`БОСС ФИНАЛА: ПРОКЛЯТЫЙ РЫЦАРЬ [${boss.hp} / ${boss.maxHp}]`);
    }

    boss.bossAttackTimer = (boss.bossAttackTimer || 0) - delta;

    if (boss.bossState === 'charging_dash') {
      boss.setVelocity(0, 0);
      if (boss.bossDashTarget) {
        this.bossTelegraphLine.clear();
        this.bossTelegraphLine.lineStyle(3, 0xef4444, 0.85);
        this.bossTelegraphLine.lineBetween(boss.x, boss.y, boss.bossDashTarget.x, boss.bossDashTarget.y);
      }
      return;
    }

    if (boss.bossState === 'dashing') return;

    if (boss.bossAttackTimer <= 0) {
      const roll = Math.random();
      if (roll < 0.35) this.executeBossDash(boss, px, py);
      else if (roll < 0.70) this.executeBossBulletHell(boss);
      else this.executeBossTripleStrike(boss, px, py);
      boss.bossAttackTimer = 3600;
    } else {
      const dist = Phaser.Math.Distance.Between(boss.x, boss.y, px, py);
      if (dist > 60 && !this.isPlayerDown) {
        const angle = Phaser.Math.Angle.Between(boss.x, boss.y, px, py);
        boss.setVelocity(Math.cos(angle) * boss.speed, Math.sin(angle) * boss.speed);
      } else {
        boss.setVelocity(0, 0);
      }
    }
  }

  private executeBossDash(boss: DungeonMob, px: number, py: number) {
    boss.bossState = 'charging_dash';
    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, px, py);
    const targetX = boss.x + Math.cos(angle) * 450;
    const targetY = boss.y + Math.sin(angle) * 450;
    boss.bossDashTarget = { x: targetX, y: targetY };

    soundEngine.playCast();
    this.showFloatingNotice('⚠ РЫВОК ПРОКЛЯТОГО РЫЦАРЯ! ⚠', '#ef4444');

    this.time.delayedCall(1000, () => {
      if (!boss.active) return;
      this.bossTelegraphLine.clear();
      boss.bossState = 'dashing';
      soundEngine.playExplosion();

      const dashSpeed = 750;
      boss.setVelocity(Math.cos(angle) * dashSpeed, Math.sin(angle) * dashSpeed);

      const hitTimer = this.time.addEvent({
        delay: 50,
        repeat: 10,
        callback: () => {
          if (!boss.active) return;
          if (Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y) < 70) {
            this.damagePlayer(65);
            soundEngine.playHit();
          }
        }
      });

      this.time.delayedCall(600, () => {
        hitTimer.remove();
        boss.setVelocity(0, 0);
        boss.bossState = 'idle';
      });
    });
  }

  private executeBossBulletHell(boss: DungeonMob) {
    boss.bossState = 'bullet_hell';
    boss.setVelocity(0, 0);
    soundEngine.playCast();
    this.showFloatingNotice('☠ КОЛЬЦО СМЕРТИ: 12 СНАРЯДОВ! ☠', '#a855f7');

    const numProj = 12;
    for (let i = 0; i < numProj; i++) {
      const angle = (i / numProj) * Math.PI * 2;
      const orb = this.physics.add.sprite(boss.x, boss.y, 'proj_dark_orb').setDepth(45).setScale(1.3);
      this.projectiles.add(orb);
      const speed = 190;
      orb.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

      this.physics.add.overlap(orb, this.player, () => {
        orb.destroy();
        this.damagePlayer(25);
        soundEngine.playHit();
      });

      this.time.delayedCall(4500, () => {
        if (orb && orb.active) orb.destroy();
      });
    }

    this.time.delayedCall(1200, () => {
      boss.bossState = 'idle';
    });
  }

  private executeBossTripleStrike(boss: DungeonMob, px: number, py: number) {
    boss.bossState = 'triple_strike';
    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, px, py);

    this.time.addEvent({
      delay: 400,
      repeat: 2,
      callback: () => {
        if (!boss.active) return;
        boss.setPosition(boss.x + Math.cos(angle) * 35, boss.y + Math.sin(angle) * 35);
        soundEngine.playSlash();

        const slash = this.add.circle(boss.x + Math.cos(angle) * 45, boss.y + Math.sin(angle) * 45, 45, 0xdc2626, 0.75).setDepth(46);
        this.tweens.add({
          targets: slash,
          alpha: 0,
          scaleX: 1.5,
          scaleY: 1.5,
          duration: 200,
          onComplete: () => slash.destroy()
        });

        if (Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y) < 85) {
          this.damagePlayer(40);
        }
      }
    });

    this.time.delayedCall(1400, () => {
      boss.bossState = 'idle';
    });
  }

  // --- DAMAGE & COMBAT ---
  public damageMob(mob: DungeonMob, dmg: number) {
    const finalDmg = Math.round(dmg * this.damageMultiplier);
    mob.hp -= finalDmg;
    soundEngine.playHit();
    this.showDamageNumber(mob.x, mob.y - 15, `-${finalDmg}`, '#f87171');
    mob.setTint(0xffffff);
    this.time.delayedCall(90, () => mob.clearTint());

    if (mob.hp <= 0) {
      this.killMob(mob);
    }
  }

  private killMob(mob: DungeonMob) {
    soundEngine.playExplosion();
    const isBoss = mob.mobType === 'cursed_knight';

    const goldDrop = isBoss ? 300 : Phaser.Math.Between(8, 18);
    this.dungeonGold += goldDrop;
    this.goldText.setText(`ЗОЛОТО: ${this.dungeonGold}`);

    this.spawnPickup(mob.x, mob.y, 'coin');
    if (Math.random() > 0.65 || isBoss) {
      this.spawnPickup(mob.x + 20, mob.y, 'heart');
    }

    if (mob.hpBar) mob.hpBar.destroy();
    if (mob.hpBarBg) mob.hpBarBg.destroy();

    const idx = this.mobs.indexOf(mob);
    if (idx !== -1) this.mobs.splice(idx, 1);
    if (this.mobsGroup) this.mobsGroup.remove(mob, false, false);
    mob.destroy();

    if (isBoss) {
      this.bossHpContainer.setVisible(false);
      this.showVictoryScreen();
      return;
    }

    // Check if room cleared
    const remainingInRoom = this.mobs.filter(m => m.roomId === mob.roomId);
    if (remainingInRoom.length === 0) {
      const room = this.rooms.find(r => r.id === mob.roomId);
      if (room && !room.cleared) {
        room.cleared = true;
        soundEngine.playLevelUp();
        this.doorsGroup.clear(true, true);
        this.showFloatingNotice(`✓ ${room.name} ЗАЧИЩЕНА! ВОРОТА ОТКРЫТЫ!`, '#4ade80');
        this.updateMinimap();
      }
    }
  }

  private damagePlayer(dmg: number) {
    if (this.isPlayerDown) return;
    this.playerHp = Math.max(0, this.playerHp - dmg);
    this.updateHUD();
    soundEngine.playHit();
    this.player.setTint(0xef4444);
    this.time.delayedCall(120, () => this.player.clearTint());

    if (this.playerHp <= 0) {
      this.isPlayerDown = true;
      this.player.setAngle(90);
      this.player.setTint(0x71717a);
      this.player.setVelocity(0, 0);
      this.showDefeatScreen();
    }
  }

  // --- DUAL WEAPON SWITCHING ---
  public switchWeapon(targetSlot?: number) {
    if (this.isPlayerDown || this.isUpgradeModalOpen) return;
    if (targetSlot !== undefined) {
      if (this.weapons[targetSlot]) {
        this.activeWeaponIndex = targetSlot;
      }
    } else {
      if (this.weapons[1] !== null) {
        this.activeWeaponIndex = 1 - this.activeWeaponIndex;
      }
    }
    this.applyEquippedWeapon();
    soundEngine.playClick();
  }

  private applyEquippedWeapon() {
    this.currentWeapon = this.weapons[this.activeWeaponIndex] || this.weapons[0]!;
    this.cdMax.attack = this.currentWeapon.attackSpeed;

    if (this.attackBtnIcon) {
      this.attackBtnIcon.setTexture(this.currentWeapon.texture);
    }
    if (this.attackBtnLabel) {
      this.attackBtnLabel.setText(this.currentWeapon.name);
    }
    if (this.playerWeaponVisual) {
      this.playerWeaponVisual.setTexture(this.currentWeapon.texture);
    }
    this.updateWeaponSlotsUI();
  }

  private updateWeaponSlotsUI() {
    if (!this.weaponSlot1Border || !this.weaponSlot2Border) return;
    const isSlot1 = this.activeWeaponIndex === 0;
    this.weaponSlot1Border.setStrokeStyle(isSlot1 ? 2 : 1, isSlot1 ? 0xf59e0b : 0x475569);
    this.weaponSlot2Border.setStrokeStyle(!isSlot1 ? 2 : 1, !isSlot1 ? 0xf59e0b : 0x475569);

    if (this.weapons[0] && this.weaponSlot1Icon) {
      this.weaponSlot1Icon.setTexture(this.weapons[0].texture).setVisible(true);
    }
    if (this.weaponSlot2Icon) {
      if (this.weapons[1]) {
        this.weaponSlot2Icon.setTexture(this.weapons[1].texture).setVisible(true);
      } else {
        this.weaponSlot2Icon.setVisible(false);
      }
    }
  }

  // --- PLAYER SKILL EXECUTION (8-DIRECTIONAL AIMING WITH RED JOYSTICK) ---
  public executeCombatSkill(slot: 'attack' | 's1' | 's2' | 'ult') {
    if (this.isPlayerDown || this.isUpgradeModalOpen) return;
    if (this.cds[slot] > 0) return;

    this.cds[slot] = this.cdMax[slot];

    let dirX = this.player.flipX ? -1 : 1;
    let dirY = 0;

    if (this.aimJoyVector.lengthSq() > 0.05) {
      dirX = this.aimJoyVector.x;
      dirY = this.aimJoyVector.y;
    } else if (this.aimVector.x !== 0 || this.aimVector.y !== 0) {
      dirX = this.aimVector.x;
      dirY = this.aimVector.y;
    } else if (this.joyStickVector.lengthSq() > 0.05) {
      dirX = this.joyStickVector.x;
      dirY = this.joyStickVector.y;
    }

    // Swing weapon animation
    const facingAngle = Math.atan2(dirY, dirX);
    this.tweens.add({
      targets: this.playerWeaponVisual,
      angle: (facingAngle * 180 / Math.PI) + 40,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut'
    });

    if (slot === 'attack') this.executeWeaponAttack(dirX, dirY);
    else if (slot === 's1') this.executeSkill1(dirX, dirY);
    else if (slot === 's2') this.executeSkill2(dirX, dirY);
    else if (slot === 'ult') this.executeUlt(dirX, dirY);
  }

  private executeWeaponAttack(dirX: number, dirY: number) {
    if (this.isMonster) {
      soundEngine.playAttack();
      const bite = this.add.circle(this.player.x + dirX * 65, this.player.y + dirY * 65, 36, 0xef4444, 0.85).setDepth(100);
      this.tweens.add({
        targets: bite,
        scale: 1.5,
        alpha: 0,
        duration: 150,
        onComplete: () => bite.destroy()
      });
      this.mobs.forEach(m => {
        if (m.active && Phaser.Math.Distance.Between(this.player.x + dirX * 65, this.player.y + dirY * 65, m.x, m.y) < 85) {
          this.damageMob(m, 140);
        }
      });
      return;
    }

    const w = this.currentWeapon;

    if (w.energyCost > 0) {
      if (this.playerEnergy < w.energyCost) {
        this.showFloatingNotice('НЕДОСТАТОЧНО ЭНЕРГИИ!', '#fbbf24');
        this.cds.attack = 0;
        return;
      }
      this.playerEnergy -= w.energyCost;
      this.updateHUD();
    }

    if (w.rangeType === 'ranged_single' || w.rangeType === 'ranged_double' || w.rangeType === 'ranged_explosive') {
      soundEngine.playShoot();
      this.firePlayerProjectile(this.player.x, this.player.y, dirX, dirY, w);
      if (w.rangeType === 'ranged_double' || this.grimDoubleBullet) {
        this.time.delayedCall(120, () => this.firePlayerProjectile(this.player.x, this.player.y, dirX, dirY, w));
      }
      return;
    }

    if (w.rangeType === 'melee_heavy_aoe' || w.rangeType === 'melee_fast') {
      soundEngine.playSlash();
      const hitX = this.player.x + dirX * 42;
      const hitY = this.player.y + dirY * 42;
      const facingAngle = Math.atan2(dirY, dirX);

      // Sharp crisp axe/weapon slash directly in front of player
      const slash = this.add.rectangle(hitX, hitY, 44, 12, 0xe2e8f0).setDepth(45);
      slash.setRotation(facingAngle);
      this.tweens.add({
        targets: slash,
        scaleX: 1.4,
        alpha: 0,
        duration: 140,
        onComplete: () => slash.destroy()
      });

      this.mobs.forEach(mob => {
        if (Phaser.Math.Distance.Between(hitX, hitY, mob.x, mob.y) < 70) {
          this.damageMob(mob, w.damage);
        }
      });
      return;
    }
  }

  private firePlayerProjectile(x: number, y: number, dirX: number, dirY: number, w: DungeonWeapon) {
    let tex = 'proj_bullet';
    if (w.id === 'weapon_flask_launcher') tex = 'proj_flask';
    else if (w.id === 'weapon_crossbow') tex = 'proj_arrow';
    else if (w.id === 'weapon_thunder_hammer') tex = 'proj_lightning_bolt';
    else if (w.id === 'weapon_grenade_launcher') tex = 'proj_goblin_bomb';

    const proj = this.physics.add.sprite(x, y, tex).setDepth(45).setScale(1.4);
    this.projectiles.add(proj);

    const speed = w.id === 'weapon_grenade_launcher' ? 360 : 440;
    proj.setVelocity(dirX * speed, dirY * speed);
    proj.setRotation(Math.atan2(dirY, dirX));

    const triggerExplosion = (ex: number, ey: number) => {
      if (!proj.active) return;
      proj.destroy();
      soundEngine.playExplosion();
      this.cameras.main.shake(200, 0.012);

      const expRing = this.add.circle(ex, ey, 70, 0xef4444, 0.85).setDepth(46);
      const expCore = this.add.circle(ex, ey, 35, 0xfde047, 0.95).setDepth(47);

      this.tweens.add({ targets: [expRing, expCore], scaleX: 1.4, scaleY: 1.4, alpha: 0, duration: 320, onComplete: () => {
        expRing.destroy();
        expCore.destroy();
      }});

      this.mobs.forEach(m => {
        if (m.active && Phaser.Math.Distance.Between(ex, ey, m.x, m.y) < 85) {
          this.damageMob(m, Math.round(w.damage * 1.25));
        }
      });
    };

    if (this.mobsGroup) {
      this.physics.add.overlap(proj, this.mobsGroup, (_p, mob) => {
        const targetMob = mob as DungeonMob;
        if (w.id === 'weapon_grenade_launcher') {
          triggerExplosion(targetMob.x, targetMob.y);
        } else {
          proj.destroy();
          this.damageMob(targetMob, w.damage);

          if (w.id === 'weapon_flask_launcher') {
            soundEngine.playExplosion();
            const splash = this.add.circle(targetMob.x, targetMob.y, 45, 0x10b981, 0.55).setDepth(44);
            this.tweens.add({ targets: splash, alpha: 0, scaleX: 1.3, duration: 300, onComplete: () => splash.destroy() });
            this.mobs.forEach(m => {
              if (m !== targetMob && Phaser.Math.Distance.Between(targetMob.x, targetMob.y, m.x, m.y) < 60) {
                this.damageMob(m, Math.round(w.damage * 0.7));
              }
            });
          }
        }
      });
    }

    this.time.delayedCall(w.id === 'weapon_grenade_launcher' ? 1200 : 2500, () => {
      if (proj && proj.active) {
        if (w.id === 'weapon_grenade_launcher') {
          triggerExplosion(proj.x, proj.y);
        } else {
          proj.destroy();
        }
      }
    });
  }

  private executeSkill1(dirX: number, dirY: number) {
    if (this.selectedHeroKey === 'char_zaza' && this.isMonster) {
      soundEngine.playMonsterUlt();
      const slamCircle = this.add.circle(this.player.x + dirX * 60, this.player.y + dirY * 60, 40, 0xa855f7, 0.6).setDepth(45);
      this.tweens.add({
        targets: slamCircle,
        scale: 2.2,
        alpha: 0,
        duration: 250,
        onComplete: () => slamCircle.destroy()
      });

      const baseAngle = Math.atan2(dirY, dirX);
      const angles = [baseAngle - 0.25, baseAngle, baseAngle + 0.25];
      angles.forEach(ang => {
        const dx = Math.cos(ang);
        const dy = Math.sin(ang);
        const glob = this.physics.add.sprite(this.player.x, this.player.y, 'proj_toxic_spit').setDepth(45).setScale(1.5);
        glob.setVelocity(dx * 420, dy * 420);
        if (this.mobsGroup) {
          this.physics.add.overlap(glob, this.mobsGroup, (_g, mob) => {
            glob.destroy();
            this.damageMob(mob as DungeonMob, 120);
          });
        }
        this.time.delayedCall(1200, () => { if (glob.active) glob.destroy(); });
      });
      return;
    }

    soundEngine.playCast();
    if (this.selectedHeroKey === 'char_zaza') {
      this.firePoisonGlob(this.player.x, this.player.y, dirX, dirY, 50);
      if (this.zazaDoubleSpit) {
        this.time.delayedCall(120, () => {
          const angle = Math.atan2(dirY, dirX) + 0.25;
          this.firePoisonGlob(this.player.x, this.player.y, Math.cos(angle), Math.sin(angle), 50);
        });
      }
    } else if (this.selectedHeroKey === 'char_grim') {
      this.fireTarBomb(this.player.x, this.player.y, dirX, dirY);
    } else {
      this.fireBjornEarthquake(this.player.x, this.player.y, dirX, dirY);
    }
  }

  private firePoisonGlob(x: number, y: number, dirX: number, dirY: number, dmg: number) {
    const glob = this.physics.add.sprite(x, y, 'proj_toxic_spit').setDepth(45).setScale(1.4);
    glob.setVelocity(dirX * 340, dirY * 340);
    glob.setRotation(Math.atan2(dirY, dirX));

    if (this.mobsGroup) {
      this.physics.add.overlap(glob, this.mobsGroup, (_g, mob) => {
        glob.destroy();
        soundEngine.playPoison();
        const targetMob = mob as DungeonMob;
        this.damageMob(targetMob, dmg);

        const puddle = this.add.ellipse(targetMob.x, targetMob.y, 14, 8, 0x84cc16, 0.75).setDepth(10);
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
                  this.mobs.forEach(m => {
                    if (m.active && Phaser.Math.Distance.Between(puddle.x, puddle.y, m.x, m.y) < 65) {
                      this.damageMob(m, 45);
                    }
                  });
                }
              }
            });
            this.time.delayedCall(2500, () => puddle.destroy());
          }
        });
      });
    }
  }

  private fireTarBomb(x: number, y: number, dirX: number, dirY: number) {
    const bomb = this.physics.add.sprite(x, y, 'proj_tar_bomb').setDepth(45).setScale(1.3);
    bomb.setVelocity(dirX * 300, dirY * 300);
    bomb.setRotation(Math.atan2(dirY, dirX));

    if (this.mobsGroup) {
      this.physics.add.overlap(bomb, this.mobsGroup, (_b, mob) => {
        bomb.destroy();
        soundEngine.playExplosion();
        const targetMob = mob as DungeonMob;
        this.damageMob(targetMob, 65);
        targetMob.isSlowed = true;
        const slowPuddle = this.add.circle(targetMob.x, targetMob.y, 50, 0x1e1b4b, 0.7).setDepth(15);
        this.time.delayedCall(2500, () => {
          slowPuddle.destroy();
          if (targetMob && targetMob.active) targetMob.isSlowed = false;
        });
      });
    }
  }

  private fireBjornEarthquake(x: number, y: number, dirX: number, dirY: number) {
    soundEngine.playExplosion();
    for (let step = 1; step <= 4; step++) {
      this.time.delayedCall(step * 70, () => {
        const spikeX = x + dirX * step * 42;
        const spikeY = y + dirY * step * 42;
        const spike = this.add.image(spikeX, spikeY, 'proj_rock_spike').setDepth(45).setScale(1.2);
        this.tweens.add({ targets: spike, alpha: 0, y: spikeY - 12, duration: 400, onComplete: () => spike.destroy() });
        this.mobs.forEach(mob => {
          if (Phaser.Math.Distance.Between(spikeX, spikeY, mob.x, mob.y) < 45) {
            this.damageMob(mob, 60);
          }
        });
      });
    }
  }

  private isPointInsideDungeonFloor(px: number, py: number): boolean {
    if (!this.rooms || this.rooms.length === 0) return true;

    // 1. Inside any room floor (generous room boundaries)
    for (const room of this.rooms) {
      if (Math.abs(px - room.worldX) <= room.w / 2 - 10 &&
          Math.abs(py - room.worldY) <= room.h / 2 - 10) {
        return true;
      }
    }

    // 2. Inside any corridor connecting adjacent rooms
    const cellSize = 1200;
    const doorHalfWidth = 90;

    for (const room of this.rooms) {
      const halfW = room.w / 2;
      const halfH = room.h / 2;
      const corridorLen = (cellSize - room.h) / 2 + 80;

      // North Corridor
      if (room.connections.north !== undefined) {
        if (Math.abs(px - room.worldX) <= doorHalfWidth &&
            py >= room.worldY - halfH - corridorLen && py <= room.worldY - halfH + 60) {
          return true;
        }
      }
      // South Corridor
      if (room.connections.south !== undefined) {
        if (Math.abs(px - room.worldX) <= doorHalfWidth &&
            py >= room.worldY + halfH - 60 && py <= room.worldY + halfH + corridorLen) {
          return true;
        }
      }
      // West Corridor
      if (room.connections.west !== undefined) {
        if (Math.abs(py - room.worldY) <= doorHalfWidth &&
            px >= room.worldX - halfW - corridorLen && px <= room.worldX - halfW + 60) {
          return true;
        }
      }
      // East Corridor
      if (room.connections.east !== undefined) {
        if (Math.abs(py - room.worldY) <= doorHalfWidth &&
            px >= room.worldX + halfW - 60 && px <= room.worldX + halfW + corridorLen) {
          return true;
        }
      }
    }

    return false;
  }

  private executeSkill2(dirX: number, dirY: number) {
    if (this.selectedHeroKey === 'char_zaza') {
      if (this.isMonster) {
        soundEngine.playMonsterUlt();
        this.time.addEvent({
          delay: 220,
          repeat: 2,
          callback: () => {
            if (!this.player || !this.player.active) return;
            const roar = this.add.circle(this.player.x, this.player.y, 25, 0xef4444, 0.6).setDepth(45);
            this.tweens.add({
              targets: roar,
              scale: 6,
              alpha: 0,
              duration: 350,
              onComplete: () => roar.destroy()
            });
            this.mobs.forEach(m => {
              if (m.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, m.x, m.y) < 130) {
                this.damageMob(m, 85);
              }
            });
          }
        });
      } else {
        soundEngine.playWhirlwind();
        const stick = this.add.rectangle(this.player.x, this.player.y, 80, 9, 0x78350f).setDepth(45);
        this.tweens.add({
          targets: stick,
          angle: 1080,
          duration: 800,
          onUpdate: () => {
            if (stick.active) stick.setPosition(this.player.x, this.player.y);
          },
          onComplete: () => stick.destroy()
        });

        this.time.addEvent({
          delay: 190,
          repeat: 3,
          callback: () => {
            if (!this.player || !this.player.active) return;
            this.mobs.forEach(m => {
              if (m.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, m.x, m.y) < 90) {
                this.damageMob(m, 55);
              }
            });
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
      }
    } else if (this.selectedHeroKey === 'char_grim') {
      soundEngine.playCast();
      let safeX = this.player.x;
      let safeY = this.player.y;

      for (let dist = 5; dist <= 140; dist += 5) {
        const testX = this.player.x + dirX * dist;
        const testY = this.player.y + dirY * dist;
        if (this.isPointInsideDungeonFloor(testX, testY)) {
          safeX = testX;
          safeY = testY;
        } else {
          break;
        }
      }

      this.player.setPosition(safeX, safeY);
      this.player.setAlpha(0.25);
      this.time.delayedCall(1200, () => {
        if (this.player && this.player.active) this.player.setAlpha(1.0);
      });
    } else {
      soundEngine.playAttack();
      const chargeX = this.player.x + dirX * 140;
      const chargeY = this.player.y + dirY * 140;

      this.tweens.add({
        targets: this.player,
        x: chargeX,
        y: chargeY,
        duration: 180
      });

      this.time.delayedCall(90, () => {
        this.mobs.forEach(m => {
          if (m.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, m.x, m.y) < 85) {
            this.damageMob(m, 95);
            m.x += dirX * 40;
            m.y += dirY * 40;
          }
        });
      });
    }
  }

  private executeUlt(dirX: number, dirY: number) {
    soundEngine.playExplosion();
    this.showFloatingNotice('★ АКТИВИРОВАНА СВЕРХСПОСОБНОСТЬ! ★', '#facc15');

    if (this.selectedHeroKey === 'char_zaza') {
      soundEngine.playMonsterUlt();
      this.isMonster = true;
      if (this.playerWeaponVisual) this.playerWeaponVisual.setVisible(false);
      this.player.setTexture('char_zaza_monster');
      this.player.setScale(1.8);
      this.playerHp = Math.min(this.playerMaxHp + 500, this.playerHp + 500);
      this.damageMultiplier = 1.6;

      const shock = this.add.circle(this.player.x, this.player.y, 12, 0xa855f7, 0.85).setDepth(100);
      this.tweens.add({
        targets: shock,
        scale: 16,
        alpha: 0,
        duration: 550,
        onComplete: () => shock.destroy()
      });

      this.time.delayedCall(10000, () => {
        this.isMonster = false;
        if (this.player && this.player.active) {
          this.player.setTexture('char_zaza');
          this.player.setScale(1.2);
          if (this.playerWeaponVisual) this.playerWeaponVisual.setVisible(true);
        }
        this.damageMultiplier = 1.0;
      });
    } else if (this.selectedHeroKey === 'char_grim') {
      const potX = this.player.x + dirX * 80;
      const potY = this.player.y + dirY * 80;
      const pot = this.add.image(potX, potY, 'proj_cauldron').setDepth(45).setScale(1.4);
      this.time.delayedCall(1400, () => {
        if (pot.active) pot.destroy();
        soundEngine.playExplosion();
        const expRing = this.add.circle(potX, potY, 120, 0xef4444, 0.85).setDepth(46);
        this.tweens.add({ targets: expRing, scaleX: 1.5, scaleY: 1.5, alpha: 0, duration: 350, onComplete: () => expRing.destroy() });

        this.mobs.forEach(mob => {
          if (mob.active && Phaser.Math.Distance.Between(potX, potY, mob.x, mob.y) < 140) {
            this.damageMob(mob, 220);
          }
        });
      });
    } else {
      soundEngine.playWhirlwind();
      const activeAxe = this.add.rectangle(this.player.x, this.player.y, 95, 16, 0xe2e8f0).setDepth(100);

      this.tweens.add({
        targets: [activeAxe, this.player],
        angle: 1440,
        duration: 1800,
        onUpdate: () => {
          if (activeAxe.active) activeAxe.setPosition(this.player.x, this.player.y);
        },
        onComplete: () => {
          if (this.player && this.player.active) this.player.angle = 0;
          if (activeAxe.active) activeAxe.destroy();
        }
      });

      this.time.addEvent({
        delay: 220,
        repeat: 7,
        callback: () => {
          if (!this.player || !this.player.active) return;
          this.mobs.forEach(mob => {
            if (mob.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, mob.x, mob.y) < 110) {
              this.damageMob(mob, 75);
            }
          });
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

  private upgradeModalObjects: Phaser.GameObjects.GameObject[] = [];

  // --- UPGRADE CARDS MODAL ---
  private buildUpgradeModal() {
    // Initialized dynamically on open
  }

  private closeUpgradeModal() {
    this.isUpgradeModalOpen = false;
    this.upgradeModalObjects.forEach(obj => {
      if (obj && obj.destroy) obj.destroy();
    });
    this.upgradeModalObjects = [];
  }

  private openUpgradeModal() {
    this.player.setVelocity(0, 0);
    this.closeUpgradeModal();
    this.isUpgradeModalOpen = true;

    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Dark backdrop overlay
    const backdrop = this.add.rectangle(w / 2, h / 2, w * 2, h * 2, 0x000000, 0.88)
      .setScrollFactor(0).setDepth(890).setInteractive();

    const modalBg = this.add.rectangle(w / 2, h / 2, 700, 380, 0x0f172a)
      .setStrokeStyle(3, 0xfacc15).setScrollFactor(0).setDepth(891);

    const mainTitle = this.add.text(w / 2, h / 2 - 155, '✦ ВЫБЕРИТЕ КАРТОЧКУ УЛУЧШЕНИЯ ✦', {
      fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold', color: '#facc15'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(892);

    this.upgradeModalObjects.push(backdrop, modalBg, mainTitle);

    const commonCards: UpgradeCard[] = [
      {
        id: 'up_hp',
        title: 'КРЕПКОЕ ЗДОРОВЬЕ',
        type: 'common',
        icon: 'heart_pickup',
        desc: '+250 Макс. HP и мгновенное исцеление.',
        effect: (sc) => {
          sc.playerMaxHp += 250;
          sc.playerHp = sc.playerMaxHp;
          sc.updateHUD();
        }
      },
      {
        id: 'up_speed',
        title: 'САПОГИ СКОРОСТИ',
        type: 'common',
        icon: 'skill_grim_2',
        desc: '+20% к скорости передвижения.',
        effect: (sc) => {
          sc.playerSpeed = Math.round(sc.playerSpeed * 1.2);
        }
      },
      {
        id: 'up_energy',
        title: 'ЭНЕРГИЯ ТИТАНА',
        type: 'common',
        icon: 'potion_energy',
        desc: '+50 Макс. Энергии и ускоренная регенерация.',
        effect: (sc) => {
          sc.playerMaxEnergy += 50;
          sc.playerEnergy = sc.playerMaxEnergy;
          sc.energyRegenRate += 8;
          sc.updateHUD();
        }
      },
      {
        id: 'up_damage',
        title: 'ОСТРЫЕ ЛЕЗВИЯ',
        type: 'common',
        icon: 'relic_damage',
        desc: '+25% урона от всех атак и навыков.',
        effect: (sc) => {
          sc.damageMultiplier += 0.25;
        }
      }
    ];

    const heroCards: Record<string, UpgradeCard[]> = {
      char_zaza: [
        {
          id: 'zaza_double_spit',
          title: 'ДВОЙНОЙ ПЛЕВОК',
          type: 'hero',
          icon: 'skill_zaza_1',
          desc: 'Плевок ядом выпускает 2 ядовитых сгустка веером!',
          effect: (sc) => { sc.zazaDoubleSpit = true; }
        },
        {
          id: 'zaza_poison_trail',
          title: 'ТОКСИЧНЫЙ СЛЕД',
          type: 'hero',
          icon: 'skill_zaza_2',
          desc: 'Заза оставляет за собой обжигающий ядовитый след при беге.',
          effect: (sc) => { sc.zazaPoisonTrail = true; }
        },
        {
          id: 'zaza_acid_geyser',
          title: 'КИСЛОТНЫЙ ГЕЙЗЕР',
          type: 'hero',
          icon: 'skill_zaza_1',
          desc: 'Плевок ядом взрывается 3 мощными фонтанами кислоты (+80% урона).',
          effect: (sc) => { sc.damageMultiplier += 0.35; }
        },
        {
          id: 'zaza_mutant_spikes',
          title: 'ШИПЫ СКВЕРНЫ',
          type: 'hero',
          icon: 'skill_zaza_2',
          desc: 'Вращение дубинки выпускает 8 ядовитых шипов во все стороны!',
          effect: (sc) => { sc.damageMultiplier += 0.25; }
        }
      ],
      char_grim: [
        {
          id: 'grim_double_bullet',
          title: 'ДВОЙНОЙ ВЫСТРЕЛ',
          type: 'hero',
          icon: 'weapon_pistols',
          desc: 'Все дальние атаки и пистоли выпускают 2 пули/болта подряд!',
          effect: (sc) => { sc.grimDoubleBullet = true; }
        },
        {
          id: 'grim_cluster_bomb',
          title: 'КАССЕТНАЯ СМОЛА',
          type: 'hero',
          icon: 'skill_grim_1',
          desc: 'Смоляная бомба распадается на 3 мини-ловушки.',
          effect: (sc) => { sc.grimClusterBomb = true; }
        },
        {
          id: 'grim_flask_nova',
          title: 'КОЛБОВЫЙ ВЕЕР',
          type: 'hero',
          icon: 'weapon_flask_launcher',
          desc: 'Бросок флаконов выпускает веер из 5 алхимических бомб!',
          effect: (sc) => { sc.grimDoubleBullet = true; sc.damageMultiplier += 0.3; }
        },
        {
          id: 'grim_shadow_clone',
          title: 'ТЕНЕВОЙ ДВОЙНИК',
          type: 'hero',
          icon: 'skill_grim_2',
          desc: 'Теневой рывок оставляет взрывающуюся теневую ловушку-приманку.',
          effect: (sc) => { sc.damageMultiplier += 0.25; }
        }
      ],
      char_bjorn: [
        {
          id: 'bjorn_fire_whirl',
          title: 'ОГНЕННЫЙ ВИХРЬ',
          type: 'hero',
          icon: 'skill_bjorn_3',
          desc: 'Вихрь топоров поджигает противников и притягивает их к берсерку.',
          effect: (sc) => { sc.bjornFireWhirl = true; }
        },
        {
          id: 'bjorn_lightning_slam',
          title: 'ГРОМОВОЙ УДАР',
          type: 'hero',
          icon: 'skill_bjorn_1',
          desc: 'Землетрясение призывает разряды молний по каменным шипам!',
          effect: (sc) => { sc.damageMultiplier += 0.35; }
        },
        {
          id: 'bjorn_berserk_fury',
          title: 'ЯРОСТЬ БЕРСЕРКА',
          type: 'hero',
          icon: 'skill_bjorn_2',
          desc: 'Когда HP падает ниже 50%, скорость атаки и бега возрастает на 60%!',
          effect: (sc) => { sc.playerSpeed = Math.round(sc.playerSpeed * 1.25); sc.damageMultiplier += 0.3; }
        }
      ]
    };

    const specific = heroCards[this.selectedHeroKey] || [];
    const available = [...commonCards, ...specific].filter(c => !this.appliedUpgradeCards.includes(c.id));
    Phaser.Utils.Array.Shuffle(available);
    const choices = available.slice(0, 3);

    const cardOffsets = [-210, 0, 210];
    choices.forEach((card, idx) => {
      const cx = w / 2 + cardOffsets[idx];
      const cy = h / 2 + 15;

      const cardBg = this.add.rectangle(cx, cy, 195, 250, 0x1e293b)
        .setStrokeStyle(3, card.type === 'hero' ? 0xc084fc : 0x38bdf8)
        .setScrollFactor(0).setDepth(900).setInteractive({ useHandCursor: true });

      const icon = this.add.image(cx, cy - 70, card.icon)
        .setScale(1.6).setScrollFactor(0).setDepth(901);

      const title = this.add.text(cx, cy - 22, card.title, {
        fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', color: card.type === 'hero' ? '#c084fc' : '#38bdf8',
        wordWrap: { width: 175 }, align: 'center'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(901);

      const desc = this.add.text(cx, cy + 30, card.desc, {
        fontSize: '11px', fontFamily: 'monospace', color: '#e2e8f0',
        wordWrap: { width: 175 }, align: 'center', lineSpacing: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(901);

      const selectBtn = this.add.rectangle(cx, cy + 92, 130, 32, 0x16a34a)
        .setStrokeStyle(2, 0x86efac).setScrollFactor(0).setDepth(902).setInteractive({ useHandCursor: true });

      const selectTxt = this.add.text(cx, cy + 92, 'ВЫБРАТЬ', {
        fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(903);

      cardBg.on('pointerover', () => {
        cardBg.setStrokeStyle(4, 0xfacc15);
        selectBtn.setFillStyle(0x22c55e);
      });
      cardBg.on('pointerout', () => {
        cardBg.setStrokeStyle(3, card.type === 'hero' ? 0xc084fc : 0x38bdf8);
        selectBtn.setFillStyle(0x16a34a);
      });

      let picked = false;
      const onPick = () => {
        if (picked) return;
        picked = true;
        soundEngine.playLevelUp();
        this.appliedUpgradeCards.push(card.id);
        card.effect(this);
        this.closeUpgradeModal();
        this.showFloatingNotice(`ПРИМЕНЕНО: ${card.title}!`, '#4ade80');
      };

      cardBg.on('pointerdown', onPick);
      selectBtn.on('pointerdown', onPick);
      cardBg.on('pointerup', onPick);
      selectBtn.on('pointerup', onPick);

      this.upgradeModalObjects.push(cardBg, icon, title, desc, selectBtn, selectTxt);
    });
  }

  // --- MINIMAP (SQUARE HUD RADAR) ---
  private buildMinimap() {
    const w = this.cameras.main.width;
    const mapSize = 120;
    const mapX = w - 85;
    const mapY = 85;

    this.minimapContainer = this.add.container(mapX, mapY).setScrollFactor(0).setDepth(200);
    const bgOuter = this.add.rectangle(0, 0, mapSize + 6, mapSize + 6, 0x0f172a, 0.95).setStrokeStyle(3, 0x38bdf8);
    const bgInner = this.add.rectangle(0, 0, mapSize, mapSize, 0x050a0e, 0.95);
    this.minimapGfx = this.add.graphics();

    this.minimapContainer.add([bgOuter, bgInner, this.minimapGfx]);
    this.updateMinimap();
  }

  private updateMinimap() {
    if (!this.minimapGfx) return;
    this.minimapGfx.clear();

    // Clear old text icons
    this.minimapIcons.forEach(ic => ic.destroy());
    this.minimapIcons = [];

    const originCellX = 0;
    const originCellY = 0;
    const scale = 32;

    this.rooms.forEach(room => {
      const rx = (room.gridX - originCellX) * scale;
      const ry = (room.gridY - originCellY) * scale;

      if (!room.visited) {
        // Dark unvisited outline
        this.minimapGfx.fillStyle(0x18181b, 0.9);
        this.minimapGfx.fillRect(rx - 12, ry - 12, 24, 24);
        this.minimapGfx.lineStyle(1, 0x3f3f46);
        this.minimapGfx.strokeRect(rx - 12, ry - 12, 24, 24);
        return;
      }

      // Visited room
      const isCurrent = room.id === this.currentRoomId;
      this.minimapGfx.fillStyle(isCurrent ? 0x22c55e : 0xf8fafc, 0.9);
      this.minimapGfx.fillRect(rx - 12, ry - 12, 24, 24);
      this.minimapGfx.lineStyle(2, isCurrent ? 0x86efac : 0x94a3b8);
      this.minimapGfx.strokeRect(rx - 12, ry - 12, 24, 24);

      // Room Icon on Minimap
      let iconSymbol = '';
      if (room.type === 'shop') iconSymbol = '🛒';
      else if (room.type === 'companion') iconSymbol = '🐾';
      else if (room.type === 'portal') iconSymbol = '🕳';
      else if (room.type === 'boss') iconSymbol = '☠';
      else if (room.type === 'combat' && !room.cleared) iconSymbol = '⚔';

      if (iconSymbol) {
        const iconTxt = this.add.text(rx, ry, iconSymbol, {
          fontSize: '11px', fontFamily: 'monospace'
        }).setOrigin(0.5);
        this.minimapContainer.add(iconTxt);
        this.minimapIcons.push(iconTxt);
      }
    });
  }

  // --- HUD ---
  private buildHUD() {
    const w = this.cameras.main.width;

    // HP Bar
    this.add.rectangle(120, 24, 200, 16, 0x1f2937).setScrollFactor(0).setDepth(200);
    this.hpFill = this.add.rectangle(20, 24, 196, 12, 0x22c55e).setOrigin(0, 0.5).setScrollFactor(0).setDepth(201);
    this.hpText = this.add.text(120, 24, '', {
      fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    // Energy Bar
    this.add.rectangle(120, 44, 200, 10, 0x1f2937).setScrollFactor(0).setDepth(200);
    this.energyFill = this.add.rectangle(20, 44, 196, 6, 0x38bdf8).setOrigin(0, 0.5).setScrollFactor(0).setDepth(201);
    this.energyText = this.add.text(120, 44, 'ЭНЕРГИЯ 100/100', {
      fontSize: '9px', fontFamily: 'monospace', color: '#e0f2fe'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    // Top Center: Floor Badge & Gold
    this.floorBadgeText = this.add.text(w / 2, 22, `ЭТАЖ [ ${this.currentFloor} / ${this.maxFloors} ]`, {
      fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', color: '#38bdf8'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    this.goldText = this.add.text(w / 2, 44, `ЗОЛОТО: ${this.dungeonGold} 💰`, {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', color: '#facc15'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    // Exit Button
    const exitBtn = this.add.text(w - 70, 26, '[ ВЫХОД ]', {
      fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: '#f87171',
      backgroundColor: '#27272a', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202).setInteractive({ useHandCursor: true });
    exitBtn.on('pointerdown', () => {
      soundEngine.playClick();
      this.scene.start('HubScene');
    });

    // Interaction Prompt
    this.interactPromptText = this.add.text(w / 2, this.cameras.main.height - 180, '', {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color: '#fef08a',
      backgroundColor: '#1f2937', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setVisible(false).setInteractive({ useHandCursor: true });
    this.interactPromptText.on('pointerdown', () => {
      if (this.currentInteraction) this.currentInteraction();
    });

    // Boss Top Bar
    this.bossHpContainer = this.add.container(w / 2, 85).setScrollFactor(0).setDepth(250).setVisible(false);
    const bossBg = this.add.rectangle(0, 0, 324, 20, 0x000000).setStrokeStyle(2, 0xef4444);
    this.bossHpFill = this.add.rectangle(-160, 0, 320, 16, 0xdc2626).setOrigin(0, 0.5);
    this.bossHpText = this.add.text(0, 0, 'БОСС: ПРОКЛЯТЫЙ РЫЦАРЬ [3000 / 3000]', {
      fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);
    this.bossHpContainer.add([bossBg, this.bossHpFill, this.bossHpText]);

    this.updateHUD();
  }

  private updateHUD() {
    if (!this.hpFill || !this.hpFill.active || !this.energyFill || !this.energyFill.active || !this.hpText || !this.energyText) return;
    const pPct = Math.max(0, this.playerHp / this.playerMaxHp);
    if (this.hpFill && typeof this.hpFill.setDisplaySize === 'function') {
      this.hpFill.setDisplaySize(Math.max(1, 196 * pPct), 12);
    }
    this.hpText.setText(`${this.heroData.name.split(' ')[0]} ${this.playerHp}/${this.playerMaxHp}`);

    const ePct = Math.max(0, this.playerEnergy / this.playerMaxEnergy);
    if (this.energyFill && typeof this.energyFill.setDisplaySize === 'function') {
      this.energyFill.setDisplaySize(Math.max(1, 196 * ePct), 6);
    }
    this.energyText.setText(`ЭНЕРГИЯ: ${Math.round(this.playerEnergy)}/${this.playerMaxEnergy}`);
  }

  // --- TOUCH CONTROLS WITH SPRITE ICONS ---
  private buildTouchControls() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Joystick
    this.joyStickBase = this.add.circle(100, h - 100, 52, 0x27272a, 0.6).setScrollFactor(0).setDepth(210).setInteractive();
    this.joyStickThumb = this.add.circle(100, h - 100, 26, 0x71717a, 0.8).setScrollFactor(0).setDepth(211);

    this.joyStickBase.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.joyStickPointerId = p.id;
      this.updateJoystick(p.x, p.y);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.joyStickPointerId === p.id) this.updateJoystick(p.x, p.y);
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.joyStickPointerId === p.id) {
        this.joyStickPointerId = null;
        this.joyStickVector.set(0, 0);
        this.joyStickThumb.setPosition(100, h - 100);
      }
    });

    // 1. RED AIM & SHOOT JOYSTICK (Aiming Joystick on Right Side)
    const aimX = w - 90;
    const aimY = h - 90;
    this.aimJoyBase = this.add.circle(aimX, aimY, 52, 0x450a0a, 0.75)
      .setStrokeStyle(3, 0xef4444).setScrollFactor(0).setDepth(210).setInteractive();
    this.aimJoyThumb = this.add.circle(aimX, aimY, 26, 0xdc2626, 0.95)
      .setStrokeStyle(2, 0xfca5a5).setScrollFactor(0).setDepth(211);
    this.attackBtnIcon = this.add.image(aimX, aimY - 4, this.currentWeapon.texture)
      .setScale(1.3).setScrollFactor(0).setDepth(212);
    this.attackBtnLabel = this.add.text(aimX, aimY + 18, 'ПРИЦЕЛ/АТАКА', {
      fontSize: '8px', fontFamily: 'monospace', fontStyle: 'bold', color: '#fca5a5'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(212);

    const atkCdOverlay = this.add.rectangle(aimX, aimY, 80, 80, 0x000000, 0.6).setScrollFactor(0).setDepth(213).setVisible(false);
    this.cdOverlays.attack = atkCdOverlay;

    this.aimLineGfx = this.add.graphics().setDepth(48);

    this.aimJoyBase.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.aimJoyPointerId = p.id;
      this.updateAimJoystick(p.x, p.y);
      this.executeCombatSkill('attack');
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.joyStickPointerId === p.id) this.updateJoystick(p.x, p.y);
      if (this.aimJoyPointerId === p.id) this.updateAimJoystick(p.x, p.y);
    });

    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.joyStickPointerId === p.id) {
        this.joyStickPointerId = null;
        this.joyStickVector.set(0, 0);
        this.joyStickThumb.setPosition(100, h - 100);
      }
      if (this.aimJoyPointerId === p.id) {
        this.aimJoyPointerId = null;
        this.aimJoyThumb.setPosition(aimX, aimY);
        if (this.aimJoyVector.lengthSq() > 0.05) {
          this.executeCombatSkill('attack');
        }
        this.aimJoyVector.set(0, 0);
        this.aimLineGfx.clear();
      }
    });

    // 1b. DUAL WEAPON SLOTS & BIG PROMINENT WEAPON SWITCH BUTTON
    const swX = w - 60;
    const swY = h - 220;

    // Big Main Weapon Switch Button (58x58)
    const bigSwitchBg = this.add.rectangle(swX, swY, 58, 58, 0x181c2b, 0.95)
      .setStrokeStyle(2, 0x0284c7).setScrollFactor(0).setDepth(210).setInteractive({ useHandCursor: true });

    this.weaponSlot1Icon = this.add.image(swX - 10, swY - 5, this.weapons[0]?.texture || 'weapon_stick')
      .setScale(1.1).setScrollFactor(0).setDepth(211);
    this.weaponSlot2Icon = this.add.image(swX + 10, swY - 5, this.weapons[1]?.texture || 'weapon_stick')
      .setScale(1.1).setScrollFactor(0).setDepth(211).setVisible(this.weapons[1] !== null);

    const swLbl = this.add.text(swX, swY + 16, '🔄 СМЕНА', {
      fontSize: '8px', fontFamily: 'monospace', fontStyle: 'bold', color: '#38bdf8'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(212);

    const doSwitch = () => {
      soundEngine.playClick();
      this.switchWeapon();
      this.tweens.add({ targets: bigSwitchBg, scaleX: 1.15, scaleY: 1.15, duration: 100, yoyo: true });
    };

    bigSwitchBg.on('pointerdown', doSwitch);
    this.weaponSlot1Border = bigSwitchBg;
    this.weaponSlot2Border = bigSwitchBg;

    this.updateWeaponSlotsUI();

    // 2. SKILL 1
    const s1X = w - 180;
    const s1Y = h - 65;
    const s1Circle = this.add.circle(s1X, s1Y, 26, 0x16a34a, 0.85).setScrollFactor(0).setDepth(210).setInteractive({ useHandCursor: true });
    this.skill1BtnIcon = this.add.image(s1X, s1Y, this.heroData.skills[0]?.icon || 'skill_zaza_1').setScale(1.0).setScrollFactor(0).setDepth(211);
    this.add.text(s1X, s1Y + 15, '[ 1 ]', { fontSize: '8px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5).setScrollFactor(0).setDepth(212);
    const s1CdOverlay = this.add.rectangle(s1X, s1Y, 52, 52, 0x000000, 0.6).setScrollFactor(0).setDepth(213).setVisible(false);
    const s1CdTxt = this.add.text(s1X, s1Y, '', { fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5).setScrollFactor(0).setDepth(214);
    this.cdOverlays.s1 = s1CdOverlay;
    this.cdTextLabels.s1 = s1CdTxt;
    s1Circle.on('pointerdown', () => this.executeCombatSkill('s1'));

    // 3. SKILL 2
    const s2X = w - 175;
    const s2Y = h - 135;
    const s2Circle = this.add.circle(s2X, s2Y, 26, 0x2563eb, 0.85).setScrollFactor(0).setDepth(210).setInteractive({ useHandCursor: true });
    this.skill2BtnIcon = this.add.image(s2X, s2Y, this.heroData.skills[1]?.icon || 'skill_zaza_2').setScale(1.0).setScrollFactor(0).setDepth(211);
    this.add.text(s2X, s2Y + 15, '[ 2 ]', { fontSize: '8px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5).setScrollFactor(0).setDepth(212);
    const s2CdOverlay = this.add.rectangle(s2X, s2Y, 52, 52, 0x000000, 0.6).setScrollFactor(0).setDepth(213).setVisible(false);
    const s2CdTxt = this.add.text(s2X, s2Y, '', { fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5).setScrollFactor(0).setDepth(214);
    this.cdOverlays.s2 = s2CdOverlay;
    this.cdTextLabels.s2 = s2CdTxt;
    s2Circle.on('pointerdown', () => this.executeCombatSkill('s2'));

    // 4. ULTIMATE
    const ultX = w - 135;
    const ultY = h - 200;
    const ultCircle = this.add.circle(ultX, ultY, 28, 0x9333ea, 0.9).setStrokeStyle(3, 0xfacc15).setScrollFactor(0).setDepth(210).setInteractive({ useHandCursor: true });
    this.ultBtnIcon = this.add.image(ultX, ultY, this.heroData.skills[2]?.icon || 'skill_zaza_3').setScale(1.1).setScrollFactor(0).setDepth(211);
    this.add.text(ultX, ultY + 17, '[ ★ ]', { fontSize: '8px', fontFamily: 'monospace', fontStyle: 'bold', color: '#fef08a' }).setOrigin(0.5).setScrollFactor(0).setDepth(212);
    const ultCdOverlay = this.add.rectangle(ultX, ultY, 56, 56, 0x000000, 0.6).setScrollFactor(0).setDepth(213).setVisible(false);
    const ultCdTxt = this.add.text(ultX, ultY, '', { fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5).setScrollFactor(0).setDepth(214);
    this.cdOverlays.ult = ultCdOverlay;
    this.cdTextLabels.ult = ultCdTxt;
    ultCircle.on('pointerdown', () => this.executeCombatSkill('ult'));
  }

  private updateJoystick(px: number, py: number) {
    const dx = px - this.joyStickBase.x;
    const dy = py - this.joyStickBase.y;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 52);
    const angle = Math.atan2(dy, dx);
    this.joyStickThumb.setPosition(
      this.joyStickBase.x + Math.cos(angle) * dist,
      this.joyStickBase.y + Math.sin(angle) * dist
    );
    this.joyStickVector.set(Math.cos(angle) * (dist / 52), Math.sin(angle) * (dist / 52));
  }

  private updateAimJoystick(px: number, py: number) {
    if (!this.aimJoyBase) return;
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const baseX = w - 90;
    const baseY = h - 90;

    const dx = px - baseX;
    const dy = py - baseY;
    const angle = Math.atan2(dy, dx);
    const dist = Math.min(45, Math.sqrt(dx * dx + dy * dy));

    this.aimJoyThumb.setPosition(baseX + Math.cos(angle) * dist, baseY + Math.sin(angle) * dist);
    this.aimJoyVector.set(Math.cos(angle), Math.sin(angle));

    if (Math.cos(angle) !== 0) {
      this.player.setFlipX(Math.cos(angle) < 0);
    }

    if (this.aimLineGfx) {
      this.aimLineGfx.clear();
      this.aimLineGfx.lineStyle(3, 0xef4444, 0.9);
      this.aimLineGfx.lineBetween(
        this.player.x,
        this.player.y,
        this.player.x + Math.cos(angle) * 200,
        this.player.y + Math.sin(angle) * 200
      );
      this.aimLineGfx.fillStyle(0xef4444, 1.0);
      this.aimLineGfx.fillCircle(
        this.player.x + Math.cos(angle) * 200,
        this.player.y + Math.sin(angle) * 200,
        6
      );
    }
  }

  // --- INTERACTION HELPER ---
  private setInteraction(text: string, callback: () => void) {
    this.interactPromptText.setText(text);
    this.interactPromptText.setVisible(true);
    this.currentInteraction = callback;
    if (this.player) {
      this.interactionPos = { x: this.player.x, y: this.player.y };
    }
  }

  private clearInteraction() {
    this.interactPromptText.setVisible(false);
    this.currentInteraction = null;
    this.interactionPos = null;
  }

  // --- PERIODIC LOOP ---
  private handlePeriodicState() {
    if (this.playerEnergy < this.playerMaxEnergy) {
      this.playerEnergy = Math.min(this.playerMaxEnergy, this.playerEnergy + this.energyRegenRate * 0.4);
      this.updateHUD();
    }

    if (this.zazaPoisonTrail && this.player.body && (this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0)) {
      const p = this.add.circle(this.player.x, this.player.y, 16, 0x15803d, 0.45).setDepth(15);
      this.time.delayedCall(2000, () => p.destroy());
    }
  }

  // --- PICKUPS ---
  private spawnPickup(x: number, y: number, type: 'heart' | 'coin') {
    const p = this.physics.add.sprite(x, y, type === 'heart' ? 'heart_pickup' : 'coin_pickup').setDepth(20);
    p.setData('type', type);
    this.pickups.add(p);
  }

  private collectPickup(p: Phaser.Physics.Arcade.Sprite) {
    const type = p.getData('type');
    p.destroy();
    soundEngine.playClick();

    if (type === 'heart') {
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + 180);
      this.updateHUD();
      this.showDamageNumber(this.player.x, this.player.y - 20, '+180 HP', '#4ade80');
    } else {
      this.dungeonGold += 12;
      this.goldText.setText(`ЗОЛОТО: ${this.dungeonGold}`);
      this.showDamageNumber(this.player.x, this.player.y - 20, '+12 ЗОЛОТА', '#facc15');
    }
  }

  // --- FLOATING TEXT & SCREENS ---
  private showDamageNumber(x: number, y: number, text: string, color: string) {
    const t = this.add.text(x, y, text, {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color
    }).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: t, y: y - 28, alpha: 0, duration: 600, onComplete: () => t.destroy() });
  }

  private showFloatingNotice(text: string, color: string) {
    const t = this.add.text(this.cameras.main.width / 2, 140, text, {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color,
      backgroundColor: '#09090b', padding: { x: 14, y: 6 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(500);
    this.tweens.add({ targets: t, y: 120, alpha: 0, duration: 2000, onComplete: () => t.destroy() });
  }

  private showVictoryScreen() {
    soundEngine.playLevelUp();
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.add.rectangle(w / 2, h / 2, w * 2, h * 2, 0x000000, 0.85).setScrollFactor(0).setDepth(700);
    this.add.text(w / 2, h / 2 - 80, '★ ПОЛНАЯ ПОБЕДА: ПОДЗЕМЕЛЬЕ 7/7 ПРОЙДЕНО! ★', {
      fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold', color: '#facc15'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(701);

    this.add.text(w / 2, h / 2 - 20, `СОБРАНО ЗОЛОТА: ${this.dungeonGold} 💰`, {
      fontSize: '18px', fontFamily: 'monospace', color: '#4ade80'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(701);

    const returnBtn = this.add.text(w / 2, h / 2 + 60, '[ ВЕРНУТЬСЯ В ХАБ ]', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff',
      backgroundColor: '#2563eb', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(701).setInteractive({ useHandCursor: true });

    returnBtn.on('pointerdown', () => {
      soundEngine.playClick();
      this.scene.start('HubScene');
    });
  }

  private showDefeatScreen() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    this.add.rectangle(w / 2, h / 2, w * 2, h * 2, 0x000000, 0.85).setScrollFactor(0).setDepth(700);

    this.add.text(w / 2, h / 2 - 60, `☠ ВЫ ПАЛИ НА ЭТАЖЕ ${this.currentFloor}/${this.maxFloors} ☠`, {
      fontSize: '24px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ef4444'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(701);

    const retryBtn = this.add.text(w / 2, h / 2 + 40, '[ В ХАБ ]', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff',
      backgroundColor: '#7f1d1d', padding: { x: 18, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(701).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerdown', () => {
      soundEngine.playClick();
      this.scene.start('HubScene');
    });
  }

  // --- GAME UPDATE LOOP ---
  update(_time: number, delta: number) {
    if (this.isUpgradeModalOpen) return;

    // Cooldown ticks
    for (const key of Object.keys(this.cds)) {
      if (this.cds[key] > 0) {
        this.cds[key] = Math.max(0, this.cds[key] - delta);
        if (this.cdOverlays[key]) this.cdOverlays[key].setVisible(true);
        if (this.cdTextLabels[key]) {
          this.cdTextLabels[key].setText(`${(this.cds[key] / 1000).toFixed(1)}`);
          this.cdTextLabels[key].setVisible(true);
        }
      } else {
        if (this.cdOverlays[key]) this.cdOverlays[key].setVisible(false);
        if (this.cdTextLabels[key]) this.cdTextLabels[key].setVisible(false);
      }
    }

    if (!this.isPlayerDown) {
      let vx = 0;
      let vy = 0;

      if (this.cursors) {
        if (this.cursors.left?.isDown || (this.keys?.A && this.keys.A.isDown)) vx = -1;
        if (this.cursors.right?.isDown || (this.keys?.D && this.keys.D.isDown)) vx = 1;
        if (this.cursors.up?.isDown || (this.keys?.W && this.keys.W.isDown)) vy = -1;
        if (this.cursors.down?.isDown || (this.keys?.S && this.keys.S.isDown)) vy = 1;
      }

      if (this.joyStickVector.length() > 0.1) {
        vx = this.joyStickVector.x;
        vy = this.joyStickVector.y;
      }

      if (vx !== 0 || vy !== 0) {
        const len = Math.sqrt(vx * vx + vy * vy);
        this.player.setVelocity((vx / len) * this.playerSpeed, (vy / len) * this.playerSpeed);
        this.aimVector.set(vx / len, vy / len);
        if (vx < 0) this.player.setFlipX(true);
        else if (vx > 0) this.player.setFlipX(false);
      } else {
        this.player.setVelocity(0, 0);
      }

      // Continuous shooting when dragging Red Aim Joystick
      if (this.aimJoyPointerId !== null && this.aimJoyVector.lengthSq() > 0.05) {
        if (this.cds.attack <= 0) {
          this.executeCombatSkill('attack');
        }
      }

      // Auto-clear interaction prompt when player steps away
      if (this.currentInteraction && this.interactionPos) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.interactionPos.x, this.interactionPos.y);
        if (dist > 90) {
          this.clearInteraction();
        }
      }

      // Enforce Room Lock during active combat & Strict Floor Guard
      const curRoom = this.rooms.find(r => r.id === this.currentRoomId);
      if (curRoom && !curRoom.cleared) {
        const minX = curRoom.worldX - curRoom.w / 2 + 30;
        const maxX = curRoom.worldX + curRoom.w / 2 - 30;
        const minY = curRoom.worldY - curRoom.h / 2 + 30;
        const maxY = curRoom.worldY + curRoom.h / 2 - 30;
        this.player.x = Phaser.Math.Clamp(this.player.x, minX, maxX);
        this.player.y = Phaser.Math.Clamp(this.player.y, minY, maxY);
      } else {
        if (!this.isPointInsideDungeonFloor(this.player.x, this.player.y)) {
          const lastX = this.player.getData('lastValidX');
          const lastY = this.player.getData('lastValidY');
          if (lastX !== undefined && lastY !== undefined) {
            this.player.setPosition(lastX, lastY);
            this.player.setVelocity(0, 0);
          }
        } else {
          this.player.setData('lastValidX', this.player.x);
          this.player.setData('lastValidY', this.player.y);
        }
      }
      if (this.playerWeaponVisual) {
        const facingRight = !this.player.flipX;
        this.playerWeaponVisual.setPosition(this.player.x + (facingRight ? 16 : -16), this.player.y + 4);
        this.playerWeaponVisual.setFlipX(!facingRight);
      }

      // Hotkey attacks
      if (this.keys?.SPACE && Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.executeCombatSkill('attack');
      if (this.keys?.ONE && Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.executeCombatSkill('s1');
      if (this.keys?.TWO && Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.executeCombatSkill('s2');
      if (this.keys?.THREE && Phaser.Input.Keyboard.JustDown(this.keys.THREE)) this.executeCombatSkill('ult');
    }

    this.checkRoomTriggers();
    this.updateMobs(delta);
  }
}
