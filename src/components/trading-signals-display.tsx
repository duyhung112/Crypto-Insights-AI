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

interface TradingSignalsDisplayProps {
  signals: TradingSignalsOutput;
}

const getSignalBadgeClass = (signal: "Buy" | "Sell" | "Neutral" | "Mua" | "Bán" | "Trung tính") => {
  switch (signal) {
    case "Buy":
    case "Mua":
      return "bg-green-500/20 text-green-700 border-green-500/50 hover:bg-green-500/30";
    case "Sell":
    case "Bán":
      return "bg-red-500/20 text-red-700 border-red-500/50 hover:bg-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-700 border-gray-500/50 hover:bg-gray-500/30 dark:text-gray-300";
  }
};

const getConfidenceBadgeClass = (confidence: "High" | "Medium" | "Low" | "Cao" | "Trung bình" | "Thấp") => {
    switch(confidence) {
        case "High":
        case "Cao":
            return "border-primary/80 text-primary";
        case "Medium":
        case "Trung bình":
            return "border-yellow-500/80 text-yellow-600 dark:text-yellow-400";
        default:
            return "border-muted-foreground/50 text-muted-foreground";
    }
}

const signalMap = {
  "Buy": "Mua",
  "Sell": "Bán",
  "Neutral": "Trung tính"
}

const confidenceMap = {
    "High": "Cao",
    "Medium": "Trung bình",
    "Low": "Thấp"
}

export function TradingSignalsDisplay({ signals }: TradingSignalsDisplayProps) {
  return (
    <Card className="w-full">
       <CardHeader>
        <CardTitle className="font-headline text-xl">Tín hiệu Giao dịch</CardTitle>
        <CardDescription>
          Tín hiệu tự động dựa trên các chỉ báo kỹ thuật phổ biến.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                  <Badge variant="outline" className={cn("text-xs", getSignalBadgeClass(signal.signal))}>
                    {signalMap[signal.signal] || signal.signal}
                  </Badge>
                </TableCell>
                 <TableCell className="text-center">
                  <Badge variant="outline" className={cn("text-xs", getConfidenceBadgeClass(signal.confidence))}>
                    {confidenceMap[signal.confidence] || signal.confidence}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{signal.reasoning}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
