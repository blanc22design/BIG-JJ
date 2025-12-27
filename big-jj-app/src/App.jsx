import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  History, 
  User, 
  Plus, 
  Trash2, 
  Save, 
  Activity, 
  Calendar,
  ChevronRight,
  Trophy,
  Flame,
  Clock,
  Sparkles,
  BrainCircuit,
  ArrowRight,
  XCircle,
  CalendarDays,
  Repeat,
  RotateCcw,
  Scale,
  Info,
  ChevronLeft,
  Sun,
  TrendingUp,
  BarChart2, // Added BarChart2
  Utensils   // Added Utensils
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  Timestamp 
} from 'firebase/firestore';

// --- Firebase Configuration & Initialization ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Gemini API Configuration ---
const apiKey = "AIzaSyARtrlMKXh3gB5FjkoZ8BNKqmb2bFbtPfQ"; // API key will be injected by the environment

const DAYS_OF_WEEK = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

// Helper to clean JSON string
const cleanJsonString = (str) => {
  if (!str) return "";
  const jsonBlockMatch = str.match(/```json([\s\S]*?)```/) || str.match(/```([\s\S]*?)```/);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    return jsonBlockMatch[1].trim();
  }
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    return str.substring(firstBrace, lastBrace + 1);
  }
  return str.trim();
};

// Helper to get day of week from Date object
const getDayOfWeek = (date) => {
  if (!date) return '';
  const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  return days[date.getDay()];
};

// --- Independent Components ---

