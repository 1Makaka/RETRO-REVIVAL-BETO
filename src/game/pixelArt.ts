/**
 * Frantic Battles - Pixel Art Texture Generator
 * Builds high-fidelity, authentic 16-bit retro fantasy textures
 * for characters, skills, buildings, ranks, and music album covers.
 */

import Phaser from 'phaser';

export function generateAllTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('tile_floor')) {
    return; // Already initialized
  }

  // --- Helper to draw a pixel rect ---
  const makeCanvas = (w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  };

  // 1. ALBUM COVER: WIKLUND (Cat Adventurer, Sunset Castle, Music Badge)
  {
    const { canvas, ctx } = makeCanvas(160, 160);
    // Background gradient: Sunset sky
    const sky = ctx.createLinearGradient(0, 0, 0, 100);
    sky.addColorStop(0, '#2b1055');
    sky.addColorStop(0.4, '#591a75');
    sky.addColorStop(0.7, '#d35400');
    sky.addColorStop(1, '#f39c12');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 160, 160);

    // Sun
    ctx.fillStyle = '#fff9d2';
    ctx.fillRect(115, 45, 20, 20);

    // Mountains & Castle Silhouette in background
    ctx.fillStyle = '#371842';
    // Mountains
    ctx.beginPath();
    ctx.moveTo(70, 90); ctx.lineTo(110, 50); ctx.lineTo(150, 90); ctx.fill();
    // Castle towers
    ctx.fillRect(95, 45, 14, 45);
    ctx.fillRect(85, 55, 10, 35);
    ctx.fillRect(110, 52, 8, 38);
    // Castle spires
    ctx.fillStyle = '#512261';
    ctx.fillRect(96, 40, 12, 5);
    ctx.fillRect(100, 34, 4, 6);

    // Dragon silhouette in sky
    ctx.fillStyle = '#220b30';
    ctx.fillRect(130, 25, 14, 4);
    ctx.fillRect(128, 22, 6, 4);
    ctx.fillRect(138, 22, 6, 4);
    ctx.fillRect(133, 29, 6, 3);

    // Cliff and foreground trees
    ctx.fillStyle = '#1c1524';
    ctx.fillRect(0, 90, 90, 70);
    ctx.fillStyle = '#2a3b20';
    ctx.fillRect(10, 88, 70, 8); // Moss on rocks

    // Tree on the left with lantern
    ctx.fillStyle = '#1a1008';
    ctx.fillRect(4, 10, 16, 120);
    ctx.fillRect(16, 25, 25, 6); // Branch
    // Lantern
    ctx.fillStyle = '#443322';
    ctx.fillRect(34, 31, 8, 12);
    ctx.fillStyle = '#ffea66'; // Glowing light
    ctx.fillRect(36, 34, 4, 6);

    // Orange Cat Adventurer
    // Cloak
    ctx.fillStyle = '#2c1e19';
    ctx.fillRect(40, 75, 34, 30);
    ctx.fillRect(36, 85, 12, 20);
    // Cat fur (Orange ginger)
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(46, 52, 24, 22); // Head
    ctx.fillRect(42, 44, 8, 10);  // Left ear
    ctx.fillRect(62, 44, 8, 10);  // Right ear
    ctx.fillRect(38, 96, 16, 8);  // Fluffy tail
    // White muzzle and chest
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(52, 63, 12, 10);
    // Inner ears pink
    ctx.fillStyle = '#f1948a';
    ctx.fillRect(44, 47, 4, 6);
    ctx.fillRect(64, 47, 4, 6);
    // Green eyes
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(50, 57, 5, 5);
    ctx.fillRect(62, 57, 5, 5);
    ctx.fillStyle = '#0e4a26';
    ctx.fillRect(52, 58, 2, 4);
    ctx.fillRect(64, 58, 2, 4);
    // Cute smile & nose
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(57, 65, 3, 2);

    // Gold Brooch on cloak
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(56, 75, 5, 5);

    // Bottom Music Badge: "♫" with audio bars
    ctx.fillStyle = 'rgba(10, 8, 18, 0.85)';
    ctx.fillRect(10, 122, 140, 30);
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 122, 140, 30);

    // Pixel Music Note
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(74, 130, 8, 3);
    ctx.fillRect(74, 133, 3, 10);
    ctx.fillRect(81, 133, 3, 8);
    ctx.fillRect(70, 140, 6, 4);
    ctx.fillRect(77, 138, 6, 4);

    // Audio frequency bars left and right
    const barHeights = [4, 8, 14, 10, 6];
    barHeights.forEach((bh, i) => {
      ctx.fillRect(35 + i * 6, 142 - bh, 3, bh);
      ctx.fillRect(98 + i * 6, 142 - bh, 3, bh);
    });

    // Decorative retro gold corner borders
    ctx.strokeStyle = '#d35400';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 156, 156);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(2, 2, 8, 8);
    ctx.fillRect(150, 2, 8, 8);
    ctx.fillRect(2, 150, 8, 8);
    ctx.fillRect(150, 150, 8, 8);

    scene.textures.addCanvas('WiklundPic', canvas);
  }

  // 2. ALBUM COVER: NEOWAVE (Chubby Crown King, Purple Storm, Dark Castle)
  {
    const { canvas, ctx } = makeCanvas(160, 160);
    // Dark magical purple storm background
    const storm = ctx.createLinearGradient(0, 0, 0, 160);
    storm.addColorStop(0, '#10002b');
    storm.addColorStop(0.5, '#240046');
    storm.addColorStop(1, '#3c096c');
    ctx.fillStyle = storm;
    ctx.fillRect(0, 0, 160, 160);

    // Purple Lightning bolts
    ctx.strokeStyle = '#c77dff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 0); ctx.lineTo(40, 35); ctx.lineTo(34, 45); ctx.lineTo(45, 80);
    ctx.moveTo(130, 0); ctx.lineTo(120, 25); ctx.lineTo(126, 40); ctx.lineTo(115, 65);
    ctx.stroke();

    // Dark gothic fortress in background
    ctx.fillStyle = '#18032c';
    ctx.fillRect(10, 40, 35, 60);
    ctx.fillRect(20, 25, 15, 30);
    ctx.fillRect(120, 45, 30, 55);

    // Floating rock platform
    ctx.fillStyle = '#150820';
    ctx.fillRect(25, 115, 110, 40);
    ctx.fillStyle = '#5a189a';
    ctx.fillRect(28, 114, 104, 4); // Glowing purple rim

    // Chubby Beige Royal King Creature
    // Royal Purple Velvet Cape
    ctx.fillStyle = '#3c096c';
    ctx.fillRect(45, 75, 60, 45);
    // White fur collar
    ctx.fillStyle = '#e0aaff';
    ctx.fillRect(46, 72, 58, 8);

    // Beige Chubby Body
    ctx.fillStyle = '#f5deb3';
    ctx.fillRect(52, 60, 46, 46);
    // Hands
    ctx.fillRect(46, 78, 8, 8);
    ctx.fillRect(96, 78, 8, 8);

    // King's Face
    // Big silly red grin & blue tongue
    ctx.fillStyle = '#e63946';
    ctx.fillRect(62, 80, 26, 8);
    ctx.fillStyle = '#48cae4';
    ctx.fillRect(72, 85, 6, 6); // Blue tongue!
    // Eyes (derpy green dots)
    ctx.fillStyle = '#2d6a4f';
    ctx.fillRect(60, 68, 6, 5);
    ctx.fillRect(84, 68, 6, 5);

    // Royal Jeweled Crown
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(56, 44, 38, 12);
    ctx.fillRect(54, 38, 8, 8);
    ctx.fillRect(71, 34, 8, 12); // Center peak
    ctx.fillRect(88, 38, 8, 8);
    // Purple jewels in crown
    ctx.fillStyle = '#9d4edd';
    ctx.fillRect(58, 48, 4, 4);
    ctx.fillRect(73, 46, 4, 4);
    ctx.fillRect(88, 48, 4, 4);

    // Purple Gem Necklace
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(58, 74, 34, 4);
    ctx.fillStyle = '#7b2cbf';
    ctx.fillRect(72, 76, 6, 6);

    // Magical Crystal Scepter Staff (Right Hand)
    ctx.fillStyle = '#4a2810';
    ctx.fillRect(106, 55, 4, 60); // Staff pole
    ctx.fillStyle = '#240046';
    ctx.fillRect(102, 50, 12, 6);  // Scepter claws
    ctx.fillStyle = '#e0aaff';     // Glowing Crystal
    ctx.fillRect(104, 40, 8, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(106, 43, 4, 4);   // Highlight

    // Five-Star Rank Banner at bottom
    ctx.fillStyle = '#10002b';
    ctx.fillRect(30, 138, 100, 16);
    ctx.strokeStyle = '#9d4edd';
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 138, 100, 16);
    ctx.fillStyle = '#e0aaff';
    for (let s = 0; s < 5; s++) {
      ctx.fillRect(44 + s * 16, 142, 8, 8);
    }

    // Border
    ctx.strokeStyle = '#7b2cbf';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 156, 156);
    ctx.fillStyle = '#c77dff';
    ctx.fillRect(2, 2, 8, 8);
    ctx.fillRect(150, 2, 8, 8);
    ctx.fillRect(2, 150, 8, 8);
    ctx.fillRect(150, 150, 8, 8);

    scene.textures.addCanvas('NeowavePic', canvas);
  }

  // 3. MAP TILES & WORLD TEXTURES
  {
    // Floor
    const { canvas, ctx } = makeCanvas(64, 64);
    ctx.fillStyle = '#232926';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#2d3732';
    ctx.fillRect(4, 4, 26, 26);
    ctx.fillRect(34, 4, 26, 26);
    ctx.fillRect(4, 34, 26, 26);
    ctx.fillRect(34, 34, 26, 26);
    // Moss speckles
    ctx.fillStyle = '#1b4332';
    ctx.fillRect(8, 8, 4, 4);
    ctx.fillRect(48, 44, 4, 4);
    // Mortar
    ctx.strokeStyle = '#161d19';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 64, 64);
    scene.textures.addCanvas('tile_floor', canvas);
  }

  {
    // Dungeon Wall
    const { canvas, ctx } = makeCanvas(64, 64);
    ctx.fillStyle = '#3f4a44';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#2c3530';
    ctx.fillRect(2, 2, 60, 28);
    ctx.fillRect(2, 34, 28, 28);
    ctx.fillRect(34, 34, 28, 28);
    ctx.strokeStyle = '#1b231f';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 64, 64);
    ctx.beginPath();
    ctx.moveTo(0, 32); ctx.lineTo(64, 32); ctx.stroke();
    scene.textures.addCanvas('wall', canvas);
  }

  {
    // Stone Trodden Pathway
    const { canvas, ctx } = makeCanvas(64, 64);
    ctx.fillStyle = '#3a342c';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#4a4338';
    ctx.fillRect(6, 6, 22, 22);
    ctx.fillRect(36, 12, 20, 18);
    ctx.fillRect(10, 38, 24, 20);
    ctx.fillRect(38, 36, 20, 22);
    ctx.strokeStyle = '#28231c';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 64, 64);
    scene.textures.addCanvas('path_tile', canvas);
  }

  // 4. BUILDINGS: MATCH GATES, HERO ALTAR, MERCHANT SHOP
  {
    // Gate of Matches
    const { canvas, ctx } = makeCanvas(320, 160);
    ctx.fillStyle = '#2c332e';
    ctx.fillRect(20, 20, 280, 140);
    // Columns
    ctx.fillStyle = '#1c221e';
    ctx.fillRect(30, 20, 40, 140);
    ctx.fillRect(250, 20, 40, 140);
    // Portcullis & Red Portal
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(90, 40, 140, 120);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(110, 60, 100, 100);
    // Runes
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(130, 80, 12, 12);
    ctx.fillRect(178, 80, 12, 12);
    ctx.fillRect(150, 110, 20, 20);
    // Top Arch
    ctx.fillStyle = '#404c44';
    ctx.fillRect(10, 10, 300, 25);
    scene.textures.addCanvas('build_gate', canvas);
  }

  {
    // Altar of Heroes (Magical platform)
    const { canvas, ctx } = makeCanvas(160, 160);
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(80, 80, 75, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(80, 80, 60, 0, Math.PI * 2);
    ctx.fill();

    // Magic Circle
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(80, 80, 45, 0, Math.PI * 2);
    ctx.stroke();

    // Glowing runes
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(74, 74, 12, 12);
    ctx.fillRect(76, 40, 8, 8);
    ctx.fillRect(76, 112, 8, 8);
    ctx.fillRect(40, 76, 8, 8);
    ctx.fillRect(112, 76, 8, 8);
    scene.textures.addCanvas('build_altar', canvas);
  }

  {
    // Merchant Shop
    const { canvas, ctx } = makeCanvas(160, 160);
    // Wooden stall
    ctx.fillStyle = '#451a03';
    ctx.fillRect(20, 50, 120, 110);
    // Striped Awning (Purple & Gold)
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#7e22ce' : '#f59e0b';
      ctx.fillRect(15 + i * 22, 20, 22, 35);
    }
    // Counter
    ctx.fillStyle = '#78350f';
    ctx.fillRect(25, 90, 110, 25);
    // Potions on counter
    ctx.fillStyle = '#ef4444'; ctx.fillRect(40, 80, 10, 12);
    ctx.fillStyle = '#3b82f6'; ctx.fillRect(60, 78, 10, 14);
    ctx.fillStyle = '#10b981'; ctx.fillRect(80, 80, 10, 12);
    scene.textures.addCanvas('build_shop', canvas);
  }

  // 5. CHARACTERS: ZAZA, MONSTER ZAZA, GRIM, BJORN
  {
    // ZAZA - Normal Form (Exact 1:1 recreation of uploaded photo IMG_20260924_213926_443.jpg)
    // Chubby potato/dumpling body, flat warm peach flesh color with black contour,
    // green left eye, black right eye, wide red crescent smile,
    // thick dark indigo/purple drool dripping down past chin,
    // left floppy arm, right stub nub, small dark navel dot, and dark stubby legs.
    const { canvas, ctx } = makeCanvas(58, 66);

    // 1. Black outer contour of the chubby potato body
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    // Wide dome head
    ctx.ellipse(29, 21, 18, 14, 0, 0, Math.PI * 2);
    // Chubby belly
    ctx.ellipse(29, 36, 17, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Body skin fill: flat warm peachy cream flesh (#fed7aa / #fcd5a3)
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.ellipse(29, 21, 16, 12.5, 0, 0, Math.PI * 2);
    ctx.ellipse(29, 36, 15, 14.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle skin tone nuance matching the drawing
    ctx.fillStyle = '#fce2be';
    ctx.beginPath();
    ctx.ellipse(28, 20, 13, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Left Arm (angling down & outwards to the left, rounded tip)
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(14, 21);
    ctx.lineTo(8, 28);
    ctx.lineTo(8, 38);
    ctx.lineTo(13, 38);
    ctx.lineTo(15, 27);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.moveTo(13, 23);
    ctx.lineTo(9.5, 29);
    ctx.lineTo(9.5, 36.5);
    ctx.lineTo(12, 36.5);
    ctx.lineTo(14, 27);
    ctx.closePath();
    ctx.fill();

    // 4. Right Arm (stubby little shoulder nub along right contour)
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(45, 27, 4, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.ellipse(44, 27, 3, 5.5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 5. Dark Charcoal/Brown Stubby Legs & Feet at the bottom
    ctx.fillStyle = '#3f332a';
    // Left leg
    ctx.beginPath();
    ctx.moveTo(18, 48);
    ctx.lineTo(16, 62);
    ctx.lineTo(23, 62);
    ctx.lineTo(24, 48);
    ctx.closePath();
    ctx.fill();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(33, 48);
    ctx.lineTo(33, 62);
    ctx.lineTo(40, 62);
    ctx.lineTo(39, 48);
    ctx.closePath();
    ctx.fill();

    // 6. Left Eye: Large Green spot with thin dark border (as in photo)
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(23, 14, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(23, 14, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(23, 14, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(22, 13, 1.5, 1.5);

    // 7. Right Eye: Black circle/dot (as in photo)
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(36, 15, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(35, 14, 1, 1);

    // 8. Wide Goofy Happy Red Smile
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(29, 25, 10, 6, 0.05, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.ellipse(29, 25, 8.5, 4.8, 0.05, 0, Math.PI);
    ctx.fill();

    // 9. Signature Dark Indigo/Purple Drool Strand (drips straight down from right corner of mouth)
    ctx.fillStyle = '#18181b';
    ctx.fillRect(33, 26, 4.5, 14);
    ctx.fillRect(34, 38, 5, 4); // small bottom tip
    ctx.fillStyle = '#312e81';
    ctx.fillRect(34, 26, 3, 13);
    ctx.fillRect(35, 38, 3.5, 3);
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(34, 28, 1.5, 7); // wet shine highlight

    // 10. Navel Dot (tiny dark brown dot on lower belly)
    ctx.fillStyle = '#3f2818';
    ctx.fillRect(29, 45, 2.5, 2.5);

    scene.textures.addCanvas('char_zaza', canvas);
  }

  // 5b. HIGH-DEFINITION PORTRAITS & PREVIEW CARDS FOR ALTAR
  {
    // PORTRAIT ZAZA (Detailed, expressive card preview for User Photo 1)
    const { canvas, ctx } = makeCanvas(140, 150);

    // Card Background: Dark mystical violet gradient
    const bg = ctx.createLinearGradient(0, 0, 0, 150);
    bg.addColorStop(0, '#1e1b4b');
    bg.addColorStop(0.5, '#0f172a');
    bg.addColorStop(1, '#05050a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 140, 150);

    // Subtle toxic magical aura behind Zaza
    const aura = ctx.createRadialGradient(70, 75, 10, 70, 75, 60);
    aura.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
    aura.addColorStop(0.6, 'rgba(34, 197, 94, 0.15)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(70, 75, 60, 0, Math.PI * 2);
    ctx.fill();

    // Floating toxic bubble particles
    ctx.fillStyle = 'rgba(74, 222, 128, 0.6)';
    ctx.beginPath(); ctx.arc(25, 45, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(115, 35, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(120, 85, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(20, 95, 3.5, 0, Math.PI * 2); ctx.fill();

    // Zaza Body in Card Preview (Large, detailed, expressive)
    // Black outer contour
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(70, 52, 28, 0, Math.PI * 2); // Head bulb
    ctx.arc(70, 78, 33, 0, Math.PI * 2); // Belly bulb
    ctx.fill();

    // Main Peach Fill
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(70, 52, 25, 0, Math.PI * 2);
    ctx.arc(70, 78, 30, 0, Math.PI * 2);
    ctx.fill();

    // Rich Yellowish-Peach Tone
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(67, 50, 21, 0, Math.PI * 2);
    ctx.arc(67, 75, 26, 0, Math.PI * 2);
    ctx.fill();

    // Shading on lower right
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(78, 84, 18, 0, Math.PI * 2);
    ctx.fill();

    // Highlight on upper left
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(62, 42, 14, 0, Math.PI * 2);
    ctx.fill();

    // Left Arm
    ctx.fillStyle = '#18181b';
    ctx.fillRect(36, 52, 10, 28);
    ctx.fillRect(32, 66, 8, 12);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(38, 54, 7, 24);
    ctx.fillRect(34, 68, 6, 9);

    // Right Arm
    ctx.fillStyle = '#18181b';
    ctx.fillRect(94, 56, 12, 18);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(95, 58, 9, 14);

    // Feet
    ctx.fillStyle = '#27272a';
    ctx.fillRect(52, 100, 13, 18);
    ctx.fillRect(48, 114, 18, 6);
    ctx.fillRect(75, 100, 13, 18);
    ctx.fillRect(74, 114, 18, 6);

    // Left Eye: Bright Green Eye
    ctx.fillStyle = '#18181b';
    ctx.beginPath(); ctx.arc(58, 41, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath(); ctx.arc(58, 41, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#15803d';
    ctx.beginPath(); ctx.arc(58, 41, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(55, 38, 3, 3);

    // Right Eye: Beady Black Eye
    ctx.fillStyle = '#18181b';
    ctx.beginPath(); ctx.arc(79, 43, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(77, 41, 2, 2);

    // Big Goofy Open Red Smile
    ctx.fillStyle = '#18181b';
    ctx.beginPath(); ctx.ellipse(69, 58, 17, 10, 0.05, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.ellipse(69, 58, 14.5, 8, 0.05, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#991b1b';
    ctx.beginPath(); ctx.ellipse(69, 57.5, 11, 5, 0.05, 0, Math.PI); ctx.fill();

    // Purple Tongue / Drool Strand
    ctx.fillStyle = '#18181b';
    ctx.fillRect(78, 60, 7, 24);
    ctx.fillRect(80, 80, 8, 8);
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(79, 60, 5, 23);
    ctx.fillRect(81, 80, 6, 6);
    ctx.fillStyle = '#d8b4fe';
    ctx.fillRect(80, 63, 2, 14);

    // Navel Dot
    ctx.fillStyle = '#3f2818';
    ctx.fillRect(68, 88, 4, 4);

    // Card Borders & Corner Accents
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(3, 3, 134, 144);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(2, 2, 7, 7);
    ctx.fillRect(131, 2, 7, 7);
    ctx.fillRect(2, 141, 7, 7);
    ctx.fillRect(131, 141, 7, 7);

    // Bottom Badge: "✦ ЭПИЧЕСКИЙ ✦"
    ctx.fillStyle = '#3b0764';
    ctx.fillRect(18, 126, 104, 18);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1;
    ctx.strokeRect(18, 126, 104, 18);

    ctx.fillStyle = '#f5d0fe';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('✦ ЭПИЧЕСКИЙ ✦', 70, 139);

    scene.textures.addCanvas('portrait_zaza', canvas);
  }

  {
    // PORTRAIT GRIM (Alchemist card preview)
    const { canvas, ctx } = makeCanvas(140, 150);
    const bg = ctx.createLinearGradient(0, 0, 0, 150);
    bg.addColorStop(0, '#042f2e');
    bg.addColorStop(0.6, '#0f172a');
    bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 140, 150);

    // Glowing cyan mist
    const aura = ctx.createRadialGradient(70, 70, 10, 70, 70, 60);
    aura.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.arc(70, 70, 60, 0, Math.PI * 2); ctx.fill();

    // Dark Hooded Robe
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(70, 52, 26, Math.PI, Math.PI * 2);
    ctx.lineTo(105, 115);
    ctx.lineTo(35, 115);
    ctx.closePath();
    ctx.fill();

    // Inner cloak
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(52, 60, 36, 52);

    // Gas Mask / Face Covering
    ctx.fillStyle = '#334155';
    ctx.fillRect(54, 46, 32, 22);

    // Glowing Cyan Goggles
    ctx.fillStyle = '#0891b2';
    ctx.beginPath(); ctx.arc(60, 48, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(80, 48, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath(); ctx.arc(60, 48, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(80, 48, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(58, 46, 2, 2);
    ctx.fillRect(78, 46, 2, 2);

    // Glowing Alchemical Potion in hand
    ctx.fillStyle = '#a855f7';
    ctx.beginPath(); ctx.arc(70, 92, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e9d5ff';
    ctx.fillRect(68, 78, 4, 6); // Bottle neck
    ctx.fillStyle = '#c084fc';
    ctx.beginPath(); ctx.arc(68, 90, 3, 0, Math.PI * 2); ctx.fill(); // bubble

    // Card Borders
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(3, 3, 134, 144);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(2, 2, 7, 7);
    ctx.fillRect(131, 2, 7, 7);
    ctx.fillRect(2, 141, 7, 7);
    ctx.fillRect(131, 141, 7, 7);

    // Bottom Badge: "◆ ОБЫЧНЫЙ ◆"
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(18, 126, 104, 18);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(18, 126, 104, 18);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('◆ ОБЫЧНЫЙ ◆', 70, 139);

    scene.textures.addCanvas('portrait_grim', canvas);
  }

  {
    // PORTRAIT BJORN (Berserker card preview)
    const { canvas, ctx } = makeCanvas(140, 150);
    const bg = ctx.createLinearGradient(0, 0, 0, 150);
    bg.addColorStop(0, '#451a03');
    bg.addColorStop(0.6, '#18181b');
    bg.addColorStop(1, '#050508');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 140, 150);

    // Fiery orange rage aura
    const aura = ctx.createRadialGradient(70, 70, 10, 70, 70, 60);
    aura.addColorStop(0, 'rgba(249, 115, 22, 0.35)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.arc(70, 70, 60, 0, Math.PI * 2); ctx.fill();

    // Horned Viking Helmet
    ctx.fillStyle = '#64748b';
    ctx.fillRect(48, 30, 44, 28);
    // Horns
    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.moveTo(48, 38); ctx.lineTo(34, 22); ctx.lineTo(44, 30); ctx.fill();
    ctx.beginPath(); ctx.moveTo(92, 38); ctx.lineTo(106, 22); ctx.lineTo(96, 30); ctx.fill();

    // Face & Eyes
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(52, 50, 36, 18);
    ctx.fillStyle = '#18181b';
    ctx.fillRect(58, 54, 6, 4);
    ctx.fillRect(76, 54, 6, 4);

    // Huge bushy orange beard
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(48, 62);
    ctx.lineTo(92, 62);
    ctx.lineTo(84, 106);
    ctx.lineTo(70, 114);
    ctx.lineTo(56, 106);
    ctx.closePath();
    ctx.fill();

    // Fur and Leather armor
    ctx.fillStyle = '#78350f';
    ctx.fillRect(36, 92, 68, 30);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(42, 88, 14, 10);
    ctx.fillRect(84, 88, 14, 10);

    // Card Borders
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(3, 3, 134, 144);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(2, 2, 7, 7);
    ctx.fillRect(131, 2, 7, 7);
    ctx.fillRect(2, 141, 7, 7);
    ctx.fillRect(131, 141, 7, 7);

    // Bottom Badge: "◆ ОБЫЧНЫЙ ◆"
    ctx.fillStyle = '#27272a';
    ctx.fillRect(18, 126, 104, 18);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.strokeRect(18, 126, 104, 18);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('◆ ОБЫЧНЫЙ ◆', 70, 139);

    scene.textures.addCanvas('portrait_bjorn', canvas);
  }

  {
    // ZAZA MONSTER - Mutation Form (Exact match to User Photo 2)
    // Huge upright peach body, black outline, small beady eyes at top,
    // gigantic gaping black mouth taking up head and body,
    // sharp dripping red bloody teeth/fangs on top rim, red blood puddle at bottom,
    // drooping arms, two distinct red bloody patches on lower belly!
    const { canvas, ctx } = makeCanvas(68, 76);

    // Black body outline
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(34, 36, 25, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Peach body skin
    ctx.fillStyle = '#fce7b8';
    ctx.beginPath();
    ctx.ellipse(34, 36, 23, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Drooping side arms / ears
    ctx.fillStyle = '#18181b';
    ctx.fillRect(7, 22, 8, 28);
    ctx.fillRect(53, 22, 8, 28);
    ctx.fillStyle = '#fce7b8';
    ctx.fillRect(8, 23, 6, 26);
    ctx.fillRect(54, 23, 6, 26);

    // Small beady dark eyes at top
    ctx.fillStyle = '#18181b';
    ctx.fillRect(24, 10, 4, 4);
    ctx.fillRect(40, 10, 4, 4);

    // GIGANTIC GAPING BLACK MOUTH
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(34, 29, 17, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Red Dripping Bloody Teeth / Fangs on top rim
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(20, 18); ctx.lineTo(23, 27); ctx.lineTo(26, 18);
    ctx.moveTo(26, 17); ctx.lineTo(29, 30); ctx.lineTo(33, 17);
    ctx.moveTo(33, 17); ctx.lineTo(37, 31); ctx.lineTo(41, 17);
    ctx.moveTo(41, 18); ctx.lineTo(44, 26); ctx.lineTo(47, 18);
    ctx.fill();

    // Red tongue / blood pool at bottom of gaping mouth
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.ellipse(34, 41, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Two distinct Red Bloody Splatters / Patches on lower belly
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(21, 51, 8, 7);
    ctx.fillRect(20, 53, 10, 4);
    ctx.fillRect(41, 51, 8, 7);
    ctx.fillRect(39, 53, 10, 4);

    // Navel dot
    ctx.fillStyle = '#451a03';
    ctx.fillRect(34, 57, 2, 2);

    // Dark Stubby Feet at bottom
    ctx.fillStyle = '#27272a';
    ctx.fillRect(24, 63, 8, 10);
    ctx.fillRect(38, 63, 8, 10);

    scene.textures.addCanvas('char_zaza_monster', canvas);
  }

  {
    // GRIM (Shadow Alchemist)
    const { canvas, ctx } = makeCanvas(40, 52);
    // Dark robes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, 16, 24, 32);
    // Purple inner mantle
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(12, 20, 16, 24);
    // Hood & Gas Mask / Glowing Cyan Goggles
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(10, 8, 20, 16);
    ctx.fillStyle = '#00f5d4';
    ctx.fillRect(14, 12, 4, 4);
    ctx.fillRect(22, 12, 4, 4);
    // Flask on belt
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(26, 32, 8, 10);
    scene.textures.addCanvas('char_grim', canvas);
  }

  {
    // BJORN (Viking Berserker)
    const { canvas, ctx } = makeCanvas(48, 56);
    // Steel Horned Helmet
    ctx.fillStyle = '#64748b';
    ctx.fillRect(14, 8, 20, 16);
    // Horns
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(8, 4, 6, 8);
    ctx.fillRect(34, 4, 6, 8);
    // Golden Beard & Warrior face
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(16, 16, 16, 10);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(14, 22, 20, 12); // Big Beard
    // Fur & Armor
    ctx.fillStyle = '#92400e';
    ctx.fillRect(12, 28, 24, 22);
    // Massive Battleaxe on side
    ctx.fillStyle = '#78350f';
    ctx.fillRect(38, 10, 4, 40);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(32, 8, 16, 14);
    scene.textures.addCanvas('char_bjorn', canvas);
  }

  // 6. SKILL ICONS (32x32)
  const drawIconBg = (ctx: CanvasRenderingContext2D, bg: string, border: string) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 32, 32);
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 32, 32);
  };

  // Zaza Skill 1: Toxic Spit
  {
    const { canvas, ctx } = makeCanvas(32, 32);
    drawIconBg(ctx, '#14532d', '#84cc16');
    ctx.fillStyle = '#a3e635';
    ctx.beginPath();
    ctx.arc(16, 18, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, 6); ctx.lineTo(10, 16); ctx.lineTo(22, 16); ctx.fill();
    // Bubbles
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(14, 16, 3, 3);
    scene.textures.addCanvas('skill_zaza_1', canvas);
  }

  // Zaza Skill 2: Propeller Club
  {
    const { canvas, ctx } = makeCanvas(32, 32);
    drawIconBg(ctx, '#3f2c1d', '#f59e0b');
    ctx.fillStyle = '#b45309';
    ctx.save();
    ctx.translate(16, 16);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-12, -3, 24, 6);
    ctx.restore();
    // Wind whirls
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(16, 16, 11, 0, Math.PI * 1.4);
    ctx.stroke();
    scene.textures.addCanvas('skill_zaza_2', canvas);
  }

  // Zaza Skill 3: Monster Mutation (Ult)
  {
    const { canvas, ctx } = makeCanvas(32, 32);
    drawIconBg(ctx, '#3b0764', '#c084fc');
    // Monster Skull
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(8, 8, 16, 16);
    ctx.fillStyle = '#dc2626'; // Glowing red eyes
    ctx.fillRect(10, 12, 4, 4);
    ctx.fillRect(18, 12, 4, 4);
    // Horns
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(6, 4, 4, 6);
    ctx.fillRect(22, 4, 4, 6);
    scene.textures.addCanvas('skill_zaza_3', canvas);
  }

  // Monster Skills
  {
    const { canvas, ctx } = makeCanvas(32, 32);
    drawIconBg(ctx, '#450a0a', '#ef4444');
    // Giant fangs bite
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, 8, 5, 8);
    ctx.fillRect(19, 8, 5, 8);
    ctx.fillRect(13, 16, 6, 8);
    scene.textures.addCanvas('skill_monster_1', canvas);
  }

  {
    const { canvas, ctx } = makeCanvas(32, 32);
    drawIconBg(ctx, '#450a0a', '#f97316');
    // Roar sonic waves
    ctx.strokeStyle = '#fdba74';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(8, 16, 6, -Math.PI / 3, Math.PI / 3);
    ctx.arc(8, 16, 14, -Math.PI / 3, Math.PI / 3);
    ctx.arc(8, 16, 22, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
    scene.textures.addCanvas('skill_monster_2', canvas);
  }

  // Grim Skill 1: Tar Bomb
  {
    const { canvas, ctx } = makeCanvas(32, 32);
    drawIconBg(ctx, '#1e1b4b', '#818cf8');
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(16, 18, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f43f5e'; // Lit fuse
    ctx.fillRect(15, 6, 3, 5);
    scene.textures.addCanvas('skill_grim_1', canvas);
  }

  // Grim Skill 2: Shadow Step
  {
    const { canvas, ctx } = makeCanvas(32, 32);
    drawIconBg(ctx, '#022c22', '#2dd4bf');
    // Shadow silhouette dash
    ctx.fillStyle = '#0d9488';
    ctx.fillRect(10, 8, 14, 16);
    ctx.fillStyle = '#5eead4';
    ctx.fillRect(6, 18, 20, 4);
    scene.textures.addCanvas('skill_grim_2', canvas);
  }

  // Grim Skill 3: Explosive Cauldron (Ult)
  {
    const { canvas, ctx } = makeCanvas(32, 32);
    drawIconBg(ctx, '#450a0a', '#fb7185');
    // Cauldron
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(8, 12, 16, 14);
    // Green bubbling brew
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(10, 10, 12, 4);
    // Fiery blast
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(14, 4, 4, 6);
    scene.textures.addCanvas('skill_grim_3', canvas);
  }

  // Bjorn Skill 1: Earthquake
  {
    const { canvas, ctx } = makeCanvas(32, 32);
    drawIconBg(ctx, '#292524', '#a8a29e');
    // Stone spikes
    ctx.fillStyle = '#d6d3d1';
    ctx.beginPath();
    ctx.moveTo(8, 24); ctx.lineTo(12, 8); ctx.lineTo(16, 24); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, 24); ctx.lineTo(20, 12); ctx.lineTo(24, 24); ctx.fill();
    scene.textures.addCanvas('skill_bjorn_1', canvas);
  }

  // Bjorn Skill 2: Shield Ram
  {
    const { canvas, ctx } = makeCanvas(32, 32);
    drawIconBg(ctx, '#172554', '#60a5fa');
    // Iron Shield
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(10, 8, 12, 16);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(14, 12, 4, 8); // Golden crest
    scene.textures.addCanvas('skill_bjorn_2', canvas);
  }

  // Bjorn Skill 3: Axe Cyclone (Ult)
  {
    const { canvas, ctx } = makeCanvas(32, 32);
    drawIconBg(ctx, '#451a03', '#f59e0b');
    // Spinning Battleaxe blades
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(6, 14, 20, 4);
    ctx.fillRect(14, 6, 4, 20);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(4, 10, 6, 12);
    ctx.fillRect(22, 10, 6, 12);
    scene.textures.addCanvas('skill_bjorn_3', canvas);
  }

  // 7. RANK EMBLEMS
  const rankColors = [
    { key: 'rank_bronze', bg: '#78350f', border: '#b45309', fill: '#d97706' },
    { key: 'rank_silver', bg: '#334155', border: '#94a3b8', fill: '#e2e8f0' },
    { key: 'rank_gold',   bg: '#713f12', border: '#eab308', fill: '#fef08a' },
    { key: 'rank_plat',   bg: '#083344', border: '#06b6d4', fill: '#67e8f9' },
    { key: 'rank_diamond',bg: '#3b0764', border: '#c084fc', fill: '#f0abfc' },
  ];

  rankColors.forEach(r => {
    const { canvas, ctx } = makeCanvas(32, 32);
    ctx.fillStyle = r.bg;
    ctx.fillRect(0, 0, 32, 32);
    ctx.strokeStyle = r.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 28, 28);
    // Crest Star
    ctx.fillStyle = r.fill;
    ctx.beginPath();
    ctx.moveTo(16, 6); ctx.lineTo(20, 14); ctx.lineTo(28, 16);
    ctx.lineTo(22, 22); ctx.lineTo(24, 28); ctx.lineTo(16, 24);
    ctx.lineTo(8, 28); ctx.lineTo(10, 22); ctx.lineTo(4, 16);
    ctx.lineTo(12, 14); ctx.closePath();
    ctx.fill();
    scene.textures.addCanvas(r.key, canvas);
  });

  // 8. Firefly particle
  {
    const { canvas, ctx } = makeCanvas(6, 6);
    ctx.fillStyle = '#bef264';
    ctx.fillRect(1, 1, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 2, 2, 2);
    scene.textures.addCanvas('firefly', canvas);
  }

  // 9. Menu Mouse Creature
  {
    const { canvas, ctx } = makeCanvas(40, 30);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(10, 10, 20, 15);
    ctx.fillRect(25, 5, 10, 10);
    // Pink ears
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(28, 0, 8, 8);
    // Tail
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 20, 10, 4);
    // Eye
    ctx.fillStyle = '#000000';
    ctx.fillRect(32, 8, 4, 4);
    scene.textures.addCanvas('bg_mouse', canvas);
  }

  // 10. Dummy Enemy Target
  {
    const { canvas, ctx } = makeCanvas(40, 50);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(16, 35, 8, 15); // Stand
    ctx.fillStyle = '#b45309';
    ctx.fillRect(10, 15, 20, 24); // Straw body
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(12, 6, 16, 12);  // Head
    // Target bullseye
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(16, 22, 8, 8);
    scene.textures.addCanvas('target_dummy', canvas);
  }

  // 11. ARCO-style Ancient Monolith Temple & Back-view Warrior
  {
    // Ancient carved stone dome temple (320 x 240)
    const { canvas, ctx } = makeCanvas(320, 240);

    // Stone dome structure outline & body
    ctx.fillStyle = '#263325';
    ctx.beginPath();
    ctx.arc(160, 150, 130, Math.PI, 0);
    ctx.lineTo(290, 220);
    ctx.lineTo(30, 220);
    ctx.closePath();
    ctx.fill();

    // Main mossy stone body
    ctx.fillStyle = '#3c4d39';
    ctx.beginPath();
    ctx.arc(160, 150, 122, Math.PI, 0);
    ctx.lineTo(282, 218);
    ctx.lineTo(38, 218);
    ctx.closePath();
    ctx.fill();

    // Overgrown moss layer on top
    ctx.fillStyle = '#5e7d42';
    ctx.beginPath();
    ctx.arc(160, 150, 122, Math.PI * 1.1, Math.PI * 1.9);
    ctx.fill();

    ctx.fillStyle = '#84a84d';
    ctx.beginPath();
    ctx.arc(160, 142, 110, Math.PI * 1.2, Math.PI * 1.8);
    ctx.fill();

    // Ancient carved relief columns with squares and circles (Mesoamerican glyphs)
    ctx.fillStyle = '#232f22';
    ctx.fillRect(140, 45, 40, 100);
    ctx.fillStyle = '#657d5e';
    for (let y = 50; y < 140; y += 14) {
      ctx.fillRect(144, y, 12, 10);
      ctx.fillRect(164, y, 12, 10);
      ctx.fillStyle = '#232f22';
      ctx.fillRect(148, y + 3, 4, 4);
      ctx.fillRect(168, y + 3, 4, 4);
      ctx.fillStyle = '#657d5e';
    }

    // Side carved glyphs
    ctx.fillStyle = '#2a3829';
    ctx.fillRect(90, 85, 30, 50);
    ctx.fillRect(200, 85, 30, 50);
    ctx.fillStyle = '#556c50';
    ctx.fillRect(94, 90, 22, 10);
    ctx.fillRect(94, 106, 22, 10);
    ctx.fillRect(204, 90, 22, 10);
    ctx.fillRect(204, 106, 22, 10);

    // Stone Archway Cave Entrance
    ctx.fillStyle = '#1e281e';
    ctx.beginPath();
    ctx.arc(160, 185, 58, Math.PI, 0);
    ctx.lineTo(218, 225);
    ctx.lineTo(102, 225);
    ctx.closePath();
    ctx.fill();

    // Dark mysterious portal inside
    ctx.fillStyle = '#060d09';
    ctx.beginPath();
    ctx.arc(160, 185, 46, Math.PI, 0);
    ctx.lineTo(206, 225);
    ctx.lineTo(114, 225);
    ctx.closePath();
    ctx.fill();

    // Inner warm mystical glow
    ctx.fillStyle = '#10331f';
    ctx.beginPath();
    ctx.arc(160, 195, 34, Math.PI, 0);
    ctx.fill();

    // Arch stones (voussoirs)
    ctx.strokeStyle = '#4e644b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(160, 185, 52, Math.PI, 0);
    ctx.stroke();

    // Overhanging moss vines
    ctx.fillStyle = '#789a46';
    ctx.fillRect(125, 135, 6, 24);
    ctx.fillRect(138, 130, 4, 16);
    ctx.fillRect(178, 132, 5, 20);
    ctx.fillRect(190, 138, 6, 26);

    // Stone steps at base
    ctx.fillStyle = '#344232';
    ctx.fillRect(95, 218, 130, 8);
    ctx.fillStyle = '#283526';
    ctx.fillRect(80, 226, 160, 12);

    scene.textures.addCanvas('arco_ruins', canvas);
  }

  {
    // Back-view warrior standing on path (32 x 46)
    const { canvas, ctx } = makeCanvas(32, 46);

    // Dark hair / head viewed from behind
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(16, 10, 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fur mantle / cloak across shoulders
    ctx.fillStyle = '#78350f';
    ctx.fillRect(6, 16, 20, 14);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(8, 16, 16, 6);

    // Tunic body
    ctx.fillStyle = '#292524';
    ctx.fillRect(9, 28, 14, 10);

    // Leather belt
    ctx.fillStyle = '#451a03';
    ctx.fillRect(9, 28, 14, 3);

    // Legs / Boots
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(10, 38, 5, 8);
    ctx.fillRect(17, 38, 5, 8);

    scene.textures.addCanvas('arco_warrior', canvas);
  }

  // 12. DUNGEON ASSETS: MOBS, BOSS, CHESTS, DOORS, PICKUPS
  {
    // Skeleton Warrior (32x42)
    const { canvas, ctx } = makeCanvas(32, 42);
    // Skull
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(10, 4, 12, 10);
    // Eye sockets
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(12, 7, 3, 3);
    ctx.fillRect(17, 7, 3, 3);
    // Ribcage & Spine
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(14, 14, 4, 14);
    ctx.fillRect(9, 16, 14, 2);
    ctx.fillRect(10, 20, 12, 2);
    ctx.fillRect(11, 24, 10, 2);
    // Tattered cloth
    ctx.fillStyle = '#78350f';
    ctx.fillRect(10, 27, 12, 6);
    // Bone legs
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(11, 33, 3, 9);
    ctx.fillRect(18, 33, 3, 9);
    // Rusty Iron Sword
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(24, 10, 3, 20);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(22, 26, 7, 3);
    scene.textures.addCanvas('mob_skeleton', canvas);
  }

  {
    // Toxic Slime (34x28)
    const { canvas, ctx } = makeCanvas(34, 28);
    // Gelatinous body
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(17, 16, 14, Math.PI, 0);
    ctx.lineTo(32, 24);
    ctx.lineTo(2, 24);
    ctx.closePath();
    ctx.fill();
    // Inner shiny core
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.arc(17, 14, 9, Math.PI, 0);
    ctx.fill();
    // Angry cute red eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(10, 12, 4, 4);
    ctx.fillRect(20, 12, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, 12, 1.5, 1.5);
    ctx.fillRect(22, 12, 1.5, 1.5);
    // Base droplets
    ctx.fillStyle = '#15803d';
    ctx.fillRect(4, 22, 26, 4);
    scene.textures.addCanvas('mob_slime', canvas);
  }

  {
    // Dark Mage (36x46)
    const { canvas, ctx } = makeCanvas(36, 46);
    // Robe
    ctx.fillStyle = '#3b0764';
    ctx.beginPath();
    ctx.moveTo(18, 14); ctx.lineTo(32, 44); ctx.lineTo(4, 44); ctx.closePath();
    ctx.fill();
    // Hood
    ctx.fillStyle = '#581c87';
    ctx.fillRect(10, 6, 16, 14);
    // Dark void face with glowing purple eyes
    ctx.fillStyle = '#0f051d';
    ctx.fillRect(12, 10, 12, 8);
    ctx.fillStyle = '#e879f9';
    ctx.fillRect(14, 12, 3, 3);
    ctx.fillRect(19, 12, 3, 3);
    // Magic Staff
    ctx.fillStyle = '#78350f';
    ctx.fillRect(28, 8, 3, 36);
    // Glowing Crystal Orb on Staff
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(29, 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(28, 4, 2, 2);
    scene.textures.addCanvas('mob_mage', canvas);
  }

  {
    // Ancient Golem Boss (80x80)
    const { canvas, ctx } = makeCanvas(80, 80);
    // Massive Stone Torso
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(40, 42, 32, 0, Math.PI * 2);
    ctx.fill();
    // Mossy cracks
    ctx.fillStyle = '#15803d';
    ctx.fillRect(26, 26, 8, 4);
    ctx.fillRect(48, 46, 10, 4);
    // Stone Shoulders & Fists
    ctx.fillStyle = '#475569';
    ctx.fillRect(6, 32, 16, 24); // Left fist
    ctx.fillRect(58, 32, 16, 24); // Right fist
    // Head / Faceplate
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(28, 14, 24, 20);
    // Glowing Rune Core (Center Chest)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(40, 44, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(38, 42, 4, 4);
    // Glowing Red Eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(32, 22, 5, 4);
    ctx.fillRect(43, 22, 5, 4);
    // Heavy Stone Legs
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(22, 60, 14, 18);
    ctx.fillRect(44, 60, 14, 18);
    // Gold Rune Trim
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 14, 24, 20);
    scene.textures.addCanvas('boss_golem', canvas);
  }

  {
    // Dungeon Chest (Closed, 36x30)
    const { canvas, ctx } = makeCanvas(36, 30);
    // Wood chest body
    ctx.fillStyle = '#78350f';
    ctx.fillRect(3, 8, 30, 20);
    // Gold bands
    ctx.fillStyle = '#eab308';
    ctx.fillRect(3, 8, 4, 20);
    ctx.fillRect(29, 8, 4, 20);
    ctx.fillRect(3, 14, 30, 3);
    // Gold Keyhole Lock
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(16, 13, 5, 6);
    ctx.fillStyle = '#000000';
    ctx.fillRect(18, 15, 2, 2);
    scene.textures.addCanvas('dungeon_chest', canvas);
  }

  {
    // Dungeon Chest (Open, 36x34)
    const { canvas, ctx } = makeCanvas(36, 34);
    // Open lid flipped back
    ctx.fillStyle = '#92400e';
    ctx.fillRect(3, 2, 30, 10);
    // Inner chest with sparkling treasure & gems
    ctx.fillStyle = '#451a03';
    ctx.fillRect(3, 12, 30, 20);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(7, 14, 22, 8);
    // Gems
    ctx.fillStyle = '#ef4444'; ctx.fillRect(10, 15, 3, 3);
    ctx.fillStyle = '#38bdf8'; ctx.fillRect(18, 15, 4, 4);
    ctx.fillStyle = '#4ade80'; ctx.fillRect(24, 16, 3, 3);
    scene.textures.addCanvas('dungeon_chest_open', canvas);
  }

  {
    // Dungeon Gate Bars (Closed with red seal, 64x40)
    const { canvas, ctx } = makeCanvas(64, 40);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 64, 40);
    // Iron Portcullis Bars
    ctx.fillStyle = '#475569';
    for (let x = 6; x < 60; x += 8) {
      ctx.fillRect(x, 2, 4, 36);
    }
    // Red glowing sealing rune
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(26, 14, 12, 12);
    ctx.strokeStyle = '#f87171';
    ctx.strokeRect(24, 12, 16, 16);
    scene.textures.addCanvas('dungeon_door_closed', canvas);
  }

  {
    // Dungeon Gate (Open with green passage glow, 64x40)
    const { canvas, ctx } = makeCanvas(64, 40);
    ctx.fillStyle = '#052e16';
    ctx.fillRect(0, 0, 64, 40);
    // Green magical light portal
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(12, 6, 40, 28);
    ctx.fillStyle = '#86efac';
    ctx.fillRect(20, 12, 24, 16);
    scene.textures.addCanvas('dungeon_door_open', canvas);
  }

  {
    // Heart Health Pickup (16x16)
    const { canvas, ctx } = makeCanvas(16, 16);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(8, 14);
    ctx.lineTo(2, 7);
    ctx.arc(5, 5, 3, Math.PI, 0);
    ctx.arc(11, 5, 3, Math.PI, 0);
    ctx.lineTo(14, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 4, 2, 2);
    scene.textures.addCanvas('heart_pickup', canvas);
  }

  {
    // Coin Pickup (14x14)
    const { canvas, ctx } = makeCanvas(14, 14);
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(7, 7, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(5, 4, 4, 6);
    scene.textures.addCanvas('coin_pickup', canvas);
  }

  {
    // Ancient Shrine Altar (48x48)
    const { canvas, ctx } = makeCanvas(48, 48);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(6, 12, 36, 32);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(24, 18, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(22, 16, 4, 4);
    scene.textures.addCanvas('dungeon_shrine', canvas);
  }
}

