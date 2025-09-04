// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 读取或初始化等级配置
async function ensureLevelConfig() {
  const coll = db.collection('level_config')
  const { data } = await coll.where({}).orderBy('exp_required', 'asc').get()
  if (data && data.length > 0) {
    return data
  }

  // 默认等级配置（可后续在控制台修改）：0/100/300/800/1600
  const defaults = [
    { level: 0, name: '普通会员', exp_required: 0, benefits: [{ id: 'b0-1', name: '基础会员权益' }] },
    { level: 1, name: '新晋养鸭人', exp_required: 100, benefits: [{ id: 'b1-1', name: '会员专享优惠券' }] },
    { level: 2, name: '资深养鸭人', exp_required: 300, benefits: [{ id: 'b2-1', name: '饮品会员折扣' }] },
    { level: 3, name: '大师养鸭人', exp_required: 800, benefits: [{ id: 'b3-1', name: '会员积分翻倍' }] },
    { level: 4, name: '传奇养鸭人', exp_required: 1600, benefits: [{ id: 'b4-1', name: '生日会员特权' }] }
  ]

  // 批量写入
  const batch = defaults.map(doc => coll.add({ data: { ...doc, createdAt: new Date() } }))
  await Promise.all(batch)

  const { data: reloaded } = await coll.where({}).orderBy('exp_required', 'asc').get()
  return reloaded
}

// 根据经验计算等级与下一等级阈值
function computeLevelByExp(exp, configs) {
  if (!Array.isArray(configs) || configs.length === 0) {
    return { level: 0, levelName: '普通会员', nextLevelExp: 0, benefits: [] }
  }
  // 按 exp_required 升序
  const sorted = configs.slice().sort((a, b) => (a.exp_required || 0) - (b.exp_required || 0))
  let current = sorted[0]
  for (const cfg of sorted) {
    if ((cfg.exp_required || 0) <= (exp || 0)) {
      current = cfg
    } else {
      break
    }
  }
  const idx = sorted.findIndex(c => c.level === current.level)
  const next = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null
  return {
    level: current.level || 0,
    levelName: current.name || '普通会员',
    nextLevelExp: next ? (next.exp_required || 0) : (current.exp_required || 0),
    benefits: Array.isArray(current.benefits) ? current.benefits : []
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { OPENID } = cloud.getWXContext()

    if (!OPENID) {
      return { ok: false, message: '用户未登录', data: null }
    }

    // 读取 users 基础信息
    const userDoc = await db.collection('users').where({ _openid: OPENID }).get()
    const base = userDoc.data && userDoc.data.length ? userDoc.data[0] : {}

    // 等级配置 + 计算进度
    const levelConfigs = await ensureLevelConfig()
    const vipExp = base.vipExp || 0
    const levelCalc = computeLevelByExp(vipExp, levelConfigs)

    const profile = {
      nickName: base.nickName || '',
      avatarUrl: base.avatarUrl || '',
      vipLevel: levelCalc.level, // 使用配置计算得到的等级
      vipExp: vipExp,
      nextLevelExp: levelCalc.nextLevelExp,
      levelName: levelCalc.levelName
    }

    const assets = {
      points: base.points || 0,
      balance: base.balance || 0,
      coupons: 0 // 下方统计
    }

    // 优惠券数量统计：未使用 + 模板有效 + 未过期(或永不过期)
    let couponCount = 0
    try {
      const now = new Date()
      const agg = await db.collection('user_coupons')
        .aggregate()
        .match({ _openid: OPENID, status: 'unused' })
        .lookup({ from: 'mall_coupons', localField: 'couponId', foreignField: '_id', as: 'couponTemplate' })
        .match({
          'couponTemplate.status': 'active',
          $or: [
            { 'couponTemplate.endTime': null },
            { 'couponTemplate.endTime': _.gte(now) }
          ]
        })
        .count('total')
        .end()
      couponCount = agg.list && agg.list.length > 0 ? agg.list[0].total : 0
    } catch (e) {
      console.error('coupon aggregate error', e)
    }
    assets.coupons = couponCount

    // 权益：来自当前等级配置（若无配置则回退占位）
    const benefits = {
      items: (levelCalc.benefits && levelCalc.benefits.length)
        ? levelCalc.benefits.map((b, i) => ({ id: b.id || `cfg-${levelCalc.level}-${i}`, name: b.name || '会员权益' }))
        : [
            { id: 1, name: '会员专享优惠券' },
            { id: 2, name: '饮品会员折扣' },
            { id: 3, name: '会员积分翻倍' }
          ]
    }

    return { ok: true, data: { profile, assets, benefits } }
  } catch (err) {
    console.error('getMemberSummary error', err)
    return { ok: false, message: err.message || '服务异常', data: null }
  }
} 