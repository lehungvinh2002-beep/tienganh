/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
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
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = [
  'Nghề nghiệp',
  'Trái cây',
  'Đồ dùng học tập',
  'Đồ vật trong nhà',
  'Phương tiện',
  'Động vật',
  'Tùy chỉnh',
] as const;

const STYLES = [
  '3D cute Pixar-like kids animation',
  '2D Chinese cartoon clean lines',
  '3D chibi minimal',
  'Claymation style',
  'Watercolor illustration',
  'Cyberpunk anime',
  'Tùy chỉnh',
] as const;

const LANGUAGES = [
  'Tiếng Việt',
  'Tiếng Anh',
  'Tiếng Pháp',
  'Tiếng Đức',
  'Tiếng Nhật',
  'Tiếng Hàn',
  'Tiếng Trung',
] as const;

const VOICE_STYLES = [
  'Ấm áp',
  'Vui vẻ',
  'Nhẹ nhàng',
  'Khích lệ',
  'Hào hứng',
  'Ngạc nhiên',
  'Tự tin',
  'Trìu mến',
] as const;

const VOICE_STYLE_DESCRIPTIONS: Record<string, string> = {
  'Ấm áp': 'Warm, gentle, and motherly tone with a soft smile in the voice',
  'Vui vẻ': 'Cheerful, bright, and energetic tone with a playful lift',
  'Nhẹ nhàng': 'Soft, calm, and soothing tone, very peaceful and quiet',
  'Khích lệ': 'Encouraging, supportive, and proud tone to boost confidence',
  'Hào hứng': 'Excited, high-pitched, and enthusiastic tone full of joy',
  'Ngạc nhiên': 'Surprised, curious, and wide-eyed tone with an upward inflection',
  'Tự tin': 'Confident, clear, and bold tone, speaking with certainty',
  'Trìu mến': 'Affectionate, loving, and tender tone, expressing deep care',
};

const PLACEHOLDERS: Record<string, string> = {
  'Nghề nghiệp': 'các nghề phổ biến cho bé',
  'Trái cây': 'trái cây nhiệt đới',
  'Đồ dùng học tập': 'đồ dùng trong lớp học',
  'Đồ vật trong nhà': 'đồ vật trong nhà bếp',
  'Phương tiện': 'phương tiện giao thông đường bộ',
  'Động vật': 'động vật trong rừng',
  'Tùy chỉnh': 'đồ vật bất kỳ...',
};

const LALA_CHARACTER_PROMPT =
  'Lala, a beautiful Asian mother (Vietnamese style) in her early 30s, long silky black hair, warm dark brown eyes, gentle facial features, modern modest outfit.';

const LILY_CHARACTER_PROMPT =
  'Lily, a cute 6-year-old Asian girl (Vietnamese style), big bright dark eyes, smooth black hair tied in two adorable pigtails with colorful ribbons.';

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

type StatusType = 'success' | 'error' | 'info';

function buildRows(count: number): SuggestionRow[] {
  return Array.from({ length: count }, (_, i) => ({
    stt: i + 1,
    name: '',
  }));
}

function extractText(response: any): string {
  if (!response) return '';
  if (typeof response.text === 'string') return response.text;
  if (typeof response.text === 'function') return response.text() ?? '';
  return '';
}

