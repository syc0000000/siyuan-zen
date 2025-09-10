/**
 * ZenType - 思源笔记专注写作插件
 * 提供专注模式、高亮当前编辑块和自定义光标效果
 */
import { Plugin } from "siyuan";
import "@/index.scss";
import { ZenTypeConfig, DEFAULT_CONFIG, validateConfig } from "./types/config";
import { SettingUtils } from "./libs/setting-utils";

// 常量配置
const INIT_DELAY = 1000;

export default class ZenType extends Plugin {
  // 选择器和类名常量
  private readonly SELECTORS = {
    FOCUS_CLASS: "focus-block",
    BLUR_CLASS: "blur-block",
    EDITOR_ROOT: ".protyle-wysiwyg",
    HIGHLIGHT_LINE: "highlight-line",
    CUSTOM_CURSOR: "custom-cursor"
  };

  // DOM元素引用
  private highlightLine: HTMLElement;
  private customCursor: HTMLElement;
  private updateTimer: number;
  private highlightLineTimer: number;
  private focusApplyTimer: number; // 新增：焦点应用定时器
  private isAnimating = false;
  private lastFocusedBlock: HTMLElement | null = null; // 新增：记录上一个焦点块

  // 配置相关
  private config: ZenTypeConfig = DEFAULT_CONFIG;
  private dynamicStyles: HTMLStyleElement | null = null;
  private settingUtils: SettingUtils;

  // 生命周期方法
  async onload() {
    console.log("ZenType loaded");
    // 初始化设置系统
    this.initSettings();
    this.settingUtils.load();
    // 加载配置并应用样式
    await this.loadConfig();
    this.initEventListeners();
    setTimeout(this.initDOMElements.bind(this), INIT_DELAY);
  }

  onLayoutReady() {
    // 确保设置正确加载
    this.loadData("config");
    this.settingUtils.load();
    // 应用从设置中加载的配置
    this.applyDynamicStyles();
  }

  onunload() {
    console.log("ZenType unloaded");
    this.cleanupResources();
  }

  // 配置管理方法
  private async loadConfig() {
    try {
      const savedConfig = await this.loadData('config.json');
      if (savedConfig) {
        this.config = validateConfig(savedConfig);
      }
    } catch (error) {
      console.warn('加载配置失败，使用默认配置:', error);
      this.config = DEFAULT_CONFIG;
    }
    this.applyDynamicStyles();
  }

