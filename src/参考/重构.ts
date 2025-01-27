/* index.ts */
import { Plugin } from "siyuan";
import "@/index.scss";

export default class ZenType extends Plugin {
  // 类名常量
  private readonly FOCUS = "focus-block";
  private readonly BLUR = "blur-block";

  // 状态标识
  private isEditingMode = false;

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
  
  // 启用编辑模式
  private editingStateOn() {
    if (!this.isEditingMode) {
      this.isEditingMode = true;
      this.focusBlockOn();
      this.highlightLineOn();
    }
  }
  
  // 退出编辑模式
  private editingStateOff() {
    if (this.isEditingMode) {
      this.isEditingMode = false;
      this.focusBlockOff();
      this.highlightLineOff();
    }
  }

  // 启用聚焦块
  private focusBlockOn() {}
  
  // 退出聚焦块
  private focusBlockOff() {

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
    console.log("高亮关")
  }

  // ===============
  // hanleInput 方法
  // ===============
  private handleInput(event: InputEvent) {
    // 启用编辑模式
    // this.editingStateOn();
    this.highlightLineOn();
  }

  private handleWheel(event: WheelEvent) {
    this.editingStateOff();
  }

  private handleKeyDown(event: KeyboardEvent) {}

  private handleKeyUp(event: KeyboardEvent) {}

  private handleClick(event: MouseEvent) {}

  private handleSelectionChange(event: Event) {}

  onunload() {
    console.log("ZenType unloaded");
    // 清理事件监听器
    document.removeEventListener("input", this.handleInput);

    // 清理DOM元素
    this.highlightLine.remove();
  }
}
