import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Plus, Edit2, Trash2, Eye, EyeOff, ExternalLink, MessageSquare, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Task {
  id: string;
  name: string;
  description: string;
  category: string;
  type: number;
  link: string;
  rewards: Array<{ currency?: { quantity: number; code: string } }>;
  hidden: boolean;
  order: number;
}

const TasksPage = () => {
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.getTasks(),
  });

  const { data: claimedData } = useQuery({
    queryKey: ['claimed-tasks'],
    queryFn: () => api.getClaimedTasks(1, 1),
  });

  const tasks = tasksData?.tasks || [];
  const totalClaimed = claimedData?.pagination?.total || 0;
  const activeTasks = tasks.filter(t => !t.hidden).length;

  return (
    <DashboardLayout title="Задачи">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="glass-card p-5">
            <p className="text-sm text-muted-foreground mb-1">Всего задач</p>
            <p className="text-2xl font-bold text-foreground">
              {isLoading ? "..." : tasks.length}
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-muted-foreground mb-1">Выполнено всего</p>
            <p className="text-2xl font-bold text-success">
              {totalClaimed.toLocaleString('ru-RU')}
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-muted-foreground mb-1">Активных задач</p>
            <p className="text-2xl font-bold text-primary">{activeTasks}</p>
          </div>
          <div className="glass-card p-5">
            <p className="text-sm text-muted-foreground mb-1">Скрытых задач</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {tasks.filter(t => t.hidden).length}
            </p>
          </div>
        </div>

        {/* Add Task Button */}
        <div className="flex justify-end">
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            Добавить задачу
          </button>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {isLoading ? (
            <div className="col-span-2 p-10 text-center text-muted-foreground">Загрузка...</div>
          ) : tasks.length === 0 ? (
            <div className="col-span-2 p-10 text-center text-muted-foreground">Задачи не найдены</div>
          ) : (
            tasks.map((task: Task) => {
              const reward = task.rewards?.[0]?.currency;
              return (
            <div key={task.id} className="glass-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    task.type === 1 ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
                  )}>
                    {task.type === 1 ? (
                      <Megaphone className="w-6 h-6" />
                    ) : (
                      <MessageSquare className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{task.name}</h3>
                    <p className="text-sm text-muted-foreground">{task.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="action-btn w-8 h-8">
                    {task.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button className="action-btn w-8 h-8">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="action-btn w-8 h-8 hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{task.description}</p>

              <div className="flex items-center gap-2 mb-4">
                <a 
                  href={task.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {task.link}
                </a>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Награда</p>
                  <p className="font-semibold text-foreground">
                    {reward ? `${reward.quantity} ${reward.code?.toUpperCase() || 'PLT'}` : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Порядок</p>
                  <p className="font-semibold text-foreground">{task.order}</p>
                </div>
              </div>
            </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TasksPage;
