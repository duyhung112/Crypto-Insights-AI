// This is an autogenerated file from Firebase Studio.
'use server';

/**
 * @fileOverview Analyzes news sentiment for a given cryptocurrency.
 *
 * - analyzeNewsSentiment - A function that initiates the news sentiment analysis.
 * - NewsAnalysisInput - The input type for the analyzeNewsSentiment function.
 * - NewsAnalysisOutput - The return type for the analyzeNewsSentiment function.
 */

import type { Genkit } from 'genkit';
import {
  NewsAnalysisInputSchema,
  type NewsAnalysisInput,
  NewsAnalysisOutputSchema,
  type NewsAnalysisOutput,
} from '@/lib/types';


export async function analyzeNewsSentiment(input: NewsAnalysisInput, dynamicAi: Genkit): Promise<NewsAnalysisOutput> {
  
  const analyzeNewsSentimentPrompt = dynamicAi.definePrompt({
    name: 'newsSentimentAnalysisPrompt',
    input: { schema: NewsAnalysisInputSchema },
    output: { schema: NewsAnalysisOutputSchema },
    prompt: `Bạn là một nhà phân tích tài chính chuyên về thị trường tiền mã hóa.
Nhiệm vụ của bạn là phân tích danh sách các tin tức được cung cấp về tiền mã hóa '{{{cryptoSymbol}}}' để xác định tâm lý chung của thị trường.

**Dữ liệu đầu vào (Các bài báo):**
{{#each articles}}
- **Tiêu đề:** {{title}}
  **Nguồn:** {{source}}
  **Tóm tắt:** {{snippet}}
{{/each}}

Dựa trên các tin tức được cung cấp, hãy thực hiện các bước sau:
1.  **Xác định Tâm lý Thị trường:** Đọc qua các tiêu đề và đoạn tóm tắt. Quyết định xem tâm lý chung là "Positive", "Negative", hay "Neutral".
    - **QUAN TRỌNG:** Giá trị của trường 'sentiment' PHẢI là một trong ba chuỗi tiếng Anh: "Positive", "Negative", hoặc "Neutral".
    - Tích cực (Positive): Tin tức về việc áp dụng, nâng cấp công nghệ thành công, đầu tư lớn, quy định có lợi.
    - Tiêu cực (Negative): Tin tức về các vụ tấn công, lừa đảo, quy định bất lợi, sự cố kỹ thuật, sự sụt giảm niềm tin.
    - Trung lập (Neutral): Tin tức mang tính thông tin chung, không có tác động rõ rệt đến giá cả hoặc tâm lý.
2.  **Tóm tắt các Điểm chính:** Viết một đoạn tóm tắt ngắn gọn (2-3 câu) bằng tiếng Việt, nêu bật những thông tin quan trọng nhất từ các bài báo đã phân tích.
3.  **Giải thích Lý do:** Cung cấp một lời giải thích ngắn gọn (1-2 câu) bằng tiếng Việt về lý do tại sao bạn lại đưa ra kết luận về tâm lý như trên.
4.  **Liệt kê các Bài báo:** Trả về danh sách các bài báo đã được sử dụng cho việc phân tích, đúng như dữ liệu đầu vào.

Hãy đảm bảo kết quả trả về tuân thủ đúng định dạng đầu ra JSON.`,
  });

  const { output } = await analyzeNewsSentimentPrompt(input);
  
  if (!output) {
    throw new Error("Phân tích tin tức AI không trả về kết quả.");
  }
  return output;
}
