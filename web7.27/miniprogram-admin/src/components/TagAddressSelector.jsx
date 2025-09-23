import React, { useState, useEffect } from 'react';

// 中国省市区数据（简化版）
const regionData = {
  provinces: [
    { code: '110000', name: '北京市' },
    { code: '120000', name: '天津市' },
    { code: '130000', name: '河北省' },
    { code: '140000', name: '山西省' },
    { code: '150000', name: '内蒙古自治区' },
    { code: '210000', name: '辽宁省' },
    { code: '220000', name: '吉林省' },
    { code: '230000', name: '黑龙江省' },
    { code: '310000', name: '上海市' },
    { code: '320000', name: '江苏省' },
    { code: '330000', name: '浙江省' },
    { code: '340000', name: '安徽省' },
    { code: '350000', name: '福建省' },
    { code: '360000', name: '江西省' },
    { code: '370000', name: '山东省' },
    { code: '410000', name: '河南省' },
    { code: '420000', name: '湖北省' },
    { code: '430000', name: '湖南省' },
    { code: '440000', name: '广东省' },
    { code: '450000', name: '广西壮族自治区' },
    { code: '460000', name: '海南省' },
    { code: '500000', name: '重庆市' },
    { code: '510000', name: '四川省' },
    { code: '520000', name: '贵州省' },
    { code: '530000', name: '云南省' },
    { code: '540000', name: '西藏自治区' },
    { code: '610000', name: '陕西省' },
    { code: '620000', name: '甘肃省' },
    { code: '630000', name: '青海省' },
    { code: '640000', name: '宁夏回族自治区' },
    { code: '650000', name: '新疆维吾尔自治区' }
  ],
  cities: {
    '110000': [{ code: '110100', name: '北京市' }],
    '120000': [{ code: '120100', name: '天津市' }],
    '130000': [
      { code: '130100', name: '石家庄市' },
      { code: '130200', name: '唐山市' },
      { code: '130300', name: '秦皇岛市' },
      { code: '130400', name: '邯郸市' },
      { code: '130500', name: '邢台市' },
      { code: '130600', name: '保定市' },
      { code: '130700', name: '张家口市' },
      { code: '130800', name: '承德市' },
      { code: '130900', name: '沧州市' },
      { code: '131000', name: '廊坊市' },
      { code: '131100', name: '衡水市' }
    ],
    '140000': [
      { code: '140100', name: '太原市' },
      { code: '140200', name: '大同市' },
      { code: '140300', name: '阳泉市' },
      { code: '140400', name: '长治市' },
      { code: '140500', name: '晋城市' },
      { code: '140600', name: '朔州市' },
      { code: '140700', name: '晋中市' },
      { code: '140800', name: '运城市' },
      { code: '140900', name: '忻州市' },
      { code: '141000', name: '临汾市' },
      { code: '141100', name: '吕梁市' }
    ],
    '150000': [
      { code: '150100', name: '呼和浩特市' },
      { code: '150200', name: '包头市' },
      { code: '150300', name: '乌海市' },
      { code: '150400', name: '赤峰市' },
      { code: '150500', name: '通辽市' },
      { code: '150600', name: '鄂尔多斯市' },
      { code: '150700', name: '呼伦贝尔市' },
      { code: '150800', name: '巴彦淖尔市' },
      { code: '150900', name: '乌兰察布市' },
      { code: '152200', name: '兴安盟' },
      { code: '152500', name: '锡林郭勒盟' },
      { code: '152900', name: '阿拉善盟' }
    ],
    '210000': [
      { code: '210100', name: '沈阳市' },
      { code: '210200', name: '大连市' },
      { code: '210300', name: '鞍山市' },
      { code: '210400', name: '抚顺市' },
      { code: '210500', name: '本溪市' },
      { code: '210600', name: '丹东市' },
      { code: '210700', name: '锦州市' },
      { code: '210800', name: '营口市' },
      { code: '210900', name: '阜新市' },
      { code: '211000', name: '辽阳市' },
      { code: '211100', name: '盘锦市' },
      { code: '211200', name: '铁岭市' },
      { code: '211300', name: '朝阳市' },
      { code: '211400', name: '葫芦岛市' }
    ],
    '220000': [
      { code: '220100', name: '长春市' },
      { code: '220200', name: '吉林市' },
      { code: '220300', name: '四平市' },
      { code: '220400', name: '辽源市' },
      { code: '220500', name: '通化市' },
      { code: '220600', name: '白山市' },
      { code: '220700', name: '松原市' },
      { code: '220800', name: '白城市' },
      { code: '222400', name: '延边朝鲜族自治州' }
    ],
    '230000': [
      { code: '230100', name: '哈尔滨市' },
      { code: '230200', name: '齐齐哈尔市' },
      { code: '230300', name: '鸡西市' },
      { code: '230400', name: '鹤岗市' },
      { code: '230500', name: '双鸭山市' },
      { code: '230600', name: '大庆市' },
      { code: '230700', name: '伊春市' },
      { code: '230800', name: '佳木斯市' },
      { code: '230900', name: '七台河市' },
      { code: '231000', name: '牡丹江市' },
      { code: '231100', name: '黑河市' },
      { code: '231200', name: '绥化市' },
      { code: '232700', name: '大兴安岭地区' }
    ],
    '310000': [{ code: '310100', name: '上海市' }],
    '320000': [
      { code: '320100', name: '南京市' },
      { code: '320200', name: '无锡市' },
      { code: '320300', name: '徐州市' },
      { code: '320400', name: '常州市' },
      { code: '320500', name: '苏州市' },
      { code: '320600', name: '南通市' },
      { code: '320700', name: '连云港市' },
      { code: '320800', name: '淮安市' },
      { code: '320900', name: '盐城市' },
      { code: '321000', name: '扬州市' },
      { code: '321100', name: '镇江市' },
      { code: '321200', name: '泰州市' },
      { code: '321300', name: '宿迁市' }
    ],
    '330000': [
      { code: '330100', name: '杭州市' },
      { code: '330200', name: '宁波市' },
      { code: '330300', name: '温州市' },
      { code: '330400', name: '嘉兴市' },
      { code: '330500', name: '湖州市' },
      { code: '330600', name: '绍兴市' },
      { code: '330700', name: '金华市' },
      { code: '330800', name: '衢州市' },
      { code: '330900', name: '舟山市' },
      { code: '331000', name: '台州市' },
      { code: '331100', name: '丽水市' }
    ],
    '340000': [
      { code: '340100', name: '合肥市' },
      { code: '340200', name: '芜湖市' },
      { code: '340300', name: '蚌埠市' },
      { code: '340400', name: '淮南市' },
      { code: '340500', name: '马鞍山市' },
      { code: '340600', name: '淮北市' },
      { code: '340700', name: '铜陵市' },
      { code: '340800', name: '安庆市' },
      { code: '341000', name: '黄山市' },
      { code: '341100', name: '滁州市' },
      { code: '341200', name: '阜阳市' },
      { code: '341300', name: '宿州市' },
      { code: '341500', name: '六安市' },
      { code: '341600', name: '亳州市' },
      { code: '341700', name: '池州市' },
      { code: '341800', name: '宣城市' }
    ],
    '350000': [
      { code: '350100', name: '福州市' },
      { code: '350200', name: '厦门市' },
      { code: '350300', name: '莆田市' },
      { code: '350400', name: '三明市' },
      { code: '350500', name: '泉州市' },
      { code: '350600', name: '漳州市' },
      { code: '350700', name: '南平市' },
      { code: '350800', name: '龙岩市' },
      { code: '350900', name: '宁德市' }
    ],
    '360000': [
      { code: '360100', name: '南昌市' },
      { code: '360200', name: '景德镇市' },
      { code: '360300', name: '萍乡市' },
      { code: '360400', name: '九江市' },
      { code: '360500', name: '新余市' },
      { code: '360600', name: '鹰潭市' },
      { code: '360700', name: '赣州市' },
      { code: '360800', name: '吉安市' },
      { code: '360900', name: '宜春市' },
      { code: '361000', name: '抚州市' },
      { code: '361100', name: '上饶市' }
    ],
    '370000': [
      { code: '370100', name: '济南市' },
      { code: '370200', name: '青岛市' },
      { code: '370300', name: '淄博市' },
      { code: '370400', name: '枣庄市' },
      { code: '370500', name: '东营市' },
      { code: '370600', name: '烟台市' },
      { code: '370700', name: '潍坊市' },
      { code: '370800', name: '济宁市' },
      { code: '370900', name: '泰安市' },
      { code: '371000', name: '威海市' },
      { code: '371100', name: '日照市' },
      { code: '371200', name: '莱芜市' },
      { code: '371300', name: '临沂市' },
      { code: '371400', name: '德州市' },
      { code: '371500', name: '聊城市' },
      { code: '371600', name: '滨州市' },
      { code: '371700', name: '菏泽市' }
    ],
    '410000': [
      { code: '410100', name: '郑州市' },
      { code: '410200', name: '开封市' },
      { code: '410300', name: '洛阳市' },
      { code: '410400', name: '平顶山市' },
      { code: '410500', name: '安阳市' },
      { code: '410600', name: '鹤壁市' },
      { code: '410700', name: '新乡市' },
      { code: '410800', name: '焦作市' },
      { code: '410900', name: '濮阳市' },
      { code: '411000', name: '许昌市' },
      { code: '411100', name: '漯河市' },
      { code: '411200', name: '三门峡市' },
      { code: '411300', name: '南阳市' },
      { code: '411400', name: '商丘市' },
      { code: '411500', name: '信阳市' },
      { code: '411600', name: '周口市' },
      { code: '411700', name: '驻马店市' },
      { code: '419001', name: '济源市' }
    ],
    '420000': [
      { code: '420100', name: '武汉市' },
      { code: '420200', name: '黄石市' },
      { code: '420300', name: '十堰市' },
      { code: '420500', name: '宜昌市' },
      { code: '420600', name: '襄阳市' },
      { code: '420700', name: '鄂州市' },
      { code: '420800', name: '荆门市' },
      { code: '420900', name: '孝感市' },
      { code: '421000', name: '荆州市' },
      { code: '421100', name: '黄冈市' },
      { code: '421200', name: '咸宁市' },
      { code: '421300', name: '随州市' },
      { code: '422800', name: '恩施土家族苗族自治州' },
      { code: '429004', name: '仙桃市' },
      { code: '429005', name: '潜江市' },
      { code: '429006', name: '天门市' },
      { code: '429021', name: '神农架林区' }
    ],
    '430000': [
      { code: '430100', name: '长沙市' },
      { code: '430200', name: '株洲市' },
      { code: '430300', name: '湘潭市' },
      { code: '430400', name: '衡阳市' },
      { code: '430500', name: '邵阳市' },
      { code: '430600', name: '岳阳市' },
      { code: '430700', name: '常德市' },
      { code: '430800', name: '张家界市' },
      { code: '430900', name: '益阳市' },
      { code: '431000', name: '郴州市' },
      { code: '431100', name: '永州市' },
      { code: '431200', name: '怀化市' },
      { code: '431300', name: '娄底市' },
      { code: '433100', name: '湘西土家族苗族自治州' }
    ],
    '440000': [
      { code: '440100', name: '广州市' },
      { code: '440200', name: '韶关市' },
      { code: '440300', name: '深圳市' },
      { code: '440400', name: '珠海市' },
      { code: '440500', name: '汕头市' },
      { code: '440600', name: '佛山市' },
      { code: '440700', name: '江门市' },
      { code: '440800', name: '湛江市' },
      { code: '440900', name: '茂名市' },
      { code: '441200', name: '肇庆市' },
      { code: '441300', name: '惠州市' },
      { code: '441400', name: '梅州市' },
      { code: '441500', name: '汕尾市' },
      { code: '441600', name: '河源市' },
      { code: '441700', name: '阳江市' },
      { code: '441800', name: '清远市' },
      { code: '441900', name: '东莞市' },
      { code: '442000', name: '中山市' },
      { code: '445100', name: '潮州市' },
      { code: '445200', name: '揭阳市' },
      { code: '445300', name: '云浮市' }
    ],
    '450000': [
      { code: '450100', name: '南宁市' },
      { code: '450200', name: '柳州市' },
      { code: '450300', name: '桂林市' },
      { code: '450400', name: '梧州市' },
      { code: '450500', name: '北海市' },
      { code: '450600', name: '防城港市' },
      { code: '450700', name: '钦州市' },
      { code: '450800', name: '贵港市' },
      { code: '450900', name: '玉林市' },
      { code: '451000', name: '百色市' },
      { code: '451100', name: '河池市' },
      { code: '451200', name: '来宾市' },
      { code: '451300', name: '崇左市' }
    ],
    '460000': [
      { code: '460100', name: '海口市' },
      { code: '460200', name: '三亚市' },
      { code: '460300', name: '三沙市' },
      { code: '460400', name: '儋州市' },
      { code: '469001', name: '五指山市' },
      { code: '469002', name: '琼海市' },
      { code: '469005', name: '文昌市' },
      { code: '469006', name: '万宁市' },
      { code: '469007', name: '东方市' },
      { code: '469021', name: '定安县' },
      { code: '469022', name: '屯昌县' },
      { code: '469023', name: '澄迈县' },
      { code: '469024', name: '临高县' },
      { code: '469025', name: '白沙黎族自治县' },
      { code: '469026', name: '昌江黎族自治县' },
      { code: '469027', name: '乐东黎族自治县' },
      { code: '469028', name: '陵水黎族自治县' },
      { code: '469029', name: '保亭黎族苗族自治县' },
      { code: '469030', name: '琼中黎族苗族自治县' }
    ],
    '500000': [{ code: '500100', name: '重庆市' }],
    '510000': [
      { code: '510100', name: '成都市' },
      { code: '510300', name: '自贡市' },
      { code: '510400', name: '攀枝花市' },
      { code: '510500', name: '泸州市' },
      { code: '510600', name: '德阳市' },
      { code: '510700', name: '绵阳市' },
      { code: '510800', name: '广元市' },
      { code: '510900', name: '遂宁市' },
      { code: '511000', name: '内江市' },
      { code: '511100', name: '乐山市' },
      { code: '511300', name: '南充市' },
      { code: '511400', name: '眉山市' },
      { code: '511500', name: '宜宾市' },
      { code: '511600', name: '广安市' },
      { code: '511700', name: '达州市' },
      { code: '511800', name: '雅安市' },
      { code: '511900', name: '巴中市' },
      { code: '512000', name: '资阳市' },
      { code: '513200', name: '阿坝藏族羌族自治州' },
      { code: '513300', name: '甘孜藏族自治州' },
      { code: '513400', name: '凉山彝族自治州' }
    ],
    '520000': [
      { code: '520100', name: '贵阳市' },
      { code: '520200', name: '六盘水市' },
      { code: '520300', name: '遵义市' },
      { code: '520400', name: '安顺市' },
      { code: '520500', name: '毕节市' },
      { code: '520600', name: '铜仁市' },
      { code: '522300', name: '黔西南布依族苗族自治州' },
      { code: '522600', name: '黔东南苗族侗族自治州' },
      { code: '522700', name: '黔南布依族苗族自治州' }
    ],
    '530000': [
      { code: '530100', name: '昆明市' },
      { code: '530300', name: '曲靖市' },
      { code: '530400', name: '玉溪市' },
      { code: '530500', name: '保山市' },
      { code: '530600', name: '昭通市' },
      { code: '530700', name: '丽江市' },
      { code: '530800', name: '普洱市' },
      { code: '530900', name: '临沧市' },
      { code: '532300', name: '楚雄彝族自治州' },
      { code: '532500', name: '红河哈尼族彝族自治州' },
      { code: '532600', name: '文山壮族苗族自治州' },
      { code: '532800', name: '西双版纳傣族自治州' },
      { code: '532900', name: '大理白族自治州' },
      { code: '533100', name: '德宏傣族景颇族自治州' },
      { code: '533300', name: '怒江傈僳族自治州' },
      { code: '533400', name: '迪庆藏族自治州' }
    ],
    '540000': [
      { code: '540100', name: '拉萨市' },
      { code: '540200', name: '日喀则市' },
      { code: '540300', name: '昌都市' },
      { code: '540400', name: '林芝市' },
      { code: '540500', name: '山南市' },
      { code: '540600', name: '那曲市' },
      { code: '542500', name: '阿里地区' }
    ],
    '610000': [
      { code: '610100', name: '西安市' },
      { code: '610200', name: '铜川市' },
      { code: '610300', name: '宝鸡市' },
      { code: '610400', name: '咸阳市' },
      { code: '610500', name: '渭南市' },
      { code: '610600', name: '延安市' },
      { code: '610700', name: '汉中市' },
      { code: '610800', name: '榆林市' },
      { code: '610900', name: '安康市' },
      { code: '611000', name: '商洛市' }
    ],
    '620000': [
      { code: '620100', name: '兰州市' },
      { code: '620200', name: '嘉峪关市' },
      { code: '620300', name: '金昌市' },
      { code: '620400', name: '白银市' },
      { code: '620500', name: '天水市' },
      { code: '620600', name: '武威市' },
      { code: '620700', name: '张掖市' },
      { code: '620800', name: '平凉市' },
      { code: '620900', name: '庆阳市' },
      { code: '621000', name: '定西市' },
      { code: '621100', name: '陇南市' },
      { code: '622900', name: '临夏回族自治州' },
      { code: '623000', name: '甘南藏族自治州' }
    ],
    '630000': [
      { code: '630100', name: '西宁市' },
      { code: '630200', name: '海东市' },
      { code: '632200', name: '海北藏族自治州' },
      { code: '632300', name: '黄南藏族自治州' },
      { code: '632500', name: '海南藏族自治州' },
      { code: '632600', name: '果洛藏族自治州' },
      { code: '632700', name: '玉树藏族自治州' },
      { code: '632800', name: '海西蒙古族藏族自治州' }
    ],
    '640000': [
      { code: '640100', name: '银川市' },
      { code: '640200', name: '石嘴山市' },
      { code: '640300', name: '吴忠市' },
      { code: '640400', name: '固原市' },
      { code: '640500', name: '中卫市' }
    ],
    '650000': [
      { code: '650100', name: '乌鲁木齐市' },
      { code: '650200', name: '克拉玛依市' },
      { code: '650400', name: '吐鲁番市' },
      { code: '650500', name: '哈密市' },
      { code: '652300', name: '昌吉回族自治州' },
      { code: '652700', name: '博尔塔拉蒙古自治州' },
      { code: '652800', name: '巴音郭楞蒙古自治州' },
      { code: '652900', name: '阿克苏地区' },
      { code: '653000', name: '克孜勒苏柯尔克孜自治州' },
      { code: '653100', name: '喀什地区' },
      { code: '653200', name: '和田地区' },
      { code: '654000', name: '伊犁哈萨克自治州' },
      { code: '654200', name: '塔城地区' },
      { code: '654300', name: '阿勒泰地区' },
      { code: '659001', name: '石河子市' },
      { code: '659002', name: '阿拉尔市' },
      { code: '659003', name: '图木舒克市' },
      { code: '659004', name: '五家渠市' },
      { code: '659005', name: '北屯市' },
      { code: '659006', name: '铁门关市' },
      { code: '659007', name: '双河市' },
      { code: '659008', name: '可克达拉市' },
      { code: '659009', name: '昆玉市' },
      { code: '659010', name: '胡杨河市' }
    ]
  },
  districts: {
    '110100': [
      { code: '110101', name: '东城区' },
      { code: '110102', name: '西城区' },
      { code: '110105', name: '朝阳区' },
      { code: '110106', name: '丰台区' },
      { code: '110107', name: '石景山区' },
      { code: '110108', name: '海淀区' },
      { code: '110109', name: '门头沟区' },
      { code: '110111', name: '房山区' },
      { code: '110112', name: '通州区' },
      { code: '110113', name: '顺义区' },
      { code: '110114', name: '昌平区' },
      { code: '110115', name: '大兴区' },
      { code: '110116', name: '怀柔区' },
      { code: '110117', name: '平谷区' },
      { code: '110118', name: '密云区' },
      { code: '110119', name: '延庆区' }
    ],
    '310100': [
      { code: '310101', name: '黄浦区' },
      { code: '310104', name: '徐汇区' },
      { code: '310105', name: '长宁区' },
      { code: '310106', name: '静安区' },
      { code: '310107', name: '普陀区' },
      { code: '310109', name: '虹口区' },
      { code: '310110', name: '杨浦区' },
      { code: '310112', name: '闵行区' },
      { code: '310113', name: '宝山区' },
      { code: '310114', name: '嘉定区' },
      { code: '310115', name: '浦东新区' },
      { code: '310116', name: '金山区' },
      { code: '310117', name: '松江区' },
      { code: '310118', name: '青浦区' },
      { code: '310120', name: '奉贤区' },
      { code: '310151', name: '崇明区' }
    ],
    '440100': [
      { code: '440103', name: '荔湾区' },
      { code: '440104', name: '越秀区' },
      { code: '440105', name: '海珠区' },
      { code: '440106', name: '天河区' },
      { code: '440111', name: '白云区' },
      { code: '440112', name: '黄埔区' },
      { code: '440113', name: '番禺区' },
      { code: '440114', name: '花都区' },
      { code: '440115', name: '南沙区' },
      { code: '440117', name: '从化区' },
      { code: '440118', name: '增城区' }
    ],
    '440300': [
      { code: '440303', name: '罗湖区' },
      { code: '440304', name: '福田区' },
      { code: '440305', name: '南山区' },
      { code: '440306', name: '宝安区' },
      { code: '440307', name: '龙岗区' },
      { code: '440308', name: '盐田区' },
      { code: '440309', name: '龙华区' },
      { code: '440310', name: '坪山区' },
      { code: '440311', name: '光明区' }
    ],
    '460100': [
      { code: '460105', name: '秀英区' },
      { code: '460106', name: '龙华区' },
      { code: '460107', name: '琼山区' },
      { code: '460108', name: '美兰区' }
    ]
  }
};

