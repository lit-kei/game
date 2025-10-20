import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------- Supabase 設定 ----------------
const supabaseUrl = "https://gqakkvhembttgwgxwica.supabase.co";
const supabaseKey = "sb_publishable_zda_YgfMlaAT1Z65bitwQw_SwvON88F";
const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------- canvas 設定 ----------------
const canvas = document.getElementById('main');
const ctx = canvas.getContext('2d');

// ---------------- プレイヤークラス ----------------
class Player {
    constructor(name, x, y) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.radius = 12;
    }

    async updateSupabase() {
        const { data, error } = await supabase
            .from("players")
            .update({ x: this.x, y: this.y })
            .eq("name", this.name);
        if(error) console.error("Supabase update error:", error);
    }
}

// ---------------- キー入力管理 ----------------
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

window.addEventListener("keydown", e => {
    if(keys[e.key] !== undefined) keys[e.key] = true;
});
window.addEventListener("keyup", e => {
    if(keys[e.key] !== undefined) keys[e.key] = false;
});

// ---------------- プレイヤー登録 ----------------
let playerName = localStorage.getItem('playerName');

// プレイヤー登録または取得
async function initPlayer(name) {
    // 1. Supabaseから既存プレイヤー情報を取得
    const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("name", name)
        .single(); // 名前はユニーク前提

    if (error) {
        if (error.code === "PGRST116") { // データなし
            // 2. プレイヤーが存在しなければ新規登録
            await supabase.from("players").insert({ name, x: 100, y: 100 });
            return new Player(name, 100, 100);
        } else {
            console.error("Supabase error:", error);
            return new Player(name, 100, 100);
        }
    } else {
        // 3. 既存データがあればその情報で初期化
        return new Player(data.name, data.x, data.y);
    }
}

if(!playerName){
    playerName = prompt("あなたのユーザー名を入力してください");
    localStorage.setItem('playerName', playerName);
}

const player = await initPlayer(playerName);

// ---------------- 他プレイヤーのリアルタイム受信 ----------------
const otherPlayers = {};

supabase.channel("realtime:players")
    .on("postgres_changes", { event: "*", schema: "public", table: "players" },
        payload => {
            const p = payload.new;
            if(p.name !== player.name){
                otherPlayers[p.name] = new Player(p.name, p.x, p.y);
            }
        }
    )
    .subscribe();

// ---------------- メインループ ----------------
let lastUpdate = 0;
const updateInterval = 100; // ms
const speed = 2; // 移動量

function updatePlayerPosition(player, dx, dy) {
    // 移動後の座標
    let newX = player.x + dx;
    let newY = player.y + dy;

    // キャンバスの範囲内に制限
    const radius = player.radius;
    if(newX - radius < 0) newX = radius;
    if(newX + radius > canvas.width) newX = canvas.width - radius;
    if(newY - radius < 0) newY = radius;
    if(newY + radius > canvas.height) newY = canvas.height - radius;

    // 座標を反映
    player.x = newX;
    player.y = newY;
}   

function mainLoop() {
    // キー押下による移動
    let dx = 0, dy = 0;
    if(keys.ArrowUp) dy -= speed;
    if(keys.ArrowDown) dy += speed;
    if(keys.ArrowLeft) dx -= speed;
    if(keys.ArrowRight) dx += speed;

    if(dx !== 0 || dy !== 0){
        updatePlayerPosition(player, dx, dy); // ここで枠外チェック
        
        // Supabase更新は100msごと
        const now = Date.now();
        if(now - lastUpdate > updateInterval){
            player.updateSupabase();
            lastUpdate = now;
        }
    }

    // 描画
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 自分のプレイヤー
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.closePath();
    // 名前を表示
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, player.x, player.y - player.radius - 5); // 円の上に表示

    // 他プレイヤー
    for(const name in otherPlayers){
        const p = otherPlayers[name];

        // 円
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.closePath();

        // 名前
        ctx.fillStyle = 'black';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, p.x, p.y - p.radius - 5);
    }
}

setInterval(mainLoop, 33); // 約30FPS