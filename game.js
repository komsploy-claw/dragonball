
// Dragon Ball RPG - Game Engine

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Disable smoothing for pixel art
ctx.imageSmoothingEnabled = false;

// Game State
const GameState = {
    WORLD: 'world',
    DIALOGUE: 'dialogue',
    COMBAT: 'combat',
    INVENTORY: 'inventory',
    LEVELUP: 'levelup',
    GAMEOVER: 'gameover'
};

let currentState = GameState.WORLD;
let lastTime = 0;
let frameCount = 0;

// Input
const keys = {};
let mousePos = { x: 0, y: 0 };

// Map
const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 19;

// World Map (0: grass, 1: water, 2: wall, 3: tree, 4: sand, 5: mountain)
const worldMap = [
    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
    [2,4,4,4,4,4,4,0,0,0,0,0,3,0,0,0,0,0,5,5,5,5,5,5,2],
    [2,4,4,4,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,5,5,5,5,5,2],
    [2,4,4,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,5,5,5,2],
    [2,4,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
    [2,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,3,0,0,0,0,0,0,2],
    [2,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,2],
    [2,0,3,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,3,0,2],
    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,2],
    [2,0,0,0,0,3,0,0,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
    [2,0,0,0,0,0,0,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,2],
    [2,0,0,0,0,0,0,4,4,4,4,4,0,0,0,0,0,0,0,0,0,3,0,0,2],
    [2,3,0,0,0,0,0,0,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
    [2,0,0,0,0,3,0,0,0,0,0,5,5,5,0,0,0,0,3,0,0,0,0,0,2],
    [2,0,0,0,0,0,0,0,0,0,5,5,5,5,5,0,0,0,0,0,0,0,0,0,2],
    [2,0,0,0,0,0,0,0,0,5,5,5,5,5,5,5,0,0,0,0,0,0,0,0,2],
    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
];

// Player
const player = {
    x: 416,
    y: 320,
    width: 24,
    height: 24,
    speed: 3,
    direction: 'down',
    moving: false,
    
    // Stats
    stats: {
        level: 1,
        hp: 100,
        maxHp: 100,
        ki: 50,
        maxKi: 50,
        attack: 10,
        defense: 5,
        speed: 5,
        xp: 0,
        xpNeeded: 100,
        powerLevel: 5
    },
    
    inventory: [],
    maxInventory: 24,
    dragonBalls: [],
    
    // For animation
    animFrame: 0,
    lastMoveTime: 0
};

// NPCs
const npcs = [
    { x: 200, y: 150, name: 'Master Roshi', sprite: '🐢', dialogId: 'roshi', quest: 'collect_balls' },
    { x: 600, y: 400, name: 'Bulma', sprite: '🔵', dialogId: 'bulma', quest: 'find_capsule' },
    { x: 400, y: 500, name: 'Shopkeeper', sprite: '🏪', dialogId: 'shop', shop: true }
];

// Items/Collectibles
let items = [];
function spawnItems() {
    items = [];
    // Spawn Dragon Balls
    const ballPositions = [
        {x: 100, y: 100}, {x: 700, y: 100}, {x: 100, y: 500},
        {x: 700, y: 500}, {x: 400, y: 200}, {x: 200, y: 400}, {x: 600, y: 300}
    ];
    ballPositions.forEach((pos, i) => {
        items.push({
            x: pos.x,
            y: pos.y,
            type: 'dragonball',
            stars: i + 1,
            collected: false,
            sprite: '⭐'
        });
    });
    
    // Spawn power-ups
    for(let i = 0; i < 10; i++) {
        items.push({
            x: Math.random() * (canvas.width - 64) + 32,
            y: Math.random() * (canvas.height - 64) + 32,
            type: Math.random() > 0.5 ? 'senzu' : 'capsule',
            collected: false,
            sprite: Math.random() > 0.5 ? '🫘' : '💊'
        });
    }
}

// Enemies
let enemies = [];
function spawnEnemies() {
    enemies = [];
    const enemyTypes = [
        { name: 'Saibaman', hp: 30, atk: 8, def: 2, xp: 25, color: '#00AA00' },
        { name: 'Bandit', hp: 40, atk: 10, def: 3, xp: 30, color: '#8B4513' },
        { name: 'Wolf', hp: 25, atk: 12, def: 1, xp: 20, color: '#808080' }
    ];
    
    for(let i = 0; i < 8; i++) {
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        enemies.push({
            x: Math.random() * (canvas.width - 100) + 50,
            y: Math.random() * (canvas.height - 100) + 50,
            width: 24,
            height: 24,
            ...type,
            maxHp: type.hp,
            defeated: false,
            detectionRange: 100,
            patrolOffset: Math.random() * Math.PI * 2
        });
    }
}

// Bosses
const bosses = [
    { 
        x: 700, y: 100, name: 'Raditz', sprite: '👤',
        hp: 200, maxHp: 200, atk: 25, def: 10, xp: 200, 
        color: '#800080', defeated: false, isBoss: true,
        dialogId: 'raditz'
    },
    { 
        x: 100, y: 500, name: 'Nappa', sprite: '👤',
        hp: 300, maxHp: 300, atk: 35, def: 15, xp: 400,
        color: '#4B0082', defeated: false, isBoss: true,
        dialogId: 'nappa'
    }
];

// Quest System
const quests = {
    collect_balls: {
        id: 'collect_balls',
        name: 'Collect the Dragon Balls',
        description: 'Find all 7 Dragon Balls and return to Master Roshi.',
        completed: false,
        reward: { item: 'training', xp: 100 }
    },
    find_capsule: {
        id: 'find_capsule',
        name: 'Find the lost Capsule',
        description: 'Find Bulma\'s lost capsule somewhere in the world.',
        completed: false,
        reward: { item: 'senzu', count: 3 }
    }
};

let activeQuest = 'collect_balls';

// Dialogue System
const dialogues = {
    roshi: [
        { speaker: 'Master Roshi', text: 'Goku! You\'ve grown so much!' },
        { speaker: 'Master Roshi', text: 'The Dragon Balls have scattered across this land.' },
        { speaker: 'Master Roshi', text: 'Collect all 7 and I\'ll help you train!' },
        {
            speaker: 'Master Roshi',
            text: 'Be careful of Raditz in the north - he\'s dangerous!',
            options: [
                { text: 'Start Quest', action: 'accept_quest:collect_balls' },
                { text: 'Bye', action: 'end' }
            ]
        }
    ],
    bulma: [
        { speaker: 'Bulma', text: 'Hey Goku! I lost a capsule in this area...' },
        { speaker: 'Bulma', text: 'If you find it, I\'ll reward you with Senzu Beans!' },
        {
            speaker: 'Bulma',
            text: 'Can you help me?',
            options: [
                { text: 'Sure!', action: 'accept_quest:find_capsule' },
                { text: 'Later', action: 'end' }
            ]
        }
    ],
    shop: [
        { speaker: 'Shopkeeper', text: 'Welcome! What would you like?' },
        {
            speaker: 'Shopkeeper',
            text: 'Senzu Bean (50 HP) - 10 XP | Stat Boost - 20 XP',
            options: [
                { text: 'Buy Senzu (10 XP)', action: 'buy:senzu' },
                { text: 'Buy Boost (20 XP)', action: 'buy:boost' },
                { text: 'Leave', action: 'end' }
            ]
        }
    ],
    raditz: [
        { speaker: 'Raditz', text: 'Haha! A weakling Saiyan!' },
        { speaker: 'Raditz', text: 'Join me and conquer this pathetic planet!' },
        {
            speaker: 'Raditz',
            text: 'What\'s your answer?',
            options: [
                { text: 'FIGHT!', action: 'combat:raditz' },
                { text: 'Run away', action: 'end' }
            ]
        }
    ],
    nappa: [
        { speaker: 'Nappa', text: 'So you defeated Raditz?' },
        { speaker: 'Nappa', text: 'You won\'t be so lucky against me!' },
        {
            speaker: 'Nappa',
            text: 'Time to die!',
            options: [
                { text: 'Bring it on!', action: 'combat:nappa' },
                { text: 'Not ready...', action: 'end' }
            ]
        }
    ]
};

let currentDialogue = null;
let currentDialogueIndex = 0;

// Combat State
let combatEnemy = null;
let combatTurn = 'player';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    spawnItems();
    spawnEnemies();
    updateUI();
    requestAnimationFrame(gameLoop);
});

