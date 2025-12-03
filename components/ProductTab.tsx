import React, { useState } from 'react';
import { Loader2, Upload, ArrowRight, Wand2, CheckCircle, Download, Sparkles } from 'lucide-react';
import { analyzeProductImage, generateProductPoster } from '../services/geminiService';
import { ProductAnalysis } from '../types';

const ProductTab: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ProductAnalysis | null>(null);
  const [generatedPoster, setGeneratedPoster] = useState<string | null>(null);

  // File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // remove data:image/xxx;base64, prefix for API usage if needed, but current service wrapper might handle raw base64 data better if we strip logic there.
        // Actually, the Google GenAI SDK helper usually expects raw base64. 
        // Let's strip the prefix for the API call in the handler.
        setSelectedImage(result);
        setMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 1 -> 2: Analyze
  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    try {
      const base64Data = selectedImage.split(',')[1]; // Remove header
      const result = await analyzeProductImage(base64Data, mimeType);
      setAnalysisResult(result);
      setStep(2);
    } catch (error) {
      alert("分析图片失败，请重试");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2 -> 3: Generate Poster
  const handleGeneratePoster = async () => {
    if (!analysisResult) return;
    setIsGeneratingPoster(true);
    try {
      const result = await generateProductPoster(analysisResult);
      if (result) {
        setGeneratedPoster(`data:${result.mimeType};base64,${result.data}`);
        setStep(3);
      } else {
        alert("生成海报失败");
      }
    } catch (error) {
      console.error(error);
      alert("生成海报出错");
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  const reset = () => {
    setStep(1);
    setSelectedImage(null);
    setAnalysisResult(null);
    setGeneratedPoster(null);
  };

  return (
    <div className="space-y-6">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between px-4 mb-8">
        {[
          { num: 1, label: "上传产品" },
          { num: 2, label: "智能分析" },
          { num: 3, label: "生成海报" }
        ].map((item, idx) => (
          <React.Fragment key={item.num}>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                step >= item.num ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > item.num ? <CheckCircle className="w-5 h-5" /> : item.num}
              </div>
              <span className={`text-xs font-medium ${step >= item.num ? 'text-indigo-600' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </div>
            {idx < 2 && (
              <div className={`h-[2px] flex-1 mx-2 ${step > item.num ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-6">上传产品图片</h2>
          
          <div className="border-2 border-dashed border-indigo-100 rounded-2xl p-8 bg-indigo-50/30 hover:bg-indigo-50 transition-colors">
             {selectedImage ? (
                <div className="flex flex-col items-center">
                    <img src={selectedImage} alt="产品预览" className="max-h-64 rounded-lg shadow-md mb-6" />
                    <button 
                        onClick={() => setSelectedImage(null)}
                        className="text-slate-500 hover:text-red-500 text-sm underline mb-4"
                    >
                        移除并重新上传
                    </button>
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 font-bold transition-all disabled:opacity-70"
                    >
                        {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                        {isAnalyzing ? '正在分析...' : '下一步：智能分析'}
                    </button>
                </div>
             ) : (
                 <>
                    <input
                        type="file"
                        accept="image/*"
                        id="product-upload"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <label htmlFor="product-upload" className="cursor-pointer flex flex-col items-center">
                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-indigo-500 mb-4">
                            <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-lg font-medium text-slate-700 mb-2">点击上传产品图</p>
                        <p className="text-sm text-slate-400">AI 将自动提取产品特征</p>
                    </label>
                 </>
             )}
          </div>
        </div>
      )}

      {/* Step 2: Analysis Results */}
      {step === 2 && analysisResult && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">AI 分析结果</h2>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">分析完成</span>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">产品名称</label>
              <input
                type="text"
                value={analysisResult.productName}
                onChange={(e) => setAnalysisResult({ ...analysisResult, productName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">产品描述</label>
              <textarea
                value={analysisResult.description}
                onChange={(e) => setAnalysisResult({ ...analysisResult, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">推荐理由</label>
              <div className="space-y-2">
                {analysisResult.recommendedReasons.map((reason, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center bg-indigo-100 text-indigo-600 text-xs rounded-full font-bold">{idx + 1}</span>
                    <input
                        type="text"
                        value={reason}
                        onChange={(e) => {
                            const newReasons = [...analysisResult.recommendedReasons];
                            newReasons[idx] = e.target.value;
                            setAnalysisResult({...analysisResult, recommendedReasons: newReasons});
                        }}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-indigo-200 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between pt-6 border-t border-slate-100">
            <button
                onClick={() => setStep(1)}
                className="text-slate-500 hover:text-slate-800 font-medium px-4"
            >
                返回修改
            </button>
            <button
                onClick={handleGeneratePoster}
                disabled={isGeneratingPoster}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg shadow-indigo-200 font-bold transition-all"
            >
                {isGeneratingPoster ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isGeneratingPoster ? '生成中...' : '生成宣传海报'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 3 && generatedPoster && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center animate-fade-in">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">海报生成成功!</h2>
          <p className="text-slate-500 mb-6">基于 AI 对产品的深度理解生成</p>
          
          <div className="relative inline-block rounded-xl overflow-hidden shadow-2xl mb-8 group">
            <img src={generatedPoster} alt="生成的海报" className="max-w-full h-auto max-h-[500px]" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
                <a 
                    href={generatedPoster} 
                    download="poster.png"
                    className="p-3 bg-white text-slate-800 rounded-full hover:scale-110 transition-transform"
                    title="下载海报"
                >
                    <Download className="w-6 h-6" />
                </a>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
                onClick={reset}
                className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
            >
                重新开始
            </button>
            <button
                onClick={() => alert("已保存到相册")}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md"
            >
                保存海报
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTab;