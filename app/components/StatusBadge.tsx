import { OrderStatus, STATUS_LABELS } from '@/app/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const STATUS_STYLES: Record<OrderStatus, string> = {
    'DRAFT': 'bg-gray-100 text-gray-800 border-gray-200',
    'REGISTERED': 'bg-blue-100 text-blue-800 border-blue-200',
    'IN_CREATION': 'bg-purple-100 text-purple-800 border-purple-200',
    'PREPARED': 'bg-yellow-100 text-yellow-800 border-yellow-200 animate-pulse-slow',
    'TRANSFERRED': 'bg-orange-100 text-orange-800 border-orange-200',
    'DELIVERED': 'bg-green-100 text-green-800 border-green-200',
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
    return (
        <span className={cn(
            "px-3 py-1 rounded-full text-sm font-medium border",
            STATUS_STYLES[status]
        )}>
            {STATUS_LABELS[status]}
        </span>
    );
}
