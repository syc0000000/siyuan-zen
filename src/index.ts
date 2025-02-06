/* index.ts */
import { Plugin } from "siyuan";
import "@/index.scss";

export default class ZenType extends Plugin {
  // 样式类常量
  private readonly FOCUS_CLASS = "focus-block";  // 焦点块样式
  private readonly BLUR_CLASS = "blur-block";    // 模糊块样式

  // DOM 元素
  private highlightLine: HTMLElement;  // 高亮指示条
  private customCursor: HTMLElement;   // 自定义光标

  //====================
  // 生命周期方法
  //====================
  onload() {
    console.log("ZenType loaded");
    this.initEventListeners();
    setTimeout(() => {
          this.initDOMElements();
    }, 1500); // 延迟 1500ms 确保 DOM 加载
  }

  onunload() {
    console.log("ZenType unloaded");
    this.cleanupResources();
  }

  //====================
  // 初始化方法
  //====================
  /**
   * 初始化事件监听器
   */
  private initEventListeners() {
    // 输入相关事件
    document.addEventListener("input", this.handleInput.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    
    // 光标/选区相关事件
    document.addEventListener("click", this.handleClick.bind(this));
    document.addEventListener("selectionchange", this.handleSelectionChange.bind(this));
    
    // 滚动事件
    document.addEventListener("wheel", this.handleWheel.bind(this));
  }

  /**
   * 初始化动态 DOM 元素
   */
  private initDOMElements() {
    // 创建高亮指示条
    this.highlightLine = document.createElement("div");
    this.highlightLine.id = "highlight-line";
    // document.querySelector(".protyle").appendChild(this.highlightLine);
    document.body.appendChild(this.highlightLine);
    // document.querySelector("#layouts").appendChild(this.highlightLine);
    this.highlightLine.style.display = "none";
    
    // 创建自定义光标
    this.customCursor = document.createElement("div");
    this.customCursor.id = "custom-cursor";
    // editorContainer.appendChild(this.customCursor);
    document.body.appendChild(this.customCursor);
    this.customCursor.style.display = "block";
  }

  //====================
  // 核心功能方法
  //====================
  /**
   * 获取当前光标位置
   * @returns {DOMRect | null} 光标位置的矩形信息
   */
  // 这个因为直接获取元素矩形信息，会导致软换行时有问题
  // private getCursorRect(): DOMRect | null {
  //   const selection = window.getSelection();
  //   if (!selection?.rangeCount) return null;
  
  //   try {
  //     const range = selection.getRangeAt(0);
  //     return (
  //       range.startContainer.nodeType === Node.TEXT_NODE
  //         ? range  // 如果是文本节点，直接使用 range
  //         : range.startContainer as Element  // 否则使用容器元素
  //     ).getBoundingClientRect();
  //   } catch (error) {
  //     console.debug("获取光标位置失败", error);
  //     return null;
  //   }
  // }
  private getCursorRect(): DOMRect | null {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return null;
  
    try {
      const range = selection.getRangeAt(0).cloneRange();
      range.collapse(true); // 确保 range 是折叠状态
  
      // 优先获取光标实际渲染位置
      const cursorRects = range.getClientRects();
      if (cursorRects.length > 0) {
        return cursorRects[0];
      }
  
      // 回退方案：处理空行等特殊情况
      const tempSpan = document.createElement("span");
      tempSpan.textContent = "\u200b"; // 零宽空格
      range.insertNode(tempSpan);
      const rect = tempSpan.getBoundingClientRect();
      tempSpan.remove();
      
      return rect;
    } catch (error) {
      console.debug("获取光标位置失败", error);
      return null;
    }
  }

  /**
   * 清理所有焦点/模糊样式
   */
  private clearFocusStyles() {
    document.querySelectorAll(`.${this.FOCUS_CLASS}, .${this.BLUR_CLASS}`)
      .forEach(el => el.classList.remove(this.FOCUS_CLASS, this.BLUR_CLASS));
  }

  /**
   * 聚焦当前文本块
   */
  // private focusCurrentBlock() {
  //   const selection = window.getSelection();
  //   if (!selection?.rangeCount) return;

  //   // 向上查找最近的块级元素
  //   const range = selection.getRangeAt(0);
  //   let element: HTMLElement = range.startContainer as HTMLElement;
  //   if (element.nodeType === Node.TEXT_NODE) {
  //     element = element.parentElement!;
  //   }

  //   // 遍历查找符合条件的块元素
  //   let currentBlock: HTMLElement | null = null;
  //   while (element && !element.classList?.contains('protyle-wysiwyg')) {
  //     const isValidBlock = element.dataset?.nodeId && (
  //       element.classList?.contains('p') || 
  //       element.dataset.type === 'NodeHeading' || 
  //       element.dataset.type === 'NodeList'
  //     );
      
  //     if (isValidBlock) {
  //       currentBlock = element;
  //       break;
  //     }
  //     element = element.parentElement!;
  //   }
  //   if (!currentBlock) return;

  //   // 更新块样式
  //   this.clearFocusStyles();
  //   currentBlock.classList.add(this.FOCUS_CLASS);
    
  //   // 模糊其他块
  //   const editorRoot = document.querySelector('.protyle-wysiwyg');
  //   Array.from(editorRoot?.children || []).forEach(child => {
  //     if (!child.contains(currentBlock)) {
  //       child.classList.add(this.BLUR_CLASS);
  //     }
  //   });

  //   // 平滑滚动到视图中心
  //   currentBlock.scrollIntoView({ behavior: "smooth", block: "center" });
  //   this.updateCustomCursor();
  // }
  /**
   * 聚焦当前文本块（优化版）
   */
  private focusCurrentBlock() {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    // 通过光标位置精准定位
    const range = selection.getRangeAt(0);
    let element: Node = range.startContainer;

    // 处理文本节点的情况
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement!;
    }

    // 使用 closest 查找最近的块元素
    const currentBlock = (element as HTMLElement).closest<HTMLElement>('[data-node-id]');
    if (!currentBlock || !document.querySelector('.protyle-wysiwyg')?.contains(currentBlock)) {
      return;
    }

    // 更新块样式
    this.clearFocusStyles();
    currentBlock.classList.add(this.FOCUS_CLASS);

    // 模糊其他块
    const editorRoot = document.querySelector('.protyle-wysiwyg');
    Array.from(editorRoot?.children || []).forEach(child => {
      if (child !== currentBlock && !child.contains(currentBlock)) {
        child.classList.add(this.BLUR_CLASS);
      }
    });
    
    // 平滑滚动到视图中心
    currentBlock.scrollIntoView({ behavior: "smooth", block: "center" });
    this.updateCustomCursor();
  }

