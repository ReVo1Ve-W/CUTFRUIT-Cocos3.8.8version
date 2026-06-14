# CUTFRUIT

一个基于 Cocos Creator 3.8.8 开发的切水果游戏（Fruit Ninja 风格），使用 TypeScript 编写。

## 游戏玩法

- **滑动切割**：在屏幕上拖拽刀光，划过水果即可切割得分
- **避开炸弹**：切到炸弹会损失生命并清空场上水果
- **三级难度**：简单 / 普通 / 困难，水果数量、速度、炸弹密度递增
- **生命系统**：水果落地会扣分，扣到零损失一条命，3 条命用完游戏结束
- **最高分**：本地存储记录历史最佳分数

## 技术栈

- **引擎**：Cocos Creator 3.8.8
- **语言**：TypeScript
- **物理**：Builtin 2D 物理引擎（重力 + 碰撞检测）
- **构建工具**：Cocos Creator 内置构建管线

## 项目结构

```
assets/
├── Scenes/                    # 场景文件
│   ├── Menu.scene             # 主菜单
│   ├── Begin.scene            # 开始界面（故事背景 + 选关入口）
│   ├── Detail.scene           # 故事剧情（打字机效果）
│   ├── LevelSelect.scene      # 关卡选择（3 个难度）
│   ├── Game-001.scene         # 难度 1（简单）
│   ├── Game-002.scene         # 难度 2（普通）
│   ├── Game-003.scene         # 难度 3（困难）
│   ├── Setting.scene          # 设置界面
│   └── Book.scene             # 图鉴/收集
├── Scripts/                   # TypeScript 源码
│   ├── Game.ts                # 核心游戏控制器
│   ├── GameSetting.ts         # 游戏内设置面板（音量/暂停/返回）
│   ├── Fruit.ts               # 单个水果/炸弹行为
│   ├── FruitGroup.ts          # 水果波次生成与对象池
│   ├── FruitJuice.ts          # 果汁溅射特效
│   ├── JuiceGroup.ts          # 果汁对象池
│   ├── MotionTrail.ts         # 刀光拖尾特效
│   ├── AudioMgr.ts            # 全局音频管理器（单例）
│   ├── BgmMgr.ts              # BGM 开关按钮
│   ├── Menu.ts                # 主菜单控制器
│   ├── LevelSelect.ts         # 选关界面
│   ├── StoryMgr.ts            # 打字机文字效果
│   ├── Setting.ts             # 设置场景
│   ├── BookMgr.ts             # 图鉴跳转
│   ├── ReturnMenu.ts          # 返回菜单按钮
│   ├── ReturnSetting.ts       # 返回设置按钮
│   ├── Constants.ts           # 游戏参数常量
│   └── utils.ts               # 对象池工具 + 随机数
└── Res/                       # 资源文件
    ├── Prefabs/               # 预制体（水果、炸弹、果汁）
    ├── audio/                 # 音效与 BGM
    ├── picture/               # 图片资源（UI/水果/背景/Logo）
    └── font/                  # 位图字体
```

## 场景流转

```
Menu ─────→ Begin ─────→ LevelSelect ─────→ Game-001 (简单)
  │           │                                Game-002 (普通)
  │           └──→ Detail (剧情)               Game-003 (困难)
  │                                              │
  └──→ Setting                                    │
       (音量调节)           ←── 返回菜单 ←─────────┘
```

## 核心系统

### 刀光系统

- **MotionTrail**：在刀节点移动时按最小距离阈值生成拖尾 Sprite，每个片段有独立生命周期，随时间淡出
- 触摸开始时激活、移动时追加片段、松开时停用
- 使用 Kinematic 刚体 + BoxCollider2D 进行碰撞检测

### 投掷系统

基于运动学公式计算初速度，水果从屏幕底部向上抛掷：

- **vy** = `√(2 × g × 顶点高度)` — 根据目标顶点高度反算垂直速度
- **vx** = `(目标X - 起点X) / (2 × 上升时间)` — 保证水平方向在抛物线时间内到达
- **旋转**：随机角速度，正反方向均匀分布

三种投掷模式随机切换：

| 模式 | 描述 |
|------|------|
| 扇形 (fan) | 同一发射区域，落点向两侧扩散 |
| 弧形 (arc) | 发射点与落点分布在屏幕对侧 |
| 随机 (random) | 完全随机散布 |

### 对象池系统

- 水果、果汁特效均使用 `NodePool` 预分配复用
- 初始化时预创建指定数量实例，用完回收，不足时动态创建

### 音频系统

- **AudioMgr** 单例：挂载在 `addPersistRootNode` 的持久节点上，跨场景不销毁
- BGM：循环播放，支持暂停/恢复/音量调节，音量持久化到 `localStorage`
- 音效：`playOneShot` 一次性播放（按钮点击、切割、炸弹、投掷）

### 难度系统

| 参数 | 难度 1（简单） | 难度 2（普通） | 难度 3（困难） |
|------|:---:|:---:|:---:|
| 速度系数 | 1.0 | 1.4 | 1.8 |
| 每波水果数 | 2-6 | 3-7 | 4-9 |
| 炸弹上限 | 2 | 3 | 4 |
| 波次间隔 | 0.3-1.5s | 0.2-1.1s | 0.15-0.8s |

### 计分与惩罚

- 切中水果：加对应分值
- 水果落地：扣 `分值 × 2` 分，扣到负数时清零并损失一条命
- 切中炸弹：立即损失一条命 + 清空场上所有水果
- 共 3 条命，用完触发 GameOver

### 设置面板

游戏内设置面板（GameSetting）与 GameOver 面板互斥：
- 打开设置时自动隐藏 GameOver 面板
- 关闭设置时恢复 GameOver 面板状态
- 音量滑块 → AudioMgr + localStorage 持久化
- 暂停/继续：调用 `director.pause()` / `director.resume()`

## 可调参数

所有游戏参数集中在 [Constants.ts](assets/Scripts/Constants.ts)，零散落修改：

- `PHYSICS.GRAVITY_Y` — 重力加速度
- `THROW.SPEED_SCALE` — 投掷速度总缩放系数
- `THROW.APEX_RATIO_MIN/MAX` — 水果抛物线顶点高度范围
- `WAVE.*` — 波次数量/间隔
- `SCORE.PENALTY_MULTIPLIER` — 落地扣分倍率
- `SCORE.MAX_LIVES` — 最大生命数
- `DIFFICULTY[1/2/3]` — 三级难度完整参数

## 运行方式

1. 用 Cocos Creator 3.8.x 打开项目根目录
2. 在编辑器中选择场景（推荐从 `Menu.scene` 开始）
3. 点击预览按钮运行

## 构建发布

通过 Cocos Creator 菜单：**项目 → 构建发布**，选择目标平台（Web Mobile / 微信小游戏 / Android / iOS 等）即可构建。
