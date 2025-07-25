import type { TradingSignalsOutput } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

interface TradingSignalsDisplayProps {
  signals: TradingSignalsOutput;
}

const getSignalBadgeClass = (signal: string) => {
  if (!signal) return "bg-gray-500/20 text-gray-700 border-gray-500/50";
  const lowerSignal = signal.toLowerCase();
  if (lowerSignal.includes("buy") || lowerSignal.includes("mua")) {
    return "bg-green-500/20 text-green-700 border-green-500/50 hover:bg-green-500/30";
  }
  if (lowerSignal.includes("sell") || lowerSignal.includes("bán")) {
    return "bg-red-500/20 text-red-700 border-red-500/50 hover:bg-red-500/30";
  }
  return "bg-gray-500/20 text-gray-700 border-gray-500/50 hover:bg-gray-500/30 dark:text-gray-300";
};

const getConfidenceBadgeClass = (confidence: string) => {
    if (!confidence) return "border-muted-foreground/50 text-muted-foreground";
    const lowerConfidence = confidence.toLowerCase();
    if (lowerConfidence.includes("high") || lowerConfidence.includes("cao")) {
        return "border-primary/80 text-primary";
    }
    if (lowerConfidence.includes("medium") || lowerConfidence.includes("trung bình")) {
        return "border-yellow-500/80 text-yellow-600 dark:text-yellow-400";
    }
    return "border-muted-foreground/50 text-muted-foreground";
}

export function TradingSignalsDisplay({ signals }: TradingSignalsDisplayProps) {
  if (!signals || !signals.signals || signals.signals.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Tín hiệu Giao dịch</CardTitle>
          <CardDescription>Không có tín hiệu chi tiết nào được tạo ra.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
       <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary"/>
            Tín hiệu Giao dịch Chi tiết
        </CardTitle>
        <CardDescription>
          Tín hiệu tự động được tổng hợp từ nhiều chỉ báo kỹ thuật khác nhau.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[150px]">Chỉ báo</TableHead>
                <TableHead className="text-center w-[120px]">Tín hiệu</TableHead>
                <TableHead className="text-center w-[120px]">Độ tin cậy</TableHead>
                <TableHead>Lý do</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {signals.signals.map((signal, index) => (
                <TableRow key={index}>
                    <TableCell className="font-medium">{signal.indicator}</TableCell>
                    <TableCell className="text-center">
                    <Badge variant="outline" className={cn("text-xs font-semibold", getSignalBadgeClass(signal.signal))}>
                        {signal.signal}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                    <Badge variant="outline" className={cn("text-xs font-semibold", getConfidenceBadgeClass(signal.confidence))}>
                        {signal.confidence}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{signal.reasoning}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
