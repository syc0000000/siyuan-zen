import { Plugin } from "siyuan";

export default class FocusBlockPlugin extends Plugin {
    private readonly FOCUS_CLASS = "focus-block";
    private readonly BLUR_CLASS = "blur-block";

    onload() {
        console.log("FocusBlockPlugin loaded");

        // 添加样式
        this.addStyle(`
            .${this.BLUR_CLASS} {
                opacity: 0.3;
                transition: opacity 0.7s ease;
            }
            .${this.FOCUS_CLASS} {
                opacity: 1 !important;
                transition: opacity 0.7s ease;
            }
        `);

        document.addEventListener("input", this.handleInput.bind(this));
    }

    private addStyle(css: string) {
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
        console.log("Styles injected:", style); // 检查样式是否注入
    }

    private handleInput(event: Event) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const currentBlock = this.findContentBlock(range.startContainer);
        if (currentBlock) {
            this.updateFocusBlock(currentBlock);
        }
    }

    private findContentBlock(node: Node): HTMLElement | null {
        let element = node.nodeType === Node.TEXT_NODE ? 
            node.parentElement : node as HTMLElement;
        
        while (element && !element.classList?.contains('protyle-wysiwyg')) {
            if (element.dataset.nodeId) {
                return element;
            }
            element = element.parentElement;
        }
        return null;
    }

    private updateFocusBlock(newBlock: HTMLElement) {
        // 清除旧块的样式
        document.querySelectorAll(`.${this.FOCUS_CLASS}, .${this.BLUR_CLASS}`).forEach(el => {
            el.classList.remove(this.FOCUS_CLASS, this.BLUR_CLASS);
        });

        // 设置新块样式
        newBlock.classList.add(this.FOCUS_CLASS);
        this.setAncestorsStyle(newBlock, this.FOCUS_CLASS);
        this.setSiblingsStyle(newBlock, this.BLUR_CLASS);

        newBlock.scrollIntoView({
            behavior: "smooth",
            block: "center", // 将块滚动到屏幕中间
            inline: "center",
        });
    }

    private setAncestorsStyle(element: HTMLElement, styleClass: string) {
        let parent = element.parentElement;
        while (parent && !parent.classList.contains('protyle-wysiwyg')) {
            parent.classList.add(styleClass);
            parent = parent.parentElement;
        }
    }

    private setSiblingsStyle(element: HTMLElement, styleClass: string) {
        Array.from(element.parentElement?.children || []).forEach(sibling => {
            if (sibling !== element) {
                sibling.classList.add(styleClass);
            }
        });
    }

    onunload() {
        console.log("FocusBlockPlugin unloaded");
        document.removeEventListener("input", this.handleInput);
    }
}