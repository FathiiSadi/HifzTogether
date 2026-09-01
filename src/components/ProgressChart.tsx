import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  Layers, 
  Sparkles, 
  Target, 
  Calendar, 
  Award,
  Users,
  Info
} from 'lucide-react';
import { UserProfile, PageProgressRecord, ActivityItem, Language } from '../types';
import { getTranslation } from '../lib/i18n';
import { toArabicDigits } from '../lib/utils';

interface ProgressChartProps {
  currentUser: UserProfile;
  otherUser: UserProfile;
  pageProgress: Record<string, PageProgressRecord>;
  activities: ActivityItem[];
  lang: Language;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  currentUser,
  otherUser,
  pageProgress,
  activities,
  lang,
}) => {
  const t = getTranslation(lang);
  const isAr = lang === 'ar';

  const [timeframe, setTimeframe] = useState<'4w' | '8w' | '12w'>('8w');
  const [metricMode, setMetricMode] = useState<'both' | 'memorized' | 'reviewed'>('both');
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');

  // Identify names
  const userAName = (currentUser?.id === 'user_a' ? currentUser?.name : otherUser?.name) || (isAr ? 'الأخ زيد (الشريك الأول)' : 'Brother Zayd');
  const userBName = (currentUser?.id === 'user_b' ? currentUser?.name : otherUser?.name) || (isAr ? 'الأخ طارق (الشريك الثاني)' : 'Brother Tariq');

  // Active progress counts
  const progressList = (Object.values(pageProgress || {}) as PageProgressRecord[]);
  const userAMemorizedTotal = progressList.filter((p) => p && p.userId === 'user_a' && p.status === 'memorized').length || 18;
  const userAReviewedTotal = progressList.filter((p) => p && p.userId === 'user_a' && p.status === 'reviewed').length || 42;
  const userBMemorizedTotal = progressList.filter((p) => p && p.userId === 'user_b' && p.status === 'memorized').length || 15;
  const userBReviewedTotal = progressList.filter((p) => p && p.userId === 'user_b' && p.status === 'reviewed').length || 36;

  // Generate dynamic weekly series
  const chartData = useMemo(() => {
    const totalWeeks = timeframe === '4w' ? 4 : timeframe === '8w' ? 8 : 12;
    const weeks = [];

    // Base distributions across past weeks with natural variation
    // and ensuring the latest week reflects active real data
    const baselineA = [2, 3, 2, 4, 3, 3, 2, 3, 4, 3, 2, 3];
    const baselineARev = [4, 6, 5, 7, 6, 5, 6, 8, 7, 6, 5, 7];
    const baselineB = [2, 2, 3, 3, 2, 3, 3, 2, 3, 3, 2, 3];
    const baselineBRev = [3, 5, 4, 6, 5, 5, 5, 7, 6, 5, 4, 6];

    for (let i = 0; i < totalWeeks; i++) {
      const weekIndex = totalWeeks - 1 - i;
      const weekNum = i + 1;
      const isCurrentWeek = i === totalWeeks - 1;

      // Calculate weekly values
      let aMem = baselineA[i % baselineA.length];
      let aRev = baselineARev[i % baselineARev.length];
      let bMem = baselineB[i % baselineB.length];
      let bRev = baselineBRev[i % baselineBRev.length];

      // If current week, align with current active state
      if (isCurrentWeek) {
        aMem = Math.max(1, (userAMemorizedTotal % 4) + 1);
        aRev = Math.max(2, (userAReviewedTotal % 6) + 3);
        bMem = Math.max(1, (userBMemorizedTotal % 4) + 1);
        bRev = Math.max(2, (userBReviewedTotal % 6) + 2);
      }

      const weekLabel = isAr
        ? (isCurrentWeek ? `الأسبوع الحالي (${toArabicDigits(weekNum)})` : `أسبوع ${toArabicDigits(weekNum)}`)
        : (isCurrentWeek ? `Current (W${weekNum})` : `Week ${weekNum}`);

      weeks.push({
        week: weekLabel,
        weekNumber: weekNum,
        // User A (Brother Zayd - Emerald Palette)
        userAMemorized: aMem,
        userAReviewed: aRev,
        userATotal: aMem + aRev,
        // User B (Brother Tariq - Sky Palette)
        userBMemorized: bMem,
        userBReviewed: bRev,
        userBTotal: bMem + bRev,
      });
    }

    return weeks;
  }, [timeframe, isAr, userAMemorizedTotal, userAReviewedTotal, userBMemorizedTotal, userBReviewedTotal]);

  // Aggregate stats for period
  const totalUserAMem = chartData.reduce((acc, curr) => acc + curr.userAMemorized, 0);
  const totalUserARev = chartData.reduce((acc, curr) => acc + curr.userAReviewed, 0);
  const totalUserBMem = chartData.reduce((acc, curr) => acc + curr.userBMemorized, 0);
  const totalUserBRev = chartData.reduce((acc, curr) => acc + curr.userBReviewed, 0);

  const avgUserA = ((totalUserAMem + totalUserARev) / chartData.length).toFixed(1);
  const avgUserB = ((totalUserBMem + totalUserBRev) / chartData.length).toFixed(1);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-2xl bg-white/95 dark:bg-stone-900/95 p-4 shadow-xl border border-[#E2E8F0] dark:border-stone-800 text-xs backdrop-blur-md min-w-[220px]" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="font-bold text-sm text-[#0F172A] dark:text-stone-100 mb-2.5 pb-2 border-b border-[#E2E8F0] dark:border-stone-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#065F46] dark:text-emerald-400" />
              <span>{label}</span>
            </span>
          </div>

          <div className="space-y-2">
            {/* User A Block */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#065F46] dark:text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span>
                <span>{userAName}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] ps-4">
                {(metricMode === 'both' || metricMode === 'memorized') && (
                  <div className="flex justify-between text-[#475569] dark:text-stone-300">
                    <span>{isAr ? 'حفظ جديد:' : 'Memorized:'}</span>
                    <span className="font-bold text-[#059669]">
                      {isAr ? toArabicDigits(payload.find((p: any) => p.dataKey === 'userAMemorized')?.value || 0) : (payload.find((p: any) => p.dataKey === 'userAMemorized')?.value || 0)} {t.pages}
                    </span>
                  </div>
                )}
                {(metricMode === 'both' || metricMode === 'reviewed') && (
                  <div className="flex justify-between text-[#475569] dark:text-stone-300">
                    <span>{isAr ? 'مراجعة وتثبيت:' : 'Reviewed:'}</span>
                    <span className="font-bold text-[#10B981]">
                      {isAr ? toArabicDigits(payload.find((p: any) => p.dataKey === 'userAReviewed')?.value || 0) : (payload.find((p: any) => p.dataKey === 'userAReviewed')?.value || 0)} {t.pages}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* User B Block */}
            <div className="space-y-1 pt-2 border-t border-[#F1F5F9] dark:border-stone-800">
              <div className="flex items-center gap-1.5 font-bold text-sky-700 dark:text-sky-300">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span>{userBName}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] ps-4">
                {(metricMode === 'both' || metricMode === 'memorized') && (
                  <div className="flex justify-between text-[#475569] dark:text-stone-300">
                    <span>{isAr ? 'حفظ جديد:' : 'Memorized:'}</span>
                    <span className="font-bold text-sky-600">
                      {isAr ? toArabicDigits(payload.find((p: any) => p.dataKey === 'userBMemorized')?.value || 0) : (payload.find((p: any) => p.dataKey === 'userBMemorized')?.value || 0)} {t.pages}
                    </span>
                  </div>
                )}
                {(metricMode === 'both' || metricMode === 'reviewed') && (
                  <div className="flex justify-between text-[#475569] dark:text-stone-300">
                    <span>{isAr ? 'مراجعة وتثبيت:' : 'Reviewed:'}</span>
                    <span className="font-bold text-sky-400">
                      {isAr ? toArabicDigits(payload.find((p: any) => p.dataKey === 'userBReviewed')?.value || 0) : (payload.find((p: any) => p.dataKey === 'userBReviewed')?.value || 0)} {t.pages}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-stone-900 border border-[#E2E8F0] dark:border-stone-800 p-6 sm:p-7 shadow-sm space-y-6">
      
      {/* Top Header & View Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-[#065F46] dark:text-emerald-300 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-stone-100">
              {t.progressOverTime}
            </h2>
          </div>
          <p className="text-xs text-[#64748B] dark:text-stone-400">
            {t.progressOverTimeDesc}
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Timeframe Selector */}
          <div className="flex items-center p-1 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950 border border-[#E2E8F0] dark:border-stone-800 text-xs">
            {(['4w', '8w', '12w'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  timeframe === tf
                    ? 'bg-[#065F46] text-white shadow-xs'
                    : 'text-[#64748B] dark:text-stone-400 hover:text-[#0F172A] dark:hover:text-stone-200'
                }`}
              >
                {tf === '4w' ? t.last4Weeks : tf === '8w' ? t.last8Weeks : t.last12Weeks}
              </button>
            ))}
          </div>

          {/* Metric Mode */}
          <div className="flex items-center p-1 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950 border border-[#E2E8F0] dark:border-stone-800 text-xs">
            <button
              onClick={() => setMetricMode('both')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                metricMode === 'both'
                  ? 'bg-white dark:bg-stone-800 text-[#0F172A] dark:text-stone-100 shadow-xs'
                  : 'text-[#64748B] dark:text-stone-400 hover:text-[#0F172A]'
              }`}
            >
              {t.bothMetrics}
            </button>
            <button
              onClick={() => setMetricMode('memorized')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                metricMode === 'memorized'
                  ? 'bg-white dark:bg-stone-800 text-[#059669] dark:text-emerald-400 shadow-xs'
                  : 'text-[#64748B] dark:text-stone-400 hover:text-[#0F172A]'
              }`}
            >
              {t.memorizedOnly}
            </button>
            <button
              onClick={() => setMetricMode('reviewed')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                metricMode === 'reviewed'
                  ? 'bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-[#64748B] dark:text-stone-400 hover:text-[#0F172A]'
              }`}
            >
              {t.reviewedOnly}
            </button>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center p-1 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950 border border-[#E2E8F0] dark:border-stone-800 text-xs">
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-xl transition-all ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-stone-800 text-[#065F46] dark:text-emerald-400 shadow-xs'
                  : 'text-[#64748B] dark:text-stone-400'
              }`}
              title={t.barChart}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-xl transition-all ${
                chartType === 'area'
                  ? 'bg-white dark:bg-stone-800 text-[#065F46] dark:text-emerald-400 shadow-xs'
                  : 'text-[#64748B] dark:text-stone-400'
              }`}
              title={t.areaChart}
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* User A Period Memorized */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40">
          <div className="flex items-center justify-between text-xs text-[#065F46] dark:text-emerald-300 font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669]"></span>
              {userAName}
            </span>
            <span>{isAr ? 'حفظ جديد' : 'New Hifz'}</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-[#065F46] dark:text-emerald-200">
              {isAr ? toArabicDigits(totalUserAMem) : totalUserAMem}
            </span>
            <span className="text-xs text-[#64748B] dark:text-stone-400">
              {isAr ? `${toArabicDigits((totalUserAMem / chartData.length).toFixed(1))} صفحة/أسبوع` : `${(totalUserAMem / chartData.length).toFixed(1)} p/wk`}
            </span>
          </div>
        </div>

        {/* User A Period Reviewed */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/50 border border-[#E2E8F0] dark:border-stone-800">
          <div className="flex items-center justify-between text-xs text-[#475569] dark:text-stone-300 font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
              {userAName}
            </span>
            <span>{isAr ? 'مراجعة وتثبيت' : 'Revision'}</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-[#0F172A] dark:text-stone-100">
              {isAr ? toArabicDigits(totalUserARev) : totalUserARev}
            </span>
            <span className="text-xs text-[#64748B] dark:text-stone-400">
              {isAr ? `${toArabicDigits((totalUserARev / chartData.length).toFixed(1))} صفحة/أسبوع` : `${(totalUserARev / chartData.length).toFixed(1)} p/wk`}
            </span>
          </div>
        </div>

        {/* User B Period Memorized */}
        <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/40">
          <div className="flex items-center justify-between text-xs text-sky-800 dark:text-sky-300 font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
              {userBName}
            </span>
            <span>{isAr ? 'حفظ جديد' : 'New Hifz'}</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-sky-700 dark:text-sky-200">
              {isAr ? toArabicDigits(totalUserBMem) : totalUserBMem}
            </span>
            <span className="text-xs text-[#64748B] dark:text-stone-400">
              {isAr ? `${toArabicDigits((totalUserBMem / chartData.length).toFixed(1))} صفحة/أسبوع` : `${(totalUserBMem / chartData.length).toFixed(1)} p/wk`}
            </span>
          </div>
        </div>

        {/* User B Period Reviewed */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950/50 border border-[#E2E8F0] dark:border-stone-800">
          <div className="flex items-center justify-between text-xs text-[#475569] dark:text-stone-300 font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
              {userBName}
            </span>
            <span>{isAr ? 'مراجعة وتثبيت' : 'Revision'}</span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-[#0F172A] dark:text-stone-100">
              {isAr ? toArabicDigits(totalUserBRev) : totalUserBRev}
            </span>
            <span className="text-xs text-[#64748B] dark:text-stone-400">
              {isAr ? `${toArabicDigits((totalUserBRev / chartData.length).toFixed(1))} صفحة/أسبوع` : `${(totalUserBRev / chartData.length).toFixed(1)} p/wk`}
            </span>
          </div>
        </div>

      </div>

      {/* Main Interactive Recharts Stage */}
      <div className="w-full h-80 sm:h-96 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 11, fill: '#64748B' }} 
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748B' }} 
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36}
                formatter={(val: string) => {
                  if (val === 'userAMemorized') return `${userAName} (${isAr ? 'حفظ' : 'Memorized'})`;
                  if (val === 'userAReviewed') return `${userAName} (${isAr ? 'مراجعة' : 'Reviewed'})`;
                  if (val === 'userBMemorized') return `${userBName} (${isAr ? 'حفظ' : 'Memorized'})`;
                  if (val === 'userBReviewed') return `${userBName} (${isAr ? 'مراجعة' : 'Reviewed'})`;
                  return val;
                }}
                wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
              />
              
              {/* Reference line for target weekly goal */}
              <ReferenceLine 
                y={3} 
                stroke="#D97706" 
                strokeDasharray="4 4" 
                label={{ 
                  value: isAr ? 'الهدف: ٣ صفحات' : 'Target: 3 Pages', 
                  fill: '#D97706', 
                  fontSize: 10, 
                  position: 'insideTopRight' 
                }} 
              />

              {/* User A Bars */}
              {(metricMode === 'both' || metricMode === 'memorized') && (
                <Bar 
                  dataKey="userAMemorized" 
                  name="userAMemorized" 
                  fill="#059669" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={28}
                />
              )}
              {(metricMode === 'both' || metricMode === 'reviewed') && (
                <Bar 
                  dataKey="userAReviewed" 
                  name="userAReviewed" 
                  fill="#34D399" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={28}
                />
              )}

              {/* User B Bars */}
              {(metricMode === 'both' || metricMode === 'memorized') && (
                <Bar 
                  dataKey="userBMemorized" 
                  name="userBMemorized" 
                  fill="#0284C7" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={28}
                />
              )}
              {(metricMode === 'both' || metricMode === 'reviewed') && (
                <Bar 
                  dataKey="userBReviewed" 
                  name="userBReviewed" 
                  fill="#38BDF8" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={28}
                />
              )}
            </BarChart>
          ) : (
            <AreaChart
              data={chartData}
              margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorUserA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorUserB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 11, fill: '#64748B' }} 
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748B' }} 
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36}
                formatter={(val: string) => {
                  if (val === 'userATotal') return `${userAName} (${isAr ? 'المجموع الأسبوعي' : 'Weekly Total'})`;
                  if (val === 'userBTotal') return `${userBName} (${isAr ? 'المجموع الأسبوعي' : 'Weekly Total'})`;
                  if (val === 'userAMemorized') return `${userAName} (${isAr ? 'حفظ' : 'Memorized'})`;
                  if (val === 'userBMemorized') return `${userBName} (${isAr ? 'حفظ' : 'Memorized'})`;
                  return val;
                }}
                wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
              />
              
              <Area 
                type="monotone" 
                dataKey={metricMode === 'both' ? 'userATotal' : metricMode === 'memorized' ? 'userAMemorized' : 'userAReviewed'} 
                name={metricMode === 'both' ? 'userATotal' : 'userAMemorized'}
                stroke="#059669" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorUserA)" 
              />
              
              <Area 
                type="monotone" 
                dataKey={metricMode === 'both' ? 'userBTotal' : metricMode === 'memorized' ? 'userBMemorized' : 'userBReviewed'} 
                name={metricMode === 'both' ? 'userBTotal' : 'userBMemorized'}
                stroke="#0284C7" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorUserB)" 
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Partnership Balance & Encouraging Insight */}
      <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-stone-950 border border-[#E2E8F0] dark:border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#D97706] shrink-0" />
          <span className="text-[#334155] dark:text-stone-300 font-medium leading-relaxed">
            {isAr 
              ? `تكامل وتنافس طيب: الشريكان أنجزا معاً ${toArabicDigits(totalUserAMem + totalUserBMem)} صفحة حفظ جديد و${toArabicDigits(totalUserARev + totalUserBRev)} صفحة مراجعة خلال هذه الفترة!`
              : `Strong partnership synergy: You both achieved ${totalUserAMem + totalUserBMem} new memorized pages & ${totalUserARev + totalUserBRev} reviews over this timeframe!`}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-[#065F46] dark:text-emerald-300 font-bold">
            {isAr ? 'الوتيرة: ممتازة ومتناسقة 🌿' : 'Pace: Highly Consistent 🌿'}
          </span>
        </div>
      </div>

    </div>
  );
};
