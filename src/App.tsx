/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Sparkles, 
  Video, 
  Download, 
  ChevronDown, 
  Palette, 
  ListTodo,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Table as TableIcon,
  Hash,
  Type,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants ---
const CATEGORIES = [
  "Nghề nghiệp",
  "Trái cây",
  "Đồ dùng học tập",
  "Đồ vật trong nhà",
  "Phương tiện",
  "Động vật",
  "Tùy chỉnh"
];

const STYLES = [
  "3D cute Pixar-like kids animation",
  "2D Chinese cartoon clean lines",
  "3D chibi minimal",
  "Claymation style",
  "Watercolor illustration",
  "Cyberpunk anime",
  "Tùy chỉnh"
];

const LANGUAGES = ["Tiếng Việt", "Tiếng Anh", "Tiếng Pháp", "Tiếng Đức", "Tiếng Nhật", "Tiếng Hàn", "Tiếng Trung"];

const VOICE_STYLES = [
  "Ấm áp",
  "Vui vẻ",
  "Nhẹ nhàng",
  "Khích lệ",
  "Hào hứng",
  "Ngạc nhiên",
  "Tự tin",
  "Trìu mến"
];

const VOICE_STYLE_DESCRIPTIONS: Record<string, string> = {
  "Ấm áp": "Warm, gentle, and motherly tone with a soft smile in the voice",
  "Vui vẻ": "Cheerful, bright, and energetic tone with a playful lift",
  "Nhẹ nhàng": "Soft, calm, and soothing tone, very peaceful and quiet",
  "Khích lệ": "Encouraging, supportive, and proud tone to boost confidence",
  "Hào hứng": "Excited, high-pitched, and enthusiastic tone full of joy",
  "Ngạc nhiên": "Surprised, curious, and wide-eyed tone with an upward inflection",
  "Tự tin": "Confident, clear, and bold tone, speaking with certainty",
  "Trìu mến": "Affectionate, loving, and tender tone, expressing deep care"
};

const PLACEHOLDERS: Record<string, string> = {
  "Nghề nghiệp": "các nghề phổ biến cho bé",
  "Trái cây": "trái cây nhiệt đới",
  "Đồ dùng học tập": "đồ dùng trong lớp học",
  "Đồ vật trong nhà": "đồ vật trong nhà bếp",
  "Phương tiện": "phương tiện giao thông đường bộ",
  "Động vật": "động vật trong rừng",
  "Tùy chỉnh": "đồ vật bất kỳ..."
};

interface PromptResult {
  stt: number;
  word: string;
  prompt: string;
}

interface SuggestionRow {
  stt: number;
  name: string;
}

interface VocabRow {
  stt: number;
  vn: string;
  mom: string;
  kid: string;
}

