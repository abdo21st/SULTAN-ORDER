import { Suspense } from 'react';
import ClientEditOrder from './ClientEditOrder';

// Required for static export with dynamic routes
export async function generateStaticParams() {
    return [{ id: '0' }]; // Dummy path to satisfy build
}

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
    // In Next.js 15+, params is a Promise
    const { id } = await params;

    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">جاري التحميل...</div>}>
            <ClientEditOrder id={id} />
        </Suspense>
    );
}
