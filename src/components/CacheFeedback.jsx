export default function CacheFeedback({ resources }) {
    const failed = resources.filter((resource) => resource.error);
    if (!failed.length) return null;
    return (
        <div role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p>Data belum dapat diperbarui. Data yang tersimpan mungkin belum terbaru.</p>
            {[...new Set(failed.map((resource) => resource.error.message))].map((message) => <p key={message} className="mt-1 text-xs">{message}</p>)}
            <button type="button" onClick={() => Promise.allSettled(failed.map((resource) => resource.refresh()))} className="mt-2 rounded-lg px-2 py-1 text-xs font-semibold underline focus-visible:outline-2 focus-visible:outline-blue-500">Muat ulang data</button>
        </div>
    );
}
