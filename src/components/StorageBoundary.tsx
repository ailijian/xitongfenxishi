import { Component, type ReactNode } from "react";
export class StorageBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="app-shell">
        <h1>学习数据暂时无法打开</h1>
        <p>
          请确认浏览器允许本网站使用存储空间，再重新载入。若正在使用隐私模式，可在普通浏览器中打开。已有数据不会自动清除。
        </p>
        <button onClick={() => window.location.reload()}>重新载入</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