// Input Handlers
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    if(currentState === GameState.DIALOGUE && e.code === 'Space') {
        advanceDialogue();
    }
    else if(currentState === GameState.LEVELUP && e.code === 'Space') {
        closeLevelUp();
    }
    else if(currentState === GameState.WORLD) {
        if(e.key.toLowerCase() === 'i') {
            toggleInventory();
        }
        else if(e.code === 'Space') {
            checkInteraction();
        }
    }
    else if(currentState === GameState.INVENTORY && e.key.toLowerCase() === 'i') {
        toggleInventory();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Combat Buttons
document.querySelectorAll('#combat-actions button').forEach(btn => {
    btn.addEventListener('click', () => {
        if(currentState === GameState.COMBAT && combatTurn === 'player') {
            playerCombatAction(btn.dataset.action);
        }
    });
});

// Restart Button
document.getElementById('restart-btn').addEventListener('click', () => {
    location.reload();
});

// Game Loop
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    frameCount++;
    
    if(currentState === GameState.WORLD) {
        updatePlayer(deltaTime);
        updateEnemies(deltaTime);
        checkCollisions();
    }
    
    render();
    requestAnimationFrame(gameLoop);
}

// Update Functions
function updatePlayer(deltaTime) {
    let dx = 0;
    let dy = 0;
    
    if(keys['w'] || keys['arrowup']) {
        dy = -player.speed;
        player.direction = 'up';
    }
    else if(keys['s'] || keys['arrowdown']) {
        dy = player.speed;
        player.direction = 'down';
    }
    
    if(keys['a'] || keys['arrowleft']) {
        dx = -player.speed;
        player.direction = 'left';
    }
    else if(keys['d'] || keys['arrowright']) {
        dx = player.speed;
        player.direction = 'right';
    }
    
    player.moving = dx !== 0 || dy !== 0;
    
    if(player.moving) {
        player.animFrame = Math.floor(Date.now() / 150) % 4;
        
        // Normalize diagonal movement
        if(dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        // Check collisions with map
        const newX = player.x + dx;
        const newY = player.y + dy;
        
        if(!checkMapCollision(newX, player.y)) {
            player.x = newX;
        }
        if(!checkMapCollision(player.x, newY)) {
            player.y = newY;
        }
        
        // Keep in bounds
        player.x = Math.max(16, Math.min(canvas.width - 16 - player.width, player.x));
        player.y = Math.max(16, Math.min(canvas.height - 16 - player.height, player.y));
    }
}

function checkMapCollision(x, y) {
    const tileX = Math.floor((x + player.width/2) / TILE_SIZE);
    const tileY = Math.floor((y + player.height/2) / TILE_SIZE);
    
    if(tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
        return true;
    }
    
    const tile = worldMap[tileY][tileX];
    return tile === 1 || tile === 2 || tile === 5; // water, wall, mountain
}

function updateEnemies(deltaTime) {
    const time = Date.now() / 1000;
    
    enemies.forEach(enemy => {
        if(enemy.defeated) return;
        
        // Check if player is nearby for combat
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if(dist < 20) {
            startCombat(enemy);
            return;
        }
        
        // Patrol movement
        enemy.x += Math.cos(time + enemy.patrolOffset) * 0.3;
        enemy.y += Math.sin(time + enemy.patrolOffset) * 0.3;
        
        // Keep in bounds
        enemy.x = Math.max(32, Math.min(canvas.width - 32, enemy.x));
        enemy.y = Math.max(32, Math.min(canvas.height - 32, enemy.y));
    });
}

function checkCollisions() {
    // Check item collection
    items.forEach(item => {
        if(item.collected) return;
        
        const dist = Math.hypot(player.x - item.x, player.y - item.y);
        if(dist < 30) {
            collectItem(item);
        }
    });
}

function checkInteraction() {
    // Check NPCs
    const checkDistance = 40;
    
    // Regular NPCs
    const nearbyNPC = npcs.find(npc => {
        const dist = Math.hypot(player.x - npc.x, player.y - npc.y);
        return dist < checkDistance;
    });
    
    if(nearbyNPC) {
        startDialogue(nearbyNPC.dialogId);
        return;
    }
    
    // Bosses
    const nearbyBoss = bosses.find(boss => {
        if(boss.defeated) return false;
        const dist = Math.hypot(player.x - boss.x, player.y - boss.y);
        return dist < checkDistance;
    });
    
    if(nearbyBoss) {
        startDialogue(nearbyBoss.dialogId);
        return;
    }
}

// Collection
function collectItem(item) {
    item.collected = true;
    
    if(item.type === 'dragonball') {
        player.dragonBalls.push(item.stars);
        showFloatingText(`+${item.stars}★ Dragon Ball!`, player.x, player.y - 20, '#FFD700');
        
        const allBalls = [1,2,3,4,5,6,7].every(n => player.dragonBalls.includes(n));
        if(allBalls) {
            completeQuest('collect_balls');
        }
    }
    else if(item.type === 'senzu') {
        addToInventory({ name: 'Senzu Bean', type: 'heal', power: 50, sprite: '🫘' });
        showFloatingText('+Senzu Bean', player.x, player.y - 20, '#00FF00');
    }
    else if(item.type === 'capsule') {
        addToInventory({ name: 'Capsule', type: 'key', sprite: '💊' });
        showFloatingText('+Capsule', player.x, player.y - 20, '#8888FF');
    }
    
    updateUI();
}

function addToInventory(item) {
    if(player.inventory.length < player.maxInventory) {
        player.inventory.push(item);
    }
}

// Dialog System
function startDialogue(dialogId) {
    currentDialogue = dialogues[dialogId];
    currentDialogueIndex = 0;
    currentState = GameState.DIALOGUE;
    showDialogueUI();
}

function showDialogueUI() {
    const dbox = document.getElementById('dialogue-box');
    dbox.classList.remove('hidden');
    updateDialogueContent();
}

function updateDialogueContent() {
    if(!currentDialogue) return;
    
    const line = currentDialogue[currentDialogueIndex];
    document.getElementById('dialogue-speaker').textContent = line.speaker;
    document.getElementById('dialogue-text').textContent = line.text;
    
    const optionsDiv = document.getElementById('dialogue-options');
    optionsDiv.innerHTML = '';
    
    if(line.options) {
        line.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.textContent = opt.text;
            btn.addEventListener('click', () => handleDialogueOption(opt.action));
            optionsDiv.appendChild(btn);
        });
    }
}

