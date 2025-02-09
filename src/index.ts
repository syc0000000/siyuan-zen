/* index.ts */
import { Plugin } from "siyuan";
import "@/index.scss";

// ========================
// 常量配置
// ========================
const INIT_DELAY = 1500;
const CURSOR_UPDATE_DELAY = 200;

export default class ZenType extends Plugin {
  // ========================
  // 类常量
  // ========================
  private readonly SELECTORS = {
    FOCUS_CLASS: "focus-block",
    BLUR_CLASS: "blur-block",
    EDITOR_ROOT: ".protyle-wysiwyg",
    HIGHLIGHT_LINE: "#highlight-line",
    CUSTOM_CURSOR: "#custom-cursor"
  };

  // ========================
  // DOM元素引用
  // ========================
  private highlightLine: HTMLElement;
  private customCursor: HTMLElement;

  // ========================
  // 生命周期方法
  // ========================
  async onload() {
    console.log("ZenType loaded");
    this.initEventListeners();
    setTimeout(this.initDOMElements.bind(this), INIT_DELAY);
  }

  onunload() {
    console.log("ZenType unloaded");
    this.cleanupResources();
  }

  // ========================
  // 初始化方法
  // ========================
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
    this.highlightLine = this.createDynamicElement(
      "div",
      this.SELECTORS.HIGHLIGHT_LINE
    );
    this.customCursor = this.createDynamicElement(
      "div",
      this.SELECTORS.CUSTOM_CURSOR
    );

