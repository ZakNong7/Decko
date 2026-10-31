import LabelModal from './LabelModal';
import AlertModal from "./AlertModal";
import React, { useState } from "react";
import { X, Tag, User, Copy, Check } from "lucide-react";
import api from "../../api/axios";

const AddCardModal = ({ listName, labels = [], members = [], onClose, onAdd, isPrivate, userRole, workspaceId }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [color, setColor] = useState("#0095ff");
  const [deadline, setDeadline] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  // States for modals and dropdown
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [currentLabels, setCurrentLabels] = useState(labels);

  // Redesigned color states
  const [tempColor, setTempColor] = useState("#0095ff");
  const [copiedColor, setCopiedColor] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title,
      description,
      priority,
      color,
      deadline: deadline || null,
      labelIds: selectedLabelIds,
      assigneeIds: isPrivate ? [] : selectedMemberIds,
    });
  };

  const toggleLabel = (labelId) => {
    if (selectedLabelIds.includes(labelId)) {
      setSelectedLabelIds(selectedLabelIds.filter((id) => id !== labelId));
    } else {
      setSelectedLabelIds([...selectedLabelIds, labelId]);
    }
  };

  const toggleMember = (memberId) => {
    if (selectedMemberIds.includes(memberId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== memberId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, memberId]);
    }
  };

  const handleCreateLabel = async (name, colorVal) => {
    try {
      const targetWorkspaceId = workspaceId || labels[0]?.workspace_id;
      const { data } = await api.post("/cards/labels", {
        workspaceId: targetWorkspaceId,
        name,
        color: colorVal,
      });
      setCurrentLabels([...currentLabels, data]);
      setSelectedLabelIds((prev) => [...prev, data.id]);
    } catch (err) {
      setAlertInfo({ title: "Gagal", message: "Gagal membuat label baru.", type: "error" });
    }
  };

  const handleDeleteLabel = async (labelId) => {
    try {
      await api.delete(`/cards/labels/${labelId}`);
      setCurrentLabels(currentLabels.filter((l) => l.id !== labelId));
      setSelectedLabelIds(selectedLabelIds.filter((id) => id !== labelId));
    } catch (err) {
      setAlertInfo({ title: "Gagal", message: "Gagal menghapus label.", type: "error" });
    }
  };

  return (
    <>
      {alertInfo && (
        <AlertModal
          title={alertInfo.title}
          message={alertInfo.message}
          type={alertInfo.type}
          onClose={() => setAlertInfo(null)}
        />
      )}
      <div className="modal-backdrop modal-backdrop-enter" style={styles.overlay} onClick={onClose}>
        <div className="modal-panel modal-panel-enter" style={styles.modal} onClick={e => e.stopPropagation()}>
          <header style={styles.header}>
            <h2>Tambah Kartu Baru {listName ? `(${listName})` : ""}</h2>
            <X onClick={onClose} style={{ cursor: "pointer" }} />
          </header>

          <form onSubmit={handleSave} style={styles.body}>
            <div style={styles.section}>
              <label style={styles.label}>Judul Kartu</label>
              <input
                style={styles.input}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Tulis judul tugas..."
                required
                autoFocus
              />
            </div>

            <div style={styles.section}>
              <label style={styles.label}>Deskripsi Tugas</label>
              <textarea
                style={styles.textarea}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Tambahkan detail tugas..."
                rows={2}
              />
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.section, flex: 1 }}>
                <label style={styles.label}>Prioritas</label>
                <select
                  style={styles.select}
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                >
                  <option value="Low">Rendah (Low)</option>
                  <option value="Medium">Sedang (Medium)</option>
                  <option value="High">Tinggi (High)</option>
                </select>
              </div>

              <div style={{ ...styles.section, flex: 1 }}>
                <label style={styles.label}>Tenggat Waktu</label>
                <input
                  type="date"
                  style={styles.input}
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                />
              </div>
            </div>

            {/* REDESIGNED COLOR ACCENT PICKER */}
            <div style={styles.section}>
              <label style={styles.label}>Warna Aksen Kartu</label>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <input
                  type="color"
                  value={tempColor}
                  onChange={e => setTempColor(e.target.value)}
                  style={styles.colorInput}
                />
                <input
                  type="text"
                  style={styles.hexInput}
                  value={tempColor.toUpperCase()}
                  onChange={e => {
                    let val = e.target.value;
                    if (!val.startsWith("#")) val = "#" + val;
                    setTempColor(val);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(tempColor);
                    setCopiedColor(true);
                    setTimeout(() => setCopiedColor(false), 1500);
                  }}
                  style={styles.iconBtn}
                  title="Salin Kode Hex"
                >
                  {copiedColor ? <Check size={14} color="#2ecc71" /> : <Copy size={14} />}
                </button>
                {tempColor.toLowerCase() !== color.toLowerCase() && (
                  <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => setColor(tempColor)}
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
                      onClick={() => setTempColor(color)}
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

            {/* LABELS SECTION */}
            <div style={styles.section}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={styles.label}><Tag size={12} style={{ marginRight: "4px" }} /> Label</label>
                <button
                  type="button"
                  style={styles.addLabelBtn}
                  onClick={() => setShowLabelModal(true)}
                >
                  + Kelola
                </button>
              </div>
              <div style={styles.labelWrap}>
                {currentLabels.map((label) => {
                  const isSelected = selectedLabelIds.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => toggleLabel(label.id)}
                      style={{
                        ...styles.labelChip,
                        borderColor: isSelected ? label.color : "#333",
                        color: label.color,
                        backgroundColor: isSelected ? `${label.color}14` : "rgba(255,255,255,0.02)",
                        cursor: "pointer",
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
                {currentLabels.length === 0 && (
                  <span style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                    Belum ada label. Klik "+ Kelola" untuk membuat label baru.
                  </span>
                )}
              </div>
            </div>

            {/* MEMBERS ASSIGNEES (HIDDEN ON PRIVATE WORKSPACE) */}
            {!isPrivate && userRole !== "Member" && members.length > 0 && (
              <div style={styles.section}>
                <label style={styles.label}><User size={12} style={{ marginRight: "4px" }} /> Tugaskan Anggota</label>
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    style={styles.dropdownBtn}
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  >
                    {selectedMemberIds.length > 0 ? `${selectedMemberIds.length} Anggota Terpilih` : "Pilih Anggota..."}
                  </button>
                  {showAssigneeDropdown && (
                    <div style={styles.dropdownMenu}>
                      {members.map((member) => {
                        const isSelected = selectedMemberIds.includes(member.id);
                        return (
                          <label key={member.id} style={styles.dropdownOption}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleMember(member.id)}
                            />
                            <span>{member.full_name || member.username}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <footer style={styles.footer}>
              <button type="button" style={styles.cancelBtn} onClick={onClose}>
                Batal
              </button>
              <button type="submit" style={styles.submitBtn}>
                Tambah Kartu
              </button>
            </footer>
          </form>
        </div>

        {showLabelModal && (
          <LabelModal
            labels={currentLabels}
            selectedLabelIds={selectedLabelIds}
            onClose={() => setShowLabelModal(false)}
            onCreateLabel={handleCreateLabel}
            onDeleteLabel={handleDeleteLabel}
            onToggleLabel={toggleLabel}
          />
        )}
      </div>
    </>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#1e2125",
    color: "#fff",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "450px",
    display: "flex",
    flexDirection: "column",
    maxHeight: "85vh",
    overflowY: "auto",
  },
  header: {
    padding: "20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  body: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  row: {
    display: "flex",
    gap: "12px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#a0a0a0",
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
  },
  textarea: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    resize: "none",
  },
  select: {
    backgroundColor: "#1e2125",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
  },
  colorInput: {
    width: "38px",
    height: "38px",
    padding: 0,
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "8px",
    background: "transparent",
    cursor: "pointer",
  },
  hexInput: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    width: "90px",
    fontFamily: "monospace",
    outline: "none",
  },
  iconBtn: {
    backgroundColor: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "9px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  saveColorBtn: {
    backgroundColor: "#2ecc71",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  cancelColorBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#ccc",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  labelWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "4px",
  },
  labelChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "999px",
    border: "1px solid",
    fontSize: "11px",
    fontWeight: "700",
  },
  labelChipDot: {
    width: "8px",
    height: "8px",
    borderRadius: "999px",
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
    maxHeight: "150px",
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
  },
  addLabelBtn: {
    backgroundColor: "transparent",
    border: "1px dashed #444",
    color: "#a0a0a0",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    cursor: "pointer",
  },
  footer: {
    paddingTop: "10px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  cancelBtn: {
    backgroundColor: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  submitBtn: {
    backgroundColor: "#0095ff",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default AddCardModal;
