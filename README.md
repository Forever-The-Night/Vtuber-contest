# 虚拟主播 AI 图片大赛平台

一个私密周期赛 MVP：QQ 白名单注册、SFW/NSFW 双赛道投稿、AI 图片 metadata 识别、画廊浏览、评论、投票、排行榜和管理员后台。

低成本上线步骤见 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 本地运行

```bash
npm install
npm run prisma:push
npm run dev
```

打开 `http://localhost:3000`。首次启动数据库为空时，进入 `/setup` 创建首位管理员。

## 管理后台流程

1. 在 `/setup` 创建首位管理员。
2. 到 `/admin/whitelist` 导入 QQ 白名单 CSV，列名至少包含 `qq,inviteCode`。
3. 到 `/admin/vtubers` 导入 VTuber 名单 TXT，每行一个官方完整名字。
4. 到 `/admin/contests` 创建比赛届次，配置投稿期、投票期、结果公布时间，以及投票期是否显示票数/排名。
5. 用户注册登录后到 `/submit` 投稿，到 `/vote` 投票。
6. `/dashboard` 是个人中心，用来查看自己的作品和跳转投稿/投票。
7. 管理员可在 `/admin/submissions` 隐藏、恢复或删除作品，在 `/admin/votes` 查看投票日志和 IP/UA。

## 当前 MVP 功能

- 游客可浏览 SFW；NSFW、投稿、评论、投票需要登录。
- QQ 必须存在于白名单才能注册。
- 邀请码字段和环境开关已预留：`INVITE_REQUIRED=true` 时注册会校验 `inviteCode`。
- QQ 白名单支持 CSV 导入、单条添加、导出 CSV、一键生成缺失邀请码；已有邀请码不会被覆盖。
- VTuber 名单支持 TXT 导入、单条添加和导出 TXT。
- 管理后台可编辑已创建届次，提前切换到投稿期/投票期/封榜/结果阶段，并随时开关投票期票数和排名显示。
- 每人每届最多 10 张作品。
- 上传时选择 SFW 或 NSFW 互斥赛道。
- 上传 Server Action body limit 当前配置为 32MB。
- 解析 PNG metadata、常见 Stable Diffusion 参数、ComfyUI workflow 线索、NovelAI Comment JSON、部分 EXIF 字段。
- 投票当前为每用户每作品一次，已记录 IP/UA；每日 20 票或竞技场模式后续可在投票模块上扩展。
- 排行榜在投票期默认隐藏，结果期或后台开关开启后展示。
- 排名页展示图片，前三名大图完整展示，其余名次缩小显示。

## 需要准备的素材

- QQ 白名单 CSV：`qq,inviteCode`。
- VTuber 名单 TXT：每行一个官方完整名字。
- 默认头像图片：后续可放入 `public/default-avatar.png` 并接到用户头像逻辑。
- 用于测试 metadata 的源文件样图：建议覆盖 SD、ComfyUI、NovelAI。

## 常用命令

```bash
npm run lint
npm run build
npm run prisma:push
npm run prisma:studio
```

## 部署备注

当前项目已按 Vercel + Neon PostgreSQL + Cloudflare R2 改造。线上部署、环境变量、R2 配置和保留数据导入步骤见 [DEPLOYMENT.md](DEPLOYMENT.md)。
