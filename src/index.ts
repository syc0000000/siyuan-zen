import siyuan from "siyuan";

export default class TypewriterPlugin extends siyuan.Plugin {
    constructor(options: any) {
        super(options);
    }

    onload(): void {
        console.log("Typewriter plugin loaded");
        this.logger.debug("Typewriter plugin loaded");
        this.activate();
    }

    onLayoutReady(): void {
        console.log("Layout ready, activating plugin");
        this.activate();
    }

    onunload(): void {
        console.log("Typewriter plugin unloaded");
        this.logger.debug("Typewriter plugin unloaded");
        this.activate(false);
    }

    protected activate(enable: boolean = true): void {
        console.log("Activating plugin:", enable);
        this.toggleEventListener(enable);
    }

    protected toggleEventListener(enable: boolean): void {
        console.log("Toggling global event listener:", enable);

        const listener = [
            "keyup",
            this.editorEventListener,
            {
                capture: true,
            },
        ] as Parameters<HTMLElement["addEventListener"]>;

        if (enable) {
            document.addEventListener(...listener);
            console.log("Global event listener added");
        } else {
            document.removeEventListener(...listener);
            console.log("Global event listener removed");
        }
    }

    protected readonly editorEventListener = (e: Event) => {
        console.log("Editor event triggered");
        const cursorPosition = this.getCursorPosition();
        if (cursorPosition) {
            console.log("Cursor position:", cursorPosition.rect);
        } else {
            console.log("No cursor position found");
        }
    };

    private getCursorPosition(): { node: Node; rect: DOMRect } | null {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            console.log("No selection found");
            return null;
        }

        // 获取光标所在的节点
        const focusNode = selection.focusNode;
        if (!focusNode) {
            console.log("No focus node found");
            return null;
        }

        // 获取光标所在节点的位置信息
        if (focusNode.nodeType === Node.TEXT_NODE) {
            // 如果是文本节点，获取其父元素的位置信息
            const parentElement = focusNode.parentElement;
            if (parentElement) {
                const rect = parentElement.getBoundingClientRect();
                console.log("Cursor position (text node):", rect);
                return { node: focusNode, rect };
            }
        } else if (focusNode.nodeType === Node.ELEMENT_NODE) {
            // 如果是元素节点，直接获取其位置信息
            const rect = (focusNode as HTMLElement).getBoundingClientRect();
            console.log("Cursor position (element node):", rect);
            return { node: focusNode, rect };
        }

        console.log("Unable to get cursor position");
        return null;
    }

    protected readonly editorEventListener = (e: Event) => {
        console.log("Editor event triggered");
        const cursorPosition = this.getCursorPosition();
        if (cursorPosition) {
            console.log("Cursor position:", cursorPosition.rect);
            this.scrollToCenter(cursorPosition.rect);
        } else {
            console.log("No cursor position found");
        }
    };
    
    private scrollToCenter(rect: DOMRect): void {
        const editorContainer = document.querySelector(".protyle-content") as HTMLElement;
        if (!editorContainer) {
            console.log("Editor container not found");
            return;
        }
    
        // 计算光标所在行的中心位置
        const cursorCenter = rect.top + rect.height / 2;
    
        // 计算容器的中心位置
        const containerRect = editorContainer.getBoundingClientRect();
        const containerCenter = containerRect.top + containerRect.height / 2;
    
        // 计算需要滚动的距离
        const scrollOffset = cursorCenter - containerCenter;
    
        console.log("Scroll offset:", scrollOffset);
    
        // 滚动到目标位置
        editorContainer.scrollBy({
            top: scrollOffset,
            behavior: "smooth",
        });
    }
}