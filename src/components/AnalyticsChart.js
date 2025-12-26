import React, { useState, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { getAnalyticsData } from '../supabaseClient';
import './AnalyticsChart.css';

function AnalyticsChart({ projectId }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    if (projectId) {
      loadAnalyticsData();
    }
  }, [projectId, days]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // TODO: Phase 2 - 独自分析機能を実装する際に有効化
      // 現在はClarityとGTMで分析を行うため、この機能は無効化しています
      const { data, error } = await getAnalyticsData(projectId, days);
      
      // エラーは無視して空の配列を返す（analytics_eventsテーブル未作成のため）
      if (error) {
        setChartData([]);
        return;
      }

      // 日別に集計
      const dailyData = {};
      const startDate = subDays(new Date(), days - 1);
      
      // 初期化（すべての日付を0で初期化）
      for (let i = 0; i < days; i++) {
        const date = subDays(new Date(), days - 1 - i);
        const dateKey = format(date, 'yyyy-MM-dd');
        dailyData[dateKey] = {
          date: dateKey,
          views: 0,
          clicks: 0
        };
      }

      // イベントを集計
      (data || []).forEach(event => {
        const eventDate = format(parseISO(event.created_at), 'yyyy-MM-dd');
        if (dailyData[eventDate]) {
          if (event.event_type === 'view') {
            dailyData[eventDate].views += 1;
          } else if (event.event_type === 'cta_click') {
            dailyData[eventDate].clicks += 1;
          }
        }
      });

      // 配列に変換してソート
      const chartDataArray = Object.values(dailyData).sort((a, b) => 
        a.date.localeCompare(b.date)
      );

      // 日付を日本語形式に変換
      const formattedData = chartDataArray.map(item => ({
        ...item,
        dateLabel: format(parseISO(item.date + 'T00:00:00'), 'M/d', { locale: ja })
      }));

      setChartData(formattedData);
    } catch (error) {
      // エラーは無視して空の配列を返す
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-chart-container">
        <div className="analytics-chart-header">
          <h3>アクセス推移</h3>
          <div className="chart-controls">
            <button
              className={`period-btn ${days === 7 ? 'active' : ''}`}
              onClick={() => setDays(7)}
            >
              7日間
            </button>
            <button
              className={`period-btn ${days === 30 ? 'active' : ''}`}
              onClick={() => setDays(30)}
            >
              30日間
            </button>
          </div>
        </div>
        <div className="chart-loading">読み込み中...</div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="analytics-chart-container">
        <div className="analytics-chart-header">
          <h3>アクセス推移</h3>
          <div className="chart-controls">
            <button
              className={`period-btn ${days === 7 ? 'active' : ''}`}
              onClick={() => setDays(7)}
            >
              7日間
            </button>
            <button
              className={`period-btn ${days === 30 ? 'active' : ''}`}
              onClick={() => setDays(30)}
            >
              30日間
            </button>
          </div>
        </div>
        <div className="chart-empty">データがありません</div>
      </div>
    );
  }

  return (
    <div className="analytics-chart-container">
      <div className="analytics-chart-header">
        <h3>アクセス推移</h3>
        <div className="chart-controls">
          <button
            className={`period-btn ${days === 7 ? 'active' : ''}`}
            onClick={() => setDays(7)}
          >
            7日間
          </button>
          <button
            className={`period-btn ${days === 30 ? 'active' : ''}`}
            onClick={() => setDays(30)}
          >
            30日間
          </button>
        </div>
      </div>
      <div className="chart-content">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="dateLabel" 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="left"
              label={{ value: '閲覧数', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#3B82F6' } }}
              stroke="#3B82F6"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              label={{ value: 'クリック数', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#F59E0B' } }}
              stroke="#F59E0B"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ color: '#1F2937', fontWeight: 600 }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Bar 
              yAxisId="left"
              dataKey="views" 
              name="閲覧数"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="clicks" 
              name="ボタンクリック数"
              stroke="#F59E0B"
              strokeWidth={3}
              dot={{ fill: '#F59E0B', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AnalyticsChart;

