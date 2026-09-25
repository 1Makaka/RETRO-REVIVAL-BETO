/**
 * Frantic Battles - Soul Knight Style Procedural Dungeon Scene
 * Features 5 distinct rooms, doors that lock, monster waves,
 * Ancient Golem Boss with HP bar & phases, co-op multiplayer via BroadcastChannel,
 * and Knockout / Revive ("ПОМОЩЬ") mechanics!
 */

import Phaser from 'phaser';
import { HEROES, HeroData } from '../players';
import { soundEngine } from '../audio';

interface DungeonMob extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  maxHp: number;
  mobType: 'skeleton' | 'slime' | 'mage' | 'boss';
  speed: number;
  damage: number;
  attackCd: number;
  roomId: number;
  hpBar?: Phaser.GameObjects.Rectangle;
  hpBarBg?: Phaser.GameObjects.Rectangle;
  isSlowed?: boolean;
}

interface RoomData {
  id: number;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'spawn' | 'battle' | 'shrine' | 'boss';
  cleared: boolean;
  active: boolean;
  mobCount: number;
  doorNorth?: Phaser.GameObjects.Image;
  doorSouth?: Phaser.GameObjects.Image;
  chest?: Phaser.GameObjects.Image;
  chestOpened?: boolean;
}

export class DungeonScene extends Phaser.Scene {
  private heroData!: HeroData;
  private selectedHeroKey: string = 'char_zaza';
  private mode: 'solo' | 'online' = 'solo';
  private roomCode: string = '#DUNGEON-7419';

  // Player
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerHp: number = 1000;
  private playerMaxHp: number = 1000;
  private playerSpeed: number = 290;
  private isPlayerDown: boolean = false;
  private bleedoutTimer: number = 30;
  private isMonster: boolean = false;
  private monsterTimer: Phaser.Time.TimerEvent | null = null;

  // Companion / Ally
  private ally!: Phaser.Physics.Arcade.Sprite;
  private allyHp: number = 900;
  private allyMaxHp: number = 900;
  private allyName: string = 'ГРИМ (Соратник)';
  private isAllyDown: boolean = false;
  private allyBleedoutTimer: number = 30;
  private allyHeroKey: string = 'char_grim';

  // Revive Mechanic
  private reviveButtonUI!: Phaser.GameObjects.Text;
  private reviveProgressBg!: Phaser.GameObjects.Rectangle;
  private reviveProgressFill!: Phaser.GameObjects.Rectangle;
  private isReviving: boolean = false;
  private currentReviveTween: Phaser.Tweens.Tween | null = null;
  private reviveProgress: number = 0; // 0 to 1
  private targetToRevive: 'player' | 'ally' | null = null;

  // Dungeon Rooms & Walls
  private rooms: RoomData[] = [];
  private currentRoomId: number = 0;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private doors!: Phaser.Physics.Arcade.StaticGroup;
  private mobs: DungeonMob[] = [];
  private pickups!: Phaser.Physics.Arcade.Group;

  // Boss
  private bossMob: DungeonMob | null = null;
  private bossHpContainer!: Phaser.GameObjects.Container;
  private bossHpFill!: Phaser.GameObjects.Rectangle;
  private bossHpText!: Phaser.GameObjects.Text;

  // HUD & UI
  private hpFill!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private allyHpFill!: Phaser.GameObjects.Rectangle;
  private allyHpText!: Phaser.GameObjects.Text;
  private roomTrackerText!: Phaser.GameObjects.Text;
  private dungeonGold: number = 0;
  private goldText!: Phaser.GameObjects.Text;
  private downAlertText!: Phaser.GameObjects.Text;

  // Controls & Cooldowns
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private joyStickBase!: Phaser.GameObjects.Arc;
  private joyStickThumb!: Phaser.GameObjects.Arc;
  private joyStickPointerId: number | null = null;
  private joyStickVector = new Phaser.Math.Vector2(0, 0);

  private cds: Record<string, number> = { attack: 0, s1: 0, s2: 0, ult: 0 };
  private cdMax: Record<string, number> = { attack: 350, s1: 3000, s2: 4500, ult: 14000 };
  private cdOverlays: Record<string, Phaser.GameObjects.Rectangle> = {};
  private combatButtons: Phaser.GameObjects.GameObject[] = [];

  // Multiplayer Channel
  private networkChannel: BroadcastChannel | null = null;

  constructor() {
    super('DungeonScene');
  }

  init(data: { selectedHeroKey?: string; mode?: 'solo' | 'online'; roomCode?: string }) {
    this.selectedHeroKey = data.selectedHeroKey || 'char_zaza';
    this.mode = data.mode || 'solo';
    this.roomCode = data.roomCode || '#DUNGEON-7419';
    this.heroData = HEROES[this.selectedHeroKey] || HEROES.char_zaza;

    // Pick a complementary ally hero
    if (this.selectedHeroKey === 'char_zaza') {
      this.allyHeroKey = 'char_grim';
      this.allyName = 'ГРИМ (Соратник)';
    } else if (this.selectedHeroKey === 'char_grim') {
      this.allyHeroKey = 'char_bjorn';
      this.allyName = 'БЬОРН (Соратник)';
    } else {
      this.allyHeroKey = 'char_zaza';
      this.allyName = 'ЗАЗА (Соратник)';
    }

    this.playerHp = this.heroData.hp;
    this.playerMaxHp = this.heroData.hp;
    this.playerSpeed = this.heroData.speed;
    this.isPlayerDown = false;
    this.bleedoutTimer = 30;

    const allyData = HEROES[this.allyHeroKey];
    this.allyHp = allyData.hp;
    this.allyMaxHp = allyData.hp;
    this.isAllyDown = false;
    this.allyBleedoutTimer = 30;

    this.dungeonGold = 0;
    this.currentRoomId = 0;
    this.mobs = [];
    this.isMonster = false;
  }