    document.body.append(this.highlightLine, this.customCursor);
    this.highlightLine.style.display = "none";
  }

  // ========================
  // 核心功能方法
  // ========================
  private getCursorRect(): DOMRect | null {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return null;

    try {
      const range = selection.getRangeAt(0).cloneRange();
      range.collapse(true);

      // 尝试获取现有光标位置
      const cursorRects = range.getClientRects();
      if (cursorRects.length > 0) return cursorRects[0];

      // 处理空行情况
      return this.getEmptyLineRect(range);
    } catch (error) {
      console.debug("Cursor position error:", error);
      return null;
    }
  }

  private getEmptyLineRect(range: Range): DOMRect {
    const tempSpan = document.createElement("span");
    tempSpan.textContent = "\u200b";
    range.insertNode(tempSpan);
    const rect = tempSpan.getBoundingClientRect();
    tempSpan.remove();
    return rect;
  }

  private clearFocusStyles() {
    document.querySelectorAll(
      `.${this.SELECTORS.FOCUS_CLASS}, .${this.SELECTORS.BLUR_CLASS}`
    ).forEach(el => {
      el.classList.remove(this.SELECTORS.FOCUS_CLASS, this.SELECTORS.BLUR_CLASS);
    });
  }

  private focusCurrentBlock() {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    const currentBlock = this.findCurrentBlock(range.startContainer);

    if (!currentBlock) return;

    this.applyFocusStyles(currentBlock);
    this.scrollToBlock(currentBlock);
    this.updateCustomCursor();
  }

  private findCurrentBlock(startNode: Node): HTMLElement | null {
    let element: Node = startNode;
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement!;
    }

    return (element as HTMLElement).closest<HTMLElement>(
      '[data-node-id]'
    );
  }

  private applyFocusStyles(currentBlock: HTMLElement) {
    this.clearFocusStyles();
    currentBlock.classList.add(this.SELECTORS.FOCUS_CLASS);

    const editorRoot = document.querySelector(this.SELECTORS.EDITOR_ROOT);
    Array.from(editorRoot?.children || []).forEach(child => {
      if (child !== currentBlock && !child.contains(currentBlock)) {
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

  // ========================
  // 视觉元素更新
  // ========================
  private updateHighlightLine() {
    const rect = this.getCursorRect();
    if (!rect) return;

    Object.assign(this.highlightLine.style, {
      width: "100%",
      height: `${rect.height + 7}px`,
      top: `${rect.top + window.scrollY - 3}px`
    });
  }

  // private updateCustomCursor() {
  //   const rect = this.getCursorRect();
  //   if (!rect) {
  //     this.customCursor.style.display = "none";
  //     return;
  //   }

  //   Object.assign(this.customCursor.style, {
  //     display: "block",
  //     height: `${rect.height * 1.4}px`,
  //     transform: `translate(
  //       ${rect.left + window.scrollX - 1}px, 
  //       ${rect.top + window.scrollY - rect.height * 0.3}px
  //     )`
  //   });

  //   this.resetCursorAnimation();
  // }
  // private resetCursorAnimation() {
  //   this.customCursor.style.animation = "none";
  //   void this.customCursor.offsetWidth; // 触发重绘
  //   this.customCursor.style.animation = "";
  // }
  
  // 光标追加自动更新
  // 在类中添加这两个成员变量
  private updateTimer: number;
  private isAnimating = false;

  // 修改后的 updateCustomCursor 方法
  private updateCustomCursor() {
    const update = () => {
      const rect = this.getCursorRect();
      if (!rect) {
        this.customCursor.style.display = "none";
        return;
      }

      // 使用强制布局更新保证位置准确
      this.customCursor.getBoundingClientRect();
      
      Object.assign(this.customCursor.style, {
        display: "block",
        height: `${rect.height * 1.4}px`,
        transform: `translate(
          ${rect.left + window.scrollX - 1}px, 
          ${rect.top + window.scrollY - rect.height * 0.3}px
        )`
      });

      // 添加动画状态追踪
      this.isAnimating = true;
      setTimeout(() => {
        this.isAnimating = false;
      }, 100); // 与CSS动画时间匹配
    };

    // 方案1：每300ms强制更新一次
    if (this.updateTimer) clearTimeout(this.updateTimer);
    this.updateTimer = window.setTimeout(update, 300);

    // 方案2：如果当前没有动画在进行，立即更新
    if (!this.isAnimating) {
      update();
    }
    this.resetCursorAnimation();
  }

  private resetCursorAnimation() {
    this.customCursor.style.animation = "none";
    void this.customCursor.offsetWidth; // 触发重绘
    this.customCursor.style.animation = "";
  }
  
  // ========================
  // 事件处理器
  // ========================
  private handleInput() {
    this.focusCurrentBlock();
    this.updateHighlightLine();
    this.updateCustomCursor();
    this.highlightLine.style.display = "block";
  }

  private handleClick() {
    this.updateCustomCursor();
    this.highlightLine.style.display = "none";
  }

  private handleWheel() {
    this.clearFocusStyles();
    this.updateCustomCursor();
    this.highlightLine.style.display = "none";
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (["ArrowUp", "ArrowDown", "Esc"].includes(event.key)) {
      this.clearFocusStyles();
      this.highlightLine.style.display = "none";
    }

    if (["Backspace", "Enter"].includes(event.key)) {
      setTimeout(() => this.focusCurrentBlock(), CURSOR_UPDATE_DELAY);
    }

    this.updateCustomCursor();
  }

  private handleKeyUp() {
    this.updateCustomCursor();
  }

  private handleSelectionChange() {
    this.updateCustomCursor();
  }

  // ========================
  // 工具方法
  // ========================
  private createDynamicElement(tag: string, id: string): HTMLElement {
    const element = document.createElement(tag);
    element.id = id.replace("#", "");
    return element;
  }

  // ========================
  // 资源清理
  // ========================
  private cleanupResources() {
    // 移除事件监听器
    const events = ["input", "keyup", "keydown", "click", "wheel", "selectionchange"];
    events.forEach(event => {
      document.removeEventListener(event, (this as any)[`handle${event.charAt(0).toUpperCase() + event.slice(1)}`]);
    });

    // 移除动态元素
    [this.highlightLine, this.customCursor].forEach(el => el?.remove());

    // 清理样式标签
    Array.from(document.head.querySelectorAll("style"))
      .filter(style => /(#custom-cursor|\.focus-block)/.test(style.textContent || ""))
      .forEach(style => style.remove());

    this.clearFocusStyles();
  }
}