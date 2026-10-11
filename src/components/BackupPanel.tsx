import { useState } from "react";
import { content } from "../data/content";
import {
  exportBackup,
  validateBackup,
  restoreBackup,
  clearUserData,
  type Backup,
} from "../storage/backup";
import { downloadText } from "./download";
import { ErrorMessage, friendlyError } from "./ui";
export function BackupPanel() {
  const [preview, setPreview] = useState<Backup>(),
    [name, setName] = useState(""),
    [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [confirm, setConfirm] = useState(false),
    [reset, setReset] = useState(false),
    [busy, setBusy] = useState(false);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }
  async function read(file?: File) {
    setPreview(undefined);
    setConfirm(false);
    setStatus("");
    if (!file) return;
    await run(async () => {
      if (file.size > 20 * 1024 * 1024)
        throw new Error("文件超过20MB，请检查是否为本应用JSON备份。");
      let input;
      try {
        input = JSON.parse(await file.text());
      } catch {
        throw new Error("文件不是有效JSON，原数据未改动。");
      }
      setPreview(validateBackup(input));
      setName(file.name);
    });
  }
  return (
    <section className="paper">
      <h2>完整数据备份与恢复</h2>
      <p>
        包含掌握状态、全部尝试、未交答案、错题/收藏、案例、论文、项目素材、模考快照和计划设置。JSON只保存在你下载的文件中。
      </p>
      <ErrorMessage message={error} />
      {status && (
        <p role="status" className="success-message">
          {status}
        </p>
      )}
      <button
        className="primary"
        disabled={busy}
        onClick={() =>
          void run(async () => {
            const b = await exportBackup();
            downloadText(
              `软考冲刺-备份-${b.exportedAt.slice(0, 10)}.json`,
              JSON.stringify(b, null, 2),
              "application/json;charset=utf-8",
            );
            setStatus("完整备份已生成，请保留下载的JSON文件。");
          })
        }
      >
        导出完整 JSON 备份
      </button>
      <label className="field-label">
        选择备份 JSON（最多20MB）
        <input
          type="file"
          accept=".json,application/json"
          disabled={busy}
          onChange={(e) => void read(e.target.files?.[0])}
        />
      </label>
      {preview && (
        <div className="confirm-box">
          <h3>校验通过 · 恢复预览</h3>
          <p>
            {name}
            <br />
            备份时间：{new Date(preview.exportedAt).toLocaleString("zh-CN")}
            <br />
            版本：schema {preview.schemaVersion} / {preview.contentVersion}
          </p>
          {preview.contentVersion !== content.contentVersion && (
            <p>
              内容版本与当前不同，所有引用ID均已核对存在，恢复后使用当前资料文字。
            </p>
          )}
          <ul>
            <li>
              知识状态 {preview.data.cards.length} 条，闭卷记录{" "}
              {preview.data.cardAttempts.length} 次
            </li>
            <li>
              答题记录 {preview.data.questionAttempts.length} 次，练习/模考试卷{" "}
              {preview.data.sessions.length} 份
            </li>
            <li>
              知识自测草稿 {preview.data.learningDrafts.length} 份，收藏{" "}
              {preview.data.bookmarks.length} 题
            </li>
            <li>
              案例记录 {preview.data.caseAttempts.length} 次，案例草稿{" "}
              {preview.data.caseDrafts.length} 份
            </li>
            <li>
              论文草稿 {preview.data.essayDrafts.length} 份，项目素材{" "}
              {preview.data.projects.length} 份
            </li>
            <li>
              完整模考 {preview.data.exams.length} 场，设置{" "}
              {preview.data.settings.length} 份
            </li>
          </ul>
          <p>
            恢复会整体替换本设备当前学习数据。建议先导出当前数据；资料题库不会被替换。
          </p>
          {!confirm ? (
            <button onClick={() => setConfirm(true)}>准备恢复此备份</button>
          ) : (
            <>
              <p>再次确认：用此备份替换本设备学习数据？</p>
              <button
                className="primary"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await restoreBackup(preview);
                    setPreview(undefined);
                    setConfirm(false);
                    setStatus("备份已完整恢复。");
                  })
                }
              >
                确认替换并恢复
              </button>
            </>
          )}
          <button
            onClick={() => {
              setPreview(undefined);
              setConfirm(false);
            }}
          >
            取消恢复
          </button>
        </div>
      )}
      <h3>重置本设备记录</h3>
      {!reset ? (
        <button disabled={busy} onClick={() => setReset(true)}>
          重置学习数据…
        </button>
      ) : (
        <div className="confirm-box">
          <p>
            重置会删除本设备全部进度、草稿与历史。请先下载备份。此操作不删除学习资料。
          </p>
          <button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await clearUserData();
                setReset(false);
                setStatus("本设备学习数据已重置，学习资料保留。");
              })
            }
          >
            再次确认，清空全部学习数据
          </button>
          <button onClick={() => setReset(false)}>取消重置</button>
        </div>
      )}
    </section>
  );
}
