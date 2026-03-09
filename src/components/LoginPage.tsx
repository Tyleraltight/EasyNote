import { Github } from 'lucide-react';

interface LoginPageProps {
    onLogin: () => void;
    loading: boolean;
}

export default function LoginPage({ onLogin, loading }: LoginPageProps) {
    return (
        <div className="min-h-screen font-[Inter,system-ui,sans-serif] flex items-center justify-center">
            {/* Background - same as Dashboard */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-[#f8fafc]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000001a_1px,transparent_1px),linear-gradient(to_bottom,#0000001a_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute inset-0 bg-[radial-gradient(125%_125%_at_50%_10%,rgba(249,115,22,0.2)_40%,rgba(248,250,252,1)_100%)]" />
            </div>

            <div className="text-center">
                <h1 className="text-5xl font-black tracking-tight text-slate-800 mb-3">EasyNote</h1>
                <p className="text-slate-400 font-medium mb-12">极简个人效率管理</p>

                <button
                    onClick={onLogin}
                    disabled={loading}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-base font-bold
                               hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all shadow-xl
                               disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Github size={22} />
                    {loading ? '正在跳转...' : '使用 GitHub 登录'}
                </button>

                <p className="mt-6 text-xs text-slate-300">登录后数据将跨设备同步</p>
            </div>
        </div>
    );
}