  /**
   * 更新高亮指示线位置
   */
  private updateHighlightLine() {
    const rect = this.getCursorRect();
    if (!rect) return;

    const editor = document.querySelector('.protyle-wysiwyg');
    const editorWidth = editor?.clientWidth || 800;
    const editorRect = editor?.getBoundingClientRect() || { left: 0 };

    // 动态调整指示线样式
    // this.highlightLine.style.display = "block";
    this.highlightLine.style.width = `${editorWidth + 40}px`;
    this.highlightLine.style.left = `${editorRect.left - 15}px`;
    this.highlightLine.style.height = `${rect.height + 7}px`;
    this.highlightLine.style.top = `${rect.top + window.scrollY - 3}px`;
  }

  /**
   * 更新自定义光标样式
   */
  private updateCustomCursor() {
    const rect = this.getCursorRect();
    if (!rect) {
      this.customCursor.style.display = "none";
      return;
    }

    // 计算动态尺寸和位置
    this.customCursor.style.display = "block";
    this.customCursor.style.height = `${rect.height * 1.4}px`;
    this.customCursor.style.transform = `translate(
      ${rect.left + window.scrollX - 1}px, 
      ${rect.top + window.scrollY - rect.height * 0.3}px
    )`;

    // 重置动画以保持可见
    this.customCursor.style.animation = "none";
    void this.customCursor.offsetWidth; // 触发重绘
    this.customCursor.style.animation = "";

    // this.updateHighlightLine();
  }

  //====================
  // 事件处理器
  //====================
  private handleInput() {
    this.focusCurrentBlock();
    this.updateHighlightLine();
    this.updateCustomCursor();
    this.highlightLine.style.display = "block";
  }

  private handleClick() {
    this.updateCustomCursor();
    this.highlightLine.style.display = "block";
  }

  private handleWheel() {
    this.clearFocusStyles();
    this.updateCustomCursor();
    this.highlightLine.style.display = "none";
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (["ArrowUp", "ArrowDown"].includes(event.key)) {
      this.clearFocusStyles();
      this.highlightLine.style.display = "none";
    }
    if (["Backspace", "Enter"].includes(event.key)) {
      // 延迟确保DOM更新完成
      setTimeout(() => {
        this.focusCurrentBlock();
      }, 200);
    }
    this.updateCustomCursor();
  }

  private handleKeyUp() {
    this.updateCustomCursor();
  }

  private handleSelectionChange() {
    this.updateCustomCursor();
  }

  //====================
  // 资源清理
  //====================
  private cleanupResources() {
    // 移除事件监听器
    document.removeEventListener("input", this.handleInput);
    document.removeEventListener("keyup", this.handleKeyUp);
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("click", this.handleClick);
    document.removeEventListener("wheel", this.handleWheel);
    document.removeEventListener("selectionchange", this.handleSelectionChange);

    // 移除动态元素
    [this.highlightLine, this.customCursor].forEach(el => {
      el?.parentNode?.removeChild(el);
    });

    // 恢复样式
    this.clearFocusStyles();
  }
}