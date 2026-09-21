import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { startOfDay, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  MonitorSmartphone, 
  Keyboard, 
  Mouse, 
  TerminalSquare, 
  HelpCircle,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Laptop,
  BarChart2,
  ListTodo,
  Headset,
  Check,
  Lock
} from 'lucide-react';
import StatisticsDashboard from './components/StatisticsDashboard';

const problemTypes = [
  { id: 'Logiciels', label: 'Problème de Logiciels', icon: TerminalSquare },
  { id: 'Clavier', label: 'Clavier', icon: Keyboard },
  { id: 'Souris', label: 'Souris', icon: Mouse },
  { id: 'Casque', label: 'Casque / Audio', icon: Headset },
  { id: 'PC (Matériel/Système)', label: 'PC (Matériel/Système)', icon: Laptop },
  { id: 'Autre', label: 'Autre', icon: HelpCircle },
];

function App() {
  const [activeTab, setActiveTab] = useState('historique');
  const [isStatsAuthenticated, setIsStatsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [matricule, setMatricule] = useState('');
  const [typeProbleme, setTypeProbleme] = useState([]);
  const [descriptionProbleme, setDescriptionProbleme] = useState('');
  const [solution, setSolution] = useState('');

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === '!*A1Z2E3R4T5!') {
      setIsStatsAuthenticated(true);
      setPasswordError(false);
      setPasswordInput('');
    } else {
      setPasswordError(true);
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, []);

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('interventions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setInterventions(data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération:', err);
    } finally {
      setLoading(false);
    }
  };

  const groupedInterventions = interventions.reduce((acc, curr) => {
    const date = format(new Date(curr.created_at), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(curr);
    return acc;
  }, {});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!matricule || typeProbleme.length === 0 || !solution || !descriptionProbleme.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      let finalMatricule = matricule.trim().toUpperCase();
      if (!finalMatricule.startsWith('T0')) {
        finalMatricule = 'T0' + finalMatricule;
      }

      const { data, error } = await supabase
        .from('interventions')
        .insert([
          {
            matricule: finalMatricule,
            type_probleme: typeProbleme.join(', '),
            description: descriptionProbleme.trim(),
            solution: solution.trim(),
          }
        ])
        .select();

      if (error) throw error;

      setSuccess('Intervention enregistrée avec succès.');
      setMatricule('');
      setTypeProbleme([]);
      setDescriptionProbleme('');
      setSolution('');
      
      // Update the list locally to avoid a new fetch, or just re-fetch
      if (data && data.length > 0) {
        setInterventions([data[0], ...interventions]);
      } else {
        fetchInterventions();
      }

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      setError('Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ca-light font-sans text-ca-dark flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-ca-teal p-2 rounded-xl text-white">
              <MonitorSmartphone size={24} />
            </div>
            <h1 className="text-xl font-bold text-ca-tealDark">Comptoir Techno</h1>
          </div>
          <div className="text-sm font-medium text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
            {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
          </div>
        </div>
      </header>

      {/* Navigation des onglets */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('historique')}
              className={`${
                activeTab === 'historique'
                  ? 'border-ca-teal text-ca-tealDark'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
            >
              <ListTodo size={18} />
              Saisie & Historique
            </button>
            <button
              onClick={() => setActiveTab('statistiques')}
              className={`${
                activeTab === 'statistiques'
                  ? 'border-ca-teal text-ca-tealDark'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
            >
              <BarChart2 size={18} />
              Statistiques
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'historique' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
          
          {/* Section A: Formulaire de saisie */}
          <div className="md:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-800">Nouvelle intervention</h2>
              <p className="text-sm text-gray-500 mt-1">Enregistrez le passage d'un collaborateur.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Messages de retour */}
              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{success}</p>
                </div>
              )}

              {/* Matricule */}
              <div>
                <label htmlFor="matricule" className="block text-sm font-medium text-gray-700 mb-2">
                  Matricule du collaborateur <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="matricule"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ca-teal focus:border-ca-teal sm:text-sm transition-shadow outline-none"
                    placeholder="Ex: T012345"
                    required
                  />
                </div>
              </div>

              {/* Type de problème */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de problème <span className="font-normal text-gray-500">(plusieurs choix possibles)</span> <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {problemTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = typeProbleme.includes(type.id);
                    return (
                      <label
                        key={type.id}
                        className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-ca-teal bg-ca-teal/5 ring-1 ring-ca-teal' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="typeProbleme"
                          value={type.id}
                          checked={isSelected}
                          onChange={() => {
                            setTypeProbleme(prev => 
                              prev.includes(type.id) ? prev.filter(t => t !== type.id) : [...prev, type.id]
                            );
                          }}
                          className="sr-only"
                        />
                        <Icon className={`w-5 h-5 mr-3 ${isSelected ? 'text-ca-teal' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-ca-tealDark' : 'text-gray-700'}`}>
                          {type.label}
                        </span>
                        <div className={`ml-auto w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${
                          isSelected ? 'border-ca-teal bg-ca-teal' : 'border-gray-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {typeProbleme.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label htmlFor="descriptionProbleme" className="block text-sm font-medium text-gray-700 mb-2">
                    Description détaillée du problème <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="descriptionProbleme"
                    rows={3}
                    value={descriptionProbleme}
                    onChange={(e) => setDescriptionProbleme(e.target.value)}
                    className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ca-teal focus:border-ca-teal sm:text-sm transition-shadow outline-none resize-none"
                    placeholder="Précisez la nature exacte du problème rencontré..."
                    required
                  />
                </div>
              )}

              {/* Solution */}
              <div>
                <label htmlFor="solution" className="block text-sm font-medium text-gray-700 mb-2">
                  Solution apportée <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="solution"
                  rows={4}
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  className="block w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ca-teal focus:border-ca-teal sm:text-sm transition-shadow outline-none resize-none"
                  placeholder="Détaillez l'action menée..."
                  required
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-ca-teal hover:bg-ca-tealDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ca-teal transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer l\'intervention'
                )}
              </button>
            </form>
          </div>

          {/* Section B: Historique */}
          <div className="md:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Historique des interventions</h2>
                <p className="text-sm text-gray-500 mt-1">Derniers passages au comptoir.</p>
              </div>
              <div className="bg-ca-teal/10 text-ca-tealDark px-3 py-1 rounded-full text-sm font-bold">
                {interventions.length}
              </div>
            </div>

            <div className="flex-1 p-6 bg-gray-50/30 overflow-y-auto">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-ca-teal" />
                  <p className="text-sm">Chargement de l'historique...</p>
                </div>
              ) : interventions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 py-12">
                  <div className="bg-white p-4 rounded-full shadow-sm">
                    <Clock className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm text-center">Aucun passage au comptoir pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedInterventions).map(([date, items]) => {
                    const dateObj = new Date(date);
                    const isToday = format(new Date(), 'yyyy-MM-dd') === date;
                    const dateLabel = isToday 
                      ? "Aujourd'hui" 
                      : format(dateObj, 'EEEE d MMMM', { locale: fr });

                    return (
                      <div key={date}>
                        <div className="sticky top-0 z-10 flex items-center gap-3 mb-4 bg-gray-50/90 backdrop-blur-sm py-2">
                          <h3 className="text-sm font-bold text-gray-700 capitalize">{dateLabel}</h3>
                          <div className="h-px flex-1 bg-gray-200"></div>
                        </div>
                        <div className="space-y-4">
                          {items.map((intervention) => {
                            const types = intervention.type_probleme ? intervention.type_probleme.split(',').map(t => t.trim()) : ['Autre'];
                            const mainTypeInfo = problemTypes.find(t => t.id === types[0]) || problemTypes.find(t => t.id === 'Autre');
                            const MainIcon = mainTypeInfo.icon;
                            
                            return (
                              <div key={intervention.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 p-2 rounded-lg text-gray-600">
                                      <MainIcon size={20} />
                                    </div>
                                    <div>
                                      <div className="flex flex-wrap gap-1 mb-1">
                                        {types.map(t => (
                                          <span key={t} className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                        <User size={14} />
                                        {intervention.matricule}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-xs font-medium text-gray-400 flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full">
                                    <Clock size={12} />
                                    {format(new Date(intervention.created_at), 'HH:mm')}
                                  </div>
                                </div>
                                <div className="pl-12 space-y-3">
                                  {intervention.description && (
                                    <div>
                                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Description</span>
                                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed mt-1">
                                        {intervention.description}
                                      </p>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-xs font-bold text-ca-teal/60 uppercase tracking-wider ml-1">Solution apportée</span>
                                    <p className="text-sm text-gray-800 bg-ca-teal/5 p-3 rounded-xl border border-ca-teal/10 leading-relaxed mt-1">
                                      {intervention.solution}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        ) : !isStatsAuthenticated ? (
          <div className="animate-in fade-in duration-300 flex items-center justify-center min-h-[500px]">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <Lock className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Accès restreint</h2>
                <p className="text-sm text-gray-500 mt-2">Veuillez saisir le mot de passe pour accéder aux statistiques.</p>
              </div>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError(false);
                    }}
                    className={`block w-full p-3 border rounded-xl focus:ring-2 focus:ring-ca-teal sm:text-sm transition-shadow outline-none ${
                      passwordError ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-ca-teal'
                    }`}
                    placeholder="Mot de passe"
                    autoFocus
                  />
                  {passwordError && (
                    <p className="text-sm text-red-500 mt-2">Mot de passe incorrect.</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-ca-teal hover:bg-ca-tealDark text-white font-medium rounded-xl transition-colors"
                >
                  Accéder aux statistiques
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <StatisticsDashboard />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