function advanceDialogue() {
    currentDialogueIndex++;
    
    if(currentDialogueIndex >= currentDialogue.length) {
        endDialogue();
    } else {
        updateDialogueContent();
    }
}

function handleDialogueOption(action) {
    if(action === 'end') {
        endDialogue();
    }
    else if(action.startsWith('accept_quest:')) {
        const questId = action.split(':')[1];
        activeQuest = questId;
        document.getElementById('current-quest').textContent = quests[questId].name;
        endDialogue();
    }
    else if(action.startsWith('buy:')) {
        handleShop(action);
    }
    else if(action.startsWith('combat:')) {
        const bossName = action.split(':')[1];
        const boss = bosses.find(b => b.name.toLowerCase() === bossName);
        if(boss) {
            combatEnemy = boss;
            endDialogue();
            startCombatUI(boss);
        }
    }
}

function endDialogue() {
    document.getElementById('dialogue-box').classList.add('hidden');
    currentState = GameState.WORLD;
    currentDialogue = null;
}

// Combat System
function startCombat(enemy) {
    combatEnemy = enemy;
    startCombatUI(enemy);
}

function startCombatUI(enemy) {
    currentState = GameState.COMBAT;
    combatTurn = 'player';
    
    const combatScreen = document.getElementById('combat-screen');
    combatScreen.classList.remove('hidden');
    
    // Set enemy sprite color
    const sprite = document.getElementById('enemy-sprite');
    sprite.style.backgroundColor = enemy.color || '#444';
    if(enemy.isBoss) {
        sprite.style.boxShadow = `0 0 20px ${enemy.color}`;
    }
    
    document.getElementById('enemy-name').textContent = enemy.name;
    updateCombatUI();
    addCombatLog(`Battle started against ${enemy.name}!`);
}

