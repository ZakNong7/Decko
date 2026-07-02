import AlertModal from "./modals/AlertModal";
import React, { useMemo, useState } from "react";
import {
  X,
  Calendar,
  MessageSquare,
  Trash2,
  Info,
  Tag,
  Flag,
  Send,
  Palette,
  AlertTriangle,
  Check,
  Copy,
} from "lucide-react";
import api from "../api/axios";
import LabelModal from "./modals/LabelModal";
import MemberAvatarStack from "./MemberAvatarStack";
import { getAvatarColor, getContrastColor, getInitials } from "../utils/avatar";
import {
  canManageBoard,
  normalizeRole,
} from "../utils/permissions";

const CardModal = ({
  card,
  labels = [],
  members = [],
  userRole,
  canEditCards,
  isPrivate = false,
  onClose,
  onUpdate,
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [description, setDescription] = useState(card?.description || "");
  const [priority, setPriority] = useState(card?.priority || "Medium");
  const [cardColor, setCardColor] = useState(card?.color || "#0095ff");
  const [title, setTitle] = useState(card?.title || "");
  const [deadline, setDeadline] = useState(
    card?.deadline ? new Date(card.deadline).toISOString().split("T")[0] : "",
  );
  const [labelIds, setLabelIds] = useState(
    (card?.labels || []).map((label) => label.id),
  );
  const [assigneeIds, setAssigneeIds] = useState(
    (card?.assignees || []).map((assignee) => assignee.id),
  );
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);
  const [tempColor, setTempColor] = useState(card?.color || "#0095ff");
  const [copiedColor, setCopiedColor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const normalizedRole = normalizeRole(userRole);
  const canManageAssignees = canManageBoard(normalizedRole);

  const assignedMembers = useMemo(
    () =>
      members.filter((member) =>
        assigneeIds.some((id) => Number(id) === Number(member.id)),
      ),
    [members, assigneeIds],
  );

  const toggleLabel = (labelId) => {
    if (!canEditCards) return;
    setLabelIds((current) =>
      current.some((id) => Number(id) === Number(labelId))
        ? current.filter((id) => Number(id) !== Number(labelId))
        : [...current, labelId],
    );
  };

  const toggleAssignee = (memberId) => {
    if (!canManageAssignees) return;
    setAssigneeIds((current) =>
      current.some((id) => Number(id) === Number(memberId))
        ? current.filter((id) => Number(id) !== Number(memberId))
        : [...current, memberId],
    );
  };

  React.useEffect(() => {
    if (card) {
      fetchComments();
      setDescription(card.description || "");
      setPriority(card.priority || "Medium");
      setCardColor(card.color || "#0095ff");
      setTempColor(card.color || "#0095ff");
      setTitle(card.title || "");
      setDeadline(
        card.deadline
          ? new Date(card.deadline).toISOString().split("T")[0]
          : "",
      );
      setLabelIds((card.labels || []).map((label) => label.id));
      setAssigneeIds((card.assignees || []).map((assignee) => assignee.id));
    }
  }, [card]);

  const priorityColor = useMemo(() => {
    if (priority === "High") return "#e74c3c";
    if (priority === "Medium") return "#f1c40f";
    return "#2ecc71";
  }, [priority]);

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/comments/${card.id}`);
      setComments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendComment = async () => {
    if (!canEditCards || !newComment.trim()) return;
    try {
      await api.post("/comments", {
        cardId: card.id,
        content: newComment,
      });
      setNewComment("");
      fetchComments();
    } catch (err) {
      setAlertInfo({ title: "Gagal", message: "Gagal memposting komentar baru.", type: "error" });
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!canEditCards) return;
    try {
      await api.delete(`/comments/${commentId}`);
      fetchComments();
    } catch (err) {
      setAlertInfo({ title: "Gagal", message: "Gagal menghapus komentar.", type: "error" });
    }
  };

  const handleSave = async () => {
    if (!canEditCards) return;
    try {
      const payload = {
        title,
        description,
        priority,
        color: cardColor,
        deadline,
        labelIds,
      };
      if (canManageAssignees) {
        payload.assigneeIds = assigneeIds;
      }
      await api.put(`/cards/card/${card.id}`, payload);
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      setAlertInfo({ title: "Gagal", message: "Gagal menyimpan perubahan kartu.", type: "error" });
    }
  };

  const handleDelete = async () => {
    if (!canEditCards) return;
    try {
      await api.delete(`/cards/card/${card.id}`);
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      setAlertInfo({ title: "Gagal", message: "Gagal menghapus kartu.", type: "error" });
    }
  };

  const handleCreateLabel = async (name, color) => {
    try {
      const { data } = await api.post("/cards/labels", {
        workspaceId: card.workspace_id,
        name,
        color,
      });
      setLabelIds((current) => [...current, data.id]);
      if (onUpdate) onUpdate();
    } catch (err) {
      setAlertInfo({ title: "Gagal", message: "Gagal membuat label baru.", type: "error" });
    }
  };

  const handleDeleteLabel = async (labelId) => {
    try {
      await api.delete(`/cards/labels/${labelId}`);
      setLabelIds((current) => current.filter((id) => id !== labelId));
      if (onUpdate) onUpdate();
    } catch (err) {
      setAlertInfo({ title: "Gagal", message: "Gagal menghapus label.", type: "error" });
    }
  };

  if (!card) return null;

  return (
    <div
      className="modal-backdrop modal-backdrop-enter"
      style={styles.overlay}
      onClick={onClose}
    >
      <div
        className="modal-panel modal-panel-enter"
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <header style={styles.header}>
          <div style={styles.headerInfo}>
            <div
              style={{
                ...styles.cardAccent,
                backgroundColor: cardColor,
              }}
            />
            <div style={{ flex: 1 }}>
              {canEditCards ? (
                <input
                  style={styles.titleInput}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              ) : (
                <h2 style={styles.title}>{title}</h2>
              )}
              <p style={styles.subtitle}>
                dalam list{" "}
                <span style={{ fontWeight: "700", color: "#eee" }}>
                  {card.list_name || "Papan Utama"}
                </span>
              </p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={24} />
          </button>
        </header>

        <div style={styles.mainContent}>
          <div style={styles.leftCol}>
            <section style={styles.section}>
              <h4 style={styles.sectionTitle}>
                <Info size={14} /> DESKRIPSI
              </h4>
              <textarea
                style={styles.description}
                value={description}
                onChange={(e) => canEditCards && setDescription(e.target.value)}
                readOnly={!canEditCards}
                placeholder={
                  canEditCards
                    ? "Tambahkan deskripsi lebih detail..."
                    : "Tidak ada deskripsi."
                }
              />
            </section>

            <section style={styles.section}>
              <h4 style={styles.sectionTitle}>
                <MessageSquare size={14} /> {isPrivate ? "CATATAN" : "KOMENTAR"}
              </h4>
              {canEditCards && (
              <div style={styles.newComment}>
                <div
                  style={{
                    ...styles.commentAvatar,
                    backgroundColor: getAvatarColor(
                      currentUser?.username || currentUser?.full_name,
                    ),
                    color: getContrastColor(
                      getAvatarColor(
                        currentUser?.username || currentUser?.full_name,
                      ),
                    ),
                    border: "none",
                  }}
                >
                  {getInitials(currentUser)}
                </div>
                <input
                  type="text"
                  placeholder={
                    isPrivate ? "Tulis catatan..." : "Tulis komentar..."
                  }
                  style={styles.commentInput}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                />
                <button onClick={handleSendComment} style={styles.sendBtn}>
                  <Send size={18} />
                </button>
              </div>
              )}
              <div style={styles.commentList}>
                {comments.map((comment) => (
                  <div key={comment.id} style={styles.comment}>
                    <div
                      style={{
                        ...styles.commentAvatar,
                        backgroundColor: getAvatarColor(comment.username),
                        color: getContrastColor(
                          getAvatarColor(comment.username),
                        ),
                        border: "none",
                      }}
                    >
                      {comment.username?.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={styles.commentBody}>
                      <div style={styles.commentHeaderRow}>
                        <p style={styles.commentHeader}>
                          {comment.full_name || comment.username}
                        </p>
                        <div style={styles.commentHeaderActions}>
                          <span style={styles.time}>
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                          {canEditCards && (
                            <button
                              type="button"
                              style={styles.commentDeleteBtn}
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p style={styles.commentText}>{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div style={styles.rightCol}>
            <section style={styles.sidebarSection}>
              <h4 style={styles.sidebarTitle}>ATRIBUT</h4>

              <div style={styles.attribute}>
                <Palette size={16} /> <span>Aksen</span>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", flex: 1 }}>
                  <input
                    type="color"
                    style={styles.colorInput}
                    value={tempColor}
                    onChange={(e) => canEditCards && setTempColor(e.target.value)}
                    disabled={!canEditCards}
                  />
                  <input
                    type="text"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "#fff",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      width: "80px",
                      fontFamily: "monospace",
                      outline: "none",
                    }}
                    value={tempColor.toUpperCase()}
                    onChange={(e) => {
                      if (canEditCards) {
                        let val = e.target.value;
                        if (!val.startsWith("#")) val = "#" + val;
                        setTempColor(val);
                      }
                    }}
                    disabled={!canEditCards}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(tempColor);
                      setCopiedColor(true);
                      setTimeout(() => setCopiedColor(false), 1500);
                    }}
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#fff",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title="Salin Kode Hex"
                  >
                    {copiedColor ? <Check size={12} color="#2ecc71" /> : <Copy size={12} />}
                  </button>
                  {tempColor.toLowerCase() !== cardColor.toLowerCase() && (
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setCardColor(tempColor);
                        }}
                        style={{
                          backgroundColor: "#2ecc71",
                          border: "none",
                          color: "white",
                          padding: "6px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Simpan Warna"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTempColor(cardColor);
                        }}
                        style={{
                          backgroundColor: "#ff4d4d",
                          border: "none",
                          color: "white",
                          padding: "6px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Batal"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.attribute}>
                <Flag size={16} /> <span>Prioritas</span>
                <select
                  style={styles.select}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  disabled={!canEditCards}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
                <span
                  style={{
                    ...styles.priorityPill,
                    backgroundColor: `${priorityColor}22`,
                    color: priorityColor,
                    borderColor: priorityColor,
                  }}
                >
                  {priority}
                </span>
              </div>

              <div style={styles.attribute}>
                <Calendar size={16} /> <span>Tenggat</span>
                <input
                  type="date"
                  style={styles.sidebarInput}
                  value={deadline ? deadline.substring(0, 10) : ""}
                  onChange={(e) => canEditCards && setDeadline(e.target.value)}
                  disabled={!canEditCards}
                />
              </div>

              <div style={styles.attributeColumn}>
                <div style={styles.attributeRow}>
                  <Tag size={16} /> <span>Label</span>
                  {canEditCards && (
                    <button
                      style={styles.addLabelBtn}
                      onClick={() => setShowLabelModal(true)}
                    >
                      + Kelola
                    </button>
                  )}
                </div>
                <div style={styles.labelWrap}>
                  {labels.map((label) => {
                    const isSelected = labelIds.some(
                      (id) => Number(id) === Number(label.id),
                    );
                    return (
                      <button
                        key={label.id}
                        type="button"
                        disabled={!canEditCards}
                        onClick={() => toggleLabel(label.id)}
                        style={{
                          ...styles.labelChip,
                          borderColor: isSelected ? label.color : "#333",
                          color: label.color,
                          backgroundColor: isSelected
                            ? `${label.color}14`
                            : "rgba(255,255,255,0.02)",
                          cursor: canEditCards ? "pointer" : "default",
                          opacity: canEditCards || isSelected ? 1 : 0.6,
                        }}
                      >
                        <span
                          style={{
                            ...styles.labelChipDot,
                            backgroundColor: label.color,
                          }}
                        />
                        {label.name}
                      </button>
                    );
                  })}
                  {labels.length === 0 && (
                    <span style={styles.emptyHint}>Belum ada label.</span>
                  )}
                </div>
              </div>
            </section>

            {!isPrivate && (
              <section style={styles.sidebarSection}>
                <h4 style={styles.sidebarTitle}>ANGGOTA ({assignedMembers.length})</h4>
                {canManageAssignees && members.length > 0 ? (
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      style={styles.dropdownBtn}
                      onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                    >
                      {assigneeIds.length > 0 ? `${assigneeIds.length} Anggota Terpilih` : "Pilih Anggota..."}
                    </button>
                    {showAssigneeDropdown && (
                      <div style={styles.dropdownMenu}>
                        {members.map((member) => {
                          const isSelected = assigneeIds.some(
                            (id) => Number(id) === Number(member.id),
                          );
                          return (
                            <label key={member.id} style={styles.dropdownOption}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleAssignee(member.id)}
                              />
                              <span>{member.full_name || member.username}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {assignedMembers.length > 0 ? (
                      <MemberAvatarStack members={assignedMembers} max={4} size={32} />
                    ) : (
                      <span style={styles.emptyHint}>Belum ada anggota ditugaskan.</span>
                    )}
                  </>
                )}
              </section>
            )}
          </div>
        </div>

        <footer style={styles.footer}>
          {canEditCards && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={styles.deleteBtn}
            >
              <Trash2 size={16} /> Hapus Kartu
            </button>
          )}
          <div style={{ display: "flex", gap: "16px", marginLeft: "auto" }}>
            <button onClick={onClose} style={styles.cancelBtn}>
              Batal
            </button>
            {canEditCards && (
              <button onClick={handleSave} style={styles.saveBtn}>
                Simpan Perubahan
              </button>
            )}
          </div>
        </footer>
      </div>

      {alertInfo && (
        <AlertModal
          title={alertInfo.title}
          message={alertInfo.message}
          type={alertInfo.type}
          onClose={() => setAlertInfo(null)}
        />
      )}
      {showLabelModal && (
        <LabelModal
          labels={labels}
          selectedLabelIds={labelIds}
          onClose={() => setShowLabelModal(false)}
          onCreateLabel={handleCreateLabel}
          onDeleteLabel={handleDeleteLabel}
          onToggleLabel={toggleLabel}
        />
      )}

      {showDeleteConfirm && (
        <div
          style={styles.confirmOverlay}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.confirmIcon}>
              <AlertTriangle size={32} color="#e74c3c" />
            </div>
            <h3 style={styles.confirmTitle}>Hapus kartu ini?</h3>
            <p style={styles.confirmText}>
              Kartu dan seluruh komentar di dalamnya akan dihapus.
            </p>
            <div style={styles.confirmActions}>
              <button
                style={styles.confirmCancel}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Batal
              </button>
              <button style={styles.confirmDelete} onClick={handleDelete}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3100,
  },
  modal: {
    backgroundColor: "#1a1d21",
    width: "90%",
    maxWidth: "850px",
    borderRadius: "24px",
    display: "flex",
    flexDirection: "column",
    maxHeight: "90vh",
    border: "1px solid rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  header: {
    padding: "24px 32px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255,255,255,0.01)",
  },
  headerInfo: { display: "flex", gap: "20px", alignItems: "center", flex: 1 },
  cardAccent: {
    width: "48px",
    height: "6px",
    borderRadius: "999px",
    flexShrink: 0,
  },
  titleInput: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "22px",
    fontWeight: "800",
    outline: "none",
    width: "100%",
    borderBottom: "1px solid transparent",
    padding: "4px 0",
  },
  title: { fontSize: "22px", fontWeight: "800" },
  subtitle: { fontSize: "13px", color: "#666", marginTop: "4px" },
  closeBtn: {
    background: "transparent",
    color: "#a0a0a0",
    cursor: "pointer",
    border: "none",
  },
  mainContent: { display: "flex", flex: 1, overflow: "hidden" },
  leftCol: {
    flex: 2,
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    gap: "40px",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    overflowY: "auto",
    maxHeight: "100%",
  },
  rightCol: {
    flex: 1,
    padding: "32px",
    backgroundColor: "rgba(255,255,255,0.01)",
    display: "flex",
    flexDirection: "column",
    gap: "32px",
    overflowY: "auto",
    maxHeight: "100%",
  },
  section: { display: "flex", flexDirection: "column", gap: "16px" },
  sectionTitle: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#a0a0a0",
    letterSpacing: "1.5px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  description: {
    backgroundColor: "#1a1d21",
    border: "1px solid #333",
    borderRadius: "12px",
    padding: "16px",
    color: "white",
    fontSize: "15px",
    lineHeight: "1.6",
    minHeight: "150px",
    outline: "none",
    resize: "none",
  },
  commentList: {
    display: "flex",
    flexDirection: "column-reverse",
    gap: "16px",
    marginTop: "10px",
  },
  comment: { display: "flex", gap: "12px" },
  commentAvatar: {
    width: "28px",
    height: "28px",
    borderRadius: "14px",
    backgroundColor: "white",
    color: "#0095ff",
    border: "2px solid #0095ff",
    fontSize: "10px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  commentBody: {
    flex: 1,
    backgroundColor: "#22252a",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  commentHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "4px",
  },
  commentHeader: { fontSize: "12px", fontWeight: "700" },
  commentHeaderActions: { display: "flex", alignItems: "center", gap: "8px" },
  commentDeleteBtn: {
    background: "transparent",
    border: "none",
    color: "#e74c3c",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  time: { fontWeight: "400", color: "#888", fontSize: "11px" },
  commentText: { fontSize: "14px", color: "#ccc", lineHeight: "1.5" },
  newComment: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    backgroundColor: "#1a1d21",
    padding: "8px",
    borderRadius: "12px",
    border: "1px solid #333",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "transparent",
    border: "none",
    color: "white",
    fontSize: "14px",
    outline: "none",
    padding: "8px",
  },
  sendBtn: {
    backgroundColor: "#0095ff",
    color: "white",
    border: "none",
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  sidebarTitle: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#a0a0a0",
    letterSpacing: "1.5px",
    marginBottom: "16px",
  },
  sidebarSection: { display: "flex", flexDirection: "column", gap: "16px" },
  attribute: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "13px",
    color: "#888",
  },
  attributeColumn: { display: "flex", flexDirection: "column", gap: "10px" },
  attributeRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "13px",
    color: "#888",
  },
  select: {
    backgroundColor: "#1a1d21",
    color: "white",
    border: "1px solid #333",
    fontSize: "12px",
    padding: "6px",
    borderRadius: "8px",
    marginLeft: "auto",
    outline: "none",
  },
  sidebarInput: {
    backgroundColor: "#1a1d21",
    color: "white",
    border: "1px solid #333",
    fontSize: "12px",
    padding: "6px",
    borderRadius: "8px",
    marginLeft: "auto",
    outline: "none",
  },
  colorPickerLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginLeft: "auto",
  },
  colorInput: {
    width: "36px",
    height: "36px",
    padding: 0,
    border: "1px solid #333",
    borderRadius: "8px",
    background: "transparent",
    cursor: "pointer",
  },
  colorHex: {
    fontSize: "12px",
    color: "#888",
    fontFamily: "monospace",
  },
  addLabelBtn: {
    backgroundColor: "transparent",
    border: "1px dashed #444",
    color: "#666",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    marginLeft: "auto",
    cursor: "pointer",
  },
  labelWrap: { display: "flex", flexWrap: "wrap", gap: "8px" },
  labelChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 10px",
    borderRadius: "999px",
    border: "1px solid",
    fontSize: "11px",
    fontWeight: "700",
  },
  emptyHint: { fontSize: "12px", color: "#666" },
  labelChipDot: { width: "8px", height: "8px", borderRadius: "999px" },
  footer: {
    padding: "20px 32px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    alignItems: "center",
    backgroundColor: "#1a1d21",
    justifyContent: "space-between",
  },
  deleteBtn: {
    backgroundColor: "transparent",
    border: "1px solid #ff4d4d",
    color: "#ff4d4d",
    padding: "10px 16px",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  cancelBtn: {
    backgroundColor: "transparent",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#a0a0a0",
    padding: "10px 18px",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  saveBtn: {
    backgroundColor: "#0095ff",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  assigneePicker: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "8px",
  },
  assigneeOption: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    color: "#ccc",
    cursor: "pointer",
    userSelect: "none",
  },
  dropdownBtn: {
    width: "100%",
    backgroundColor: "#1a1d21",
    border: "1px solid #333",
    color: "white",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    textAlign: "left",
    cursor: "pointer",
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#1e2125",
    border: "1px solid #333",
    borderRadius: "8px",
    zIndex: 10,
    maxHeight: "180px",
    overflowY: "auto",
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
  },
  dropdownOption: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 8px",
    borderRadius: "4px",
    fontSize: "13px",
    color: "#ccc",
    cursor: "pointer",
    transition: "background 0.2s",
    ":hover": {
      backgroundColor: "rgba(255,255,255,0.05)",
    }
  }
};

export default CardModal;