  create() {
    const worldW = 1200;
    const worldH = 4600; // Vertical sequence of 5 rooms + corridors
    this.physics.world.setBounds(0, 0, worldW, worldH);

    // Setup network broadcast for online sync
    this.setupMultiplayer();

    // Floor background
    this.add.tileSprite(worldW / 2, worldH / 2, worldW, worldH, 'tile_floor').setDepth(0);

    // Physics groups
    this.walls = this.physics.add.staticGroup();
    this.doors = this.physics.add.staticGroup();
    this.pickups = this.physics.add.group();

    // Build the 5 Dungeon Rooms
    this.buildDungeonLayout(worldW);

    // Spawn Player and Companion in Room 0 (Spawn Room)
    const spawnRoom = this.rooms[0];
    this.player = this.physics.add.sprite(spawnRoom.x, spawnRoom.y + 60, this.heroData.texture).setDepth(50);
    this.player.setCollideWorldBounds(true);
    this.player.setScale(1.15);

    this.ally = this.physics.add.sprite(spawnRoom.x + 60, spawnRoom.y + 60, this.allyHeroKey).setDepth(50);
    this.ally.setCollideWorldBounds(true);
    this.ally.setScale(1.15);

    // Collisions
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.ally, this.walls);
    this.physics.add.collider(this.player, this.doors);
    this.physics.add.collider(this.ally, this.doors);