const TagAddressSelector = ({ value, onChange, placeholder = "请选择省市区" }) => {
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // 获取当前选中的城市列表
  const currentCities = selectedProvince ? regionData.cities[selectedProvince] || [] : [];
  
  // 获取当前选中的区县列表
  const currentDistricts = selectedCity ? regionData.districts[selectedCity] || [] : [];

  // 获取显示文本
  const getDisplayText = () => {
    if (!selectedProvince) return placeholder;
    
    const province = regionData.provinces.find(p => p.code === selectedProvince);
    if (!province) return placeholder;
    
    let text = province.name;
    
    if (selectedCity) {
      const city = currentCities.find(c => c.code === selectedCity);
      if (city) {
        text += ` ${city.name}`;
        
        if (selectedDistrict) {
          const district = currentDistricts.find(d => d.code === selectedDistrict);
          if (district) {
            text += ` ${district.name}`;
          }
        }
      }
    }
    
    return text;
  };

  // 处理选择变化
  const handleProvinceChange = (provinceCode) => {
    setSelectedProvince(provinceCode);
    setSelectedCity('');
    setSelectedDistrict('');
    
    const province = regionData.provinces.find(p => p.code === provinceCode);
    if (province) {
      const newValue = [province.name];
      onChange(newValue);
    }
  };

  const handleCityChange = (cityCode) => {
    setSelectedCity(cityCode);
    setSelectedDistrict('');
    
    const province = regionData.provinces.find(p => p.code === selectedProvince);
    const city = currentCities.find(c => c.code === cityCode);
    if (province && city) {
      const newValue = [province.name, city.name];
      onChange(newValue);
    }
  };

  const handleDistrictChange = (districtCode) => {
    setSelectedDistrict(districtCode);
    
    const province = regionData.provinces.find(p => p.code === selectedProvince);
    const city = currentCities.find(c => c.code === selectedCity);
    const district = currentDistricts.find(d => d.code === districtCode);
    
    if (province && city && district) {
      const newValue = [province.name, city.name, district.name];
      onChange(newValue);
    }
  };

  // 清除选择
  const handleClear = () => {
    setSelectedProvince('');
    setSelectedCity('');
    setSelectedDistrict('');
    onChange([]);
  };

  // 初始化
  useEffect(() => {
    if (value && Array.isArray(value) && value.length >= 1) {
      const [provinceName, cityName, districtName] = value;
      
      const province = regionData.provinces.find(p => p.name === provinceName);
      if (province) {
        setSelectedProvince(province.code);
        
        if (cityName) {
          const cities = regionData.cities[province.code] || [];
          const city = cities.find(c => c.name === cityName);
          if (city) {
            setSelectedCity(city.code);
            
            if (districtName) {
              const districts = regionData.districts[city.code] || [];
              const district = districts.find(d => d.name === districtName);
              if (district) {
                setSelectedDistrict(district.code);
              }
            }
          }
        }
      }
    }
  }, [value]);

  return (
    <div className="space-y-3">
      {/* 显示选中的标签 */}
      <div className="flex flex-wrap gap-2">
        {selectedProvince && (
          <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            <span>{regionData.provinces.find(p => p.code === selectedProvince)?.name}</span>
            <button
              onClick={() => handleProvinceChange('')}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </div>
        )}
        
        {selectedCity && (
          <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            <span>{currentCities.find(c => c.code === selectedCity)?.name}</span>
            <button
              onClick={() => handleCityChange('')}
              className="ml-2 text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        )}
        
        {selectedDistrict && (
          <div className="flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
            <span>{currentDistricts.find(d => d.code === selectedDistrict)?.name}</span>
            <button
              onClick={() => handleDistrictChange('')}
              className="ml-2 text-purple-600 hover:text-purple-800"
            >
              ×
            </button>
          </div>
        )}
        
        {!selectedProvince && (
          <div className="text-gray-500 text-sm py-1">{placeholder}</div>
        )}
      </div>

      {/* 选择器 */}
      <div className="space-y-4">
        {/* 省份选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">选择省份</label>
          <div className="flex flex-wrap gap-2">
            {regionData.provinces.map(province => (
              <button
                key={province.code}
                className={`px-3 py-2 text-sm rounded-full border transition-colors ${
                  selectedProvince === province.code
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleProvinceChange(province.code)}
              >
                {province.name}
              </button>
            ))}
          </div>
        </div>

        {/* 城市选择 */}
        {selectedProvince && currentCities.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择城市</label>
            <div className="flex flex-wrap gap-2">
              {currentCities.map(city => (
                <button
                  key={city.code}
                  className={`px-3 py-2 text-sm rounded-full border transition-colors ${
                    selectedCity === city.code
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleCityChange(city.code)}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 区县选择 */}
        {selectedCity && currentDistricts.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择区县</label>
            <div className="flex flex-wrap gap-2">
              {currentDistricts.map(district => (
                <button
                  key={district.code}
                  className={`px-3 py-2 text-sm rounded-full border transition-colors ${
                    selectedDistrict === district.code
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleDistrictChange(district.code)}
                >
                  {district.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 清除按钮 */}
      {selectedProvince && (
        <div className="pt-2">
          <button
            onClick={handleClear}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            清除所有选择
          </button>
        </div>
      )}
    </div>
  );
};

export default TagAddressSelector;
