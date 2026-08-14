# BOSS GAJIAN — Discord Bot

Bot Discord untuk:
1. Party management Dragon Nest.
2. Raid Nest management.
3. Sold item tracking.
4. Stamp price.
5. Salary dashboard.
6. Raid finish / salary calculation.

## Requirements

- Node.js 18.17+ (20+ recommended)
- Discord Bot Application
- Server Discord tempat bot akan digunakan

## 1. Install

```bash
npm install
```

## 2. Buat `.env`

Copy `.env.example` menjadi `.env`:

```env
DISCORD_TOKEN=TOKEN_BOT
CLIENT_ID=APPLICATION_CLIENT_ID
GUILD_ID=SERVER_ID
```

## 3. Discord Developer Portal

Bot harus di-invite ke server dengan scope:

- `bot`
- `applications.commands`

Permission yang disarankan:

- View Channels
- Send Messages
- Embed Links
- Read Message History
- Use Slash Commands

Bot ini tidak membutuhkan Message Content Intent.

## 4. Register slash command

```bash
npm run deploy
```

Jika sukses akan muncul:

```text
Guild slash commands registered.
```

## 5. Start

```bash
npm start
```

## Party

### Buat party

```text
/party create
```

Isi:
- name
- nest
- slots (opsional, default 8)

Shortcut:

```text
/raidparty
```

### Tombol party

- MT / PR / MC / EL
- FU / SM / DPS1 / DPS2
- Close Party
- Lock / Unlock
- Raid Finish
- Leave
- Add Member
- Kick
- Swap
- SET NEST

### Aturan

- Member biasa bisa klik slot kosong untuk mengambil slotnya sendiri.
- Creator/admin dapat Add Member.
- Creator/admin dapat Kick, Swap, Lock, Close, dan SET NEST.
- Creator tidak dapat Leave; gunakan Close Party.
- Raid Finish menutup party dan memasukkan semua member party ke salary members.

## Salary

### Buat dashboard

Di channel yang ingin digunakan:

```text
/salary setup
```

Shortcut yang sama:

```text
/setup
```

Bot akan membuat satu Embed dashboard dan terus mengedit Embed tersebut.

### Tambah member

```text
/salary addmember user:@Nama
```

### Hapus member

```text
/salary removemember user:@Nama
```

### Lihat member

```text
/salary members
```

### Input item

```text
/sold_item
```

Contoh:

```text
item_name: Ring Unique
gold: 500g
stamp: 20
tag: @Denny
```

Format gold yang didukung:

- `500g`
- `1.5k`
- `2m`
- `1b`

### Lihat item

```text
/sold_list
```

### Hapus item

```text
/sold_remove sale_id:...
```

### Atur harga stamp

```text
/setstampprice price:3
```

### Hitung salary

```text
/raid_done
```

Rumus default:

```text
Total Item Gold
+ (Total Stamp × Stamp Price)
= Total Salary Pool

Total Salary Pool ÷ Jumlah Salary Member
= Salary per Member
```

## Reset

```text
/salary reset
```

Ini menghapus:
- semua sold items
- semua salary members

Gunakan dengan hati-hati.

## Data

Semua data disimpan di:

```text
data.json
```

Bot akan membuat file tersebut otomatis jika belum ada.

## Deploy di VPS / panel

```bash
npm install
npm run deploy
npm start
```

Untuk PM2:

```bash
npm install -g pm2
pm2 start index.js --name boss-gajian
pm2 save
pm2 startup
```
