/* index.ts */
import { Plugin } from "siyuan";
import "@/index.scss";

/**
 * 思源笔记焦点块高亮插件
 * 功能特性：
 * 1. 聚焦块高亮显示
 * 2. 相邻块透明度渐变
 * 3. 光标跟随高亮条
 * 4. 主题模式适配
 */
export default class FocusBlockPlugin extends Plugin {
  // 类名常量
  private readonly FOCUS_CLASS = "focus-block";
  private readonly BLUR_CLASS = "blur-block";
  
  // 状态标识
  private isEditingMode = false;
  private highlightLine: HTMLElement;
  private customCursor: HTMLElement;

  onload() {
    console.log("FocusBlockPlugin loaded");
    
    // 初始化事件监听
    this.initEventListeners();
    
    // 创建高亮条元素
    this.highlightLine = document.createElement("div");
    this.highlightLine.id = "highlight-line";
    // document.body.appendChild(this.highlightLine);
    const editorContainer = document.querySelector('.protyle') || document.body;
    editorContainer.appendChild(this.highlightLine);
    this.highlightLine.style.display = "none";
    // 创建自定义光标
    this.customCursor = document.createElement("div");
    this.customCursor.className = "custom-cursor";
    editorContainer.appendChild(this.customCursor);
    this.customCursor.style.display = "block";
  }

  // 初始化事件监听器
  private initEventListeners() {
    document.addEventListener("input", this.handleInput.bind(this));
    document.addEventListener("wheel", this.exitFocusMode.bind(this));
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  // 更新高亮条位置
  private updateHighlightPosition() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const editor = document.querySelector('.protyle-wysiwyg');

    // 计算编辑器相关尺寸
    const editorWidth = editor?.clientWidth || 800;
    const editorLeft = editor?.getBoundingClientRect().left || 0;

    // 设置高亮条样式
    this.highlightLine.style.width = `${editorWidth + 40}px`;
    this.highlightLine.style.left = `${editorLeft - 15}px`;
    this.highlightLine.style.height = `${rect.height + 7}px`;
    this.highlightLine.style.top = `${rect.top + window.scrollY - 3}px`;

    // 更新自定义光标位置
    if (this.isEditingMode) {
        this.customCursor.style.display = "block";
        this.customCursor.style.height = `${rect.height}px`;
        this.customCursor.style.transform = `translate(
            ${rect.left + window.scrollX}px, 
            ${rect.top + window.scrollY}px
        )`;
        
        // 处理空行光标
        if (rect.width === 0) {
            this.customCursor.style.width = "2px";
            this.customCursor.style.transform = `translate(
            ${rect.left + window.scrollX - 1}px, 
            ${rect.top + window.scrollY}px
            )`;
        }
        } else {
        this.customCursor.style.display = "none";
        }
  }

  // 输入事件处理
  private handleInput() {
    if (!this.isEditingMode) {
      this.isEditingMode = true;
      this.highlightLine.style.display = "block";
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // 更新焦点块和高亮条位置
    const range = selection.getRangeAt(0);
    const currentBlock = this.findContentBlock(range.startContainer);
    if (currentBlock) this.updateFocusBlock(currentBlock);
    this.updateHighlightPosition();
    
    // 保持光标可见
    this.customCursor.style.animation = "none";
    void this.customCursor.offsetWidth; // 触发重绘
    this.customCursor.style.animation = null;
  }

  // 键盘事件处理
  private handleKeyDown(event: KeyboardEvent) {
    if (["ArrowUp", "ArrowDown"].includes(event.key)) {
      this.exitFocusMode();
    }
  }

  // 退出焦点模式
  private exitFocusMode() {
    if (this.isEditingMode) {
      this.clearFocusBlocks();
      this.isEditingMode = false;
      this.highlightLine.style.display = "none";
      this.customCursor.style.display = "none";
    }
  }

  // 清除所有焦点样式
  private clearFocusBlocks() {
    document.querySelectorAll(`.${this.FOCUS_CLASS}, .${this.BLUR_CLASS}`)
      .forEach(el => el.classList.remove(this.FOCUS_CLASS, this.BLUR_CLASS));
  }

  // 查找内容块元素
  private findContentBlock(node: Node): HTMLElement | null {
    let element = node.nodeType === Node.TEXT_NODE ? 
      node.parentElement : node as HTMLElement;

    // 向上遍历查找有效块元素
    while (element && !element.classList?.contains('protyle-wysiwyg')) {
      if (element.dataset?.nodeId && this.isValidBlockType(element)) {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }

  // 校验有效块类型
  private isValidBlockType(element: HTMLElement): boolean {
    return element.classList?.contains('p') || 
      ["NodeHeading", "NodeList"].includes(element.dataset.type);
  }

  // 更新焦点块状态
  private updateFocusBlock(newBlock: HTMLElement) {
    this.clearFocusBlocks();
    newBlock.classList.add(this.FOCUS_CLASS);
    this.setSiblingsStyle(newBlock);

    // 平滑滚动到视图中心
    if (this.isEditingMode) {
      newBlock.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  // 设置兄弟元素模糊样式
  private setSiblingsStyle(element: HTMLElement) {
    const editorRoot = document.querySelector('.protyle-wysiwyg');
    if (!editorRoot) return;

    Array.from(editorRoot.children).forEach(child => {
      if (!child.contains(element) && child !== element) {
        child.classList.add(this.BLUR_CLASS);
      }
    });
  }

  onunload() {
    console.log("FocusBlockPlugin unloaded");
    
    // 清理事件监听器
    document.removeEventListener("input", this.handleInput);
    document.removeEventListener("wheel", this.exitFocusMode);
    document.removeEventListener("keydown", this.handleKeyDown);
    
    // 清理DOM元素
    this.clearFocusBlocks();
    this.highlightLine.remove();
  }
}