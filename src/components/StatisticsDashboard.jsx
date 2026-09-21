import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, Hash } from 'lucide-react';

const COLORS = ['#007765', '#009B9D', '#4AA58C', '#1F2937', '#9CA3AF'];

export default function StatisticsDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Générer la liste des 12 derniers mois pour le sélecteur
  const monthsOptions = useMemo(() => {
    const options = [
      { value: 'all', label: 'Toutes les périodes' }
    ];
    for (let i = 0; i < 12; i++) {
      const d = subMonths(new Date(), i);
      options.push({
        value: format(d, 'yyyy-MM'),
        label: format(d, 'MMMM yyyy', { locale: fr })
      });
    }
    return options;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(monthsOptions[0].value);

  useEffect(() => {
    fetchStats();
  }, [selectedMonth]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('interventions').select('type_probleme');

      if (selectedMonth !== 'all') {
        const year = parseInt(selectedMonth.split('-')[0], 10);
        const month = parseInt(selectedMonth.split('-')[1], 10) - 1; // JS months are 0-indexed
        
        const date = new Date(year, month, 1);
        const start = startOfMonth(date).toISOString();
        const end = endOfMonth(date).toISOString();

        query = query.gte('created_at', start).lte('created_at', end);
      }

      const { data: interventions, error } = await query;

      if (error) throw error;
      
      // Grouper par type de problème
      const counts = interventions.reduce((acc, curr) => {
        const types = curr.type_probleme ? curr.type_probleme.split(',').map(t => t.trim()) : ['Autre'];
        types.forEach(type => {
          acc[type] = (acc[type] || 0) + 1;
        });
        return acc;
      }, {});

      // Formater pour Recharts
      const chartData = Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value); // Trier du plus grand au plus petit

      setData(chartData);
    } catch (err) {
      console.error('Erreur lors de la récupération des stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalInterventions = data.reduce((sum, item) => sum + item.value, 0);
  const topIssue = data.length > 0 ? data[0] : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
      {/* En-tête des Statistiques */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Tableau de bord analytique</h2>
          <p className="text-sm text-gray-500 mt-1">Répartition des sollicitations au comptoir.</p>
        </div>
        <div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="block w-full py-2 pl-3 pr-10 text-sm border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-ca-teal focus:border-ca-teal bg-white shadow-sm capitalize"
          >
            {monthsOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 p-6 bg-gray-50/30">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3 min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-ca-teal" />
            <p className="text-sm">Analyse des données en cours...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 py-12 min-h-[400px]">
            <div className="bg-white p-4 rounded-full shadow-sm">
              <Hash className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm text-center">Aucune intervention enregistrée sur ce mois.</p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="bg-ca-teal/10 p-3 rounded-lg text-ca-teal">
                  <Hash size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total des interventions</p>
                  <p className="text-2xl font-bold text-gray-800">{totalInterventions}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Problème le plus fréquent</p>
                  <p className="text-xl font-bold text-gray-800 truncate" title={topIssue?.name}>
                    {topIssue?.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{topIssue?.value} passages ({Math.round((topIssue?.value / totalInterventions) * 100)}%)</p>
                </div>
              </div>
            </div>

            {/* Graphique et Tableau */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
                <h3 className="text-sm font-semibold text-gray-700 mb-6 w-full text-left">Répartition par catégorie</h3>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} intervention(s)`, 'Total']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-700">Détails des volumes</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Catégorie
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Volume
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.map((item, index) => {
                        const percentage = Math.round((item.value / totalInterventions) * 100);
                        return (
                          <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                              {item.value}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right font-medium">
                              {percentage}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
