const cloudbase = require('@cloudbase/node-sdk');

exports.main = async (event, context) => {
  try {
    return {
      success: true,
      message: 'Hello from getCosSts function'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};