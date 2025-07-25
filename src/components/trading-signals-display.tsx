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
import { Progress } from "./ui/progress";

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

const getConfidenceColor = (confidence: number) => {
    if (confidence > 75) return "bg-primary";
    if (confidence > 50) return "bg-yellow-500";
    return "bg-muted-foreground";
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
                <TableHead className="w-[150px]">Độ tin cậy</TableHead>
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
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <Progress value={signal.confidence} indicatorClassName={getConfidenceColor(signal.confidence)} className="h-2 flex-grow"/>
                            <span className="text-xs font-mono text-muted-foreground w-10 text-right">{signal.confidence}%</span>
                        </div>
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
