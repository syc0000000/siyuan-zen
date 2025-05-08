/**
 * ZenType - 思源笔记专注写作插件
 * 提供专注模式、高亮当前编辑块和自定义光标效果
 */
import { Plugin } from "siyuan";
import "@/index.scss";

// 常量配置
const INIT_DELAY = 1000;
const CURSOR_UPDATE_DELAY = 200;
const FOCUS_APPLY_DELAY = 50; // 应用焦点样式的延迟时间

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

  // 生命周期方法
  async onload() {
    console.log("ZenType loaded");
    this.initEventListeners();
    setTimeout(this.initDOMElements.bind(this), INIT_DELAY);
  }

  onunload() {
    console.log("ZenType unloaded");
    this.cleanupResources();
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
      this.scrollToBlock(currentBlock);
      this.updateCustomCursor();
      
      // 更新最后焦点块引用
      this.lastFocusedBlock = currentBlock;
    }, FOCUS_APPLY_DELAY);
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
    }, 200);
  }

  private updateCustomCursor() {
    const update = () => {
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
    this.resetCursorAnimation();
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
      }, CURSOR_UPDATE_DELAY);
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

    // 清理样式
    this.clearFocusStyles();
    
    // 清理定时器
    if (this.updateTimer) clearTimeout(this.updateTimer);
    if (this.highlightLineTimer) clearTimeout(this.highlightLineTimer);
    if (this.focusApplyTimer) clearTimeout(this.focusApplyTimer);
  }
}