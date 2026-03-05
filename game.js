// ============================================
// DRAGON BALL RPG - Full Implementation
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game States
const STATES = {
    INTRO: 'intro',
    TITLE: 'title',
    WORLD: 'world',
    DIALOGUE: 'dialogue',
    COMBAT: 'combat',
    INVENTORY: 'inventory',
    STATS: 'stats',
    LEVELUP: 'levelup',
    RHYTHM: 'rhythm',  // Guitar Hero style mini-game
    GAMEOVER: 'gameover'
};

// ============================================
// GAME CONFIGURATION
// ============================================
const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 20;

// ============================================
// PLAYER DATA
// ============================================
let player = {
    x: 12, y: 15,
    level: 1,
    hp: 100, maxHp: 100,
    ki: 50, maxKi: 50,
    attack: 15,
    defense: 8,
    speed: 10,
    xp: 0,
    xpNeeded: 100,
    powerLevel: 5,
    inventory: [],
    dragonBalls: [],
    currentZone: 'meadow',
    transformLevel: 0, // 0=normal, 1=SSJ, 2=SSJ2, etc.
    comboCount: 0,
    stance: 'balanced', // balanced, offense, defense
    specialMeter: 0
};

// ============================================
// QUEST SYSTEM
// ============================================
const QUESTS = {
    'roshi_training': {
        id: 'roshi_training',
        title: 'Master Roshi\'s Training',
        giver: 'Master Roshi',
        description: 'Collect the Turtle Shell from Turtle Island',
        completed: false,
        objectives: [{ type: 'collect', item: 'Turtle Shell', count: 1, current: 0 }],
        reward: { xp: 200, item: 'Weighted Clothing', ki: 20 }
    },
    'korins_trial': {
        id: 'korins_trial',
        title: 'Sacred Water Trial',
        giver: 'Korin',
        description: 'Complete Korin\'s Rhythm Challenge to earn increased speed',
        completed: false,
        objectives: [{ type: 'minigame', game: 'rhythm', score: 0, target: 80 }],
        reward: { xp: 500, speed: 5, item: 'Sacred Water' }
    },
    'gather_dragonballs': {
        id: 'gather_dragonballs',
        title: 'Gather the Dragon Balls',
        giver: 'Bulma',
        description: 'Find all 7 Dragon Balls scattered across the world',
        completed: false,
        objectives: [{ type: 'collect', item: 'Dragon Ball', count: 7, current: 0 }],
        reward: { xp: 1000, canMakeWish: true }
    },
    'defeat_raditz': {
        id: 'defeat_raditz',
        title: 'Defeat Raditz',
        giver: 'Piccolo',
        description: 'Defeat the Saiyan invader Raditz before he destroys the world',
        completed: false,
        objectives: [{ type: 'defeat', enemy: 'Raditz', count: 1, current: 0 }],
        reward: { xp: 2000, unlockZone: 'hyperbolic' }
    },
    'hyperbolic_training': {
        id: 'hyperbolic_training',
        title: 'Hyperbolic Chamber Training',
        giver: 'Mr. Popo',
        description: 'Survive 10 battles in the Hyperbolic Time Chamber',
        completed: false,
        objectives: [{ type: 'survive', count: 10, current: 0 }],
        reward: { xp: 5000, transformLevel: 1 }
    }
};

let activeQuests = ['roshi_training'];
let completedQuests = [];

// ============================================
// WORLD ZONES
// ============================================
const ZONES = {
    meadow: {
        name: 'Kame Meadow',
        bg: '#87CEEB',
        ground: '#4ade80',
        enemies: ['Saibamen', 'Wolf'],
        items: ['Senzu Bean', 'Dragon Ball'],
        exits: { east: 'turtle_island', north: 'west_city' }
    },
    turtle_island: {
        name: 'Turtle Island',
        bg: '#60a5fa',
        ground: '#fbbf24',
        enemies: ['Crab', 'Turtle Pirate'],
        items: ['Turtle Shell', 'Dragon Ball'],
        exits: { west: 'meadow' }
    },
    west_city: {
        name: 'West City',
        bg: '#a78bfa',
        ground: '#6b7280',
        enemies: ['Robber', 'Street Fighter'],
        items: ['Capsule', 'Dragon Ball'],
        exits: { south: 'meadow', north: 'korins_tower' }
    },
    korins_tower: {
        name: 'Korin\'s Tower',
        bg: '#f5f5f5',
        ground: '#8b5cf6',
        enemies: ['Mercenary Tao Clone', 'Tower Guard'],
        items: ['Sacred Water', 'Dragon Ball'],
        exits: { south: 'west_city', up: 'lookout' }
    },
    lookout: {
        name: 'Kami\'s Lookout',
        bg: '#e0f2fe',
        ground: '#14b8a6',
        enemies: ['Demon', 'Sky Fighter'],
        items: ['Senzu Bean', 'Dragon Ball'],
        exits: { down: 'korins_tower', portal: 'hyperbolic' }
    },
    hyperbolic: {
        name: 'Hyperbolic Time Chamber',
        bg: '#ffffff',
        ground: '#f3f4f6',
        enemies: ['Shadow Clone', 'Time Phantom', 'Past Self'],
        items: ['Time Crystal'],
        exits: { portal: 'lookout' },
        locked: true
    },
    wasteland: {
        name: 'Wasteland Battleground',
        bg: '#d4a574',
        ground: '#8b6914',
        enemies: ['Strong Saibamen', 'Raditz'],
        items: ['Dragon Ball'],
        exits: { east: 'meadow' },
        locked: true
    }
};

// ============================================
// NPCS
// ============================================
const NPCS = {
    roshi: {
        name: 'Master Roshi',
        x: 20, y: 18, zone: 'meadow',
        sprite: '👴', color: '#ffa500',
        questId: 'roshi_training',
        dialogue: {
            initial: ['Greetings, young warrior! I am Master Roshi.', 'If you wish to learn the Turtle School style, first prove yourself by finding my lost Turtle Shell on Turtle Island.'],
            active: ['Have you found the Turtle Shell yet? Keep looking on Turtle Island!'],
            ready: ['Ah! You found it! Excellent work!', '*takes the shell*', 'Now, let me teach you the basics of Ki control...'],
            postComplete: ['You\'re coming along well! Remember: work hard, study well, and eat and sleep plenty!']
        }
    },
    korin: {
        name: 'Korin',
        x: 15, y: 12, zone: 'korins_tower',
        sprite: '🐱', color: '#fff',
        questId: 'korins_trial',
        dialogue: {
            initial: ['Ho ho! Another eager warrior seeking the Sacred Water?', 'Pass my Rhythm Trial first! Show me your reflexes!'],
            active: ['The trial awaits! Press SPACE when the notes hit the target!'],
            ready: ['Magnificent! Your reflexes are sharp!', 'Take this Sacred Water. It will increase your agility.'],
            postComplete: ['You\'ve passed my trial. Return anytime to practice!']
        }
    },
    bulma: {
        name: 'Bulma',
        x: 18, y: 10, zone: 'west_city',
        sprite: '🔵', color: '#3b82f6',
        questId: 'gather_dragonballs',
        dialogue: {
            initial: ['Hey! I\'m Bulma, a genius inventor!', 'I\'m searching for the Dragon Balls. If you collect all 7, you can summon Shenron!'],
            active: ['Found any Dragon Balls? They look like orange stars. Keep searching!'],
            ready: ['ALL SEVEN?! Incredible!', 'Let\'s summon Shenron and make a wish!'],
            dragonballsCollected: ['The Dragon Balls are gathered!', 'Make your wish when you\'re ready!'],
            postComplete: ['I hope your wish came true! Maybe I should wish for a boyfriend...']
        }
    },
    piccolo: {
        name: 'Piccolo',
        x: 5, y: 10, zone: 'wasteland',
        sprite: '👽', color: '#22c55e',
        questId: 'defeat_raditz',
        dialogue: {
            initial: ['A Saiyan named Raditz has arrived. He\'s incredibly powerful.', 'We must work together. Defeat him, and I\'ll help you unlock new powers.'],
            active: ['Raditz still lives. Hurry!'],
            ready: ['You defeated Raditz? Impossible... but impressive.', 'The Hyperbolic Time Chamber is now open. Train there for immense power.'],
            postComplete: ['We may be allies now, but don\'t forget who I am...']
        }
    },
    popo: {
        name: 'Mr. Popo',
        x: 20, y: 20, zone: 'lookout',
        sprite: '👨🏿', color: '#4b5563',
        questId: 'hyperbolic_training',
        dialogue: {
            initial: ['I am Mr. Popo. Kami\'s attendant.', 'The Hyperbolic Time Chamber awaits. Survive 10 battles inside.'],
            active: ['Train in the Chamber. Fight 10 battles to prove your worth.'],
            ready: ['You survived the Chamber! Your power has increased dramatically!', 'You may now access Super Saiyan form in combat!'],
            postComplete: ['Welcome, Super Saiyan. You have done well.']
        }
    }
};

