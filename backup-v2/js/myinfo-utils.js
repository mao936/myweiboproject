const STORAGE_KEY = 'myinfo-data';
const MAX_LENGTH = 140;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_IMAGES = 9;

const MOODS = ['', '😊', '😂', '🤔', '👍', '❤️', '🎉', '😴', '😭'];

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;

  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日 ${hour}:${minute}`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message) {
  const toast = document.querySelector('.toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.hidden = true;
  }, 2500);
}

function createDefaultData() {
  return {
    currentUser: {
      name: '我',
      avatarFileId: null
    },
    settings: {
      bgInterval: 10
    },
    posts: []
  };
}

function createSampleData() {
  const now = Date.now();
  return {
    currentUser: {
      name: '我',
      avatarFileId: null
    },
    settings: {
      bgInterval: 10
    },
    posts: [
      {
        id: `${now - 100000}-1`,
        author: '旅行者小林',
        avatarFileId: null,
        content: '周末去了一趟#西湖，湖光山色真的太美了，推荐大家也去看看。',
        mood: '😊',
        tags: ['西湖'],
        createdAt: new Date(now - 100000).toISOString(),
        media: [],
        likes: 12,
        likedByMe: false,
        comments: [
          { id: `${now - 80000}-c1`, author: '路人甲', content: '确实很美！', createdAt: new Date(now - 80000).toISOString() }
        ],
        reposts: 2,
        isPinned: true,
        isRetracted: false,
        isHidden: false
      },
      {
        id: `${now - 300000}-2`,
        author: '我',
        avatarFileId: null,
        content: '今天学习了新的前端知识，感觉收获满满。#学习 #前端',
        mood: '🤔',
        tags: ['学习', '前端'],
        createdAt: new Date(now - 300000).toISOString(),
        media: [],
        likes: 5,
        likedByMe: true,
        comments: [],
        reposts: 0,
        isPinned: false,
        isRetracted: false,
        isHidden: false
      },
      {
        id: `${now - 600000}-3`,
        author: '摄影师阿明',
        avatarFileId: null,
        content: '分享一下昨天在#森林 拍的照片，光线刚刚好。',
        mood: '❤️',
        tags: ['森林'],
        createdAt: new Date(now - 600000).toISOString(),
        media: [],
        likes: 28,
        likedByMe: false,
        comments: [],
        reposts: 4,
        isPinned: false,
        isRetracted: false,
        isHidden: false
      }
    ]
  };
}

function getUsedFileIds(data) {
  const ids = new Set();
  if (data.currentUser.avatarFileId) ids.add(data.currentUser.avatarFileId);
  data.posts.forEach(post => {
    if (post.media) {
      post.media.forEach(m => {
        ids.add(m.fileId);
        if (m.coverId) ids.add(m.coverId);
      });
    }
  });
  return Array.from(ids);
}

function extractTags(content) {
  const tags = [];
  const hashTags = content.match(/#([^#\s]{1,12})/g);
  if (hashTags) {
    hashTags.forEach(tag => {
      const clean = tag.replace('#', '').trim();
      if (clean && !tags.includes(clean)) tags.push(clean);
    });
  }

  const locationMatch = content.match(/在([\u4e00-\u9fa5]{2,8})(?=[，。、；！？\s]|$)/);
  if (locationMatch && !tags.includes(locationMatch[1])) tags.push(locationMatch[1]);

  const dateMatch = content.match(/(今天|明天|昨天|本周|本月|今年|下周|下个月)/);
  if (dateMatch && !tags.includes(dateMatch[1])) tags.push(dateMatch[1]);

  return tags.slice(0, 6);
}
