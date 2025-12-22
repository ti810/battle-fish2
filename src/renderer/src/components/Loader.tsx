export default function Loader({ show }: { show: boolean }) {
    if (!show) return null

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
                <span className="text-white text-sm text-[24px]">Processando
                    <span className="inline-flex gap-1 text-sm">
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                    </span>
                </span>
            </div>
        </div>
    )
}