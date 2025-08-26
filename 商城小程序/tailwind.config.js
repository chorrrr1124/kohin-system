/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,wxml}',
    './components/**/*.{js,ts,jsx,tsx,wxml}',
    './app.{js,ts,jsx,tsx,wxml}'
  ],
  theme: {
    extend: {
      // 小程序适配的颜色
      colors: {
        primary: '#ff6b35',
        secondary: '#f7931e',
        success: '#52c41a',
        warning: '#faad14',
        error: '#ff4d4f',
        info: '#1890ff',
      },
      // 小程序适配的字体大小
      fontSize: {
        'xs': '20rpx',
        'sm': '24rpx',
        'base': '28rpx',
        'lg': '32rpx',
        'xl': '36rpx',
        '2xl': '40rpx',
        '3xl': '48rpx',
        '4xl': '56rpx',
      },
      // 小程序适配的间距
      spacing: {
        '1': '8rpx',
        '2': '16rpx',
        '3': '24rpx',
        '4': '32rpx',
        '5': '40rpx',
        '6': '48rpx',
        '8': '64rpx',
        '10': '80rpx',
        '12': '96rpx',
        '16': '128rpx',
        '20': '160rpx',
        '24': '192rpx',
      },
      // 小程序适配的圆角
      borderRadius: {
        'sm': '8rpx',
        'md': '12rpx',
        'lg': '16rpx',
        'xl': '24rpx',
        '2xl': '32rpx',
      }
    },
  },
  plugins: [],
  // 小程序特殊配置
  corePlugins: {
    preflight: false, // 禁用 preflight，避免与小程序默认样式冲突
  },
} 