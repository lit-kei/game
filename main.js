// ---------------- Canvas ----------------
const canvas = document.getElementById('main');
const ctx = canvas.getContext('2d');

// ---------------- Player クラス ----------------
class Player {
    constructor(name, x, y) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.radius = 12;
    }

}

// CPU鬼クラス
class CPUPlayer extends Player {
    constructor(name, x, y) {
        super(name, x, y);
        this.isCPU = true;
    }

    chase(target) {
        const speed = 1.5;
        let dx = target.x - this.x;
        let dy = target.y - this.y;
        let dist = Math.hypot(dx, dy);
        if(dist > 0){
            this.x += (dx/dist) * speed;
            this.y += (dy/dist) * speed;
        }
        // 壁制限
        const r = this.radius;
        this.x = Math.min(Math.max(this.x, r), canvas.width - r);
        this.y = Math.min(Math.max(this.y, r), canvas.height - r);
    }
}

// ---------------- キー入力 ----------------
const keys = { ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false };
window.addEventListener("keydown", e => {
    if(keys[e.key]!==undefined) keys[e.key]=true;

    // スペースでリセット
    if(e.code === "Space"){
        resetGame();
    }
});
window.addEventListener("keyup", e => { if(keys[e.key]!==undefined) keys[e.key]=false; });

// ---------------- ゲームリセット関数 ----------------
function resetGame(){
    // プレイヤーとCPUの位置を初期化
    player.x = 100;
    player.y = 100;
    cpu.x = 250;
    cpu.y = 250;

    // 再描画（Game Over画面を消す）
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawPlayer(player,'red');
    drawPlayer(cpu,'black');

    // mainLoop が止まっていたら再開
    if(!intervalId){
        intervalId = setInterval(mainLoop,33);
    }
}


// ---------------- プレイヤー初期化 ----------------
let playerName = localStorage.getItem('playerName');

if(!playerName){
    playerName = prompt("あなたのユーザー名を入力してください");
    localStorage.setItem('playerName', playerName);
}
const player = new Player(playerName, 100, 100);;

// ---------------- CPU管理 ----------------
let cpu = new CPUPlayer('demon', 250, 250);



// ---------------- メインループ ----------------

function move(p, dx, dy){
    let nx = p.x + dx, ny = p.y + dy;
    const r = p.radius;
    nx = Math.min(Math.max(nx,r),canvas.width - r);
    ny = Math.min(Math.max(ny,r),canvas.height - r);
    p.x = nx;
    p.y = ny;
}

// 描画
function drawPlayer(p, color){
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
    ctx.fillStyle=color;
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle='black';
    ctx.font='14px sans-serif';
    ctx.textAlign='center';
    ctx.fillText(p.name,p.x,p.y - p.radius -5);
}

const speed = 2;

function mainLoop(){
    if (((player.x - cpu.x) * (player.x - cpu.x)) + ((player.y - cpu.y) * (player.y - cpu.y)) <= (player.radius + cpu.radius) * (player.radius + cpu.radius)) {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.beginPath();
        ctx.rect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.closePath();
        ctx.fillStyle='red';
        ctx.font='40px sans-serif';
        ctx.textAlign='center';
        ctx.fillText("Game Over",250,220);
        ctx.fillStyle='white';
        ctx.font='25px sans-serif';
        ctx.textAlign='center';
        ctx.fillText("スペースキーでリスタート",250,300);

        
        clearInterval(intervalId);
        intervalId = null;
        return;
    }
    // 自プレイヤー移動
    let dx=0, dy=0;
    if(keys.ArrowUp) dy -= speed;
    if(keys.ArrowDown) dy += speed;
    if(keys.ArrowLeft) dx -= speed;
    if(keys.ArrowRight) dx += speed;

    if(dx!==0 || dy!==0){
        move(player, dx, dy);
    }

    cpu.chase(player);

    // 描画
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawPlayer(player,'red');
    if(cpu) drawPlayer(cpu,'black');
}

let intervalId = setInterval(mainLoop,33); // 約30FPS
