import React, { useState, useRef } from 'react';
import { Loader2, Upload, FileVideo, Copy, Check, Scissors, Wand2, ArrowRight, Link as LinkIcon, AlertCircle, Sparkles, Image as ImageIcon, Clapperboard, FileText, AlignLeft } from 'lucide-react';
import { analyzeAndRemixVideo, parseVideoLink, generateGeminiCover, generateVideoScript, remixFromText } from '../services/geminiService';
import { RemixVariation, ScriptScene } from '../types';

type InputMethod = 'upload' | 'link' | 'text';

const VideoTab: React.FC = () => {
  const [inputMethod, setInputMethod] = useState<InputMethod>('upload');
  
  // File Upload State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [rawText, setRawText] = useState('');
  
  // Process State
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Results State
  const [extractedText, setExtractedText] = useState('');
  const [remixVariations, setRemixVariations] = useState<RemixVariation[]>([]);
  const [visualPrompt, setVisualPrompt] = useState('');
  
  // Cover Generation State
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [generatedCoverUrl, setGeneratedCoverUrl] = useState<string | null>(null);
  
  // Script Generation State
  const [scriptInput, setScriptInput] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<ScriptScene[]>([]);

  // UI State for copying
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isExtractedCopied, setIsExtractedCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scriptRef = useRef<HTMLDivElement>(null);

  const resetState = () => {
    setExtractedText('');
    setRemixVariations([]);
    setVisualPrompt('');
    setGeneratedCoverUrl(null);
    setScriptInput('');
    setGeneratedScript([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert("视频文件过大，请上传 20MB 以内的视频（演示模式限制）");
        return;
      }
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      resetState();
    }
  };

  const handleProcessLocal = async () => {
    if (!videoFile) return;
    setIsProcessing(true);
    resetState();
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        try {
          const result = await analyzeAndRemixVideo(base64Data, videoFile.type);
          setExtractedText(result.transcript);
          setRemixVariations(result.remixVariations);
          setVisualPrompt(result.visualPrompt);
          // Pre-fill script input with the first variation
          if (result.remixVariations.length > 0) {
            setScriptInput(result.remixVariations[0].content);
          }
        } catch (error) {
          alert("分析失败，请确保视频包含音频且格式正确。");
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(videoFile);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
      alert("文件处理出错");
    }
  };

  const handleProcessLink = async () => {
    if (!linkUrl.trim()) return;
    setIsProcessing(true);
    resetState();
    try {
      const result = await parseVideoLink(linkUrl);
      setExtractedText(result.transcript);
      setRemixVariations(result.remixVariations);
      setVisualPrompt(result.visualPrompt);
      if (result.remixVariations.length > 0) {
        setScriptInput(result.remixVariations[0].content);
      }
    } catch (e: any) {
      alert(e.message || "链接解析失败，请检查链接是否有效");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessText = async () => {
      if (!rawText.trim()) return;
      setIsProcessing(true);
      resetState();
      try {
          const result = await remixFromText(rawText);
          setExtractedText(result.transcript); // Show the input text as extracted text
          setRemixVariations(result.remixVariations);
          setVisualPrompt(result.visualPrompt);
          if (result.remixVariations.length > 0) {
              setScriptInput(result.remixVariations[0].content);
          }
      } catch (e) {
          alert("文本处理失败，请重试");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleGenerateCover = async () => {
    if (!visualPrompt) return;
    setIsGeneratingCover(true);
    setGeneratedCoverUrl(null);
    try {
        const imageUrl = await generateGeminiCover(visualPrompt);
        setGeneratedCoverUrl(imageUrl);
    } catch (e: any) {
        console.error(e);
        alert("封面生成失败");
    } finally {
        setIsGeneratingCover(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!scriptInput.trim()) return;
    setIsGeneratingScript(true);
    try {
      const script = await generateVideoScript(scriptInput);
      setGeneratedScript(script);
      // Scroll to script section
      setTimeout(() => {
        scriptRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (e) {
      alert("脚本生成失败");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleCopy = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } else {
      setIsExtractedCopied(true);
      setTimeout(() => setIsExtractedCopied(false), 2000);
    }
  };

  const selectRemixForScript = (content: string) => {
    setScriptInput(content);
    // Optional: Scroll to script input
    scriptRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          全自动视频二创
        </h2>

        {/* Input Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 overflow-x-auto">
          <button
            onClick={() => { setInputMethod('upload'); resetState(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              inputMethod === 'upload' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            上传本地视频
          </button>
          <button
             onClick={() => { setInputMethod('link'); resetState(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              inputMethod === 'link' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            粘贴视频链接
          </button>
          <button
             onClick={() => { setInputMethod('text'); resetState(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              inputMethod === 'text' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <AlignLeft className="w-4 h-4" />
            直接输入原文
          </button>
        </div>

        {/* Input Area */}
        <div className="mb-6">
          {inputMethod === 'upload' ? (
             <div 
                className={`border-2 border-dashed rounded-xl p-8 transition-colors text-center relative ${
                  videoFile ? 'border-purple-200 bg-purple-50/30' : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {!videoFile ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">点击上传视频</p>
                      <p className="text-sm text-slate-400 mt-1">支持 MP4, MOV 等常见格式 (建议 &lt; 20MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <video 
                      src={videoUrl!} 
                      controls 
                      className="max-h-[250px] rounded-lg shadow-md mb-4 bg-black w-full object-contain"
                    />
                    <div className="flex items-center gap-3">
                       <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="text-sm text-slate-500 hover:text-purple-600 underline"
                       >
                          更换视频
                       </button>
                    </div>
                  </div>
                )}
              </div>
          ) : inputMethod === 'link' ? (
            <div className="space-y-4">
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="粘贴 抖音 / 小红书 / YouTube 视频链接，或 MP4 直链"
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
              />
              <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-lg flex items-start gap-2">
                 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                 <span>支持直链 MP4，或其他平台链接（演示模式）。</span>
              </div>
            </div>
          ) : (
             <div className="space-y-4">
                <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="请在此粘贴或输入需要二创的原文内容..."
                    className="w-full h-48 p-4 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none text-sm leading-relaxed"
                />
             </div>
          )}
        </div>

        {/* Process Button */}
        {((inputMethod === 'upload' && videoFile) || (inputMethod === 'link' && linkUrl) || (inputMethod === 'text' && rawText)) && !isProcessing && (
          <div className="flex justify-center">
            <button
              onClick={inputMethod === 'upload' ? handleProcessLocal : inputMethod === 'link' ? handleProcessLink : handleProcessText}
              className="group relative flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full hover:shadow-lg hover:scale-105 transition-all font-bold shadow-purple-200"
            >
              <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {remixVariations.length > 0 ? '重新分析与二创' : '一键 AI 全案二创'}
            </button>
          </div>
        )}
        
        {isProcessing && (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-3 py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <span className="text-sm font-medium animate-pulse">AI 正在深度解析并生成爆款二创方案...</span>
            </div>
        )}

        {/* Results */}
        {(extractedText || remixVariations.length > 0) && (
          <div className="mt-8 pt-6 border-t border-slate-100 animate-in fade-in duration-500">
             
             <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* 1. Transcript (Left, narrower) */}
                <div className="md:col-span-3 bg-slate-50 p-4 rounded-xl border border-slate-200 h-fit">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Scissors className="w-4 h-4 text-slate-500" />
                            {inputMethod === 'text' ? '原文内容' : '原视频文案'}
                        </label>
                        <button 
                            onClick={() => handleCopy(extractedText)}
                            className="text-xs text-slate-500 hover:text-slate-800"
                        >
                            {isExtractedCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                    </div>
                    <textarea
                        value={extractedText}
                        readOnly
                        className="w-full h-64 bg-transparent border-0 outline-none text-slate-600 text-xs leading-relaxed resize-none p-0"
                    />
                </div>

                {/* 2. Remix Variations (Middle, wider) */}
                <div className="md:col-span-6 space-y-4">
                    <div className="flex items-center justify-between">
                         <h3 className="font-bold text-purple-900 flex items-center gap-2">
                             <Wand2 className="w-5 h-5" />
                             深度二创文案 (可复制)
                         </h3>
                    </div>
                    
                    <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                        {remixVariations.map((remix, index) => (
                            <div key={index} className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 hover:border-purple-300 transition-all relative group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="bg-purple-200 text-purple-800 text-xs font-bold px-2 py-0.5 rounded">
                                        深度优化方案
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => selectRemixForScript(remix.content)}
                                            className="text-xs text-indigo-600 hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Clapperboard className="w-3 h-3" />
                                            转脚本
                                        </button>
                                        <button 
                                            onClick={() => handleCopy(`${remix.title}\n\n${remix.content}`, index)}
                                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${copiedIndex === index ? 'bg-green-100 text-green-700' : 'bg-white text-slate-500 hover:bg-slate-100 border'}`}
                                        >
                                            {copiedIndex === index ? '已复制' : '复制'}
                                        </button>
                                    </div>
                                </div>
                                <input 
                                    className="w-full bg-transparent font-bold text-slate-800 text-sm mb-2 outline-none"
                                    value={remix.title}
                                    readOnly
                                />
                                <textarea
                                    className="w-full bg-transparent resize-none outline-none text-slate-600 text-sm h-32"
                                    value={remix.content}
                                    readOnly
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Right Column: Image + Script Tool */}
                <div className="md:col-span-3 space-y-4">
                    
                    {/* Cover Generation */}
                    <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        {generatedCoverUrl ? (
                             <div className="relative rounded-lg overflow-hidden bg-slate-100 aspect-[9/16] flex items-center justify-center group">
                                <img src={generatedCoverUrl} alt="Cover" className="w-full h-full object-cover" />
                                <button 
                                   onClick={() => setGeneratedCoverUrl(null)} 
                                   className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full text-xs hover:bg-black/70"
                                >
                                   关闭
                                </button>
                             </div>
                        ) : (
                            <div className="bg-white p-4 rounded-lg flex flex-col items-center justify-center text-center gap-3">
                                {isGeneratingCover ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                                ) : (
                                    <>
                                        <ImageIcon className="w-6 h-6 text-purple-600" />
                                        <div className="text-xs text-slate-500">生成配套 AI 封面</div>
                                        <button
                                            onClick={handleGenerateCover}
                                            className="w-full py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700"
                                        >
                                            生成封面
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
             </div>

             {/* Script Generator Section */}
             <div ref={scriptRef} className="mt-12 bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <Clapperboard className="w-5 h-5" />
                    AI 视频脚本生成器
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-indigo-800">输入或粘贴文案：</label>
                        <textarea
                            value={scriptInput}
                            onChange={(e) => setScriptInput(e.target.value)}
                            placeholder="在此输入想要拍摄的文案，点击生成即可获得分镜脚本..."
                            className="w-full h-64 p-4 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-300 outline-none resize-none bg-white text-sm"
                        />
                        <button
                            onClick={handleGenerateScript}
                            disabled={isGeneratingScript || !scriptInput}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isGeneratingScript ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                            生成分镜脚本
                        </button>
                    </div>

                    <div className="bg-white rounded-xl border border-indigo-200 p-4 h-64 overflow-y-auto custom-scrollbar">
                        {generatedScript.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead className="text-xs text-indigo-500 uppercase bg-indigo-50 sticky top-0">
                                    <tr>
                                        <th className="px-2 py-2">镜号</th>
                                        <th className="px-2 py-2">画面</th>
                                        <th className="px-2 py-2">口播/音效</th>
                                        <th className="px-2 py-2">时长</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-indigo-50">
                                    {generatedScript.map((scene, idx) => (
                                        <tr key={idx} className="hover:bg-indigo-50/50">
                                            <td className="px-2 py-2 font-mono text-xs font-bold text-indigo-900">{scene.scene}</td>
                                            <td className="px-2 py-2 text-slate-700">{scene.visual}</td>
                                            <td className="px-2 py-2 text-slate-600">{scene.audio}</td>
                                            <td className="px-2 py-2 text-slate-400 text-xs whitespace-nowrap">{scene.duration}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                                <Clapperboard className="w-8 h-8 mb-2 opacity-20" />
                                等待生成脚本...
                            </div>
                        )}
                    </div>
                </div>
             </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default VideoTab;