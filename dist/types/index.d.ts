import { Board, Column, Task, TaskStatus, TaskPriority } from '@prisma/client';
export interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    message?: string;
    statusCode: number;
    timestamp: string;
}
export interface BoardWithColumns extends Board {
    columns: ColumnWithTasks[];
}
export interface CreateBoardRequest {
    name: string;
    description?: string;
    color?: string;
}
export interface UpdateBoardRequest {
    name?: string;
    description?: string;
    color?: string;
}
export interface ColumnWithTasks extends Column {
    tasks: Task[];
}
export interface CreateColumnRequest {
    name: string;
    boardId: string;
    position?: number;
}
export interface UpdateColumnRequest {
    name?: string;
    position?: number;
}
export interface CreateTaskRequest {
    title: string;
    description?: string;
    columnId: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    dueDate?: string;
    position?: number;
}
export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    columnId?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    dueDate?: string;
    position?: number;
}
export interface MoveTaskRequest {
    columnId: string;
    position: number;
}
export interface BoardQuery {
    includeColumns?: boolean;
    includeTasks?: boolean;
}
export interface TaskQuery {
    columnId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'position';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}
export interface RepositoryResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
export { Board, Column, Task, TaskStatus, TaskPriority };
//# sourceMappingURL=index.d.ts.map