function updateCombatUI() {
    if(!combatEnemy) return;
    
    const hpPercent = (combatEnemy.hp / combatEnemy.maxHp) * 100;
    document.getElementById('enemy-hp-bar').style.width = `${hpPercent}%`;
    document.getElementById('enemy-hp-text').textContent = `${combatEnemy.hp}/${combatEnemy.maxHp}`;
}

function playerCombatAction(action) {
    if(combatTurn !== 'player') return;
    
    let damage = 0;
    let isCrit = Math.random() < 0.15;
    
    switch(action) {
        case 'attack':
            damage = Math.max(1, player.stats.attack - combatEnemy.def * 0.5);
            damage += Math.random() * 5;
            if(isCrit) damage *= 2;
            break;
            
        case 'ki':
            if(player.stats.ki >= 10) {
                player.stats.ki -= 10;
                damage = player.stats.attack * 1.5;
                if(isCrit) damage *= 2;
                addCombatLog('You charged a Ki Blast!', 'special');
            } else {
                addCombatLog('Not enough Ki!', 'damage');
                return;
            }
            break;
            
        case 'special':
            if(player.stats.ki >= 25) {
                player.stats.ki -= 25;
                damage = player.stats.attack * 3;
                addCombatLog('KAMEHAMEHA!!!', 'critical');
            } else {
                addCombatLog('Not enough Ki for Special!', 'damage');
                return;
            }
            break;
            
        case 'flee':
            if(Math.random() > 0.4) {
                addCombatLog('You escaped!');
                setTimeout(endCombat, 1000);
                return;
            } else {
                addCombatLog('Couldn\'t escape!');
            }
            break;
    }
    
    damage = Math.floor(damage);
    combatEnemy.hp = Math.max(0, combatEnemy.hp - damage);
    
    const critText = isCrit ? ' CRITICAL!' : '';
    addCombatLog(`You dealt ${damage} damage!${critText}`, isCrit ? 'critical' : 'damage');
    updateCombatUI();
    updatePlayerUI();
    
    if(combatEnemy.hp <= 0) {
        setTimeout(winCombat, 800);
    } else {
        combatTurn = 'enemy';
        setTimeout(enemyTurn, 800);
    }
}