function CharacterCard({
  title,
  subtitle,
  prompt,
  image,
  isGenerating,
  color,
  onDownload,
}: {
  title: string;
  subtitle: string;
  prompt: string;
  image: string | null;
  isGenerating: boolean;
  color: 'indigo' | 'emerald';
  onDownload: () => void;
}) {
  const palette =
    color === 'indigo'
      ? {
          wrapper: 'bg-indigo-50 border-indigo-100',
          text: 'text-indigo-900',
          sub: 'text-indigo-500',
          label: 'text-indigo-400',
          code: 'bg-white/50 text-indigo-700 border-indigo-100',
          empty: 'bg-indigo-100 text-indigo-400',
          button: 'text-indigo-600',
        }
      : {
          wrapper: 'bg-emerald-50 border-emerald-100',
          text: 'text-emerald-900',
          sub: 'text-emerald-500',
          label: 'text-emerald-400',
          code: 'bg-white/50 text-emerald-700 border-emerald-100',
          empty: 'bg-emerald-100 text-emerald-400',
          button: 'text-emerald-600',
        };

  return (
    <div className={`p-4 rounded-2xl border ${palette.wrapper}`}>
      <div className="flex flex-col gap-4 mb-3">
        <div className="relative w-full aspect-[9/16] max-w-[200px] mx-auto">
          {isGenerating ? (
            <div className={`w-full h-full rounded-xl flex items-center justify-center animate-pulse ${palette.empty}`}>
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : image ? (
            <div className="group relative w-full h-full">
              <img
                src={image}
                alt={title}
                className="w-full h-full rounded-xl object-cover border-2 border-white shadow-sm"
              />
              <button
                onClick={onDownload}
                className={`absolute bottom-3 right-3 p-2 bg-white/90 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white ${palette.button}`}
                title={`Tải ảnh ${title}`}
              >
                <Download size={20} />
              </button>
            </div>
          ) : (
            <div className={`w-full h-full rounded-xl border-2 border-white shadow-sm flex items-center justify-center text-sm font-medium ${palette.empty}`}>
              Chưa có ảnh AI
            </div>
          )}
        </div>

        <div className="text-center">
          <h3 className={`font-bold text-lg ${palette.text}`}>{title}</h3>
          <p className={`text-xs font-semibold uppercase tracking-wider ${palette.sub}`}>{subtitle}</p>
        </div>
      </div>

      <div className="space-y-1">
        <p className={`text-xs font-bold ${palette.label}`}>Character Prompt:</p>
        <code className={`block text-[10px] p-2 rounded-lg border break-all ${palette.code}`}>{prompt}</code>
      </div>
    </div>
  );
}

export default function App() {
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [topic, setTopic] = useState('');
  const [promptCount, setPromptCount] = useState(6);
  const [style, setStyle] = useState<string>(STYLES[0]);
  const [customStyle, setCustomStyle] = useState('');
  const [momLang, setMomLang] = useState<string>(LANGUAGES[0]);
  const [kidLang, setKidLang] = useState<string>(LANGUAGES[1]);
  const [momVoiceStyle, setMomVoiceStyle] = useState<string>(VOICE_STYLES[0]);
  const [kidVoiceStyle, setKidVoiceStyle] = useState<string>(VOICE_STYLES[4]);
  const [shouldGenerateCharacter, setShouldGenerateCharacter] = useState(true);

  const [suggestionRows, setSuggestionRows] = useState<SuggestionRow[]>(() => buildRows(6));
  const [vocabularyList, setVocabularyList] = useState<VocabRow[]>([]);
  const [resultData, setResultData] = useState<PromptResult[]>([]);

  const [lalaImage, setLalaImage] = useState<string | null>(null);
  const [lilyImage, setLilyImage] = useState<string | null>(null);

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [status, setStatus] = useState<{ type: StatusType; message: string } | null>(null);

  const statusTimeoutRef = useRef<number | null>(null);

  const ai = useMemo(() => {
    return new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
    });
  }, []);

  useEffect(() => {
    setSuggestionRows((prev) => {
      if (prev.length === promptCount) {
        return prev.map((row, idx) => ({ ...row, stt: idx + 1 }));
      }

      if (prev.length < promptCount) {
        const extra = Array.from({ length: promptCount - prev.length }, (_, i) => ({
          stt: prev.length + i + 1,
          name: '',
        }));
        return [...prev, ...extra];
      }

      return prev.slice(0, promptCount).map((row, idx) => ({ ...row, stt: idx + 1 }));
    });
  }, [promptCount]);

  useEffect(() => {
    if (category !== 'Tùy chỉnh') {
      setTopic('');
    }
  }, [category]);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        window.clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  const finalStyle = style === 'Tùy chỉnh' ? customStyle.trim() || '3D cute Pixar-like kids animation' : style;

  const showStatus = (type: StatusType, message: string) => {
    setStatus({ type, message });

    if (statusTimeoutRef.current) {
      window.clearTimeout(statusTimeoutRef.current);
    }

    statusTimeoutRef.current = window.setTimeout(() => {
      setStatus(null);
    }, 5000);
  };

  const generateCharacterImage = async (charPrompt: string): Promise<string> => {
    const fullPrompt = `Full body shot of ${charPrompt}, standing alone, centered, plain solid white background, high quality, ${finalStyle}, vibrant colors, character reference sheet style. Absolutely no text, no words, no letters, no watermarks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: '9:16',
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData?.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error('AI không trả về dữ liệu ảnh.');
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
      const currentWords = suggestionRows.map((r) => r.name.trim()).filter(Boolean).join(', ');
      const prompt = `Bạn là chuyên gia ngôn ngữ cho trẻ em.
Hãy tạo danh sách đúng ${promptCount} từ vựng (chỉ tiếng Việt) thuộc danh mục "${category}" với chủ đề cụ thể là "${topic || PLACEHOLDERS[category]}".
${currentWords ? `LƯU Ý: KHÔNG được trùng với các từ sau: ${currentWords}.` : ''}
Yêu cầu: Chỉ trả về danh sách từ vựng tiếng Việt, mỗi từ một dòng. Không đánh số, không thêm bất kỳ văn bản giải thích nào khác.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const text = extractText(response);
      const suggestedWords = text
        .trim()
        .split('\n')
        .map((w) => w.trim())
        .filter(Boolean)
        .slice(0, promptCount);

      const newRows = Array.from({ length: promptCount }, (_, index) => ({
        stt: index + 1,
        name: suggestedWords[index] || '',
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
      const currentWords = suggestionRows.map((r) => r.name.trim()).filter(Boolean).join(', ');
      const prompt = `Bạn là chuyên gia ngôn ngữ cho trẻ em.
Hãy gợi ý DUY NHẤT 1 từ vựng tiếng Việt mới thuộc danh mục "${category}" với chủ đề cụ thể là "${topic || PLACEHOLDERS[category]}".
${currentWords ? `LƯU Ý: KHÔNG được trùng với các từ sau: ${currentWords}.` : ''}
Yêu cầu: Chỉ trả về đúng 1 từ vựng tiếng Việt, không thêm bất kỳ văn bản nào khác.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const newWord = extractText(response).trim();

      setSuggestionRows((prev) => [
        ...prev,
        { stt: prev.length + 1, name: newWord },
      ]);
      setPromptCount((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      setSuggestionRows((prev) => [
        ...prev,
        { stt: prev.length + 1, name: '' },
      ]);
      setPromptCount((prev) => prev + 1);
    } finally {
      setIsAddingRow(false);
    }
  };

  const handleUpdateSuggestion = (index: number, value: string) => {
    setSuggestionRows((prev) => prev.map((row, i) => (i === index ? { ...row, name: value } : row)));
  };

  const handleUpdateVocab = (index: number, field: keyof VocabRow, value: string) => {
    setVocabularyList((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleDeleteSuggestion = (index: number) => {
    setSuggestionRows((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((row, i) => ({ ...row, stt: i + 1 }))
    );
    setPromptCount((prev) => Math.max(0, prev - 1));
  };

  const handleDeleteVocab = (index: number) => {
    setVocabularyList((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((row, i) => ({ ...row, stt: i + 1 }))
    );
  };

  const handleDone = async () => {
    const wordsToTranslate = suggestionRows.map((r) => r.name.trim()).filter(Boolean);

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
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const text = extractText(response);
      const translatedLines = text.trim().split('\n').filter((line) => line.includes('|'));

      const newVocabList: VocabRow[] = translatedLines.map((line, index) => {
        const parts = line.split('|').map((s) => s.trim());

        return {
          stt: index + 1,
          vn: parts[0] || '',
          mom: parts[1] || '',
          kid: parts[2] || '',
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

    const finalWords = vocabularyList
      .map((v) => {
        let wordStr = `VN: ${v.vn}`;
        if (momLang !== 'Tiếng Việt') wordStr += `, ${momLang}: ${v.mom}`;
        if (kidLang !== 'Tiếng Việt') wordStr += `, ${kidLang}: ${v.kid}`;
        return wordStr;
      })
      .join('\n');

    setIsGenerating(true);
    setResultData([]);
    setLalaImage(null);
    setLilyImage(null);

    try {
      const momStyleDesc = VOICE_STYLE_DESCRIPTIONS[momVoiceStyle];
      const kidStyleDesc = VOICE_STYLE_DESCRIPTIONS[kidVoiceStyle];
      const actualCount = vocabularyList.length;

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
- Mỗi prompt tương ứng 1 cảnh ~8 giây, dạy đúng 1 từ.
- MÔ TẢ MÔI TRƯỜNG phải cực kỳ chi tiết.
- Nếu là nghề nghiệp: phải có nhân vật thứ 3 (người thật, Asian-looking).
- Nếu là động vật, trái cây, đồ vật: đối tượng chính là chính vật đó và phải mô tả cực kỳ chi tiết.
- Lala chỉ tay vào đối tượng; Lily nhìn theo với vẻ mặt thích thú hoặc chạm nhẹ vào đối tượng nếu phù hợp.

YÊU CẦU VIDEO PROMPT:
- Từ đầu tiên của [VIDEO PROMPT] phải là phong cách hình ảnh: "${finalStyle}".
- Format: Vertical 9:16.
- Dùng trực tiếp tên "Lala" và "Lily".
- Không có chữ, watermark.
- Có cinematic lighting, 4K resolution, highly detailed textures, smooth character animation, medium shot hoặc close-up, vibrant but natural colors.

VOICE:
- LALA (${momLang}): ${momStyleDesc}
- LILY (${kidLang}): ${kidStyleDesc}
- Script: Lala hỏi ngắn gọn, Lily trả lời từ vựng một lần + câu minh hoạ ngắn.
- Lily KHÔNG nói lặp lại từ vựng 2 lần.

FORMAT ĐẦU RA:
- Trả về đúng ${actualCount} dòng.
- Mỗi dòng đúng template:
WORD: {Vocabulary in all selected languages} PROMPT: [VIDEO PROMPT]: ${finalStyle}, {Detailed description of environment, Lala and Lily's actions, camera, lighting} ; [VOICE - 8s]: Lala, style voice: ${momStyleDesc} ; [LIP SYNC LALA]: {Specific mouth movement instructions for Lala's script} ; Script: "{Script in ${momLang}}" ; Lily, style voice: ${kidStyleDesc} ; [LIP SYNC LILY]: {Specific mouth movement instructions for Lily's script} ; Script: "{Script in ${kidLang}}"
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const text = extractText(response);
      const lines = text
        .trim()
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const parsedResults: PromptResult[] = lines.map((line, index) => {
        const wordMatch = line.match(/WORD:\s*(.*?)\s*PROMPT:/);
        const promptMatch = line.match(/PROMPT:\s*(.*)/);

        return {
          stt: index + 1,
          word: wordMatch ? wordMatch[1].trim() : 'N/A',
          prompt: promptMatch ? promptMatch[1].trim() : line,
        };
      });

      setResultData(parsedResults);

      if (shouldGenerateCharacter) {
        setIsGeneratingImages(true);

        try {
          const [lalaImg, lilyImg] = await Promise.all([
            generateCharacterImage(LALA_CHARACTER_PROMPT),
            generateCharacterImage(LILY_CHARACTER_PROMPT),
          ]);

          setLalaImage(lalaImg);
          setLilyImage(lilyImg);
          showStatus('success', 'Đã tạo prompt và 2 ảnh nhân vật AI thành công!');
        } catch (imageError: any) {
          console.error('Character image generation failed:', imageError);
          setLalaImage(null);
          setLilyImage(null);
          showStatus('error', imageError?.message || 'Tạo ảnh nhân vật thất bại.');
        } finally {
          setIsGeneratingImages(false);
        }
      } else {
        showStatus('success', 'Đã tạo prompt thành công!');
      }
    } catch (error) {
      console.error(error);
      showStatus('error', 'Lỗi khi tạo dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (resultData.length === 0) return;

    const content = resultData.map((r) => r.prompt).join('\n');
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
          <div className="lg:col-span-12 space-y-6">
            <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Palette className="text-indigo-500" size={24} />
                Cấu hình Video
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800">Danh mục từ vựng</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={isGenerating}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-sm font-bold ${category === 'Tùy chỉnh' ? 'text-slate-800' : 'text-slate-400'}`}>
                    Chủ đề cụ thể (tuỳ chỉnh)
                  </label>
                  <input
                    type="text"
                    disabled={category !== 'Tùy chỉnh' || isGenerating}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={category === 'Tùy chỉnh' ? 'Nhập chủ đề của bạn...' : PLACEHOLDERS[category]}
                    className={`w-full border rounded-xl px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                      category === 'Tùy chỉnh' && !isGenerating
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-60'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800">Số lượng prompt (số cảnh)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="3"
                      max="30"
                      value={promptCount}
                      disabled={isGenerating}
                      onChange={(e) => setPromptCount(Math.max(3, parseInt(e.target.value) || 3))}
                      className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <span className="text-xs text-slate-400 italic">Mỗi prompt = 1 cảnh ~8s</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800">Phong cách hình ảnh</label>
                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        disabled={isGenerating}
                        className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {STYLES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>

                    {style === 'Tùy chỉnh' && (
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

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800">Ngôn ngữ Mẹ (Mom)</label>
                  <div className="relative">
                    <select
                      value={momLang}
                      onChange={(e) => setMomLang(e.target.value)}
                      disabled={isGenerating}
                      className="w-full appearance-none bg-indigo-50 border-2 border-indigo-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
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
                      {VOICE_STYLES.map((s) => (
                        <option key={s} value={s}>
                          Style: {s}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-800">Ngôn ngữ Con (Lily)</label>
                  <div className="relative">
                    <select
                      value={kidLang}
                      onChange={(e) => setKidLang(e.target.value)}
                      disabled={isGenerating}
                      className="w-full appearance-none bg-emerald-50 border-2 border-emerald-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
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
                      {VOICE_STYLES.map((s) => (
                        <option key={s} value={s}>
                          Style: {s}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  </div>
                </div>

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
                        <th className="py-3 px-4 text-[11px] font-black text-black uppercase tracking-wider">
                          Tên (Tiếng Việt)
                        </th>
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
                            {isAddingRow ? <Loader2 className="animate-spin" size={14} /> : '+ Thêm hàng (AI gợi ý)'}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleDone}
                  disabled={isTranslating || isGenerating || suggestionRows.every((r) => !r.name.trim())}
                  className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isTranslating ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  Xong
                </button>
              </section>

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
                          {momLang !== 'Tiếng Việt' && (
                            <th className="py-3 px-4 text-[11px] font-black text-black uppercase tracking-wider">
                              {momLang} (Mom)
                            </th>
                          )}
                          {kidLang !== 'Tiếng Việt' && (
                            <th className="py-3 px-4 text-[11px] font-black text-black uppercase tracking-wider">
                              {kidLang} (Kid)
                            </th>
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

                            {momLang !== 'Tiếng Việt' && (
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

                            {kidLang !== 'Tiếng Việt' && (
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

            <div className="flex justify-center">
              <button
                onClick={handleGeneratePrompts}
                disabled={isGenerating || vocabularyList.length === 0}
                className={`w-full max-w-md flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all shadow-lg ${
                  vocabularyList.length > 0
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Video size={20} />}
                🎬 Tạo Prompt Video
              </button>
            </div>

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
                    <CharacterCard
                      title="Mẹ Lala"
                      subtitle="Nhân vật chính (Full Body)"
                      prompt={LALA_CHARACTER_PROMPT}
                      image={lalaImage}
                      isGenerating={isGeneratingImages}
                      color="indigo"
                      onDownload={() => {
                        if (lalaImage) {
                          downloadImage(lalaImage, 'lala_character.png');
                        }
                      }}
                    />

                    <CharacterCard
                      title="Bé Lily"
                      subtitle="Nhân vật chính (Full Body)"
                      prompt={LILY_CHARACTER_PROMPT}
                      image={lilyImage}
                      isGenerating={isGeneratingImages}
                      color="emerald"
                      onDownload={() => {
                        if (lilyImage) {
                          downloadImage(lilyImage, 'lily_character.png');
                        }
                      }}
                    />
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

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
                          <div className="flex items-center gap-1">
                            <Hash size={14} /> STT
                          </div>
                        </th>
                        <th className="py-4 px-4 text-[11px] font-black text-black uppercase tracking-wider w-48">
                          <div className="flex items-center gap-1">
                            <Type size={14} /> TỪ VỰNG
                          </div>
                        </th>
                        <th className="py-4 px-4 text-[11px] font-black text-black uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            <Video size={14} /> PROMPT
                          </div>
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

        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 ${
                status.type === 'success'
                  ? 'bg-emerald-600 text-white'
                  : status.type === 'error'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-white'
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
