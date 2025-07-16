"use server";

import { ai } from "@/ai/genkit";
import { z } from "zod";

const NewsArticleSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  source: z.string(),
  snippet: z.string(),
});

// This is a mock function. In a real application, this would fetch news
// from a real news API like NewsAPI, CoinTelegraph, etc.
const fetchMockNews = (cryptoSymbol: string) => {
  const newsDatabase: Record<string, z.infer<typeof NewsArticleSchema>[]> = {
    BTC: [
      {
        title: "Bitcoin đạt mức cao mới mọi thời đại sau khi quỹ ETF được phê duyệt",
        url: "https://example.com/btc-ath-etf",
        source: "CoinDesk",
        snippet: "Giá Bitcoin đã vượt qua mốc 70.000 đô la sau sự chấp thuận lịch sử của các quỹ Bitcoin ETF giao ngay tại Hoa Kỳ, thu hút dòng vốn lớn từ các nhà đầu tư tổ chức.",
      },
      {
        title: "Các nhà phân tích dự đoán Bitcoin có thể điều chỉnh sau đợt tăng giá mạnh",
        url: "https://example.com/btc-correction-imminent",
        source: "CoinTelegraph",
        snippet: "Sau một đợt tăng giá ấn tượng, một số nhà phân tích kỹ thuật đang cảnh báo về khả năng điều chỉnh ngắn hạn của Bitcoin khi các chỉ báo cho thấy điều kiện quá mua.",
      },
      {
        title: "El Salvador tiếp tục mua thêm Bitcoin cho kho bạc quốc gia",
        url: "https://example.com/el-salvador-buys-more-btc",
        source: "Decrypt",
        snippet: "Tổng thống Nayib Bukele thông báo rằng El Salvador đã mua thêm 400 BTC, tái khẳng định cam kết của quốc gia này đối với tiền mã hóa hàng đầu.",
      },
    ],
    ETH: [
      {
        title: "Bản nâng cấp Dencun của Ethereum chính thức ra mắt, giảm đáng kể phí gas cho Layer 2",
        url: "https://example.com/eth-dencun-upgrade",
        source: "The Block",
        snippet: "Bản nâng cấp Dencun được mong đợi từ lâu đã được triển khai thành công trên mạng chính Ethereum, giới thiệu 'proto-danksharding' để giảm chi phí giao dịch trên các giải pháp Layer 2.",
      },
      {
        title: "Sự quan tâm đến Ethereum ETF giao ngay tăng lên sau thành công của Bitcoin ETF",
        url: "https://example.com/eth-spot-etf-interest",
        source: "Bloomberg",
        snippet: "Các công ty quản lý tài sản lớn như BlackRock và Fidelity hiện đang nộp đơn xin Ethereum ETF giao ngay, làm dấy lên hy vọng về một đợt tăng giá tương tự như Bitcoin.",
      },
       {
        title: "Vitalik Buterin đề xuất các bước tiếp theo cho lộ trình phát triển của Ethereum",
        url: "https://example.com/vitalik-roadmap-update",
        source: "Ethereum Blog",
        snippet: "Người sáng lập Ethereum, Vitalik Buterin, đã vạch ra các lĩnh vực trọng tâm trong tương lai, bao gồm cải thiện khả năng mở rộng, bảo mật và tính bền vững của mạng lưới.",
      },
    ],
    SOL: [
      {
        title: "Solana phải đối mặt với tình trạng tắc nghẽn mạng do sự bùng nổ của memecoin",
        url: "https://example.com/sol-congestion-memecoins",
        source: "CoinDesk",
        snippet: "Mạng Solana đã trải qua tình trạng tắc nghẽn và tỷ lệ giao dịch thất bại cao do khối lượng giao dịch tăng đột biến từ cơn sốt memecoin gần đây.",
      },
      {
        title: "Các nhà phát triển Solana công bố kế hoạch cho bản cập nhật mới nhằm cải thiện hiệu suất mạng",
        url: "https://example.com/sol-performance-update",
        source: "Solana Labs",
        snippet: "Để giải quyết các vấn đề về hiệu suất gần đây, các nhà phát triển cốt lõi của Solana đã đề xuất một loạt các bản cập nhật nhằm tối ưu hóa việc xử lý giao dịch và giảm tắc nghẽn.",
      },
    ],
    DEFAULT: [
        {
            title: "Thị trường tiền mã hóa biến động khi các nhà đầu tư chờ đợi dữ liệu lạm phát của Mỹ",
            url: "https://example.com/crypto-market-volatile",
            source: "Reuters",
            snippet: "Toàn bộ thị trường tiền mã hóa đang trải qua một giai đoạn biến động khi các nhà giao dịch chờ đợi báo cáo Chỉ số Giá Tiêu dùng (CPI) sắp tới, điều này có thể ảnh hưởng đến quyết định của Cục Dự trữ Liên bang."
        },
        {
            title: "Quy định về tiền mã hóa trở thành tâm điểm chú ý tại hội nghị G20",
            url: "https://example.com/g20-crypto-regulation",
            source: "Financial Times",
            snippet: "Các nhà lãnh đạo tài chính từ các quốc gia G20 đang thảo luận về việc tạo ra một khuôn khổ quy định toàn cầu cho tài sản mã hóa để đảm bảo sự ổn định tài chính và bảo vệ người tiêu dùng."
        }
    ]
  };

  return newsDatabase[cryptoSymbol] || newsDatabase.DEFAULT;
};


export const getNewsForCryptoTool = ai.defineTool(
  {
    name: "getNewsForCrypto",
    description: "Fetches the latest news articles for a given cryptocurrency symbol.",
    inputSchema: z.object({
      cryptoSymbol: z.string().describe("The symbol of the cryptocurrency, e.g., BTC, ETH."),
    }),
    outputSchema: z.array(NewsArticleSchema),
  },
  async (input) => {
    console.log(`[Tool] Fetching news for ${input.cryptoSymbol}`);
    // In a real app, you would make an API call here.
    // We are returning mock data for demonstration purposes.
    return fetchMockNews(input.cryptoSymbol);
  }
);