function enemyTurn() {
    if(!combatEnemy || combatEnemy.hp <= 0) return;
    
    const baseDamage = combatEnemy.atk;
    const damage = Math.max(1, Math.floor(baseDamage - player.stats.defense * 0.5 + Math.random() * 5));
    
    player.stats.hp = Math.max(0, player.stats.hp - damage);
    addCombatLog(`${combatEnemy.name} dealt ${damage} damage!`, 'damage');
    
    updatePlayerUI();
    
    if(player.stats.hp <= 0) {
        setTimeout(gameOver, 800);
    } else {
        combatTurn = 'player';
        addCombatLog('Your turn!');
    }
}

function winCombat() {
    const xp = combatEnemy.xp;
    player.stats.xp += xp;
    
    addCombatLog(`Victory! +${xp} XP`, 'heal');
    
    if(combatEnemy.isBoss) {
        combatEnemy.defeated = true;
        addCombatLog(`${combatEnemy.name} has been defeated!`, 'critical');
        
        if(combatEnemy.name === 'Nappa') {
            addCombatLog('You have conquered all threats!', 'critical');
        }
    } else {
        combatEnemy.defeated = true;
    }
    
    // Level up check
    while(player.stats.xp >= player.stats.xpNeeded) {
        levelUp();
    }
    
    updatePlayerUI();
    setTimeout(endCombat, 1500);
}

function endCombat() {
    document.getElementById('combat-screen').classList.add('hidden');
    currentState = GameState.WORLD;
    combatEnemy = null;
    
    // Regen some ki
    player.stats.ki = Math.min(player.stats.maxKi, player.stats.ki + 10);
    updatePlayerUI();
}

function addCombatLog(text, type = '') {
    const log = document.getElementById('combat-log');
    const p = document.createElement('p');
    p.className = type;
    p.textContent = `> ${text}`;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
    
    // Keep only last 20 messages
    while(log.children.length > 20) {
        log.removeChild(log.firstChild);
    }
}

