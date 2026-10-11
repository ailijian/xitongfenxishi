import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function PWAStatus() {
  const [online, setOnline] = useState(navigator.onLine),
    [install, setInstall] = useState<InstallPrompt>(),
    [error, setError] = useState(""),
    [persisted, setPersisted] = useState(false),
    [cached, setCached] = useState(false);
  const {
    offlineReady: [ready],
    needRefresh: [refresh, setRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(e) {
      setError(String(e));
    },
  });
  useEffect(() => {
    if ("serviceWorker" in navigator)
      void navigator.serviceWorker.ready
        .then(async () => {
          const keys = await caches.keys();
          setCached(keys.some((k) => k.includes("workbox-precache")));
        })
        .catch(() => {});
    const on = () => setOnline(navigator.onLine),
      prompt = (e: Event) => {
        e.preventDefault();
        setInstall(e as InstallPrompt);
      };
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    window.addEventListener("beforeinstallprompt", prompt);
    navigator.storage
      ?.persisted?.()
      .then(setPersisted)
      .catch(() => {});
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
      window.removeEventListener("beforeinstallprompt", prompt);
    };
  }, []);
  return (
    <section className="pwa-status" aria-label="离线学习状态">
      <p>
        <strong>{online ? "已联网" : "离线模式"}</strong> ·{" "}
        {ready || cached
          ? "全部核心资料已缓存，可离线学习"
          : import.meta.env.DEV
            ? "开发预览；离线缓存需构建版本"
            : window.isSecureContext
              ? "正在准备离线缓存，首次访问需联网"
              : "安装与离线学习需使用HTTPS地址"}
      </p>
      {install && (
        <button
          onClick={() =>
            void install
              .prompt()
              .then(() => install.userChoice)
              .then(() => setInstall(undefined))
          }
        >
          安装到主屏幕
        </button>
      )}
      {refresh && (
        <div className="confirm-box">
          <p>新版本已准备好。请等待页面“已保存”提示后更新，学习记录保留。</p>
          <button onClick={() => void updateServiceWorker(true)}>
            更新并重新载入
          </button>
          <button onClick={() => setRefresh(false)}>稍后更新</button>
        </div>
      )}
      {error && <p role="alert">离线缓存未成功，请联网重试。{error}</p>}
      {!persisted && (
        <button
          className="text-button"
          onClick={() => void navigator.storage?.persist?.().then(setPersisted)}
        >
          请求浏览器持久保存本设备数据
        </button>
      )}
      {persisted && <small>浏览器已授予持久存储，仍建议定期备份。</small>}
    </section>
  );
}