  private initSettings() {
    const STORAGE_NAME = "config";
    this.data[STORAGE_NAME] = this.config;

    this.settingUtils = new SettingUtils({
      plugin: this,
      name: STORAGE_NAME,
      callback: (data) => {
        // 更新配置并应用样式
        this.config = validateConfig(data);
        this.applyDynamicStyles();
      },
      width: "600px",
      height: "500px"
    });

    this.settingUtils.addItem({
      key: "enableFocusMode",
      value: this.config.enableFocusMode,
      type: "checkbox",
      title: "启用专注模式",
      description: "开启后，当前编辑块周围的其他块会逐渐模糊"
    });
    this.settingUtils.addItem({
      key: "enableTypewriterMode",
      value: this.config.enableTypewriterMode,
      type: "checkbox",
      title: "启用打字机模式",
      description: "开启后，当前编辑块会自动滚动到屏幕中心"
    });
    this.settingUtils.addItem({
      key: "enableCustomCursor",
      value: this.config.enableCustomCursor,
      type: "checkbox",
      title: "启用自定义光标",
      description: "开启后，使用自定义光标替代系统默认光标"
    });
    this.settingUtils.addItem({
      key: "enableHighlightLine",
      value: this.config.enableHighlightLine,
      type: "checkbox",
      title: "启用高亮行",
      description: "开启后，在当前行后面显示高亮背景条"
    });
    this.settingUtils.addItem({
      key: "cursorColorLight",
      value: this.config.cursorColorLight,
      type: "textinput",
      title: "光标颜色 (浅色主题)",
      description: "设置浅色主题下的光标颜色，支持 hex 颜色值",
      placeholder: "#5d8cd7"
    });
    this.settingUtils.addItem({
      key: "cursorColorDark",
      value: this.config.cursorColorDark,
      type: "textinput",
      title: "光标颜色 (深色主题)",
      description: "设置深色主题下的光标颜色，支持 hex 颜色值",
      placeholder: "#8ab4f8"
    });
    this.settingUtils.addItem({
      key: "highlightColorLight",
      value: this.config.highlightColorLight,
      type: "textinput",
      title: "高亮行颜色 (浅色主题)",
      description: "设置浅色主题下的高亮行背景颜色",
      placeholder: "#f2ecde99"
    });
    this.settingUtils.addItem({
      key: "highlightColorDark",
      value: this.config.highlightColorDark,
      type: "textinput",
      title: "高亮行颜色 (深色主题)",
      description: "设置深色主题下的高亮行背景颜色",
      placeholder: "#36343373"
    });
    this.settingUtils.addItem({
      key: "cursorWidth",
      value: this.config.cursorWidth,
      type: "slider",
      title: "光标宽度",
      description: "设置自定义光标的宽度（像素）",
      slider: {
        min: 1,
        max: 10,
        step: 1
      }
    });
    this.settingUtils.addItem({
      key: "blurOpacity",
      value: this.config.blurOpacity,
      type: "slider",
      title: "模糊块透明度",
      description: "设置非焦点块的透明度（0.1-0.8之间）",
      slider: {
        min: 0.1,
        max: 0.8,
        step: 0.1
      }
    });
    this.settingUtils.addItem({
      key: "cursorUpdateDelay",
      value: this.config.cursorUpdateDelay,
      type: "slider",
      title: "光标更新延迟",
      description: "设置光标位置更新的延迟时间（毫秒），较高的值可以提升性能",
      slider: {
        min: 50,
        max: 500,
        step: 50
      }
    });
    this.settingUtils.addItem({
      key: "focusApplyDelay",
      value: this.config.focusApplyDelay,
      type: "slider",
      title: "焦点应用延迟",
      description: "设置焦点样式应用的延迟时间（毫秒），避免快速切换时的闪烁",
      slider: {
        min: 0,
        max: 200,
        step: 10
      }
    });
    this.settingUtils.addItem({
      key: "highlightLineDelay",
      value: this.config.highlightLineDelay,
      type: "slider",
      title: "高亮行更新延迟",
      description: "设置高亮行位置更新的延迟时间（毫秒）",
      slider: {
        min: 50,
        max: 500,
        step: 50
      }
    });
  }


  private applyDynamicStyles() {
    // 移除旧的动态样式
    if (this.dynamicStyles) {
      this.dynamicStyles.remove();
    }
    // 如果 settingUtils 还未初始化，使用默认配置
    if (!this.settingUtils) {
      return;
    }
    // 创建新的动态样式
    this.dynamicStyles = document.createElement('style');
    this.dynamicStyles.textContent = `
      /* ZenType 动态样式 */
      .blur-block {
        opacity: ${this.settingUtils.get("blurOpacity")} !important;
      }
      
      #highlight-line {
        background: ${this.settingUtils.get("highlightColorLight")} !important;
      }
      
      [data-theme-mode="dark"] #highlight-line {
        background: ${this.settingUtils.get("highlightColorDark")} !important;
      }
      
      #custom-cursor {
        width: ${this.settingUtils.get("cursorWidth")}px !important;
        background: ${this.settingUtils.get("cursorColorLight")} !important;
      }
      
      [data-theme-mode="dark"] #custom-cursor {
        background: ${this.settingUtils.get("cursorColorDark")} !important;
      }
      
      ${!this.settingUtils.get("enableCustomCursor") ? '.protyle-wysiwyg [contenteditable="true"] { caret-color: auto !important; }' : ''}
      ${!this.settingUtils.get("enableCustomCursor") ? '#custom-cursor { display: none !important; }' : ''}
      ${!this.settingUtils.get("enableHighlightLine") ? '#highlight-line { display: none !important; }' : ''}
    `;
    document.head.appendChild(this.dynamicStyles);
  }

