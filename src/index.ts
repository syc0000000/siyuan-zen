import { Plugin } from "siyuan";
import "@/index.scss";

export default class FocusBlockPlugin extends Plugin {
    private readonly FOCUS_CLASS = "focus-block";
    private readonly BLUR_CLASS = "blur-block";
    private isEditingMode = false;  // 透明度编辑模式状态标识

    onload() {
        console.log("FocusBlockPlugin loaded");
        
        // 监听输入事件
        document.addEventListener("input", this.handleInput.bind(this));
        // 监听滚轮事件
        document.addEventListener("wheel", this.exitFocusMode.bind(this));
        // 监听方向键事件
        document.addEventListener("keydown", this.handleKeyDown.bind(this));
    }

    // 输入事件处理
    private handleInput() {
        if (!this.isEditingMode) {
            this.isEditingMode = true;
        }
        
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const currentBlock = this.findContentBlock(range.startContainer);
        if (currentBlock) {
            this.updateFocusBlock(currentBlock);
        }
    }

    // 键盘事件处理
    private handleKeyDown(event: KeyboardEvent) {
        // 检测上下方向键
        if (["ArrowUp", "ArrowDown"].includes(event.key)) {
            this.exitFocusMode();
        }
    }

    // 退出透明度编辑模式
    private exitFocusMode() {
        if (this.isEditingMode) {
            this.clearFocusBlocks();
            this.isEditingMode = false;
        }
    }

    // 清除所有焦点样式
    private clearFocusBlocks() {
        document.querySelectorAll(`.${this.FOCUS_CLASS}, .${this.BLUR_CLASS}`).forEach(el => {
            el.classList.remove(this.FOCUS_CLASS, this.BLUR_CLASS);
        });
    }

    // 查找内容块（优化版）
    private findContentBlock(node: Node): HTMLElement | null {
        let element = node.nodeType === Node.TEXT_NODE ? 
            node.parentElement : node as HTMLElement;

        while (element && !element.classList?.contains('protyle-wysiwyg')) {
            if (element.dataset?.nodeId && (
                element.classList?.contains('p') || 
                element.dataset.type === "NodeHeading" ||
                element.dataset.type === "NodeList"  // 保持列表块支持
            )) {
                return element;
            }
            element = element.parentElement;
        }
        return null;
    }

    // 更新焦点块（优化版）
    private updateFocusBlock(newBlock: HTMLElement) {
        this.clearFocusBlocks();
        newBlock.classList.add(this.FOCUS_CLASS);
        this.setSiblingsStyle(newBlock, this.BLUR_CLASS);

        
        // 仅在编辑模式时滚动
        if (this.isEditingMode) {
            newBlock.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center",
            });
        }
    }

    // private setSiblingsStyle(element: HTMLElement, styleClass: string) {
    //     Array.from(element.parentElement?.children || []).forEach(sibling => {
    //         if (sibling !== element) {
    //             sibling.classList.add(styleClass);
    //         }
    //     });
    // }
    private setSiblingsStyle(element: HTMLElement, styleClass: string) {
        // 1. 获取编辑区根元素
        const editorRoot = document.querySelector('.protyle-wysiwyg');
        if (!editorRoot) return;
    
        // 2. 遍历所有直接子元素
        Array.from(editorRoot.children).forEach(child => {
            // 3. 检查是否包含当前块（含嵌套情况）
            const isCurrentOrParent = child === element || child.contains(element);
            
            // 4. 非当前块则添加模糊样式
            if (!isCurrentOrParent) {
                child.classList.add(styleClass);
            }
        });
    }

    onunload() {
        console.log("FocusBlockPlugin unloaded");
        document.removeEventListener("input", this.handleInput);
        document.removeEventListener("wheel", this.exitFocusMode);
        document.removeEventListener("keydown", this.handleKeyDown);
        this.clearFocusBlocks();
    }
}