// 1. Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-blue-500', 
    error: 'bg-pink-500',   
    info: 'bg-slate-500',
    ai: 'bg-gradient-to-r from-blue-400 to-pink-500' 
  };

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 ${bgColors[type] || 'bg-gray-800'} text-white px-6 py-3 rounded-full shadow-xl z-[100] flex items-center animate-bounce-in whitespace-nowrap`}>
      {type === 'ai' && <Sparkles className="w-4 h-4 mr-2 text-white animate-pulse" />}
      {message}
    </div>
  );
};

// 1.5 Exercise Guide Modal Component
const ExerciseGuideModal = ({ exerciseName, onClose }) => {
  const [guide, setGuide] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `請簡單說明健身動作「${exerciseName}」的正確執行步驟、呼吸方式與常見錯誤。請用繁體中文，並以條列式清晰呈現，字數控制在 200 字以內。` }] }]
          })
        });
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        setGuide(text || "無法取得指導資訊");
      } catch (e) {
        setGuide("發生錯誤，請稍後再試");
      } finally {
        setLoading(false);
      }
    };
    if (exerciseName) fetchGuide();
  }, [exerciseName]);

  return (
    <div 
      className="fixed inset-0 bg-slate-900/30 z-[60] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto relative shadow-2xl ring-1 ring-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-pink-500 bg-slate-50 rounded-full p-1 transition-colors">
          <XCircle className="w-6 h-6" />
        </button>
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center border-b border-slate-100 pb-3">
          <span className="bg-blue-50 text-blue-500 p-2 rounded-lg mr-3"><Dumbbell className="w-5 h-5"/></span>
          {exerciseName} 指導
        </h3>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400"></div>
            <p className="text-slate-400 text-xs">AI 正在分析動作要領...</p>
          </div>
        ) : (
          <div className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed font-light">
            {guide}
          </div>
        )}
      </div>
    </div>
  );
};

// 1.6 Sun History Modal Component
const SunHistoryModal = ({ sunLogs, onClose, onAdd, onDelete }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAdd = () => {
    const date = new Date(selectedDate);
    date.setHours(12, 0, 0, 0);
    onAdd(date);
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/30 z-[60] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto relative shadow-2xl ring-1 ring-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-pink-500 bg-slate-50 rounded-full p-1 transition-colors">
          <XCircle className="w-6 h-6" />
        </button>
        
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center border-b border-slate-100 pb-3">
          <span className="bg-orange-50 text-orange-500 p-2 rounded-lg mr-3"><Sun className="w-5 h-5"/></span>
          日曬紀錄管理
        </h3>

        <div className="bg-orange-50 p-4 rounded-xl mb-4 border border-orange-100">
            <label className="block text-xs font-bold text-orange-600 mb-2 uppercase tracking-wide">補登日期</label>
            <div className="flex gap-2">
                <input 
                    type="date" 
                    className="flex-1 bg-white border border-orange-200 rounded-lg p-2 text-slate-700 text-sm focus:outline-none focus:border-orange-400"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
                <button 
                    onClick={handleAdd}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm"
                >
                    新增
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            <h4 className="text-sm font-bold text-slate-600 mb-2">歷史列表 ({sunLogs.length})</h4>
            {sunLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                    尚無日曬紀錄
                </div>
            ) : (
                sunLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg group hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
                        <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                            <span className="text-slate-700 font-medium">
                                {log.createdAt.toLocaleDateString('zh-TW')}
                            </span>
                            <span className="text-xs text-slate-400 ml-2">
                                {log.createdAt.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <button 
                            onClick={() => onDelete(log.id)}
                            className="text-slate-300 hover:text-red-500 p-1 rounded-md transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

// 1.7 Nutrition Modal Component
const NutritionModal = ({ nutritionLogs, onClose, onAdd, onDelete, showToast }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [foodName, setFoodName] = useState('');
  const [foodWeight, setFoodWeight] = useState('');
  const [protein, setProtein] = useState('');
  const [calories, setCalories] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  const currentDayLogs = nutritionLogs.filter(log => {
    const logDate = log.date; 
    return logDate === selectedDate;
  });

  const totalProtein = currentDayLogs.reduce((sum, log) => sum + (Number(log.protein) || 0), 0);
  const totalCalories = currentDayLogs.reduce((sum, log) => sum + (Number(log.calories) || 0), 0);

  const handleAICalculate = async () => {
    if (!foodName || !foodWeight) {
       if (showToast) showToast("請輸入食物名稱與重量", "error");
       return;
    }
    setIsCalculating(true);
    try {
        const prompt = `請估算 ${foodWeight}公克 的 「${foodName}」 的營養成分。
        請務必回傳純 JSON 格式，不要包含任何 Markdown 標記或其他文字。
        格式：{ "protein": 數字(公克), "calories": 數字(大卡) }`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        resultText = cleanJsonString(resultText);
        const result = JSON.parse(resultText);
        
        setProtein(result.protein || 0);
        setCalories(result.calories || 0);
        if (showToast) showToast("AI 估算完成！請確認數值", "ai");
        
    } catch (e) {
        console.error("AI Calculate Error:", e);
        if (showToast) showToast("估算失敗，請稍後再試", "error");
    } finally {
        setIsCalculating(false);
    }
  };

  const handleAdd = () => {
    if (!protein && !calories) return;
    onAdd({
        date: selectedDate,
        name: foodName || '未命名食物',
        protein: Number(protein) || 0,
        calories: Number(calories) || 0
    });
    setFoodName('');
    setFoodWeight('');
    setProtein('');
    setCalories('');
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/30 z-[60] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[85vh] overflow-y-auto relative shadow-2xl ring-1 ring-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-pink-500 bg-slate-50 rounded-full p-1 transition-colors">
          <XCircle className="w-6 h-6" />
        </button>
        
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center border-b border-slate-100 pb-3">
          <span className="bg-green-50 text-green-500 p-2 rounded-lg mr-3"><Utensils className="w-5 h-5"/></span>
          營養攝取紀錄
        </h3>

        {/* Date & Summary */}
        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <input 
                type="date" 
                className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 text-sm focus:outline-none focus:border-green-400 w-full sm:w-auto"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
            />
            <div className="flex justify-between sm:block sm:text-right items-center">
                <p className="text-xs text-slate-400">當日總計</p>
                <div className="flex gap-2 text-sm font-bold">
                    <span className="text-blue-600">{totalProtein}g 蛋</span>
                    <span className="text-orange-500">{totalCalories} 卡</span>
                </div>
            </div>
        </div>

        {/* Add Form */}
        <div className="bg-green-50/50 p-3 rounded-xl mb-4 border border-green-100 space-y-2">
            <input 
                type="text" 
                placeholder="食物名稱 (例: 雞胸肉)" 
                className="w-full bg-white border border-green-200 rounded-lg p-2 text-sm focus:outline-none focus:border-green-400 placeholder-slate-400"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
            />
            
            <div className="flex gap-2 items-center">
                <input 
                    type="number" 
                    placeholder="重量 (g)" 
                    className="flex-1 min-w-0 bg-white border border-green-200 rounded-lg p-2 text-sm focus:outline-none focus:border-green-400 placeholder-slate-400"
                    value={foodWeight}
                    onChange={(e) => setFoodWeight(e.target.value)}
                />
                <button
                    onClick={handleAICalculate}
                    disabled={isCalculating || !foodName || !foodWeight}
                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center whitespace-nowrap"
                >
                    {isCalculating ? <span className="animate-spin mr-1">⟳</span> : <Sparkles className="w-3 h-3 mr-1" />}
                    AI 計算
                </button>
            </div>

            <div className="flex gap-2">
                <input 
                    type="number" 
                    placeholder="蛋白質(g)" 
                    className="flex-1 min-w-0 bg-white border border-green-200 rounded-lg p-2 text-sm focus:outline-none focus:border-green-400 placeholder-slate-400"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                />
                <input 
                    type="number" 
                    placeholder="熱量(kcal)" 
                    className="flex-1 min-w-0 bg-white border border-green-200 rounded-lg p-2 text-sm focus:outline-none focus:border-green-400 placeholder-slate-400"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                />
            </div>
            <button 
                onClick={handleAdd}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-bold text-sm transition-colors shadow-sm"
            >
                新增紀錄
            </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {currentDayLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                    本日尚無飲食紀錄
                </div>
            ) : (
                currentDayLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-transparent hover:border-slate-200 transition-all">
                        <div>
                            <p className="text-slate-700 font-medium text-sm">{log.name}</p>
                            <p className="text-xs text-slate-400">
                                {log.protein > 0 && <span className="text-blue-500 mr-2">{log.protein}g 蛋白質</span>}
                                {log.calories > 0 && <span className="text-orange-500">{log.calories} kcal</span>}
                            </p>
                        </div>
                        <button 
                            onClick={() => onDelete(log.id)}
                            className="text-slate-300 hover:text-red-500 p-1 rounded-md transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

// 1.8 Stats Modal Component
const StatsModal = ({ logs, onClose }) => {
  const getVolumeData = () => {
    // Take last 7 logs
    const recentLogs = [...logs].slice(0, 7).reverse(); 
    if (recentLogs.length === 0) return [];
    
    // Calculate max volume to normalize bar height
    const maxVol = Math.max(...recentLogs.map(l => {
        return l.exercises?.reduce((acc, ex) => {
            return acc + (ex.sets?.reduce((sAcc, s) => sAcc + (Number(s.weight) * Number(s.reps)), 0) || 0);
        }, 0) || 0;
    }));

    return recentLogs.map(log => {
        const volume = log.exercises?.reduce((acc, ex) => {
            return acc + (ex.sets?.reduce((sAcc, s) => sAcc + (Number(s.weight) * Number(s.reps)), 0) || 0);
        }, 0) || 0;
        
        return {
            date: log.createdAt.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
            volume,
            height: maxVol > 0 ? (volume / maxVol) * 100 : 0
        };
    });
  };

  const data = getVolumeData();
  const totalLifetimeVolume = logs.reduce((acc, log) => {
     return acc + (log.exercises?.reduce((eAcc, ex) => {
         return eAcc + (ex.sets?.reduce((sAcc, s) => sAcc + (Number(s.weight) * Number(s.reps)), 0) || 0);
     }, 0) || 0);
  }, 0);

  const getPR = (nameKeyword) => {
    let maxWeight = 0;
    logs.forEach(log => {
        log.exercises?.forEach(ex => {
            if (ex.name.includes(nameKeyword)) {
                ex.sets?.forEach(s => {
                    if (Number(s.weight) > maxWeight) maxWeight = Number(s.weight);
                });
            }
        });
    });
    return maxWeight;
  };

  const benchPR = getPR('臥推');
  const squatPR = getPR('深蹲');
  const deadliftPR = getPR('硬舉');

  return (
    <div 
      className="fixed inset-0 bg-slate-900/30 z-[60] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto relative shadow-2xl ring-1 ring-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-pink-500 bg-slate-50 rounded-full p-1 transition-colors">
          <XCircle className="w-6 h-6" />
        </button>
        
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-3">
          <span className="bg-purple-100 text-purple-600 p-2 rounded-lg mr-3"><BarChart2 className="w-5 h-5"/></span>
          訓練量分析
        </h3>

        {/* Volume Chart */}
        <div className="mb-8">
            <h4 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wide">近7次訓練容量 (Volume)</h4>
            <div className="flex items-end justify-between h-40 gap-2">
                {data.length > 0 ? data.map((d, i) => (
                    <div key={i} className="flex flex-col items-center flex-1 group">
                        <div className="relative w-full flex justify-center">
                             {/* Tooltip */}
                             <div className="absolute bottom-full mb-1 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                {d.volume} kg
                             </div>
                             {/* Bar */}
                             <div 
                                className="w-full max-w-[20px] bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-sm transition-all duration-500 hover:opacity-80"
                                style={{ height: `${d.height}%`, minHeight: '4px' }}
                             ></div>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-2">{d.date}</span>
                    </div>
                )) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded-xl">
                        尚無足夠數據
                    </div>
                )}
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">生涯總訓練量</p>
                <p className="text-xl font-bold text-slate-800">{(totalLifetimeVolume / 1000).toFixed(1)} <span className="text-sm font-normal text-slate-400">噸</span></p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">紀錄筆數</p>
                <p className="text-xl font-bold text-slate-800">{logs.length}</p>
            </div>
        </div>

        {/* PR Section */}
        <div>
            <h4 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wide">推估最大紀錄 (PR)</h4>
            <div className="space-y-2">
                <div className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-lg">
                    <span className="text-slate-600 font-medium">胸部 (臥推)</span>
                    <span className="font-bold text-slate-800">{benchPR > 0 ? benchPR : '--'} kg</span>
                </div>
                <div className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-lg">
                    <span className="text-slate-600 font-medium">腿部 (深蹲)</span>
                    <span className="font-bold text-slate-800">{squatPR > 0 ? squatPR : '--'} kg</span>
                </div>
                <div className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-lg">
                    <span className="text-slate-600 font-medium">背部 (硬舉)</span>
                    <span className="font-bold text-slate-800">{deadliftPR > 0 ? deadliftPR : '--'} kg</span>
                </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">* 系統自動抓取動作名稱含關鍵字的最高重量</p>
        </div>

      </div>
    </div>
  );
};

// 2. Home View Component
const HomeView = ({ logs, sunLogs, nutritionLogs, onAddSunLog, onDeleteSunLog, onAddNutrition, onDeleteNutrition, onNavigate, onAIClick, userProfile, showToast }) => {
  const [showSunModal, setShowSunModal] = useState(false);
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const totalWorkouts = logs.length;
  const thisWeekWorkouts = logs.filter(log => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return log.createdAt >= oneWeekAgo;
  }).length;

  const thisWeekSun = sunLogs.filter(log => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return log.createdAt >= oneWeekAgo;
  }).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayNutrition = nutritionLogs.filter(log => log.date === todayStr);
  const todayProtein = todayNutrition.reduce((sum, log) => sum + (Number(log.protein) || 0), 0);
  const todayCalories = todayNutrition.reduce((sum, log) => sum + (Number(log.calories) || 0), 0);
  
  const tdee = userProfile?.tdee ? Number(userProfile.tdee) : 0;
  const tdeeProgress = tdee > 0 ? Math.min((todayCalories / tdee) * 100, 100) : 0;
  
  const proteinTarget = userProfile?.proteinTarget ? Number(userProfile.proteinTarget) : 0;
  const proteinProgress = proteinTarget > 0 ? Math.min((todayProtein / proteinTarget) * 100, 100) : 0;

  return (
    <div className="space-y-6 pb-20 p-4">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            早安，{userProfile?.nickname || '健人'}！
          </h1>
          <p className="text-slate-500 text-sm">{userProfile?.motto || "今天也要美美地運動。"}</p>
        </div>
        <div className="flex gap-2">
          <div onClick={() => onNavigate('profile')} className="bg-pink-50 p-2 rounded-full cursor-pointer hover:bg-pink-100 transition-colors">
            <User className="text-pink-500 w-6 h-6" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {/* Workout Stats */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-2 text-pink-500 mb-2">
            <Trophy className="w-5 h-5" />
            <span className="font-semibold">總訓練</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{totalWorkouts}</p>
          <p className="text-xs text-slate-400">次訓練紀錄</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-2 text-blue-500 mb-2">
            <Flame className="w-5 h-5" />
            <span className="font-semibold">本週活躍</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{thisWeekWorkouts}</p>
          <p className="text-xs text-slate-400">次訓練</p>
        </div>

        {/* Nutrition Stats */}
        <div 
            onClick={() => setShowNutritionModal(true)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group col-span-2 sm:col-span-1 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center space-x-2 text-green-500">
                <Utensils className="w-5 h-5" />
                <span className="font-semibold">營養攝取</span>
             </div>
             <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setShowNutritionModal(true);
                }} 
                className="bg-green-50 text-green-500 p-1.5 rounded-full hover:bg-green-100 transition-colors active:scale-95"
                title="紀錄飲食"
             >
                <Plus className="w-4 h-4" />
             </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
             {/* Protein Col */}
             <div className="flex flex-col">
                <p className="text-xl font-bold text-slate-800 break-words leading-none">
                    {todayProtein}
                    <span className="text-xs text-slate-400 ml-1">
                        {proteinTarget > 0 ? `/ ${proteinTarget}g` : 'g'}
                    </span>
                </p>
                <p className="text-xs text-slate-400 mt-1">蛋白質</p>
                {proteinTarget > 0 && (
                    <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5 overflow-hidden">
                        <div className="bg-blue-400 h-1 rounded-full" style={{ width: `${proteinProgress}%` }}></div>
                    </div>
                )}
             </div>
             {/* Calories Col */}
             <div className="flex flex-col text-right">
                <p className="text-xl font-bold text-slate-800 break-words leading-none">
                    {todayCalories}
                    <span className="text-xs text-slate-400 ml-1">
                        {tdee > 0 ? `/ ${tdee}` : ' kcal'}
                    </span>
                </p>
                <p className="text-xs text-slate-400 mt-1">熱量</p>
                {tdee > 0 && (
                    <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5 overflow-hidden">
                        <div className="bg-orange-400 h-1 rounded-full ml-auto" style={{ width: `${tdeeProgress}%` }}></div>
                    </div>
                )}
             </div>
          </div>
        </div>

        {/* Sun Exposure Stats */}
        <div 
            onClick={() => setShowSunModal(true)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group col-span-2 sm:col-span-1 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center space-x-2 text-orange-500">
                <Sun className="w-5 h-5" />
                <span className="font-semibold">日曬紀錄</span>
             </div>
             <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onAddSunLog(); 
                }} 
                className="bg-orange-50 text-orange-500 p-1.5 rounded-full hover:bg-orange-100 transition-colors active:scale-95"
                title="快速打卡"
             >
                <Plus className="w-4 h-4" />
             </button>
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">{thisWeekSun}</p>
          <p className="text-xs text-slate-400">本週次數</p>
        </div>

        {/* Training Analysis Stats */}
        <div 
            onClick={() => setShowStatsModal(true)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group col-span-2 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center space-x-2 text-purple-600">
                <BarChart2 className="w-5 h-5" />
                <span className="font-semibold">訓練分析</span>
             </div>
             <div className="bg-purple-50 text-purple-600 px-2 py-1 rounded-lg text-[10px] font-bold">
                 查看圖表
             </div>
          </div>
          <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-slate-800">
                {logs.reduce((acc, log) => {
                     return acc + (log.exercises?.reduce((eAcc, ex) => {
                         return eAcc + (ex.sets?.reduce((sAcc, s) => sAcc + (Number(s.weight) * Number(s.reps)), 0) || 0);
                     }, 0) || 0);
                  }, 0) / 1000}
              </p>
              <p className="text-sm font-medium text-slate-500 mb-1.5">噸 (總容量)</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-slate-800 font-semibold flex items-center">
            <Activity className="w-4 h-4 mr-2 text-blue-500" />
            最近紀錄
          </h3>
          <button onClick={() => onNavigate('history')} className="text-xs text-pink-500 hover:text-pink-600 font-medium">
            查看全部
          </button>
        </div>
        
        {logs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            <p>尚未有紀錄，開始你的第一次訓練吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.slice(0, 3).map(log => (
              <div key={log.id} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center group hover:bg-slate-100 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                      <span className="text-xs bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-md font-medium">
                        {log.week || '第 1 週'}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md font-medium">
                        {log.weekday || getDayOfWeek(log.createdAt)}
                      </span>
                  </div>
                  <p className="text-slate-700 font-medium mt-1 group-hover:text-slate-900">{log.title || '無標題訓練'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {log.createdAt.toLocaleDateString('zh-TW')} • {log.exercises?.length || 0} 個動作
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
              </div>
            ))}
          </div>
        )}
      </div>

      {showSunModal && (
        <SunHistoryModal 
            sunLogs={sunLogs} 
            onClose={() => setShowSunModal(false)}
            onAdd={onAddSunLog}
            onDelete={onDeleteSunLog}
        />
      )}

      {showNutritionModal && (
        <NutritionModal 
            nutritionLogs={nutritionLogs}
            onClose={() => setShowNutritionModal(false)}
            onAdd={onAddNutrition}
            onDelete={onDeleteNutrition}
            showToast={showToast}
        />
      )}

      {showStatsModal && (
        <StatsModal 
            logs={logs}
            onClose={() => setShowStatsModal(false)}
        />
      )}
    </div>
  );
};

// 3. AI Coach View Component
const AICoachView = ({ showToast, onNavigate, workoutDrafts, setWorkoutDrafts, currentDay, userProfile }) => {
  const [prompt, setPrompt] = useState('');
  const [bodyWeight, setBodyWeight] = useState(userProfile?.weight || ''); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [difficulty, setDifficulty] = useState('初學者'); // Difficulty State

  const ROUTINES_BY_DIFFICULTY = {
    '初學者': [
      { day: '入門', title: '新手胸手入門', icon: 'M', desc: '基礎動作感受度', prompt: '幫我設計一份適合「健身初學者」的胸肌與手臂訓練菜單。器材：可調式啞鈴、無健身椅。動作請選擇最基礎、容易上手的項目（如地板臥推、站姿彎舉），重點在於感受度與正確姿勢。' },
      { day: '高效', title: '高效進步', icon: 'S', desc: '漸進式超負荷', prompt: '幫我設計一份適合「初學者想要快速進步」的胸肌與手臂菜單。器材：可調式啞鈴、無健身椅。重點在於『漸進式超負荷』的觀念應用，安排動作時請備註如何每週增加重量或次數，並加入一些離心控制技巧。' },
      { day: '輕量', title: '30分鐘 輕運動', icon: 'T', desc: '無壓力動一動', prompt: '幫我設計一份 30 分鐘內的「輕量級」胸手訓練。適合今天不想太累，只想維持活動量的初學者。無健身椅。' },
      { day: '手臂', title: '手臂線條雕塑', icon: 'W', desc: '告別拜拜肉', prompt: '幫我設計一份適合初學者的「手臂線條」菜單（二頭+三頭）。使用啞鈴，重量輕、次數多 (12-15下)，重點在於消除手臂贅肉與修飾線條。' },
      { day: '徒手', title: '啞鈴+伏地挺身', icon: 'F', desc: '居家黃金組合', prompt: '幫我設計一份結合「啞鈴」與「伏地挺身 (可跪姿)」的初學者菜單。針對胸肌與手臂，利用徒手動作輔助啞鈴訓練，強度循序漸進。' },
    ],
    '中階': [
      { day: '增肌', title: '經典肌肥大', icon: 'M', desc: '8-12下黃金次數', prompt: '幫我設計一份適合「中階者」的胸肌與手臂菜單。目標是肌肥大 (Hypertrophy)，使用 8-12 RM 的重量。無健身椅，請安排地板臥推及其變式。' },
      { day: '超級', title: '胸手超級組', icon: 'T', desc: '省時高強度', prompt: '幫我設計一份「胸肌 + 手臂」的超級組 (Superset) 菜單，適合中階訓練者。透過對抗肌群安排（如胸+二頭或胸+三頭）來增加代謝壓力。無健身椅。' },
      { day: '上胸', title: '上胸專項加強', icon: 'W', desc: '改善鎖骨線條', prompt: '幫我設計一份針對「上胸」的加強菜單，適合中階者。注意：無健身椅，請安排反手前平舉、低位夾胸、臀橋地板臥推等動作。' },
      { day: '泵感', title: '手臂充血訓練', icon: 'F', desc: '二三頭對抗組', prompt: '幫我設計一份針對手臂（二頭肌與三頭肌）的對抗組菜單。中階強度，目標是極致的泵感 (Pump)。' },
    ],
    '進階': [
      { day: '力量', title: '5x5 力量胸', icon: 'M', desc: '大重量突破', prompt: '幫我設計一份針對胸肌的「5x5 力量訓練」菜單，適合進階者。專注於推的大重量動作（以地板臥推為主），組間休息可稍長。' },
      { day: '力竭', title: '遞減組地獄', icon: 'T', desc: '榨乾最後力氣', prompt: '幫我設計一份包含「遞減組 (Drop Sets)」的高強度胸手菜單。適合進階者，在最後一組進行重量遞減，徹底力竭。' },
      { day: '巨大', title: 'GVT 德國壯漢', icon: 'W', desc: '10x10 耐力戰', prompt: '幫我設計一份改良版的 GVT (10x10) 訓練菜單，針對胸肌（地板臥推）。適合進階者挑戰肌肉耐力與極限。' },
      { day: '混合', title: 'FST-7 筋膜伸展', icon: 'F', desc: '頂峰收縮', prompt: '幫我設計一份結合 FST-7 概念的胸手菜單。在動作最後安排 7 組高次數訓練，強調頂峰收縮與筋膜伸展（無椅版本）。' },
    ]
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast("請輸入你的訓練需求", "error");
      return;
    }

    setIsGenerating(true);
    setGeneratedPlan(null);
    
    try {
      const weightInfo = bodyWeight ? `使用者體重：${bodyWeight}公斤。` : "";
      
      const systemPrompt = `
        你是一位專精於「胸肌」與「手臂」訓練的健身教練。
        目前使用者設定的訓練難度為：【${difficulty}】。
        
        【重要器材限制】：
        1. 使用者只有一組「可調式啞鈴」。
        2. ❌ 使用者「沒有健身椅 (No Workout Bench)」。
        3. 可調整的重量段數固定為以下數值 (KG)：
           [4.5, 5.6, 6.8, 9, 10.2, 11.3, 13.6, 14.7, 15.8, 18.1, 19.2, 20.4, 22.6, 23.8, 25]。

        請根據使用者的需求${bodyWeight ? "與體重" : ""}，生成一個結構化的訓練課表。
        ${bodyWeight ? `請利用使用者的體重來評估合適的起始重量。對於【${difficulty}】者，請給予符合該程度的重量建議（初學者輕、中階適中、進階重），但必須在器材提供的重量範圍內。` : ""}
        
        嚴格遵守動作規則：
        1. 只能安排「胸肌」或「手臂」動作。
        2. 因為「沒有健身椅」，所有躺姿動作必須改為「地板動作 (Floor exercises)」或「站姿/坐姿(無靠背)」。
           - ✅ 推薦：地板臥推 (Floor Press)、臀橋地板臥推、跪姿伏地挺身、站姿/坐姿彎舉、站姿/坐姿三頭肌伸展。
           - ❌ 禁止：上斜啞鈴臥推、平板臥推等需要椅子的動作。
        3. 請根據【${difficulty}】調整組數與次數：
           - 初學者：建議 12-15 下，重點在姿勢與感受度。
           - 中階：建議 8-12 下，重點在肌肥大。
           - 進階：建議 5x5 (力量) 或 遞減組，強度高。
        4. 請務必回傳純 JSON 格式，不要包含任何 Markdown 標記或其他文字。
        
        JSON 結構必須如下：
        {
          "title": "訓練標題",
          "exercises": [
            {
              "name": "動作名稱",
              "sets": [
                { "reps": "建議次數", "weight": "建議重量(從上述數值挑選，可留空)" },
                { "reps": "建議次數", "weight": "" },
                { "reps": "建議次數", "weight": "" }
              ]
            }
          ]
        }
        通常每個動作建議 3-4 組。
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `使用者需求：${prompt}。${weightInfo}` }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message || "API request failed");
      
      let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) throw new Error("No content generated");

      resultText = cleanJsonString(resultText);
      const plan = JSON.parse(resultText);
      setGeneratedPlan(plan);
      showToast("訓練菜單生成完畢！", "ai");

    } catch (error) {
      console.error("AI Gen Error:", error);
      showToast("生成失敗，請稍後再試", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const applyPlan = () => {
    if (!generatedPlan) return;
    
    setWorkoutDrafts(prev => ({
      ...prev,
      [currentDay]: {
        ...prev[currentDay],
        title: generatedPlan.title,
        exercises: generatedPlan.exercises.map(ex => ({
          ...ex,
          id: Date.now() + Math.random(),
          sets: ex.sets ? ex.sets.map(s => ({ ...s, weight: s.weight || '' })) : []
        }))
      }
    }));
    
    onNavigate('log');
    showToast(`已載入至 ${currentDay}`, "success");
  };

  const selectRoutine = (routinePrompt) => {
    setPrompt(routinePrompt);
  };

  return (
    <div className="space-y-6 pb-24 p-4">
      <header className="mb-2">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-pink-500 flex items-center">
          <Sparkles className="w-6 h-6 mr-2 text-pink-500" />
          AI 胸手專項教練
        </h1>
        <p className="text-slate-500 text-sm mt-1">無健身椅模式：專注地板臥推與站姿訓練。</p>
      </header>

      {/* Difficulty Selector */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 mb-4">
        {['初學者', '中階', '進階'].map((level) => (
          <button
            key={level}
            onClick={() => {
                setDifficulty(level);
                setGeneratedPlan(null); // Clear previous plan if any
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              difficulty === level 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Daily Routine Selector (Dynamic based on Difficulty) */}
      {!generatedPlan && (
        <div className="mb-4">
          <h3 className="text-slate-700 font-semibold flex items-center mb-3 text-sm">
            {/* Replaced BarChart3 with TrendingUp for difficulty selection icon */}
            <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
            {difficulty}精選菜單
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {ROUTINES_BY_DIFFICULTY[difficulty].map((routine, idx) => (
              <button
                key={idx}
                onClick={() => selectRoutine(routine.prompt)}
                className="flex-shrink-0 w-32 bg-white border border-slate-200 p-3 rounded-xl flex flex-col gap-2 hover:border-pink-300 hover:shadow-md transition-all text-left group"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">{routine.day}</span>
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xs font-bold">
                    {routine.icon}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm leading-tight group-hover:text-pink-500 transition-colors">{routine.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{routine.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
         {/* Weight Input */}
         <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="bg-white p-1.5 rounded-full shadow-sm">
               <Scale className="w-4 h-4 text-blue-500" />
            </div>
            <input 
              type="number" 
              placeholder="體重 (kg) 用於計算" 
              className="bg-transparent text-slate-700 w-full outline-none text-sm placeholder-slate-400"
              value={bodyWeight}
              onChange={(e) => setBodyWeight(e.target.value)}
            />
         </div>

         <textarea
           className="w-full bg-slate-50 text-slate-800 p-3 rounded-lg border border-slate-100 focus:border-pink-300 outline-none min-h-[100px] text-base placeholder-slate-400 transition-colors"
           placeholder={`例如：我是${difficulty}，想要練胸肌，請給我適合的動作...`}
           value={prompt}
           onChange={(e) => setPrompt(e.target.value)}
         ></textarea>
         <div className="flex justify-end">
           <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-500 to-pink-500 text-white px-6 py-2 rounded-lg font-semibold shadow-lg shadow-pink-200 flex items-center disabled:opacity-50 hover:opacity-90 transition-all"
           >
              {isGenerating ? (
                <> <span className="animate-spin mr-2">⟳</span> 思考中... </>
              ) : (
                <> <Sparkles className="w-4 h-4 mr-2" /> 生成菜單 </>
              )}
           </button>
         </div>
      </div>

      {generatedPlan && (
        <div className="bg-white rounded-xl p-5 border-2 border-blue-100 animate-fade-in shadow-xl relative">
          <button 
            onClick={() => setGeneratedPlan(null)} 
            className="absolute top-2 right-2 text-slate-400 hover:text-pink-500"
          >
            <XCircle className="w-6 h-6" />
          </button>

          <div className="flex flex-col gap-4">
              <div className="mb-2">
                  <h3 className="text-xl font-bold text-slate-800">{generatedPlan.title}</h3>
                  <span className="inline-block mt-1 bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded">AI 推薦 ({difficulty})</span>
              </div>
              
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
              {generatedPlan.exercises?.map((ex, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="flex items-center">
                      <span className="bg-white w-6 h-6 flex items-center justify-center rounded-full text-xs mr-3 text-slate-500 shadow-sm border border-slate-100">{idx + 1}</span>
                      <span className="text-slate-700 font-medium">{ex.name}</span>
                  </div>
                  <span className="text-slate-400 text-xs whitespace-nowrap ml-2">
                      {ex.sets?.length || 3} 組
                  </span>
                  </div>
              ))}
              </div>

              <button 
              onClick={applyPlan}
              className="w-full bg-gradient-to-r from-blue-500 to-pink-500 text-white py-4 rounded-xl font-bold flex items-center justify-center group transition-all shadow-lg shadow-pink-200 active:scale-95"
              >
               立即開始訓練 <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 4. Log Workout View Component
const LogWorkoutView = ({ user, showToast, onNavigate, workoutDrafts, setWorkoutDrafts, currentDay, setCurrentDay }) => {
  const currentWorkout = workoutDrafts[currentDay];
  const { title, exercises, week } = currentWorkout;
  
  const [isSaving, setIsSaving] = useState(false);
  const [guideExercise, setGuideExercise] = useState(null); 

  const updateCurrentDraft = (updates) => {
    setWorkoutDrafts(prev => ({
      ...prev,
      [currentDay]: { ...prev[currentDay], ...updates }
    }));
  };

  const handleClear = () => {
    if(window.confirm(`確定要清空 ${currentDay} 的訓練內容嗎？`)) {
      updateCurrentDraft({
        title: `${currentDay}訓練`,
        exercises: [{ id: Date.now(), name: '', sets: [{ reps: '', weight: '' }] }]
      });
      showToast(`${currentDay} 內容已清空`, "info");
    }
  };

  const changeWeek = (increment) => {
    const currentWeekNum = parseInt(week.replace(/\D/g, '')) || 1;
    let newWeekNum = currentWeekNum + increment;
    if (newWeekNum < 1) newWeekNum = 1;
    updateCurrentDraft({ week: `第 ${newWeekNum} 週` });
  };

  const addExercise = () => {
    updateCurrentDraft({ exercises: [...exercises, { id: Date.now(), name: '', sets: [{ reps: '', weight: '' }] }] });
  };

  const removeExercise = (index) => {
    const newEx = [...exercises];
    newEx.splice(index, 1);
    updateCurrentDraft({ exercises: newEx });
  };

  const updateExerciseName = (index, name) => {
    const newEx = [...exercises];
    newEx[index].name = name;
    updateCurrentDraft({ exercises: newEx });
  };

  const addSet = (exIndex) => {
    const newEx = [...exercises];
    const lastSet = newEx[exIndex].sets[newEx[exIndex].sets.length - 1];
    newEx[exIndex].sets.push({ 
      reps: lastSet ? lastSet.reps : '', 
      weight: lastSet ? lastSet.weight : '' 
    });
    updateCurrentDraft({ exercises: newEx });
  };

  const removeSet = (exIndex, setIndex) => {
    const newEx = [...exercises];
    newEx[exIndex].sets.splice(setIndex, 1);
    updateCurrentDraft({ exercises: newEx });
  };

  const updateSet = (exIndex, setIndex, field, value) => {
    const newEx = [...exercises];
    newEx[exIndex].sets[setIndex][field] = value;
    updateCurrentDraft({ exercises: newEx });
  };

  const handleSave = async () => {
    if (!user) return;
    if (exercises.length === 0) {
      showToast("請至少新增一個動作", "error");
      return;
    }
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'workout_logs'), {
        title: title || `${currentDay}訓練`,
        exercises,
        weekday: currentDay,
        week: week || '第 1 週',
        createdAt: serverTimestamp()
      });
      showToast("已儲存！", "success");
    } catch (error) {
      console.error("Error adding document: ", error);
      showToast("儲存失敗", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-slate-800">紀錄訓練</h2>
        <button 
          onClick={handleClear}
          className="flex items-center text-sm bg-white hover:bg-red-50 text-slate-500 hover:text-red-500 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 shadow-sm"
        >
          <RotateCcw className="w-4 h-4 mr-1.5" /> 清空
        </button>
      </div>

      {/* Week Selector */}
      <div className="flex items-center justify-between bg-white p-2 rounded-xl mb-1 border border-slate-200 shadow-sm">
         <button onClick={() => changeWeek(-1)} className="p-2 text-slate-400 hover:text-blue-500 bg-slate-50 rounded-lg hover:bg-blue-50 transition-colors">
            <ChevronLeft className="w-5 h-5" />
         </button>
         <span className="text-slate-800 font-bold text-lg">{week}</span>
         <button onClick={() => changeWeek(1)} className="p-2 text-slate-400 hover:text-blue-500 bg-slate-50 rounded-lg hover:bg-blue-50 transition-colors">
            <ChevronRight className="w-5 h-5" />
         </button>
      </div>
      
      {/* Day Selector Tabs */}
      <div className="flex justify-between bg-white p-1.5 rounded-xl mb-2 overflow-x-auto border border-slate-200 shadow-sm">
        {DAYS_OF_WEEK.map((day) => (
           <button
             key={day}
             onClick={() => setCurrentDay(day)}
             className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap mx-0.5 ${currentDay === day ? 'bg-pink-500 text-white shadow-md shadow-pink-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
           >
             {day}
           </button>
        ))}
      </div>

      <input 
        type="text" 
        placeholder="訓練標題" 
        className="w-full bg-white text-slate-800 p-4 rounded-xl border border-slate-200 focus:border-pink-400 outline-none text-lg shadow-sm transition-colors"
        value={title}
        onChange={(e) => updateCurrentDraft({ title: e.target.value })}
      />

      {exercises.map((exercise, exIndex) => (
        <div key={exercise.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm animate-fade-in-up" style={{ animationDelay: `${exIndex * 50}ms` }}>
          <div className="flex justify-between items-center mb-3">
            <input 
              type="text" 
              placeholder="動作名稱" 
              className="bg-transparent text-lg font-semibold text-slate-800 placeholder-slate-300 outline-none w-full mr-2"
              value={exercise.name}
              onChange={(e) => updateExerciseName(exIndex, e.target.value)}
            />
            <div className="flex items-center gap-2">
                {exercise.name && (
                    <button 
                        onClick={() => setGuideExercise(exercise.name)} 
                        className="text-blue-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        title="指導"
                    >
                        <Info className="w-5 h-5" />
                    </button>
                )}
                <button onClick={() => removeExercise(exIndex)} className="text-slate-400 hover:text-pink-500 p-1.5 rounded-lg hover:bg-pink-50 transition-colors">
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
          </div>

          <div className="space-y-2">
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-2 text-xs text-slate-400 text-center mb-1 font-medium">
              <div className="col-span-1">組</div>
              <div className="col-span-2">公斤</div>
              <div className="col-span-2">次數</div>
              <div className="col-span-1"></div>
            </div>
            {exercise.sets.map((set, setIndex) => (
              <div key={setIndex} className="grid grid-cols-6 gap-2 items-center">
                <div className="col-span-1 flex justify-center">
                  <span className="bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                    {setIndex + 1}
                  </span>
                </div>
                <div className="col-span-2">
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 text-center text-slate-800 p-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none transition-colors"
                    value={set.weight}
                    placeholder="-"
                    onChange={(e) => updateSet(exIndex, setIndex, 'weight', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 text-center text-slate-800 p-2 rounded-lg border border-slate-200 focus:border-pink-400 outline-none transition-colors"
                    value={set.reps}
                    placeholder="-"
                    onChange={(e) => updateSet(exIndex, setIndex, 'reps', e.target.value)}
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                   {exercise.sets.length > 1 && (
                      <button onClick={() => removeSet(exIndex, setIndex)} className="text-slate-300 hover:text-pink-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                   )}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => addSet(exIndex)}
            className="mt-4 w-full py-2 bg-slate-50 hover:bg-blue-50 text-blue-600 rounded-lg text-sm flex items-center justify-center transition-colors border border-dashed border-slate-200 hover:border-blue-200"
          >
            <Plus className="w-4 h-4 mr-1" /> 新增組數
          </button>
        </div>
      ))}

      <div className="flex gap-3 pt-4">
        <button 
          onClick={addExercise}
          className="flex-1 py-3 border border-pink-200 text-pink-500 bg-white rounded-xl font-medium flex items-center justify-center hover:bg-pink-50 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" /> 新增動作
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-3 bg-pink-500 text-white rounded-xl font-bold shadow-lg shadow-pink-200 flex items-center justify-center hover:bg-pink-600 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
              <span className="animate-spin mr-2">⟳</span>
          ) : (
              <Save className="w-5 h-5 mr-2" />
          )}
           完成訓練
        </button>
      </div>

      {guideExercise && (
        <ExerciseGuideModal 
            exerciseName={guideExercise} 
            onClose={() => setGuideExercise(null)} 
        />
      )}
    </div>
  );
};

// 5. History View Component
const HistoryView = ({ logs, user, showToast, onRepeat }) => {
  const handleDelete = async (logId) => {
    if(!window.confirm("確定要刪除這筆紀錄嗎？")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'workout_logs', logId));
      showToast("紀錄已刪除", "success");
    } catch (error) {
      console.error("Delete error", error);
      showToast("刪除失敗", "error");
    }
  };

  return (
    <div className="space-y-4 pb-24 p-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">歷史紀錄</h2>
      {logs.length === 0 ? (
        <div className="text-center text-slate-400 mt-10">
          <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>暫無紀錄，去練練吧！</p>
        </div>
      ) : (
        logs.map(log => (
          <div key={log.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    {log.title}
                    <span className="text-xs font-normal bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full border border-pink-100">
                        {log.week || '第 1 週'}
                    </span>
                    <span className="text-xs font-normal bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                        {log.weekday || getDayOfWeek(log.createdAt)}
                    </span>
                </h3>
                <div className="flex items-center text-sm text-slate-400 mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  {log.createdAt.toLocaleString('zh-TW')}
                </div>
              </div>
              <div className="flex gap-2">
                 <button 
                    onClick={() => onRepeat(log)} 
                    className="text-slate-400 hover:text-green-500 transition-colors p-1"
                    title="重複此訓練"
                 >
                    <Repeat className="w-5 h-5" />
                 </button>
                 <button 
                    onClick={() => handleDelete(log.id)} 
                    className="text-slate-400 hover:text-pink-500 transition-colors p-1"
                    title="刪除"
                 >
                    <Trash2 className="w-5 h-5" />
                 </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {log.exercises?.map((ex, i) => (
                <div key={i}>
                  <p className="text-slate-700 font-medium text-sm mb-1">{ex.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {ex.sets?.map((s, j) => (
                      <span key={j} className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded border border-slate-200">
                        {s.weight}kg x {s.reps}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// 6. Timer View Component
const TimerView = ({ seconds, setSeconds, isActive, setIsActive, targetTime, setTargetTime }) => {
  useEffect(() => {
    let interval = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds - 1);
      }, 1000);
    } else if (seconds === 0 && isActive) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const toggleTimer = () => {
    if (seconds === 0) setSeconds(targetTime);
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSeconds(targetTime);
  };

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] p-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-8">組間休息</h2>
      
      <div className="relative mb-8">
         <div className="w-64 h-64 rounded-full border-8 border-slate-100 flex items-center justify-center bg-white shadow-xl shadow-blue-100 relative">
           <div className={`absolute inset-0 rounded-full border-8 border-pink-400 opacity-30 ${isActive ? 'animate-pulse' : ''}`}></div>
           <span className="text-6xl font-mono font-bold text-slate-700 tracking-widest">
             {formatTime(seconds === 0 && !isActive ? targetTime : seconds)}
           </span>
         </div>
      </div>

      <div className="flex gap-4 mb-8">
        {[30, 60, 90, 120].map(t => (
          <button 
            key={t}
            onClick={() => { setTargetTime(t); setSeconds(t); setIsActive(false); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${targetTime === t ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {t}s
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        <button 
          onClick={toggleTimer}
          className={`w-32 py-4 rounded-xl font-bold text-lg shadow-lg ${isActive ? 'bg-yellow-400 text-white shadow-yellow-200' : 'bg-pink-500 text-white shadow-pink-200'} hover:opacity-90 transition-transform active:scale-95`}
        >
          {isActive ? '暫停' : (seconds !== targetTime && seconds !== 0 ? '繼續' : '開始')}
        </button>
        <button 
          onClick={resetTimer}
          className="w-32 py-4 rounded-xl font-bold text-lg bg-slate-200 text-slate-600 shadow-lg hover:bg-slate-300 transition-transform active:scale-95"
        >
          重置
        </button>
      </div>
    </div>
  );
};

// 7. Profile View Component
const ProfileView = ({ user, userProfile, setUserProfile, showToast, onNavigate }) => {
  const [formData, setFormData] = useState({
    nickname: userProfile?.nickname || '',
    age: userProfile?.age || '',
    height: userProfile?.height || '',
    weight: userProfile?.weight || '',
    motto: userProfile?.motto || '',
    gender: userProfile?.gender || 'male', 
    activityLevel: userProfile?.activityLevel || '1.2',
    proteinMultiplier: userProfile?.proteinMultiplier || '2.0', // Default 2.0
  });
  const [isSaving, setIsSaving] = useState(false);

  const calculateBMI = () => {
    if (formData.height && formData.weight) {
      const h = parseFloat(formData.height) / 100;
      const w = parseFloat(formData.weight);
      return (w / (h * h)).toFixed(1);
    }
    return '--';
  };

  const calculateTDEE = () => {
    if (formData.height && formData.weight && formData.age) {
        const weight = parseFloat(formData.weight);
        const height = parseFloat(formData.height);
        const age = parseFloat(formData.age);
        const activity = parseFloat(formData.activityLevel);
        
        let bmr = 0;
        if (formData.gender === 'male') {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }
        
        return Math.round(bmr * activity);
    }
    return '--';
  };

  const calculateProteinTarget = () => {
      if (formData.weight && formData.proteinMultiplier) {
          return Math.round(parseFloat(formData.weight) * parseFloat(formData.proteinMultiplier));
      }
      return '--';
  }

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const calculatedTDEE = calculateTDEE();
      const calculatedProtein = calculateProteinTarget();
      
      const tdeeValue = calculatedTDEE !== '--' ? calculatedTDEE : 0;
      const proteinValue = calculatedProtein !== '--' ? calculatedProtein : 0;
      
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info');
      const dataToSave = {
        ...formData,
        tdee: tdeeValue,
        proteinTarget: proteinValue,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(profileRef, dataToSave);
      setUserProfile(dataToSave);
      showToast("個人資料已更新！", "success");
      onNavigate('home'); 
    } catch (error) {
      console.error("Error saving profile:", error);
      showToast("更新失敗，請稍後再試", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 p-4">
      <header className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-slate-800">個人資料</h1>
        <button onClick={() => onNavigate('home')} className="text-slate-400 hover:text-slate-600">
          <XCircle className="w-6 h-6" />
        </button>
      </header>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 gap-4">
          {/* TDEE Card */}
          <div className="bg-gradient-to-r from-pink-400 to-pink-500 rounded-2xl p-4 text-white shadow-lg shadow-pink-200">
            <p className="text-white/80 text-xs font-medium mb-1">每日消耗 (TDEE)</p>
            <div className="flex items-baseline">
                <p className="text-3xl font-bold">{calculateTDEE()}</p>
                <span className="text-xs ml-1 text-white/80">kcal</span>
            </div>
          </div>
          {/* Protein Card */}
          <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl p-4 text-white shadow-lg shadow-blue-200">
            <p className="text-white/80 text-xs font-medium mb-1">蛋白質目標 ({formData.proteinMultiplier}g/kg)</p>
            <div className="flex items-baseline">
                <p className="text-3xl font-bold">{calculateProteinTarget()}</p>
                <span className="text-xs ml-1 text-white/80">g</span>
            </div>
          </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        {/* Basic Info */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">暱稱</label>
          <input 
            type="text" 
            className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none text-slate-800 focus:border-pink-400 transition-colors"
            placeholder="幫自己取個帥氣的名字"
            value={formData.nickname}
            onChange={(e) => setFormData({...formData, nickname: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">個人宣言</label>
          <input 
            type="text" 
            className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none text-slate-800 focus:border-pink-400 transition-colors"
            placeholder="今天也要美美地運動。"
            value={formData.motto}
            onChange={(e) => setFormData({...formData, motto: e.target.value})}
          />
        </div>

        {/* Physical Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">身高 (cm)</label>
            <input 
              type="number" 
              className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none text-slate-800 focus:border-pink-400 transition-colors"
              placeholder="175"
              value={formData.height}
              onChange={(e) => setFormData({...formData, height: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">體重 (kg)</label>
            <input 
              type="number" 
              className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none text-slate-800 focus:border-pink-400 transition-colors"
              placeholder="70"
              value={formData.weight}
              onChange={(e) => setFormData({...formData, weight: e.target.value})}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">年齡</label>
          <input 
            type="number" 
            className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none text-slate-800 focus:border-pink-400 transition-colors"
            placeholder="25"
            value={formData.age}
            onChange={(e) => setFormData({...formData, age: e.target.value})}
          />
        </div>

        {/* TDEE & Protein Parameters */}
        <div className="pt-2 border-t border-slate-100">
             <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center">
                 {/* Replaced Calculator with Activity for TDEE icon */}
                 <Activity className="w-4 h-4 mr-2 text-blue-500"/>
                 進階參數設定
             </label>
             
             <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">性別</label>
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                        <button 
                            className={`flex-1 py-2 text-xs rounded-lg transition-all ${formData.gender === 'male' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-400'}`}
                            onClick={() => setFormData({...formData, gender: 'male'})}
                        >
                            男
                        </button>
                        <button 
                            className={`flex-1 py-2 text-xs rounded-lg transition-all ${formData.gender === 'female' ? 'bg-white text-pink-500 shadow-sm font-bold' : 'text-slate-400'}`}
                            onClick={() => setFormData({...formData, gender: 'female'})}
                        >
                            女
                        </button>
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">活動量</label>
                    <select 
                        className="w-full bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs text-slate-700 outline-none focus:border-blue-400 h-[38px]"
                        value={formData.activityLevel}
                        onChange={(e) => setFormData({...formData, activityLevel: e.target.value})}
                    >
                        <option value="1.2">久坐 (1.2)</option>
                        <option value="1.375">輕度活動 (1.375)</option>
                        <option value="1.55">中度活動 (1.55)</option>
                        <option value="1.725">高度活動 (1.725)</option>
                        <option value="1.9">極高度活動 (1.9)</option>
                    </select>
                 </div>
             </div>

             {/* Protein Multiplier Selector */}
             <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center">
                    {/* Replaced Beef with Dumbbell for protein icon */}
                    <Dumbbell className="w-3 h-3 mr-1 text-pink-500"/>
                    蛋白質攝取係數 (g/kg)
                </label>
                <select 
                    className="w-full bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs text-slate-700 outline-none focus:border-pink-400 h-[38px]"
                    value={formData.proteinMultiplier}
                    onChange={(e) => setFormData({...formData, proteinMultiplier: e.target.value})}
                >
                    <option value="0.8">0.8 (一般健康)</option>
                    <option value="1.0">1.0 (輕度活動)</option>
                    <option value="1.2">1.2 (耐力訓練)</option>
                    <option value="1.5">1.5 (中度訓練)</option>
                    <option value="1.8">1.8 (增肌入門)</option>
                    <option value="2.0">2.0 (積極增肌)</option>
                    <option value="2.2">2.2 (減脂保留肌肉)</option>
                    <option value="2.5">2.5 (高強度運動員)</option>
                </select>
             </div>
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-pink-500 hover:bg-pink-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-pink-200 flex items-center justify-center transition-all active:scale-95 disabled:opacity-70"
      >
        {isSaving ? (
          <span className="animate-spin mr-2">⟳</span>
        ) : (
          <Save className="w-5 h-5 mr-2" />
        )}
        儲存設定
      </button>

      <div className="text-center">
        <p className="text-xs text-slate-300 mt-4">
          ID: {user?.uid?.substring(0, 8)}
        </p>
      </div>
    </div>
  );
};


// --- Main Application Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); 
  const [activeTab, setActiveTab] = useState('home');
  const [logs, setLogs] = useState([]);
  const [sunLogs, setSunLogs] = useState([]); 
  const [nutritionLogs, setNutritionLogs] = useState([]); // Nutrition logs state
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  // -- New State Management for Daily Drafts --
  const getInitialDraft = (day) => ({
    title: `${day}訓練`,
    weekday: day,
    week: '第 1 週',
    exercises: [{ id: Date.now() + Math.random(), name: '', sets: [{ reps: '', weight: '' }] }]
  });

  const [workoutDrafts, setWorkoutDrafts] = useState(() => {
    const drafts = {};
    DAYS_OF_WEEK.forEach(day => {
      drafts[day] = getInitialDraft(day);
    });
    return drafts;
  });

  const [currentDay, setCurrentDay] = useState(() => {
    const today = getDayOfWeek(new Date());
    return today && DAYS_OF_WEEK.includes(today) ? today : '週一';
  });

  // State lifting for Timer
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [targetTime, setTargetTime] = useState(60);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth Error:", error);
        showToast("登入失敗，請重新整理", "error");
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info');
        const docSnap = await getDoc(profileRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    // 1. Workout Logs
    const logsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'workout_logs');
    const unsubscribeLogs = onSnapshot(logsRef, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({
        id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      fetchedLogs.sort((a, b) => b.createdAt - a.createdAt);
      setLogs(fetchedLogs);
    });

    // 2. Sun Logs
    const sunRef = collection(db, 'artifacts', appId, 'users', user.uid, 'sun_logs');
    const unsubscribeSun = onSnapshot(sunRef, (snapshot) => {
        const fetchedSun = snapshot.docs.map(doc => ({
            id: doc.id, 
            ...doc.data(), 
            createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        fetchedSun.sort((a, b) => b.createdAt - a.createdAt);
        setSunLogs(fetchedSun);
    });

    // 3. Nutrition Logs 
    const nutritionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'nutrition_logs');
    const unsubscribeNutrition = onSnapshot(nutritionRef, (snapshot) => {
        const fetchedNutrition = snapshot.docs.map(doc => ({
            id: doc.id, 
            ...doc.data()
        }));
        setNutritionLogs(fetchedNutrition);
        setLoading(false); 
    }, (error) => {
        console.error("Firestore Error (Nutrition):", error);
    });

    return () => {
        unsubscribeLogs();
        unsubscribeSun();
        unsubscribeNutrition();
    };
  }, [user]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const handleAddSunLog = async (customDate = null) => {
    if (!user) return;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'sun_logs'), {
            createdAt: customDate ? Timestamp.fromDate(customDate) : serverTimestamp()
        });
        showToast("已新增日曬紀錄", "success");
    } catch (error) {
        console.error("Error adding sun log:", error);
        showToast("新增失敗", "error");
    }
  };

  const handleDeleteSunLog = async (id) => {
    if (!user || !window.confirm("確定要刪除這筆日曬紀錄嗎？")) return;
    try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'sun_logs', id));
        showToast("已刪除紀錄", "success");
    } catch (error) {
        console.error("Error deleting sun log:", error);
        showToast("刪除失敗", "error");
    }
  };

  const handleAddNutrition = async (entry) => {
    if (!user) return;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'nutrition_logs'), {
            ...entry,
            createdAt: serverTimestamp()
        });
        showToast("已紀錄營養攝取", "success");
    } catch (error) {
        console.error("Error adding nutrition log:", error);
        showToast("新增失敗", "error");
    }
  };

  const handleDeleteNutrition = async (id) => {
    if (!user || !window.confirm("確定要刪除這筆飲食紀錄嗎？")) return;
    try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'nutrition_logs', id));
        showToast("已刪除紀錄", "success");
    } catch (error) {
        console.error("Error deleting nutrition log:", error);
        showToast("刪除失敗", "error");
    }
  };

  const handleRepeatWorkout = (log) => {
    const duplicatedExercises = log.exercises.map(ex => ({
      ...ex,
      id: Date.now() + Math.random(),
      sets: ex.sets.map(s => ({ ...s }))
    }));

    const targetDay = log.weekday && DAYS_OF_WEEK.includes(log.weekday) ? log.weekday : currentDay;

    setWorkoutDrafts(prev => ({
      ...prev,
      [targetDay]: {
        ...prev[targetDay],
        title: log.title,
        week: log.week || '第 1 週',
        exercises: duplicatedExercises
      }
    }));

    setCurrentDay(targetDay);
    setActiveTab('log');
    showToast(`已載入 ${targetDay} 的歷史訓練`, "success");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-pink-100 selection:text-pink-600">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="max-w-md mx-auto min-h-screen bg-slate-50 relative shadow-2xl">
        <main className="pt-6">
          {activeTab === 'home' && (
            <HomeView 
              logs={logs} 
              sunLogs={sunLogs}
              nutritionLogs={nutritionLogs}
              onAddSunLog={handleAddSunLog}
              onDeleteSunLog={handleDeleteSunLog}
              onAddNutrition={handleAddNutrition}
              onDeleteNutrition={handleDeleteNutrition}
              onNavigate={setActiveTab} 
              onAIClick={() => setActiveTab('ai-coach')} 
              userProfile={userProfile}
              showToast={showToast}
            />
          )}
          {activeTab === 'log' && (
            <LogWorkoutView 
              user={user} 
              showToast={showToast} 
              onNavigate={setActiveTab}
              workoutDrafts={workoutDrafts}
              setWorkoutDrafts={setWorkoutDrafts}
              currentDay={currentDay}
              setCurrentDay={setCurrentDay}
            />
          )}
          {activeTab === 'history' && (
            <HistoryView 
              logs={logs} 
              user={user} 
              showToast={showToast} 
              onRepeat={handleRepeatWorkout}
            />
          )}
          {activeTab === 'timer' && (
            <TimerView 
              showToast={showToast} 
              seconds={seconds} 
              setSeconds={setSeconds} 
              isActive={isActive} 
              setIsActive={setIsActive} 
              targetTime={targetTime} 
              setTargetTime={setTargetTime}
            />
          )}
          {activeTab === 'ai-coach' && (
            <AICoachView 
              showToast={showToast} 
              onNavigate={setActiveTab}
              workoutDrafts={workoutDrafts}
              setWorkoutDrafts={setWorkoutDrafts}
              currentDay={currentDay}
              userProfile={userProfile}
            />
          )}
          {activeTab === 'profile' && (
            <ProfileView 
              user={user}
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              showToast={showToast}
              onNavigate={setActiveTab}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full max-w-md bg-white/90 backdrop-blur-md border-t border-slate-200 pb-safe pt-2 px-2 z-40">
          <div className="flex justify-around items-center h-16">
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'home' ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Activity className="w-6 h-6" />
              <span className="text-[10px] font-medium">總覽</span>
            </button>
            <button 
              onClick={() => setActiveTab('log')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'log' ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Dumbbell className="w-6 h-6" />
              <span className="text-[10px] font-medium">訓練</span>
            </button>
            <div className="w-full relative flex justify-center -top-6">
                <button 
                  onClick={() => setActiveTab('timer')}
                  className={`bg-white border-4 border-slate-50 rounded-full p-4 shadow-xl shadow-blue-100 ${activeTab === 'timer' ? 'text-blue-500' : 'text-slate-300'}`}
                >
                  <Clock className="w-7 h-7" />
                  {isActive && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
                </button>
            </div>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'history' ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <History className="w-6 h-6" />
              <span className="text-[10px] font-medium">紀錄</span>
            </button>
            <button 
              onClick={() => setActiveTab('ai-coach')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'ai-coach' ? 'text-blue-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Sparkles className="w-6 h-6" />
              <span className="text-[10px] font-medium">AI 教練</span>
            </button>
          </div>
        </nav>
      </div>

      {showStatsModal && (
        <StatsModal 
            logs={logs}
            onClose={() => setShowStatsModal(false)}
        />
      )}
    </div>
  );

};
