import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Info, CheckCircle, AlertTriangle, Sparkles, Loader2, Bot, FileText, LineChart, SlidersHorizontal } from 'lucide-react';

export default function App() {
  // 기준 혼동 행렬 (Threshold 0.5 일 때의 앵커 포인트)
  const [baseMatrix, setBaseMatrix] = useState({
    tp: 80,
    fp: 15,
    fn: 5,
    tn: 100
  });

  // 사용자가 탐색 중인 현재 임계값 (0.00 ~ 1.00)
  const [threshold, setThreshold] = useState(0.50);

  // 전체 곡선 데이터 보관용
  const [curveData, setCurveData] = useState([]);
  const [aucAp, setAucAp] = useState({ auc: 0, ap: 0 });

  // AI 상태
  const [aiReport, setAiReport] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [customScenarioInput, setCustomScenarioInput] = useState("");
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [aiScenarioExp, setAiScenarioExp] = useState("");

  const apiKey = "";

  // Base Matrix가 변경될 때마다 0~1 사이의 100개 임계값에 대한 시뮬레이션 곡선 생성
  useEffect(() => {
    const data = [];
    const totalPos = baseMatrix.tp + baseMatrix.fn;
    const totalNeg = baseMatrix.fp + baseMatrix.tn;

    if (totalPos === 0 && totalNeg === 0) {
      setCurveData([]);
      return;
    }

    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      let currentTP, currentFP, currentFN, currentTN;

      // 실제 머신러닝 모델의 확률 분포를 모방한 비대칭 감소 함수 적용
      // 정답(TP, TN)은 확신도가 높아 임계값 변화에도 어느 정도 수치를 유지하지만,
      // 오답(FP, FN)은 0.5 경계선 부근에 헷갈리는 데이터가 몰려있어 임계값을 높이면 급격히 탈락함.
      const powerError = 3.5;   // 오답(FP, FN)이 0을 향해 급격히 곤두박질치는 지수 (가파름)
      const powerCorrect = 2.0; // 정답(TP, TN)이 원래 수치를 유지하며 버티는 지수 (완만함)

      if (t >= 0.5) {
        const x = (t - 0.5) / 0.5; // 0 ~ 1
        currentFP = baseMatrix.fp * Math.pow(1 - x, powerError);
        currentTP = baseMatrix.tp * (1 - Math.pow(x, powerCorrect));
        currentFN = totalPos - currentTP;
        currentTN = totalNeg - currentFP;
      } else {
        const x = (0.5 - t) / 0.5; // 0 ~ 1
        currentFN = baseMatrix.fn * Math.pow(1 - x, powerError);
        currentTN = baseMatrix.tn * (1 - Math.pow(x, powerCorrect));
        currentTP = totalPos - currentFN;
        currentFP = totalNeg - currentTN;
      }

      const tpr = totalPos > 0 ? currentTP / totalPos : 0;
      const fpr = totalNeg > 0 ? currentFP / totalNeg : 0;
      const precision = (currentTP + currentFP) > 0 ? currentTP / (currentTP + currentFP) : 0;
      const recall = tpr;
      const f1 = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
      const accuracy = (totalPos + totalNeg) > 0 ? (currentTP + currentTN) / (totalPos + totalNeg) : 0;

      data.push({
        t, currentTP, currentFP, currentFN, currentTN,
        tpr, fpr, precision, recall, f1, accuracy
      });
    }

    // AUC 및 AP (사다리꼴 공식을 이용한 수치 적분)
    let calcAuc = 0;
    let calcAp = 0;
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const curr = data[i];
      const dxFpr = prev.fpr - curr.fpr; // 임계값이 커지면 FPR은 감소하므로 prev - curr 가 양수
      calcAuc += dxFpr * (prev.tpr + curr.tpr) / 2;
      
      const dxRecall = prev.recall - curr.recall;
      calcAp += dxRecall * (prev.precision + curr.precision) / 2;
    }

    setCurveData(data);
    setAucAp({ auc: calcAuc, ap: calcAp });
  }, [baseMatrix]);

  // 현재 임계값에 해당하는 지표 추출
  const currentStats = useMemo(() => {
    if (curveData.length === 0) return null;
    const index = Math.round(threshold * 100);
    return curveData[Math.min(index, 100)];
  }, [curveData, threshold]);

  // 입력 핸들러 (입력 시 기준 모델이 바뀌므로 임계값은 0.5로 리셋)
  const handleInputChange = (e, type) => {
    const value = parseInt(e.target.value) || 0;
    setBaseMatrix(prev => ({ ...prev, [type]: Math.max(0, value) }));
    setThreshold(0.5); 
  };

  const loadScenario = (scenario) => {
    if (scenario === 'spam') {
      setBaseMatrix({ tp: 50, fp: 2, fn: 20, tn: 200 }); 
    } else if (scenario === 'cancer') {
      setBaseMatrix({ tp: 98, fp: 50, fn: 2, tn: 150 }); 
    } else if (scenario === 'default') {
      setBaseMatrix({ tp: 80, fp: 15, fn: 5, tn: 100 });
    }
    setThreshold(0.5);
    setAiScenarioExp(""); setAiReport("");
  };

  const fetchWithRetry = async (url, options) => {
    let retries = 5;
    let delay = 1000;
    while (retries > 0) {
      try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return await res.json();
      } catch (e) {
        retries--;
        if (retries === 0) throw e;
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      }
    }
  };

  const generateAiReport = async () => {
    if (!currentStats) return;
    setIsAnalyzing(true);
    setAiReport("");
    
    const prompt = `현재 이진 분류 모델의 혼동 행렬은 임계값 ${threshold}에서 TP:${Math.round(currentStats.currentTP)}, FP:${Math.round(currentStats.currentFP)}, FN:${Math.round(currentStats.currentFN)}, TN:${Math.round(currentStats.currentTN)}입니다. Precision은 ${(currentStats.precision*100).toFixed(1)}%, Recall은 ${(currentStats.recall*100).toFixed(1)}%입니다. 이 모델의 현재 상태를 진단하고, 전문가 관점에서 3~4문장으로 친절하게 분석해주세요.`;

    try {
      const data = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );
      setAiReport(data?.candidates?.[0]?.content?.parts?.[0]?.text || "분석 결과를 가져올 수 없습니다.");
    } catch (error) {
      setAiReport("AI 분석 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateCustomScenario = async () => {
    if (!customScenarioInput.trim()) return;
    setIsGeneratingScenario(true);
    setAiScenarioExp("");
    
    const prompt = `사용자가 '${customScenarioInput}'에 대한 이진 분류 모델 시나리오를 요청했습니다. 이 비즈니스 도메인에 현실적으로 발생할 법한 혼동 행렬 수치(TP, FP, FN, TN - 총합 1000 내외)를 제안해주세요. 그리고 이 도메인의 특성상 어떤 지표가 더 중요하며, 왜 이런 수치를 제안했는지 데이터 분석가 관점에서 설명해주세요.`;
    const schema = {
      type: "OBJECT",
      properties: {
        tp: { type: "INTEGER" }, fp: { type: "INTEGER" }, fn: { type: "INTEGER" }, tn: { type: "INTEGER" }, explanation: { type: "STRING" }
      },
      required: ["tp", "fp", "fn", "tn", "explanation"]
    };

    try {
      const data = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", responseSchema: schema }
          })
        }
      );
      const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (resultText) {
        const parsed = JSON.parse(resultText);
        setBaseMatrix({ tp: Math.max(0, parsed.tp), fp: Math.max(0, parsed.fp), fn: Math.max(0, parsed.fn), tn: Math.max(0, parsed.tn) });
        setThreshold(0.5);
        setAiScenarioExp(parsed.explanation);
      }
    } catch (error) {
      setAiScenarioExp("시나리오 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  // SVG 패스 생성 헬퍼 함수
  const createPath = (dataKeyY, xMultiplier = 100) => {
    if (curveData.length === 0) return "";
    return "M " + curveData.map(d => `${d.t * xMultiplier} ${100 - (d[dataKeyY] * 100)}`).join(" L ");
  };
  const createRocPath = () => {
    if (curveData.length === 0) return "";
    return "M " + curveData.map(d => `${d.fpr * 100} ${100 - (d.tpr * 100)}`).join(" L ");
  };
  const createPrPath = () => {
    if (curveData.length === 0) return "";
    return "M " + curveData.map(d => `${d.recall * 100} ${100 - (d.precision * 100)}`).join(" L ");
  };

  if (!currentStats) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
              <Settings className="w-6 h-6" />
              혼동 행렬 & 임계값 시뮬레이터
            </h1>
            <p className="text-slate-500 mt-1">모델의 기준 성능을 세팅하고, 임계값 변화에 따른 ROC/PR 곡선을 분석하세요.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => loadScenario('spam')} className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors font-medium">스팸 메일 (FP↓)</button>
            <button onClick={() => loadScenario('cancer')} className="px-3 py-1.5 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors font-medium">암 진단 (FN↓)</button>
            <button onClick={() => loadScenario('default')} className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors font-medium">초기화</button>
          </div>
        </div>

        {/* AI Scenario Generator */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl shadow-sm border border-purple-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <input 
              type="text" 
              placeholder="궁금한 예측 모델을 적어주세요. (예: 주식 하락 예측, 자율주행 보행자 인식)" 
              value={customScenarioInput}
              onChange={(e) => setCustomScenarioInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white shadow-sm"
              onKeyDown={(e) => e.key === 'Enter' && generateCustomScenario()}
            />
          </div>
          <button 
            onClick={generateCustomScenario}
            disabled={isGeneratingScenario || !customScenarioInput.trim()}
            className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isGeneratingScenario ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            ✨ AI 맞춤 시나리오 생성
          </button>
        </div>

        {aiScenarioExp && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-purple-200 flex items-start gap-4 animate-in fade-in">
            <div className="bg-purple-100 p-2 rounded-lg text-purple-600 shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 mb-1">AI 도메인 분석</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{aiScenarioExp}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column: Input Matrix */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-indigo-500" />
              1. 기준 모델 설정 (Threshold = 0.5 가정)
            </h2>
            <p className="text-xs text-slate-500 mb-6 ml-7">여기에 입력한 숫자가 모델의 기본 뼈대가 되어 분포 곡선을 생성합니다.</p>
            
            <div className="flex flex-col flex-1 justify-center">
              <div className="flex text-sm text-center mb-2 font-medium text-slate-500">
                <div className="w-16"></div>
                <div className="flex-1">예측 0 (Negative)</div>
                <div className="flex-1">예측 1 (Positive)</div>
              </div>
              <div className="flex items-stretch mb-4">
                <div className="w-16 flex items-center justify-center font-medium text-slate-500 text-sm transform -rotate-90">실제 0 (N)</div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  {/* TN */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex flex-col items-center justify-center transition-all focus-within:ring-2 ring-blue-300">
                    <span className="text-blue-800 font-bold mb-1">기준 TN</span>
                    <input type="number" value={baseMatrix.tn} onChange={(e) => handleInputChange(e, 'tn')} className="w-20 text-center text-xl font-semibold bg-white border border-blue-300 rounded-md py-1 outline-none text-blue-900"/>
                    <span className="text-xs text-blue-600 mt-2 text-center leading-tight">실제 N을 N으로<br/>정확히 예측</span>
                  </div>
                  {/* FP */}
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex flex-col items-center justify-center transition-all focus-within:ring-2 ring-red-300">
                    <span className="text-red-800 font-bold mb-1">기준 FP</span>
                    <input type="number" value={baseMatrix.fp} onChange={(e) => handleInputChange(e, 'fp')} className="w-20 text-center text-xl font-semibold bg-white border border-red-300 rounded-md py-1 outline-none text-red-900"/>
                    <span className="text-xs text-red-600 mt-2 text-center leading-tight">실제 N을 P로<br/>잘못 예측 (1종 오류)</span>
                  </div>
                </div>
              </div>
              <div className="flex items-stretch">
                <div className="w-16 flex items-center justify-center font-medium text-slate-500 text-sm transform -rotate-90">실제 1 (P)</div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  {/* FN */}
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 flex flex-col items-center justify-center transition-all focus-within:ring-2 ring-orange-300">
                    <span className="text-orange-800 font-bold mb-1">기준 FN</span>
                    <input type="number" value={baseMatrix.fn} onChange={(e) => handleInputChange(e, 'fn')} className="w-20 text-center text-xl font-semibold bg-white border border-orange-300 rounded-md py-1 outline-none text-orange-900"/>
                    <span className="text-xs text-orange-600 mt-2 text-center leading-tight">실제 P를 N으로<br/>잘못 예측 (2종 오류)</span>
                  </div>
                  {/* TP */}
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex flex-col items-center justify-center transition-all focus-within:ring-2 ring-green-300">
                    <span className="text-green-800 font-bold mb-1">기준 TP</span>
                    <input type="number" value={baseMatrix.tp} onChange={(e) => handleInputChange(e, 'tp')} className="w-20 text-center text-xl font-semibold bg-white border border-green-300 rounded-md py-1 outline-none text-green-900"/>
                    <span className="text-xs text-green-600 mt-2 text-center leading-tight">실제 P를 P로<br/>정확히 예측</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Threshold Controls & Stats */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col ring-2 ring-indigo-50">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-indigo-900">
              <SlidersHorizontal className="w-5 h-5 text-indigo-500" />
              2. 임계값 시뮬레이션
            </h2>
            <p className="text-xs text-slate-500 mb-6 ml-7">슬라이더를 움직여 임계값에 따라 성능이 어떻게 변하는지 확인하세요.</p>

            <div className="mb-6 bg-indigo-50 p-5 rounded-xl border border-indigo-100">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-indigo-900">현재 임계값 (Threshold)</span>
                <span className="text-2xl font-black text-indigo-600">{threshold.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-indigo-400 font-medium mt-2">
                <span>0.0 (너그러움/재현율↑)</span>
                <span>1.0 (엄격함/정밀도↑)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
               {/* TN Box (Dynamic) */}
               <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                 <div className="text-blue-800 font-bold text-sm">TN</div>
                 <div className="text-xl font-bold text-blue-700">{Math.round(currentStats.currentTN)}</div>
               </div>
               {/* FP Box (Dynamic) */}
               <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                 <div className="text-red-800 font-bold text-sm">FP</div>
                 <div className="text-xl font-bold text-red-700">{Math.round(currentStats.currentFP)}</div>
               </div>
               {/* FN Box (Dynamic) */}
               <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                 <div className="text-orange-800 font-bold text-sm">FN</div>
                 <div className="text-xl font-bold text-orange-700">{Math.round(currentStats.currentFN)}</div>
               </div>
               {/* TP Box (Dynamic) */}
               <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                 <div className="text-green-800 font-bold text-sm">TP</div>
                 <div className="text-xl font-bold text-green-700">{Math.round(currentStats.currentTP)}</div>
               </div>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-slate-700">Precision (정밀도)</span>
                <span className="text-xl font-black text-[#06b6d4]">{(currentStats.precision*100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-slate-700">Recall (재현율)</span>
                <span className="text-xl font-black text-[#d946ef]">{(currentStats.recall*100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-slate-700">F1 Score</span>
                <span className="text-xl font-black text-[#eab308]">{(currentStats.f1*100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- Advanced Charts Section --- */}
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 mt-6 text-white">
          <h2 className="text-xl font-bold mb-8 flex items-center gap-2 border-b border-slate-700 pb-4">
            <LineChart className="w-6 h-6 text-indigo-400" />
            고급 성능 시각화 (Advanced Visualization)
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 pb-4">
            
            {/* 1. Threshold vs Score */}
            <div className="flex flex-col">
              <div className="mb-4">
                <h3 className="font-bold text-lg">임계값 변화에 따른 지표</h3>
                <div className="flex gap-3 text-xs mt-2 font-medium">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#06b6d4]"></span>Precision</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#d946ef]"></span>Recall</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#eab308]"></span>F1</span>
                </div>
              </div>
              <div className="relative w-full aspect-square border-l border-b border-slate-600 bg-slate-800/50 p-2 mb-10 ml-4">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                  {/* Grid lines */}
                  {[20,40,60,80].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#334155" strokeWidth="0.5" />)}
                  {[20,40,60,80].map(x => <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="#334155" strokeWidth="0.5" />)}
                  
                  {/* Lines */}
                  <path d={createPath('precision')} fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d={createPath('recall')} fill="none" stroke="#d946ef" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d={createPath('f1')} fill="none" stroke="#eab308" strokeWidth="1.5" strokeLinejoin="round" />
                  
                  {/* Current Threshold Marker */}
                  <line x1={threshold * 100} y1="0" x2={threshold * 100} y2="100" stroke="#f8fafc" strokeDasharray="2" strokeWidth="1" />
                  
                  <text x="50" y="112" textAnchor="middle" fontSize="5" fill="#94a3b8">Threshold</text>
                  <text x="-12" y="50" transform="rotate(-90, -12, 50)" textAnchor="middle" fontSize="5" fill="#94a3b8">Score</text>
                  <text x="-4" y="2" fontSize="4" fill="#64748b">1</text>
                  <text x="-4" y="100" fontSize="4" fill="#64748b">0</text>
                  <text x="100" y="106" textAnchor="end" fontSize="4" fill="#64748b">1.0</text>
                </svg>
              </div>
            </div>

            {/* 2. ROC Curve Chart */}
            <div className="flex flex-col">
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">ROC Curve</h3>
                  <div className="flex gap-3 text-xs mt-2 font-medium">
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#06b6d4]"></span>Model</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t border-dashed border-slate-500"></span>Random</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">AUC</div>
                  <div className="text-lg font-bold text-[#06b6d4]">{aucAp.auc.toFixed(3)}</div>
                </div>
              </div>
              <div className="relative w-full aspect-square border-l border-b border-slate-600 bg-slate-800/50 p-2 mb-10 ml-4">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                  {[20,40,60,80].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#334155" strokeWidth="0.5" />)}
                  {[20,40,60,80].map(x => <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="#334155" strokeWidth="0.5" />)}
                  
                  <line x1="0" y1="100" x2="100" y2="0" stroke="#64748b" strokeDasharray="2" strokeWidth="1" />
                  <path d={`${createRocPath()} L 100 100 Z`} fill="rgba(6, 182, 212, 0.1)" stroke="none" />
                  <path d={createRocPath()} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinejoin="round" />
                  
                  <circle cx={currentStats.fpr * 100} cy={100 - currentStats.tpr * 100} r="3" fill="#f8fafc" stroke="#06b6d4" strokeWidth="1.5" className="animate-pulse" />
                  
                  <text x="50" y="112" textAnchor="middle" fontSize="5" fill="#94a3b8">FPR (False Positive Rate)</text>
                  <text x="-12" y="50" transform="rotate(-90, -12, 50)" textAnchor="middle" fontSize="5" fill="#94a3b8">TPR (Recall)</text>
                  <text x="-4" y="2" fontSize="4" fill="#64748b">1</text>
                  <text x="100" y="106" textAnchor="end" fontSize="4" fill="#64748b">1</text>
                </svg>
              </div>
            </div>

            {/* 3. PR Curve Chart */}
            <div className="flex flex-col">
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">Precision-Recall</h3>
                  <div className="flex gap-3 text-xs mt-2 font-medium">
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#d946ef]"></span>PR Curve</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">AP</div>
                  <div className="text-lg font-bold text-[#d946ef]">{aucAp.ap.toFixed(3)}</div>
                </div>
              </div>
              <div className="relative w-full aspect-square border-l border-b border-slate-600 bg-slate-800/50 p-2 mb-10 ml-4">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                  {[20,40,60,80].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#334155" strokeWidth="0.5" />)}
                  {[20,40,60,80].map(x => <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="#334155" strokeWidth="0.5" />)}
                  
                  <path d={`${createPrPath()} L 100 100 Z`} fill="rgba(217, 70, 239, 0.1)" stroke="none" />
                  <path d={createPrPath()} fill="none" stroke="#d946ef" strokeWidth="2" strokeLinejoin="round" />
                  
                  <circle cx={currentStats.recall * 100} cy={100 - currentStats.precision * 100} r="3" fill="#f8fafc" stroke="#d946ef" strokeWidth="1.5" className="animate-pulse" />
                  
                  <text x="50" y="112" textAnchor="middle" fontSize="5" fill="#94a3b8">Recall</text>
                  <text x="-12" y="50" transform="rotate(-90, -12, 50)" textAnchor="middle" fontSize="5" fill="#94a3b8">Precision</text>
                  <text x="-4" y="2" fontSize="4" fill="#64748b">1</text>
                  <text x="100" y="106" textAnchor="end" fontSize="4" fill="#64748b">1</text>
                </svg>
              </div>
            </div>

          </div>
        </div>

        {/* AI Report Action */}
        <div className="mt-6 pt-6">
          <button 
            onClick={generateAiReport}
            disabled={isAnalyzing}
            className="w-full py-4 bg-gradient-to-r from-slate-800 to-indigo-900 hover:from-slate-700 hover:to-indigo-800 disabled:opacity-70 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            ✨ 슬라이더로 조절한 [현재 임계값] 상태 AI 진단받기
          </button>
          
          {aiReport && (
            <div className="mt-4 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 text-slate-800 leading-relaxed animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-indigo-900 mb-3 text-lg">
                <Sparkles className="w-5 h-5" /> AI 진단 리포트 (Threshold: {threshold.toFixed(2)})
              </div>
              <p className="whitespace-pre-wrap">{aiReport}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}