// --- App Component ---
export default function App() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [topic, setTopic] = useState("");
  const [promptCount, setPromptCount] = useState(6);
  const [style, setStyle] = useState(STYLES[0]);
  const [customStyle, setCustomStyle] = useState("");
  const [momLang, setMomLang] = useState(LANGUAGES[0]);
  const [kidLang, setKidLang] = useState(LANGUAGES[1]);
  const [momVoiceStyle, setMomVoiceStyle] = useState(VOICE_STYLES[0]);
  const [kidVoiceStyle, setKidVoiceStyle] = useState(VOICE_STYLES[4]); // Default Excited for kid
  const [shouldGenerateCharacter, setShouldGenerateCharacter] = useState(true);
  
  const [suggestionRows, setSuggestionRows] = useState<SuggestionRow[]>([]);
  const [vocabularyList, setVocabularyList] = useState<VocabRow[]>([]);
  
  const [resultData, setResultData] = useState<PromptResult[]>([]);
  const [lalaImage, setLalaImage] = useState<string | null>(null);
  const [lilyImage, setLilyImage] = useState<string | null>(null);
  
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  // Sync suggestion rows with promptCount
  useEffect(() => {
    if (suggestionRows.length === 0) {
      const initialRows = Array.from({ length: promptCount }, (_, i) => ({
        stt: i + 1,
        name: ""
      }));
      setSuggestionRows(initialRows);
    }
  }, [promptCount]);

  // Reset topic if category is not custom
  useEffect(() => {
    if (category !== "Tùy chỉnh") {
      setTopic("");
    }
  }, [category]);

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  const showStatus = (type: 'success' | 'error' | 'info', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 5000);
  };

  const generateCharacterImage = async (charPrompt: string) => {
    try {
      const fullPrompt = `Full body shot of ${charPrompt}, standing alone, centered, plain solid white background, high quality, ${style}, vibrant colors, character reference sheet style. Absolutely no text, no words, no letters, no watermarks.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: fullPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "9:16"
          }
        }
      });
      
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Image generation error:", error);
      return null;
    }
  };

  const downloadImage = (base64Data: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSuggestList = async () => {
    setIsSuggesting(true);
    try {
      const currentWords = suggestionRows.map(r => r.name).filter(n => n).join(', ');
      const prompt = `Bạn là chuyên gia ngôn ngữ cho trẻ em. 
      Hãy tạo danh sách đúng ${promptCount} từ vựng (chỉ tiếng Việt) thuộc danh mục "${category}" với chủ đề cụ thể là "${topic || PLACEHOLDERS[category]}".
      ${currentWords ? `LƯU Ý: KHÔNG được trùng với các từ sau: ${currentWords}.` : ''}
      Yêu cầu: Chỉ trả về danh sách từ vựng tiếng Việt, mỗi từ một dòng. Không đánh số, không thêm bất kỳ văn bản giải thích nào khác.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = response.text || "";
      const suggestedWords = text.trim().split('\n').map(w => w.trim()).filter(w => w);
      
      const newRows = suggestedWords.slice(0, promptCount).map((word, index) => ({
        stt: index + 1,
        name: word
      }));

      setSuggestionRows(newRows);
      showStatus('success', 'Đã gợi ý danh sách từ vựng thành công!');
    } catch (error) {
      console.error(error);
      showStatus('error', 'Lỗi khi gợi ý danh sách. Vui lòng thử lại.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAddRow = async () => {
    setIsAddingRow(true);
    try {
      const currentWords = suggestionRows.map(r => r.name).filter(n => n).join(', ');
      const prompt = `Bạn là chuyên gia ngôn ngữ cho trẻ em. 
      Hãy gợi ý DUY NHẤT 1 từ vựng tiếng Việt mới thuộc danh mục "${category}" với chủ đề cụ thể là "${topic || PLACEHOLDERS[category]}".
      ${currentWords ? `LƯU Ý: KHÔNG được trùng với các từ sau: ${currentWords}.` : ''}
      Yêu cầu: Chỉ trả về đúng 1 từ vựng tiếng Việt, không thêm bất kỳ văn bản nào khác.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const newWord = (response.text || "").trim();
      
      setSuggestionRows(prev => [
        ...prev,
        { stt: prev.length + 1, name: newWord }
      ]);
    } catch (error) {
      console.error(error);
      // Fallback to empty row if AI fails
      setSuggestionRows(prev => [
        ...prev,
        { stt: prev.length + 1, name: "" }
      ]);
    } finally {
      setIsAddingRow(false);
    }
  };

  const handleUpdateSuggestion = (index: number, value: string) => {
    const newRows = [...suggestionRows];
    newRows[index].name = value;
    setSuggestionRows(newRows);
  };

  const handleUpdateVocab = (index: number, field: keyof VocabRow, value: string) => {
    const newList = [...vocabularyList];
    (newList[index] as any)[field] = value;
    setVocabularyList(newList);
  };

  const handleDeleteSuggestion = (index: number) => {
    setSuggestionRows(prev => {
      const newRows = prev.filter((_, i) => i !== index);
      // Re-index STT
      return newRows.map((row, i) => ({ ...row, stt: i + 1 }));
    });
  };

  const handleDeleteVocab = (index: number) => {
    setVocabularyList(prev => {
      const newList = prev.filter((_, i) => i !== index);
      // Re-index STT
      return newList.map((row, i) => ({ ...row, stt: i + 1 }));
    });
  };

  const handleDone = async () => {
    const wordsToTranslate = suggestionRows.map(r => r.name).filter(n => n);
    if (wordsToTranslate.length === 0) {
      showStatus('error', 'Vui lòng nhập ít nhất một từ vựng.');
      return;
    }

    setIsTranslating(true);
    try {
      const prompt = `Bạn là chuyên gia dịch thuật đa ngôn ngữ. Hãy dịch danh sách từ vựng tiếng Việt sau sang các ngôn ngữ yêu cầu.
      Danh sách tiếng Việt: ${wordsToTranslate.join(', ')}
      Ngôn ngữ 1: ${momLang}
      Ngôn ngữ 2: ${kidLang}
      
      Yêu cầu format mỗi dòng: Tiếng Việt | Dịch sang ${momLang} | Dịch sang ${kidLang}
      Ví dụ: Táo | Apple | Apple (nếu cả 2 là tiếng Anh)
      Chỉ trả về danh sách dịch, không thêm văn bản giải thích.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = response.text || "";
      const translatedLines = text.trim().split('\n').filter(l => l.includes('|'));
      
      const newVocabList: VocabRow[] = translatedLines.map((line, index) => {
        const parts = line.split('|').map(s => s.trim());
        return {
          stt: index + 1,
          vn: parts[0] || "",
          mom: parts[1] || "",
          kid: parts[2] || ""
        };
      });

      setVocabularyList(newVocabList);
      showStatus('success', 'Đã hoàn tất danh sách từ vựng!');
    } catch (error) {
      console.error(error);
      showStatus('error', 'Lỗi khi dịch từ vựng. Vui lòng thử lại.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleGeneratePrompts = async () => {
    if (vocabularyList.length === 0) {
      showStatus('error', 'Vui lòng hoàn tất danh sách từ vựng trước (nhấn nút Xong).');
      return;
    }

    const finalWords = vocabularyList.map(v => {
      let wordStr = `VN: ${v.vn}`;
      if (momLang !== "Tiếng Việt") wordStr += `, ${momLang}: ${v.mom}`;
      if (kidLang !== "Tiếng Việt") wordStr += `, ${kidLang}: ${v.kid}`;
      return wordStr;
    }).join('\n');

    setIsGenerating(true);
    setIsGeneratingImages(true);
    setLalaImage(null);
    setLilyImage(null);

    try {
      // Generate Prompts
      const momStyleDesc = VOICE_STYLE_DESCRIPTIONS[momVoiceStyle];
      const kidStyleDesc = VOICE_STYLE_DESCRIPTIONS[kidVoiceStyle];
      const actualCount = vocabularyList.length;
      const finalStyle = style === "Tùy chỉnh" ? customStyle : style;

      const prompt = `
      Bạn là chuyên gia thiết kế prompt video giáo dục cho trẻ em đẳng cấp thế giới.
      Hãy tạo đúng ${actualCount} prompt video (tiếng Anh) dựa trên danh sách từ vựng sau:
      ${finalWords}

      THÔNG TIN CẤU HÌNH:
      - Phong cách hình ảnh: ${finalStyle}
      - Nhân vật chính: Lala (Mẹ - Asian mother) và Lily (Con - 6yo Asian girl, pigtails).
      - Ngôn ngữ Lala: ${momLang}, Style voice: ${momVoiceStyle} (${momStyleDesc})
      - Ngôn ngữ Lily: ${kidLang}, Style voice: ${kidVoiceStyle} (${kidStyleDesc})

      QUY TẮC SINH PROMPT SIÊU CHI TIẾT:
      1. Mỗi prompt tương ứng 1 cảnh ~8 giây, dạy đúng 1 từ.
      2. MÔ TẢ MÔI TRƯỜNG (ENVIRONMENT): Phải cực kỳ chi tiết. Không chỉ nói "kitchen", mà phải là "A sun-drenched modern Asian-style kitchen with wooden cabinets, a bowl of fresh tropical fruits on the marble countertop, and soft morning light streaming through the window."
      3. QUY TẮC VỀ ĐỐI TƯỢNG (SUBJECTS):
         - Nếu là NGHỀ NGHIỆP (Professions): Phải có nhân vật thứ 3 (người thật, Asian-looking). Mô tả chi tiết trang phục và bối cảnh làm việc của họ.
         - Nếu là ĐỘNG VẬT/TRÁI CÂY/ĐỒ VẬT (Animals/Fruits/Objects): Đối tượng chính là con vật, quả, hoặc đồ vật đó. Phải mô tả cực kỳ chi tiết đặc điểm ngoại hình (màu sắc, kích thước, chất liệu). Ví dụ: "A fluffy golden retriever puppy with a wagging tail", "A vibrant red rambutan with soft green spikes", "A shiny blue toy car with silver wheels".
         - TƯƠNG TÁC: Lala chỉ tay vào đối tượng (người/vật/con vật), Lily nhìn theo với vẻ mặt ngạc nhiên/thích thú hoặc chạm vào đối tượng nếu phù hợp.
      4. YÊU CẦU VIDEO PROMPT (EN): 
         - BẮT BUỘC: Từ đầu tiên của [VIDEO PROMPT] phải là phong cách hình ảnh: "${finalStyle}".
         - Cấu trúc: "[VIDEO PROMPT]: ${finalStyle}, {Mô tả chi tiết môi trường, hành động của Lala và Lily, góc máy, ánh sáng}".
         - Format: Vertical 9:16.
         - Sử dụng trực tiếp tên "Lala" và "Lily" trong mô tả hành động.
         - Bao gồm: [Cinematic lighting, 4K resolution, highly detailed textures, smooth character animation, specific camera angles like medium shot or close-up, vibrant but natural colors].
         - Tuyệt đối không có chữ (no text/watermark).
      5. VOICE (MOM & KID) - TÔNG GIỌNG & CẢM XÚC:
         - LALA (${momLang}): Style voice: ${momStyleDesc}.
         - LILY (${kidLang}): Style voice: ${kidStyleDesc}.
         - Script: Lala hỏi ngắn gọn -> Lily trả lời (từ vựng x1 + câu minh họa ngắn). 
         - QUY TẮC QUAN TRỌNG: Lily KHÔNG nói lặp lại từ vựng 2 lần. Ví dụ: "It is Teacher! My teacher is very kind" (ĐÚNG), "It is Teacher. Teacher! My teacher is very kind" (SAI).
      
      FORMAT ĐẦU RA (BẮT BUỘC):
      - Trả về đúng ${actualCount} dòng.
      - Mỗi dòng PHẢI theo template sau và TUYỆT ĐỐI KHÔNG xuống hàng trong 1 prompt:
      WORD: {Vocabulary in all selected languages} PROMPT: [VIDEO PROMPT]: ${finalStyle}, {Detailed description of environment, Lala and Lily's actions, camera, lighting} ; [VOICE - 8s]: Lala, style voice: ${momStyleDesc} ; [LIP SYNC LALA]: {Specific mouth movement instructions for Lala's script} ; Script: "{Script in ${momLang}}" ; Lily, style voice: ${kidStyleDesc} ; [LIP SYNC LILY]: {Specific mouth movement instructions for Lily's script} ; Script: "{Script in ${kidLang}}"

      Ví dụ 1 (Nghề nghiệp):
      WORD: Bác sĩ | Doctor | Médecin PROMPT: [VIDEO PROMPT]: ${finalStyle}, Vertical 9:16, a brightly lit modern pediatric clinic with colorful wall stickers; a friendly Asian male doctor in a white coat and stethoscope is smiling at a patient; Lala points to the doctor; Lily looks on with curiosity; medium shot, soft cinematic lighting; [VOICE - 8s]: Lala, style voice: ${momStyleDesc} ; [LIP SYNC LALA]: Mouth moves naturally to pronounce the Vietnamese question clearly with a gentle smile ; Script: "Lily ơi, bác sĩ tiếng Anh là gì con nhỉ?" ; Lily, style voice: ${kidStyleDesc} ; [LIP SYNC LILY]: Mouth moves energetically to pronounce the English answer with excitement and wide-eyed expression ; Script: "It is Doctor! The doctor helps people feel better!"

      Ví dụ 2 (Trái cây/Đồ vật):
      WORD: Quả chôm chôm | Rambutan | Ramboutan PROMPT: [VIDEO PROMPT]: ${finalStyle}, Vertical 9:16, a sunny garden patio; on a wooden table sits a basket of vibrant red rambutans with soft green spikes; Lala picks up one rambutan and shows it to Lily; Lily touches the soft spikes with a look of wonder; close-up shot, natural sunlight, high detail; [VOICE - 8s]: Lala, style voice: ${momStyleDesc} ; [LIP SYNC LALA]: Mouth moves clearly with a warm tone ; Script: "Lily, con biết quả này là quả gì không?" ; Lily, style voice: ${kidStyleDesc} ; [LIP SYNC LILY]: Mouth moves playfully to pronounce 'Rambutan' with a giggle ; Script: "It is Rambutan! It looks so funny with the hair!"
      `;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = response.text || "";
      const lines = text.trim().split('\n').filter(l => l.trim() !== "");
      
      const parsedResults: PromptResult[] = lines.map((line, index) => {
        const wordMatch = line.match(/WORD:\s*(.*?)\s*PROMPT:/);
        const promptMatch = line.match(/PROMPT:\s*(.*)/);
        
        return {
          stt: index + 1,
          word: wordMatch ? wordMatch[1].trim() : "N/A",
          prompt: promptMatch ? promptMatch[1].trim() : line.trim()
        };
      });

      setResultData(parsedResults);
      showStatus('success', 'Đã tạo prompt thành công!');

      // Generate Images in parallel if enabled
      if (shouldGenerateCharacter) {
        setIsGeneratingImages(true);
        const lalaPrompt = "Lala, a beautiful Asian mother (Vietnamese style) in her early 30s, long silky black hair, warm dark brown eyes, gentle facial features, modern modest outfit.";
        const lilyPrompt = "Lily, a cute 6-year-old Asian girl (Vietnamese style), big bright dark eyes, smooth black hair tied in two adorable pigtails with colorful ribbons.";
        
        const [lalaImg, lilyImg] = await Promise.all([
          generateCharacterImage(lalaPrompt),
          generateCharacterImage(lilyPrompt)
        ]);

        setLalaImage(lalaImg);
        setLilyImage(lilyImg);
        setIsGeneratingImages(false);
        showStatus('success', 'Đã tạo prompt và ảnh nhân vật thành công!');
      }
    } catch (error) {
      console.error(error);
      showStatus('error', 'Lỗi khi tạo dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
      setIsGeneratingImages(false);
    }
  };

  const handleDownload = () => {
    if (resultData.length === 0) return;
    const content = resultData.map(r => r.prompt).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mom_kid_prompts_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex justify-center"
          >
            <img 
              src="https://yt3.googleusercontent.com/Gug5UDLjPMRBto68HqZvJCSryebEkqiI2_9qV_8y16ZKIVLgxYBFx_PyUYZStcTzSc3v7TLq=s900-c-k-c0x00ffffff-no-rj" 
              alt="Logo" 
              className="w-16 h-16 rounded-full border border-purple-500 object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            Học Tiếng Anh Cùng Bé
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-12 space-y-6">
            <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Palette className="text-indigo-500" size={24} />
                Cấu hình Video
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Danh mục từ vựng
                  </label>
                  <div className="relative">
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={isGenerating}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>

                {/* Topic */}
                <div className="space-y-2">
                  <label className={`text-sm font-bold ${category === "Tùy chỉnh" ? "text-slate-800" : "text-slate-400"}`}>
                    Chủ đề cụ thể (tuỳ chỉnh)
                  </label>
                  <input 
                    type="text"
                    disabled={category !== "Tùy chỉnh" || isGenerating}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={category === "Tùy chỉnh" ? "Nhập chủ đề của bạn..." : PLACEHOLDERS[category]}
                    className={`w-full border rounded-xl px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                      category === "Tùy chỉnh" && !isGenerating
                        ? "bg-white border-slate-200" 
                        : "bg-slate-100 border-slate-200 cursor-not-allowed opacity-60"
                    }`}
                  />
                </div>

                {/* Prompt Count */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800">
                    Số lượng prompt (số cảnh)
                  </label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number"
                      min="3"
                      max="30"
                      value={promptCount}
                      disabled={isGenerating}
                      onChange={(e) => setPromptCount(parseInt(e.target.value) || 3)}
                      className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <span className="text-xs text-slate-400 italic">Mỗi prompt = 1 cảnh ~8s</span>
                  </div>
                </div>

                {/* Style */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Phong cách hình ảnh
                  </label>
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <select 
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        disabled={isGenerating}
                        className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                    {style === "Tùy chỉnh" && (
                      <motion.input 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        type="text"
                        value={customStyle}
                        disabled={isGenerating}
                        onChange={(e) => setCustomStyle(e.target.value)}
                        placeholder="Nhập phong cách riêng của bạn..."
                        className="w-full bg-white border-2 border-indigo-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    )}
                  </div>
                </div>

                {/* Mom Language */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Ngôn ngữ Mẹ (Mom)
                  </label>
                  <div className="relative">
                    <select 
                      value={momLang}
                      onChange={(e) => setMomLang(e.target.value)}
                      disabled={isGenerating}
                      className="w-full appearance-none bg-indigo-50 border-2 border-indigo-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" size={24} />
                  </div>
                  <div className="relative mt-2">
                    <select 
                      value={momVoiceStyle}
                      onChange={(e) => setMomVoiceStyle(e.target.value)}
                      disabled={isGenerating}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {VOICE_STYLES.map(s => <option key={s} value={s}>Style: {s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>

                {/* Kid Language */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    Ngôn ngữ Con (Lily)
                  </label>
                  <div className="relative">
                    <select 
                      value={kidLang}
                      onChange={(e) => setKidLang(e.target.value)}
                      disabled={isGenerating}
                      className="w-full appearance-none bg-emerald-50 border-2 border-emerald-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" size={24} />
                  </div>
                  <div className="relative mt-2">
                    <select 
                      value={kidVoiceStyle}
                      onChange={(e) => setKidVoiceStyle(e.target.value)}
                      disabled={isGenerating}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {VOICE_STYLES.map(s => <option key={s} value={s}>Style: {s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>

                {/* Generate Character Toggle */}
                <div className="md:col-span-3 space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={shouldGenerateCharacter}
                        disabled={isGenerating}
                        onChange={(e) => setShouldGenerateCharacter(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                    <span className="text-sm font-bold text-slate-700">Tạo thông tin và ảnh nhân vật mới</span>
                    <span className="text-xs text-red-600 font-bold italic">(Tắt nếu bạn đã có nhân vật từ trước)</span>
                  </div>
                  
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="text-amber-500 shrink-0" size={18} />
                    <p className="text-sm text-amber-800 font-medium">
                      <span className="font-bold">Lưu ý:</span> Tên nhân vật luôn luôn cố định Mẹ tên là Lala và con tên là Lily.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Suggestion Section */}
              <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="text-emerald-500" size={24} />
                    ✨ Gợi ý danh sách
                  </h2>
                  <button 
                    onClick={handleSuggestList}
                    disabled={isSuggesting || isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  >
                    {isSuggesting ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                    Gợi ý
                  </button>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto mb-4 border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 z-10">
                      <tr className="border-b border-slate-100">
                        <th className="py-3 px-4 text-[11px] font-black text-black uppercase tracking-wider w-16">STT</th>
                        <th className="py-3 px-4 text-[11px] font-black text-black uppercase tracking-wider">Tên (Tiếng Việt)</th>
                        <th className="py-3 px-4 text-[11px] font-black text-black uppercase tracking-wider w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {suggestionRows.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-50 group">
                          <td className="py-2 px-4 text-sm text-slate-500 font-mono">{row.stt}</td>
                          <td className="py-2 px-4">
                            <input 
                              type="text"
                              value={row.name}
                              onChange={(e) => handleUpdateSuggestion(idx, e.target.value)}
                              disabled={isGenerating}
                              placeholder="Nhập từ vựng..."
                              className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 disabled:opacity-50"
                            />
                          </td>
                          <td className="py-2 px-4 text-right">
                            <button 
                              onClick={() => handleDeleteSuggestion(idx)}
                              disabled={isGenerating}
                              className="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all p-1 disabled:hidden"
                              title="Xóa hàng"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={3} className="p-2">
                          <button 
                            onClick={handleAddRow}
                            disabled={isAddingRow || isGenerating}
                            className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 border-2 border-orange-200 hover:bg-orange-100 rounded-xl transition-all disabled:opacity-50"
                          >
                            {isAddingRow ? <Loader2 className="animate-spin" size={14} /> : "+ Thêm hàng (AI gợi ý)"}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <button 
                  onClick={handleDone}
                  disabled={isTranslating || isGenerating || suggestionRows.every(r => !r.name)}
                  className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isTranslating ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  Xong
                </button>
              </section>

              {/* Input Section (Vocabulary List Table) */}
              <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <ListTodo className="text-indigo-500" size={24} />
                  Danh sách từ vựng đầu vào
                </h2>
                
                <div className="max-h-[450px] overflow-y-auto border border-slate-100 rounded-2xl">
                  {vocabularyList.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-slate-50 z-10">
                        <tr className="border-b border-slate-100">
                          <th className="py-3 px-4 text-[11px] font-black text-black uppercase tracking-wider w-16">STT</th>
                          <th className="py-3 px-4 text-[11px] font-black text-black uppercase tracking-wider">VN</th>
                          {momLang !== "Tiếng Việt" && (
                            <th className="py-3 px-4 text-[11px] font-black text-black uppercase tracking-wider">{momLang} (Mom)</th>
                          )}
                          {kidLang !== "Tiếng Việt" && (
                            <th className="py-3 px-4 text-[11px] font-black text-black uppercase tracking-wider">{kidLang} (Kid)</th>
                          )}
                          <th className="py-3 px-4 text-[11px] font-black text-black uppercase tracking-wider w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {vocabularyList.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                            <td className="py-3 px-4 text-sm text-slate-500 font-mono">{row.stt}</td>
                            <td className="py-3 px-4">
                              <input 
                                type="text"
                                value={row.vn}
                                disabled={isGenerating}
                                onChange={(e) => handleUpdateVocab(idx, 'vn', e.target.value)}
                                className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 text-slate-600 disabled:opacity-50"
                              />
                            </td>
                            {momLang !== "Tiếng Việt" && (
                              <td className="py-3 px-4">
                                <input 
                                  type="text"
                                  value={row.mom}
                                  disabled={isGenerating}
                                  onChange={(e) => handleUpdateVocab(idx, 'mom', e.target.value)}
                                  className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 font-bold text-indigo-600 disabled:opacity-50"
                                />
                              </td>
                            )}
                            {kidLang !== "Tiếng Việt" && (
                              <td className="py-3 px-4">
                                <input 
                                  type="text"
                                  value={row.kid}
                                  disabled={isGenerating}
                                  onChange={(e) => handleUpdateVocab(idx, 'kid', e.target.value)}
                                  className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 font-bold text-emerald-600 disabled:opacity-50"
                                />
                              </td>
                            )}
                            <td className="py-3 px-4 text-right">
                              <button 
                                onClick={() => handleDeleteVocab(idx)}
                                disabled={isGenerating}
                                className="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all p-1 disabled:hidden"
                                title="Xóa hàng"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-20 text-center text-slate-400 italic text-sm">
                      Chưa có danh sách. Nhấn "Xong" ở phần Gợi ý để tạo bảng.
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <button 
                onClick={handleGeneratePrompts}
                disabled={isGenerating || vocabularyList.length === 0}
                className={`w-full max-w-md flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all shadow-lg ${
                  vocabularyList.length > 0 
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200" 
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                }`}
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Video size={20} />}
                🎬 Tạo Prompt Video
              </button>
            </div>

            {/* Character Info Section (Shown after generation) */}
            <AnimatePresence>
              {shouldGenerateCharacter && resultData.length > 0 && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100"
                >
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Sparkles className="text-pink-500" size={24} />
                    Thông tin nhân vật cố định
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <div className="flex flex-col gap-4 mb-3">
                        <div className="relative w-full aspect-[9/16] max-w-[200px] mx-auto">
                          {isGeneratingImages ? (
                            <div className="w-full h-full rounded-xl bg-indigo-100 flex items-center justify-center animate-pulse">
                              <Loader2 className="animate-spin text-indigo-400" size={32} />
                            </div>
                          ) : (
                            <div className="group relative w-full h-full">
                              <img 
                                src={lalaImage || ""} 
                                alt="Lala" 
                                className="w-full h-full rounded-xl object-cover border-2 border-white shadow-sm"
                                referrerPolicy="no-referrer"
                              />
                              {lalaImage && (
                                <button 
                                  onClick={() => downloadImage(lalaImage, 'lala_character.png')}
                                  className="absolute bottom-3 right-3 p-2 bg-white/90 text-indigo-600 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                  title="Tải ảnh Mẹ Lala"
                                >
                                  <Download size={20} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <h3 className="font-bold text-indigo-900 text-lg">Mẹ Lala</h3>
                          <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider">Nhân vật chính (Full Body)</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-indigo-400">Character Prompt:</p>
                        <code className="block text-[10px] bg-white/50 p-2 rounded-lg text-indigo-700 border border-indigo-100 break-all">
                          Lala, a beautiful Asian mother (Vietnamese style) in her early 30s, long silky black hair, warm dark brown eyes, gentle facial features, modern modest outfit.
                        </code>
                      </div>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <div className="flex flex-col gap-4 mb-3">
                        <div className="relative w-full aspect-[9/16] max-w-[200px] mx-auto">
                          {isGeneratingImages ? (
                            <div className="w-full h-full rounded-xl bg-emerald-100 flex items-center justify-center animate-pulse">
                              <Loader2 className="animate-spin text-emerald-400" size={32} />
                            </div>
                          ) : (
                            <div className="group relative w-full h-full">
                              <img 
                                src={lilyImage || ""} 
                                alt="Lily" 
                                className="w-full h-full rounded-xl object-cover border-2 border-white shadow-sm"
                                referrerPolicy="no-referrer"
                              />
                              {lilyImage && (
                                <button 
                                  onClick={() => downloadImage(lilyImage, 'lily_character.png')}
                                  className="absolute bottom-3 right-3 p-2 bg-white/90 text-emerald-600 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                  title="Tải ảnh Bé Lily"
                                >
                                  <Download size={20} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <h3 className="font-bold text-emerald-900 text-lg">Bé Lily</h3>
                          <p className="text-xs text-emerald-500 font-semibold uppercase tracking-wider">Nhân vật chính (Full Body)</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-emerald-400">Character Prompt:</p>
                        <code className="block text-[10px] bg-white/50 p-2 rounded-lg text-emerald-700 border border-emerald-100 break-all">
                          Lily, a cute 6-year-old Asian girl (Vietnamese style), big bright dark eyes, smooth black hair tied in two adorable pigtails with colorful ribbons.
                        </code>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Results Table */}
            <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <TableIcon className="text-orange-500" size={24} />
                  Bảng Kết Quả
                </h2>
                <button 
                  onClick={handleDownload}
                  disabled={resultData.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#FF007F] text-white rounded-xl text-sm font-bold hover:bg-[#E60072] transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(255,0,127,0.4)] hover:shadow-[0_0_20px_rgba(255,0,127,0.6)] active:scale-95"
                >
                  <Download size={18} />
                  Tải prompt
                </button>
              </div>

              <div className="overflow-x-auto">
                {resultData.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-4 px-4 text-[11px] font-black text-black uppercase tracking-wider w-16">
                          <div className="flex items-center gap-1"><Hash size={14} /> STT</div>
                        </th>
                        <th className="py-4 px-4 text-[11px] font-black text-black uppercase tracking-wider w-48">
                          <div className="flex items-center gap-1"><Type size={14} /> TỪ VỰNG</div>
                        </th>
                        <th className="py-4 px-4 text-[11px] font-black text-black uppercase tracking-wider">
                          <div className="flex items-center gap-1"><Video size={14} /> PROMPT</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultData.map((row) => (
                        <tr key={row.stt} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4 text-sm font-medium text-slate-500">{row.stt}</td>
                          <td className="py-4 px-4 text-sm font-bold text-indigo-600">{row.word}</td>
                          <td className="py-4 px-4 text-sm text-slate-600 font-mono break-all leading-relaxed">
                            {row.prompt}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-20 text-center text-slate-400 italic text-sm">
                    Chưa có kết quả. Hãy cấu hình và bấm "Tạo Prompt Video".
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Status Toast */}
        <AnimatePresence>
          {status && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 ${
                status.type === 'success' ? 'bg-emerald-600 text-white' : 
                status.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white'
              }`}
            >
              {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{status.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
