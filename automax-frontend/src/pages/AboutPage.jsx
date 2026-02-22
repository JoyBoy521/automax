import React from 'react';
import { ShieldCheck, CarFront, FileText, Users, Building2 } from 'lucide-react';
import GlobalHeader from '../components/GlobalHeader';

const items = [
  { icon: <ShieldCheck size={18} className="text-emerald-600" />, title: '透明交易', desc: '车况、价格、流程公开，避免口头承诺。' },
  { icon: <CarFront size={18} className="text-blue-600" />, title: '真实车源', desc: '每台车绑定门店，支持到店复检与试驾。' },
  { icon: <FileText size={18} className="text-amber-600" />, title: '履约可追踪', desc: '下单、预约、过户等环节都有状态记录。' },
  { icon: <Users size={18} className="text-violet-600" />, title: '角色分工', desc: '总部、店长、员工职责清晰，数据权限隔离。' }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalHeader transparentAtTop={false} />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <section className="rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 md:p-12">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">About AutoMax</p>
          <h1 className="text-3xl md:text-4xl font-black mt-3">让二手车交易更清晰、更可控</h1>
          <p className="text-slate-300 mt-4 max-w-3xl">
            AutoMax 是一个面向门店协同的二手车交易平台，覆盖车源展示、意向预定、到店预约、履约与后台管理。
          </p>
        </section>

        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <article key={item.title} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">{item.icon}</div>
              <h2 className="text-lg font-black text-gray-900 mt-3">{item.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-xl font-black text-gray-900 flex items-center"><Building2 size={18} className="mr-2 text-slate-700" /> 平台能力</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">C 端：找车、锁车、订单、预约、退款</div>
            <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">B 端：车辆管理、收车审核、订单履约、人员权限</div>
            <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">总部：跨门店数据看板、门店管理、指标对比与排名</div>
          </div>
        </section>
      </main>
    </div>
  );
}
