import React, { useState } from 'react';

const AddressRecognizer = ({ onRecognize, onClear }) => {
  const [inputText, setInputText] = useState('');
  const [recognizedData, setRecognizedData] = useState(null);
  const [isRecognizing, setIsRecognizing] = useState(false);

  // 姓名识别正则表达式
  const namePatterns = [
    /^([^\d\s]{2,4})\s/,  // 开头2-4个非数字非空格字符
    /^([^\d\s]{2,4})[\s\n]/,  // 开头2-4个非数字非空格字符，后跟空格或换行
    /^([^\d\s]{2,4})[，,]\s*/,  // 开头2-4个非数字非空格字符，后跟逗号
    /^([^\d\s]{2,4})：/,  // 开头2-4个非数字非空格字符，后跟冒号
  ];

  // 电话识别正则表达式
  const phonePatterns = [
    /1[3-9]\d{9}/g,  // 手机号
    /0\d{2,3}-?\d{7,8}/g,  // 座机号
    /400-?\d{3}-?\d{4}/g,  // 400电话
    /\(\d{3,4}\)\d{7,8}/g,  // 带区号的座机
  ];

  // 地址识别正则表达式
  const addressPatterns = [
    // 完整格式：省市区详细地址
    /^(.{2,6}?[省市])(.{2,6}?[市])(.{2,6}?[区县])(.+)$/,
    // 省市格式：省市详细地址
    /^(.{2,6}?[省市])(.{2,6}?[市])(.+)$/,
    // 省份格式：省详细地址
    /^(.{2,6}?[省市])(.+)$/,
    // 城市区县格式：市区详细地址
    /^(.{2,6}?[市])(.{2,6}?[区县])(.+)$/,
  ];

  // 省份和城市数据
  const provinces = [
    '北京', '天津', '上海', '重庆', '河北', '山西', '辽宁', '吉林', '黑龙江',
    '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南',
    '广东', '广西', '海南', '四川', '贵州', '云南', '西藏', '陕西', '甘肃',
    '青海', '宁夏', '新疆', '内蒙古', '香港', '澳门', '台湾'
  ];

  // 省份简称到完整名称的映射
  const provinceNameMap = {
    '北京': '北京市',
    '天津': '天津市',
    '上海': '上海市',
    '重庆': '重庆市',
    '河北': '河北省',
    '山西': '山西省',
    '辽宁': '辽宁省',
    '吉林': '吉林省',
    '黑龙江': '黑龙江省',
    '江苏': '江苏省',
    '浙江': '浙江省',
    '安徽': '安徽省',
    '福建': '福建省',
    '江西': '江西省',
    '山东': '山东省',
    '河南': '河南省',
    '湖北': '湖北省',
    '湖南': '湖南省',
    '广东': '广东省',
    '广西': '广西壮族自治区',
    '海南': '海南省',
    '四川': '四川省',
    '贵州': '贵州省',
    '云南': '云南省',
    '西藏': '西藏自治区',
    '陕西': '陕西省',
    '甘肃': '甘肃省',
    '青海': '青海省',
    '宁夏': '宁夏回族自治区',
    '新疆': '新疆维吾尔自治区',
    '内蒙古': '内蒙古自治区',
    '香港': '香港特别行政区',
    '澳门': '澳门特别行政区',
    '台湾': '台湾省'
  };

  // 城市到省份的映射
  const cityToProvince = {
    // 直辖市
    '北京': '北京',
    '天津': '天津', 
    '上海': '上海',
    '重庆': '重庆',
    
    // 河北省
    '石家庄': '河北', '唐山': '河北', '秦皇岛': '河北', '邯郸': '河北', '邢台': '河北', 
    '保定': '河北', '张家口': '河北', '承德': '河北', '沧州': '河北', '廊坊': '河北', '衡水': '河北',
    
    // 山西省
    '太原': '山西', '大同': '山西', '阳泉': '山西', '长治': '山西', '晋城': '山西', 
    '朔州': '山西', '晋中': '山西', '运城': '山西', '忻州': '山西', '临汾': '山西', '吕梁': '山西',
    
    // 辽宁省
    '沈阳': '辽宁', '大连': '辽宁', '鞍山': '辽宁', '抚顺': '辽宁', '本溪': '辽宁', 
    '丹东': '辽宁', '锦州': '辽宁', '营口': '辽宁', '阜新': '辽宁', '辽阳': '辽宁', 
    '盘锦': '辽宁', '铁岭': '辽宁', '朝阳': '辽宁', '葫芦岛': '辽宁',
    
    // 吉林省
    '长春': '吉林', '吉林': '吉林', '四平': '吉林', '辽源': '吉林', '通化': '吉林', 
    '白山': '吉林', '松原': '吉林', '白城': '吉林', '延边': '吉林',
    
    // 黑龙江省
    '哈尔滨': '黑龙江', '齐齐哈尔': '黑龙江', '鸡西': '黑龙江', '鹤岗': '黑龙江', '双鸭山': '黑龙江', 
    '大庆': '黑龙江', '伊春': '黑龙江', '佳木斯': '黑龙江', '七台河': '黑龙江', '牡丹江': '黑龙江', 
    '黑河': '黑龙江', '绥化': '黑龙江', '大兴安岭': '黑龙江',
    
    // 江苏省
    '南京': '江苏', '苏州': '江苏', '无锡': '江苏', '常州': '江苏', '南通': '江苏', 
    '扬州': '江苏', '镇江': '江苏', '泰州': '江苏', '盐城': '江苏', '淮安': '江苏', 
    '连云港': '江苏', '宿迁': '江苏', '徐州': '江苏',
    
    // 浙江省
    '杭州': '浙江', '温州': '浙江', '宁波': '浙江', '嘉兴': '浙江', '湖州': '浙江', 
    '绍兴': '浙江', '金华': '浙江', '衢州': '浙江', '舟山': '浙江', '台州': '浙江', '丽水': '浙江',
    
    // 安徽省
    '合肥': '安徽', '芜湖': '安徽', '蚌埠': '安徽', '淮南': '安徽', '马鞍山': '安徽', 
    '淮北': '安徽', '铜陵': '安徽', '安庆': '安徽', '黄山': '安徽', '滁州': '安徽', 
    '阜阳': '安徽', '宿州': '安徽', '六安': '安徽', '亳州': '安徽', '池州': '安徽', '宣城': '安徽',
    
    // 福建省
    '福州': '福建', '厦门': '福建', '莆田': '福建', '三明': '福建', '泉州': '福建', 
    '漳州': '福建', '南平': '福建', '龙岩': '福建', '宁德': '福建',
    
    // 江西省
    '南昌': '江西', '景德镇': '江西', '萍乡': '江西', '九江': '江西', '新余': '江西', 
    '鹰潭': '江西', '赣州': '江西', '吉安': '江西', '宜春': '江西', '抚州': '江西', '上饶': '江西',
    
    // 山东省
    '济南': '山东', '青岛': '山东', '烟台': '山东', '潍坊': '山东', '临沂': '山东', 
    '淄博': '山东', '济宁': '山东', '泰安': '山东', '威海': '山东', '德州': '山东', 
    '聊城': '山东', '滨州': '山东', '菏泽': '山东', '枣庄': '山东', '东营': '山东', '日照': '山东', '莱芜': '山东',
    
    // 河南省
    '郑州': '河南', '开封': '河南', '洛阳': '河南', '平顶山': '河南', '安阳': '河南', 
    '鹤壁': '河南', '新乡': '河南', '焦作': '河南', '濮阳': '河南', '许昌': '河南', 
    '漯河': '河南', '三门峡': '河南', '南阳': '河南', '商丘': '河南', '信阳': '河南', '周口': '河南', '驻马店': '河南', '济源': '河南',
    
    // 湖北省
    '武汉': '湖北', '黄石': '湖北', '十堰': '湖北', '宜昌': '湖北', '襄阳': '湖北', 
    '鄂州': '湖北', '荆门': '湖北', '孝感': '湖北', '荆州': '湖北', '黄冈': '湖北', 
    '咸宁': '湖北', '随州': '湖北', '恩施': '湖北', '仙桃': '湖北', '潜江': '湖北', '天门': '湖北', '神农架': '湖北',
    
    // 湖南省
    '长沙': '湖南', '株洲': '湖南', '湘潭': '湖南', '衡阳': '湖南', '邵阳': '湖南', 
    '岳阳': '湖南', '常德': '湖南', '张家界': '湖南', '益阳': '湖南', '郴州': '湖南', 
    '永州': '湖南', '怀化': '湖南', '娄底': '湖南', '湘西': '湖南',
    
    // 广东省
    '广州': '广东', '深圳': '广东', '佛山': '广东', '东莞': '广东', '中山': '广东', '珠海': '广东', 
    '江门': '广东', '湛江': '广东', '茂名': '广东', '肇庆': '广东', '惠州': '广东', '梅州': '广东', 
    '汕尾': '广东', '河源': '广东', '阳江': '广东', '清远': '广东', '韶关': '广东', '揭阳': '广东', '潮州': '广东', '云浮': '广东',
    
    // 广西壮族自治区
    '南宁': '广西', '柳州': '广西', '桂林': '广西', '梧州': '广西', '北海': '广西', 
    '防城港': '广西', '钦州': '广西', '贵港': '广西', '玉林': '广西', '百色': '广西', 
    '贺州': '广西', '河池': '广西', '来宾': '广西', '崇左': '广西',
    
    // 海南省
    '海口': '海南', '三亚': '海南', '三沙': '海南', '儋州': '海南', '五指山': '海南', 
    '琼海': '海南', '文昌': '海南', '万宁': '海南', '东方': '海南', '定安': '海南', 
    '屯昌': '海南', '澄迈': '海南', '临高': '海南', '白沙': '海南', '昌江': '海南', '乐东': '海南', '陵水': '海南', '保亭': '海南', '琼中': '海南',
    
    // 四川省
    '成都': '四川', '自贡': '四川', '攀枝花': '四川', '泸州': '四川', '德阳': '四川', 
    '绵阳': '四川', '广元': '四川', '遂宁': '四川', '内江': '四川', '乐山': '四川', 
    '南充': '四川', '眉山': '四川', '宜宾': '四川', '广安': '四川', '达州': '四川', '雅安': '四川', '巴中': '四川', '资阳': '四川', '阿坝': '四川', '甘孜': '四川', '凉山': '四川',
    
    // 贵州省
    '贵阳': '贵州', '六盘水': '贵州', '遵义': '贵州', '安顺': '贵州', '毕节': '贵州', 
    '铜仁': '贵州', '黔西南': '贵州', '黔东南': '贵州', '黔南': '贵州',
    
    // 云南省
    '昆明': '云南', '曲靖': '云南', '玉溪': '云南', '保山': '云南', '昭通': '云南', 
    '丽江': '云南', '普洱': '云南', '临沧': '云南', '楚雄': '云南', '红河': '云南', 
    '文山': '云南', '西双版纳': '云南', '大理': '云南', '德宏': '云南', '怒江': '云南', '迪庆': '云南',
    
    // 西藏自治区
    '拉萨': '西藏', '日喀则': '西藏', '昌都': '西藏', '林芝': '西藏', '山南': '西藏', 
    '那曲': '西藏', '阿里': '西藏',
    
    // 陕西省
    '西安': '陕西', '铜川': '陕西', '宝鸡': '陕西', '咸阳': '陕西', '渭南': '陕西', 
    '延安': '陕西', '汉中': '陕西', '榆林': '陕西', '安康': '陕西', '商洛': '陕西',
    
    // 甘肃省
    '兰州': '甘肃', '嘉峪关': '甘肃', '金昌': '甘肃', '白银': '甘肃', '天水': '甘肃', 
    '武威': '甘肃', '张掖': '甘肃', '平凉': '甘肃', '酒泉': '甘肃', '庆阳': '甘肃', 
    '定西': '甘肃', '陇南': '甘肃', '临夏': '甘肃', '甘南': '甘肃',
    
    // 青海省
    '西宁': '青海', '海东': '青海', '海北': '青海', '黄南': '青海', '海南': '青海', 
    '果洛': '青海', '玉树': '青海', '海西': '青海',
    
    // 宁夏回族自治区
    '银川': '宁夏', '石嘴山': '宁夏', '吴忠': '宁夏', '固原': '宁夏', '中卫': '宁夏',
    
    // 新疆维吾尔自治区
    '乌鲁木齐': '新疆', '克拉玛依': '新疆', '吐鲁番': '新疆', '哈密': '新疆', '昌吉': '新疆', 
    '博尔塔拉': '新疆', '巴音郭楞': '新疆', '阿克苏': '新疆', '克孜勒苏': '新疆', '喀什': '新疆', 
    '和田': '新疆', '伊犁': '新疆', '塔城': '新疆', '阿勒泰': '新疆', '石河子': '新疆', '阿拉尔': '新疆', 
    '图木舒克': '新疆', '五家渠': '新疆', '北屯': '新疆', '铁门关': '新疆', '双河': '新疆', '可克达拉': '新疆', '昆玉': '新疆', '胡杨河': '新疆',
    
    // 内蒙古自治区
    '呼和浩特': '内蒙古', '包头': '内蒙古', '乌海': '内蒙古', '赤峰': '内蒙古', '通辽': '内蒙古', 
    '鄂尔多斯': '内蒙古', '呼伦贝尔': '内蒙古', '巴彦淖尔': '内蒙古', '乌兰察布': '内蒙古', '兴安盟': '内蒙古', 
    '锡林郭勒盟': '内蒙古', '阿拉善盟': '内蒙古',
    
    // 香港、澳门、台湾
    '香港': '香港', '澳门': '澳门', '台北': '台湾', '高雄': '台湾', '台中': '台湾', '台南': '台湾', '新北': '台湾', '桃园': '台湾', '基隆': '台湾', '新竹': '台湾', '嘉义': '台湾'
  };

  const cities = [
    '北京', '天津', '上海', '重庆', '石家庄', '太原', '沈阳', '长春', '哈尔滨',
    '南京', '杭州', '合肥', '福州', '南昌', '济南', '郑州', '武汉', '长沙',
    '广州', '深圳', '南宁', '海口', '成都', '贵阳', '昆明', '拉萨', '西安',
    '兰州', '西宁', '银川', '乌鲁木齐', '呼和浩特',
    // 广东省城市
    '佛山', '东莞', '中山', '珠海', '江门', '湛江', '茂名', '肇庆', '惠州', '梅州', '汕尾', '河源', '阳江', '清远', '韶关', '揭阳', '潮州', '云浮',
    // 其他重要城市
    '苏州', '无锡', '常州', '南通', '扬州', '镇江', '泰州', '盐城', '淮安', '连云港', '宿迁', '徐州',
    '温州', '宁波', '嘉兴', '湖州', '绍兴', '金华', '衢州', '舟山', '台州', '丽水',
    '青岛', '烟台', '潍坊', '临沂', '淄博', '济宁', '泰安', '威海', '德州', '聊城', '滨州', '菏泽', '枣庄', '东营', '日照', '莱芜',
    '大连', '鞍山', '抚顺', '本溪', '丹东', '锦州', '营口', '阜新', '辽阳', '盘锦', '铁岭', '朝阳', '葫芦岛',
    '唐山', '秦皇岛', '邯郸', '邢台', '保定', '张家口', '承德', '沧州', '廊坊', '衡水',
    '太原', '大同', '阳泉', '长治', '晋城', '朔州', '晋中', '运城', '忻州', '临汾', '吕梁',
    '呼和浩特', '包头', '乌海', '赤峰', '通辽', '鄂尔多斯', '呼伦贝尔', '巴彦淖尔', '乌兰察布', '兴安盟', '锡林郭勒盟', '阿拉善盟',
    '长春', '吉林', '四平', '辽源', '通化', '白山', '松原', '白城', '延边',
    '哈尔滨', '齐齐哈尔', '鸡西', '鹤岗', '双鸭山', '大庆', '伊春', '佳木斯', '七台河', '牡丹江', '黑河', '绥化', '大兴安岭',
    '合肥', '芜湖', '蚌埠', '淮南', '马鞍山', '淮北', '铜陵', '安庆', '黄山', '滁州', '阜阳', '宿州', '六安', '亳州', '池州', '宣城',
    '福州', '厦门', '莆田', '三明', '泉州', '漳州', '南平', '龙岩', '宁德',
    '南昌', '景德镇', '萍乡', '九江', '新余', '鹰潭', '赣州', '吉安', '宜春', '抚州', '上饶',
    '郑州', '开封', '洛阳', '平顶山', '安阳', '鹤壁', '新乡', '焦作', '濮阳', '许昌', '漯河', '三门峡', '南阳', '商丘', '信阳', '周口', '驻马店', '济源',
    '武汉', '黄石', '十堰', '宜昌', '襄阳', '鄂州', '荆门', '孝感', '荆州', '黄冈', '咸宁', '随州', '恩施', '仙桃', '潜江', '天门', '神农架',
    '长沙', '株洲', '湘潭', '衡阳', '邵阳', '岳阳', '常德', '张家界', '益阳', '郴州', '永州', '怀化', '娄底', '湘西',
    '南宁', '柳州', '桂林', '梧州', '北海', '防城港', '钦州', '贵港', '玉林', '百色', '贺州', '河池', '来宾', '崇左',
    '海口', '三亚', '三沙', '儋州', '五指山', '琼海', '文昌', '万宁', '东方', '定安', '屯昌', '澄迈', '临高', '白沙', '昌江', '乐东', '陵水', '保亭', '琼中',
    '成都', '自贡', '攀枝花', '泸州', '德阳', '绵阳', '广元', '遂宁', '内江', '乐山', '南充', '眉山', '宜宾', '广安', '达州', '雅安', '巴中', '资阳', '阿坝', '甘孜', '凉山',
    '贵阳', '六盘水', '遵义', '安顺', '毕节', '铜仁', '黔西南', '黔东南', '黔南',
    '昆明', '曲靖', '玉溪', '保山', '昭通', '丽江', '普洱', '临沧', '楚雄', '红河', '文山', '西双版纳', '大理', '德宏', '怒江', '迪庆',
    '拉萨', '日喀则', '昌都', '林芝', '山南', '那曲', '阿里',
    '西安', '铜川', '宝鸡', '咸阳', '渭南', '延安', '汉中', '榆林', '安康', '商洛',
    '兰州', '嘉峪关', '金昌', '白银', '天水', '武威', '张掖', '平凉', '酒泉', '庆阳', '定西', '陇南', '临夏', '甘南',
    '西宁', '海东', '海北', '黄南', '海南', '果洛', '玉树', '海西',
    '银川', '石嘴山', '吴忠', '固原', '中卫',
    '乌鲁木齐', '克拉玛依', '吐鲁番', '哈密', '昌吉', '博尔塔拉', '巴音郭楞', '阿克苏', '克孜勒苏', '喀什', '和田', '伊犁', '塔城', '阿勒泰', '石河子', '阿拉尔', '图木舒克', '五家渠', '北屯', '铁门关', '双河', '可克达拉', '昆玉', '胡杨河'
  ];

  const recognizeInfo = (text) => {
    if (!text.trim()) return null;

    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    let name = '';
    let phone = '';
    let address = '';
    let province = '';
    let city = '';
    let district = '';
    let detail = '';

    // 合并所有行进行全局搜索
    const fullText = lines.join(' ');

    // 1. 识别姓名
    // 先尝试从"收货人:"格式中提取
    for (const line of lines) {
      const nameMatch = line.match(/收货人[：:]\s*(.+)/);
      if (nameMatch) {
        name = nameMatch[1].trim();
        break;
      }
    }

    // 如果没找到，尝试其他模式
    if (!name) {
      for (const pattern of namePatterns) {
        const match = fullText.match(pattern);
        if (match) {
          name = match[1];
          break;
        }
      }
    }

    // 如果还是没找到，尝试从第一行提取
    if (!name && lines.length > 0) {
      const firstLine = lines[0];
      // 如果第一行不包含数字，可能是姓名
      if (!/\d/.test(firstLine) && firstLine.length <= 6) {
        name = firstLine;
      }
    }

    // 2. 识别电话
    for (const pattern of phonePatterns) {
      const matches = fullText.match(pattern);
      if (matches && matches.length > 0) {
        phone = matches[0];
        break;
      }
    }

    // 3. 识别地址
    let addressText = '';
    
    // 先尝试从"地址:"格式中提取
    for (const line of lines) {
      const addressMatch = line.match(/地址[：:]\s*(.+)/);
      if (addressMatch) {
        addressText = addressMatch[1].trim();
        break;
      }
    }

    // 如果没找到，从后往前查找包含地址信息的行
    if (!addressText) {
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        // 如果这一行包含省份或城市信息，认为是地址
        if (provinces.some(p => line.includes(p)) || cities.some(c => line.includes(c))) {
          addressText = line;
          break;
        }
      }
    }

    // 如果还是没找到，使用最后一行作为地址
    if (!addressText && lines.length > 0) {
      addressText = lines[lines.length - 1];
    }

    // 4. 解析地址
    if (addressText) {
      const addressResult = parseAddress(addressText);
      province = addressResult.province;
      city = addressResult.city;
      district = addressResult.district;
      detail = addressResult.detail;
      address = addressText;
    }

    return {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      province,
      city,
      district,
      detail,
      fullAddress: address
    };
  };

  const parseAddress = (addressText) => {
    if (!addressText) return { province: '', city: '', district: '', detail: '' };

    let province = '';
    let city = '';
    let district = '';
    let detail = '';

    // 先尝试通过关键词匹配省份
    for (const p of provinces) {
      if (addressText.includes(p)) {
        province = p;
        break;
      }
    }

    // 匹配城市
    for (const c of cities) {
      if (addressText.includes(c)) {
        city = c;
        break;
      }
    }

    // 如果找到了城市但没有找到省份，通过城市映射获取省份
    if (city && !province && cityToProvince[city]) {
      province = cityToProvince[city];
    }

    // 将省份名称转换为完整名称
    if (province && provinceNameMap[province]) {
      province = provinceNameMap[province];
    }

    // 将城市名称转换为完整名称（添加"市"后缀）
    if (city && !city.endsWith('市') && !city.endsWith('区') && !city.endsWith('县') && !city.endsWith('州') && !city.endsWith('盟')) {
      city = city + '市';
    }

    // 查找区县
    const districtPatterns = [
      /(.{2,6}?[区县])/g,
      /(.{2,6}?[区])/g,
      /(.{2,6}?[县])/g,
    ];

    for (const pattern of districtPatterns) {
      const matches = addressText.match(pattern);
      if (matches && matches.length > 0) {
        district = matches[0];
        break;
      }
    }

    // 计算详细地址
    let remainingAddress = addressText;
    if (province) {
      remainingAddress = remainingAddress.replace(province, '');
    }
    if (city) {
      remainingAddress = remainingAddress.replace(city, '');
    }
    if (district) {
      remainingAddress = remainingAddress.replace(district, '');
    }
    detail = remainingAddress.trim();

    // 如果通过关键词匹配找到了信息，直接返回
    if (province || city || district) {
      console.log('AddressRecognizer 关键词匹配结果:', { province, city, district, detail });
      return { province, city, district, detail };
    }

    // 尝试标准格式匹配
    for (const pattern of addressPatterns) {
      const match = addressText.match(pattern);
      if (match) {
        const groups = match.slice(1);
        if (groups.length === 4) {
          // 完整格式：省市区详细地址
          return {
            province: groups[0],
            city: groups[1],
            district: groups[2],
            detail: groups[3]
          };
        } else if (groups.length === 3) {
          // 省市格式：省市详细地址
          return {
            province: groups[0],
            city: groups[1],
            district: '',
            detail: groups[2]
          };
        } else if (groups.length === 2) {
          // 省份格式：省详细地址
          return {
            province: groups[0],
            city: '',
            district: '',
            detail: groups[1]
          };
        }
      }
    }

    // 如果标准格式匹配失败，使用智能识别
    return intelligentRecognize(addressText);
  };


  const intelligentRecognize = (text) => {
    let province = '';
    let city = '';
    let district = '';
    let detail = '';

    // 查找省份
    for (const p of provinces) {
      if (text.includes(p)) {
        province = p;
        break;
      }
    }

    // 查找城市
    for (const c of cities) {
      if (text.includes(c) && c !== province) {
        city = c;
        break;
      }
    }

    // 如果没找到城市，但找到了省份，城市可能是省份
    if (!city && province) {
      city = province;
    }

    // 查找区县（改进匹配）
    const districtPatterns = [
      /([^省市区]{2,6}[区县])/g,
      /([^省市区]{2,6}区)/g,
      /([^省市区]{2,6}县)/g
    ];

    for (const pattern of districtPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        district = matches[0];
        break;
      }
    }

    // 提取详细地址
    let remainingText = text;
    if (province) remainingText = remainingText.replace(province, '');
    if (city) remainingText = remainingText.replace(city, '');
    if (district) remainingText = remainingText.replace(district, '');
    
    detail = remainingText.trim();

    return {
      province,
      city,
      district,
      detail
    };
  };

  const handleRecognize = async () => {
    if (!inputText.trim()) {
      alert('请输入信息');
      return;
    }

    setIsRecognizing(true);
    
    try {
      const result = recognizeInfo(inputText);
      if (result) {
        setRecognizedData(result);
        if (onRecognize) {
          onRecognize(result);
        }
      } else {
        alert('无法识别信息，请检查输入格式');
      }
    } catch (error) {
      console.error('信息识别失败:', error);
      alert('信息识别失败，请重试');
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setRecognizedData(null);
    if (onClear) {
      onClear();
    }
  };

  const handleApply = () => {
    if (recognizedData && onRecognize) {
      onRecognize(recognizedData);
    }
  };

  return (
    <div className="address-recognizer">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          智能识别收货信息
        </label>
        <div className="space-y-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="请输入收货信息，支持多行格式：&#10;张三&#10;13800138000&#10;广东省深圳市南山区科技园南区深南大道10000号"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleRecognize}
              disabled={isRecognizing || !inputText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRecognizing ? '识别中...' : '智能识别'}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              清空
            </button>
          </div>
        </div>
      </div>

      {recognizedData && (
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">识别结果：</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-600">收货人：</span>
              <span className="text-blue-600 ml-2">{recognizedData.name || '未识别'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">联系电话：</span>
              <span className="text-blue-600 ml-2">{recognizedData.phone || '未识别'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">省份：</span>
              <span className="text-blue-600 ml-2">{recognizedData.province || '未识别'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">城市：</span>
              <span className="text-blue-600 ml-2">{recognizedData.city || '未识别'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">区县：</span>
              <span className="text-blue-600 ml-2">{recognizedData.district || '未识别'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">详细地址：</span>
              <span className="text-blue-600 ml-2">{recognizedData.detail || '未识别'}</span>
            </div>
          </div>
          <div className="mt-3 p-2 bg-green-50 rounded">
            <span className="font-medium text-gray-600">完整地址：</span>
            <span className="text-green-600 ml-2">{recognizedData.fullAddress || '未识别'}</span>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              应用识别结果
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
            >
              重新识别
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressRecognizer;