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

const getSignalBadgeClass = (signal: "Buy" | "Sell" | "Neutral") => {
  switch (signal) {
    case "Buy":
      return "bg-green-500/20 text-green-700 border-green-500/50 hover:bg-green-500/30";
    case "Sell":
      return "bg-red-500/20 text-red-700 border-red-500/50 hover:bg-red-500/30";
    default:
      return "bg-gray-500/20 text-gray-700 border-gray-500/50 hover:bg-gray-500/30 dark:text-gray-300";
  }
};

const getConfidenceBadgeClass = (confidence: "High" | "Medium" | "Low") => {
    switch(confidence) {
        case "High":
            return "border-primary/80 text-primary";
        case "Medium":
            return "border-yellow-500/80 text-yellow-600 dark:text-yellow-400";
        default:
            return "border-muted-foreground/50 text-muted-foreground";
    }
}

export function TradingSignalsDisplay({ signals }: TradingSignalsDisplayProps) {
  return (
    <Card className="w-full">
       <CardHeader>
        <CardTitle className="font-headline text-xl">Trading Signals</CardTitle>
        <CardDescription>
          Automated signals based on common technical indicators.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Indicator</TableHead>
              <TableHead className="text-center w-[120px]">Signal</TableHead>
              <TableHead className="text-center w-[120px]">Confidence</TableHead>
              <TableHead>Reasoning</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signals.signals.map((signal, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{signal.indicator}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={cn("text-xs", getSignalBadgeClass(signal.signal))}>
                    {signal.signal}
                  </Badge>
                </TableCell>
                 <TableCell className="text-center">
                  <Badge variant="outline" className={cn("text-xs", getConfidenceBadgeClass(signal.confidence))}>
                    {signal.confidence}
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
