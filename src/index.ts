/* index.ts */
import { Plugin } from "siyuan";
import "@/index.scss";

export default class ZenType extends Plugin {
  // 类名常量
  private readonly FOCUS = "focus-block";
  private readonly BLUR = "blur-block";

  // 创建元素
  private highlightLine: HTMLElement;
  private customCursor: HTMLElement;

  onload() {
    console.log("ZenType loaded");
    // 初始化事件监听
    this.initEventListeners();

    // 创建编辑区元素
    const editorContainer = document.querySelector(".protyle") || document.body;
    // 创建高亮条元素
    this.highlightLine = document.createElement("div");
    this.highlightLine.id = "highlight-line";
    editorContainer.appendChild(this.highlightLine);
    this.highlightLine.style.display = "none";
    // 创建自定义光标
    this.customCursor = document.createElement("div");
    this.customCursor.className = "custom-cursor";
    editorContainer.appendChild(this.customCursor);
    this.customCursor.style.display = "block";
  }

  // 事件处理器类型定义
  private initEventListeners() {
    document.addEventListener("input", this.handleInput.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("click", this.handleClick.bind(this));
    document.addEventListener("wheel", this.handleWheel.bind(this));
    document.addEventListener("selectionchange", this.handleSelectionChange.bind(this));
  }

  // 获取坐标
  private getCursorRect(): DOMRect | null {
    const selection = window.getSelection();

    // 安全校验：选区是否存在
    if (!selection || selection.rangeCount === 0) return null;

    try {
      const range = selection.getRangeAt(0);
      return range.getBoundingClientRect();
    } catch (error) {
      console.debug("获取光标位置失败", error);
      return null;
    }
  }

  // 清理聚焦样式
  private clearFocusBlocks() {
    document.querySelectorAll(`.${this.FOCUS}, .${this.BLUR}`)
      .forEach(el => el.classList.remove(this.FOCUS, this.BLUR));
  }

  // 启用聚焦块
  private focusBlockOn() {
    // 步骤1: 获取当前选区并校验
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // 步骤2: 查找当前焦点块
    const range = selection.getRangeAt(0);
    const startNode = range.startContainer;
    let currentBlock: HTMLElement | null = null;
    
    let element = startNode.nodeType === Node.TEXT_NODE ? 
        startNode.parentElement : startNode as HTMLElement;
    while (element && !element.classList?.contains('protyle-wysiwyg')) {
        if (element.dataset?.nodeId && (
            element.classList?.contains('p') || 
            element.dataset.type === 'NodeHeading' || 
            element.dataset.type === 'NodeList'
        )) {
            currentBlock = element;
            break;
        }
        element = element.parentElement;
    }
    if (!currentBlock) return;

    // 步骤3: 清除旧元素
    this.clearFocusBlocks()

    // 步骤4: 标记当前焦点块
    currentBlock.classList.add(this.FOCUS);

    // 步骤5: 模糊兄弟块
    const editorRoot = document.querySelector('.protyle-wysiwyg');
    if (!editorRoot) return;
    
    Array.from(editorRoot.children).forEach(child => {
        if (!child.contains(currentBlock) && child !== currentBlock) {
            child.classList.add(this.BLUR);
        }
    });

    // 可选：平滑滚动到视图中心
    currentBlock.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  
  // 退出聚焦块
  private focusBlockOff() {
    this.clearFocusBlocks();
  }

  // 启用高亮条
  private highlightLineOn() {
    const rect = this.getCursorRect();
    if (!rect) return;
    this.highlightLine.style.display = "block";
    // 计算编辑器相关尺寸
    const editor = document.querySelector('.protyle-wysiwyg');
    const editorWidth = editor?.clientWidth || 800;
    const editorLeft = editor?.getBoundingClientRect().left || 0;

    // 设置高亮条样式
    this.highlightLine.style.width = `${editorWidth + 40}px`;
    this.highlightLine.style.left = `${editorLeft - 15}px`;
    this.highlightLine.style.height = `${rect.height + 7}px`;
    this.highlightLine.style.top = `${rect.top + window.scrollY - 3}px`;
  }

  // 退出高亮条
  private highlightLineOff() {
    this.highlightLine.style.display = "none";
  }

  // 自定义光标
  private betterCursor() {
    let rect = this.getCursorRect();
    if (!rect) return;

    this.customCursor.style.display = "block";
    this.customCursor.style.height = `${rect.height + 0.4*rect.height }px`;
    this.customCursor.style.transform = `translate(
        ${rect.left + window.scrollX - 1}px, 
        ${rect.top + window.scrollY - 0.2*rect.height}px
    )`;

    // 保持光标可见
    this.customCursor.style.animation = "none";
    void this.customCursor.offsetWidth;
    this.customCursor.style.animation = null;
  }

  // ===============
  // 事件监听 方法
  // ===============
  private handleInput() {
    // 启用聚焦块
    this.focusBlockOn();
    // 启用高亮条
    this.highlightLineOn();
    this.betterCursor();
  }

  private handleClick() {
    this.betterCursor();
  }

  private handleWheel() {
    this.focusBlockOff();
    this.highlightLineOff();
    this.betterCursor();
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (["ArrowUp", "ArrowDown"].includes(event.key)) {
        this.focusBlockOff();
        this.highlightLineOff();
    }
    this.betterCursor();
  }

  private handleKeyUp() {
    this.betterCursor();
  }

  private handleSelectionChange() {
    this.betterCursor();
  }

  onunload() {
    console.log("ZenType unloaded");
  
    // ========================
    // 1. 移除所有事件监听器
    // ========================
    document.removeEventListener("input", this.handleInput);
    document.removeEventListener("keyup", this.handleKeyUp);
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("click", this.handleClick);
    document.removeEventListener("wheel", this.handleWheel);
    document.removeEventListener("selectionchange", this.handleSelectionChange);
  
    // ========================
    // 2. 清理动态创建的元素
    // ========================
    // 移除高亮条
    if (this.highlightLine && this.highlightLine.parentNode) {
      this.highlightLine.parentNode.removeChild(this.highlightLine);
    }
    
    // 移除自定义光标
    if (this.customCursor && this.customCursor.parentNode) {
      this.customCursor.parentNode.removeChild(this.customCursor);
    }
  
    // ========================
    // 3. 恢复DOM修改
    // ========================
    // 移除所有焦点/模糊样式
    this.clearFocusBlocks();
  }
}
