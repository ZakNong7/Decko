import AlertModal from "../components/modals/AlertModal";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  MoreHorizontal,
  Plus,
  Calendar,
  MessageSquare,
  Settings,
  House,
  LogOut,
  ChevronDown,
  Check,
  Lock,
  Shield,
  Layout,
} from "lucide-react";
import socket from "../api/socket";
import SettingsModal from "../components/SettingsModal";
import MemberAvatarStack from "../components/MemberAvatarStack";
import {
  canEditCards,
  canManageLists,
  canManageBoard,
  normalizeRole,
} from "../utils/permissions";
import AddListModal from "../components/modals/AddListModal";
import AddBoardModal from "../components/modals/AddBoardModal";
import AddCardModal from "../components/modals/AddCardModal";
import CardModal from "../components/CardModal";
import EditListModal from "../components/modals/EditListModal";

const BoardView = () => {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [error, setError] = useState(null);
  const [boardsInWorkspace, setBoardsInWorkspace] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showAddList, setShowAddList] = useState(false);
  const [showAddBoard, setShowAddBoard] = useState(false);
  const [showAddCard, setShowAddCard] = useState(null);
  const [showEditList, setShowEditList] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterLabel, setFilterLabel] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  const navigate = useNavigate();

  useEffect(() => {
    console.log("[BOARD MOUNT] boardId from params:", boardId);
    fetchBoardData();
    if (boardId) {
      socket.auth = { token: localStorage.getItem("token") };
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit("join-board", boardId);
    }

    socket.on("card-update", () => fetchBoardData());
    return () => {
      socket.off("card-update");
      socket.disconnect();
    };
  }, [boardId]);

  const fetchBoardData = async () => {
    try {
      const { data } = await api.get(`/boards/${boardId}`);
      setBoard(data);

      const boardsResult = await api.get(
        `/boards/workspace/${data.workspace_id}`,
      );
      setBoardsInWorkspace(boardsResult.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        setError("Akses ditolak. Anda bukan anggota workspace ini.");
      } else {
        setError("Gagal memuat data papan. Pastikan URL benar.");
      }
    }
  };

  const handleBack = () => navigate("/dashboard");

  const addList = async (name, color, isFinal) => {
    try {
      await api.post("/boards/list", {
        boardId: board.id,
        name,
        color,
        isFinal,
        orderIndex: board.lists.length,
      });
      setShowAddList(false);
      fetchBoardData();
    } catch (err) {
      setAlertInfo({ title: "Gagal", message: "Gagal menambah list baru.", type: "error" });
    }
  };

  const addBoard = async (name) => {
    try {
      await api.post("/boards", {
        workspaceId: board.workspace_id,
        name,
      });
      setShowAddBoard(false);
      fetchBoardData();
    } catch (err) {
      setAlertInfo({ title: "Gagal", message: "Gagal menambah papan baru.", type: "error" });
    }
  };

  const addCard = async (cardData) => {
    try {
      const list = board.lists.find((l) => l.id === showAddCard);
      await api.post("/cards/card", {
        listId: showAddCard,
        title: cardData.title,
        priority: cardData.priority,
        color: cardData.color,
        deadline: cardData.deadline,
        labelIds: cardData.labelIds,
        assigneeIds: cardData.assigneeIds,
        orderIndex: list.cards.length,
      });
      setShowAddCard(null);
      fetchBoardData();
    } catch (err) {
      setAlertInfo({ title: "Gagal", message: "Gagal menambah kartu baru.", type: "error" });
    }
  };

  const createLabel = async (name, color) => {
    await api.post("/cards/labels", {
      workspaceId: board.workspace_id,
      name,
      color,
    });
    fetchBoardData();
  };

  const deleteLabel = async (labelId) => {
    await api.delete(`/cards/labels/${labelId}`);
    fetchBoardData();
  };

  const handleBoardDeleted = () => {
    const remainingBoards = boardsInWorkspace.filter((b) => b.id !== board.id);
    if (remainingBoards.length > 0) {
      const nextBoard = remainingBoards[0];
      const wsSlug = board.workspace_name.toLowerCase().replace(/\s+/g, "-");
      const boardSlug = nextBoard.name.toLowerCase().replace(/\s+/g, "-");
      navigate(
        `/workspace/${wsSlug}/${nextBoard.slug_id || nextBoard.id}/${boardSlug}`,
      );
      return;
    }
    navigate("/dashboard");
  };

  const onDragEnd = async (result) => {
    const userRole = board?.user_role;
    if (!canEditCards(userRole)) {
      setAlertInfo({ title: "Akses Ditolak", message: "Peran Observer hanya memiliki izin untuk melihat papan.", type: "info" });
      return;
    }

    const { source, destination } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const newBoard = { ...board };
    const sourceList = newBoard.lists.find(
      (l) => String(l.id) === source.droppableId,
    );
    const destList = newBoard.lists.find(
      (l) => String(l.id) === destination.droppableId,
    );
    if (!sourceList || !destList) return;

    const [movedCard] = sourceList.cards.splice(source.index, 1);
    destList.cards.splice(destination.index, 0, movedCard);
    setBoard(newBoard);

    try {
      const cardsToUpdate = destList.cards.map((c, i) => ({
        id: c.id,
        list_id: destList.id,
        order_index: i,
      }));
      if (sourceList.id !== destList.id) {
        sourceList.cards.forEach((c, i) =>
          cardsToUpdate.push({
            id: c.id,
            list_id: sourceList.id,
            order_index: i,
          }),
        );
      }
      await api.put("/cards/batch-update", { cards: cardsToUpdate });
      socket.emit("card-moved", { boardId });
    } catch (err) {
      fetchBoardData();
    }
  };

  const workspaceMembers = board?.members || [];

  if (error)
    return (
      <div style={{ padding: "40px", color: "white", textAlign: "center" }}>
        <h2 style={{ color: "#e74c3c" }}>{error}</h2>
        <button
          onClick={handleBack}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#0095ff",
            border: "none",
            color: "white",
            borderRadius: "8px",
          }}
        >
          Kembali ke Dashboard
        </button>
      </div>
    );

  if (!board)
    return (
      <div style={{ padding: "40px", color: "white", textAlign: "center" }}>
        <div className="loader" style={{ marginBottom: "20px" }}></div>
        <p>Memuat Workspace...</p>
      </div>
    );

  const isPrivate =
    board?.workspace_invite_code === null ||
    board?.workspace_invite_code === undefined;
  const userRole = normalizeRole(board?.user_role) || "Member";
  const canEdit = canEditCards(userRole);
  const canManageList = canManageLists(userRole);
  const canManageBrd = canManageBoard(userRole);
  const roleColor =
    userRole.toUpperCase() === "OWNER"
      ? "#f1c40f"
      : userRole.toUpperCase() === "ADMIN"
        ? "#2ecc71"
        : userRole.toUpperCase() === "OBSERVER"
          ? "#9b59b6"
          : "#3498db";

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div
            style={{
              ...styles.logoIcon,
              cursor: "pointer",
              backgroundColor: isPrivate ? "#666" : "#0095ff",
            }}
            onClick={handleBack}
          >
            {isPrivate ? (
              <Lock size={16} />
            ) : (
              <div className="logo-bars">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
          <span style={styles.logoText}>DECKO</span>
          <span style={styles.separator}>/</span>
          <span style={styles.workspaceTitle}>{board.workspace_name}</span>
          <span style={styles.separator}>/</span>
          <div style={styles.boardSelectWrapper}>
            <button
              style={styles.boardTitleBtn}
              onClick={() => setIsBoardDropdownOpen(!isBoardDropdownOpen)}
            >
              {board.name} <ChevronDown size={16} />
            </button>
            {isBoardDropdownOpen && (
              <div style={styles.dropdown}>
                {boardsInWorkspace.map((b) => (
                  <div
                    key={b.id}
                    style={styles.dropdownItem}
                    onClick={() => {
                      const wsSlug = board.workspace_name
                        .toLowerCase()
                        .replace(/\s+/g, "-");
                      const boardSlug = b.name
                        .toLowerCase()
                        .replace(/\s+/g, "-");
                      const randomId = b.slug_id || b.id;
                      navigate(`/workspace/${wsSlug}/${randomId}/${boardSlug}`);
                      setIsBoardDropdownOpen(false);
                    }}
                  >
                    {b.name}{" "}
                    {b.id === board.id && (
                      <Check size={14} style={{ marginLeft: "auto" }} />
                    )}
                  </div>
                ))}
                {canManageBrd && (
                  <>
                    <div style={styles.dropdownDivider}></div>
                    <div
                      style={{
                        ...styles.dropdownItem,
                        color: "#0095ff",
                        fontWeight: "700",
                      }}
                      onClick={() => {
                        setShowAddBoard(true);
                        setIsBoardDropdownOpen(false);
                      }}
                    >
                      + Tambah Papan
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div style={styles.headerRight}>
          {!isPrivate && (
            <MemberAvatarStack members={workspaceMembers} max={4} size={30} />
          )}
          <button
            onClick={handleBack}
            style={styles.iconBtn}
            title="Kembali ke Dashboard"
          >
            <House size={28} color="#FFFFFF" />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            style={styles.iconBtn}
          >
            <Settings size={28} color="#FFFFFF" />
          </button>
        </div>
      </header>

      {/* Modals */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          board={board}
          userRole={board.user_role}
          isPrivate={isPrivate}
          totalBoards={boardsInWorkspace.length}
          onDeleted={handleBoardDeleted}
          onClose={() => setIsSettingsOpen(false)}
          onUpdate={fetchBoardData}
        />
      )}
      {alertInfo && (
        <AlertModal
          title={alertInfo.title}
          message={alertInfo.message}
          type={alertInfo.type}
          onClose={() => setAlertInfo(null)}
        />
      )}
      {showAddList && (
        <AddListModal onClose={() => setShowAddList(false)} onAdd={addList} />
      )}
      {showAddBoard && (
        <AddBoardModal
          onClose={() => setShowAddBoard(false)}
          onAdd={addBoard}
        />
      )}
      {showAddCard && (
        <AddCardModal
          listName={board.lists.find((l) => l.id === showAddCard)?.name}
          labels={board.labels || []}
          members={board.members || []}
          isPrivate={isPrivate}
          onClose={() => setShowAddCard(null)}
          onAdd={addCard}
        />
      )}
      {showEditList && (
        <EditListModal
          list={showEditList}
          onClose={() => setShowEditList(null)}
          onUpdate={fetchBoardData}
        />
      )}
      {selectedCard && (
        <CardModal
          card={{
            ...selectedCard,
            list_name: board?.lists?.find((l) =>
              l.cards?.some((c) => c.id === selectedCard.id)
            )?.name || selectedCard.list_name
          }}
          userRole={board.user_role}
          canEditCards={canEdit}
          isPrivate={isPrivate}
          labels={board.labels || []}
          members={board.members || []}
          onClose={() => setSelectedCard(null)}
          onUpdate={fetchBoardData}
        />
      )}

      {/* Sub-header Filter Bar */}
      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="Cari kartu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">Semua Prioritas</option>
          <option value="High">Tinggi (High)</option>
          <option value="Medium">Sedang (Medium)</option>
          <option value="Low">Rendah (Low)</option>
        </select>

        <select
          value={filterLabel}
          onChange={(e) => setFilterLabel(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">Semua Label</option>
          {board?.labels?.map((lbl) => (
            <option key={lbl.id} value={String(lbl.id)}>
              {lbl.name}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="default">Urutan Standar</option>
          <option value="deadline">Tenggat Terdekat</option>
          <option value="priority">Prioritas Tertinggi</option>
        </select>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={styles.boardLayout}>
          {(!board.lists || board.lists.length === 0) && (
            <div style={styles.emptyBoardState}>
              <Layout size={36} color="#444" style={{ marginBottom: "12px" }} />
              <p style={{ color: "#888", fontSize: "14px" }}>
                Belum ada list di papan ini.
              </p>
              <p style={{ color: "#555", fontSize: "12px" }}>
                Mulai dengan mengeklik tombol tambah list di samping.
              </p>
            </div>
          )}
          {board?.lists?.map((list) => (
            <div key={list.id} style={styles.column}>
              <div style={styles.columnHeader}>
                <div style={styles.columnTitleWrap}>
                  <div
                    style={{
                      ...styles.dot,
                      backgroundColor: list.color || "#a0a0a0",
                    }}
                  ></div>
                  <h3 style={styles.columnTitle}>{list.name}</h3>
                  <span style={styles.cardCount}>
                    {list.cards?.length || 0}
                  </span>
                </div>
                {canManageList && (
                  <button
                    style={styles.moreBtn}
                    onClick={() => setShowEditList(list)}
                  >
                    <MoreHorizontal size={20} color="#a0a0a0" />
                  </button>
                )}
              </div>

              <Droppable droppableId={String(list.id)}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={styles.cardList}
                  >
                    {(!list.cards || list.cards.length === 0) && (
                      <div style={styles.emptyListPlaceholder}>
                        Belum ada kartu
                      </div>
                    )}
                    {(list.cards || [])
                      .filter((card) => {
                        const matchesSearch =
                          card.title
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                          (card.description &&
                            card.description
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase()));

                        const matchesPriority =
                          filterPriority === "all" ||
                          card.priority === filterPriority;

                        const matchesLabel =
                          filterLabel === "all" ||
                          (card.labels &&
                            card.labels.some(
                              (lbl) => String(lbl.id) === filterLabel,
                            ));

                        return matchesSearch && matchesPriority && matchesLabel;
                      })
                      .sort((a, b) => {
                        if (sortBy === "deadline") {
                          if (!a.deadline) return 1;
                          if (!b.deadline) return -1;
                          return new Date(a.deadline) - new Date(b.deadline);
                        }
                        if (sortBy === "priority") {
                          const priorityWeight = { High: 3, Medium: 2, Low: 1 };
                          const weightA = priorityWeight[a.priority] || 2;
                          const weightB = priorityWeight[b.priority] || 2;
                          return weightB - weightA;
                        }
                        return 0;
                      })
                      .map((card, index) => {
                        const isFilteredOrSorted =
                          searchQuery !== "" ||
                          filterPriority !== "all" ||
                          filterLabel !== "all" ||
                          sortBy !== "default";
                        return (
                          <Draggable
                            key={card.id}
                            draggableId={String(card.id)}
                            index={index}
                            isDragDisabled={!canEdit || isFilteredOrSorted}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...styles.card,
                                  ...provided.draggableProps.style,
                                }}
                                onClick={() => setSelectedCard(card)}
                              >
                                <div style={styles.cardTopRow}>
                                  <div
                                    style={{
                                      ...styles.label,
                                      backgroundColor: card.color || "#2ecc71",
                                    }}
                                  ></div>
                                  <span
                                    style={{
                                      ...styles.priorityPill,
                                      borderColor:
                                        card.priority === "High"
                                          ? "#e74c3c"
                                          : card.priority === "Medium"
                                            ? "#f1c40f"
                                            : "#2ecc71",
                                      color:
                                        card.priority === "High"
                                          ? "#e74c3c"
                                          : card.priority === "Medium"
                                            ? "#f1c40f"
                                            : "#2ecc71",
                                    }}
                                  >
                                    {card.priority || "Medium"}
                                  </span>
                                </div>
                                <h4 style={styles.cardText}>{card.title}</h4>
                                {(card.labels || []).length > 0 && (
                                  <div style={styles.cardLabels}>
                                    {(card.labels || [])
                                      .slice(0, 3)
                                      .map((label) => (
                                        <span
                                          key={label.id}
                                          style={{
                                            ...styles.cardLabelChip,
                                            borderColor: label.color,
                                            color: label.color,
                                          }}
                                        >
                                          {label.name}
                                        </span>
                                      ))}
                                  </div>
                                )}
                                <div style={styles.cardFooter}>
                                  <div style={styles.cardMeta}>
                                    <Calendar size={12} />{" "}
                                    <span>
                                      {card.deadline
                                        ? new Date(
                                            card.deadline,
                                          ).toLocaleDateString("id-ID", {
                                            day: "2-digit",
                                            month: "short",
                                          })
                                        : "-"}
                                    </span>
                                    <MessageSquare
                                      size={12}
                                      style={{ marginLeft: "10px" }}
                                    />{" "}
                                    <span>{card.comment_count || 0}</span>
                                  </div>
                                  {(card.assignees || []).length > 0 && (
                                    <MemberAvatarStack
                                      members={card.assignees}
                                      max={3}
                                      size={22}
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                    {provided.placeholder}
                    {canEdit && (
                      <button
                        onClick={() => setShowAddCard(list.id)}
                        style={styles.addCardBtn}
                      >
                        + Tambah kartu
                      </button>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}

          {canManageList && (
            <div style={styles.column}>
              <button
                onClick={() => setShowAddList(true)}
                style={styles.addColumnBtn}
              >
                + Tambah list
              </button>
            </div>
          )}
        </div>
      </DragDropContext>

      {!isPrivate && (
        <div
          style={{
            ...styles.roleLabel,
            color: roleColor,
            borderColor: roleColor,
          }}
        >
          {userRole?.toUpperCase()}
        </div>
      )}
    </div>
  );
};

const styles = {
  filterBar: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "12px 24px",
    backgroundColor: "#22252a",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    flexWrap: "wrap",
  },
  searchInput: {
    backgroundColor: "#1a1d21",
    border: "1px solid #333",
    color: "white",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    width: "240px",
  },
  filterSelect: {
    backgroundColor: "#1a1d21",
    border: "1px solid #333",
    color: "white",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
  },
  emptyListPlaceholder: {
    padding: "16px",
    borderRadius: "12px",
    border: "1.5px dashed rgba(255,255,255,0.06)",
    textAlign: "center",
    color: "#666",
    fontSize: "12px",
    backgroundColor: "rgba(255,255,255,0.01)",
  },
  emptyBoardState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "300px",
    padding: "40px 20px",
    backgroundColor: "#1e2227",
    borderRadius: "16px",
    border: "1.5px dashed rgba(255,255,255,0.08)",
    marginRight: "24px",
  },
  container: {
    minHeight: "100vh",
    backgroundColor: "#1a1d21",
    color: "white",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    height: "64px",
    padding: "0 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    backgroundColor: "#1a1d21",
    zIndex: 100,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  logoIcon: {
    width: "32px",
    height: "32px",
    backgroundColor: "#0095ff",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBars: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    "& span": { width: "14px", height: "2px", backgroundColor: "white" },
  },
  logoText: { fontWeight: "800", fontSize: "20px", letterSpacing: "1px" },
  separator: {
    color: "rgba(255,255,255,0.1)",
    fontSize: "24px",
    margin: "0 4px",
  },
  workspaceTitle: { fontSize: "18px", fontWeight: "400", color: "#eee" },
  boardSelectWrapper: { position: "relative" },
  boardTitleBtn: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "18px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
    outline: "none",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: "8px",
    backgroundColor: "#2c3136",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    width: "220px",
    padding: "8px",
    zIndex: 1000,
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
  },
  dropdownItem: {
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  dropdownDivider: {
    height: "1px",
    backgroundColor: "rgba(255,255,255,0.05)",
    margin: "8px 0",
  },
  headerRight: { display: "flex", alignItems: "center", gap: "20px" },
  miniAvatar: {
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    color: "white",
  },
  profileAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    color: "#009fe8",
    backgroundColor: "white",
    border: "2px solid #009fe8",
    fontSize: "12px",
  },
  memberAvatars: { display: "flex", alignItems: "center" },
  iconBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  boardLayout: {
    flex: 1,
    display: "flex",
    padding: "24px",
    gap: "24px",
    overflowX: "auto",
    alignItems: "flex-start",
  },
  column: {
    width: "300px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    maxHeight: "100%",
  },
  columnHeader: {
    padding: "12px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  columnTitleWrap: { display: "flex", alignItems: "center", gap: "10px" },
  dot: { width: "8px", height: "8px", borderRadius: "50%" },
  columnTitle: { fontSize: "16px", fontWeight: "700", color: "#eee" },
  cardCount: {
    fontSize: "12px",
    color: "#666",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: "2px 8px",
    borderRadius: "10px",
  },
  moreBtn: { background: "transparent", border: "none", padding: "4px" },
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflowY: "auto",
  },
  card: {
    backgroundColor: "#2c3136",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.05)",
    cursor: "pointer",
    transition: "transform 0.1s",
  },
  cardTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  label: {
    width: "40px",
    height: "4px",
    borderRadius: "2px",
    marginBottom: "12px",
  },
  priorityPill: {
    fontSize: "10px",
    border: "1px solid",
    padding: "2px 8px",
    borderRadius: "999px",
    fontWeight: "800",
  },
  cardText: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#eee",
    marginBottom: "16px",
    lineHeight: "1.4",
  },
  cardLabels: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "12px",
  },
  cardLabelChip: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid",
    borderRadius: "999px",
    padding: "3px 8px",
    fontSize: "10px",
    fontWeight: "700",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardMeta: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "11px",
    color: "#666",
  },
  assigneeStack: { display: "flex", alignItems: "center", gap: "4px" },
  roleBadge: {
    fontSize: "9px",
    padding: "2px 6px",
    borderRadius: "4px",
    border: "1px solid currentColor",
    fontWeight: "700",
  },
  addCardBtn: {
    width: "100%",
    minHeight: "56px",
    padding: "16px",
    backgroundColor: "rgba(255,255,255,0.02)",
    border: "2px dashed rgba(255,255,255,0.1)",
    borderRadius: "16px",
    color: "#aaa",
    fontSize: "15px",
    fontWeight: "700",
    textAlign: "center",
    transition: "all 0.2s",
    ":hover": {
      backgroundColor: "rgba(255,255,255,0.04)",
      borderColor: "#0095ff",
      color: "#0095ff",
    },
  },
  addColumnBtn: {
    width: "100%",
    padding: "16px",
    backgroundColor: "rgba(255,255,255,0.02)",
    border: "2px dashed rgba(255,255,255,0.1)",
    borderRadius: "16px",
    color: "#aaa",
    fontSize: "15px",
    fontWeight: "700",
    transition: "all 0.2s",
    ":hover": {
      backgroundColor: "rgba(255,255,255,0.04)",
      borderColor: "#0095ff",
      color: "#0095ff",
    },
  },
  roleLabel: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    padding: "8px 16px",
    borderRadius: "12px",
    border: "2px solid",
    fontWeight: "800",
    fontSize: "12px",
    backgroundColor: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(10px)",
    zIndex: 1000,
  },
};

export default BoardView;