// Level Up System
function levelUp() {
    player.stats.xp -= player.stats.xpNeeded;
    player.stats.level++;
    player.stats.xpNeeded = Math.floor(player.stats.xpNeeded * 1.5);
    
    // Stat increases
    const hpGain = Math.floor(Math.random() * 10) + 10;
    const kiGain = Math.floor(Math.random() * 5) + 5;
    const atkGain = Math.floor(Math.random() * 3) + 2;
    const defGain = Math.floor(Math.random() * 2) + 1;
    const spdGain = Math.floor(Math.random() * 2) + 1;
    
    player.stats.maxHp += hpGain;
    player.stats.hp = player.stats.maxHp;
    player.stats.maxKi += kiGain;
    player.stats.ki = player.stats.maxKi;
    player.stats.attack += atkGain;
    player.stats.defense += defGain;
    player.stats.speed += spdGain;
    
    // Calculate power level
    player.stats.powerLevel = player.stats.level * 10 + player.stats.attack + player.stats.defense;
    
    // Show level up screen
    showLevelUpScreen(hpGain, kiGain, atkGain, defGain, spdGain);
}

function showLevelUpScreen(hpGain, kiGain, atkGain, defGain, spdGain) {
    currentState = GameState.LEVELUP;
    
    const screen = document.getElementById('levelup-screen');
    screen.classList.remove('hidden');
    
    document.getElementById('new-level').textContent = player.stats.level;
    document.getElementById('power-level').textContent = player.stats.powerLevel;
    
    const bonusesDiv = document.getElementById('stat-bonuses');
    bonusesDiv.innerHTML = `
        <div>+${hpGain} Max HP</div>
        <div>+${kiGain} Max Ki</div>
        <div>+${atkGain} Attack</div>
        <div>+${defGain} Defense</div>
        <div>+${spdGain} Speed</div>
    `;
}

function closeLevelUp() {
    document.getElementById('levelup-screen').classList.add('hidden');
    currentState = GameState.WORLD;
}

// Quest System
function completeQuest(questId) {
    const quest = quests[questId];
    if(!quest || quest.completed) return;
    
    quest.completed = true;
    
    if(quest.reward.xp) {
        player.stats.xp += quest.reward.xp;
        showFloatingText(`+${quest.reward.xp} XP!`, player.x, player.y - 40, '#FFFF00');
    }
    
    if(quest.reward.item === 'training') {
        player.stats.attack += 5;
        player.stats.defense += 5;
        showFloatingText('Training Complete! Stats +5', player.x, player.y - 50, '#00FF00');
    }
    
    alert(`Quest Complete: ${quest.name}!`);
}

// Shop System
function handleShop(action) {
    if(action === 'buy:senzu') {
        if(player.stats.xp >= 10) {
            player.stats.xp -= 10;
            addToInventory({ name: 'Senzu Bean', type: 'heal', power: 50, sprite: '🫘' });
            showFloatingText('+Senzu Bean', player.x, player.y - 20, '#00FF00');
        }
    }
    else if(action === 'buy:boost') {
        if(player.stats.xp >= 20) {
            player.stats.xp -= 20;
            player.stats.attack += 2;
            player.stats.defense += 1;
            showFloatingText('Stats Boosted!', player.x, player.y - 20, '#00FF00');
        }
    }
    updatePlayerUI();
}

// Inventory System
function toggleInventory() {
    if(currentState === GameState.INVENTORY) {
        document.getElementById('inventory-screen').classList.add('hidden');
        currentState = GameState.WORLD;
    } else if(currentState === GameState.WORLD) {
        currentState = GameState.INVENTORY;
        renderInventory();
        document.getElementById('inventory-screen').classList.remove('hidden');
    }
}

function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    
    for(let i = 0; i < player.maxInventory; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        
        if(i < player.inventory.length) {
            const item = player.inventory[i];
            slot.textContent = item.sprite;
            slot.addEventListener('click', () => selectItem(i));
        }
        
        grid.appendChild(slot);
    }
}

function selectItem(index) {
    const item = player.inventory[index];
    if(!item) return;
    
    const details = document.getElementById('item-details');
    details.innerHTML = `
        <strong>${item.name}</strong><br>
        ${item.type === 'heal' ? `Heals ${item.power} HP` : 'Key Item'}<br>
        <button onclick="useItem(${index})">Use</button>
        <button onclick="dropItem(${index})">Drop</button>
    `;
}

function useItem(index) {
    const item = player.inventory[index];
    if(!item) return;
    
    if(item.type === 'heal') {
        player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + item.power);
        player.inventory.splice(index, 1);
        showFloatingText(`+${item.power} HP`, player.x, player.y - 20, '#00FF00');
        updatePlayerUI();
    }
    
    renderInventory();
}

