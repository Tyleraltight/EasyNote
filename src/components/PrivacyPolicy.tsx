import { X } from 'lucide-react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

export default function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[85vh] shadow-2xl flex flex-col animate-[fadeIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            隐私政策与免责声明
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 text-sm leading-relaxed text-slate-600 space-y-5">
          <p className="text-slate-800 font-medium">
            EasyNote 是一款注重隐私的极简工具。我们深知数据对你的重要性，因此我们郑重承诺：
          </p>

          <section>
            <h3 className="font-bold text-slate-700 mb-1">数据归属</h3>
            <p>
              你的所有 Flag 记录、笔记和复盘内容均存储在安全的加密数据库中（由 Supabase
              提供支持）。除了用于实现应用功能（如多端同步、数据保存）外，我们不会读取、分析或处理你的任何私有数据。
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-700 mb-1">信息收集</h3>
            <p>
              我们仅在登录阶段收集你的邮箱地址（或第三方登录提供的必要
              ID），用于识别你的账户并同步你的数据。我们绝不收集你的位置、联系人、设备文件或任何与应用功能无关的隐私信息。
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-700 mb-1">第三方共享</h3>
            <p>
              我们永远不会将你的个人数据出售、交易或分享给任何第三方公司或广告商。
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-700 mb-1">本地存储</h3>
            <p>
              为了保证登录状态，我们会在你的设备上使用必要的 Cookies 或 LocalStorage。
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-700 mb-1">数据备份</h3>
            <p>
              虽然我们提供了云端同步功能，但仍建议用户定期自行备份重要数据。对于因不可抗力导致的数据丢失，EasyNote
              不承担法律责任。
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-700 mb-1">用户责任</h3>
            <p>
              用户需对其在应用内记录的内容负责，请勿利用本工具存储任何违反当地法律法规的信息。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