// ============================================
// ENEMIES
// ============================================
const ENEMIES = {
    'Saibamen': { hp: 30, attack: 8, defense: 3, xp: 25, sprite: '🌱', color: '#22c55e', ki: 0 },
    'Wolf': { hp: 40, attack: 10, defense: 4, xp: 35, sprite: '🐺', color: '#6b7280', ki: 0 },
    'Crab': { hp: 25, attack: 6, defense: 8, xp: 20, sprite: '🦀', color: '#ef4444', ki: 0 },
    'Turtle Pirate': { hp: 50, attack: 12, defense: 6, xp: 50, sprite: '🐢', color: '#f97316', ki: 10 },
    'Robber': { hp: 45, attack: 11, defense: 5, xp: 40, sprite: '💰', color: '#374151', ki: 0 },
    'Street Fighter': { hp: 60, attack: 14, defense: 7, xp: 65, sprite: '🥊', color: '#fbbf24', ki: 15 },
    'Mercenary Tao Clone': { hp: 80, attack: 18, defense: 10, xp: 100, sprite: '🌀', color: '#8b5cf6', ki: 30 },
    'Tower Guard': { hp: 70, attack: 16, defense: 12, xp: 85, sprite: '🛡️', color: '#6366f1', ki: 20 },
    'Demon': { hp: 90, attack: 20, defense: 8, xp: 120, sprite: '👹', color: '#dc2626', ki: 40 },
    'Sky Fighter': { hp: 75, attack: 17, defense: 9, xp: 95, sprite: '🦅', color: '#0ea5e9', ki: 25 },
    'Strong Saibamen': { hp: 60, attack: 15, defense: 6, xp: 60, sprite: '🌿', color: '#16a34a', ki: 15 },
    'Shadow Clone': { hp: 100, attack: 22, defense: 10, xp: 150, sprite: '👤', color: '#9ca3af', ki: 50 },
    'Time Phantom': { hp: 120, attack: 25, defense: 12, xp: 200, sprite: '👻', color: '#e5e7eb', ki: 60 },
    'Past Self': { hp: 150, attack: player.attack, defense: player.defense, xp: 300, sprite: '👥', color: '#fbbf24', ki: 80, special: true },
    'Raditz': { 
        hp: 500, attack: 40, defense: 20, xp: 2000, sprite: '💀', color: '#7c2d12', ki: 100,
        boss: true, specialMoves: ['Double Sunday', 'Saturday Crush']
    }
};

// ============================================
// ITEMS
// ============================================
const ITEMS = {
    'Senzu Bean': { type: 'consumable', effect: 'heal', value: 100, desc: 'Restores all HP and Ki', icon: '🌰' },
    'Turtle Shell': { type: 'quest', questId: 'roshi_training', desc: 'Master Roshi\'s treasured shell', icon: '🐚' },
    'Dragon Ball': { type: 'collectible', desc: 'One of the legendary 7 Dragon Balls', icon: '⭐' },
    'Sacred Water': { type: 'perm_buff', stat: 'speed', value: 5, desc: 'Permanent +5 Speed', icon: '💧' },
    'Weighted Clothing': { type: 'equipment', slot: 'body', attack: 2, defense: 5, desc: 'Heavy but protective', icon: '👕' },
    'Capsule': { type: 'consumable', effect: 'random', desc: 'Contains an unknown item', icon: '💊' },
    'Time Crystal': { type: 'currency', desc: 'Crystal formed in the Hyperbolic Chamber', icon: '💎' }
};

// ============================================
// GAME STATE VARIABLES
// ============================================
let gameState = STATES.INTRO;
let lastTime = 0;
let keys = {};
let camera = { x: 0, y: 0 };
let introProgress = 0;
let introPhase = 'stars'; // stars, balls, shenlong

// Combat variables
let combat = {
    active: false,
    enemy: null,
    enemyMaxHp: 0,
    turn: 'player',
    log: [],
    comboTimer: 0,
    chargingKi: false,
    kiChargeAmount: 0,
    playerDodging: false,
    playerGuarding: false,
    turnCount: 0
};

// Rhythm game variables
let rhythmGame = {
    notes: [],
    score: 0,
    combo: 0,
    active: false,
    laneY: 450,
    hitY: 500,
    lanes: [200, 300, 400, 500],
    keys: ['s', 'd', 'j', 'k'],
    noteSpeed: 3,
    maxScore: 200,
    difficulty: 'normal'
};

// Map and world
let worldMap = [];
let itemsOnGround = [];
let currentNPC = null;
let dialogueIndex = 0;

// Particles
let particles = [];

// ============================================
// INITIALIZATION
// ============================================
function init() {
    generateWorld();
    addEventListeners();
    requestAnimationFrame(gameLoop);
}

function generateWorld() {
    worldMap = [];
    itemsOnGround = [];
    const zone = ZONES[player.currentZone];
    
    // Generate terrain
    for(let y = 0; y < MAP_HEIGHT; y++) {
        const row = [];
        for(let x = 0; x < MAP_WIDTH; x++) {
            // Borders
            if(x === 0 || x === MAP_WIDTH-1 || y === 0 || y === MAP_HEIGHT-1) {
                row.push('wall');
            } else {
                const rand = Math.random();
                if(rand < 0.05) row.push('tree');
                else if(rand < 0.02) row.push('rock');
                else if(rand < 0.03) row.push('item');
                else if(rand < 0.04) row.push('encounter');
                else row.push('empty');
            }
        }
        worldMap.push(row);
    }
    
    // Clear player spawn area
    for(let y = player.y - 2; y <= player.y + 2; y++) {
        for(let x = player.x - 2; x <= player.x + 2; x++) {
            if(y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                worldMap[y][x] = 'empty';
            }
        }
    }
    
    // Spawn zone-specific items
    zone.items.forEach(itemType => {
        if(Math.random() < 0.5 || itemType === 'Dragon Ball') {
            let placed = false;
            while(!placed) {
                const x = Math.floor(Math.random() * (MAP_WIDTH-2)) + 1;
                const y = Math.floor(Math.random() * (MAP_HEIGHT-2)) + 1;
                if(worldMap[y][x] === 'empty') {
                    itemsOnGround.push({ x, y, item: itemType });
                    worldMap[y][x] = 'item_marker';
                    placed = true;
                }
            }
        }
    });
    
    // Spawn Dragon Balls (1 per zone except Hyperbolic)
    if(player.currentZone !== 'hyperbolic' && player.dragonBalls.length < 7) {
        let placed = false;
        while(!placed) {
            const x = Math.floor(Math.random() * (MAP_WIDTH-2)) + 1;
            const y = Math.floor(Math.random() * (MAP_HEIGHT-2)) + 1;
            if(worldMap[y][x] === 'empty') {
                itemsOnGround.push({ x, y, item: 'Dragon Ball', dragonBallId: player.dragonBalls.length + 1 });
                worldMap[y][x] = 'item_marker';
                placed = true;
            }
        }
    }
}