    // Camera setup
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.05);

    // Controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        F: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),
        SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        ONE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
        TWO: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
        THREE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
      };

      this.input.keyboard.on('keyup-E', () => {
        if (this.isReviving) {
          this.cancelRevive();
        }
      });
      this.input.keyboard.on('keyup-F', () => {
        if (this.isReviving) {
          this.cancelRevive();
        }
      });
    }

    // Build HUD, Touch Joystick, and Mobile Combat Buttons
    this.buildHUD();
    this.buildTouchControls();

    // Bleedout & companion AI periodic timer
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.handlePeriodicState()
    });

    // Pickups collision
    this.physics.add.overlap(this.player, this.pickups, (_p, pickup) => {
      this.collectPickup(pickup as Phaser.Physics.Arcade.Sprite);
    });

    this.showFloatingNotice('ПОДЗЕМЕЛЬЕ: ЭТАЖ 1', '#38bdf8');
  }

  // --- MULTIPLAYER SYNC ---
  private setupMultiplayer() {
    try {
      this.networkChannel = new BroadcastChannel(`fb_dungeon_${this.roomCode}`);
      this.networkChannel.onmessage = (e) => {
        const data = e.data;
        if (!data) return;
        if (data.type === 'sync_ally') {
          if (this.ally && this.ally.active) {
            this.ally.setPosition(data.x, data.y);
            this.allyHp = data.hp;
            this.isAllyDown = data.isDown;
            if (data.isDown) this.ally.setTint(0xef4444);
            else this.ally.clearTint();
          }
        } else if (data.type === 'remote_revive') {
          this.playerHp = Math.round(this.playerMaxHp * 0.4);
          this.isPlayerDown = false;
          this.player.clearTint();
          this.player.setAngle(0);
          this.downAlertText.setVisible(false);
          soundEngine.playLevelUp();
          this.showFloatingNotice('ВАС ВОСКРЕСИЛ СОРАТНИК! ❤', '#4ade80');
        }
      };

      // Periodic broadcast of our state
      this.time.addEvent({
        delay: 120,
        loop: true,
        callback: () => {
          if (this.networkChannel && this.player && this.player.active) {
            this.networkChannel.postMessage({
              type: 'sync_ally',
              x: this.player.x,
              y: this.player.y,
              hp: this.playerHp,
              isDown: this.isPlayerDown
            });
          }
        }
      });
    } catch {
      // BroadcastChannel fallback for non-supported contexts
    }
  }

  // --- BUILD DUNGEON ROOM LAYOUT ---
  private buildDungeonLayout(worldW: number) {
    const roomDefs: Array<{ name: string; type: 'spawn' | 'battle' | 'shrine' | 'boss'; mobCount: number }> = [
      { name: 'СТАРТОВЫЙ ЗАЛ', type: 'spawn', mobCount: 0 },
      { name: 'ЗАЛ СКЕЛЕТОВ', type: 'battle', mobCount: 5 },
      { name: 'ТОКСИЧНЫЙ ГРОТ', type: 'battle', mobCount: 6 },
      { name: 'ДРЕВНЕЕ СВЯТИЛИЩЕ', type: 'shrine', mobCount: 0 },
      { name: 'КАТАКОМБЫ МАГОВ', type: 'battle', mobCount: 6 },
      { name: 'АРЕНА БОССА: ГОЛЕМ', type: 'boss', mobCount: 1 }
    ];

    const roomW = 860;
    const roomH = 540;
    const spacingY = 720;
    const cx = worldW / 2;

    roomDefs.forEach((def, idx) => {
      const cy = 400 + idx * spacingY;

      // Outer room walls (stone)
      const halfW = roomW / 2;
      const halfH = roomH / 2;

      // Top Wall
      this.createWallLine(cx - halfW, cy - halfH, cx + halfW, cy - halfH);
      // Bottom Wall
      this.createWallLine(cx - halfW, cy + halfH, cx + halfW, cy + halfH);
      // Left Wall
      this.createWallLine(cx - halfW, cy - halfH, cx - halfW, cy + halfH);
      // Right Wall
      this.createWallLine(cx + halfW, cy - halfH, cx + halfW, cy + halfH);

      // Room Title Sign on Floor
      this.add.text(cx, cy - halfH + 30, `[ ${idx + 1}. ${def.name} ]`, {
        fontSize: '15px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: def.type === 'boss' ? '#ef4444' : (def.type === 'shrine' ? '#38bdf8' : '#e2e8f0')
      }).setOrigin(0.5).setDepth(5);

      const roomData: RoomData = {
        id: idx,
        name: def.name,
        x: cx,
        y: cy,
        w: roomW,
        h: roomH,
        type: def.type,
        cleared: def.type === 'spawn' || def.type === 'shrine',
        active: false,
        mobCount: def.mobCount
      };

      // Place Door connecting to the next room corridor
      if (idx < roomDefs.length - 1) {
        const doorY = cy + halfH;
        const door = this.doors.create(cx, doorY, roomData.cleared ? 'dungeon_door_open' : 'dungeon_door_closed') as Phaser.GameObjects.Image;
        door.setDepth(20);
        roomData.doorSouth = door;
      }

      // Add props based on room type
      if (def.type === 'spawn') {
        // Welcoming starter chest
        const chest = this.add.image(cx, cy - 80, 'dungeon_chest').setDepth(15).setScale(1.2).setInteractive();
        chest.on('pointerdown', () => this.openChest(roomData, chest));
        roomData.chest = chest;
      } else if (def.type === 'shrine') {
        // Healing fountain altar
        const shrine = this.add.image(cx, cy, 'dungeon_shrine').setDepth(15).setScale(1.5).setInteractive();
        this.add.text(cx, cy + 45, '[ КУПЕЛЬ ИСЦЕЛЕНИЯ ]', {
          fontSize: '12px',
          fontFamily: 'monospace',
          color: '#38bdf8'
        }).setOrigin(0.5).setDepth(16);

        shrine.on('pointerdown', () => {
          soundEngine.playLevelUp();
          this.playerHp = this.playerMaxHp;
          this.allyHp = this.allyMaxHp;
          this.showFloatingNotice('ВСЕ РАНЫ ИСЦЕЛЕНЫ! 100% HP', '#38bdf8');
        });
      }

      this.rooms.push(roomData);
    });
  }

  private createWallLine(x1: number, y1: number, x2: number, y2: number) {
    const dist = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    const steps = Math.floor(dist / 48);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const wx = Phaser.Math.Linear(x1, x2, t);
      const wy = Phaser.Math.Linear(y1, y2, t);
      // Skip gaps for central doorway
      if (Math.abs(wx - 600) < 60 && (Math.abs(wy % 720 - 400) > 200)) {
        continue;
      }
      const wall = this.walls.create(wx, wy, 'wall');
      wall.setScale(0.85);
      wall.refreshBody();
      wall.setDepth(25);
    }
  }

  // --- ROOM ACTIVATION & MONSTER SPAWNING ---
  private checkRoomTriggers() {
    const px = this.player.x;
    const py = this.player.y;

    for (const room of this.rooms) {
      if (Math.abs(px - room.x) < room.w / 2 && Math.abs(py - room.y) < room.h / 2) {
        if (this.currentRoomId !== room.id) {
          this.currentRoomId = room.id;
          this.updateRoomTracker();
        }

        if (!room.cleared && !room.active) {
          this.startRoomBattle(room);
        }
        break;
      }
    }
  }

  private startRoomBattle(room: RoomData) {
    room.active = true;
    soundEngine.playExplosion();

    // Lock doors
    if (room.doorSouth) {
      room.doorSouth.setTexture('dungeon_door_closed');
    }

    this.showFloatingNotice(`⚠ ${room.name}: ДВЕРИ ЗАБЛОКИРОВАНЫ! ⚠`, '#ef4444');

    // Spawn mobs
    if (room.type === 'battle') {
      for (let i = 0; i < room.mobCount; i++) {
        const ox = (Math.random() - 0.5) * (room.w - 180);
        const oy = (Math.random() - 0.5) * (room.h - 180);

        let mobType: 'skeleton' | 'slime' | 'mage' = 'skeleton';
        let tex = 'mob_skeleton';
        let hp = 400;
        let speed = 120;
        let damage = 40;

        if (room.id === 2) {
          mobType = 'slime';
          tex = 'mob_slime';
          hp = 350;
          speed = 100;
          damage = 35;
        } else if (room.id === 4) {
          mobType = i % 2 === 0 ? 'mage' : 'skeleton';
          tex = mobType === 'mage' ? 'mob_mage' : 'mob_skeleton';
          hp = mobType === 'mage' ? 300 : 450;
          speed = mobType === 'mage' ? 90 : 130;
          damage = 50;
        }

        const mob = this.physics.add.sprite(room.x + ox, room.y + oy, tex) as DungeonMob;
        mob.setDepth(45);
        mob.hp = hp;
        mob.maxHp = hp;
        mob.mobType = mobType;
        mob.speed = speed;
        mob.damage = damage;
        mob.attackCd = 0;
        mob.roomId = room.id;
        mob.setCollideWorldBounds(true);

        this.physics.add.collider(mob, this.walls);
        this.physics.add.collider(mob, this.doors);

        // Mob HP Bar
        mob.hpBarBg = this.add.rectangle(mob.x, mob.y - 25, 32, 5, 0x000000).setDepth(46);
        mob.hpBar = this.add.rectangle(mob.x, mob.y - 25, 32, 5, 0xef4444).setDepth(47);

        this.mobs.push(mob);
      }
    } else if (room.type === 'boss') {
      // Spawn Ancient Golem Boss!
      const boss = this.physics.add.sprite(room.x, room.y - 40, 'boss_golem') as DungeonMob;
      boss.setDepth(48);
      boss.setScale(1.4);
      boss.hp = 2500;
      boss.maxHp = 2500;
      boss.mobType = 'boss';
      boss.speed = 85;
      boss.damage = 95;
      boss.attackCd = 0;
      boss.roomId = room.id;
      boss.setCollideWorldBounds(true);

      this.physics.add.collider(boss, this.walls);
      this.physics.add.collider(boss, this.doors);

      this.bossMob = boss;
      this.mobs.push(boss);
      this.bossHpContainer.setVisible(true);
      soundEngine.playMonsterUlt();
      this.cameras.main.shake(500, 0.015);
    }
  }

  private clearRoom(room: RoomData) {
    room.cleared = true;
    room.active = false;
    soundEngine.playLevelUp();

    // Unlock doors
    if (room.doorSouth) {
      room.doorSouth.setTexture('dungeon_door_open');
    }

    this.showFloatingNotice(`✓ ${room.name} ЗАЧИЩЕНА!`, '#4ade80');

    // Spawn Reward Chest
    const chest = this.add.image(room.x, room.y, 'dungeon_chest').setDepth(15).setScale(1.2).setInteractive();
    chest.on('pointerdown', () => this.openChest(room, chest));
    room.chest = chest;

    this.updateRoomTracker();

    if (room.type === 'boss') {
      this.triggerDungeonVictory();
    }
  }

  private openChest(room: RoomData, chest: Phaser.GameObjects.Image) {
    if (room.chestOpened) return;
    room.chestOpened = true;
    soundEngine.playClick();
    chest.setTexture('dungeon_chest_open');

    // Spawn 3 coins and 1 heart pickup
    for (let i = 0; i < 3; i++) {
      const coin = this.pickups.create(chest.x + (i - 1) * 25, chest.y + 20, 'coin_pickup');
      coin.pickupType = 'coin';
      coin.setScale(1.3);
    }
    const heart = this.pickups.create(chest.x, chest.y - 25, 'heart_pickup');
    heart.pickupType = 'heart';
    heart.setScale(1.3);

    this.showFloatingText(chest.x, chest.y - 35, '+150 ЗОЛОТА!', '#facc15');
    this.dungeonGold += 150;
    this.goldText.setText(`ЗОЛОТО: ${this.dungeonGold}`);
  }

  private collectPickup(pickup: Phaser.Physics.Arcade.Sprite & { pickupType?: string }) {
    soundEngine.playClick();
    if (pickup.pickupType === 'heart') {
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + 180);
      this.showFloatingText(this.player.x, this.player.y - 30, '+180 HP ❤', '#ef4444');
    } else {
      this.dungeonGold += 25;
      this.goldText.setText(`ЗОЛОТО: ${this.dungeonGold}`);
      this.showFloatingText(this.player.x, this.player.y - 30, '+25 ⛃', '#facc15');
    }
    pickup.destroy();
  }

  // --- VICTORY & EXIT ---
  private triggerDungeonVictory() {
    this.bossHpContainer.setVisible(false);
    this.cameras.main.shake(700, 0.02);
    soundEngine.playVictory();

    const victoryModal = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2)
      .setScrollFactor(0).setDepth(600);

    const bg = this.add.rectangle(0, 0, 480, 260, 0x111827)
      .setStrokeStyle(4, 0xfacc15);

    const title = this.add.text(0, -75, '★ ПОДЗЕМЕЛЬЕ ПРОЙДЕНО! ★', {
      fontSize: '22px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#facc15'
    }).setOrigin(0.5);

    const stats = this.add.text(0, -15, `БОСС ПОВЕРЖЕН!\nНАГРАДА: +500 ЗОЛОТА И 120 КУБКОВ!`, {
      fontSize: '15px',
      fontFamily: 'monospace',
      color: '#e2e8f0',
      align: 'center'
    }).setOrigin(0.5);

    const exitBtn = this.add.text(0, 65, '[ ВЕРНУТЬСЯ В ХАБ ]', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#16a34a',
      padding: { x: 18, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    exitBtn.on('pointerdown', () => {
      soundEngine.playClick();
      this.scene.start('HubScene');
    });

    victoryModal.add([bg, title, stats, exitBtn]);
  }

  // --- PERIODIC COMPANION & BLEEDOUT LOOP ---
  private handlePeriodicState() {
    // Bleedout when player is down
    if (this.isPlayerDown) {
      this.bleedoutTimer--;
      this.downAlertText.setText(`ВЫ РАНЕНЫ! НУЖНА ПОМОЩЬ СОРАТНИКА (${this.bleedoutTimer}с)`);
      if (this.bleedoutTimer <= 0) {
        this.triggerGameOver();
      }
    }

    // Bleedout when ally is down
    if (this.isAllyDown) {
      this.allyBleedoutTimer--;
      if (this.allyBleedoutTimer <= 0 && this.isPlayerDown) {
        this.triggerGameOver();
      }
    }

    // Companion AI: follows player or attacks nearest mob
    if (!this.isAllyDown && this.ally && this.ally.active) {
      const nearestMob = this.getNearestMob(this.ally.x, this.ally.y);
      if (nearestMob && Phaser.Math.Distance.Between(this.ally.x, this.ally.y, nearestMob.x, nearestMob.y) < 260) {
        const ang = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, nearestMob.x, nearestMob.y);
        this.ally.setVelocity(Math.cos(ang) * 160, Math.sin(ang) * 160);
        // Attack mob
        if (Math.random() < 0.45) {
          this.dealDamageToMob(nearestMob, 70);
        }
      } else {
        // Follow player
        const dist = Phaser.Math.Distance.Between(this.ally.x, this.ally.y, this.player.x, this.player.y);
        if (dist > 80) {
          const ang = Phaser.Math.Angle.Between(this.ally.x, this.ally.y, this.player.x, this.player.y);
          this.ally.setVelocity(Math.cos(ang) * 170, Math.sin(ang) * 170);
        } else {
          this.ally.setVelocity(0, 0);
        }
      }

      // If player is down, companion moves to revive player!
      if (this.isPlayerDown && Phaser.Math.Distance.Between(this.ally.x, this.ally.y, this.player.x, this.player.y) < 70) {
        this.allyRevivePlayer();
      }
    }
  }

  private triggerGameOver() {
    soundEngine.playExplosion();
    const modal = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2)
      .setScrollFactor(0).setDepth(600);
    const bg = this.add.rectangle(0, 0, 420, 220, 0x18181b).setStrokeStyle(3, 0xef4444);
    const title = this.add.text(0, -50, 'ОТРЯД ПАЛ В ПОДЗЕМЕЛЬЕ', {
      fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ef4444'
    }).setOrigin(0.5);
    const retryBtn = this.add.text(0, 30, '[ ПОВТОРИТЬ ПОХОД ]', {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff',
      backgroundColor: '#3f3f46', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    retryBtn.on('pointerdown', () => this.scene.restart());
    modal.add([bg, title, retryBtn]);
  }

  private allyRevivePlayer() {
    this.reviveProgress += 0.25;
    if (this.reviveProgress >= 1) {
      this.playerHp = Math.round(this.playerMaxHp * 0.4);
      this.isPlayerDown = false;
      this.player.clearTint();
      this.player.setAngle(0);
      this.downAlertText.setVisible(false);
      soundEngine.playLevelUp();
      this.showFloatingNotice('СОРАТНИК ВОСКРЕСИЛ ВАС! ❤', '#4ade80');
      this.reviveProgress = 0;
    }
  }

  // --- REVIVE INTERACTION ("ПОМОЩЬ") ---
  private updateRevivePrompt() {
    if (!this.player || !this.ally) return;

    const distToAlly = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.ally.x, this.ally.y);

    if (this.isAllyDown && distToAlly < 85 && !this.isPlayerDown) {
      this.reviveButtonUI.setVisible(true);
      this.reviveProgressBg.setVisible(true);
      this.reviveProgressFill.setVisible(true);
      this.targetToRevive = 'ally';
    } else {
      if (!this.isReviving) {
        this.reviveButtonUI.setVisible(false);
        this.reviveProgressBg.setVisible(false);
        this.reviveProgressFill.setVisible(false);
        this.targetToRevive = null;
      }
    }
  }

  private cancelRevive() {
    if (this.isReviving) {
      if (this.currentReviveTween) {
        this.currentReviveTween.stop();
        this.currentReviveTween = null;
      }
      this.isReviving = false;
      this.reviveProgressFill.setSize(0, 8);
    }
  }

  private startReviveAction() {
    if (!this.targetToRevive || this.isReviving) return;
    this.isReviving = true;
    soundEngine.playClick();

    this.currentReviveTween = this.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 2500, // 2.5 seconds to revive
      onUpdate: (tween) => {
        const val = tween.getValue() ?? 0;
        this.reviveProgressFill.setSize((val / 100) * 180, 8);
      },
      onComplete: () => {
        this.isReviving = false;
        this.currentReviveTween = null;
        this.reviveButtonUI.setVisible(false);
        this.reviveProgressBg.setVisible(false);
        this.reviveProgressFill.setVisible(false);

        if (this.targetToRevive === 'ally') {
          this.allyHp = Math.round(this.allyMaxHp * 0.4);
          this.isAllyDown = false;
          this.ally.clearTint();
          this.ally.setAngle(0);
          soundEngine.playLevelUp();
          this.showFloatingNotice('СОРАТНИК ВОСКРЕШЕН! +40% HP', '#4ade80');
        }
      }
    });

    this.input.on('pointerup', () => {
      this.cancelRevive();
    });
  }

  // --- COMBAT & SKILLS EXECUTION WITH EXACT COLLISION FIX ---
  private executeCombatSkill(type: 'attack' | 's1' | 's2' | 'ult') {
    if (this.isPlayerDown) return;
    const now = this.time.now;
    if (now < this.cds[type]) return;

    this.cds[type] = now + this.cdMax[type];
    const dir = this.player.flipX ? -1 : 1;

    // --- ZAZA SKILLS ---
    if (this.selectedHeroKey === 'char_zaza') {
      if (!this.isMonster) {
        if (type === 'attack') {
          soundEngine.playAttack();
          const club = this.add.rectangle(this.player.x + dir * 30, this.player.y, 45, 12, 0xb45309).setDepth(100);
          this.tweens.add({
            targets: club,
            angle: dir * 75,
            duration: 140,
            onComplete: () => club.destroy()
          });
          this.dealDamageInDungeon(this.player.x + dir * 55, this.player.y, 55, 90);
        } else if (type === 's1') {
          // FIXED: Toxic spit stops and bursts on the FIRST enemy hit!
          soundEngine.playPoison();
          const startX = this.player.x;
          const startY = this.player.y;
          const targetX = startX + dir * 240;

          const spit = this.add.circle(startX, startY, 9, 0x84cc16).setDepth(100);
          let hasBurst = false;

          const burstSpit = (hitX: number, hitY: number) => {
            if (hasBurst) return;
            hasBurst = true;
            spit.destroy();

            const puddle = this.add.ellipse(hitX, hitY, 16, 9, 0x84cc16, 0.75).setDepth(10);
            this.tweens.add({
              targets: puddle,
              scaleX: 5.5,
              scaleY: 5.5,
              alpha: 0.45,
              duration: 350,
              onComplete: () => {
                // Continuous poison damage ticks
                this.time.addEvent({
                  delay: 450,
                  repeat: 4,
                  callback: () => {
                    if (puddle.active) {
                      this.dealDamageInDungeon(puddle.x, puddle.y, 65, 45);
                    }
                  }
                });
                this.time.delayedCall(2300, () => puddle.destroy());
              }
            });
            this.dealDamageInDungeon(hitX, hitY, 60, 85);
          };

          this.tweens.add({
            targets: spit,
            x: targetX,
            duration: 250,
            onUpdate: () => {
              if (hasBurst || !spit.active) return;
              const hitMob = this.getMobAtPosition(spit.x, spit.y, 35);
              if (hitMob) {
                burstSpit(hitMob.x, hitMob.y);
              }
            },
            onComplete: () => {
              if (!hasBurst && spit.active) {
                burstSpit(targetX, startY);
              }
            }
          });
        } else if (type === 's2') {
          // Whirlwind club with continuous damage ticks
          soundEngine.playWhirlwind();
          const stick = this.add.rectangle(this.player.x, this.player.y, 80, 14, 0xb45309).setDepth(100);
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
              this.dealDamageInDungeon(this.player.x, this.player.y, 85, 75);
            }
          });
        } else if (type === 'ult') {
          // Monster mutation!
          soundEngine.playMonsterUlt();
          this.isMonster = true;
          this.player.setTexture('char_zaza_monster').setScale(1.5);
          this.playerHp = Math.min(2200, this.playerHp + 600);
          this.playerMaxHp = 2200;
          this.showFloatingNotice('МУТАЦИЯ МОНСТРА АКТИВНА!', '#a855f7');

          this.time.delayedCall(12000, () => {
            if (this.player && this.player.active) {
              this.isMonster = false;
              this.player.setTexture('char_zaza').setScale(1.15);
              this.playerMaxHp = this.heroData.hp;
              this.playerHp = Math.min(this.playerHp, this.playerMaxHp);
            }
          });
        }
      } else {
        // Monster form attacks
        if (type === 'attack') {
          soundEngine.playMonsterUlt();
          const bite = this.add.circle(this.player.x + dir * 45, this.player.y, 22, 0xdc2626, 0.7).setDepth(100);
          this.tweens.add({
            targets: bite,
            scale: 1.8,
            alpha: 0,
            duration: 150,
            onComplete: () => bite.destroy()
          });
          this.dealDamageInDungeon(this.player.x + dir * 65, this.player.y, 70, 180);
        } else if (type === 's1') {
          soundEngine.playWhirlwind();
          this.dealDamageInDungeon(this.player.x + dir * 80, this.player.y, 75, 160);
        } else if (type === 's2' || type === 'ult') {
          soundEngine.playMonsterUlt();
          this.dealDamageInDungeon(this.player.x, this.player.y, 110, 220);
        }
      }
    }
    // --- GRIM SKILLS ---
    else if (this.selectedHeroKey === 'char_grim') {
      if (type === 'attack') {
        soundEngine.playAttack();
        const flask = this.add.circle(this.player.x, this.player.y, 9, 0x38bdf8).setDepth(100);
        let hasHit = false;

        const explodeFlask = (fx: number, fy: number) => {
          if (hasHit) return;
          hasHit = true;
          flask.destroy();
          soundEngine.playPoison();
          this.dealDamageInDungeon(fx, fy, 65, 95);
        };

        this.tweens.add({
          targets: flask,
          x: this.player.x + dir * 220,
          duration: 240,
          onUpdate: () => {
            if (hasHit || !flask.active) return;
            const mob = this.getMobAtPosition(flask.x, flask.y, 35);
            if (mob) explodeFlask(mob.x, mob.y);
          },
          onComplete: () => {
            if (!hasHit && flask.active) explodeFlask(flask.x, flask.y);
          }
        });
      } else if (type === 's1') {
        // FIXED: Tar Bomb creates a sticky puddle that SLOWS down enemies by 60%!
        soundEngine.playAttack();
        const tar = this.add.circle(this.player.x, this.player.y, 11, 0x0f172a).setDepth(100);
        let tarBurst = false;

        const explodeTar = (tx: number, ty: number) => {
          if (tarBurst) return;
          tarBurst = true;
          tar.destroy();

          const puddle = this.add.ellipse(tx, ty, 65, 34, 0x0f172a, 0.85).setDepth(10);
          this.showFloatingText(tx, ty - 25, 'ЗАМЕДЛЕНИЕ 60%!', '#38bdf8');

          // Slow enemies in puddle & tick damage
          this.time.addEvent({
            delay: 400,
            repeat: 5,
            callback: () => {
              if (puddle.active) {
                this.mobs.forEach(m => {
                  if (m.active && Phaser.Math.Distance.Between(m.x, m.y, puddle.x, puddle.y) < 70) {
                    m.isSlowed = true;
                    m.setVelocity(m.body ? m.body.velocity.x * 0.4 : 0, m.body ? m.body.velocity.y * 0.4 : 0);
                    this.dealDamageToMob(m, 35);
                  }
                });
              }
            }
          });

          this.time.delayedCall(2400, () => puddle.destroy());
        };

        this.tweens.add({
          targets: tar,
          x: this.player.x + dir * 220,
          duration: 250,
          onUpdate: () => {
            if (tarBurst || !tar.active) return;
            const m = this.getMobAtPosition(tar.x, tar.y, 35);
            if (m) explodeTar(m.x, m.y);
          },
          onComplete: () => {
            if (!tarBurst && tar.active) explodeTar(tar.x, tar.y);
          }
        });
      } else if (type === 's2') {
        // Shadow Step Dash
        soundEngine.playWhoosh();
        this.player.setAlpha(0.35);
        this.tweens.add({
          targets: this.player,
          x: this.player.x + dir * 180,
          duration: 200,
          onComplete: () => this.player.setAlpha(1)
        });
      } else if (type === 'ult') {
        // Explosive Cauldron
        soundEngine.playMonsterUlt();
        const pot = this.add.rectangle(this.player.x + dir * 70, this.player.y, 32, 28, 0x1e293b).setDepth(10);
        this.time.delayedCall(1200, () => {
          pot.destroy();
          soundEngine.playExplosion();
          this.dealDamageInDungeon(pot.x, pot.y, 115, 340);
        });
      }
    }
    // --- BJORN SKILLS ---
    else if (this.selectedHeroKey === 'char_bjorn') {
      if (type === 'attack') {
        soundEngine.playAttack();
        const axe = this.add.rectangle(this.player.x + dir * 30, this.player.y, 50, 14, 0x94a3b8).setDepth(100);
        this.tweens.add({
          targets: axe,
          angle: dir * 85,
          duration: 150,
          onComplete: () => axe.destroy()
        });
        this.dealDamageInDungeon(this.player.x + dir * 55, this.player.y, 60, 120);
      } else if (type === 's1') {
        // Earthquake
        soundEngine.playEarthquake();
        this.dealDamageInDungeon(this.player.x + dir * 85, this.player.y, 80, 160);
      } else if (type === 's2') {
        // Shield Ram
        soundEngine.playWhoosh();
        this.tweens.add({
          targets: this.player,
          x: this.player.x + dir * 140,
          duration: 180
        });
        this.dealDamageInDungeon(this.player.x + dir * 80, this.player.y, 65, 220);
      } else if (type === 'ult') {
        // Axe Cyclone: spinning axe with 8 continuous tick hits
        soundEngine.playWhirlwind();
        const spinAxe = this.add.rectangle(this.player.x, this.player.y, 100, 16, 0xe2e8f0).setDepth(100);
        this.tweens.add({
          targets: spinAxe,
          angle: 1440,
          duration: 1800,
          onUpdate: () => {
            if (spinAxe.active) spinAxe.setPosition(this.player.x, this.player.y);
          },
          onComplete: () => spinAxe.destroy()
        });

        this.time.addEvent({
          delay: 220,
          repeat: 7,
          callback: () => {
            if (!this.player || !this.player.active) return;
            this.dealDamageInDungeon(this.player.x, this.player.y, 110, 85);
          }
        });
      }
    }
  }

  private getMobAtPosition(x: number, y: number, radius: number): DungeonMob | null {
    for (const m of this.mobs) {
      if (m.active && Phaser.Math.Distance.Between(x, y, m.x, m.y) <= radius) {
        return m;
      }
    }
    return null;
  }

  private getNearestMob(x: number, y: number): DungeonMob | null {
    let best: DungeonMob | null = null;
    let minDist = 99999;
    for (const m of this.mobs) {
      if (m.active) {
        const d = Phaser.Math.Distance.Between(x, y, m.x, m.y);
        if (d < minDist) {
          minDist = d;
          best = m;
        }
      }
    }
    return best;
  }

  private dealDamageInDungeon(x: number, y: number, radius: number, damage: number) {
    this.mobs.forEach(mob => {
      if (!mob.active) return;
      if (Phaser.Math.Distance.Between(x, y, mob.x, mob.y) <= radius) {
        this.dealDamageToMob(mob, damage);
      }
    });
  }

  private dealDamageToMob(mob: DungeonMob, damage: number) {
    mob.hp -= damage;
    mob.setTint(0xff0000);
    this.time.delayedCall(120, () => {
      if (mob.active) mob.clearTint();
    });
    this.showFloatingText(mob.x, mob.y - 25, `-${damage}`, '#f87171');

    // Update HP bar
    if (mob.hpBar && mob.hpBarBg) {
      const pct = Math.max(0, mob.hp / mob.maxHp);
      mob.hpBar.setSize(32 * pct, 5);
      mob.hpBar.setPosition(mob.x - 16 * (1 - pct), mob.y - 25);
    }

    if (mob.mobType === 'boss') {
      const pct = Math.max(0, mob.hp / mob.maxHp);
      this.bossHpFill.setSize(320 * pct, 16);
      this.bossHpText.setText(`ДРЕВНИЙ ГОЛЕМ [HP: ${mob.hp} / 2500]`);
    }

    if (mob.hp <= 0) {
      soundEngine.playExplosion();
      this.showFloatingText(mob.x, mob.y - 40, 'ВРАГ ПОВЕРЖЕН!', '#4ade80');
      if (mob.hpBar) mob.hpBar.destroy();
      if (mob.hpBarBg) mob.hpBarBg.destroy();
      mob.destroy();

      // Check room clear
      const currentRoom = this.rooms.find(r => r.id === mob.roomId);
      if (currentRoom) {
        const remaining = this.mobs.filter(m => m.active && m.roomId === currentRoom.id);
        if (remaining.length === 0) {
          this.clearRoom(currentRoom);
        }
      }
    }
  }

  // --- MOB AI MOVEMENT & ATTACKS ---
  private updateMobs() {
    this.mobs.forEach(mob => {
      if (!mob.active) return;

      // Update HP bar position
      if (mob.hpBar && mob.hpBarBg) {
        mob.hpBarBg.setPosition(mob.x, mob.y - 25);
      }

      // Find target (player or ally, whichever is closest and not down)
      let target: Phaser.Physics.Arcade.Sprite = this.player;
      const distToPlayer = Phaser.Math.Distance.Between(mob.x, mob.y, this.player.x, this.player.y);
      const distToAlly = this.ally && this.ally.active ? Phaser.Math.Distance.Between(mob.x, mob.y, this.ally.x, this.ally.y) : 99999;

      if (this.isPlayerDown && !this.isAllyDown) {
        target = this.ally;
      } else if (!this.isAllyDown && distToAlly < distToPlayer) {
        target = this.ally;
      }

      const dist = Phaser.Math.Distance.Between(mob.x, mob.y, target.x, target.y);
      const spd = mob.isSlowed ? mob.speed * 0.4 : mob.speed;

      if (dist < 420 && dist > 35) {
        const angle = Phaser.Math.Angle.Between(mob.x, mob.y, target.x, target.y);
        mob.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
      } else {
        mob.setVelocity(0, 0);
      }

      // Attack if in range
      if (dist <= 48 && this.time.now > mob.attackCd) {
        mob.attackCd = this.time.now + 1200;
        this.hitPlayerOrAlly(target, mob.damage);
      }

      // Boss special shockwave attack
      if (mob.mobType === 'boss' && dist < 300 && this.time.now > mob.attackCd) {
        mob.attackCd = this.time.now + 2800;
        soundEngine.playEarthquake();
        this.cameras.main.shake(300, 0.01);
        const ring = this.add.circle(mob.x, mob.y, 30, 0xef4444, 0.5).setDepth(47);
        this.tweens.add({
          targets: ring,
          scale: 4.5,
          alpha: 0,
          duration: 450,
          onComplete: () => ring.destroy()
        });
        if (distToPlayer < 140) this.hitPlayerOrAlly(this.player, 85);
        if (distToAlly < 140) this.hitPlayerOrAlly(this.ally, 85);
      }
    });
  }

  private hitPlayerOrAlly(target: Phaser.Physics.Arcade.Sprite, damage: number) {
    if (target === this.player) {
      if (this.isPlayerDown) return;
      this.playerHp -= damage;
      this.player.setTint(0xff0000);
      this.time.delayedCall(120, () => {
        if (!this.isPlayerDown) this.player.clearTint();
      });
      this.showFloatingText(this.player.x, this.player.y - 25, `-${damage}`, '#f87171');

      if (this.playerHp <= 0) {
        this.playerHp = 0;
        this.isPlayerDown = true;
        this.player.setTint(0xef4444);
        this.player.setAngle(85); // Knocked down posture
        this.bleedoutTimer = 30;
        this.downAlertText.setVisible(true);
        soundEngine.playExplosion();
      }
    } else {
      if (this.isAllyDown) return;
      this.allyHp -= damage;
      this.ally.setTint(0xff0000);
      this.time.delayedCall(120, () => {
        if (!this.isAllyDown) this.ally.clearTint();
      });

      if (this.allyHp <= 0) {
        this.allyHp = 0;
        this.isAllyDown = true;
        this.ally.setTint(0xef4444);
        this.ally.setAngle(85);
        this.allyBleedoutTimer = 30;
        this.showFloatingNotice('СОРАТНИК ПОВЕРЖЕН! ПОДОЙДИТЕ И ПОМОГИТЕ!', '#ef4444');
      }
    }
  }

  // --- UPDATE LOOP ---
  update() {
    this.handlePlayerInput();
    this.updateMobs();
    this.checkRoomTriggers();
    this.updateHUD();
    this.updateRevivePrompt();
  }

  private handlePlayerInput() {
    if (this.isPlayerDown) {
      this.player.setVelocity(0, 0);
      return;
    }

    let vx = 0;
    let vy = 0;

    // Keyboard
    if (this.cursors.left.isDown || (this.keys.A && this.keys.A.isDown)) vx -= 1;
    if (this.cursors.right.isDown || (this.keys.D && this.keys.D.isDown)) vx += 1;
    if (this.cursors.up.isDown || (this.keys.W && this.keys.W.isDown)) vy -= 1;
    if (this.cursors.down.isDown || (this.keys.S && this.keys.S.isDown)) vy += 1;

    // Touch Joystick
    if (this.joyStickVector.length() > 0.1) {
      vx = this.joyStickVector.x;
      vy = this.joyStickVector.y;
    }

    if (vx !== 0 || vy !== 0) {
      const v = new Phaser.Math.Vector2(vx, vy).normalize().scale(this.playerSpeed);
      this.player.setVelocity(v.x, v.y);
      if (vx < 0) this.player.setFlipX(true);
      else if (vx > 0) this.player.setFlipX(false);
    } else {
      this.player.setVelocity(0, 0);
    }

    // Keyboard hotkeys
    if (this.keys.SPACE && Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.executeCombatSkill('attack');
    if (this.keys.ONE && Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.executeCombatSkill('s1');
    if (this.keys.TWO && Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.executeCombatSkill('s2');
    if (this.keys.THREE && Phaser.Input.Keyboard.JustDown(this.keys.THREE)) this.executeCombatSkill('ult');
    if (this.keys.E && Phaser.Input.Keyboard.JustDown(this.keys.E)) this.startReviveAction();
    if (this.keys.F && Phaser.Input.Keyboard.JustDown(this.keys.F)) this.startReviveAction();
  }

  // --- HUD & CONTROLS UI ---
  private buildHUD() {
    // Player HP Bar (Top Left)
    this.add.rectangle(120, 30, 200, 20, 0x1f2937).setScrollFactor(0).setDepth(200);
    this.hpFill = this.add.rectangle(120, 30, 196, 16, 0x22c55e).setScrollFactor(0).setDepth(201);
    this.hpText = this.add.text(120, 30, '', {
      fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    // Ally HP Bar (Below Player HP)
    this.add.rectangle(120, 60, 200, 16, 0x1f2937).setScrollFactor(0).setDepth(200);
    this.allyHpFill = this.add.rectangle(120, 60, 196, 12, 0x38bdf8).setScrollFactor(0).setDepth(201);
    this.allyHpText = this.add.text(120, 60, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    // Gold & Room Tracker (Top Center)
    this.goldText = this.add.text(this.cameras.main.width / 2, 22, 'ЗОЛОТО: 0', {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color: '#facc15'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    this.roomTrackerText = this.add.text(this.cameras.main.width / 2, 44, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    // Exit Button (Top Right)
    const exitBtn = this.add.text(this.cameras.main.width - 90, 30, '[ ВЫХОД ]', {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', color: '#f87171',
      backgroundColor: '#27272a', padding: { x: 8, y: 5 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202).setInteractive({ useHandCursor: true });
    exitBtn.on('pointerdown', () => {
      soundEngine.playClick();
      this.scene.start('HubScene');
    });

    // Downed Alert Text
    this.downAlertText = this.add.text(this.cameras.main.width / 2, 100, '', {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ef4444',
      backgroundColor: '#18181b', padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(250).setVisible(false);

    // Revive Action Button ("ПОМОЩЬ")
    this.reviveButtonUI = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 180, '[ ✚ ПОМОЩЬ ] (Удерживайте E или ЛКМ)', {
      fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff',
      backgroundColor: '#15803d', padding: { x: 18, y: 10 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setVisible(false).setInteractive({ useHandCursor: true });

    this.reviveProgressBg = this.add.rectangle(this.cameras.main.width / 2, this.cameras.main.height - 145, 180, 8, 0x1f2937)
      .setScrollFactor(0).setDepth(301).setVisible(false);
    this.reviveProgressFill = this.add.rectangle(this.cameras.main.width / 2 - 90, this.cameras.main.height - 145, 0, 8, 0x4ade80)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(302).setVisible(false);

    this.reviveButtonUI.on('pointerdown', () => this.startReviveAction());

    // Boss Big HP Bar (Top Screen)
    this.bossHpContainer = this.add.container(this.cameras.main.width / 2, 90).setScrollFactor(0).setDepth(250).setVisible(false);
    const bossBg = this.add.rectangle(0, 0, 324, 20, 0x000000).setStrokeStyle(2, 0xef4444);
    this.bossHpFill = this.add.rectangle(-160, 0, 320, 16, 0xdc2626).setOrigin(0, 0.5);
    this.bossHpText = this.add.text(0, 0, 'БОСС: ДРЕВНИЙ ГОЛЕМ [HP: 2500 / 2500]', {
      fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);
    this.bossHpContainer.add([bossBg, this.bossHpFill, this.bossHpText]);
  }

  private updateHUD() {
    // Player HP
    const pPct = Math.max(0, this.playerHp / this.playerMaxHp);
    this.hpFill.setSize(196 * pPct, 16);
    this.hpText.setText(`${this.heroData.name.split(' ')[0]} ${this.playerHp}/${this.playerMaxHp}`);

    // Ally HP
    const aPct = Math.max(0, this.allyHp / this.allyMaxHp);
    this.allyHpFill.setSize(196 * aPct, 12);
    this.allyHpText.setText(`${this.allyName.split(' ')[0]} ${this.allyHp}/${this.allyMaxHp}`);
  }

  private updateRoomTracker() {
    const list = this.rooms.map((r, i) => `${i + 1}:${r.cleared ? '✓' : (r.type === 'boss' ? '☠' : '⚔')}`);
    this.roomTrackerText.setText(`КОМНАТЫ: [ ${list.join(' • ')} ]`);
  }

  // --- TOUCH JOYSTICK & COMBAT BUTTONS ---
  private buildTouchControls() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Joystick (Bottom-Left)
    this.joyStickBase = this.add.circle(100, h - 100, 52, 0x27272a, 0.6)
      .setScrollFactor(0).setDepth(210).setInteractive();
    this.joyStickThumb = this.add.circle(100, h - 100, 26, 0x71717a, 0.8)
      .setScrollFactor(0).setDepth(211);

    this.joyStickBase.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.joyStickPointerId = p.id;
      this.updateJoystick(p.x, p.y);
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.joyStickPointerId === p.id) {
        this.updateJoystick(p.x, p.y);
      }
    });

    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.joyStickPointerId === p.id) {
        this.joyStickPointerId = null;
        this.joyStickVector.set(0, 0);
        this.joyStickThumb.setPosition(100, h - 100);
      }
    });

    // Combat Buttons (Bottom-Right)
    const btnConfigs = [
      { key: 'attack', label: '⚔ АТАКА', x: w - 90, y: h - 90, size: 36, color: 0xef4444 },
      { key: 's1', label: '1', x: w - 165, y: h - 75, size: 28, color: 0x16a34a },
      { key: 's2', label: '2', x: w - 150, y: h - 145, size: 28, color: 0x2563eb },
      { key: 'ult', label: '★', x: w - 85, y: h - 170, size: 32, color: 0x9333ea }
    ];

    btnConfigs.forEach(btn => {
      const circle = this.add.circle(btn.x, btn.y, btn.size, btn.color, 0.85)
        .setScrollFactor(0).setDepth(210).setInteractive({ useHandCursor: true });
      const txt = this.add.text(btn.x, btn.y, btn.label, {
        fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(211);

      circle.on('pointerdown', () => this.executeCombatSkill(btn.key as 'attack' | 's1' | 's2' | 'ult'));
      this.combatButtons.push(circle, txt);
    });
  }

  private updateJoystick(px: number, py: number) {
    const h = this.cameras.main.height;
    const bx = 100;
    const by = h - 100;
    const dist = Phaser.Math.Distance.Between(bx, by, px, py);
    const maxR = 45;
    const angle = Phaser.Math.Angle.Between(bx, by, px, py);
    const clampedR = Math.min(dist, maxR);

    this.joyStickThumb.setPosition(bx + Math.cos(angle) * clampedR, by + Math.sin(angle) * clampedR);
    this.joyStickVector.set(Math.cos(angle) * (clampedR / maxR), Math.sin(angle) * (clampedR / maxR));
  }

  private showFloatingText(x: number, y: number, text: string, color: string) {
    const t = this.add.text(x, y, text, {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color
    }).setOrigin(0.5).setDepth(150);
    this.tweens.add({
      targets: t,
      y: y - 35,
      alpha: 0,
      duration: 850,
      onComplete: () => t.destroy()
    });
  }

  private showFloatingNotice(text: string, color: string) {
    const t = this.add.text(this.cameras.main.width / 2, 130, text, {
      fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', color,
      backgroundColor: '#09090b', padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(350);

    this.tweens.add({
      targets: t,
      y: 110,
      alpha: 0,
      delay: 1500,
      duration: 500,
      onComplete: () => t.destroy()
    });
  }
}
