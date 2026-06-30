# Chrome插件自动填写表单设计文档

## [S1] 问题

用户需要一款Chrome插件，能够自动检测网页表单并使用AI生成填充建议，提高表单填写效率。

## [S2] 解决方案概述

开发一款Chrome插件，使用OpenRouter的Google Gemini Flash免费模型，自动检测表单字段，生成填充建议，用户确认后自动填充表单。

## [S3] 架构设计

### 组件

1. **Content Script**
   - 检测页面上的表单
   - 提取字段信息（名称、类型、标签等）
   - 填充表单字段

2. **Background Script**
   - 处理OpenRouter API调用
   - 接收表单数据并返回填充建议
   - 管理API密钥

3. **Popup窗口**
   - 显示表单分析结果
   - 让用户确认填充内容
   - 管理用户配置文件

### 数据流

Content Script → Background Script → OpenRouter API → Background Script → Content Script → 填充表单

## [S4] 功能设计

### 表单检测

- 自动检测页面上的所有表单
- 提取字段信息：名称、类型、标签、占位符等
- 支持文本输入、下拉菜单、复选框等常见字段类型

### AI填充

- 使用OpenRouter API调用Google Gemini Flash模型
- 发送表单字段信息和用户数据
- AI返回每个字段的填充建议
- 支持中文和英文表单

### 用户界面

- Popup窗口显示表单字段列表
- 每个字段显示：字段名称、类型、建议填充内容
- 用户可以编辑建议内容
- 提供“直接填充”和“预览模式”两种选项

### 数据存储

- 使用Chrome存储API保存用户数据
- 支持多个配置文件
- 用户可以在popup窗口中管理配置文件

## [S5] 安全设计

- API密钥存储在background script中，不暴露给content script
- 用户数据仅存储在本地Chrome存储中
- 仅发送表单字段信息到OpenRouter API用于AI填充（不发送其他用户数据）
- 支持用户删除所有数据

## [S6] 错误处理

- API调用失败时显示错误消息
- 支持重试机制
- 网络连接问题时使用本地规则-based填充
- 表单检测失败时显示“未检测到表单”消息

## [S7] 测试策略

- 单元测试：测试表单检测、数据存储、API调用
- 集成测试：测试整个填充流程
- 手动测试：在不同网站上测试表单填充
- 兼容性测试：测试不同Chrome版本

## [S8] 实现计划

### 阶段1：基础框架

- 创建Chrome插件基础结构
- 实现content script表单检测
- 实现popup窗口基础界面

### 阶段2：AI集成

- 集成OpenRouter API
- 实现AI填充建议生成
- 实现数据存储

### 阶段3：用户界面

- 完善popup窗口界面
- 实现直接填充和预览模式
- 实现配置文件管理

### 阶段4：测试和优化

- 编写单元测试
- 进行集成测试
- 优化性能和用户体验

## [S9] Chrome插件配置

### 权限

- `activeTab`：访问当前标签页
- `storage`：存储用户数据
- `scripting`：注入content script

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "AI Form Auto-Fill",
  "version": "1.0.0",
  "description": "使用AI自动填写网页表单",
  "permissions": ["activeTab", "storage", "scripting"],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  }
}
```