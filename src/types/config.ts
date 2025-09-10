/**
 * ZenType 插件配置选项类型定义
 */

export interface ZenTypeConfig {
    // 基础功能开关
    enableFocusMode: boolean;
    enableTypewriterMode: boolean;
    enableCustomCursor: boolean;
    enableHighlightLine: boolean;

    // 视觉效果设置
    cursorColorLight: string;
    cursorColorDark: string;
    cursorWidth: number;
    highlightColorLight: string;
    highlightColorDark: string;
    blurOpacity: number;

    // 性能优化设置
    cursorUpdateDelay: number;
    focusApplyDelay: number;
    highlightLineDelay: number;
}

export const DEFAULT_CONFIG: ZenTypeConfig = {
    // 基础功能开关
    enableFocusMode: true,
    enableTypewriterMode: true,
    enableCustomCursor: true,
    enableHighlightLine: true,

    // 视觉效果设置
    cursorColorLight: '#5d8cd7',
    cursorColorDark: '#8ab4f8',
    cursorWidth: 3,
    highlightColorLight: '#f2ecde99',
    highlightColorDark: '#36343373',
    blurOpacity: 0.2,

    // 性能优化设置
    cursorUpdateDelay: 200,
    focusApplyDelay: 50,
    highlightLineDelay: 200
};

/**
 * 验证配置项是否有效
 */
export function validateConfig(config: Partial<ZenTypeConfig>): ZenTypeConfig {
    const validatedConfig = { ...DEFAULT_CONFIG };

    // 验证并设置每个配置项
    if (typeof config.enableFocusMode === 'boolean') {
        validatedConfig.enableFocusMode = config.enableFocusMode;
    }

    if (typeof config.enableTypewriterMode === 'boolean') {
        validatedConfig.enableTypewriterMode = config.enableTypewriterMode;
    }

    if (typeof config.enableCustomCursor === 'boolean') {
        validatedConfig.enableCustomCursor = config.enableCustomCursor;
    }

    if (typeof config.enableHighlightLine === 'boolean') {
        validatedConfig.enableHighlightLine = config.enableHighlightLine;
    }

    // 验证颜色值（简单的hex颜色验证）
    if (typeof config.cursorColorLight === 'string' && /^#[0-9A-Fa-f]{6}$/.test(config.cursorColorLight)) {
        validatedConfig.cursorColorLight = config.cursorColorLight;
    }

    if (typeof config.cursorColorDark === 'string' && /^#[0-9A-Fa-f]{6,8}$/.test(config.cursorColorDark)) {
        validatedConfig.cursorColorDark = config.cursorColorDark;
    }

    if (typeof config.highlightColorLight === 'string') {
        validatedConfig.highlightColorLight = config.highlightColorLight;
    }

    if (typeof config.highlightColorDark === 'string') {
        validatedConfig.highlightColorDark = config.highlightColorDark;
    }

    // 验证数值范围
    if (typeof config.cursorWidth === 'number' && config.cursorWidth >= 1 && config.cursorWidth <= 10) {
        validatedConfig.cursorWidth = config.cursorWidth;
    }

    if (typeof config.blurOpacity === 'number' && config.blurOpacity >= 0.1 && config.blurOpacity <= 0.8) {
        validatedConfig.blurOpacity = config.blurOpacity;
    }

    if (typeof config.cursorUpdateDelay === 'number' && config.cursorUpdateDelay >= 50 && config.cursorUpdateDelay <= 500) {
        validatedConfig.cursorUpdateDelay = config.cursorUpdateDelay;
    }

    if (typeof config.focusApplyDelay === 'number' && config.focusApplyDelay >= 0 && config.focusApplyDelay <= 200) {
        validatedConfig.focusApplyDelay = config.focusApplyDelay;
    }

    if (typeof config.highlightLineDelay === 'number' && config.highlightLineDelay >= 50 && config.highlightLineDelay <= 500) {
        validatedConfig.highlightLineDelay = config.highlightLineDelay;
    }

    return validatedConfig;
}
