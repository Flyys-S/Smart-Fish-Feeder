import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { History, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { FeedHistory } from '../hooks/useFeeder';

interface HistoryLogProps {
  history: FeedHistory[];
}

export const HistoryLog = ({ history }: HistoryLogProps) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-row items-center space-x-2 border-b border-white/5 pb-4">
        <History size={18} className="text-white/40" />
        <CardTitle className="text-sm uppercase tracking-widest text-white/40">Feed History</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pt-4 space-y-4">
        {history.map((item) => (
          <div key={item.id} className="flex items-center justify-between group">
            <div className="flex items-center space-x-3">
              <div className={`p-1.5 rounded-full ${item.success ? 'text-accent bg-accent/5' : 'text-red-500 bg-red-500/5'}`}>
                {item.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-tighter text-white/30 group-hover:text-white/60 transition-colors">
                  {item.type} DISPENSE
                </span>
                <span className="text-xs font-medium">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </span>
              </div>
            </div>
            <div className={`h-1.5 w-1.5 rounded-full ${item.success ? 'bg-accent/40' : 'bg-red-500/40'}`} />
          </div>
        ))}

        {history.length === 0 && (
          <div className="text-center py-8 opacity-20 italic text-xs">
            Belum ada riwayat pakan
          </div>
        )}
      </CardContent>
    </Card>
  );
};
