import type { NewsAnalysisOutput } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Minus, Newspaper, ExternalLink } from "lucide-react";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";

interface NewsAnalysisDisplayProps {
  analysis: NewsAnalysisOutput;
}

const getSentimentProps = (sentiment: "Positive" | "Negative" | "Neutral") => {
  switch (sentiment) {
    case "Positive":
      return {
        Icon: ThumbsUp,
        text: "Tích cực",
        className: "bg-green-500/20 text-green-700 border-green-500/50",
      };
    case "Negative":
      return {
        Icon: ThumbsDown,
        text: "Tiêu cực",
        className: "bg-red-500/20 text-red-700 border-red-500/50",
      };
    default:
      return {
        Icon: Minus,
        text: "Trung lập",
        className: "bg-gray-500/20 text-gray-700 border-gray-500/50 dark:text-gray-300",
      };
  }
};

export function NewsAnalysisDisplay({ analysis }: NewsAnalysisDisplayProps) {
  const sentimentProps = getSentimentProps(analysis.sentiment);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex flex-wrap items-center gap-4">
          Phân tích Tin tức & Tâm lý Thị trường
           <Badge
            variant="outline"
            className={cn("text-base px-3 py-1", sentimentProps.className)}
          >
            <span className="flex items-center gap-2">
              <sentimentProps.Icon className="h-4 w-4" />
              {sentimentProps.text}
            </span>
          </Badge>
        </CardTitle>
        <CardDescription>
          Phân tích được cung cấp bởi Gemini AI dựa trên các tin tức mới nhất.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <div className="space-y-2">
          <h3 className="font-headline text-lg font-semibold">
            Tóm tắt Nhanh
          </h3>
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {analysis.summary}
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-headline text-lg font-semibold">
            Lý do Đánh giá
          </h3>
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {analysis.reasoning}
          </p>
        </div>

        <Separator />
        
        <div className="space-y-4">
            <h3 className="font-headline text-lg font-semibold flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-primary" />
                Các bài viết đã Phân tích
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.articles.map((article, index) => (
                 <a 
                    href={article.url} 
                    key={index}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="group"
                >
                    <Card className="h-full hover:border-primary/80 hover:bg-muted/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors">
                                {article.title}
                            </CardTitle>
                            <CardDescription className="text-xs flex items-center gap-2 pt-2">
                               {article.source}
                               <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardDescription>
                        </CardHeader>
                    </Card>
                 </a>
            ))}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
