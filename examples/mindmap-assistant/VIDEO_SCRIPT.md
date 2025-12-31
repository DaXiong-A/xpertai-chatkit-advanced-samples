# Mindmap Assistant 演示视频脚本

> **视频时长**: 约4分钟（加速后）
> **语言**: UI 使用英文，语音使用中文
> **核心信息**: ChatKit 能够快速构建 AI 驱动的产品

---

## 第一部分：开场 + 产品概述（30秒）

### 场景 1.1：标题画面
**画面**：显示应用标题或 Logo
**配音**：
> "今天给大家展示一个案例：如何通过 ChatKit 快速构建一个 AI 驱动的思维导图编辑器。"

### 场景 1.2：界面概览
**画面**：显示完整界面 - 左侧思维导图画布，右侧聊天面板
**配音**：
> "这是我们的 Mindmap Assistant。左边是思维导图画布，右边是集成了 ChatKit 的 AI 助手。通过这个集成，AI 不仅可以对话，还可以直接读取和操作思维导图。"

---

## 第二部分：演示场景 A - 通过聊天控制思维导图（60秒）

### 场景 2.1：选择节点
**动作**：点击 "Product" 节点
**画面**：节点显示白色边框 + 金色发光选中效果
**配音**：
> "首先演示第一个场景：通过对话来编辑思维导图。我先选中 Product 这个节点。"

### 场景 2.2：向 AI 发送消息
**动作**：在聊天框中输入："Please add 3 sub-nodes about user growth strategies"
**画面**：显示在输入框中打字
**配音**：
> "然后在右侧对话框输入：帮我添加 3 个关于用户增长策略的子节点。"

### 场景 2.3：AI 处理
**动作**：等待 AI 响应
**画面**：显示 AI 思考/流式输出响应
**配音**：
> "AI 收到消息后，会先调用 get_selected_nodes 这个工具，获取我当前选中的是哪个节点。"

### 场景 2.4：思维导图更新
**动作**：观察思维导图自动更新
**画面**：新节点在 "Product" 下以动画形式出现
**配音**：
> "然后 AI 生成新的节点内容，通过 update_mindmap 这个 effect 直接更新到画布上。整个过程是实时同步的。"

### 场景 2.5：查看结果
**动作**：简要悬停在新节点上
**画面**：显示 3 个新节点
**配音**：
> "可以看到，AI 已经帮我添加了 3 个相关的子节点。这就是 Chat 控制 Mindmap 的场景。"

---

## 第三部分：演示场景 B - 点击节点触发 AI 分析（60秒）

### 场景 3.1：介绍
**画面**：重置视图或显示干净状态
**配音**：
> "接下来演示第二个场景：选中节点后，让 AI 进行分析讲解。"

### 场景 3.2：选中节点并点击分析
**动作**：点击 "Seed Round" 节点，节点下方出现 "Analyze" 按钮
**画面**：节点被选中（白色边框 + 金色发光），下方出现紫色 Analyze 按钮
**配音**：
> "当我选中 Seed Round 这个节点时，节点下方会出现一个 Analyze 按钮。"

### 场景 3.3：点击 Analyze 按钮
**动作**：点击 Analyze 按钮
**画面**：AI 开始流式输出，先显示 highlight_nodes 工具调用，然后输出分析内容
**配音**：
> "点击 Analyze 按钮，AI 会先高亮当前节点，然后给出详细的分析和建议。比如这里它会解释什么是种子轮融资，需要考虑哪些因素。"

### 场景 3.4：持续交互
**动作**：（可选）在输入框继续追问
**画面**：显示继续对话
**配音**：
> "用户还可以继续追问，形成自然的对话流程。这样思维导图就变成了一个可以交互探索的知识地图。"

---

## 第四部分：快速配置演示（60秒）

### 场景 4.1：XpertAI 平台 - Agent 配置
**动作**：切换到 XpertAI 平台浏览器标签页
**画面**：显示 Agent 配置页面
**配音**：
> "这个功能是怎么实现的呢？核心配置在 XpertAI 平台上。这里是 Agent 的配置，包含了 AI 的角色设定和工具使用说明。"

### 场景 4.2：ClientToolMiddleware
**动作**：滚动显示中间件配置
**画面**：高亮 "get_selected_nodes" 工具
**配音**：
> "这是 ClientToolMiddleware，定义了 get_selected_nodes 这个工具。AI 调用它时，前端会返回当前选中的节点信息。"

### 场景 4.3：ClientEffectMiddleware
**动作**：显示 effect 中间件
**画面**：高亮 "update_mindmap"、"focus_node"
**配音**：
> "这是 ClientEffectMiddleware，定义了 update_mindmap 和 focus_node。AI 可以通过这些 effect 直接操作前端 UI。"

### 场景 4.4：代码集成（简略）
**动作**：简要展示 ChatKitPanel.tsx
**画面**：高亮 onClientTool 和 onEffect 回调
**配音**：
> "前端集成也很简单，只需要在 ChatKit 的回调里处理这些工具调用和 effect 就可以了。"

---

## 第五部分：结尾（30秒）

### 场景 5.1：总结
**画面**：再次显示应用界面
**配音**：
> "总结一下，通过 ChatKit 的 Client Tool 和 Client Effect 机制，我们可以让 AI 真正地与产品 UI 进行双向交互。AI 不再只是一个聊天窗口，而是可以读取上下文、操作界面的智能助手。"

### 场景 5.2：行动号召
**画面**：显示 XpertAI / ChatKit logo 或文档链接
**配音**：
> "这就是 ChatKit 赋能产品的一个典型案例。感谢观看！"

---

## 技术说明

### 场景 B 实现方式

在 `MindmapNode.tsx` 中实现了 Analyze 按钮：
- 选中非 root 节点时，节点下方显示 Analyze 按钮
- 点击按钮调用 `chatkit.sendUserMessage()` 发送分析请求
- AI 会调用 `highlight_nodes` 高亮节点，然后输出分析内容

### 演示准备清单

- [ ] 测试两个场景都能流畅运行
- [ ] 准备 XpertAI 平台标签页，打开 agent 配置
- [ ] 准备 VSCode，打开 ChatKitPanel.tsx
- [ ] 录制前清除聊天历史
- [ ] 重置思维导图为默认的 "Startup Business Plan"

### 屏幕录制技巧

1. 使用 1920x1080 分辨率
2. 确保字体清晰可读
3. 尽可能使用键盘快捷键代替鼠标点击
4. 保持稳定的节奏 - 后期制作可以加速

---

## 附录：演示用示例提示词

### 场景 A - 编辑命令
- "Please add 3 sub-nodes about user growth strategies"
- "Expand the Market node with competitor analysis ideas"
- "Add 2 child nodes about team building under Funding"

### 场景 B - 分析触发（自动生成）
- "Please analyze and explain the 'Seed Round' node"
- "Please analyze and explain the 'MVP' node"

### 后续问题
- "What should I prioritize first?"
- "Can you give more details about the second point?"
- "How does this relate to the parent node?"
