import LabelModal from './LabelModal';
import React, { useState } from "react";
import { X, Tag, User } from "lucide-react";

const AddCardModal = ({ listName, labels = [], members = [], onClose, onAdd }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [color, setColor] = useState("#0095ff");
  const [deadline, setDeadline] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [currentLabels, setCurrentLabels] = useState(labels);

  
  const handleCreateLabel = async (name, color) => {
    try {
      const { data } = await api.post(`/boards/${labels[0]?.board_id || 1}/label`, { name, color });
      setCurrentLabels([...currentLabels, data]);
    } catch (err) {
      alert("Gagal membuat label");
    }
  };

  const handleDeleteLabel = async (labelId) => {
    try {
      await api.delete(`/boards/label/${labelId}`);
      setCurrentLabels(currentLabels.filter((l) => l.id !== labelId));
      setSelectedLabelIds(selectedLabelIds.filter((id) => id !== labelId));
    } catch (err) {
      alert("Gagal menghapus label");
    }
  };

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
      assigneeIds: selectedMemberIds,
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

  return (
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

          <div style={styles.section}>
            <label style={styles.label}>Warna Aksen Kartu</label>
            <label style={styles.colorPickerLabel}>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                style={styles.colorInput}
              />
              <span style={styles.colorHex}>{color.toUpperCase()}</span>
            </label>
          </div>

          {currentLabels.length > 0 && (
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
              </div>
            </div>
          )}

          {members.length > 0 && (
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
  colorPickerLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    marginTop: "4px",
  },
  colorInput: {
    width: "36px",
    height: "36px",
    padding: 0,
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "8px",
    background: "transparent",
    cursor: "pointer",
  },
  colorHex: {
    fontSize: "14px",
    color: "#a0a0a0",
    fontFamily: "monospace",
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
  assigneePicker: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "4px",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  assigneeOption: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    color: "#ccc",
    cursor: "pointer",
    userSelect: "none",
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
  addLabelBtn: {
    backgroundColor: "transparent",
    border: "1px dashed #444",
    color: "#a0a0a0",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    cursor: "pointer",
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
