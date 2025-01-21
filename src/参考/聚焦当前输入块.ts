import { Plugin } from "siyuan";

export default class FocusBlockPlugin extends Plugin {
    private readonly FOCUS_CLASS = "focus-block";
    private readonly BLUR_CLASS = "blur-block";
    private observer: MutationObserver | null = null;

    onload() {
        console.log("FocusBlockPlugin loaded");

        // 添加样式
        this.addStyle(`
            .${this.BLUR_CLASS} {
                opacity: 0.3;
                transition: opacity 0.2s ease;
            }
            .${this.FOCUS_CLASS} {
                opacity: 1 !important;
                transition: opacity 0.2s ease;
            }
        `);

        // 初始化监听
        this.initObserver();
        this.addEventListeners();
    }

    private initObserver() {
        // 监听DOM变化以处理动态加载的编辑器
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    this.handleNewEditors();
                }
            });
        });
        
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    private handleNewEditors() {
        document.querySelectorAll('.protyle-wysiwyg').forEach(editor => {
            if (!editor.hasAttribute('data-focus-listener')) {
                this.addEditorListener(editor as HTMLElement);
            }
        });
    }

    private addEditorListener(editor: HTMLElement) {
        console.log("Adding listener to editor:", editor); // 检查编辑器实例
        editor.setAttribute('data-focus-listener', 'true');
        editor.addEventListener('input', this.handleInput.bind(this));
        editor.addEventListener('click', this.handleClick.bind(this));
    }

    private addEventListeners() {
        // 初始加载的编辑器
        this.handleNewEditors();
        
        // 全局光标变化监听
        document.addEventListener('selectionchange', () => {
            this.updateFocusBlock();
        });
    }

    private handleInput(e: Event) {
        console.log("Input event detected"); // 检查事件是否触发
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const currentBlock = this.findContentBlock(range.startContainer);
        if (currentBlock) {
            this.updateFocusBlock(currentBlock);
            this.scrollToCenter(currentBlock);
        }
    }

    private handleClick(e: MouseEvent) {
        console.log("Click event detected"); // 检查事件是否触发
        const target = e.target as HTMLElement;
        const currentBlock = this.findContentBlock(target);
        if (currentBlock) {
            this.updateFocusBlock(currentBlock);
            this.scrollToCenter(currentBlock);
        }
    }

    private updateFocusBlock(newBlock: HTMLElement) {
        console.log("Updating focus block:", newBlock); // 检查当前块
        document.querySelectorAll(`.${this.FOCUS_CLASS}, .${this.BLUR_CLASS}`).forEach(el => {
            el.classList.remove(this.FOCUS_CLASS, this.BLUR_CLASS);
        });

        newBlock.classList.add(this.FOCUS_CLASS);
        console.log("Added focus class to block:", newBlock); // 检查样式类名是否添加
        this.setAncestorsStyle(newBlock, this.FOCUS_CLASS);
        this.setSiblingsStyle(newBlock, this.BLUR_CLASS);
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

    private scrollToCenter(element: HTMLElement) {
        console.log("Scrolling to center:", element); // 检查是否触发滚动
        const blockRect = element.getBoundingClientRect();
        console.log("Block rect:", blockRect); // 检查块的位置信息
        const viewportHeight = window.innerHeight;
        const targetPosition = blockRect.top + window.scrollY - viewportHeight / 2 + blockRect.height / 2;
        
        console.log("Target scroll position:", targetPosition); // 检查目标滚动位置
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    onunload() {
        console.log("FocusBlockPlugin unloaded");
        this.observer?.disconnect();
        document.querySelectorAll('.protyle-wysiwyg').forEach(editor => {
            editor.removeEventListener('input', this.handleInput);
            editor.removeEventListener('click', this.handleClick);
        });
    }
}