const { WeappTailwindcssDisabled } = require('weapp-tailwindcss-webpack-plugin')

module.exports = {
  // 小程序特殊配置
  mini: {
    // 小程序端特殊配置
    webpackChain(chain) {
      // 使用 weapp-tailwindcss-webpack-plugin
      const { WeappTailwindcssDisabled } = require('weapp-tailwindcss-webpack-plugin')
      chain
        .plugin('weapp-tailwindcss-webpack-plugin')
        .use(WeappTailwindcssDisabled)
    }
  },
  // H5 端配置
  h5: {
    // H5 端特殊配置
    webpackChain(chain) {
      // H5 端不使用 weapp-tailwindcss-webpack-plugin
    }
  },
  // 通用配置
  projectConfig: {
    // 项目配置
  }
} 