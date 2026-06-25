# 我的简讯 开发文档

## 项目简介

「我的简讯」是一款纯前端实现的个人信息发布与浏览应用。采用苹果风格 UI 设计，支持富媒体发布、心情表情、标签提取、背景轮播等功能，所有数据通过浏览器 Local Storage 与 IndexedDB 本地持久化。

---

## 技术栈

- HTML5
- CSS3（变量、Flexbox、Grid、Backdrop-filter）
- JavaScript ES6+（无框架）
- Local Storage：存储用户信息与简讯元数据
- IndexedDB：存储图片、视频、头像等媒体二进制文件

---

## 项目结构

```
我的简讯/
├── index.html              # 页面结构与入口
├── css/
│   ├── reset.css           # 基础重置与 CSS 变量
│   ├── components.css      # 补充变量定义
│   └── style.css           # 主样式（苹果风格）
└── js/
    ├── myinfo-db.js        # IndexedDB 媒体存储封装
    ├── myinfo-utils.js     # 通用工具函数
    ├── myinfo-media.js     # 媒体上传、预览、背景轮播
    └── myinfo-app.js       # 主业务逻辑
```

---

## 本地运行

由于使用了 ES6 模块与 IndexedDB，推荐通过本地 HTTP 服务器访问：

```bash
python3 -m http.server 8080
```

然后打开浏览器访问 `http://localhost:8080`。

---

## 数据存储

### Local Storage

Key: `myinfo-data`

```json
{
  "currentUser": {
    "name": "我",
    "avatarFileId": null
  },
  "settings": {
    "bgInterval": 10
  },
  "posts": [
    {
      "id": "timestamp-random",
      "author": "我",
      "avatarFileId": null,
      "content": "简讯正文",
      "mood": "😊",
      "tags": ["标签1", "标签2"],
      "createdAt": "2026-06-25T12:00:00.000Z",
      "media": [
        { "fileId": "xxx", "type": "image" }
      ],
      "likes": 0,
      "likedByMe": false,
      "comments": [],
      "reposts": 0,
      "isPinned": false,
      "isRetracted": false,
      "isHidden": false
    }
  ]
}
```

### IndexedDB

数据库名：`myinfo-media-db`
对象存储：`media`

每条记录：
```js
{
  id: "媒体唯一ID",
  blob: Blob,
  type: "image" | "video",
  name: "文件名",
  size: 12345,
  coverId: "封面ID（视频类型）",
  duration: 12.5,
  createdAt: "ISO时间"
}
```

---

## 核心功能

### 1. 简讯发布

- 文本输入，最多 140 字
- 心情表情选择（😊 😂 🤔 👍 ❤️ 🎉 😴 😭）
- 图片上传：最多 9 张，单张不超过 5MB
- 视频上传：最多 1 个，不超过 50MB、60 秒
- 发布时自动提取 `#话题`、地点词、时间词生成标签

### 2. 简讯操作

每条简讯支持以下操作按钮：

| 操作 | 说明 |
|------|------|
| 置顶 | 将简讯固定在列表最上方，同时只能置顶一条 |
| 编辑 | 修改文本与心情，不可修改媒体 |
| 撤回 | 标记为已撤回，内容显示删除线，互动禁用 |
| 隐藏 | 从列表中隐藏，数据保留，可取消隐藏 |
| 删除 | 彻底删除简讯及关联媒体文件 |

### 3. 互动

- 点赞：本地计数，状态持久化
- 评论：展开评论框，发表评论
- 转发：占位提示，未实现

### 4. 搜索与过滤

- 首页与「我的」页面均支持搜索
- 支持按内容、作者、标签搜索
- 点击简讯下方标签可快速过滤

### 5. 媒体库

- 列出所有本地存储的图片与视频
- 显示文件大小
- 支持删除未被使用的媒体文件

### 6. 风景背景轮播

- 使用 Picsum Photos 免费图片资源
- 6 张自然风景主题：山脉、湖泊、森林、日落、海洋、草甸
- 背景图根据浏览器视口尺寸动态加载
- 默认 10 秒切换，支持 5/10/30/60 秒设置
- 窗口大小变化时自动重新加载匹配尺寸图片

---

## 样式设计

### 设计系统

- 主背景：`#f5f5f7`
- 卡片背景：`rgba(255, 255, 255, 0.82)` + 毛玻璃效果
- 强调色：`#0071e3`
- 主文字：`#1d1d1f`
- 次要文字：`#6e6e73`
- 圆角：卡片 `18px`，按钮 `100px` 胶囊形
- 阴影：`0 12px 40px rgba(0,0,0,0.08)`
- 字体：系统字体栈，优先 SF Pro / PingFang SC

### 响应式

- 桌面端最大宽度 720px 居中
- 移动端自适应，小屏幕下减少边距与缩进

---

## 关键代码说明

### 自动生成标签

文件：`js/myinfo-utils.js:97`

```js
function extractTags(content) {
  // 1. 提取 #话题
  // 2. 提取「在XXX」地点词
  // 3. 提取常见时间词
  // 返回最多 6 个标签
}
```

### 媒体存储

文件：`js/myinfo-db.js`

提供 `saveMedia`、`getMedia`、`deleteMedia`、`getAllMedia`、`createObjectURL`、`cleanupOrphanMedia` 等函数。

### 背景轮播

文件：`js/myinfo-media.js:278`

```js
function initBackgroundSlider() {
  // 1. 根据视口尺寸生成图片 URL
  // 2. 预加载完成后开始轮播
  // 3. 支持设置切换间隔
  // 4. resize 时重新加载
}
```

### 简讯排序

文件：`js/myinfo-app.js:316`

排序规则：
1. 置顶的简讯排在最前
2. 其余按创建时间倒序

---

## 注意事项

1. **首次访问**：由于没有后端，首次打开应用数据为空。
2. **清除浏览器数据**：Local Storage 与 IndexedDB 被清除后，所有简讯和媒体都会丢失。
3. **跨域图片**：背景图片来自 Picsum Photos，需要网络连接。
4. **文件限制**：图片单张 5MB，视频 50MB / 60 秒。
5. **Git 历史**：本项目使用 orphan 分支策略，GitHub 上只保留最新版本提交。

---

## 后续可扩展方向

- 数据导出 / 导入
- 多用户切换
- 图片点击放大预览
- 评论点赞
- 深色模式
- Service Worker 离线访问

---

## 仓库地址

https://github.com/mao936/myweiboproject.git
