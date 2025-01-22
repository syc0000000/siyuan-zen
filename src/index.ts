import { Plugin } from "siyuan";
import "@/index.scss"; // 直接导入 SCSS 文件

export default class FocusBlockPlugin extends Plugin {
    private readonly FOCUS_CLASS = "focus-block";

    onload() {
        console.log("FocusBlockPlugin loaded");

        // 监听输入事件
        document.addEventListener("input", this.handleInput.bind(this));
    }

    private handleInput() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const currentBlock = this.findContentBlock(range.startContainer);
        if (currentBlock) {
            this.updateFocusBlock(currentBlock);
        } else {
            console.warn("Current block not found");
        }
    }

    private findContentBlock(node: Node): HTMLElement | null {
        let element = node.nodeType === Node.TEXT_NODE ? 
            node.parentElement : node as HTMLElement;

        while (element && !element.classList?.contains('protyle-wysiwyg')) {
            if (element.dataset?.nodeId && (element.classList?.contains('p') || element.dataset.type === "NodeHeading")) {
                return element;
            }
            element = element.parentElement;
        }
        return null;
    }

    private updateFocusBlock(newBlock: HTMLElement) {
        // 清除旧块的聚焦样式
        document.querySelectorAll(`.${this.FOCUS_CLASS}`).forEach(el => {
            el.classList.remove(this.FOCUS_CLASS);
        });

        // 设置新块的聚焦样式
        newBlock.classList.add(this.FOCUS_CLASS);

        // 将当前块滚动到屏幕中间
        newBlock.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
        });
    }

    onunload() {
        console.log("FocusBlockPlugin unloaded");
        document.removeEventListener("input", this.handleInput);
    }
}