  // 初始化方法
  private initEventListeners() {
    const eventHandlers = {
      input: this.handleInput.bind(this),
      keyup: this.handleKeyUp.bind(this),
      keydown: this.handleKeyDown.bind(this),
      click: this.handleClick.bind(this),
      wheel: this.handleWheel.bind(this),
      selectionchange: this.handleSelectionChange.bind(this)
    };

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      document.addEventListener(event, handler);
    });
  }

  private initDOMElements() {
    // 创建高亮行元素
    this.highlightLine = document.createElement("div");
    this.highlightLine.id = this.SELECTORS.HIGHLIGHT_LINE;

    // 创建自定义光标元素
    this.customCursor = document.createElement("div");
    this.customCursor.id = this.SELECTORS.CUSTOM_CURSOR;

    // 添加到文档中
    document.body.append(this.highlightLine, this.customCursor);
    this.highlightLine.style.display = "none";
  }

  // 核心功能方法
  private getCursorRect(): DOMRect | null {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return null;

    try {
      const range = selection.getRangeAt(0).cloneRange();
      range.collapse(true);
      const cursorRects = range.getClientRects();
      return cursorRects.length > 0 ? cursorRects[0] : this.getEmptyLineRect(range);
    } catch (error) {
      console.debug("获取光标位置失败", error);
      return null;
    }
  }

  private getEmptyLineRect(range: Range): DOMRect {
    const tempSpan = document.createElement("span");
    tempSpan.textContent = "\u200b"; // 零宽空格
    range.insertNode(tempSpan);
    const rect = tempSpan.getBoundingClientRect();
    tempSpan.remove();
    return rect;
  }

  private clearFocusStyles() {
    // 保存当前焦点块的引用，以便在需要时恢复
    const focusedBlock = document.querySelector(`.${this.SELECTORS.FOCUS_CLASS}`);
    if (focusedBlock) {
      this.lastFocusedBlock = focusedBlock as HTMLElement;
    }

    document.querySelectorAll(
      `.${this.SELECTORS.FOCUS_CLASS}, .${this.SELECTORS.BLUR_CLASS}`
    ).forEach(el => {
      el.classList.remove(this.SELECTORS.FOCUS_CLASS, this.SELECTORS.BLUR_CLASS);

      // 确保透明度重置
      (el as HTMLElement).style.opacity = "";
    });
  }

  private focusCurrentBlock() {
    // 如果专注模式未启用，直接返回
    if (!this.settingUtils.get("enableFocusMode")) {
      return;
    }
    // 清除之前的定时器
    if (this.focusApplyTimer) {
      clearTimeout(this.focusApplyTimer);
    }

    // 延迟应用焦点样式，避免在块切换时出现闪烁
    this.focusApplyTimer = window.setTimeout(() => {
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;

      const range = selection.getRangeAt(0);
      const currentBlock = this.findCurrentBlock(range.startContainer);
      if (!currentBlock) return;

      // 如果当前块与上一个焦点块相同，且已经有焦点类，则不重新应用
      if (this.lastFocusedBlock === currentBlock &&
        currentBlock.classList.contains(this.SELECTORS.FOCUS_CLASS)) {
        return;
      }
      this.applyFocusStyles(currentBlock);
      // 打字机模式：滚动到屏幕中心
      if (this.settingUtils.get("enableTypewriterMode")) {
        this.scrollToBlock(currentBlock);
      }
      this.updateCustomCursor();
      // 更新最后焦点块引用
      this.lastFocusedBlock = currentBlock;
    }, this.settingUtils.get("focusApplyDelay"));
  }

  private findCurrentBlock(startNode: Node): HTMLElement | null {
    let element: Node = startNode;
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement;
    }
    return (element as HTMLElement)?.closest('[data-node-id]');
  }

  private applyFocusStyles(currentBlock: HTMLElement) {
    // 先清除所有样式
    this.clearFocusStyles();

    // 应用焦点样式
    currentBlock.classList.add(this.SELECTORS.FOCUS_CLASS);

    // 获取编辑器根元素
    const editorRoot = document.querySelector(this.SELECTORS.EDITOR_ROOT);
    if (!editorRoot) return;

    // 应用模糊样式到其他块
    Array.from(editorRoot.children || []).forEach(child => {
      if (child !== currentBlock && !child.contains(currentBlock) &&
        !currentBlock.contains(child)) {
        child.classList.add(this.SELECTORS.BLUR_CLASS);
      }
    });
  }

  private scrollToBlock(block: HTMLElement) {
    block.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest"
    });
  }

  // 视觉元素更新
  private updateHighlightLine() {
    // 如果高亮行功能未启用，隐藏高亮行
    if (!this.settingUtils.get("enableHighlightLine")) {
      this.highlightLine.style.display = "none";
      return;
    }
    const rect = this.getCursorRect();
    if (!rect) return;

    if (this.highlightLineTimer) clearTimeout(this.highlightLineTimer);

    this.highlightLineTimer = window.setTimeout(() => {
      Object.assign(this.highlightLine.style, {
        display: "block",
        width: "100%",
        height: `${rect.height + 7}px`,
        top: `${rect.top + window.scrollY - 3}px`
      });
    }, this.settingUtils.get("highlightLineDelay"));
  }

  private updateCustomCursor() {
    const update = () => {
      // 如果自定义光标功能未启用，隐藏光标
      if (!this.settingUtils.get("enableCustomCursor")) {
        this.customCursor.style.display = "none";
        return;
      }
      const rect = this.getCursorRect();
      if (!rect) {
        this.customCursor.style.display = "none";
        return;
      }

      Object.assign(this.customCursor.style, {
        display: "block",
        height: `${rect.height * 1.4}px`,
        transform: `translate(
          ${rect.left + window.scrollX - 1}px, 
          ${rect.top + window.scrollY - rect.height * 0.3}px
        )`
      });

      this.isAnimating = true;
      setTimeout(() => {
        this.isAnimating = false;
      }, 100);

      this.updateHighlightLine();
    };

    if (this.updateTimer) clearTimeout(this.updateTimer);
    this.updateTimer = window.setTimeout(update, 300);

    if (!this.isAnimating) {
      update();
    }
    if (this.settingUtils.get("enableCustomCursor")) {
      this.resetCursorAnimation();
    }
  }

  private resetCursorAnimation() {
    this.customCursor.style.animation = "none";
    void this.customCursor.offsetWidth; // 触发重绘
    this.customCursor.style.animation = "";
  }

  // 事件处理器
  private handleInput() {
    this.focusCurrentBlock();
    this.updateCustomCursor();
  }

  private handleClick() {
    this.focusCurrentBlock();
    this.updateCustomCursor();
  }

  private handleWheel() {
    this.clearFocusStyles();
    this.updateCustomCursor();
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (["ArrowUp", "ArrowDown", "Esc"].includes(event.key)) {
      this.clearFocusStyles();
    }

    if (["Backspace", "Enter"].includes(event.key)) {
      // 对于可能导致块结构变化的键，使用延迟处理
      setTimeout(() => {
        this.focusCurrentBlock();
        this.updateCustomCursor();
      }, this.settingUtils.get("cursorUpdateDelay"));
    } else {
      this.updateCustomCursor();
    }
  }

  private handleKeyUp() {
    this.updateCustomCursor();
  }

  private handleSelectionChange() {
    this.focusCurrentBlock();
    this.updateCustomCursor();
  }

  // 资源清理
  private cleanupResources() {
    // 移除事件监听器
    const events = ["input", "keyup", "keydown", "click", "wheel", "selectionchange"];
    events.forEach(event => {
      document.removeEventListener(event, (this as any)[`handle${event.charAt(0).toUpperCase() + event.slice(1)}`]);
    });

    // 移除动态元素
    this.highlightLine?.remove();
    this.customCursor?.remove();
    // 移除动态样式
    if (this.dynamicStyles) {
      this.dynamicStyles.remove();
    }
    // 清理样式
    this.clearFocusStyles();

    // 清理定时器
    if (this.updateTimer) clearTimeout(this.updateTimer);
    if (this.highlightLineTimer) clearTimeout(this.highlightLineTimer);
    if (this.focusApplyTimer) clearTimeout(this.focusApplyTimer);
  }
}