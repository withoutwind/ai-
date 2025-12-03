import React, { useState } from 'react';
import { Loader2, Upload, Sparkles, Send, Image as ImageIcon, ArrowLeft, Search, Heart, RefreshCw } from 'lucide-react';
import { generateImageFromText, searchViralPosts, remixContent } from '../services/geminiService';
import { ViralPost } from '../types';

const CreationTab: React.FC = () => {
  // View State
  const [mode, setMode] = useState<'search' | 'remix'>('search');

  // Search State
  const [keyword, setKeyword] = useState('');
  const [viralPosts, setViralPosts] = useState<ViralPost[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Remix/Editor State
  const [selectedPost, setSelectedPost] = useState<ViralPost | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageMode, setImageMode] = useState<'upload' | 'generate'>('generate');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isRemixing, setIsRemixing] = useState(false); 
  const [isGeneratingImageOnly, setIsGeneratingImageOnly] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // --- Search Logic ---

  const handleSearch = async () => {
    if (!keyword.trim()) {
      alert("请输入关键词");
      return;
    }
    setIsSearching(true);
    setViralPosts([]);
    try {
      const posts = await searchViralPosts(keyword);
      setViralPosts(posts);
    } catch (e) {
      alert("搜索失败，请重试");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPost = async (post: ViralPost) => {
    setSelectedPost(post);
    setMode('remix');
    setIsRemixing(true);
    
    // Clear previous editor state
    setTitle('正在优化标题...');
    setContent('正在生成二创文案...');
    setGeneratedImage(null);
    setUploadedImage(null);

    try {
      // Parallel execution: Remix Content AND Generate High-Quality Image
      // Note: We use the visual description from the post for the image generation
      const remixPromise = remixContent(post);
      const imagePromise = generateImageFromText(
        `High quality lifestyle photography for social media, aesthetics of Xiaohongshu, ${post.visualDescription}`
      );

      const [remixData, imageResult] = await Promise.all([remixPromise, imagePromise]);

      setTitle(remixData.title);
      setContent(remixData.content);
      
      if (imageResult) {
        setGeneratedImage(`data:${imageResult.mimeType};base64,${imageResult.data}`);
      }

    } catch (e) {
      console.error(e);
      alert("二创过程中出现错误，请重试");
      setTitle(post.title); // Fallback to original title
      setContent(post.originalContent);
    } finally {
      setIsRemixing(false);
    }
  };

  // --- Editor Logic ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualGenerateImage = async () => {
    setIsGeneratingImageOnly(true);
    try {
      // Use current title/content for context, or fall back to selected post description if available
      const promptContext = selectedPost ? selectedPost.visualDescription : content.substring(0, 100);
      const prompt = `High quality social media image. Context: ${promptContext}. Title: ${title}. Aesthetic, trending, vibrant.`;
      
      const result = await generateImageFromText(prompt);
      if (result) {
        setGeneratedImage(`data:${result.mimeType};base64,${result.data}`);
        setUploadedImage(null);
      }
    } catch (e) {
      console.error(e);
      alert("生成图片出错");
    } finally {
      setIsGeneratingImageOnly(false);
    }
  };

  const handlePublish = () => {
    if (!title || !content || (!uploadedImage && !generatedImage)) {
      alert("请填写完整信息（标题、内容和图片）");
      return;
    }
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      alert("发布成功！已同步至小红书。");
      // Reset flow
      setMode('search');
      setKeyword('');
      setViralPosts([]);
    }, 1500);
  };

  const activeImage = uploadedImage || generatedImage;

  // --- Render ---

  if (mode === 'search') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Search className="w-6 h-6 text-red-500" />
            搜索爆款灵感
          </h2>
          
          <div className="flex gap-2 mb-8">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="输入关键词（例如：OOTD、数码测评、减脂餐...）"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold transition-all disabled:opacity-70 flex items-center gap-2 whitespace-nowrap shadow-lg shadow-red-100"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              {isSearching ? '挖掘中' : '搜索爆款'}
            </button>
          </div>

          {viralPosts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {viralPosts.map((post) => (
                <div 
                  key={post.id}
                  onClick={() => handleSelectPost(post)}
                  className="group bg-white rounded-xl border border-slate-100 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Simulated Cover Image using Pollinations AI for preview */}
                  <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                    <img 
                      src={`https://image.pollinations.ai/prompt/${encodeURIComponent(post.visualDescription)}?width=300&height=400&nologo=true`}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm transform scale-90 group-hover:scale-100 transition-all">
                            一键二创
                        </span>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <h3 className="font-bold text-slate-800 text-sm mb-2 line-clamp-2 leading-snug min-h-[2.5em]">{post.title}</h3>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <img 
                            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${post.author}`} 
                            alt="avatar" 
                            className="w-5 h-5 rounded-full border border-slate-200 bg-white"
                        />
                        <span className="truncate max-w-[60px]">{post.author}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Heart className="w-3 h-3 fill-slate-300" />
                        {post.likes}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !isSearching && (
              <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-20 text-indigo-500" />
                <p className="font-medium">AI 帮你即时分析全网数据</p>
                <p className="text-sm mt-1">输入关键词，一键获取 10 个爆款案例</p>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  // Remix Mode
  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setMode('search')}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-indigo-500" />
            AI 智能二创
          </h2>
        </div>

        {/* Loading / Progress State */}
        {isRemixing && (
          <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl flex flex-col items-center justify-center gap-3 text-indigo-800 animate-pulse text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <div>
                <p className="font-bold">正在学习爆款逻辑...</p>
                <p className="text-sm opacity-70">AI 正在重写标题、优化正文并生成独家配图</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Image */}
            <div className="space-y-4">
                <div className="relative aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                    {activeImage ? (
                        <img src={activeImage} alt="Final" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-slate-400 flex flex-col items-center p-4 text-center">
                            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                            <span>{isRemixing ? '生成配图中...' : '等待图片生成'}</span>
                        </div>
                    )}
                </div>
                
                <div className="flex bg-slate-100 rounded-lg p-1">
                    <button
                        onClick={() => setImageMode('generate')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                        imageMode === 'generate' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        AI 重新生成
                    </button>
                    <button
                        onClick={() => setImageMode('upload')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                        imageMode === 'upload' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        上传替换
                    </button>
                </div>

                {imageMode === 'generate' && !isRemixing && (
                     <button
                        onClick={handleManualGenerateImage}
                        disabled={isGeneratingImageOnly}
                        className="w-full py-2.5 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all text-sm font-medium flex items-center justify-center gap-2"
                    >
                         {isGeneratingImageOnly ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                         {isGeneratingImageOnly ? '生成中...' : '换一张图'}
                    </button>
                )}
                
                {imageMode === 'upload' && (
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <button className="w-full py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium flex items-center justify-center gap-2">
                            <Upload className="w-4 h-4" />
                            点击上传本地图片
                        </button>
                    </div>
                )}
            </div>

            {/* Right Column: Text Editor */}
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-bold text-slate-700">爆款标题</label>
                        <span className="text-xs text-green-600 font-medium px-2 py-0.5 bg-green-50 rounded-full">AI 已优化</span>
                    </div>
                    <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-bold"
                    />
                </div>
                
                <div className="flex-1">
                     <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-bold text-slate-700">文案内容</label>
                        <span className="text-xs text-indigo-500 cursor-pointer hover:underline" onClick={() => handleSelectPost(selectedPost!)}>重新生成文案</span>
                    </div>
                    <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-[300px] px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none leading-relaxed"
                    />
                </div>
            </div>
        </div>

        {/* Action Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
             <button
                onClick={() => setMode('search')}
                className="px-6 py-3 border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 font-medium transition-all"
            >
                放弃编辑
            </button>
            <button
                onClick={handlePublish}
                disabled={isPublishing || isRemixing}
                className="flex items-center gap-2 px-8 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 active:scale-95 transition-all shadow-md hover:shadow-lg font-bold disabled:opacity-70 disabled:active:scale-100"
            >
                {isPublishing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                <Send className="w-5 h-5" />
                )}
                发布到小红书
            </button>
        </div>
      </div>
    </div>
  );
};

export default CreationTab;
