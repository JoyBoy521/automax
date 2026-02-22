import React, { useState, useEffect } from 'react';
import { 
  Save, Plus, Minus, AlertCircle, CalendarDays, 
  ImageIcon, ShieldCheck, ChevronLeft, Zap
} from 'lucide-react';
import { useLocation,useNavigate, useParams } from 'react-router-dom';
// 🌟 引入新的 getSpuList 接口 (需在 api/index.js 定义)
import { addCar, getCarDetail, getCarList } from '../../api'; 


export default function CarForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const location = useLocation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomSpu, setIsCustomSpu] = useState(false);
  const [customSpuName, setCustomSpuName] = useState('');
  // 🌟 新增：数据库中的车型列表
  const [spuList, setSpuList] = useState([]);

  // 1. 基础状态 (补全 brand)
  const [formData, setFormData] = useState({
    id: null,
    brand: '',               // 🌟 新增：品牌
    vinCode: '',
    spuId: 1,
    storeId: 1,
    mileage: '',
    showPrice: '',
    regYear: '2023',
    regMonth: '06',
    emissionStd: '国VI',
    depositAmount: '',
    thirdPartyReport: ''
  });

  // 2. 动态数组状态
  const [images, setImages] = useState(['']);
  const [majorRisks, setMajorRisks] = useState(['无重大事故', '无火烧痕迹', '无泡水痕迹', '发动机/变速箱无大修']);
  const [flaws, setFlaws] = useState([]);

  // 🌟 核心优化：组件挂载时拉取数据库车型
  useEffect(() => {
    // 这里由于演示，我们借用 getCarList 的数据或者你新增的 getSpuList
    // 建议直接调用 getCarList 获取现有车源作为参考，或者新增专门接口
    getCarList().then(res => {
        if(res.data.success) {
            // 简单处理：提取现有车型作为下拉选项
            const uniqueSpus = res.data.data.map(item => ({
                id: item.spuId,
                name: item.spuName || '未知车型'
            })).filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
            setSpuList(uniqueSpus);
        }
    });   
  }, []);

  // 🌟 深度回显逻辑
  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          const res = await getCarDetail(id);
          const car = res.data.data; 
          if (!car) return;

          const dateMatch = (car.firstRegDate || car.first_reg_date || "").match(/(\d{4})年(\d{2})月/);
          
          setFormData({
            id: car.id,
            brand: car.brand || '', // 🌟 回显品牌
            vinCode: car.vinCode || car.vin_code || '',
            spuId: car.spuId || car.spu_id || 1,
            storeId: car.storeId || car.store_id || 1,
            mileage: car.mileage || '',
            showPrice: car.showPrice || car.show_price || '',
            regYear: dateMatch ? dateMatch[1] : '2023',
            regMonth: dateMatch ? dateMatch[2] : '06',
            emissionStd: car.emissionStd || car.emission_std || '国VI',
            depositAmount: car.depositAmount || car.deposit_amount || '',
            thirdPartyReport: car.thirdPartyReport || car.third_party_report || ''
          });
          
          const safeParse = (str) => {
            try { 
              if (!str || str === "null") return [];
              const parsed = typeof str === 'string' ? JSON.parse(str) : str; 
              return Array.isArray(parsed) ? parsed : [];
            } catch (e) { return []; }
          };

          setImages(safeParse(car.images).length > 0 ? safeParse(car.images) : ['']);
          setMajorRisks(safeParse(car.majorRisks || car.major_risks));
          setFlaws(safeParse(car.flaws));
        } catch (err) { console.error("加载详情失败:", err); }
      };
      fetchData();
    }
  }, [id, isEdit]);
  useEffect(() => {
    if (isEdit) {
      // 编辑模式：拉取详情
      const fetchData = async () => {
        try {
          const res = await getCarDetail(id);
          const car = res.data.data; 
          if (!car) return;
          const dateMatch = (car.firstRegDate || "").match(/(\d{4})年(\d{2})月/);
          
          setFormData({
            id: car.id,
            brand: car.brand || '',
            vinCode: car.vinCode || '',
            spuId: car.spuId || 1,
            storeId: car.storeId || 1,
            mileage: car.mileage || '',
            showPrice: car.showPrice || '',
            regYear: dateMatch ? dateMatch[1] : '2023',
            regMonth: dateMatch ? dateMatch[2] : '06',
            emissionStd: car.emissionStd || '国VI',
            depositAmount: car.depositAmount || '',
            thirdPartyReport: car.thirdPartyReport || '',
            leadId: null
          });

          const safeParse = (str) => {
            try { return (typeof str === 'string') ? JSON.parse(str) : (str || []); } 
            catch (e) { return []; }
          };
          setImages(safeParse(car.images).length > 0 ? safeParse(car.images) : ['']);
          setMajorRisks(safeParse(car.majorRisks));
          setFlaws(safeParse(car.flaws));
        } catch (err) { console.error("详情加载失败", err); }
      };
      fetchData();
    } else if (location.state && location.state.fromLead) {
      // 🌟 线索转化模式：预填数据
      const lead = location.state.fromLead;
      setFormData(prev => ({
        ...prev,
        brand: "", // 需手动补全品牌
        mileage: lead.mileage || '',
        showPrice: lead.expectedPrice || '',
        leadId: lead.id // 🌟 存入线索ID
      }));
      setIsCustomSpu(true);
      setCustomSpuName(lead.intentionModel);
    }
  }, [id, isEdit, location.state]);

  const years = Array.from({ length: 15 }, (_, i) => 2026 - i);
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      firstRegDate: `${formData.regYear}年${formData.regMonth}月`,
      // 如果是自定义车型，前端这里需要特殊处理，或者后端根据 customSpuName 自动创建 SPU
      spuName: isCustomSpu ? customSpuName : '', 
      images: images.filter(i => i && i.trim() !== ''),
      majorRisks: majorRisks.filter(r => r && r.trim() !== ''),
      flaws: flaws.filter(f => f.part || f.desc)
    };

    try {
      const res = await addCar(payload);
      if (res.data.success) {
        alert(isEdit ? '✨ 档案修改成功！' : '🚀 新车入库上架成功！');
        navigate('/admin');
      }
    } catch (err) {
      alert('保存失败，请检查字段');
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 animate-in fade-in duration-500">
      {/* 顶部操作区 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button onClick={() => navigate('/admin')} className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">{isEdit ? '编辑车辆档案' : '新车入库上架'}</h1>
            <p className="text-sm text-gray-500 font-medium tracking-wide">AutoMax 资产管理系统</p>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={isSubmitting} className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center shadow-xl transition-all active:scale-95 disabled:opacity-50">
          {isSubmitting ? '同步中...' : <><Save size={20} className="mr-2"/> 保存并发布</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Zap size={20} className="mr-2 text-yellow-500" fill="currentColor" /> 核心档案信息
            </h3>
            
            <div className="grid grid-cols-2 gap-6">
              {/* 🌟 亮点：品牌字段 (解决首页空白圈圈) */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">车辆品牌 *</label>
                <input 
                  required 
                  placeholder="如：特斯拉、宝马" 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-blue-500" 
                  value={formData.brand} 
                  onChange={e => setFormData({...formData, brand: e.target.value})} 
                />
              </div>

              {/* 🌟 亮点：动态 SPU 下拉 (连接数据库) */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">关联 SPU 车型 *</label>
                {!isCustomSpu ? (
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-blue-500" 
                    value={formData.spuId} 
                    onChange={e => e.target.value === 'custom' ? setIsCustomSpu(true) : setFormData({...formData, spuId: Number(e.target.value)})}
                  >
                    {spuList.map(spu => (
                        <option key={spu.id} value={spu.id}>{spu.name}</option>
                    ))}
                    <option value="custom" className="text-blue-600 font-bold">+ 录入新车型名称</option>
                  </select>
                ) : (
                  <div className="flex space-x-2">
                    <input autoFocus className="flex-1 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl outline-none" placeholder="输入车型全称" value={customSpuName} onChange={e => setCustomSpuName(e.target.value)} />
                    <button type="button" onClick={() => setIsCustomSpu(false)} className="text-xs text-gray-400">取消</button>
                  </div>
                )}
              </div>

              {/* ... 其余车架号、里程、价格等代码保持原样，不作任何“阉割” ... */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">车架号 (VIN)</label>
                <input required className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none font-mono text-lg uppercase" value={formData.vinCode} onChange={e => setFormData({...formData, vinCode: e.target.value.toUpperCase()})} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">首次上牌时间</label>
                <div className="flex space-x-2">
                  <select className="flex-1 px-4 py-3 bg-gray-50 rounded-xl outline-none" value={formData.regYear} onChange={e => setFormData({...formData, regYear: e.target.value})}>
                    {years.map(y => <option key={y} value={y}>{y}年</option>)}
                  </select>
                  <select className="flex-1 px-4 py-3 bg-gray-50 rounded-xl outline-none" value={formData.regMonth} onChange={e => setFormData({...formData, regMonth: e.target.value})}>
                    {months.map(m => <option key={m} value={m}>{m}月</option>)}
                  </select>
                </div>
              </div>

              <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">里程 (万km)</label>
                  <input required type="number" step="0.01" className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none" value={formData.mileage} onChange={e => setFormData({...formData, mileage: e.target.value})} />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">标价 (万元)</label>
                  <input required type="number" step="0.01" className="w-full px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl outline-none" value={formData.showPrice} onChange={e => setFormData({...formData, showPrice: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">意向定金 (¥)</label>
                <input type="number" placeholder="默认500" className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none" value={formData.depositAmount} onChange={e => setFormData({...formData, depositAmount: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">第三方检测链接</label>
                <input type="text" placeholder="https://" className="w-full px-4 py-3 bg-blue-50 rounded-xl outline-none" value={formData.thirdPartyReport} onChange={e => setFormData({...formData, thirdPartyReport: e.target.value})} />
              </div>
            </div>
          </section>

          {/* 瑕疵评估卡片 (完整保留) */}
          <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 border-l-8 border-l-orange-400">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <AlertCircle size={20} className="mr-2 text-orange-500" /> 瑕疵如实披露
              </h3>
              <button type="button" onClick={() => setFlaws([...flaws, {part: '', desc: ''}])} className="text-xs font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-xl">+ 增加记录</button>
            </div>
            <div className="space-y-4">
              {flaws.map((flaw, idx) => (
                <div key={idx} className="flex space-x-3 items-center group">
                  <input placeholder="部位" className="w-1/4 px-4 py-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-orange-200" value={flaw.part} onChange={e => { const n = [...flaws]; n[idx].part = e.target.value; setFlaws(n); }} />
                  <input placeholder="描述" className="flex-1 px-4 py-3 bg-gray-50 rounded-xl outline-none border border-transparent focus:border-orange-200" value={flaw.desc} onChange={e => { const n = [...flaws]; n[idx].desc = e.target.value; setFlaws(n); }} />
                  <button type="button" onClick={() => setFlaws(flaws.filter((_, i) => i !== idx))} className="p-3 text-gray-300 hover:text-red-500"><Minus/></button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 右侧边栏 (完整保留) */}
        <div className="space-y-8">
          <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center"><ImageIcon size={18} className="mr-2 text-blue-500" /> 车辆大图</h3>
            <div className="space-y-3">
              {images.map((img, idx) => (
                <input key={idx} className="w-full px-4 py-2 bg-gray-50 rounded-lg text-xs outline-none" placeholder="图片 URL" value={img} onChange={e => { const n = [...images]; n[idx] = e.target.value; setImages(n); }} />
              ))}
              <button type="button" onClick={() => setImages([...images, ''])} className="w-full py-2 border-2 border-dashed border-gray-100 rounded-lg text-xs">+ 增加图片</button>
            </div>
          </section>

          <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center"><ShieldCheck size={18} className="mr-2 text-green-500" /> 核心隐患排查</h3>
            <div className="space-y-2">
              {majorRisks.map((risk, idx) => (
                <div key={idx} className="flex items-center bg-green-50/50 px-3 py-2 rounded-lg">
                  <input className="flex-1 bg-transparent text-xs outline-none" value={risk} onChange={e => { const n = [...majorRisks]; n[idx] = e.target.value; setMajorRisks(n); }} />
                  <button type="button" onClick={() => setMajorRisks(majorRisks.filter((_, i) => i !== idx))} className="text-green-300"><Minus size={14}/></button>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative shadow-2xl">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">实时评估评分</h4>
            <div className="flex items-baseline mb-2">
              <span className="text-5xl font-black text-yellow-400">{100 - (flaws.length * 2)}</span>
              <span className="text-slate-400 text-xs ml-2">/ 估算得分</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}