function dropItem(index) {
    player.inventory.splice(index, 1);
    renderInventory();
}

// UI Updates
function updateUI() {
    updatePlayerUI();
    document.getElementById('db-count').textContent = player.dragonBalls.length;
    document.getElementById('level').textContent = player.stats.level;
    document.getElementById('attack').textContent = player.stats.attack;
    document.getElementById('defense').textContent = player.stats.defense;
    document.getElementById('speed').textContent = player.stats.speed;
}

function updatePlayerUI() {
    const hpPercent = (player.stats.hp / player.stats.maxHp) * 100;
    const kiPercent = (player.stats.ki / player.stats.maxKi) * 100;
    
    document.getElementById('hp-bar').style.width = `${hpPercent}%`;
    document.getElementById('hp-text').textContent = `${player.stats.hp}/${player.stats.maxHp}`;
    document.getElementById('ki-bar').style.width = `${kiPercent}%`;
    document.getElementById('ki-text').textContent = `${player.stats.ki}/${player.stats.maxKi}`;
    document.getElementById('xp').textContent = player.stats.xp;
    document.getElementById('xp-needed').textContent = player.stats.xpNeeded;
    document.getElementById('level').textContent = player.stats.level;
}

function gameOver() {
    currentState = GameState.GAMEOVER;
    document.getElementById('combat-screen').classList.add('hidden');
    document.getElementById('game-over').classList.remove('hidden');
}

// Visual Effects
let floatingTexts = [];

function showFloatingText(text, x, y, color) {
    const floating = document.createElement('div');
    floating.className = 'damage-popup';
    floating.textContent = text;
    floating.style.left = x + 'px';
    floating.style.top = y + 'px';
    floating.style.color = color;
    document.getElementById('game-container').appendChild(floating);
    
    setTimeout(() => floating.remove(), 1000);
}

// Rendering
function render() {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    renderMap();
    renderItems();
    renderEnemies();
    renderBosses();
    renderNPCs();
    renderPlayer();
}