function addEventListeners() {
    window.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        
        if(gameState === STATES.WORLD) {
            handleWorldInput(e.key);
        } else if(gameState === STATES.DIALOGUE) {
            handleDialogueInput(e.key);
        } else if(gameState === STATES.COMBAT) {
            handleCombatInput(e.key);
        } else if(gameState === STATES.RHYTHM) {
            handleRhythmInput(e.key);
        } else if(gameState === STATES.INTRO || gameState === STATES.TITLE) {
            if(e.key === ' ') {
                if(gameState === STATES.INTRO) skipIntro();
                else gameState = STATES.WORLD;
            }
        } else if(gameState === STATES.INVENTORY) {
            if(e.key === 'i' || e.key === 'Escape') toggleInventory();
        } else if(gameState === STATES.LEVELUP) {
            if(e.key === ' ') gameState = STATES.WORLD;
        }
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
        if(combat.chargingKi && e.key.toLowerCase() === 'q') {
            combat.chargingKi = false;
        }
    });
    
    // Combat buttons
    document.querySelectorAll('#combat-actions button').forEach(btn => {
        btn.addEventListener('click', () => handleCombatAction(btn.dataset.action));
    });
    
    // Restart button
    document.getElementById('restart-btn')?.addEventListener('click', restartGame);
}

// ============================================
// INTRO SEQUENCE
// ============================================
function updateIntro(dt) {
    introProgress += dt * 0.0005;
    
    if(introPhase === 'stars' && introProgress > 2) {
        introPhase = 'balls';
        introProgress = 0;
    } else if(introPhase === 'balls' && introProgress > 3) {
        introPhase = 'shenlong';
        introProgress = 0;
    } else if(introPhase === 'shenlong' && introProgress > 4) {
        gameState = STATES.TITLE;
    }
}

