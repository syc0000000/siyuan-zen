import { Plugin } from "siyuan";

// 定义插件类
export default class FocusBlockPlugin extends Plugin {
    // 定义聚焦块和模糊块的 CSS 类名
    private readonly FOCUS_CLASS = "focus-block";
    private readonly BLUR_CLASS = "blur-block";

    // 插件加载时执行
    onload() {
        console.log("FocusBlockPlugin loaded");

        // 添加样式到页面中
        this.addStyle(`
            .${this.BLUR_CLASS} {
                opacity: 0.3; // 模糊块的透明度
                transition: opacity 0.7s ease; // 透明度变化的过渡效果
            }
            .${this.FOCUS_CLASS} {
                opacity: 1 !important; // 聚焦块的透明度
                transition: opacity 0.7s ease; // 透明度变化的过渡效果
            }
        `);

        // 监听 input 事件，当用户输入时触发 handleInput 方法
        document.addEventListener("input", this.handleInput.bind(this));
    }

    // 动态添加样式到页面
    private addStyle(css: string) {
        const style = document.createElement("style"); // 创建 <style> 标签
        style.textContent = css; // 设置样式内容
        document.head.appendChild(style); // 将样式添加到 <head> 中
        console.log("Styles injected:", style); // 打印日志，检查样式是否注入
    }

    // 处理用户输入事件
    private handleInput() {
        const selection = window.getSelection(); // 获取当前光标的选择范围
        if (!selection || selection.rangeCount === 0) return; // 如果没有选择范围，直接返回

        const range = selection.getRangeAt(0); // 获取光标所在的 Range 对象
        const currentBlock = this.findContentBlock(range.startContainer); // 找到光标所在的块
        if (currentBlock) {
            this.updateFocusBlock(currentBlock); // 更新当前块的样式
        }
    }

    // 查找光标所在的块
    private findContentBlock(node: Node): HTMLElement | null {
        let element = node.nodeType === Node.TEXT_NODE ? 
            node.parentElement : node as HTMLElement; // 如果节点是文本节点，取其父元素
        
        // 向上查找最近的块元素
        while (element && !element.classList?.contains('protyle-wysiwyg')) {
            if (element.dataset.nodeId) { // 如果元素有 data-node-id 属性
                return element; // 返回该元素
            }
            element = element.parentElement; // 继续向上查找
        }
        return null; // 如果没有找到，返回 null
    }

    // 更新当前块的样式
    private updateFocusBlock(newBlock: HTMLElement) {
        // 清除旧块的样式
        document.querySelectorAll(`.${this.FOCUS_CLASS}, .${this.BLUR_CLASS}`).forEach(el => {
            el.classList.remove(this.FOCUS_CLASS, this.BLUR_CLASS); // 移除聚焦和模糊样式
        });

        // 设置新块样式
        newBlock.classList.add(this.FOCUS_CLASS); // 为当前块添加聚焦样式
        this.setAncestorsStyle(newBlock, this.FOCUS_CLASS); // 为祖先元素添加聚焦样式
        this.setSiblingsStyle(newBlock, this.BLUR_CLASS); // 为兄弟元素添加模糊样式

        // 将当前块滚动到屏幕中间
        newBlock.scrollIntoView({
            behavior: "smooth", // 平滑滚动
            block: "center", // 垂直居中
            inline: "center", // 水平居中
        });
    }

    // 为祖先元素添加样式
    private setAncestorsStyle(element: HTMLElement, styleClass: string) {
        let parent = element.parentElement; // 获取父元素
        while (parent && !parent.classList.contains('protyle-wysiwyg')) { // 如果父元素存在且不是编辑区根元素
            parent.classList.add(styleClass); // 为父元素添加样式
            parent = parent.parentElement; // 继续向上查找
        }
    }

    // 为兄弟元素添加样式
    private setSiblingsStyle(element: HTMLElement, styleClass: string) {
        Array.from(element.parentElement?.children || []).forEach(sibling => { // 遍历兄弟元素
            if (sibling !== element) { // 如果不是当前块
                sibling.classList.add(styleClass); // 为兄弟元素添加样式
            }
        });
    }

    // 插件卸载时执行
    onunload() {
        console.log("FocusBlockPlugin unloaded");
        document.removeEventListener("input", this.handleInput); // 移除 input 事件监听器
    }
}