function renderMap() {
    for(let y = 0; y < MAP_HEIGHT; y++) {
        for(let x = 0; x < MAP_WIDTH; x++) {
            const tile = worldMap[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;
            
            switch(tile) {
                case 0: // Grass
                    ctx.fillStyle = '#4CAF50';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    // Add grass detail
                    if((x + y) % 3 === 0) {
                        ctx.fillStyle = '#45a049';
                        ctx.fillRect(px + 8, py + 8, 4, 4);
                    }
                    break;
                case 1: // Water
                    ctx.fillStyle = '#2196F3';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#1976D2';
                    ctx.fillRect(px + 4, py + 8, TILE_SIZE - 8, 4);
                    break;
                case 2: // Wall
                    ctx.fillStyle = '#424242';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#616161';
                    ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                    break;
                case 3: // Tree
                    ctx.fillStyle = '#4CAF50';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#795548';
                    ctx.fillRect(px + 12, py + 20, 8, 12);
                    ctx.fillStyle = '#2E7D32';
                    ctx.fillRect(px + 4, py + 4, 24, 20);
                    break;
                case 4: // Sand
                    ctx.fillStyle = '#F4A460';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    break;
                case 5: // Mountain
                    ctx.fillStyle = '#4CAF50';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#757575';
                    ctx.beginPath();
                    ctx.moveTo(px + 16, py + 4);
                    ctx.lineTo(px + 28, py + 28);
                    ctx.lineTo(px + 4, py + 28);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(px + 14, py + 8, 4, 4);
                    break;
            }
        }
    }
}

function renderItems() {
    items.forEach(item => {
        if(item.collected) return;
        
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(item.x, item.y + 10, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw item
        ctx.fillText(item.sprite, item.x, item.y + Math.sin(Date.now() / 200) * 3);
    });
}

function renderEnemies() {
    enemies.forEach(enemy => {
        if(enemy.defeated) return;
        
        // Draw enemy body
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x - 12, enemy.y - 12, 24, 24);
        
        // Draw eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(enemy.x - 8, enemy.y - 6, 6, 6);
        ctx.fillRect(enemy.x + 2, enemy.y - 6, 6, 6);
        ctx.fillStyle = '#000';
        ctx.fillRect(enemy.x - 6, enemy.y - 4, 3, 3);
        ctx.fillRect(enemy.x + 4, enemy.y - 4, 3, 3);
        
        // HP bar
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(enemy.x - 14, enemy.y - 22, 28, 4);
        ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FF9800' : '#F44336';
        ctx.fillRect(enemy.x - 14, enemy.y - 22, 28 * hpPercent, 4);
    });
}

function renderBosses() {
    bosses.forEach(boss => {
        if(boss.defeated) return;
        
        const pulse = Math.sin(Date.now() / 200) * 0.1 + 1;
        const size = 30 * pulse;
        
        // Aura
        const gradient = ctx.createRadialGradient(
            boss.x, boss.y, 10,
            boss.x, boss.y, 40
        );
        gradient.addColorStop(0, boss.color + '40');
        gradient.addColorStop(1, boss.color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Boss body
        ctx.fillStyle = boss.color;
        ctx.fillRect(boss.x - size/2, boss.y - size/2, size, size);
        
        // Boss eyes
        ctx.fillStyle = '#F44336';
        ctx.fillRect(boss.x - 10, boss.y - 8, 8, 6);
        ctx.fillRect(boss.x + 2, boss.y - 8, 8, 6);
        
        // Boss name
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(boss.name, boss.x, boss.y - size/2 - 8);
        
        // HP bar
        const hpPercent = boss.hp / boss.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(boss.x - 25, boss.y - size/2 - 20, 50, 6);
        ctx.fillStyle = '#F44336';
        ctx.fillRect(boss.x - 25, boss.y - size/2 - 20, 50 * hpPercent, 6);
    });
}

function renderNPCs() {
    npcs.forEach(npc => {
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(npc.x, npc.y + 12, 14, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // NPC sprite
        ctx.fillText(npc.sprite, npc.x, npc.y);
        
        // Name tag
        ctx.fillStyle = '#FFD700';
        ctx.font = '8px Arial';
        ctx.fillText(npc.name, npc.x, npc.y + 20);
        
        // Quest indicator
        if(npc.quest === activeQuest && !quests[activeQuest].completed) {
            ctx.fillStyle = '#FF0000';
            ctx.font = '16px Arial';
            ctx.fillText('!', npc.x + 15, npc.y - 15);
        }
    });
}

function renderPlayer() {
    const bounce = player.moving ? Math.sin(Date.now() / 100) * 3 : 0;
    
    // Draw shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(player.x + player.width/2, player.y + player.height, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player body (spiky hair style)
    ctx.fillStyle = '#FF9800';
    ctx.fillRect(player.x, player.y - bounce, player.width, player.height);
    
    // Hair spikes
    ctx.fillStyle = '#000';
    const hairOffset = player.y - bounce - 2;
    ctx.fillRect(player.x + 4, hairOffset, 4, 6);
    ctx.fillRect(player.x + 8, hairOffset - 2, 4, 8);
    ctx.fillRect(player.x + 12, hairOffset + 2, 4, 6);
    ctx.fillRect(player.x + 16, hairOffset, 4, 6);
    
    // Face
    ctx.fillStyle = '#FFCCBC';
    ctx.fillRect(player.x + 4, player.y - bounce + 8, 16, 12);
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 7, player.y - bounce + 10, 3, 3);
    ctx.fillRect(player.x + 14, player.y - bounce + 10, 3, 3);
    
    // Mouth
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x + 9, player.y - bounce + 16, 6, 2);
    
    // Outfit
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(player.x, player.y - bounce + 20, player.width, player.height - 20);
    
    // Belt
    ctx.fillStyle = '#FF5722';
    ctx.fillRect(player.x + 2, player.y - bounce + 22, player.width - 4, 4);
    
    // Direction indicator
    if(player.moving) {
        const indicatorOffset = {
            'up': {x: 0, y: -25},
            'down': {x: 0, y: 35},
            'left': {x: -25, y: 0},
            'right': {x: 25, y: 0}
        }[player.direction];
        
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(player.x + player.width/2, player.y + player.height/2);
        ctx.lineTo(
            player.x + player.width/2 + indicatorOffset.x,
            player.y + player.height/2 + indicatorOffset.y
        );
        ctx.stroke();
    }
}

// Expose functions for HTML onclick handlers
window.useItem = useItem;
window.dropItem = dropItem;