function drawIntro() {
    // Clear gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f0f23');
    gradient.addColorStop(1, '#1a1a3e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    for(let i = 0; i < 100; i++) {
        const twinkle = Math.sin(Date.now() * 0.003 + i) * 0.5 + 0.5;
        const size = Math.random() * 2 + 1;
        const x = (Math.sin(i * 137.5) * 43758.5453 % 1) * canvas.width;
        const y = (Math.cos(i * 137.5) * 43758.5453 % 1) * canvas.height;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    if(introPhase === 'balls' || introPhase === 'shenlong') {
        // Draw 7 Dragon Balls orbiting
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 - 50;
        const orbitRadius = introPhase === 'shenlong' ? 30 + introProgress * 20 : 80;
        const rotation = Date.now() * 0.0005;
        
        for(let i = 0; i < 7; i++) {
            const angle = (i / 7) * Math.PI * 2 + rotation;
            const bx = centerX + Math.cos(angle) * orbitRadius;
            const by = centerY + Math.sin(angle) * orbitRadius * 0.7;
            
            // Dragon Ball glow
            const glowPulse = Math.sin(Date.now() * 0.005 + i) * 10 + 20;
            ctx.shadowColor = '#ff9500';
            ctx.shadowBlur = glowPulse;
            
            // Ball
            const ballGrad = ctx.createRadialGradient(bx-5, by-5, 0, bx, by, 20);
            ballGrad.addColorStop(0, '#ffcc00');
            ballGrad.addColorStop(0.7, '#ff6600');
            ballGrad.addColorStop(1, '#cc3300');
            ctx.fillStyle = ballGrad;
            ctx.beginPath();
            ctx.arc(bx, by, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Stars
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ff0000';
            const starPoints = [0, 72, 144, 216, 288];
            for(let j = 0; j < 5; j++) {
                const sx = bx + Math.cos(starPoints[j] * Math.PI / 180) * 6;
                const sy = by + Math.sin(starPoints[j] * Math.PI / 180) * 6;
                ctx.beginPath();
                ctx.arc(sx, sy, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Stars count
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('★'.repeat(i + 1), bx, by + 22);
        }
        
        // Reset shadow
        ctx.shadowBlur = 0;
    }
    
    if(introPhase === 'shenlong') {
        // Draw Shenlong partially appearing
        const shenlongOpacity = Math.min(introProgress / 2, 1);
        const shenlongY = 200 - introProgress * 20;
        
        drawShenlong(canvas.width / 2, shenlongY, shenlongOpacity);
        
        // Text
        ctx.fillStyle = `rgba(255, 215, 0, ${shenlongOpacity})`;
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STATE YOUR WISH...', canvas.width / 2, canvas.height - 100);
        
        if(introProgress > 2) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(introProgress - 2) / 2})`;
            ctx.font = '20px monospace';
            ctx.fillText('I wish for...', canvas.width / 2, canvas.height - 60);
        }
    }
    
    // Skip hint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('[SPACE to skip]', canvas.width - 20, canvas.height - 20);
}

function drawShenlong(x, y, opacity) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, y);
    
    // Body segments (dragon coiled)
    const segments = [
        {x: 0, y: 100, size: 40}, {x: 60, y: 80, size: 35},
        {x: 100, y: 40, size: 30}, {x: 80, y: -20, size: 28},
        {x: 20, y: -60, size: 25}, {x: -40, y: -40, size: 23},
        {x: -60, y: 20, size: 20}
    ];
    
    // Draw from tail to head
    ctx.fillStyle = '#228b22';
    ctx.strokeStyle = '#1a6b1a';
    ctx.lineWidth = 3;
    
    for(let i = segments.length - 1; i >= 0; i--) {
        const s = segments[i];
        // Body segment
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.size, s.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Scales
        ctx.fillStyle = '#2e8b2e';
        for(let j = 0; j < 3; j++) {
            ctx.beginPath();
            ctx.arc(s.x - 10 + j * 10, s.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#228b22';
    }
    
    // Head
    ctx.fillStyle = '#228b22';
    ctx.beginPath();
    ctx.ellipse(-60, 20, 35, 25, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Eyes
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(-75, 15, 8, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(-55, 20, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Horns
    ctx.fillStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(-85, 5);
    ctx.lineTo(-95, -30);
    ctx.lineTo(-80, 5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-70, 8);
    ctx.lineTo(-75, -25);
    ctx.lineTo(-65, 8);
    ctx.fill();
    
    // Whiskers
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-90, 30);
    ctx.quadraticCurveTo(-120, 50, -110, 80);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-45, 35);
    ctx.quadraticCurveTo(-20, 60, -30, 85);
    ctx.stroke();
    
    ctx.restore();
}

function skipIntro() {
    gameState = STATES.TITLE;
}

function drawTitle() {
    // Same starry background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f0f23');
    gradient.addColorStop(1, '#1a1a3e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Stars
    for(let i = 0; i < 50; i++) {
        const x = (i * 137.5) % canvas.width;
        const y = (i * 89) % canvas.height;
        const twinkle = Math.sin(Date.now() * 0.002 + i) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
        ctx.fillRect(x, y, 2, 2);
    }
    
    // Title
    const pulse = Math.sin(Date.now() * 0.003) * 0.1 + 1;
    ctx.save();
    ctx.translate(canvas.width / 2, 150);
    ctx.scale(pulse, pulse);
    
    // Dragon Ball title
    ctx.fillStyle = '#ff6600';
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DRAGON BALL', 0, 0);
    
    // RPG subtitle
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ff9900';
    ctx.font = 'bold 32px monospace';
    ctx.fillText('RPG', 0, 50);
    
    ctx.restore();
    ctx.shadowBlur = 0;
    
    // Menu options
    ctx.font = '20px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('▶ NEW GAME', canvas.width / 2, 350);
    ctx.fillStyle = '#888';
    ctx.fillText('  CONTINUE', canvas.width / 2, 380);
    
    // Prompt
    const blink = Math.sin(Date.now() * 0.005) > 0 ? 1 : 0.3;
    ctx.fillStyle = `rgba(255, 255, 255, ${blink})`;
    ctx.font = '14px monospace';
    ctx.fillText('[PRESS SPACE]', canvas.width / 2, 500);
}

// ============================================
// WORLD/EXPLORATION
// ============================================
function handleWorldInput(key) {
    if(gameState !== STATES.WORLD) return;
    
    let newX = player.x;
    let newY = player.y;
    
    if(key === 'ArrowUp' || key === 'w') newY--;
    if(key === 'ArrowDown' || key === 's') newY++;
    if(key === 'ArrowLeft' || key === 'a') newX--;
    if(key === 'ArrowRight' || key === 'd') newX++;
    
    if(newX !== player.x || newY !== player.y) {
        movePlayer(newX, newY);
    }
    
    if(key === ' ') checkInteraction();
    if(key === 'i') toggleInventory();
    if(key === 'k') toggleStats();
}

function movePlayer(newX, newY) {
    if(newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) {
        checkZoneExit(newX, newY);
        return;
    }
    
    const tile = worldMap[newY][newX];
    
    if(tile === 'wall' || tile === 'tree' || tile === 'rock') return;
    if(tile === 'encounter' && Math.random() < 0.3) {
        startCombat();
        return;
    }
    if(tile === 'item_marker') {
        const item = itemsOnGround.find(i => i.x === newX && i.y === newY);
        if(item) collectItem(item);
    }
    
    player.x = newX;
    player.y = newY;
    
    // Random encounter on grassy areas
    const zone = ZONES[player.currentZone];
    if(Math.random() < 0.02) {
        startCombat();
    }
}

function checkZoneExit(x, y) {
    const zone = ZONES[player.currentZone];
    let exit = null;
    
    if(x < 0 && zone.exits.west) exit = zone.exits.west;
    if(x >= MAP_WIDTH && zone.exits.east) exit = zone.exits.east;
    if(y < 0 && zone.exits.north) exit = zone.exits.north;
    if(y >= MAP_HEIGHT && zone.exits.south) exit = zone.exits.south;
    
    if(exit) {
        if(ZONES[exit].locked) {
            addLog(`⚠️ ${ZONES[exit].name} is locked!`);
            return;
        }
        changeZone(exit);
    }
}

function changeZone(newZone) {
    player.currentZone = newZone;
    player.x = 12;
    player.y = 15;
    generateWorld();
    addLog(`🌟 Entered ${ZONES[newZone].name}`);
}

function collectItem(groundItem) {
    const itemData = ITEMS[groundItem.item];
    
    if(groundItem.item === 'Dragon Ball') {
        player.dragonBalls.push(groundItem.dragonBallId || player.dragonBalls.length + 1);
        addLog(`✨ Found Dragon Ball ${groundItem.dragonBallId || player.dragonBalls.length}! (${player.dragonBalls.length}/7)`);
        updateQuest('gather_dragonballs');
    } else {
        player.inventory.push(groundItem.item);
        addLog(`📦 Collected ${groundItem.item}`);
    }
    
    // Check quest completion
    if(groundItem.item === 'Turtle Shell') {
        updateQuest('roshi_training');
    }
    
    // Remove from ground
    itemsOnGround = itemsOnGround.filter(i => i !== groundItem);
    worldMap[groundItem.y][groundItem.x] = 'empty';
    checkLevelUp();
}

function checkInteraction() {
    const nearbyNPC = Object.values(NPCS).find(npc => 
        npc.zone === player.currentZone &&
        Math.abs(npc.x - player.x) <= 1 &&
        Math.abs(npc.y - player.y) <= 1
    );
    
    if(nearbyNPC) {
        startDialogue(nearbyNPC);
    }
}

// ============================================
// QUEST SYSTEM
// ============================================
function updateQuest(questId, amount = 1) {
    const quest = QUESTS[questId];
    if(!quest || quest.completed) return;
    
    const objective = quest.objectives[0];
    objective.current += amount;
    
    if(objective.current >= objective.count) {
        completeQuest(questId);
    }
    
    updateQuestUI();
}

function completeQuest(questId) {
    const quest = QUESTS[questId];
    quest.completed = true;
    activeQuests = activeQuests.filter(q => q !== questId);
    completedQuests.push(questId);
    
    // Apply rewards
    player.xp += quest.reward.xp;
    addLog(`🎉 Quest Complete: ${quest.title}! +${quest.reward.xp} XP`);
    
    if(quest.reward.item) {
        player.inventory.push(quest.reward.item);
        addLog(`📦 Received: ${quest.reward.item}`);
    }
    if(quest.reward.ki) {
        player.maxKi += quest.reward.ki;
        addLog(`⚡ Max Ki +${quest.reward.ki}`);
    }
    if(quest.reward.attack) {
        player.attack += quest.reward.attack;
    }
    if(quest.reward.defense) {
        player.defense += quest.reward.defense;
    }
    if(quest.reward.speed) {
        player.speed += quest.reward.speed;
        addLog(`💨 Speed +${quest.reward.speed}`);
    }
    if(quest.reward.transformLevel) {
        player.transformLevel = quest.reward.transformLevel;
        addLog(`✨ Unlocked: Super Saiyan Form!`);
    }
    if(quest.reward.unlockZone) {
        ZONES[quest.reward.unlockZone].locked = false;
    }
    if(quest.reward.canMakeWish) {
        addLog(`🐉 You can now summon Shenron to make a wish!`);
    }
    
    checkLevelUp();
    updateQuestUI();
}

function updateQuestUI() {
    const questPanel = document.getElementById('current-quest');
    const activeQuestId = activeQuests[0];
    
    if(!activeQuestId) {
        questPanel.innerHTML = 'No active quests';
        document.getElementById('dragonballs').style.display = 'block';
        document.getElementById('quest-panel').style.display = 'block';
        return;
    }
    
    const quest = QUESTS[activeQuestId];
    const objective = quest.objectives[0];
    let progress = '';
    
    if(objective.type === 'collect') {
        progress = `${objective.current}/${objective.count}`;
    } else if(objective.type === 'defeat') {
        progress = `${objective.current}/${objective.count}`;
    } else if(objective.type === 'survive') {
        progress = `${objective.current}/${objective.count} battles`;
    } else if(objective.type === 'minigame') {
        progress = `Score: ${objective.score}/${objective.target}`;
    }
    
    questPanel.innerHTML = `
        <strong>${quest.title}</strong><br>
        ${quest.description}<br>
        <span style="color: #00FF00">Progress: ${progress}</span>
    `;
    
    // Update Dragon Ball counter
    document.getElementById('db-count').textContent = player.dragonBalls.length;
}

// ============================================
// DIALOGUE SYSTEM
// ============================================
function startDialogue(npc) {
    currentNPC = npc;
    dialogueIndex = 0;
    gameState = STATES.DIALOGUE;
    
    const dialogueBox = document.getElementById('dialogue-box');
    dialogueBox.classList.remove('hidden');
    
    determineDialogueBranch(npc);
}

function determineDialogueBranch(npc) {
    if(!npc.questId) return;
    
    const quest = QUESTS[npc.questId];
    const isActive = activeQuests.includes(npc.questId);
    const isCompleted = quest?.completed;
    const canComplete = quest && quest.objectives[0].current >= quest.objectives[0].count;
    
    if(isCompleted) {
        currentNPC.currentBranch = 'postComplete';
    } else if(canComplete && !isCompleted) {
        currentNPC.currentBranch = 'ready';
    } else if(isActive) {
        currentNPC.currentBranch = 'active';
    } else {
        currentNPC.currentBranch = 'initial';
        // Start quest if not already active
        if(!activeQuests.includes(npc.questId) && !quest.completed) {
            activeQuests.push(npc.questId);
            updateQuestUI();
        }
    }
}

function handleDialogueInput(key) {
    if(key !== ' ') return;
    
    const npc = currentNPC;
    const branch = npc.dialogue[npc.currentBranch];
    
    if(dialogueIndex < branch.length - 1) {
        dialogueIndex++;
        showDialogue();
    } else {
        // Complete quest if in ready branch
        if(npc.currentBranch === 'ready') {
            completeQuest(npc.questId);
        }
        closeDialogue();
    }
}

function showDialogue() {
    const npc = currentNPC;
    const branch = npc.dialogue[npc.currentBranch];
    const text = branch[dialogueIndex];
    
    document.getElementById('dialogue-speaker').textContent = npc.name;
    
    // Typewriter effect
    let charIndex = 0;
    const dialogueEl = document.getElementById('dialogue-text');
    dialogueEl.textContent = '';
    
    const typeInterval = setInterval(() => {
        if(charIndex < text.length) {
            dialogueEl.textContent += text[charIndex];
            charIndex++;
        } else {
            clearInterval(typeInterval);
        }
    }, 30);
}

function closeDialogue() {
    gameState = STATES.WORLD;
    document.getElementById('dialogue-box').classList.add('hidden');
    currentNPC = null;
}

// ============================================
// COMPLEX COMBAT SYSTEM
// ============================================
function startCombat() {
    const zone = ZONES[player.currentZone];
    const enemyKey = zone.enemies[Math.floor(Math.random() * zone.enemies.length)];
    const baseEnemy = ENEMIES[enemyKey];
    
    if(player.currentZone === 'wasteland' && !QUESTS.defeat_raditz.completed && Math.random() < 0.3) {
        combat.enemy = { ...ENEMIES['Raditz'], boss: true };
    } else {
        combat.enemy = { 
            ...baseEnemy, 
            name: enemyKey,
            maxHp: baseEnemy.hp,
            currentHp: baseEnemy.hp,
            currentKi: baseEnemy.ki
        };
    }
    
    combat.enemyMaxHp = combat.enemy.hp;
    combat.active = true;
    combat.turn = 'player';
    combat.log = [];
    combat.comboTimer = 0;
    combat.chargingKi = false;
    combat.kiChargeAmount = 0;
    combat.playerDodging = false;
    combat.playerGuarding = false;
    combat.turnCount = 0;
    
    gameState = STATES.COMBAT;
    
    const combatScreen = document.getElementById('combat-screen');
    combatScreen.classList.remove('hidden');
    
    updateCombatUI();
    addCombatLog(`⚔️ Battle started! ${combat.enemy.name} appeared!`);
    
    // Draw enemy in sprite area
    const enemySprite = document.getElementById('enemy-sprite');
    enemySprite.textContent = combat.enemy.sprite;
    enemySprite.style.fontSize = '80px';
    enemySprite.style.textShadow = `0 0 20px ${combat.enemy.color}`;
}

function handleCombatAction(action) {
    if(gameState !== STATES.COMBAT || combat.turn !== 'player') return;
    
    switch(action) {
        case 'attack':
            performAttack();
            break;
        case 'ki':
            performKiBlast();
            break;
        case 'special':
            performSpecial();
            break;
        case 'flee':
            attemptFlee();
            break;
        case 'block':
            setGuard();
            break;
        case 'dodge':
            setDodge();
            break;
        case 'transform':
            attemptTransform();
            break;
    }
}

function handleCombatInput(key) {
    if(gameState !== STATES.COMBAT) return;
    
    const lowerKey = key.toLowerCase();
    
    // Q to charge Ki
    if(lowerKey === 'q') {
        combat.chargingKi = true;
        chargeKi();
        return;
    }
    
    // Number keys for combo moves
    if(['1', '2', '3'].includes(key) && combat.comboTimer > 0) {
        executeCombo(parseInt(key));
        return;
    }
}

function performAttack() {
    combat.comboTimer = 2000; // 2 second combo window
    
    const baseDamage = player.attack - combat.enemy.defense / 2;
    const comboMultiplier = 1 + (player.comboCount * 0.1);
    const damage = Math.floor(baseDamage * comboMultiplier * (0.8 + Math.random() * 0.4));
    
    combat.enemy.hp -= damage;
    player.comboCount++;
    player.specialMeter = Math.min(player.specialMeter + 10, 100);
    
    addCombatLog(`👊 You punch ${combat.enemy.name} for ${damage} damage!`, 'damage');
    
    // Visual effects
    createDamagePopup(damage, 'player');
    shakeScreen();
    
    if(combat.enemy.hp <= 0) {
        endCombat(true);
        return;
    }
    
    // Start combo window
    addCombatLog(`⚡ COMBO WINDOW! Press 1-3 for combo moves!`);
    updateCombatUI();
    
    // Enemy turn after short delay
    setTimeout(enemyTurn, 1500);
}

function executeCombo(moveNum) {
    const combos = [
        { name: 'Dragon Rush', damage: 1.5, cost: 0 },
        { name: 'Meteor Crash', damage: 2.0, cost: 10 },
        { name: 'Meteor Strike', damage: 2.5, cost: 20 }
    ];
    
    const combo = combos[moveNum - 1];
    
    if(player.ki < combo.cost) {
        addCombatLog(`⚠️ Not enough Ki for ${combo.name}!`, 'damage');
        return;
    }
    
    player.ki -= combo.cost;
    const damage = Math.floor(player.attack * combo.damage);
    combat.enemy.hp -= damage;
    
    addCombatLog(`🔥 ${combo.name}! ${damage} damage!`, 'critical');
    createDamagePopup(damage, 'critical');
    shakeScreen();
    
    combat.comboTimer = 0;
    player.comboCount++;
    
    if(combat.enemy.hp <= 0) {
        endCombat(true);
        return;
    }
    
    updateCombatUI();
    setTimeout(enemyTurn, 500);
}

function performKiBlast() {
    if(player.ki < 10) {
        addCombatLog(`⚠️ Need 10 Ki for Ki Blast!`);
        return;
    }
    
    player.ki -= 10;
    const damage = Math.floor((player.attack * 1.5 + player.powerLevel * 2) - combat.enemy.defense / 3);
    combat.enemy.hp -= damage;
    
    addCombatLog(`⚡ KI BLAST hits ${combat.enemy.name} for ${damage} damage!`, 'critical');
    createDamagePopup(damage, 'ki');
    createParticleExplosion();
    
    if(combat.enemy.hp <= 0) {
        endCombat(true);
        return;
    }
    
    updateCombatUI();
    setTimeout(enemyTurn, 1000);
}

function performSpecial() {
    if(player.specialMeter < 100) {
        addCombatLog(`⚠️ Special meter not full! (${player.specialMeter}/100)`);
        return;
    }
    
    player.specialMeter = 0;
    let specialName, damage;
    
    if(player.transformLevel >= 1) {
        specialName = 'KAMEHAMEHA';
        damage = Math.floor(player.attack * 4 + player.powerLevel * 10);
    } else {
        specialName = 'Dragon Fist';
        damage = Math.floor(player.attack * 3);
    }
    
    combat.enemy.hp -= damage;
    
    addCombatLog(`🌟 ${specialName}! ${damage} DEVASTATING DAMAGE!`, 'critical');
    createDamagePopup(damage, 'super');
    createSuperAttackEffect(specialName);
    
    if(combat.enemy.hp <= 0) {
        endCombat(true);
        return;
    }
    
    updateCombatUI();
    setTimeout(enemyTurn, 1500);
}

function chargeKi() {
    const chargeInterval = setInterval(() => {
        if(!combat.chargingKi || player.ki >= player.maxKi) {
            clearInterval(chargeInterval);
            combat.chargingKi = false;
            return;
        }
        
        player.ki = Math.min(player.ki + 2, player.maxKi);
        addCombatLog(`⚡ Charging... Ki: ${player.ki}/${player.maxKi}`);
        updateCombatUI();
    }, 100);
}

function setGuard() {
    combat.playerGuarding = true;
    combat.playerDodging = false;
    addCombatLog(`🛡️ You brace for impact!`);
}

function setDodge() {
    const dodgeChance = player.speed / (player.speed + combat.enemy.speed);
    combat.playerDodging = Math.random() < dodgeChance;
    combat.playerGuarding = false;
    addCombatLog(combat.playerDodging ? `💨 Dodging...` : `💨 Attempting to dodge...`);
}

function attemptTransform() {
    if(player.transformLevel < 1) {
        addCombatLog(`❌ You haven't unlocked transformations yet!`);
        return;
    }
    
    if(player.ki < 50) {
        addCombatLog(`⚠️ Need 50 Ki to transform!`);
        return;
    }
    
    player.ki -= 50;
    player.attack = Math.floor(player.attack * 1.5);
    player.defense = Math.floor(player.defense * 1.3);
    player.speed = Math.floor(player.speed * 1.2);
    player.powerLevel *= 50; // Super Saiyan multiplier
    
    addCombatLog(`🔥 HAHHH! YOU TRANSFORMED INTO SUPER SAIYAN!`, 'critical');
    addCombatLog(`✨ Power Level: ${player.powerLevel.toLocaleString()}!`);
    
    createSuperSaiyanEffect();
    updateCombatUI();
}

function enemyTurn() {
    if(!combat.active) return;
    
    combat.turn = 'enemy';
    combat.comboTimer = 0;
    combat.turnCount++;
    
    // Check for boss special moves
    if(combat.enemy.boss && combat.enemy.specialMoves && Math.random() < 0.3) {
        const move = combat.enemy.specialMoves[Math.floor(Math.random() * combat.enemy.specialMoves.length)];
        const damage = Math.floor(combat.enemy.attack * 2 - player.defense / 2);
        
        let actualDamage = damage;
        if(combat.playerGuarding) actualDamage = Math.floor(damage * 0.3);
        if(combat.playerDodging && Math.random() < 0.5) {
            actualDamage = 0;
            addCombatLog(`💨 You dodged ${move}!`);
        }
        
        player.hp -= actualDamage;
        addCombatLog(`☠️ ${combat.enemy.name} uses ${move}! ${actualDamage} damage!`, 'damage');
    } else {
        // Normal enemy attack
        const damage = Math.floor(combat.enemy.attack + Math.random() * 5 - player.defense / 3);
        let actualDamage = Math.max(1, damage);
        
        if(combat.playerGuarding) actualDamage = Math.floor(actualDamage * 0.3);
        if(combat.playerDodging && Math.random() < player.speed / 100) {
            actualDamage = 0;
            addCombatLog(`💨 You dodged the attack!`);
        }
        
        if(actualDamage > 0) {
            player.hp -= actualDamage;
            addCombatLog(`${combat.enemy.name} hits you for ${actualDamage} damage!`, 'damage');
        }
    }
    
    // Reset defensive stances
    combat.playerGuarding = false;
    combat.playerDodging = false;
    
    if(player.hp <= 0) {
        endCombat(false);
        return;
    }
    
    combat.turn = 'player';
    updateCombatUI();
    updateStatsUI();
}

function attemptFlee() {
    const fleeChance = player.speed / (player.speed + combat.enemy.speed * 2);
    
    if(Math.random() < fleeChance) {
        addCombatLog(`🏃 You escaped!`);
        endCombat(false, true);
    } else {
        addCombatLog(`❌ Couldn't escape!`, 'damage');
        setTimeout(enemyTurn, 500);
    }
}

function endCombat(victory, fled = false) {
    combat.active = false;
    document.getElementById('combat-screen').classList.add('hidden');
    
    if(fled) {
        gameState = STATES.WORLD;
        return;
    }
    
    if(victory) {
        const xp = combat.enemy.xp;
        player.xp += xp;
        
        // Update quest progress
        if(combat.enemy.name === 'Raditz') {
            updateQuest('defeat_raditz', 1);
        }
        
        addLog(`🏆 Victory! +${xp} XP`);
        
        // Loot
        if(Math.random() < 0.5) {
            const items = ['Senzu Bean', 'Capsule'];
            const item = items[Math.floor(Math.random() * items.length)];
            player.inventory.push(item);
            addLog(`📦 Found: ${item}`);
        }
        
        // Restore some Ki
        player.ki = Math.min(player.ki + 20, player.maxKi);
        
        checkLevelUp();
        gameState = STATES.WORLD;
    } else {
        gameState = STATES.GAMEOVER;
        document.getElementById('game-over').classList.remove('hidden');
    }
    
    updateStatsUI();
}

function updateCombatUI() {
    if(!combat.enemy) return;
    
    document.getElementById('enemy-name').textContent = combat.enemy.name;
    document.getElementById('enemy-hp-bar').style.width = `${(combat.enemy.hp / combat.enemyMaxHp) * 100}%`;
    document.getElementById('enemy-hp-text').textContent = `${Math.max(0, combat.enemy.hp)}/${combat.enemyMaxHp}`;
    
    // Enable/disable special button
    const specialBtn = document.querySelector('[data-action="special"]');
    specialBtn.style.opacity = player.specialMeter >= 100 ? '1' : '0.5';
}

function addCombatLog(message, type = '') {
    combat.log.unshift({ text: message, type });
    if(combat.log.length > 10) combat.log.pop();
    
    const logEl = document.getElementById('combat-log');
    logEl.innerHTML = combat.log.map(entry => 
        `<p class="${entry.type}">${entry.text}</p>`
    ).join('');
}

// ============================================
// RHYTHM MINI-GAME
// ============================================
function startRhythmGame(questId) {
    gameState = STATES.RHYTHM;
    rhythmGame.active = true;
    rhythmGame.score = 0;
    rhythmGame.combo = 0;
    rhythmGame.notes = [];
    
    generateRhythmNotes();
    
    const rhythmScreen = document.createElement('div');
    rhythmScreen.id = 'rhythm-screen';
    rhythmScreen.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(180deg, #1a1a3e 0%, #0f0f23 100%);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        font-family: monospace;
    `;
    
    rhythmScreen.innerHTML = `
        <h2 style="color: #FFA500; margin-bottom: 20px;">KORIN'S RHYTHM TRIAL</h2>
        <div id="rhythm-score" style="color: #fff; font-size: 20px; margin-bottom: 10px;">Score: 0</div>
        <div id="rhythm-combo" style="color: #FFD700; font-size: 16px; margin-bottom: 20px;">Combo: 0</div>
        <canvas id="rhythmCanvas" width="600" height="400"></canvas>
        <div style="color: #888; font-size: 12px; margin-top: 20px;">
            S D J K to hit notes as they reach the targets!
        </div>
    `;
    
    document.getElementById('game-container').appendChild(rhythmScreen);
    
    // Start rhythm loop
    rhythmLoop();
}

function generateRhythmNotes() {
    const patterns = [
        [0, 0, 1, 1, 2, 2, 3, 3],
        [0, 2, 1, 3, 0, 3, 1, 2],
        [3, 2, 1, 0, 0, 1, 2, 3],
        [0, 1, 2, 3, 3, 2, 1, 0, 0, 2, 1, 3]
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    pattern.forEach((lane, i) => {
        rhythmGame.notes.push({
            lane: lane,
            y: -50 - (i * 100),
            hit: false,
            missed: false
        });
    });
}

function rhythmLoop() {
    if(gameState !== STATES.RHYTHM) return;
    
    const rhythmCanvas = document.getElementById('rhythmCanvas');
    if(!rhythmCanvas) return;
    
    const rctx = rhythmCanvas.getContext('2d');
    const noteSpeed = 4;
    
    // Clear
    rctx.fillStyle = 'rgba(26, 26, 62, 0.3)';
    rctx.fillRect(0, 0, 600, 400);
    
    // Draw lanes
    rhythmGame.lanes.forEach((x, i) => {
        const color = ['#ef4444', '#22c55e', '#3b82f6', '#a855f7'][i];
        rctx.fillStyle = 'rgba(255,255,255,0.05)';
        rctx.fillRect(x - 50, 0, 100, 400);
        
        // Target line
        rctx.strokeStyle = color;
        rctx.lineWidth = 3;
        rctx.beginPath();
        rctx.moveTo(x - 40, rhythmGame.hitY);
        rctx.lineTo(x + 40, rhythmGame.hitY);
        rctx.stroke();
        
        // Key hint
        rctx.fillStyle = color;
        rctx.font = 'bold 24px monospace';
        rctx.textAlign = 'center';
        rctx.fillText(rhythmGame.keys[i].toUpperCase(), x, rhythmGame.hitY + 40);
    });
    
    // Update and draw notes
    let allProcessed = true;
    
    rhythmGame.notes.forEach(note => {
        if(note.hit || (note.y > 500 && !note.hit && !note.missed)) {
            note.missed = true;
        }
        
        if(!note.hit && !note.missed) {
            allProcessed = false;
            note.y += noteSpeed;
            
            const laneX = rhythmGame.lanes[note.lane];
            const color = ['#ef4444', '#22c55e', '#3b82f6', '#a855f7'][note.lane];
            
            // Note glow
            rctx.shadowColor = color;
            rctx.shadowBlur = 15;
            rctx.fillStyle = color;
            rctx.beginPath();
            rctx.roundRect(laneX - 35, note.y - 20, 70, 40, 5);
            rctx.fill();
            rctx.shadowBlur = 0;
            
            // Inner
            rctx.fillStyle = '#fff';
            rctx.beginPath();
            rctx.roundRect(laneX - 25, note.y - 10, 50, 20, 3);
            rctx.fill();
        }
    });
    
    // Update UI
    document.getElementById('rhythm-score').textContent = `Score: ${rhythmGame.score}`;
    document.getElementById('rhythm-combo').textContent = `Combo: ${rhythmGame.combo}`;
    
    // Check if game ended
    if(allProcessed) {
        endRhythmGame();
        return;
    }
    
    requestAnimationFrame(rhythmLoop);
}

function handleRhythmInput(key) {
    if(gameState !== STATES.RHYTHM) return;
    
    const keyIndex = rhythmGame.keys.indexOf(key.toLowerCase());
    if(keyIndex === -1) return;
    
    // Find closest note in this lane
    const notesInLane = rhythmGame.notes.filter(n => n.lane === keyIndex && !n.hit && !n.missed);
    if(notesInLane.length === 0) return;
    
    const closestNote = notesInLane[0];
    const distance = Math.abs(closestNote.y - rhythmGame.hitY);
    
    // Hit detection (good hit within 40 pixels)
    if(distance < 50) {
        closestNote.hit = true;
        
        let points = 100;
        let quality = 'PERFECT';
        
        if(distance > 30) {
            points = 50;
            quality = 'GOOD';
        } else if(distance > 15) {
            points = 75;
            quality = 'GREAT';
        }
        
        rhythmGame.combo++;
        rhythmGame.score += points * (1 + rhythmGame.combo * 0.01);
        
        // Show quality text
        const rhythmScreen = document.getElementById('rhythm-screen');
        const qualityEl = document.createElement('div');
        qualityEl.textContent = quality;
        qualityEl.style.cssText = `
            position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%);
            color: ${quality === 'PERFECT' ? '#FFD700' : quality === 'GREAT' ? '#22c55e' : '#3b82f6'};
            font-size: 40px; font-weight: bold; pointer-events: none;
            animation: rhythmPop 0.5s ease-out forwards;
        `;
        rhythmScreen.appendChild(qualityEl);
        setTimeout(() => qualityEl.remove(), 500);
    } else {
        rhythmGame.combo = 0;
    }
}

function endRhythmGame() {
    const quest = QUESTS.korins_trial;
    quest.objectives[0].score = Math.floor(rhythmGame.score);
    
    const rhythmScreen = document.getElementById('rhythm-screen');
    if(rhythmScreen) rhythmScreen.remove();
    
    if(rhythmGame.score >= quest.objectives[0].target) {
        completeQuest('korins_trial');
        addLog(`🎵 Rhythm Trial PASSED! Score: ${Math.floor(rhythmGame.score)}`);
    } else {
        addLog(`🎵 Trial failed. Score: ${Math.floor(rhythmGame.score)}/${quest.objectives[0].target}`);
        // Can retry
        activeQuests = activeQuests.filter(q => q !== 'korins_trial');
    }
    
    rhythmGame.active = false;
    gameState = STATES.WORLD;
}

// ============================================
// VISUAL EFFECTS
// ============================================
function createDamagePopup(damage, type) {
    const colors = { player: '#ff4444', critical: '#ffff00', ki: '#4444ff', super: '#ff00ff' };
    
    const popup = document.createElement('div');
    popup.className = 'damage-popup';
    popup.textContent = damage;
    popup.style.color = colors[type] || '#fff';
    popup.style.left = `${canvas.width / 2 + (Math.random() * 100 - 50)}px`;
    popup.style.top = `${canvas.height / 3}px`;
    
    document.getElementById('game-container').appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
}

function shakeScreen() {
    const container = document.getElementById('game-container');
    container.style.animation = 'shake 0.3s';
    setTimeout(() => container.style.animation = '', 300);
}

function createParticleExplosion() {
    for(let i = 0; i < 20; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 3,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 30,
            color: '#4444ff'
        });
    }
}

function createSuperAttackEffect(name) {
    // Beam effect
    const beam = document.createElement('div');
    beam.style.cssText = `
        position: absolute; top: 50%; left: 50%;
        width: 0; height: 20px; background: linear-gradient(90deg, #ffff00, #ff6600);
        transform: translate(-50%, -50%);
        animation: beamExpand 0.5s forwards;
        box-shadow: 0 0 30px #ffff00;
    `;
    document.getElementById('combat-screen').appendChild(beam);
    setTimeout(() => beam.remove(), 1000);
}

function createSuperSaiyanEffect() {
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: #ffff00; opacity: 0;
        animation: superSaiyanFlash 1s ease-out;
    `;
    document.getElementById('combat-screen').appendChild(flash);
    setTimeout(() => flash.remove(), 1000);
}

// ============================================
// UI HELPERS
// ============================================
function toggleInventory() {
    const invScreen = document.getElementById('inventory-screen');
    if(gameState === STATES.INVENTORY) {
        invScreen.classList.add('hidden');
        gameState = STATES.WORLD;
    } else if(gameState === STATES.WORLD) {
        invScreen.classList.remove('hidden');
        updateInventoryUI();
        gameState = STATES.INVENTORY;
    }
}

function updateInventoryUI() {
    const grid = document.getElementById('inventory-grid');
    const details = document.getElementById('item-details');
    
    grid.innerHTML = '';
    
    // 32 slots
    for(let i = 0; i < 32; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        
        if(i < player.inventory.length) {
            const item = player.inventory[i];
            const itemData = ITEMS[item];
            slot.textContent = itemData?.icon || '📦';
            slot.onclick = () => showItemDetails(item, slot);
        }
        
        grid.appendChild(slot);
    }
}

function showItemDetails(item, slotElement) {
    document.querySelectorAll('.inventory-slot').forEach(s => s.classList.remove('selected'));
    slotElement.classList.add('selected');
    
    const itemData = ITEMS[item];
    const details = document.getElementById('item-details');
    details.innerHTML = `
        <strong>${item}</strong><br>
        <em>${itemData?.type || 'unknown'}</em><br>
        ${itemData?.desc || 'No description'}
        ${itemData?.type === 'consumable' ? '<br><button onclick="useItem(\'' + item + '\')">Use</button>' : ''}
    `;
}

function useItem(item) {
    const itemData = ITEMS[item];
    if(itemData.type === 'consumable' && itemData.effect === 'heal') {
        player.hp = player.maxHp;
        player.ki = player.maxKi;
        player.inventory = player.inventory.filter((i, idx) => idx !== player.inventory.indexOf(item));
        addLog(`🌰 Used Senzu Bean! HP and Ki fully restored!`);
        updateStatsUI();
        updateInventoryUI();
    }
}

function toggleStats() {
    // Could expand to show detailed stats
    addLog(`📊 Power Level: ${(player.powerLevel * 1000).toLocaleString()}`);
}

function updateStatsUI() {
    document.getElementById('level').textContent = player.level;
    document.getElementById('hp-text').textContent = `${player.hp}/${player.maxHp}`;
    document.getElementById('ki-text').textContent = `${player.ki}/${player.maxKi}`;
    document.getElementById('hp-bar').style.width = `${(player.hp / player.maxHp) * 100}%`;
    document.getElementById('ki-bar').style.width = `${(player.ki / player.maxKi) * 100}%`;
    document.getElementById('attack').textContent = player.attack;
    document.getElementById('defense').textContent = player.defense;
    document.getElementById('speed').textContent = player.speed;
    document.getElementById('xp').textContent = player.xp;
    document.getElementById('xp-needed').textContent = player.xpNeeded;
}

function checkLevelUp() {
    while(player.xp >= player.xpNeeded) {
        player.xp -= player.xpNeeded;
        player.level++;
        player.xpNeeded = Math.floor(player.xpNeeded * 1.5);
        
        // Stat gains
        const hpGain = 20 + Math.floor(Math.random() * 10);
        const kiGain = 10 + Math.floor(Math.random() * 5);
        const statGain = 2 + Math.floor(Math.random() * 2);
        
        player.maxHp += hpGain;
        player.maxKi += kiGain;
        player.attack += statGain;
        player.defense += statGain;
        player.speed += statGain;
        
        player.hp = player.maxHp;
        player.ki = player.maxKi;
        player.powerLevel *= 1.5;
        
        showLevelUp(hpGain, kiGain, statGain);
    }
}

function showLevelUp(hpGain, kiGain, statGain) {
    gameState = STATES.LEVELUP;
    
    const screen = document.getElementById('levelup-screen');
    screen.classList.remove('hidden');
    
    document.getElementById('new-level').textContent = player.level;
    document.getElementById('power-level').textContent = Math.floor(player.powerLevel * 1000).toLocaleString();
    
    document.getElementById('stat-bonuses').innerHTML = `
        <div>❤️ Max HP +${hpGain}</div>
        <div>⚡ Max Ki +${kiGain}</div>
        <div>💪 All Stats +${statGain}</div>
    `;
    
    setTimeout(() => {
        screen.classList.add('hidden');
        gameState = combat.active ? STATES.COMBAT : STATES.WORLD;
    }, 3000);
}

function addLog(message) {
    // Could add to a log panel
    console.log(message);
}

function restartGame() {
    player = {
        x: 12, y: 15,
        level: 1,
        hp: 100, maxHp: 100,
        ki: 50, maxKi: 50,
        attack: 15,
        defense: 8,
        speed: 10,
        xp: 0,
        xpNeeded: 100,
        powerLevel: 5,
        inventory: [],
        dragonBalls: [],
        currentZone: 'meadow',
        transformLevel: 0,
        comboCount: 0,
        stance: 'balanced',
        specialMeter: 0
    };
    
    activeQuests = ['roshi_training'];
    completedQuests = [];
    
    Object.keys(QUESTS).forEach(qid => {
        QUESTS[qid].completed = false;
        QUESTS[qid].objectives.forEach(obj => obj.current = 0);
    });
    
    ZONES.hyperbolic.locked = true;
    ZONES.wasteland.locked = true;
    
    document.getElementById('game-over').classList.add('hidden');
    generateWorld();
    updateStatsUI();
    updateQuestUI();
    
    gameState = STATES.TITLE;
}

// ============================================
// RENDERING
// ============================================
function drawWorld() {
    const zone = ZONES[player.currentZone];
    
    // Background
    ctx.fillStyle = zone.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid for pixel-art feel
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for(let x = 0; x < canvas.width; x += TILE_SIZE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for(let y = 0; y < canvas.height; y += TILE_SIZE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    
    // Draw tiles
    for(let y = 0; y < MAP_HEIGHT; y++) {
        for(let x = 0; x < MAP_WIDTH; x++) {
            const tile = worldMap[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;
            
            if(tile === 'wall') {
                // Mountains/walls
                ctx.fillStyle = '#4a5568';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#718096';
                ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            } else if(tile === 'tree') {
                // Pixel tree
                ctx.fillStyle = zone.ground;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#5d4037';
                ctx.fillRect(px + 12, py + 20, 8, 12);
                ctx.fillStyle = '#2e7d32';
                ctx.beginPath();
                ctx.moveTo(px + 4, py + 20);
                ctx.lineTo(px + 16, py + 4);
                ctx.lineTo(px + 28, py + 20);
                ctx.fill();
            } else if(tile === 'rock') {
                ctx.fillStyle = '#757575';
                ctx.beginPath();
                ctx.ellipse(px + 16, py + 24, 10, 8, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if(tile === 'item_marker') {
                ctx.fillStyle = zone.ground;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                // Sparkle effect
                const sparkle = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
                ctx.fillStyle = `rgba(255, 215, 0, ${sparkle})`;
                ctx.fillRect(px + 10, py + 10, 4, 4);
                ctx.fillRect(px + 18, py + 18, 3, 3);
            } else {
                ctx.fillStyle = zone.ground;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            }
        }
    }
    
    // Draw NPCs
    Object.values(NPCS).forEach(npc => {
        if(npc.zone === player.currentZone) {
            const px = npc.x * TILE_SIZE + 8;
            const py = npc.y * TILE_SIZE + 4;
            
            // Sprite
            ctx.font = '20px monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = npc.color;
            ctx.shadowBlur = 10;
            ctx.fillText(npc.sprite, px + 8, py + 20);
            ctx.shadowBlur = 0;
            
            // Name above
            ctx.font = '10px monospace';
            ctx.fillStyle = '#fff';
            ctx.fillText(npc.name.split(' ')[0], px + 8, py - 5);
        }
    });
    
    // Draw player
    const px = player.x * TILE_SIZE + 8;
    const py = player.y * TILE_SIZE + 4;
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(px + 8, py + 28, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Player sprite
    ctx.font = player.transformLevel >= 1 ? 'bold 22px monospace' : '20px monospace';
    ctx.textAlign = 'center';
    
    if(player.transformLevel >= 1) {
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
    }
    
    ctx.fillText(player.transformLevel >= 1 ? '👱' : '👦', px + 8, py + 22);
    ctx.shadowBlur = 0;
    
    // Zone name
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(10, canvas.height - 35, 180, 25);
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`📍 ${zone.name}`, 20, canvas.height - 18);
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        
        if(p.life > 0) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 30;
            ctx.fillRect(p.x, p.y, 4, 4);
            ctx.globalAlpha = 1;
            return true;
        }
        return false;
    });
}

// ============================================
// MAIN GAME LOOP
// ============================================
function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    
    // Update combo timer
    if(combat.comboTimer > 0) {
        combat.comboTimer -= dt;
        if(combat.comboTimer <= 0) {
            player.comboCount = 0;
        }
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    switch(gameState) {
        case STATES.INTRO:
            updateIntro(dt);
            drawIntro();
            break;
        case STATES.TITLE:
            drawTitle();
            break;
        case STATES.WORLD:
            drawWorld();
            updateParticles();
            
            // NPC proximity check
            const nearbyNPC = Object.values(NPCS).find(npc => 
                npc.zone === player.currentZone &&
                Math.abs(npc.x - player.x) <= 1 &&
                Math.abs(npc.y - player.y) <= 1
            );
            if(nearbyNPC) {
                ctx.fillStyle = '#ffff00';
                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('[SPACE] Talk', player.x * TILE_SIZE + 16, player.y * TILE_SIZE - 10);
            }
            break;
    }
    
    requestAnimationFrame(gameLoop);
}

// Add CSS animations
document.head.insertAdjacentHTML('beforeend', `
<style>
@keyframes shake {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(-5px, 0); }
    75% { transform: translate(5px, 0); }
}
@keyframes beamExpand {
    0% { width: 0; }
    50% { width: 500px; }
    100% { width: 800px; opacity: 0; }
}
@keyframes superSaiyanFlash {
    0% { opacity: 0; }
    50% { opacity: 1; }
    100% { opacity: 0; }
}
@keyframes rhythmPop {
    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
    50% { transform: translate(-50%, -50%) scale(1.2); }
    100% { transform: translate(-50%, -50%) scale(1) translateY(-20px); opacity: 0; }
}
</style>
`);

// Additional combat buttons
const combatActions = document.getElementById('combat-actions');
combatActions.innerHTML += `
    <button data-action="block">🛡️ Block</button>
    <button data-action="dodge">💨 Dodge</button>
    <button data-action="transform">🔥 Transform</button>
`;

// Re-add event listeners for new buttons
document.querySelectorAll('#combat-actions button').forEach(btn => {
    btn.addEventListener('click', () => handleCombatAction(btn.dataset.action));
});

// Start the game
updateStatsUI();
updateQuestUI();
init();
