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
        console.log("Styles injected:", style);
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

        // 向上查找最近的块元素
        while (element && !element.classList?.contains('protyle-wysiwyg')) {
            // 如果是段落块（NodeParagraph）或列表项块（NodeListItem），则返回
            if (element.dataset.nodeId && (
                element.dataset.type === "NodeParagraph" ||
                element.dataset.type === "NodeListItem"
            )) {
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

        // 设置父级列表项的样式
        let parent = newBlock.parentElement;
        while (parent && !parent.classList.contains('protyle-wysiwyg')) {
            if (parent.dataset.type === "NodeListItem") {
                parent.classList.add(this.FOCUS_CLASS);
            }
            parent = parent.parentElement;
        }

        // 设置兄弟块的样式
        const siblings = Array.from(newBlock.parentElement?.children || []);
        siblings.forEach(sibling => {
            if (sibling !== newBlock && sibling.dataset.type === "NodeParagraph") {
                sibling.classList.add(this.BLUR_CLASS);
            }
        });

        // 滚动到新块
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