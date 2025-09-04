exports.main = async (event, context) => {
  try {
    return {
      success: true,
      message: 'getCosSts minimal probe ok',
      nodeVersion: process.version,
      env: {
        TENCENT_SECRET_ID: process.env.TENCENT_SECRET_ID ? 'SET' : 'NOT_SET',
        TENCENT_SECRET_KEY: process.env.TENCENT_SECRET_KEY ? 'SET' : 'NOT_SET',
        COS_BUCKET: process.env.COS_BUCKET || null,
        COS_REGION: process.env.COS_REGION || null
      },
      now: new Date().toISOString()
    };
  } catch (e) {
    return { success: false, error: e && e.message };
  }
};