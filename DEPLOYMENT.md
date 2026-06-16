# 低成本上线指南：Vercel + Neon + Cloudflare R2

这份指南按当前项目已经改好的部署方式编写：Vercel 运行 Next.js，Neon 托管 PostgreSQL，Cloudflare R2 存储投稿图片。

## 需要注册/购买

### 1. Vercel

- 注册：<https://vercel.com>
- 套餐建议：个人/小圈子测试用 Hobby 免费档；如果是团队共同管理、商业活动或流量明显增加，再升级 Pro。
- 用途：部署网站和 Server Actions。

### 2. Neon PostgreSQL

- 注册：<https://neon.tech>
- 套餐建议：Free 起步即可；如果投票人数较多或需要更稳定性能，再升级 Launch。
- 用途：线上数据库。不要在线上继续使用 SQLite。

创建 Neon 项目后复制连接串，格式类似：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
```

### 3. Cloudflare + R2

- 注册：<https://dash.cloudflare.com>
- 套餐建议：Cloudflare 免费账户 + R2 按量计费。小型比赛通常成本很低。
- 域名：当前先使用 Cloudflare 提供的 `r2.dev` 公共开发 URL，不强制购买域名。以后需要更稳定的缓存、访问控制和品牌域名时，再绑定自定义域名。
- 用途：R2 当作你自己的低成本图片存储，不使用 Vercel 本地文件系统。

当前 R2 公开访问地址：

```text
https://pub-ab52b518ee8b48b2870dbcac70fe178e.r2.dev
```

以后如果购买域名，可规划为：`contest.example.com` 指向 Vercel，`img.example.com` 指向 Cloudflare R2 bucket。

R2 操作：

1. 创建 bucket，例如 `vtuber-contest-images`。
2. 开启 `r2.dev` 公共开发 URL；当前项目使用 `https://pub-ab52b518ee8b48b2870dbcac70fe178e.r2.dev`。
3. 创建 R2 API Token / S3 Credentials，权限至少需要 Object Read & Write。
4. 记录 `Account ID`、`Access Key ID`、`Secret Access Key`、`Bucket`、公开域名。

## Vercel 环境变量

在 Vercel 项目 Settings -> Environment Variables 填入：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
AUTH_SECRET="一段足够长的随机字符串，至少 32 位"
INVITE_REQUIRED="true"

UPLOAD_DRIVER="r2"
R2_ACCOUNT_ID="你的 Cloudflare Account ID"
R2_ACCESS_KEY_ID="你的 R2 Access Key ID"
R2_SECRET_ACCESS_KEY="你的 R2 Secret Access Key"
R2_BUCKET="vtuber-contest-images"
R2_PUBLIC_BASE_URL="https://pub-ab52b518ee8b48b2870dbcac70fe178e.r2.dev"
```

`AUTH_SECRET` 可以用本地 PowerShell 生成：

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 已完成的本地清理

本地历史比赛数据已经清理：

- 保留账户：2 个
- 保留 QQ 白名单：169 条
- 保留 VTuber 名单：84 条
- 清空历史届次、投稿、投票、评论、浏览记录、公告、后台日志
- 清空 `public/uploads`

保留数据已经导出到：

```text
data/preserved-data.json
```

这个文件包含 QQ、密码哈希和名单数据，已经被 `.gitignore` 忽略，不要发给无关人员。

## 初始化 Neon 数据库

拿到 Neon 的 `DATABASE_URL` 后，在本地 PowerShell 执行：

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DB?sslmode=require"
npm run prisma:deploy
npm run data:import-preserved
```

执行这两条命令前请先停止本地 `npm run dev`。本地 dev 会生成 SQLite 版 Prisma Client，如果不停掉，Windows 可能锁住 Prisma DLL，导致 generate 或导入失败。

这会做两件事：

1. 把当前 Prisma schema 推送到 Neon。
2. 把 `data/preserved-data.json` 里的账户、QQ 白名单、VTuber 名单导入 Neon。

如果以后要重新从旧 SQLite 导出保留数据，先确保 `prisma/dev.db` 还在，然后执行：

```powershell
$env:SQLITE_DATABASE_URL="file:../prisma/dev.db"
npm run data:export-preserved
```

## 部署到 Vercel

1. 把项目推到 GitHub。
2. Vercel -> Add New Project -> Import GitHub repo。
3. Framework Preset 选 Next.js。
4. Build Command 保持 `npm run build`。
5. Install Command 保持默认 `npm install`。
6. 填好上面的环境变量。
7. Deploy。

项目已经配置：

```json
"postinstall": "prisma generate"
```

所以 Vercel 安装依赖后会自动生成 Prisma Client。

## 部署后检查

部署完成后按这个顺序检查：

1. 打开首页，确认没有报错。
2. 用已有管理员账号登录。
3. 进入后台 -> 届次，创建一个新比赛。
4. 进入后台 -> 公告，发布一条公告。
5. 用一个白名单 QQ 注册/登录。
6. 在个人中心上传一张测试图，确认图片 URL 是 `https://pub-ab52b518ee8b48b2870dbcac70fe178e.r2.dev/uploads/...`。
7. 切到投票期，测试投票、取消投票、筛选、排行榜。
8. 后台导出作品、投票、排行榜 CSV。

## 本地开发建议

默认本地开发直接运行：

```powershell
npm run dev
```

这个命令会临时生成 SQLite 版 Prisma Client，自动同步 `prisma/dev.db`，并把上传文件保存到本地 `public/uploads`。它不影响线上部署用的 PostgreSQL 主 schema。

如果本地也想连接 Neon/PostgreSQL 调试，可以运行：

```powershell
$env:DATABASE_URL="你的 Neon PostgreSQL URL"
npm run dev:postgres
```

如果本地使用 Neon 数据库，但图片仍想存本地，可以在本地 `.env` 使用：

```env
DATABASE_URL="你的 Neon 或本地 PostgreSQL URL"
UPLOAD_DRIVER="local"
AUTH_SECRET="dev-secret"
INVITE_REQUIRED="false"
```

线上不要设置 `UPLOAD_DRIVER="local"`。生产环境没有 R2 配置时，上传会直接报错，避免图片误写入 Vercel 临时文件系统。

## 后续再优化

当前为了低成本快速落地，图片上传仍然经过 Vercel Server Action，再写入 R2。比赛规模扩大后，建议改成浏览器直传 R2 signed URL，减少 Vercel 函数压力。
